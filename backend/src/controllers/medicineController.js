const medicineService = require('../services/medicineService');

/**
 * GET /api/medicines/search?q=검색어
 * 인증: 불필요
 * 검색어로 의약품을 조회한다. DB에 없으면 식약처 외부 API를 호출하여 결과를 반환한다.
 */
const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1)
      return res.status(400).json({ message: '검색어를 입력해주세요.' });

    const medicines = await medicineService.searchMedicines(q.trim());
    res.json(medicines);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/medicines/:id
 * 인증: 불필요
 * ID로 특정 의약품의 상세 정보를 조회한다.
 */
const getById = async (req, res, next) => {
  try {
    const medicine = await medicineService.getMedicineById(req.params.id);
    res.json(medicine);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/medicines/recommend
 * 인증: 불필요
 * 사용자가 입력한 증상을 기반으로 AI가 일반의약품 3가지를 추천한다.
 */
const recommend = async (req, res, next) => {
  try {
    const { symptom } = req.body;
    if (!symptom || symptom.trim().length < 2)
      return res.status(400).json({ message: '증상을 입력해주세요.' });

    const result = await medicineService.recommendBySymptom(symptom.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { search, getById, recommend };
