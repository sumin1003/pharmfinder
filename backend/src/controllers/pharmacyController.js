const pharmacyService = require('../services/pharmacyService');

/**
 * GET /api/pharmacies/nearby?lat=&lng=&radius=&medicineId=
 * 인증: 불필요
 * 현재 위치 기준 반경 내 약국 목록을 거리순으로 반환한다. medicineId 지정 시 해당 약품 재고 보유 약국만 필터링한다.
 */
const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius, medicineId } = req.query;
    if (!lat || !lng)
      return res.status(400).json({ message: '위치 정보(lat, lng)가 필요합니다.' });

    const pharmacies = await pharmacyService.getNearbyPharmacies({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: radius ? parseFloat(radius) : 2,
      medicineId: medicineId ? parseInt(medicineId) : null,
    });
    res.json(pharmacies);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pharmacies/:id
 * 인증: 불필요
 * ID로 특정 승인된 약국의 상세 정보를 조회한다.
 */
const getById = async (req, res, next) => {
  try {
    const pharmacy = await pharmacyService.getPharmacyById(req.params.id);
    res.json(pharmacy);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pharmacies/:id/inventory
 * 인증: 불필요
 * 특정 약국의 재고 목록을 의약품 정보와 함께 조회한다.
 */
const getInventory = async (req, res, next) => {
  try {
    const inventory = await pharmacyService.getInventory(req.params.id);
    res.json(inventory);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pharmacies/my/info
 * 인증: authenticate, authorize('pharmacy')
 * 로그인한 약국 사용자 본인의 약국 정보를 조회한다.
 */
const getMyPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await pharmacyService.getMyPharmacy(req.user.id);
    res.json(pharmacy);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/pharmacies/my/info
 * 인증: authenticate, authorize('pharmacy'), requireApprovedPharmacy
 * 로그인한 약국 사용자 본인의 약국 정보를 수정한다.
 */
const updateMyPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await pharmacyService.updateMyPharmacy(req.user.id, req.body);
    res.json(pharmacy);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pharmacies/inventory
 * 인증: authenticate, authorize('pharmacy'), requireApprovedPharmacy
 * 본인 약국의 재고에 의약품을 추가하거나 기존 항목을 업데이트한다.
 */
const addInventory = async (req, res, next) => {
  try {
    const { medicineId, quantity, minQuantity } = req.body;
    if (!medicineId || quantity === undefined)
      return res.status(400).json({ message: 'medicineId와 quantity는 필수입니다.' });

    const result = await pharmacyService.addInventory(req.pharmacy.id, { medicineId, quantity, minQuantity });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/pharmacies/inventory/:id
 * 인증: authenticate, authorize('pharmacy'), requireApprovedPharmacy
 * 본인 약국의 특정 재고 항목(수량·최소수량)을 수정한다.
 */
const updateInventory = async (req, res, next) => {
  try {
    const result = await pharmacyService.updateInventory(req.params.id, req.pharmacy.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/pharmacies/inventory/:id
 * 인증: authenticate, authorize('pharmacy'), requireApprovedPharmacy
 * 본인 약국의 특정 재고 항목을 삭제한다.
 */
const deleteInventory = async (req, res, next) => {
  try {
    await pharmacyService.deleteInventory(req.params.id, req.pharmacy.id);
    res.json({ message: '재고가 삭제됐습니다.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pharmacies/:id/favorite
 * 인증: authenticate
 * 특정 약국을 즐겨찾기에 추가하거나 이미 등록된 경우 해제한다.
 */
const toggleFavorite = async (req, res, next) => {
  try {
    const result = await pharmacyService.toggleFavorite(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pharmacies/my/favorites
 * 인증: authenticate
 * 로그인한 사용자의 즐겨찾기 약국 목록을 조회한다.
 */
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await pharmacyService.getFavorites(req.user.id);
    res.json(favorites);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNearby, getById, getInventory,
  getMyPharmacy, updateMyPharmacy,
  addInventory, updateInventory, deleteInventory,
  toggleFavorite, getFavorites,
};
