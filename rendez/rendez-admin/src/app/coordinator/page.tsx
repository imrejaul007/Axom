'use client';

/**
 * Coordinator Tool
 *
 * Allows Rendez coordinators to seed Plans on behalf of venue partners
 * without installing the app. Solves the cold-start liquidity problem:
 * when the app launches in a new city, coordinators can pre-fill the
 * Plans feed so new users don't see an empty screen.
 *
 * Each coordinator gets a dedicated profile auto-created by the backend
 * (keyed by phone number, marked as verified, female for feed boost).
 */

import { useState, useEffect, useRef } from 'react';

import { authHeader, safeFetch } from '../../lib/adminAuth';

// RD-L-13 FIX: Custom cancel-reason modal replaces browser prompt().
// browser prompt() is synchronous, blocking, and inaccessible. The modal approach is
// XSS-safe — user input is never executed as script.
function CancelModal({ onConfirm, onClose }: { onConfirm: (r: string) => void; onClose: () => void }) {
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
        <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 17, fontWeight: 800 }}>Cancel Plan</h3>
        <p style={{ margin: '0 0 16px', color: '#666', fontSize: 13, lineHeight: 1.5 }}>
          Reason for cancellation:
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

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const CATEGORIES = [
  'DINNER', 'LUNCH', 'BREAKFAST', 'BRUNCH', 'SPA', 'SALON',
  'SHOPPING', 'BADMINTON', 'SPORTS', 'GAMING',
];

const VIBES = [
  'Chill & Easy', 'Adventurous', 'Foodie Special', 'Active & Fun',
  'Romantic Evening', 'Casual Hangout', 'Something New',
];

interface CoordinatorPlan {
  id: string;
  title: string;
  category: string;
  city: string;
  merchantName: string;
  scheduledAt: string;
  status: string;
  organizer: { name: string; phone: string };
  _count: { applications: number };
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#059669', FILLED: '#2563eb', COMPLETED: '#7c3aed',
  CANCELLED: '#ef4444', EXPIRED: '#9ca3af', NO_SHOW: '#f59e0b',
};

