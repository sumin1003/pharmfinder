import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// 약국 대시보드 — 자신의 약국 정보와 재고를 관리(등록·수량 수정·삭제)하는 약국 전용 페이지
export default function PharmacyDashboard() {
  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addForm, setAddForm] = useState({ medicineId: '', medicineName: '', quantity: '', minQuantity: 10 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '', business_hours: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  // 공공데이터 연결
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMsg, setLinkMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/pharmacies/my/info'),
    ])
      .then(([pharmRes]) => {
        setPharmacy(pharmRes.data);
        return api.get(`/pharmacies/${pharmRes.data.id}/inventory`);
      })
      .then((invRes) => setInventory(invRes.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [navigate]);

  // 약품 검색 폼 제출 처리 — 입력한 약품명으로 검색 API를 호출해 선택 목록을 갱신
  const handleMedicineSearch = async (e) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    try {
      const res = await api.get(`/medicines/search?q=${encodeURIComponent(searchQ)}`);
      setSearchResults(res.data);
    } catch { /* 약품 검색 오류 무시 */ }
  };

  // 재고 등록 폼 제출 처리 — 선택한 약품과 수량을 서버에 등록한 뒤 재고 목록을 갱신
  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pharmacies/inventory', {
        medicineId: addForm.medicineId,
        quantity: parseInt(addForm.quantity),
        minQuantity: parseInt(addForm.minQuantity),
      });
      setAddForm({ medicineId: '', medicineName: '', quantity: '', minQuantity: 10 });
      setSearchResults([]);
      setSearchQ('');
      const pharmRes = await api.get('/pharmacies/my/info');
      const invRes = await api.get(`/pharmacies/${pharmRes.data.id}/inventory`);
      setInventory(invRes.data);
    } catch (err) {
      alert(err.response?.data?.message || '재고 등록 실패');
    }
  };

  // 재고 수량 수정 처리 — 입력 필드 포커스 아웃 시 변경된 수량을 서버에 반영하고 로컬 상태 동기화
  const handleUpdateQuantity = async (inventoryId, quantity) => {
    try {
      await api.put(`/pharmacies/inventory/${inventoryId}`, { quantity: parseInt(quantity) });
      setInventory((prev) => prev.map((i) => i.id === inventoryId ? { ...i, quantity: parseInt(quantity) } : i));
    } catch { /* 수량 업데이트 오류 무시 */ }
  };

  // 재고 항목 삭제 처리 — 확인 대화상자 후 해당 재고를 서버에서 삭제하고 목록에서 제거
  const handleDelete = async (inventoryId) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await api.delete(`/pharmacies/inventory/${inventoryId}`);
      setInventory((prev) => prev.filter((i) => i.id !== inventoryId));
    } catch { /* 삭제 오류 무시 */ }
  };

  // 약국 정보 수정 폼 열기 — 현재 값으로 초기화
  const startEdit = () => {
    setEditForm({
      name: pharmacy?.name || '',
      address: pharmacy?.address || '',
      phone: pharmacy?.phone || '',
      business_hours: pharmacy?.business_hours || '',
    });
    setSaveError('');
    setEditing(true);
  };

  // 공공데이터 약국 검색 (이름으로)
  const handleLinkSearch = async (e) => {
    e.preventDefault();
    if (!linkSearch.trim()) return;
    setLinkLoading(true);
    setLinkResults([]);
    setLinkMsg('');
    try {
      const res = await api.get('/pharmacies/public/search', { params: { q: linkSearch } });
      setLinkResults(res.data);
      if (res.data.length === 0) setLinkMsg('검색 결과가 없습니다. 다른 약국명으로 시도해보세요.');
    } catch {
      setLinkMsg('검색에 실패했습니다.');
    } finally {
      setLinkLoading(false);
    }
  };

  // 공공데이터 약국과 내 약국 연결 확정
  const handleLinkConfirm = async (publicPharmacyId, publicName) => {
    if (!window.confirm(`'${publicName}'과(와) 연결하시겠습니까?`)) return;
    try {
      await api.put('/pharmacies/public/self/link', { publicPharmacyId });
      setLinkMsg(`'${publicName}'과(와) 연결됐습니다. 지도에서 재고 관리 약국으로 표시됩니다.`);
      setLinkResults([]);
      setLinkSearch('');
    } catch (err) {
      setLinkMsg(err.response?.data?.message || '연결에 실패했습니다.');
    }
  };

  // 약국 정보 저장 — PUT /pharmacies/my/info 호출 후 로컬 상태 갱신
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await api.put('/pharmacies/my/info', editForm);
      setPharmacy((prev) => ({ ...prev, ...data }));
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' }}>
      로딩 중...
    </div>
  );

  const lowStock = inventory.filter((i) => i.quantity <= i.min_quantity);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto', padding: '40px 16px' }}>
      {/* 약국 정보 헤더 */}
      {editing ? (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px', marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>약국 정보 수정</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'name', label: '약국명', span: false },
              { key: 'phone', label: '전화번호', span: false },
              { key: 'address', label: '주소 (변경 시 지도 좌표 재계산)', span: true },
              { key: 'business_hours', label: '영업시간', span: true },
            ].map(({ key, label, span }) => (
              <div key={key} style={span ? { gridColumn: '1 / -1' } : {}}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  value={editForm[key]}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}
          </div>
          {saveError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{saveError}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setEditing(false)} style={{ padding: '9px 18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>
              취소
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 18px', background: saving ? '#6ee7b7' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{pharmacy?.name}</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: pharmacy?.phone ? 4 : 0 }}>{pharmacy?.address}</p>
            {pharmacy?.phone && <p style={{ fontSize: 14, color: '#94a3b8' }}>{pharmacy.phone}</p>}
            {pharmacy?.business_hours && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>영업시간: {pharmacy.business_hours}</p>}
          </div>
          <button onClick={startEdit} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            정보 수정
          </button>
        </div>
      )}

      {/* 재고 부족 알림 */}
      {lowStock.length > 0 && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: 12,
          padding: '16px',
          marginBottom: 24,
          fontSize: 14,
          color: '#dc2626',
        }}>
          ⚠️ 재고 부족 ({lowStock.length}종): {lowStock.map((i) => i.medicines?.name).join(', ')}
        </div>
      )}

      {/* 재고 등록 카드 */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '24px',
        marginBottom: 32,
      }}>
        <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>재고 등록</h2>

        {/* 약품 검색 폼 */}
        <form onSubmit={handleMedicineSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="약품명 검색"
            style={{
              flex: 1,
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              padding: '13px 16px',
              fontSize: 14,
              background: '#f8fafc',
              color: '#0f172a',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '13px 16px',
              background: '#f1f5f9',
              color: '#334155',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            검색
          </button>
        </form>

        {/* 약품 검색 드롭다운 */}
        {searchResults.length > 0 && (
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            marginBottom: 16,
            maxHeight: 192,
            overflowY: 'auto',
          }}>
            {searchResults.map((med, idx) => (
              <button
                key={med.id}
                onClick={() => {
                  setAddForm((f) => ({ ...f, medicineId: med.id, medicineName: med.name }));
                  setSearchResults([]);
                  setSearchQ(med.name);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: '#334155',
                  background: 'none',
                  border: 'none',
                  borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer',
                }}
              >
                {med.name}{' '}
                {med.category && <span style={{ fontSize: 12, color: '#94a3b8' }}>({med.category})</span>}
              </button>
            ))}
          </div>
        )}

        {/* 재고 등록 폼 */}
        {addForm.medicineId && (
          <form onSubmit={handleAddInventory} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>선택된 약품</label>
              <div style={{
                padding: '12px 16px',
                background: '#dcfce7',
                borderRadius: 12,
                fontSize: 14,
                color: '#16a34a',
                fontWeight: 500,
              }}>
                {addForm.medicineName}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>수량</label>
              <input
                type="number"
                min="0"
                required
                value={addForm.quantity}
                onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                placeholder="수량"
                style={{
                  width: 96,
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '12px 12px',
                  fontSize: 14,
                  background: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              }}
            >
              등록
            </button>
          </form>
        )}
      </div>

      {/* 재고 목록 */}
      <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
        재고 현황{' '}
        <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 400 }}>{inventory.length}종</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {inventory.map((item) => (
          <div key={item.id} style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, color: '#0f172a' }}>{item.medicines?.name}</p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>최소 재고: {item.min_quantity}개</p>
            </div>
            <input
              type="number"
              min="0"
              defaultValue={item.quantity}
              onBlur={(e) => {
                if (parseInt(e.target.value) !== item.quantity)
                  handleUpdateQuantity(item.id, e.target.value);
              }}
              style={{
                width: 80,
                border: `1.5px solid ${item.quantity <= item.min_quantity ? '#fca5a5' : '#e2e8f0'}`,
                borderRadius: 12,
                padding: '6px 8px',
                fontSize: 14,
                textAlign: 'center',
                color: item.quantity <= item.min_quantity ? '#ef4444' : '#0f172a',
                background: '#f8fafc',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: 14, color: '#94a3b8' }}>개</span>
            <button
              onClick={() => handleDelete(item.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                fontSize: 14,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              삭제
            </button>
          </div>
        ))}
        {inventory.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>
            등록된 재고가 없습니다.
          </p>
        )}
      </div>

      {/* 공공데이터 약국 연결 */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px', marginTop: 32 }}>
        <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>지도 연결 설정</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          공공데이터 약국 목록에서 내 약국을 찾아 연결하면 지도에서 &apos;재고 관리 중&apos; 약국으로 표시됩니다.
        </p>
        <form onSubmit={handleLinkSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={linkSearch}
            onChange={(e) => setLinkSearch(e.target.value)}
            placeholder="약국 이름으로 검색"
            style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', fontSize: 14, background: '#f8fafc', color: '#0f172a', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={linkLoading}
            style={{ padding: '10px 16px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}
          >
            {linkLoading ? '검색 중...' : '검색'}
          </button>
        </form>

        {linkMsg && (
          <p style={{ fontSize: 13, color: linkMsg.includes('연결됐습니다') ? '#16a34a' : '#dc2626', marginBottom: 12 }}>
            {linkMsg}
          </p>
        )}

        {linkResults.length > 0 && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            {linkResults.map((r, idx) => (
              <div
                key={r.id}
                style={{ padding: '12px 16px', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{r.name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{r.address}</p>
                  {r.linked_pharmacy_id && (
                    <p style={{ fontSize: 11, color: '#f59e0b' }}>이미 연결된 약국</p>
                  )}
                </div>
                {!r.linked_pharmacy_id && (
                  <button
                    onClick={() => handleLinkConfirm(r.id, r.name)}
                    style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}
                  >
                    연결
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
