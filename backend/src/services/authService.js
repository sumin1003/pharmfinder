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
    .select('id, email, name, role, provider, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) throw Object.assign(new Error('사용자를 찾을 수 없습니다.'), { status: 404 });
  return user;
};

// 소셜 로그인: provider + providerId로 기존 계정이면 로그인, 신규면 pendingToken 발급
const findOrCreateSocialUser = async ({ provider, providerId, email, name }) => {
  const { data: existing } = await supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .eq('provider', provider)
    .eq('provider_id', providerId)
    .single();

  if (existing) return { type: 'login', user: existing, token: generateToken(existing) };

  // 신규 사용자 — DB에 생성하지 않고 임시 토큰만 발급하여 가입 완성 페이지로 안내
  const pendingToken = jwt.sign(
    { type: 'social_pending', provider, providerId, name: name || null, email: email || null },
    process.env.JWT_SECRET,
    { expiresIn: '10m' },
  );

  return { type: 'signup', pendingToken, name, email };
};

// 소셜 신규 사용자가 이름·이메일을 확인한 뒤 계정을 생성하고 JWT를 반환
const completeSocialSignup = async ({ pendingToken, name, email }) => {
  if (!name || !email)
    throw Object.assign(new Error('이름과 이메일은 필수입니다.'), { status: 400 });

  let payload;
  try {
    payload = jwt.verify(pendingToken, process.env.JWT_SECRET);
  } catch {
    throw Object.assign(new Error('유효하지 않은 가입 요청입니다. 다시 시도해주세요.'), { status: 401 });
  }

  if (payload.type !== 'social_pending')
    throw Object.assign(new Error('유효하지 않은 가입 요청입니다. 다시 시도해주세요.'), { status: 401 });

  // 동일 provider + providerId로 이미 가입된 계정 확인
  const { data: existingSocial } = await supabase
    .from('users')
    .select('id')
    .eq('provider', payload.provider)
    .eq('provider_id', payload.providerId)
    .single();

  if (existingSocial)
    throw Object.assign(new Error('이미 가입된 소셜 계정입니다.'), { status: 409 });

  // 동일 이메일로 이미 가입된 계정 확인
  const { data: existingEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingEmail)
    throw Object.assign(new Error('이미 가입된 이메일입니다. 이메일 로그인을 이용해주세요.'), { status: 409 });

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, name, role: 'user', provider: payload.provider, provider_id: payload.providerId })
    .select('id, email, name, role, provider, created_at')
    .single();

  if (error) throw error;
  return { user, token: generateToken(user) };
};

// 이메일 가입 계정의 비밀번호를 현재 비밀번호 검증 후 변경
const changePassword = async (userId, currentPassword, newPassword) => {
  if (newPassword.length < 8)
    throw Object.assign(new Error('새 비밀번호는 8자 이상이어야 합니다.'), { status: 400 });

  const { data: user, error } = await supabase
    .from('users')
    .select('password, provider')
    .eq('id', userId)
    .single();

  if (error || !user) throw Object.assign(new Error('사용자를 찾을 수 없습니다.'), { status: 404 });

  if (user.provider !== null)
    throw Object.assign(new Error('소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.'), { status: 400 });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch)
    throw Object.assign(new Error('현재 비밀번호가 올바르지 않습니다.'), { status: 401 });

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashed })
    .eq('id', userId);

  if (updateError) throw updateError;
  return { message: '비밀번호가 변경됐습니다.' };
};

// 사용자 이름·이메일 및 약국 정보(약국 역할인 경우)를 수정
const updateProfile = async (userId, userRole, { name, email, pharmacyName, address, phone }) => {
  // 이메일 중복 체크 (자신 제외)
  if (email) {
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .single();

    if (existingEmail)
      throw Object.assign(new Error('이미 사용 중인 이메일입니다.'), { status: 409 });
  }

  // users 테이블 업데이트 (변경할 필드가 있는 경우만)
  const userUpdates = {};
  if (name) userUpdates.name = name;
  if (email) userUpdates.email = email;

  let updatedUser;
  if (Object.keys(userUpdates).length > 0) {
    const { data, error } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', userId)
      .select('id, email, name, role, provider, created_at')
      .single();

    if (error) throw error;
    updatedUser = data;
  } else {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, provider, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    updatedUser = data;
  }

  // 약국 역할이면 pharmacies 테이블도 업데이트
  if (userRole === 'pharmacy') {
    const pharmUpdates = {};
    if (pharmacyName) pharmUpdates.name = pharmacyName;
    if (address) {
      pharmUpdates.address = address;
      const coords = await geocodeAddress(address);
      Object.assign(pharmUpdates, coords);
    }
    if (phone) pharmUpdates.phone = phone;

    if (Object.keys(pharmUpdates).length > 0) {
      const { error: pharmError } = await supabase
        .from('pharmacies')
        .update(pharmUpdates)
        .eq('user_id', userId);

      if (pharmError) throw pharmError;
    }
  }

  // 이메일이 변경된 경우 새 JWT 발급
  const token = email ? generateToken(updatedUser) : null;
  return { user: updatedUser, token };
};

module.exports = { registerUser, registerPharmacy, login, getMe, findOrCreateSocialUser, completeSocialSignup, changePassword, updateProfile };
