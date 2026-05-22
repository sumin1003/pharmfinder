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

// 약국 승인/거절 결과 이메일 발송 — EMAIL_USER 미설정 시 조용히 건너뜀
const sendPharmacyStatusEmail = async ({ pharmacyEmail, pharmacyName, status, rejectionReason }) => {
  if (!process.env.EMAIL_USER) {
    console.warn('[notificationService] EMAIL_USER 환경변수가 설정되지 않아 이메일 알림을 건너뜁니다.');
    return;
  }

  const transporter = createTransporter();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const isApproved = status === 'approved';
  const subject = isApproved
    ? `[PharmFinder] ${pharmacyName} 약국 등록이 승인되었습니다`
    : `[PharmFinder] ${pharmacyName} 약국 등록이 거절되었습니다`;

  const lines = isApproved
    ? [
        `안녕하세요, ${pharmacyName} 담당자님.`,
        '',
        '약국 등록 신청이 승인되었습니다.',
        '이제 PharmFinder에 로그인하여 재고 관리를 시작하실 수 있습니다.',
        '',
        `로그인: ${frontendUrl}/login`,
      ]
    : [
        `안녕하세요, ${pharmacyName} 담당자님.`,
        '',
        '아래 사유로 약국 등록 신청이 거절되었습니다.',
        '',
        `거절 사유: ${rejectionReason || '사유 없음'}`,
        '',
        '내용을 수정하여 다시 신청해 주세요.',
      ];

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: pharmacyEmail,
    subject,
    text: lines.join('\n'),
  });
};

module.exports = { sendLowStockAlert, sendPharmacyStatusEmail };
