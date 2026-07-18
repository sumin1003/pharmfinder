// 상태 변경 요청(POST/PUT/DELETE/PATCH)에 X-Requested-With 헤더 존재를 요구해 단순 폼 기반 CSRF를 차단
const verifyCustomHeader = (req, res, next) => {
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  if (isStateChanging && req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(403).json({ message: 'CSRF 검증에 실패했습니다.' });
  }
  next();
};

module.exports = { verifyCustomHeader };
