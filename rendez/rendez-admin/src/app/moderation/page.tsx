'use client';
import { useEffect, useState } from 'react';
import { authHeader, safeFetch } from '../../lib/adminAuth';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

interface Report {
  id: string;
  reason: string;
  detail?: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string };
  reported: { id: string; name: string; city: string };
}

const REASON_COLOR: Record<string, string> = {
  HARASSMENT: '#ef4444', FAKE_PROFILE: '#f97316', SPAM: '#f59e0b',
  INAPPROPRIATE_CONTENT: '#8b5cf6', SCAM: '#dc2626', OTHER: '#6b7280',
};

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = () => {
    setLoading(true);
    setError(null);
    safeFetch<Report[]>(`${API}/admin/reports?status=${filter}`, { headers: authHeader() })
      .then(setReports)
      .catch((e: Error) => { setError(e.message); setReports([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const resolve = async (id: string, status: string) => {
    setActing(id);
    try {
      await safeFetch(`${API}/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewedBy: 'admin' }),
      });
      fetchReports();
    } catch (e: unknown) {
      alert(`Resolve failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Moderation Queue</h1>
        <span style={{ fontSize: 13, color: '#888' }}>{reports.length} reports</span>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: `1px solid ${filter === s ? '#7c3aed' : '#ddd'}`,
              background: filter === s ? '#7c3aed' : '#fff',
              color: filter === s ? '#fff' : '#555',
            }}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : reports.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 8, padding: 40, textAlign: 'center', color: '#bbb' }}>
          <p style={{ fontSize: 32 }}>✅</p>
          <p style={{ marginTop: 8 }}>No {filter.toLowerCase().replace('_', ' ')} reports</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                {['Reporter', 'Reported', 'City', 'Reason', 'Detail', 'Date', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#666', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{r.reporter.name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{r.reported.name}</td>
                  <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{r.reported.city}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                      background: (REASON_COLOR[r.reason] || '#eee') + '20',
                      color: REASON_COLOR[r.reason] || '#888',
                    }}>
                      {r.reason.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: 13, maxWidth: 200 }}>
                    {r.detail || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#bbb', fontSize: 12 }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => resolve(r.id, 'ACTION_TAKEN')}
                          disabled={acting === r.id}
                          style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          {acting === r.id ? '...' : 'Action'}
                        </button>
                        <button
                          onClick={() => resolve(r.id, 'DISMISSED')}
                          disabled={acting === r.id}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#888', cursor: 'pointer', fontSize: 11 }}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    {r.status !== 'PENDING' && (
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
