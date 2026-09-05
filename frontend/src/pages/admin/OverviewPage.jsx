import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import api from '../../services/api';

const COLORS = {
  blue:   '#3b82f6',
  green:  'var(--color-primary)',
  yellow: '#f59e0b',
  red:    '#ef4444',
  purple: '#8b5cf6',
  pink:   '#ec4899',
};

const ROLE_COLORS  = [COLORS.blue, COLORS.green, COLORS.purple];
const STATUS_COLORS = [COLORS.green, COLORS.yellow, COLORS.red];

const s = {
  page: { maxWidth: 960, margin: '0 auto', padding: '40px 24px', background: '#f8fafc', minHeight: '100vh' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' },
  heading: { fontSize: 24, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 32 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 },
  kpiCard: {
    background: 'white', borderRadius: 20, border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px', textAlign: 'center',
  },
  kpiValue: { fontSize: 30, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 },
  kpiLabel: { fontSize: 13, color: '#64748b' },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 20 },
  chartSection: { marginBottom: 40 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 },
  card: {
    background: 'white', borderRadius: 20, border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px',
  },
  cardHeading: { fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 16 },
  divider: { borderTop: '1px solid #e2e8f0', margin: '40px 0' },
  table: { width: '100%', fontSize: 14, borderCollapse: 'collapse' },
  roleRow: { borderTop: '1px solid #f1f5f9' },
  roleTd: { padding: '8px 0', color: '#64748b' },
  roleCount: { padding: '8px 0', textAlign: 'right', fontWeight: 600, color: 'var(--color-ink)' },
  stockRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stockName: { fontSize: 14, color: '#334155' },
  stockBadge: {
    padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500,
    background: '#fee2e2', color: '#dc2626',
  },
  stockOk: { fontSize: 14, color: 'var(--color-primary-deep)' },
  tableWrapper: {
    background: 'white', borderRadius: 20, border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden',
  },
  tableHeader: { padding: '16px 24px', borderBottom: '1px solid #f1f5f9' },
  tableHeaderText: { fontSize: 15, fontWeight: 700, color: 'var(--color-ink)' },
  thead: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: 14 },
  tdName: { padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: 'var(--color-ink)', fontSize: 14 },
  tdEmail: { padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: '#64748b', fontSize: 14 },
  td: { padding: '12px 16px', borderTop: '1px solid #f1f5f9', fontSize: 14 },
  tdDate: { padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: 14 },
  badgeAdmin:    { padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#ede9fe', color: '#7c3aed' },
  badgePharmacy: { padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#dbeafe', color: '#1d4ed8' },
  badgeUser:     { padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#f1f5f9', color: '#64748b' },
};

function roleBadgeStyle(role) {
  if (role === 'admin') return s.badgeAdmin;
  if (role === 'pharmacy') return s.badgePharmacy;
  return s.badgeUser;
}

// 파이차트 툴팁 커스텀 — "N명 (XX%)" 형식
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
      <strong>{name}</strong>: {value}명
    </div>
  );
}

// 바차트 툴팁 커스텀
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
      <div style={{ color: '#64748b', marginBottom: 4 }}>{label}</div>
      <strong>{payload[0].value}명</strong>
    </div>
  );
}

// 저재고 바차트 툴팁
function StockTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
      <div style={{ color: '#64748b', marginBottom: 4 }}>{label}</div>
      <strong>{payload[0].value}종 부족</strong>
    </div>
  );
}

