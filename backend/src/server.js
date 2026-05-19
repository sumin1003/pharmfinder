require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

// 지정된 포트에서 Express 서버 시작
app.listen(PORT, () => {
  console.log(`PharmFinder API server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
