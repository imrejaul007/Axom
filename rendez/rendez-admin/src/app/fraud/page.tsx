'use client';
import { useEffect, useState } from 'react';
import { authHeader, safeFetch } from '../../lib/adminAuth';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

interface FraudFlag {
  id: string;
  type: string;
  detail: string;
  resolved: boolean;
  createdAt: string;
  profile: { id: string; name: string; city: string; phone: string };
}

const TYPE_COLOR: Record<string, string> = {
  GIFT_SPAM: '#ef4444',
  REJECTION_PATTERN: '#f97316',
  REWARD_FARMING: '#dc2626',
  FAKE_CHECKIN: '#7c3aed',
  DEVICE_MULTI: '#f59e0b',
};

export default function FraudPage() {
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = () => {
    setLoading(true);
    setError(null);
    safeFetch<FraudFlag[]>(`${API}/admin/fraud?resolved=${showResolved}`, { headers: authHeader() })
      .then(setFlags)
      .catch((e: Error) => { setError(e.message); setFlags([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFlags(); }, [showResolved]);

  const resolve = async (id: string) => {
    setResolving(id);
    try {
      await safeFetch(`${API}/admin/fraud/${id}/resolve`, {
        method: 'PATCH',
        headers: authHeader(),
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Unknown error';
      const safe = raw.replace(/<[^>]*>/g, '').slice(0, 200);
      alert(`Failed to resolve: ${safe}`);
    } finally {
      setResolving(null);
      fetchFlags();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Fraud Flags</h1>
        <span style={{ fontSize: 13, color: '#888' }}>{flags.length} flags</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ label: 'Active', value: false }, { label: 'Resolved', value: true }].map(({ label, value }) => (
          <button key={label} onClick={() => setShowResolved(value)}
            style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: `1px solid ${showResolved === value ? '#dc2626' : '#ddd'}`,
              background: showResolved === value ? '#dc2626' : '#fff',
              color: showResolved === value ? '#fff' : '#555',
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : flags.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 8, padding: 40, textAlign: 'center', color: '#bbb' }}>
          <p style={{ fontSize: 32 }}>🛡️</p>
          <p style={{ marginTop: 8 }}>No {showResolved ? 'resolved' : 'active'} fraud flags</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                {['User', 'Phone', 'City', 'Flag Type', 'Detail', 'Date', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#666', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{f.profile?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{f.profile?.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{f.profile?.city || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                      background: (TYPE_COLOR[f.type] || '#eee') + '20',
                      color: TYPE_COLOR[f.type] || '#888',
                    }}>
                      {f.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: 13, maxWidth: 220 }}>{f.detail}</td>
                  <td style={{ padding: '12px 16px', color: '#bbb', fontSize: 12 }}>
                    {new Date(f.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {!f.resolved ? (
                      <button
                        onClick={() => resolve(f.id)}
                        disabled={resolving === f.id}
                        style={{
                          padding: '4px 12px', borderRadius: 6, border: 'none',
                          background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        }}
                      >
                        {resolving === f.id ? '...' : 'Resolve'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