export default function CoordinatorPage() {
  const [plans, setPlans]         = useState<CoordinatorPlan[]>([]);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null); // planId being cancelled

  const [form, setForm] = useState({
    organizerPhone: '',
    organizerName:  '',
    title:          '',
    category:       'DINNER',
    city:           '',
    merchantName:   '',
    scheduledAt:    '',
    expiresAt:      '',
    maxApplicants:  5,
    vibe:           '',
    description:    '',
    verifiedOnly:   false,
  });

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await safeFetch<{ plans: CoordinatorPlan[] }>(
        `${API}/admin/coordinator/plans${cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : ''}`,
        { headers: authHeader() },
      );
      setPlans(data.plans || []);
    } catch (e: unknown) {
      setMsg(`❌ Failed to load plans: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadPlans(); }, [cityFilter]);

  const handleChange = (key: string, value: string | number | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      const data = await safeFetch<{ plan: { id: string; title: string } }>(
        `${API}/admin/coordinator/create-plan`,
        { method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(form) },
      );
      setMsg(`✅ Plan created: "${data.plan.title}" (ID: ${data.plan.id})`);
      setForm((f) => ({ ...f, title: '', description: '', vibe: '', merchantName: '' }));
      loadPlans();
    } catch (err: unknown) {
      // RD-L-13: Sanitize error — strip HTML and truncate to prevent XSS via error messages
      const raw = err instanceof Error ? err.message : 'Unknown error';
      const safe = raw.replace(/<[^>]*>/g, '').slice(0, 200);
      setMsg(`❌ Error: ${safe}`);
    } finally { setSubmitting(false); }
  };

  // RD-L-13 FIX: Replaced browser prompt() with a custom modal — see CancelModal component above.
  const handleCancelConfirm = async (planId: string, reason: string) => {
    setCancelTarget(null);
    try {
      await safeFetch(`${API}/admin/plans/${planId}/cancel`, {
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
    }
  };

  // Auto-set expiresAt to scheduledAt + 24h when scheduledAt changes
  const handleScheduledAt = (val: string) => {
    handleChange('scheduledAt', val);
    if (val) {
      const exp = new Date(new Date(val).getTime() + 24 * 3600 * 1000);
      handleChange('expiresAt', exp.toISOString().slice(0, 16));
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>
        Coordinator Tool
      </h1>
      <p style={{ color: '#666', marginBottom: 28, fontSize: 14 }}>
        Seed Plans for launch cities. Each coordinator phone creates a verified profile automatically.
        Female organiser profile → 2× feed boost.
      </p>

      {/* ─── Create form ─── */}
      <div style={card}>
        <h2 style={sectionTitle}>Create a Seeded Plan</h2>
        <form onSubmit={handleSubmit}>
          <div style={grid2}>
            <Field label="Coordinator phone *">
              <input style={inp} placeholder="+91..." value={form.organizerPhone}
                onChange={(e) => handleChange('organizerPhone', e.target.value)} required />
            </Field>
            <Field label="Coordinator display name">
              <input style={inp} placeholder="Priya (Coordinator)" value={form.organizerName}
                onChange={(e) => handleChange('organizerName', e.target.value)} />
            </Field>
          </div>

          <div style={grid2}>
            <Field label="Plan title *">
              <input style={inp} placeholder="Dinner at this amazing rooftop..." value={form.title}
                onChange={(e) => handleChange('title', e.target.value)} required />
            </Field>
            <Field label="Category *">
              <select style={inp} value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div style={grid2}>
            <Field label="City *">
              <input style={inp} placeholder="Bangalore" value={form.city}
                onChange={(e) => handleChange('city', e.target.value)} required />
            </Field>
            <Field label="Venue / Merchant name">
              <input style={inp} placeholder="The Sky Garden, Indiranagar" value={form.merchantName}
                onChange={(e) => handleChange('merchantName', e.target.value)} />
            </Field>
          </div>

          <div style={grid2}>
            <Field label="Date & Time *">
              <input style={inp} type="datetime-local" value={form.scheduledAt}
                onChange={(e) => handleScheduledAt(e.target.value)} required />
            </Field>
            <Field label="Applications close">
              <input style={inp} type="datetime-local" value={form.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)} required />
            </Field>
          </div>

          <div style={grid2}>
            <Field label="Max applicants">
              <input style={inp} type="number" min={1} max={20} value={form.maxApplicants}
                onChange={(e) => handleChange('maxApplicants', Number(e.target.value))} />
            </Field>
            <Field label="Vibe tag">
              <select style={inp} value={form.vibe}
                onChange={(e) => handleChange('vibe', e.target.value)}>
                <option value="">None</option>
                {VIBES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea style={{ ...inp, height: 72, resize: 'vertical' }}
              placeholder="Tell applicants what to expect..." value={form.description}
              onChange={(e) => handleChange('description', e.target.value)} />
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 16px', fontSize: 14, color: '#444', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.verifiedOnly}
              onChange={(e) => handleChange('verifiedOnly', e.target.checked)} />
            Verified users only (REZ-verified profiles)
          </label>

          {msg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14,
              background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
              color: msg.startsWith('✅') ? '#059669' : '#dc2626', fontSize: 13 }}>
              {msg}
            </div>
          )}

          <button type="submit" disabled={submitting}
            style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Creating…' : 'Create Plan →'}
          </button>
        </form>
      </div>

      {/* ─── Existing coordinator plans ─── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={sectionTitle}>Coordinator Plans</h2>
          <input style={{ ...inp, width: 180, margin: 0 }} placeholder="Filter by city…"
            value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
        </div>

        {loading ? (
          <p style={{ color: '#888' }}>Loading…</p>
        ) : plans.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: 32 }}>No seeded plans yet. Create one above ↑</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Title', 'Category', 'City', 'Venue', 'Organiser', 'Date', 'Apps', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={td}>{p.title}</td>
                  <td style={td}>{p.category}</td>
                  <td style={td}>{p.city}</td>
                  <td style={td}>{p.merchantName}</td>
                  <td style={td}><span style={{ color: '#666' }}>{p.organizer.name}</span><br /><span style={{ color: '#9ca3af', fontSize: 11 }}>{p.organizer.phone}</span></td>
                  <td style={td}>{new Date(p.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#7c3aed' }}>{p._count.applications}</td>
                  <td style={td}>
                    <span style={{ background: (STATUS_COLORS[p.status] || '#9ca3af') + '20',
                      color: STATUS_COLORS[p.status] || '#9ca3af',
                      padding: '2px 8px', borderRadius: 10, fontWeight: 700, fontSize: 11 }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={td}>
                    {p.status === 'OPEN' && (
                      <button onClick={() => setCancelTarget(p.id)}
                        disabled={cancelTarget !== null}
                        style={{ background: 'transparent', border: '1px solid #fca5a5', color: '#ef4444',
                          borderRadius: 6, padding: '4px 10px', cursor: cancelTarget !== null ? 'default' : 'pointer',
                          opacity: cancelTarget !== null ? 0.5 : 1, fontSize: 12 }}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* RD-L-13 FIX: Custom modal replaces browser prompt() for cancel reason input. */}
      {cancelTarget && (
        <CancelModal
          onConfirm={(reason) => handleCancelConfirm(cancelTarget, reason)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff',
};

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 28,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16, fontWeight: 800, color: '#1a1a2e', margin: '0 0 16px',
};

const grid2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
};

const td: React.CSSProperties = {
  padding: '10px 12px', color: '#374151', verticalAlign: 'middle',
};
