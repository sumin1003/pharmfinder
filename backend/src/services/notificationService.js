const nodemailer = require('nodemailer');

// Gmail SMTP 트랜스포터 생성 (EMAIL_USER 환경변수 기반)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// 재고 부족 알림 이메일 발송 — EMAIL_USER 미설정 시 경고만 출력하고 종료
const sendLowStockAlert = async ({ pharmacyEmail, pharmacyName, medicineName, quantity, minQuantity }) => {
  if (!process.env.EMAIL_USER) {
    console.warn('[notificationService] EMAIL_USER 환경변수가 설정되지 않아 이메일 알림을 건너뜁니다.');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: pharmacyEmail,
    subject: `[PharmFinder] ${pharmacyName} 재고 부족 알림`,
    text: [
      `약국명: ${pharmacyName}`,
      `약품명: ${medicineName}`,
      `현재 수량: ${quantity}`,
      `최소 수량: ${minQuantity}`,
      '',
      '재고가 최소 수량 이하로 떨어졌습니다. 재고를 보충해 주세요.',
    ].join('\n'),
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendLowStockAlert };
