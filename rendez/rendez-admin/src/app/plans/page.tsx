'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authHeader, safeFetch } from '../../lib/adminAuth';

const ADMIN_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#7c3aed', FILLED: '#059669', CANCELLED: '#ef4444',
  COMPLETED: '#2563eb', EXPIRED: '#d97706', NO_SHOW: '#6b7280',
};

// RD-L-13 FIX: Custom cancel-reason modal replaces browser prompt().
// browser prompt() is synchronous and blocks the event loop, causing UX and
// accessibility issues. The modal approach is also XSS-safe — user input is not
// executed as script.
function CancelModal({ title, onConfirm, onClose }: { title: string; onConfirm: (r: string) => void; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputRef.current?.value.trim();
    if (val) onConfirm(val);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: 400, maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 17, fontWeight: 800 }}>
          Cancel Plan
        </h3>
        <p style={{ margin: '0 0 16px', color: '#666', fontSize: 13, lineHeight: 1.5 }}>
          Reason for cancelling &ldquo;{title}&rdquo;:
        </p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            style={{
              width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db',
              borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', marginBottom: 14,
            }}
            placeholder="e.g. Merchant unavailable"
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#666' }}>
              Back
            </button>
            <button type="submit"
              style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              Confirm Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Plan {
  id: string;
  title: string;
  category: string;
  merchantName: string;
  city: string;
  status: string;
  scheduledAt: string;
  createdAt: string;
  verifiedOnly: boolean;
  applicantCount: number;
  organizer: { name: string; phone: string; isVerified: boolean };
  _count: { applications: number; confirmations: number };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter
        ? `${ADMIN_API}/admin/plans?status=${statusFilter}`
        : `${ADMIN_API}/admin/plans`;
      const data = await safeFetch<Plan[]>(url, { headers: authHeader() });
      setPlans(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleCancelConfirm = async (plan: Plan, reason: string) => {
    setCancelTarget(null);
    setCancelling(plan.id);
    try {
      await safeFetch(`${ADMIN_API}/admin/plans/${plan.id}/cancel`, {
        method: 'PATCH',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      loadPlans();
    } catch (e: unknown) {
      // RD-L-13: Sanitize error message — strip HTML tags and truncate to prevent XSS
      const raw = e instanceof Error ? e.message : 'Unknown error';
      const safe = raw.replace(/<[^>]*>/g, '').slice(0, 200);
      alert(`Cancel failed: ${safe}`);
    } finally {
      setCancelling(null);
    }
  };

  const STATUSES = ['', 'OPEN', 'FILLED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'NO_SHOW'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Plans</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e9d5ff', fontSize: 13 }}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading plans…</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#faf5ff', borderBottom: '1px solid #f0e6ff' }}>
                {['Title', 'Category', 'Merchant', 'City', 'Organizer', 'Status', 'Date', 'Apps / Confirms', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#7c3aed', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1a2e', maxWidth: 180 }}>
                    {p.title}
                    {p.verifiedOnly && <span style={{ marginLeft: 6, fontSize: 10, background: '#f0e6ff', color: '#7c3aed', padding: '2px 6px', borderRadius: 4 }}>Verified Only</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#555' }}>{p.category}</td>
                  <td style={{ padding: '12px 16px', color: '#555' }}>{p.merchantName}</td>
                  <td style={{ padding: '12px 16px', color: '#555' }}>{p.city}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{p.organizer.name}</span>
                    {p.organizer.isVerified && <span style={{ color: '#7c3aed', marginLeft: 4 }}>✓</span>}
                    <div style={{ fontSize: 11, color: '#888' }}>{p.organizer.phone}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: (STATUS_COLOR[p.status] || '#888') + '20',
                      color: STATUS_COLOR[p.status] || '#888',
                      padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11,
                    }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#555', whiteSpace: 'nowrap' }}>
                    {new Date(p.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#555', textAlign: 'center' }}>
                    {p._count.applications} / {p._count.confirmations}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.status !== 'CANCELLED' && p.status !== 'COMPLETED' && (
                      <button
                        onClick={() => setCancelTarget(p)}
                        disabled={cancelling === p.id}
                        style={{
                          background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {cancelling === p.id ? '…' : 'Cancel'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plans.length === 0 && (
            <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>No plans found</p>
          )}
        </div>
      )}

      {/* RD-L-13 FIX: Custom modal replaces browser prompt() for cancel reason input. */}
      {cancelTarget && (
        <CancelModal
          title={cancelTarget.title}
          onConfirm={(reason) => handleCancelConfirm(cancelTarget, reason)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
