'use client';
import { useEffect, useState } from 'react';
import { authHeader, safeFetch } from '../../lib/adminAuth';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

interface Gift {
  id: string;
  sender: { name: string };
  receiver: { name: string };
  giftType: string;
  amountPaise: number;
  status: string;
  createdAt: string;
  rezCatalogItemId?: string;
}

interface GiftStats {
  total: number;
  totalValuePaise: number;
  accepted: number;
  rejected: number;
  redeemed: number;
  pending: number;
  expired: number;
  coinGifts: number;
  voucherGifts: number;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b', ACCEPTED: '#10b981', REJECTED: '#ef4444',
  REDEEMED: '#7c3aed', EXPIRED: '#9ca3af', CANCELLED: '#6b7280',
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#f0f0f0', overflow: 'hidden' }}>
        <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [stats, setStats] = useState<GiftStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    setError(null);
    safeFetch<Gift[]>(`${API}/admin/gifts`, { headers: authHeader() })
      .then((data: Gift[]) => {
        setGifts(data);

        // Compute stats client-side
        const s: GiftStats = {
          total: data.length,
          totalValuePaise: data.reduce((s, g) => s + g.amountPaise, 0),
          accepted: data.filter((g) => g.status === 'ACCEPTED').length,
          rejected: data.filter((g) => g.status === 'REJECTED').length,
          redeemed: data.filter((g) => g.status === 'REDEEMED').length,
          pending: data.filter((g) => g.status === 'PENDING').length,
          expired: data.filter((g) => g.status === 'EXPIRED').length,
          coinGifts: data.filter((g) => g.giftType === 'COIN').length,
          voucherGifts: data.filter((g) => g.giftType === 'MERCHANT_VOUCHER').length,
        };
        setStats(s);
      })
      .catch((e: Error) => { setError(e.message); setGifts([]); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'ALL' ? gifts : gifts.filter((g) => g.status === statusFilter);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const acceptanceRate = stats && (stats.accepted + stats.rejected) > 0
    ? Math.round((stats.accepted / (stats.accepted + stats.rejected)) * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Gift Analytics</h1>
        <span style={{ fontSize: 13, color: '#888' }}>{filtered.length} gifts</span>
      </div>

      {loading && <p style={{ color: '#888' }}>Loading...</p>}

      {stats && (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Gifts',      value: stats.total,             color: '#7c3aed' },
              { label: 'Total Value',      value: `₹${(stats.totalValuePaise / 100).toLocaleString('en-IN')}`, color: '#10b981' },
              { label: 'Acceptance Rate',  value: `${acceptanceRate}%`,    color: '#f59e0b' },
              { label: 'Redeemed',         value: stats.redeemed,          color: '#0ea5e9' },
            ].map((c) => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderLeft: `4px solid ${c.color}` }}>
                <p style={{ color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, marginTop: 8, color: '#1a1a2e' }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Status breakdown */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>Status Breakdown</h3>
              {[
                { label: 'Pending',  value: stats.pending,  color: '#f59e0b' },
                { label: 'Accepted', value: stats.accepted, color: '#10b981' },
                { label: 'Redeemed', value: stats.redeemed, color: '#7c3aed' },
                { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
                { label: 'Expired',  value: stats.expired,  color: '#9ca3af' },
              ].map((s) => (
                <div key={s.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: '#bbb' }}>
                      {stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <MiniBar value={s.value} max={stats.total} color={s.color} />
                </div>
              ))}
            </div>

            {/* Gift type + rate */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>Gift Type Split</h3>
              {[
                { label: '🎁 Merchant Vouchers', value: stats.voucherGifts, color: '#7c3aed' },
                { label: '💰 REZ Coins',         value: stats.coinGifts,    color: '#f59e0b' },
              ].map((s) => (
                <div key={s.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <MiniBar value={s.value} max={stats.total} color={s.color} />
                </div>
              ))}

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f5f5f5' }}>
                <p style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                  Gift Acceptance Rate
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 32,
                    background: `conic-gradient(#10b981 ${acceptanceRate * 3.6}deg, #f0f0f0 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>{acceptanceRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: '#555' }}>{stats.accepted} accepted</p>
                    <p style={{ fontSize: 13, color: '#ef4444' }}>{stats.rejected} rejected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'REDEEMED', 'EXPIRED'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: `1px solid ${statusFilter === s ? '#7c3aed' : '#ddd'}`,
              background: statusFilter === s ? '#7c3aed' : '#fff',
              color: statusFilter === s ? '#fff' : '#555',
            }}>
            {s}
            {s !== 'ALL' && stats && (
              <span style={{ marginLeft: 4, opacity: 0.8 }}>
                ({s === 'PENDING' ? stats.pending : s === 'ACCEPTED' ? stats.accepted : s === 'REJECTED' ? stats.rejected : s === 'REDEEMED' ? stats.redeemed : stats.expired})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Gift table */}
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              {['Sender', 'Receiver', 'Type', 'Amount', 'Status', 'Date'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#666', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#bbb' }}>No gifts found</td>
              </tr>
            ) : paged.map((g) => (
              <tr key={g.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{g.sender?.name || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>{g.receiver?.name || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>
                  {g.giftType === 'COIN' ? '💰 Coins' : '🎁 Voucher'}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#7c3aed' }}>
                  ₹{(g.amountPaise / 100).toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                    background: (STATUS_COLOR[g.status] || '#eee') + '20',
                    color: STATUS_COLOR[g.status] || '#888',
                  }}>
                    {g.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#bbb', fontSize: 12 }}>
                  {new Date(g.createdAt).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid #f5f5f5' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #eee', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}
            >
              ← Prev
            </button>
            <span style={{ padding: '6px 14px', fontSize: 13, color: '#666' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #eee', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
