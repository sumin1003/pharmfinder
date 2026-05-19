const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Authorization 헤더의 Bearer 토큰을 검증하고 req.user에 페이로드를 주입
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
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
