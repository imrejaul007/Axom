'use client';

import { useState, FormEvent } from 'react';

export default function LoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid key');

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Invalid admin key. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f5',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 40, width: 360,
        boxShadow: '0 4px 24px rgba(124,58,237,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💜</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Rendez Admin</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>Enter your admin API key to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin API key"
            required
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1.5px solid #e9d5ff', fontSize: 14, outline: 'none',
              boxSizing: 'border-box', marginBottom: 16,
            }}
          />

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !key}
            style={{
              width: '100%', padding: '13px 0', background: '#7c3aed', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
