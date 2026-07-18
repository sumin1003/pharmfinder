import { useState, useEffect } from 'react';
import api from '../../services/api';

const s = {
  page: { maxWidth: 1000, margin: '0 auto', padding: '40px 24px', background: '#f8fafc', minHeight: '100vh' },
  heading: { fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 32 },
  tabBar: { display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' },
  tabActive: {
    padding: '8px 16px', fontSize: 14, fontWeight: 500,
    borderBottom: '2px solid #059669', color: '#059669',
    background: 'none', border: 'none', cursor: 'pointer',
  },
  tabInactive: {
    padding: '8px 16px', fontSize: 14, fontWeight: 500,
    borderBottom: '2px solid transparent', color: '#64748b',
    background: 'none', border: 'none', cursor: 'pointer',
  },
  loadingText: { textAlign: 'center', color: '#94a3b8', padding: '32px 0' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: '32px 0' },
  cardList: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'white', borderRadius: 20, border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px 24px',
  },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pharmacyName: { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 },
  pharmacyAddress: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  pharmacyPhone: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  pharmacyManager: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  btnGroup: { display: 'flex', gap: 8 },
  btnApprove: {
    padding: '8px 16px', background: '#10b981', color: 'white',
    fontSize: 13, borderRadius: 12, border: 'none', cursor: 'pointer',
  },
  btnReject: {
    padding: '8px 16px', background: '#fee2e2', color: '#dc2626',
    fontSize: 13, borderRadius: 12, border: 'none', cursor: 'pointer',
  },
  btnEdit: {
    padding: '6px 14px', background: '#f1f5f9', color: '#334155',
    fontSize: 13, borderRadius: 10, border: 'none', cursor: 'pointer',
  },
  btnDanger: {
    padding: '6px 14px', background: '#fee2e2', color: '#dc2626',
    fontSize: 13, borderRadius: 10, border: 'none', cursor: 'pointer',
  },
  btnPrimary: {
    padding: '8px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
    fontSize: 13, borderRadius: 12, border: 'none', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
  },
  btnSecondary: {
    padding: '8px 20px', background: '#f1f5f9', color: '#64748b',
    fontSize: 13, borderRadius: 12, border: 'none', cursor: 'pointer',
  },
  tableWrapper: {
    background: 'white', borderRadius: 20, border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden',
  },
  table: { width: '100%', fontSize: 14, borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500 },
  td: { padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: '#64748b' },
  tdName: { padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: '#0f172a' },
  tdDate: { padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: '#94a3b8' },
  badgeAdmin: { padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#ede9fe', color: '#7c3aed' },
  badgePharmacy: { padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#dbeafe', color: '#1d4ed8' },
  badgeUser: { padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#f1f5f9', color: '#64748b' },
  input: {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, color: '#0f172a', background: '#f8fafc', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10,
    fontSize: 13, color: '#0f172a', background: '#f8fafc', resize: 'vertical', boxSizing: 'border-box',
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 },
  formLabel: { fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' },
  formActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 },
  inlineForm: { background: '#f8fafc', borderRadius: 12, padding: '16px', marginTop: 12, border: '1px solid #e2e8f0' },
  addFormCard: {
    background: 'white', borderRadius: 20, border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px 24px', marginBottom: 16,
  },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  errorText: { color: '#dc2626', fontSize: 13, marginTop: 8 },
};

function RoleBadge({ role }) {
  const style = role === 'admin' ? s.badgeAdmin : role === 'pharmacy' ? s.badgePharmacy : s.badgeUser;
  const label = role === 'admin' ? '관리자' : role === 'pharmacy' ? '약국' : '일반';
  return <span style={style}>{label}</span>;
}

// 승인 대기 탭 — 거절 시 인라인 사유 입력 지원
function PendingTab() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get('/admin/pharmacies/pending').then((r) => setPending(r.data)).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    await api.put(`/admin/pharmacies/${id}/approve`);
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRejectConfirm = async (id) => {
    await api.put(`/admin/pharmacies/${id}/reject`, { reason: rejectReason });
    setPending((prev) => prev.filter((p) => p.id !== id));
    setRejectingId(null);
    setRejectReason('');
  };

  const startReject = (id) => { setRejectingId(id); setRejectReason(''); };
  const cancelReject = () => { setRejectingId(null); setRejectReason(''); };

  if (loading) return <p style={s.loadingText}>로딩 중...</p>;
  if (pending.length === 0) return <p style={s.emptyText}>승인 대기 약국이 없습니다.</p>;

  return (
    <div style={s.cardList}>
      {pending.map((p) => (
        <div key={p.id} style={s.card}>
          <div style={s.cardRow}>
            <div>
              <h3 style={s.pharmacyName}>{p.name}</h3>
              <p style={s.pharmacyAddress}>{p.address}</p>
              {p.phone && <p style={s.pharmacyPhone}>{p.phone}</p>}
              <p style={s.pharmacyManager}>담당자: {p.users?.name} ({p.users?.email})</p>
            </div>
            {rejectingId !== p.id && (
              <div style={s.btnGroup}>
                <button onClick={() => handleApprove(p.id)} style={s.btnApprove}>승인</button>
                <button onClick={() => startReject(p.id)} style={s.btnReject}>거절</button>
              </div>
            )}
          </div>
          {rejectingId === p.id && (
            <div style={s.inlineForm}>
              <label style={s.formLabel}>거절 사유 (선택)</label>
              <textarea
                rows={3}
                style={s.textarea}
                placeholder="거절 사유를 입력하세요. 약국 사업자에게 표시됩니다."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                maxLength={500}
              />
              <div style={s.formActions}>
                <button onClick={cancelReject} style={s.btnSecondary}>취소</button>
                <button onClick={() => handleRejectConfirm(p.id)} style={s.btnReject}>거절 확인</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 거절된 약국 탭 — 거절 사유 표시 + 재승인(pending 복귀) 지원
function RejectedTab() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/pharmacies/rejected').then((r) => setPharmacies(r.data)).finally(() => setLoading(false));
  }, []);

  const handleReapprove = async (id) => {
    await api.put(`/admin/pharmacies/${id}/reapprove`);
    setPharmacies((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <p style={s.loadingText}>로딩 중...</p>;
  if (pharmacies.length === 0) return <p style={s.emptyText}>거절된 약국이 없습니다.</p>;

  return (
    <div style={s.cardList}>
      {pharmacies.map((p) => (
        <div key={p.id} style={s.card}>
          <div style={s.cardRow}>
            <div>
              <h3 style={s.pharmacyName}>{p.name}</h3>
              <p style={s.pharmacyAddress}>{p.address}</p>
              {p.phone && <p style={s.pharmacyPhone}>{p.phone}</p>}
              <p style={s.pharmacyManager}>담당자: {p.users?.name} ({p.users?.email})</p>
              {p.rejection_reason && (
                <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>
                  거절 사유: {p.rejection_reason}
                </p>
              )}
            </div>
            <button onClick={() => handleReapprove(p.id)} style={s.btnApprove}>재승인</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// 약국 관리 탭 — 승인된 약국 목록, 인라인 수정 폼
function PharmaciesTab() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    api.get('/admin/pharmacies/approved').then((r) => setPharmacies(r.data)).finally(() => setLoading(false));
  }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, address: p.address, phone: p.phone || '', business_hours: p.business_hours || '' });
    setSaveError('');
  };

  const cancelEdit = () => { setEditingId(null); setSaveError(''); };

  const handleSave = async (id) => {
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await api.put(`/admin/pharmacies/${id}`, editForm);
      setPharmacies((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
      setEditingId(null);
    } catch {
      setSaveError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`'${name}' 약국을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await api.delete(`/admin/pharmacies/${id}`);
      setPharmacies((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  if (loading) return <p style={s.loadingText}>로딩 중...</p>;
  if (pharmacies.length === 0) return <p style={s.emptyText}>승인된 약국이 없습니다.</p>;

  return (
    <div style={s.cardList}>
      {pharmacies.map((p) => (
        <div key={p.id} style={s.card}>
          <div style={s.cardRow}>
            <div>
              <h3 style={s.pharmacyName}>{p.name}</h3>
              <p style={s.pharmacyAddress}>{p.address}</p>
              {p.phone && <p style={s.pharmacyPhone}>{p.phone}</p>}
              <p style={s.pharmacyManager}>담당자: {p.users?.name} ({p.users?.email})</p>
            </div>
            {editingId !== p.id && (
              <div style={s.btnGroup}>
                <button onClick={() => startEdit(p)} style={s.btnEdit}>수정</button>
                <button onClick={() => handleDelete(p.id, p.name)} style={s.btnDanger}>삭제</button>
              </div>
            )}
          </div>

          {editingId === p.id && (
            <div style={s.inlineForm}>
              <div style={s.formGrid}>
                <div>
                  <label style={s.formLabel}>약국명</label>
                  <input style={s.input} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={s.formLabel}>전화번호</label>
                  <input style={s.input} value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.formLabel}>주소 (변경 시 좌표 재계산)</label>
                  <input style={s.input} value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.formLabel}>영업시간</label>
                  <input style={s.input} value={editForm.business_hours} onChange={(e) => setEditForm((f) => ({ ...f, business_hours: e.target.value }))} />
                </div>
              </div>
              {saveError && <p style={s.errorText}>{saveError}</p>}
              <div style={s.formActions}>
                <button onClick={cancelEdit} style={s.btnSecondary}>취소</button>
                <button onClick={() => handleSave(p.id)} style={s.btnPrimary} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 회원 관리 탭 — 역할 필터 + 페이지네이션 + 삭제·역할 변경
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleEditId, setRoleEditId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('user');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterRole, setFilterRole] = useState('');
  const LIMIT = 20;

  const fetchUsers = async (p = page, role = filterRole) => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (role) params.role = role;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(page, filterRole); }, [page, filterRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (role) => {
    setFilterRole(role);
    setPage(1);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`'${name}' 회원을 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handleRoleChange = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/role`, { role: selectedRole });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: data.role } : u)));
      setRoleEditId(null);
    } catch (err) {
      alert(err.response?.data?.message || '역할 변경에 실패했습니다.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: '#64748b' }}>총 {total}명</span>
        <select
          value={filterRole}
          onChange={(e) => handleFilterChange(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, color: '#334155', background: 'white' }}
        >
          <option value="">전체 역할</option>
          <option value="user">일반</option>
          <option value="pharmacy">약국</option>
          <option value="admin">관리자</option>
        </select>
      </div>

      {loading ? (
        <p style={s.loadingText}>로딩 중...</p>
      ) : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead style={s.thead}>
              <tr>
                {['이름', '이메일', '역할', '가입일', '관리'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={s.tdName}>{u.name}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>
                    {roleEditId === u.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                        >
                          <option value="user">일반</option>
                          <option value="admin">관리자</option>
                        </select>
                        <button onClick={() => handleRoleChange(u.id)} style={{ ...s.btnApprove, padding: '4px 10px' }}>저장</button>
                        <button onClick={() => setRoleEditId(null)} style={{ ...s.btnSecondary, padding: '4px 10px' }}>취소</button>
                      </div>
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                  <td style={s.tdDate}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={s.td}>
                    {u.role !== 'admin' && roleEditId !== u.id && (
                      <div style={s.btnGroup}>
                        <button
                          onClick={() => { setRoleEditId(u.id); setSelectedRole(u.role === 'user' ? 'admin' : 'user'); }}
                          style={s.btnEdit}
                        >
                          역할 변경
                        </button>
                        <button onClick={() => handleDelete(u.id, u.name)} style={s.btnDanger}>삭제</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={s.btnSecondary}>이전</button>
          <span style={{ padding: '8px 12px', fontSize: 14, color: '#64748b' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={s.btnSecondary}>다음</button>
        </div>
      )}
    </div>
  );
}

// 약품 관리 탭 — 전체 약품 테이블, 추가·수정·삭제
function MedicinesTab() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', category: '', efficacy: '', usage: '', precautions: '', side_effects: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMedicines = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/medicines', { params: { page: p, limit: LIMIT } });
      setMedicines(data.medicines);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedicines(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!addForm.name.trim()) { setFormError('약품명은 필수입니다.'); return; }
    setSaving(true); setFormError('');
    try {
      await api.post('/admin/medicines', addForm);
      setAddForm({ name: '', category: '', efficacy: '', usage: '', precautions: '', side_effects: '' });
      setShowAddForm(false);
      fetchMedicines(1);
      setPage(1);
    } catch {
      setFormError('등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditForm({ name: m.name, category: m.category || '', efficacy: m.efficacy || '', usage: m.usage || '', precautions: m.precautions || '', side_effects: m.side_effects || '' });
    setFormError('');
  };

  const handleUpdate = async (id) => {
    setSaving(true); setFormError('');
    try {
      const { data } = await api.put(`/admin/medicines/${id}`, editForm);
      setMedicines((prev) => prev.map((m) => (m.id === id ? data : m)));
      setEditingId(null);
    } catch {
      setFormError('수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`'${name}' 약품을 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/admin/medicines/${id}`);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={s.sectionHeader}>
        <span style={{ fontSize: 14, color: '#64748b' }}>총 {total}개</span>
        <button onClick={() => { setShowAddForm(!showAddForm); setFormError(''); }} style={s.btnPrimary}>
          {showAddForm ? '취소' : '+ 약품 추가'}
        </button>
      </div>

      {showAddForm && (
        <div style={s.addFormCard}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>새 약품 등록</h3>
          <MedicineFormFields form={addForm} onChange={setAddForm} />
          {formError && <p style={s.errorText}>{formError}</p>}
          <div style={s.formActions}>
            <button onClick={() => setShowAddForm(false)} style={s.btnSecondary}>취소</button>
            <button onClick={handleAdd} style={s.btnPrimary} disabled={saving}>
              {saving ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={s.loadingText}>로딩 중...</p>
      ) : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead style={s.thead}>
              <tr>
                {['약품명', '분류', '효능', '관리'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <>
                  <tr key={m.id}>
                    <td style={s.tdName}>{m.name}</td>
                    <td style={s.td}>{m.category || '-'}</td>
                    <td style={{ ...s.td, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.efficacy || '-'}
                    </td>
                    <td style={s.td}>
                      <div style={s.btnGroup}>
                        <button onClick={() => (editingId === m.id ? setEditingId(null) : startEdit(m))} style={s.btnEdit}>
                          {editingId === m.id ? '접기' : '수정'}
                        </button>
                        <button onClick={() => handleDelete(m.id, m.name)} style={s.btnDanger}>삭제</button>
                      </div>
                    </td>
                  </tr>
                  {editingId === m.id && (
                    <tr key={`${m.id}-edit`}>
                      <td colSpan={4} style={{ padding: '0 16px 16px' }}>
                        <div style={s.inlineForm}>
                          <MedicineFormFields form={editForm} onChange={setEditForm} />
                          {formError && <p style={s.errorText}>{formError}</p>}
                          <div style={s.formActions}>
                            <button onClick={() => setEditingId(null)} style={s.btnSecondary}>취소</button>
                            <button onClick={() => handleUpdate(m.id)} style={s.btnPrimary} disabled={saving}>
                              {saving ? '저장 중...' : '저장'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={s.btnSecondary}>이전</button>
          <span style={{ padding: '8px 12px', fontSize: 14, color: '#64748b' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={s.btnSecondary}>다음</button>
        </div>
      )}
    </div>
  );
}

// 약품 폼 필드 공용 컴포넌트 (추가/수정 공용)
function MedicineFormFields({ form, onChange }) {
  const field = (key, label, multiline = false) => (
    <div key={key} style={multiline ? { gridColumn: '1 / -1' } : {}}>
      <label style={s.formLabel}>{label}{key === 'name' ? ' *' : ''}</label>
      {multiline ? (
        <textarea
          rows={3}
          style={s.textarea}
          value={form[key]}
          onChange={(e) => onChange((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <input
          style={s.input}
          value={form[key]}
          onChange={(e) => onChange((f) => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <div style={s.formGrid}>
      {field('name', '약품명')}
      {field('category', '분류')}
      {field('efficacy', '효능·효과', true)}
      {field('usage', '사용법', true)}
      {field('precautions', '주의사항', true)}
      {field('side_effects', '부작용', true)}
    </div>
  );
}

// 공공약국 연결 탭 — 공공데이터 약국과 가입 약국을 수동으로 연결·해제
function PublicLinkTab() {
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [registeredPharmacies, setRegisteredPharmacies] = useState([]);
  const [selectedMap, setSelectedMap] = useState({});   // publicId → registeredPharmacyId
  const [actionMsg, setActionMsg] = useState({});       // publicId → { type: 'ok'|'err', text }
  const [processing, setProcessing] = useState({});     // publicId → boolean

  useEffect(() => {
    api.get('/admin/pharmacies/approved')
      .then((r) => setRegisteredPharmacies(r.data))
      .catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQ.trim() || searchQ.trim().length < 2) return;
    setSearching(true);
    setResults([]);
    setActionMsg({});
    try {
      const { data } = await api.get('/pharmacies/public/search', { params: { q: searchQ } });
      setResults(data);
    } catch {
      /* 검색 실패 무시 */
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async (publicId) => {
    const regId = selectedMap[publicId];
    if (!regId) { setActionMsg((m) => ({ ...m, [publicId]: { type: 'err', text: '연결할 약국을 선택하세요.' } })); return; }
    setProcessing((p) => ({ ...p, [publicId]: true }));
    try {
      await api.put(`/pharmacies/public/${publicId}/link`, { registeredPharmacyId: regId });
      const regName = registeredPharmacies.find((r) => r.id === regId)?.name || '';
      setResults((prev) => prev.map((p) => p.id === publicId ? { ...p, linked_pharmacy_id: regId, _linkedName: regName } : p));
      setActionMsg((m) => ({ ...m, [publicId]: { type: 'ok', text: `'${regName}'과(와) 연결됐습니다.` } }));
    } catch (err) {
      setActionMsg((m) => ({ ...m, [publicId]: { type: 'err', text: err.response?.data?.message || '연결에 실패했습니다.' } }));
    } finally {
      setProcessing((p) => ({ ...p, [publicId]: false }));
    }
  };

  const handleUnlink = async (publicId) => {
    if (!window.confirm('연결을 해제하시겠습니까?')) return;
    setProcessing((p) => ({ ...p, [publicId]: true }));
    try {
      await api.delete(`/pharmacies/public/${publicId}/link`);
      setResults((prev) => prev.map((p) => p.id === publicId ? { ...p, linked_pharmacy_id: null, _linkedName: null } : p));
      setActionMsg((m) => ({ ...m, [publicId]: { type: 'ok', text: '연결이 해제됐습니다.' } }));
    } catch {
      setActionMsg((m) => ({ ...m, [publicId]: { type: 'err', text: '해제에 실패했습니다.' } }));
    } finally {
      setProcessing((p) => ({ ...p, [publicId]: false }));
    }
  };

  return (
    <div>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
        공공데이터 약국을 검색해 PharmFinder 가입 약국과 연결합니다. 연결된 약국은 지도에서 재고 관리 약국으로 표시됩니다.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20, maxWidth: 480 }}>
        <input
          style={{ ...s.input, flex: 1 }}
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="공공데이터 약국 이름으로 검색 (2자 이상)"
        />
        <button type="submit" disabled={searching} style={{ ...s.btnPrimary, opacity: searching ? 0.7 : 1, whiteSpace: 'nowrap' }}>
          {searching ? '검색 중...' : '검색'}
        </button>
      </form>

      {results.length === 0 && !searching && searchQ && (
        <p style={s.emptyText}>검색 결과가 없습니다.</p>
      )}

      <div style={s.cardList}>
        {results.map((pub) => {
          const isLinked = !!pub.linked_pharmacy_id;
          const msg = actionMsg[pub.id];
          const busy = !!processing[pub.id];

          return (
            <div key={pub.id} style={s.card}>
              <div style={s.cardRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={s.pharmacyName}>{pub.name}</p>
                    {isLinked ? (
                      <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontWeight: 500 }}>연결됨</span>
                    ) : (
                      <span style={{ fontSize: 11, background: '#f1f5f9', color: '#94a3b8', padding: '2px 8px', borderRadius: 999 }}>미연결</span>
                    )}
                  </div>
                  {pub.address && <p style={s.pharmacyAddress}>{pub.address}</p>}
                  {pub.phone && <p style={s.pharmacyPhone}>{pub.phone}</p>}
                  {isLinked && (
                    <p style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                      연결된 약국: {pub._linkedName || pub.linked_pharmacy_id}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 200 }}>
                  {isLinked ? (
                    <button
                      onClick={() => handleUnlink(pub.id)}
                      disabled={busy}
                      style={{ ...s.btnDanger, opacity: busy ? 0.6 : 1 }}
                    >
                      연결 해제
                    </button>
                  ) : (
                    <>
                      <select
                        value={selectedMap[pub.id] || ''}
                        onChange={(e) => setSelectedMap((m) => ({ ...m, [pub.id]: e.target.value }))}
                        style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#334155', background: 'white', maxWidth: 200 }}
                      >
                        <option value="">가입 약국 선택</option>
                        {registeredPharmacies.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLink(pub.id)}
                        disabled={busy || !selectedMap[pub.id]}
                        style={{ ...s.btnPrimary, opacity: (busy || !selectedMap[pub.id]) ? 0.6 : 1 }}
                      >
                        연결
                      </button>
                    </>
                  )}
                </div>
              </div>

              {msg && (
                <p style={{ fontSize: 12, marginTop: 8, color: msg.type === 'ok' ? '#16a34a' : '#dc2626' }}>
                  {msg.text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 공공약국 동기화 탭 — HIRA API로 약국 목록을, E-Gen API로 영업시간을 각각 전국 배치 단위로 동기화
function PublicSyncTab() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [syncingHours, setSyncingHours] = useState(false);
  const [hoursResult, setHoursResult] = useState(null);
  const [hoursError, setHoursError] = useState('');

  // 약국 목록 동기화 — HIRA API 지역필터(Q0/Q1)가 실제로는 동작하지 않아 전국 데이터를 배치(페이지) 단위로 순회, 누를 때마다 이어서 진행
  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError('');
    try {
      const { data } = await api.post('/pharmacies/public/sync');
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || '동기화에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  // 영업시간 동기화 — E-Gen API 지역필터가 동작하지 않아 전국 데이터를 배치(페이지) 단위로 순회, 누를 때마다 이어서 진행
  const handleSyncHours = async () => {
    setSyncingHours(true);
    setHoursError('');
    try {
      const { data } = await api.post('/pharmacies/public/sync-hours');
      setHoursResult(data);
    } catch (err) {
      setHoursError(err.response?.data?.message || '영업시간 동기화에 실패했습니다.');
    } finally {
      setSyncingHours(false);
    }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
        건강보험심사평가원 약국정보서비스 API에서 전국 약국 목록을 가져와 지도에 표시할 수 있도록 저장합니다.
        지역필터가 동작하지 않아(라이브 테스트로 확인) 지역 지정 없이 전국 데이터를 배치 단위로 나눠 처리하며,
        버튼을 누를 때마다 이어서 진행됩니다 (매일 자동으로도 진행됨).
      </p>

      {error && <p style={s.errorText}>{error}</p>}

      {result && (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#16a34a' }}>
          <p style={{ marginBottom: result.totalCount ? 8 : 0 }}>✅ {result.message}</p>
          {result.totalCount > 0 && (
            <div style={{ background: '#bbf7d0', borderRadius: 999, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((((result.isComplete ? result.totalCount : (result.nextPage - 1) * 100) / result.totalCount) * 100)))}%`,
                background: '#16a34a', height: '100%',
              }} />
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={handleSync} disabled={syncing} style={{ ...s.btnPrimary, opacity: syncing ? 0.7 : 1 }}>
        {syncing ? '동기화 중...' : '다음 배치 실행'}
      </button>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />

      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
        국립중앙의료원(E-Gen) API로 전국 약국 영업시간을 조회해, 이미 동기화된 공공약국 레코드와 매칭되는 건에 한해 영업시간을 채웁니다.
        지역 지정 없이 전국 데이터를 배치 단위로 나눠 처리하며, 버튼을 누를 때마다 이어서 진행됩니다 (매일 자동으로도 진행됨).
        공공데이터 기반이라 실제 영업시간과 다를 수 있습니다.
      </p>

      {hoursError && <p style={s.errorText}>{hoursError}</p>}

      {hoursResult && (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#16a34a' }}>
          <p style={{ marginBottom: hoursResult.totalCount ? 8 : 0 }}>✅ {hoursResult.message}</p>
          {hoursResult.totalCount > 0 && (
            <div style={{ background: '#bbf7d0', borderRadius: 999, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((((hoursResult.isComplete ? hoursResult.totalCount : (hoursResult.nextPage - 1) * 100) / hoursResult.totalCount) * 100)))}%`,
                background: '#16a34a', height: '100%',
              }} />
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={handleSyncHours} disabled={syncingHours} style={{ ...s.btnPrimary, opacity: syncingHours ? 0.7 : 1 }}>
        {syncingHours ? '영업시간 동기화 중...' : '다음 배치 실행'}
      </button>
    </div>
  );
}

// 관리자 대시보드 — 약국 승인/거절/관리, 회원 관리, 약품 관리를 탭으로 제공
export default function AdminDashboard() {
  const [tab, setTab] = useState('pending');

  const tabs = [
    { key: 'pending', label: '승인 대기' },
    { key: 'rejected', label: '거절된 약국' },
    { key: 'pharmacies', label: '약국 관리' },
    { key: 'users', label: '회원 관리' },
    { key: 'medicines', label: '약품 관리' },
    { key: 'publiclink', label: '공공약국 연결' },
    { key: 'publicsync', label: '공공약국 동기화' },
  ];

  return (
    <div style={s.page}>
      <h1 style={s.heading}>관리자 대시보드</h1>

      <div style={s.tabBar}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tab === t.key ? s.tabActive : s.tabInactive}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pending'    && <PendingTab />}
      {tab === 'rejected'   && <RejectedTab />}
      {tab === 'pharmacies' && <PharmaciesTab />}
      {tab === 'users'      && <UsersTab />}
      {tab === 'medicines'  && <MedicinesTab />}
      {tab === 'publiclink' && <PublicLinkTab />}
      {tab === 'publicsync' && <PublicSyncTab />}
    </div>
  );
}
