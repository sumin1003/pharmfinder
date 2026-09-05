const axios = require('axios');
const Groq = require('groq-sdk');
const supabase = require('../config/supabase');

const MFDS_URL = 'https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList';

// DB 우선 검색 후 결과가 없으면 식약처 외부 API를 호출하여 의약품 목록 반환
const searchMedicines = async (query) => {
  // DB 먼저 검색
  const { data: dbResults } = await supabase
    .from('medicines')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(20);

  if (dbResults && dbResults.length > 0) return dbResults;

  // DB에 없으면 식약처 API 호출
  if (!process.env.MFDS_API_KEY) throw Object.assign(new Error('식약처 API 설정이 누락되었습니다.'), { status: 503 });

  // URLSearchParams 사용: serviceKey를 항상 encodeURIComponent로 처리 (디코딩된 키 기준)
  const params = new URLSearchParams({
    serviceKey: process.env.MFDS_API_KEY,
    itemName: query,
    numOfRows: '20',
    pageNo: '1',
    type: 'json',
  });
  const response = await axios.get(`${MFDS_URL}?${params.toString()}`);

  console.log('[MFDS] 검색어:', query);
  console.log('[MFDS] 응답 원문:', JSON.stringify(response.data).slice(0, 400));

  // XML 오류 응답 감지 (인증키 문제 시 JSON 대신 XML 반환)
  if (typeof response.data === 'string') {
    console.error('[MFDS] XML 응답 수신 — 서비스키 오류 또는 미등록 서비스');
    throw Object.assign(new Error('식약처 API 인증 실패. 서비스키를 확인하세요.'), { status: 502 });
  }

  // 공공 API는 응답 루트가 response 래퍼 있는 경우와 없는 경우 혼재
  const header = response.data?.response?.header ?? response.data?.header;
  const body = response.data?.response?.body ?? response.data?.body;

  if (header?.resultCode && header.resultCode !== '00') {
    console.error('[MFDS] API 오류:', header.resultCode, header.resultMsg);
    throw Object.assign(new Error(`식약처 API 오류: ${header.resultMsg || header.resultCode}`), { status: 502 });
  }

  const rawItems = body?.items;
  // 결과 없을 때 items가 빈 문자열로 오는 경우 처리
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (items.length === 0) return [];

  // 식약처 응답 필드를 내부 스키마로 변환
  const medicines = items.map((item) => ({
    item_seq:     item.itemSeq,
    name:         item.itemName,
    category:     item.className,
    efficacy:     item.efcyQesitm,
    usage:        item.useMethodQesitm,
    precautions:  item.atpnQesitm,
    side_effects: item.seQesitm,
  }));

  // 외부 API 결과를 DB에 캐싱 (item_seq 기준 upsert)
  const { data: saved } = await supabase
    .from('medicines')
    .upsert(medicines, { onConflict: 'item_seq' })
    .select();

  return saved || medicines;
};

// id로 특정 의약품 상세 정보를 조회
const getMedicineById = async (id) => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw Object.assign(new Error('약품 정보를 찾을 수 없습니다.'), { status: 404 });
  return data;
};

// 증상 키워드로 DB에서 관련 약품을 최대 30개 조회 (RAG 컨텍스트용)
const fetchContextMedicines = async (symptom) => {
  const { data } = await supabase
    .from('medicines')
    .select('id, name, category, efficacy')
    .or(`name.ilike.%${symptom}%,efficacy.ilike.%${symptom}%,category.ilike.%${symptom}%`)
    .limit(30);
  return data || [];
};

// 추천 약품명을 DB에서 조회하여 db_id를 부착 (exact match → ilike fallback)
const attachDbIds = async (medicines) => {
  for (const med of medicines) {
    const { data: exact } = await supabase
      .from('medicines').select('id').eq('name', med.name).maybeSingle();
    if (exact) { med.db_id = exact.id; continue; }

    const { data: fuzzy } = await supabase
      .from('medicines').select('id').ilike('name', `%${med.name}%`).limit(1);
    med.db_id = fuzzy?.[0]?.id ?? null;
  }
};

// Groq LLM을 이용해 증상에 맞는 일반의약품 3가지를 JSON으로 추천
// DB에 관련 약품이 있으면 컨텍스트로 주입하여 실제 등록 약품 우선 추천
const recommendBySymptom = async (symptom) => {
  if (!process.env.GROQ_API_KEY) throw Object.assign(new Error('AI 추천 서비스가 준비되지 않았습니다.'), { status: 503 });

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const contextMedicines = await fetchContextMedicines(symptom);

  const contextBlock = contextMedicines.length > 0
    ? `\nPharmFinder에 등록된 관련 의약품 목록 (이 중에서 우선 추천하세요):\n${
        contextMedicines.map((m) => `- ${m.name}${m.category ? ` (${m.category})` : ''}${m.efficacy ? `: ${m.efficacy.slice(0, 60)}` : ''}`).join('\n')
      }\n`
    : '';

  const systemPrompt = `당신은 약학 전문가입니다. 사용자의 증상을 듣고 적합한 한국 일반의약품을 JSON 형식으로만 추천합니다.
${contextBlock}
규칙:
1. 위 목록에 적합한 약이 있으면 목록에서 우선 추천하세요.
2. 목록에 없거나 부족하면 일반적인 일반의약품으로 보완해도 됩니다.
3. 증상과 무관한 질환을 원인으로 단정하지 마세요.
4. 처방전이 필요한 전문의약품은 제외하세요.
5. 반드시 JSON 형식으로만 답하세요.
6. 약품명은 반드시 식품의약품안전처 등재 한국어 일반명(INN)을 사용하세요.
   올바른 예: 이부프로펜, 아세트아미노펜, 세티리진염산염, 로라타딘, 덱스트로메토르판
   잘못된 예: 이브프로펜(→이부프로펜), 지르텍(→세티리진), 타이레놀(→아세트아미노펜)`;

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `다음 증상에 적합한 일반의약품을 추천해주세요. 반드시 JSON 형식으로만 답하세요.

증상: ${symptom}

응답 형식:
{
  "summary": "증상 요약 (1~2문장)",
  "medicines": [
    {
      "name": "약품명",
      "reason": "이 약을 추천하는 이유",
      "usage": "복용 방법 (용량, 횟수)",
      "caution": "복용 시 주의사항",
      "side_effects": "주요 부작용 (2~3가지)"
    }
  ],
  "advice": "추가 조언 (1~2문장)"
}

일반의약품 3가지만 추천하세요. 처방전 필요 약은 제외하세요.`,
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
    reasoning_effort: 'low',
  });

  const text = completion.choices[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패');
  let result;
  try {
    result = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('AI 응답 파싱 실패');
  }

  // 추천 결과에 DB id 부착 (실패해도 에러 전파 안 함)
  if (result.medicines?.length) {
    await attachDbIds(result.medicines).catch(() => {});
  }

  return result;
};

module.exports = { searchMedicines, getMedicineById, recommendBySymptom };
