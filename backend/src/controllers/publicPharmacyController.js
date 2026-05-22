const publicPharmacyService = require('../services/publicPharmacyService');

/**
 * GET /api/pharmacies/public/nearby?lat=&lng=&radius=&medicineId=
 * 인증: 불필요
 * 공공데이터 기반 근처 약국 목록을 반환한다. is_registered·has_inventory 플래그를 포함한다.
 */
const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius, medicineId } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: '위치 정보(lat, lng)가 필요합니다.' });

    const pharmacies = await publicPharmacyService.getNearbyPublicPharmacies({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: radius ? parseFloat(radius) : 3,
      medicineId: medicineId || null,
    });
    res.json(pharmacies);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pharmacies/public/:id
 * 인증: 불필요
 * 공공데이터 약국 단건 상세를 조회한다. 가입 약국과 연결된 경우 재고 목록도 포함한다.
 */
const getById = async (req, res, next) => {
  try {
    const pharmacy = await publicPharmacyService.getPublicPharmacyById(req.params.id);
    res.json(pharmacy);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pharmacies/public/search?q=
 * 인증: 불필요
 * 약국 이름으로 공공데이터 약국을 검색한다 (가입 시 연결 선택 용도).
 */
const search = async (req, res, next) => {
  try {
    const results = await publicPharmacyService.searchPublicPharmacies(req.query.q);
    res.json(results);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pharmacies/public/sync
 * 인증: 필요 (admin)
 * 건강보험심사평가원 API에서 지역별 약국을 동기화한다.
 */
const sync = async (req, res, next) => {
  try {
    const { siNm, sigunguNm } = req.body;
    if (!siNm) return res.status(400).json({ message: '시도명(siNm)이 필요합니다.' });

    const result = await publicPharmacyService.syncFromPublicApi({ siNm, sigunguNm });
    res.json({ message: `${result.synced}개 약국이 동기화됐습니다.`, synced: result.synced });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/pharmacies/public/self/link
 * 인증: 필요 (pharmacy, approved)
 * 약국 사업자가 자신의 약국을 공공데이터 약국과 연결한다.
 */
const linkSelf = async (req, res, next) => {
  try {
    const { publicPharmacyId } = req.body;
    if (!publicPharmacyId) return res.status(400).json({ message: 'publicPharmacyId가 필요합니다.' });

    await publicPharmacyService.linkSelf(req.user.id, publicPharmacyId);
    res.json({ message: '약국이 공공데이터와 연결됐습니다.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/pharmacies/public/:id/link
 * 인증: 필요 (admin)
 * 관리자가 공공데이터 약국과 가입 약국을 수동으로 연결한다.
 */
const link = async (req, res, next) => {
  try {
    const { registeredPharmacyId } = req.body;
    if (!registeredPharmacyId) return res.status(400).json({ message: 'registeredPharmacyId가 필요합니다.' });

    const result = await publicPharmacyService.linkPharmacy(req.params.id, registeredPharmacyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/pharmacies/public/:id/link
 * 인증: 필요 (admin)
 * 관리자가 공공데이터 약국의 가입 약국 연결을 해제한다.
 */
const unlink = async (req, res, next) => {
  try {
    await publicPharmacyService.unlinkPharmacy(req.params.id);
    res.json({ message: '연결이 해제됐습니다.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNearby, getById, search, sync, linkSelf, link, unlink };
