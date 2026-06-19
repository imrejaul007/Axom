'use client';
import { useEffect, useState } from 'react';
import { authHeader, safeFetch } from '../../lib/adminAuth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Stats {
  totalProfiles: number;
  totalMatches: number;
  totalGifts: number;
  pendingReports: number;
  activeGifts: number;
  validatedMeetups: number;
  fraudFlags: number;
  giftValueAcceptedPaise: number;
}

interface DayData {
  date: string;
  matches: number;
  gifts: number;
  meetups: number;
  newUsers: number;
}

interface HealthResponse {
  checks: Array<{ name: string; status: string }>;
}

const STAT_CARDS = (s: Stats) => [
  { label: 'Active Users',      value: s.totalProfiles,      color: '#7c3aed' },
  { label: 'Active Matches',    value: s.totalMatches,       color: '#10b981' },
  { label: 'Total Gifts Sent',  value: s.totalGifts,         color: '#f59e0b' },
  { label: 'Pending Reports',   value: s.pendingReports,     color: '#ef4444' },
  { label: 'Gifts Pending',     value: s.activeGifts,        color: '#6366f1' },
  { label: 'Meetups Validated', value: s.validatedMeetups,   color: '#0ea5e9' },
  { label: 'Fraud Flags',       value: s.fraudFlags,         color: '#f97316' },
  { label: 'Gift Revenue',      value: `₹${(s.giftValueAcceptedPaise / 100).toLocaleString('en-IN')}`, color: '#7c3aed' },
];

const SERIES = [
  { key: 'matches' as keyof DayData, label: 'Matches', color: '#7c3aed' },
  { key: 'gifts'   as keyof DayData, label: 'Gifts',   color: '#f59e0b' },
  { key: 'meetups' as keyof DayData, label: 'Meetups', color: '#10b981' },
  { key: 'newUsers'as keyof DayData, label: 'New Users', color: '#0ea5e9' },
];

function SparkChart({ data, series }: { data: DayData[]; series: typeof SERIES }) {
  const height = 120;
  const width = 560;
  const padding = { top: 12, bottom: 28, left: 32, right: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => series.map((s) => d[s.key] as number));
  const maxVal = Math.max(...allValues, 1);

  const x = (i: number) => padding.left + (i / (data.length - 1)) * innerW;
  const y = (v: number) => padding.top + innerH - (v / maxVal) * innerH;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Horizontal grid lines */}
      {[0, 0.5, 1].map((frac) => (
        <line
          key={frac}
          x1={padding.left} y1={padding.top + innerH * (1 - frac)}
          x2={width - padding.right} y2={padding.top + innerH * (1 - frac)}
          stroke="#f0f0f0" strokeWidth={1}
        />
      ))}

      {/* Series lines */}
      {series.map((s) => {
        const points = data.map((d, i) => `${x(i)},${y(d[s.key] as number)}`).join(' ');
        return (
          <g key={s.key}>
            <polyline fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" points={points} />
            {data.map((d, i) => (
              <circle key={i} cx={x(i)} cy={y(d[s.key] as number)} r={3} fill={s.color} />
            ))}
          </g>
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={x(i)} y={height - 4}
          textAnchor="middle" fontSize={9} fill="#bbb"
        >
          {d.date}
        </text>
      ))}

      {/* Y-axis max */}
      <text x={padding.left - 4} y={padding.top + 4} textAnchor="end" fontSize={9} fill="#bbb">{maxVal}</text>
    </svg>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeseries, setTimeseries] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<Array<{ label: string; status: string; ok: boolean }>>([]);
  const [activeSeries, setActiveSeries] = useState<string[]>(['matches', 'gifts', 'meetups', 'newUsers']);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      safeFetch<Stats>(`${API}/admin/stats`, { headers: authHeader() }),
      safeFetch<DayData[]>(`${API}/admin/stats/timeseries?days=${days}`, { headers: authHeader() }),
      safeFetch<HealthResponse>(`${API}/admin/health`, { headers: authHeader() }).catch(() => null),
    ])
      .then(([s, ts, health]) => {
        setStats(s);
        setTimeseries(ts);
        if (health && Array.isArray(health.checks)) {
          setSystemStatus(health.checks.map((c: { name: string; status: string }) => ({
            label: c.name,
            status: c.status === 'ok' ? 'Operational' : c.status === 'degraded' ? 'Degraded' : 'Down',
            ok: c.status === 'ok',
          })));
        } else {
          setSystemStatus([
            { label: 'Backend API', status: 'Unknown', ok: false },
            { label: 'Database', status: 'Unknown', ok: false },
            { label: 'Cache', status: 'Unknown', ok: false },
            { label: 'Background Workers', status: 'Unknown', ok: false },
          ]);
        }
      })
      .catch(() => setSystemStatus([
        { label: 'Backend API', status: 'Down', ok: false },
        { label: 'Database', status: 'Down', ok: false },
        { label: 'Cache', status: 'Down', ok: false },
        { label: 'Background Workers', status: 'Down', ok: false },
      ]))
      .finally(() => setLoading(false));
  }, [days]);

  const toggleSeries = (key: string) => {
    setActiveSeries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const visibleSeries = SERIES.filter((s) => activeSeries.includes(s.key));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
        <span style={{ fontSize: 13, color: '#999' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {loading && <p style={{ color: '#888' }}>Loading...</p>}

      {/* KPI cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {STAT_CARDS(stats).map((card) => (
            <div key={card.label} style={{
              background: '#fff', borderRadius: 12, padding: 20,
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderLeft: `4px solid ${card.color}`,
            }}>
              <p style={{ color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {card.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1a1a2e' }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Activity chart */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Activity (last {days} days)</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Day range selector */}
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => setDays(d)} style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${days === d ? '#7c3aed' : '#eee'}`,
                background: days === d ? '#7c3aed' : '#fff',
                color: days === d ? '#fff' : '#888', fontWeight: 600,
              }}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Series toggles */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          {SERIES.map((s) => (
            <button key={s.key} onClick={() => toggleSeries(s.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              borderRadius: 16, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: `1px solid ${activeSeries.includes(s.key) ? s.color : '#eee'}`,
              background: activeSeries.includes(s.key) ? s.color + '15' : '#fff',
              color: activeSeries.includes(s.key) ? s.color : '#bbb',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: activeSeries.includes(s.key) ? s.color : '#ddd', display: 'inline-block' }} />
              {s.label}
            </button>
          ))}
        </div>

        {timeseries.length > 0 && visibleSeries.length > 0 ? (
          <SparkChart data={timeseries} series={visibleSeries} />
        ) : (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ddd' }}>
            No data
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1a1a2e' }}>Quick Actions</h3>
          {[
            { href: '/moderation', label: '🚨 Review pending reports', color: '#ef4444' },
            { href: '/fraud',      label: '🛡️ Review fraud flags',     color: '#f97316' },
            { href: '/users',      label: '👤 Manage users',           color: '#7c3aed' },
            { href: '/gifts',      label: '🎁 Gift analytics',         color: '#10b981' },
          ].map((a) => (
            <a key={a.href} href={a.href} style={{
              display: 'block', padding: '10px 0', color: a.color,
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
              borderBottom: '1px solid #f5f5f5',
            }}>
              {a.label}
            </a>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1a1a2e' }}>System Status</h3>
          {systemStatus.map((s) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontSize: 13, color: '#555' }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.ok ? '#10b981' : '#ef4444' }}>
                ● {s.status}
              </span>
            </div>
          ))}
          {systemStatus.length === 0 && !loading && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 13, color: '#999' }}>Loading system status...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