// 전체현황 페이지 — KPI, 차트 4종, 역할별 회원/저재고/최근 가입자 테이블을 한눈에 확인
export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get('/admin/overview')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div style={s.center}>로딩 중...</div>;
  if (!data) return <div style={s.center}>데이터를 불러올 수 없습니다.</div>;

  const { kpi, usersByRole, monthlySignups, recentUsers, lowStockPharmacies } = data;

  const kpiCards = [
    { label: '전체 회원',  value: kpi.totalUsers },
    { label: '승인 약국',  value: kpi.approvedPharmacies },
    { label: '승인 대기',  value: kpi.pendingPharmacies },
    { label: '등록 약품',  value: kpi.totalMedicines },
  ];

  const roleLabels = { user: '일반', pharmacy: '약국', admin: '관리자' };

  // 파이차트용 데이터 변환
  const roleChartData = Object.entries(usersByRole).map(([role, count]) => ({
    name: roleLabels[role] ?? role, value: count,
  }));

  const statusChartData = [
    { name: '승인', value: kpi.approvedPharmacies ?? 0 },
    { name: '대기', value: kpi.pendingPharmacies  ?? 0 },
    { name: '거절', value: kpi.rejectedPharmacies ?? 0 },
  ].filter((d) => d.value > 0);

  // 저재고 차트용 데이터 (가로 막대)
  const stockChartData = lowStockPharmacies.map((p) => ({
    name: p.pharmacy_name, value: p.low_stock_count,
  }));

  return (
    <div style={s.page}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ ...s.heading, marginBottom: 0 }}>전체현황</h1>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '8px 18px', background: '#f1f5f9', color: '#334155',
            fontSize: 13, fontWeight: 500, borderRadius: 10, border: '1px solid #e2e8f0',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '로딩 중...' : '새로고침'}
        </button>
      </div>

      {/* KPI 카드 */}
      <div style={s.kpiGrid}>
        {kpiCards.map(({ label, value }) => (
          <div key={label} style={s.kpiCard}>
            <p style={s.kpiValue}>{value ?? 0}</p>
            <p style={s.kpiLabel}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── 차트 섹션 ── */}
      <div style={s.chartSection}>
        <h2 style={s.sectionTitle}>통계 차트</h2>

        {/* Row 1: 역할별 회원 파이 + 약국 상태 도넛 */}
        <div style={s.twoCol}>
          <div style={s.card}>
            <h3 style={s.cardHeading}>역할별 회원 분포</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roleChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {roleChartData.map((_, i) => (
                    <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={s.card}>
            <h3 style={s.cardHeading}>약국 상태 분포</h3>
            {statusChartData.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14, paddingTop: 60, textAlign: 'center' }}>등록된 약국이 없습니다.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 2: 월별 신규 가입자 막대차트 */}
        {monthlySignups && (
          <div style={{ ...s.card, marginBottom: 24 }}>
            <h3 style={s.cardHeading}>월별 신규 가입자 (최근 6개월)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlySignups} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} width={32} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="count" fill={COLORS.blue} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Row 3: 저재고 약국 가로 막대차트 (데이터 있을 때만) */}
        {stockChartData.length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardHeading}>저재고 약국 현황</h3>
            <ResponsiveContainer width="100%" height={Math.max(160, stockChartData.length * 44)}>
              <BarChart data={stockChartData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} width={80} />
                <Tooltip content={<StockTooltip />} />
                <Bar dataKey="value" fill={COLORS.red} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 기존 테이블 섹션 ── */}
      <hr style={s.divider} />

      <div style={s.twoCol}>
        <div style={s.card}>
          <h2 style={s.cardHeading}>역할별 회원</h2>
          <table style={s.table}>
            <tbody>
              {Object.entries(usersByRole).map(([role, count]) => (
                <tr key={role} style={s.roleRow}>
                  <td style={s.roleTd}>{roleLabels[role] ?? role}</td>
                  <td style={s.roleCount}>{count}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={s.card}>
          <h2 style={s.cardHeading}>재고 부족 약국</h2>
          {lowStockPharmacies.length === 0 ? (
            <p style={s.stockOk}>모든 약국 재고 정상</p>
          ) : (
            <div>
              {lowStockPharmacies.map((p) => (
                <div key={p.pharmacy_id} style={s.stockRow}>
                  <span style={s.stockName}>{p.pharmacy_name}</span>
                  <span style={s.stockBadge}>{p.low_stock_count}종 부족</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={s.tableWrapper}>
        <div style={s.tableHeader}>
          <h2 style={s.tableHeaderText}>최근 가입자</h2>
        </div>
        <table style={s.table}>
          <thead style={s.thead}>
            <tr>
              {['이름', '이메일', '역할', '가입일'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td style={s.tdName}>{u.name}</td>
                <td style={s.tdEmail}>{u.email}</td>
                <td style={s.td}>
                  <span style={roleBadgeStyle(u.role)}>
                    {roleLabels[u.role] ?? u.role}
                  </span>
                </td>
                <td style={s.tdDate}>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
