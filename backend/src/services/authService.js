const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { geocodeAddress } = require('./pharmacyService');

const SALT_ROUNDS = 10;

// 사용자 객체로 JWT 토큰을 생성하여 반환
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// 일반 사용자(role: user) 회원가입 후 사용자 정보와 JWT 반환
const registerUser = async ({ email, password, name }) => {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) throw Object.assign(new Error('이미 사용 중인 이메일입니다.'), { status: 409 });

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password: hashed, name, role: 'user' })
    .select('id, email, name, role, created_at')
    .single();

  if (error) throw error;
  return { user, token: generateToken(user) };
};

// 약국 사용자(role: pharmacy) 회원가입 후 users·pharmacies 테이블에 동시 저장
const registerPharmacy = async ({ email, password, name, pharmacyName, address, phone }) => {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) throw Object.assign(new Error('이미 사용 중인 이메일입니다.'), { status: 409 });

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({ email, password: hashed, name, role: 'pharmacy' })
    .select('id, email, name, role')
    .single();

  if (userError) throw userError;

  const coords = await geocodeAddress(address);

  const { error: pharmError } = await supabase
    .from('pharmacies')
    .insert({ user_id: user.id, name: pharmacyName, address, phone, status: 'pending', ...coords });

  if (pharmError) throw pharmError;

  return { user, message: '약국 회원가입이 완료됐습니다. 관리자 승인 후 이용 가능합니다.' };
};

// 이메일·비밀번호로 사용자 인증 후 JWT 반환 (약국 계정은 승인 상태도 검증)
const login = async ({ email, password }) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, password, created_at')
    .eq('email', email)
    .single();

  if (error || !user) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { status: 401 });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { status: 401 });

  // 약국 계정이면 승인 여부 확인
  if (user.role === 'pharmacy') {
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (pharmacy?.status === 'pending')
      throw Object.assign(new Error('관리자 승인 대기 중입니다.'), { status: 403 });

    if (pharmacy?.status === 'rejected')
      throw Object.assign(new Error('가입이 거절된 계정입니다. 관리자에게 문의하세요.'), { status: 403 });
  }

  const { password: _, ...safeUser } = user;
  return { user: safeUser, token: generateToken(safeUser) };
};

// userId로 현재 로그인한 사용자 정보를 조회 (비밀번호 제외)
const getMe = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) throw Object.assign(new Error('사용자를 찾을 수 없습니다.'), { status: 404 });
  return user;
};

// 소셜 로그인: provider + providerId로 기존 계정 조회 또는 신규 생성
const findOrCreateSocialUser = async ({ provider, providerId, email, name }) => {
  const { data: existing } = await supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .eq('provider', provider)
    .eq('provider_id', providerId)
    .single();

  if (existing) return { user: existing, token: generateToken(existing) };

  // 동일 이메일로 이메일 가입 계정이 이미 있으면 병합 없이 차단
  if (email) {
    const { data: localUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('provider', 'local')
      .single();

    if (localUser)
      throw Object.assign(
        new Error('이미 이메일로 가입된 계정입니다. 이메일 로그인을 이용해주세요.'),
        { status: 409 },
      );
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, name, role: 'user', provider, provider_id: providerId })
    .select('id, email, name, role, created_at')
    .single();

  if (error) throw error;
  return { user, token: generateToken(user) };
};

module.exports = { registerUser, registerPharmacy, login, getMe, findOrCreateSocialUser };
