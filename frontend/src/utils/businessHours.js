// "09:00-18:00" 형식의 영업시간 문자열을 파싱해 현재 시각 기준 영업 여부를 반환
// 반환값: true(영업중) | false(영업종료) | null(정보없음)
export function isOpenNow(businessHours) {
  if (!businessHours) return null;
  const match = businessHours.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, openH, openM, closeH, closeM] = match.map(Number);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return cur >= open && cur < close;
}
