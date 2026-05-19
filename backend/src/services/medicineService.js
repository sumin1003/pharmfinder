const axios = require('axios');
const Groq = require('groq-sdk');
const supabase = require('../config/supabase');

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
  if (!process.env.MFDS_API_KEY || !process.env.MFDS_API_URL) throw Object.assign(new Error('식약처 API 설정이 누락되었습니다.'), { status: 503 });

  const response = await axios.get(process.env.MFDS_API_URL, {
    params: {
      serviceKey: process.env.MFDS_API_KEY,
      itemName: query,
      numOfRows: 20,
      pageNo: 1,
      type: 'json',
    },
  });

  const items = response.data?.body?.items;
  if (!items || items.length === 0) return [];

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

// Groq LLM을 이용해 증상에 맞는 일반의약품 3가지를 JSON으로 추천
const recommendBySymptom = async (symptom) => {
  if (!process.env.GROQ_API_KEY) throw Object.assign(new Error('AI 추천 서비스가 준비되지 않았습니다.'), { status: 503 });

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `당신은 약학 전문가입니다. 사용자의 증상을 듣고 적합한 한국 일반의약품을 JSON 형식으로만 추천합니다.

증상별 약물 카테고리 기준:
- 재채기·콧물·코막힘·알레르기 → 항히스타민제 (세티리진, 로라타딘, 클로르페니라민 등)
- 기침·가래 → 진해거담제 (덱스트로메토르판, 암브록솔 등)
- 두통·발열·근육통 → 해열진통제 (아세트아미노펜, 이부프로펜 등)
- 소화불량·속쓰림·메스꺼움 → 소화제·제산제 (돔페리돈, 시메티딘 등)
- 설사 → 지사제 (로페라미드 등)
- 눈 가려움·충혈 → 안약 항히스타민제

규칙:
1. 증상에 맞는 카테고리의 약만 추천하세요.
2. 증상과 무관한 질환을 원인으로 단정하지 마세요.
3. 처방전이 필요한 전문의약품은 제외하세요.
4. 반드시 JSON 형식으로만 답하세요.`,
      },
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
    max_tokens: 1024,
  });

  // LLM 응답에서 JSON 블록만 추출하여 파싱
  const text = completion.choices[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패');
  return JSON.parse(jsonMatch[0]);
};

module.exports = { searchMedicines, getMedicineById, recommendBySymptom };
