require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || '관리자';

  if (!email || !password) {
    console.error('사용법: node createAdmin.js <email> <password> [name]');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('users')
      .update({ password: hashed, role: 'admin', name })
      .eq('email', email);

    if (error) { console.error('업데이트 실패:', error.message); process.exit(1); }
    console.log(`✅ 기존 계정을 관리자로 업데이트했습니다: ${email}`);
  } else {
    const { error } = await supabase
      .from('users')
      .insert({ email, password: hashed, name, role: 'admin' });

    if (error) { console.error('생성 실패:', error.message); process.exit(1); }
    console.log(`✅ 관리자 계정 생성 완료`);
  }

  console.log(`📧 이메일: ${email}`);
  console.log(`🔑 비밀번호: ${password}`);
}

main().catch(console.error);
