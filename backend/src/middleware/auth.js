const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { COOKIE_NAME } = require('../config/cookie');

// httpOnly 쿠키의 JWT를 검증하고 req.user에 페이로드를 주입
const authenticate = (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

// 허용된 역할 목록에 포함된 사용자만 통과시키는 역할 기반 접근 제어 미들웨어 생성기
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: '접근 권한이 없습니다.' });
  }
  next();
};

// 승인된 약국 계정만 통과, req.pharmacy에 약국 정보 주입
const requireApprovedPharmacy = async (req, res, next) => {
  try {
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('id, status')
      .eq('user_id', req.user.id)
      .single();

    if (!pharmacy || pharmacy.status !== 'approved')
      return res.status(403).json({ message: '승인된 약국 계정만 접근 가능합니다.' });

    req.pharmacy = pharmacy;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, authorize, requireApprovedPharmacy };
