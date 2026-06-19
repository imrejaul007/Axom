/**
 * Shared admin authentication utilities.
 *
 * RD-CR-02 FIX: Admin key is stored in sessionStorage (cleared on tab close,
 * not persisted across tabs). Not in localStorage (survives restarts).
 * XSS can still read sessionStorage, but the HttpOnly JWT cookie separately
 * gates page access. The key is used only for API calls to rendez-backend.
 */

const SESSION_KEY = 'rendez_admin_key';

export function getAdminKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(SESSION_KEY) ?? '';
}

export function setAdminKey(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, key);
}

export function clearAdminKey(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function authHeader(): HeadersInit {
  return { Authorization: `Bearer ${getAdminKey()}` };
}

/** Safe fetch wrapper — checks res.ok before parsing JSON (RD-H-05 fix) */
export async function safeFetch<T = unknown>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch { /* ignore parse errors */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}
