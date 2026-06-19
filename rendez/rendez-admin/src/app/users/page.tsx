'use client';
import { useEffect, useState } from 'react';
import { authHeader, safeFetch } from '../../lib/adminAuth';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

interface User {
  id: string;
  name: string;
  city: string;
  age: number;
  intent: string;
  isVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  phone: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (q?: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    try {
      const data = await safeFetch<User[]>(`${API}/admin/users?${params}`, { headers: authHeader() });
      setUsers(data);
    } catch (e) {
      setError((e as Error).message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value.length === 0 || e.target.value.length >= 2) {
      fetchUsers(e.target.value);
    }
  };

  const suspend = async (id: string) => {
    setActing(id);
    setConfirmId(null);
    try {
      await safeFetch(`${API}/admin/users/${id}/suspend`, {
        method: 'PATCH',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin action' }),
      });
      fetchUsers(search);
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Unknown error';
      const safe = raw.replace(/<[^>]*>/g, '').slice(0, 200);
      alert(`Suspend failed: ${safe}`);
    } finally {
      setActing(null);
    }
  };

  const unsuspend = async (id: string) => {
    setActing(id);
    try {
      await safeFetch(`${API}/admin/users/${id}/unsuspend`, {
        method: 'PATCH',
        headers: authHeader(),
      });
      fetchUsers(search);
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Unknown error';
      const safe = raw.replace(/<[^>]*>/g, '').slice(0, 200);
      alert(`Unsuspend failed: ${safe}`);
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      {/* Confirm modal */}
      {confirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 360, width: '90%' }}>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Suspend this account?</p>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              The user will be immediately locked out and see a suspension message.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmId(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => suspend(confirmId)}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Yes, Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Users</h1>
        <input
          value={search} onChange={handleSearch}
          placeholder="Search name or city..."
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', width: 240, fontSize: 13 }}
        />
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                {['Name', 'Phone', 'City', 'Age', 'Intent', 'Verified', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, color: '#666', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#bbb' }}>No users found</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: u.isSuspended ? 0.6 : 1 }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{u.name}</td>
                  <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{u.phone}</td>
                  <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{u.city}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>{u.age}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, background: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                      {u.intent}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ color: u.isVerified ? '#10b981' : '#ef4444', fontSize: 16 }}>{u.isVerified ? '✓' : '✗'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.isSuspended ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '2px 8px', borderRadius: 10 }}>SUSPENDED</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#f0fdf4', padding: '2px 8px', borderRadius: 10 }}>ACTIVE</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#bbb', fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {acting === u.id ? (
                      <span style={{ fontSize: 12, color: '#888' }}>...</span>
                    ) : u.isSuspended ? (
                      <button
                        onClick={() => unsuspend(u.id)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #10b981', color: '#10b981', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmId(u.id)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #ef4444', color: '#ef4444', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Suspend
                      </button>
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
