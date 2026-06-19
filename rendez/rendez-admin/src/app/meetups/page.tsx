'use client';
import { useEffect, useState } from 'react';
import { authHeader, safeFetch } from '../../lib/adminAuth';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

interface Meetup {
  id: string;
  matchId: string;
  bookingId: string;
  users: string;
  checkinCount: number;
  merchantId: string | null;
  checkedInAt: string | null;
  rewardStatus: string;
  rezRewardRef: string | null;
  triggeredAt: string | null;
  createdAt: string;
}

interface MerchantBreakdown {
  merchantId: string;
  count: number;
}

interface Totals {
  total: number;
  validated: number;
  rewarded: number;
  failed: number;
}

const REWARD_COLOR: Record<string, string> = {
  TRIGGERED: '#10b981',
  PENDING:   '#f59e0b',
  FAILED:    '#ef4444',
};

export default function MeetupsPage() {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [breakdown, setBreakdown] = useState<MerchantBreakdown[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
    safeFetch<{ meetups: Meetup[]; merchantBreakdown: MerchantBreakdown[]; totals: Totals }>(
      `${API}/admin/meetups${params}`, { headers: authHeader() },
    )
      .then((data) => {
        setMeetups(data.meetups || []);
        setBreakdown(data.merchantBreakdown || []);
        setTotals(data.totals || null);
      })
      .catch((e: Error) => { setError(e.message); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const maxBreakdownCount = breakdown[0]?.count || 1;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Meetups</h1>
        <span style={{ fontSize: 13, color: '#888' }}>{meetups.length} records</span>
      </div>

      {loading && <p style={{ color: '#888' }}>Loading...</p>}

      {/* KPI cards */}
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Meetups',       value: totals.total,     color: '#7c3aed' },
            { label: 'Validated',           value: totals.validated, color: '#10b981' },
            { label: 'Rewards Triggered',   value: totals.rewarded,  color: '#0ea5e9' },
            { label: 'Failed Rewards',      value: totals.failed,    color: '#ef4444' },
          ].map((c) => (
            <div key={c.label} style={{
              background: '#fff', borderRadius: 12, padding: 20,
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderLeft: `4px solid ${c.color}`,
            }}>
              <p style={{ color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1a1a2e' }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bottom row: merchant breakdown + table */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Merchant breakdown */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>Top Venues</h3>
          {breakdown.length === 0 ? (
            <p style={{ color: '#bbb', fontSize: 13 }}>No data yet</p>
          ) : breakdown.map((b, i) => (
            <div key={b.merchantId} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>
                  {i + 1}. {b.merchantId.slice(0, 16)}…
                </span>
                <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700 }}>{b.count}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                <div style={{
                  width: `${(b.count / maxBreakdownCount) * 100}%`,
                  height: '100%', background: '#7c3aed', borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Meetup table */}
        <div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {['ALL', 'TRIGGERED', 'PENDING', 'FAILED'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  border: `1px solid ${statusFilter === s ? '#7c3aed' : '#ddd'}`,
                  background: statusFilter === s ? '#7c3aed' : '#fff',
                  color: statusFilter === s ? '#fff' : '#555',
                }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                  {['Match', 'Booking ID', 'Check-ins', 'Checked In', 'Reward', 'Reward Ref', 'Date'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#666', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meetups.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#bbb' }}>
                      No meetups found
                    </td>
                  </tr>
                ) : meetups.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{m.users}</td>
                    <td style={{ padding: '12px 16px', color: '#888', fontSize: 12, fontFamily: 'monospace' }}>
                      {m.bookingId.slice(0, 12)}…
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: m.checkinCount >= 2 ? '#10b981' : '#f59e0b',
                      }}>
                        {m.checkinCount} / 2
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#bbb', fontSize: 12 }}>
                      {m.checkedInAt ? new Date(m.checkedInAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                        background: (REWARD_COLOR[m.rewardStatus] || '#eee') + '20',
                        color: REWARD_COLOR[m.rewardStatus] || '#888',
                      }}>
                        {m.rewardStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#bbb', fontSize: 11, fontFamily: 'monospace' }}>
                      {m.rezRewardRef ? m.rezRewardRef.slice(0, 10) + '…' : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#bbb', fontSize: 12 }}>
                      {new Date(m.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
