import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'rendez_admin_session';
const ADMIN_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SESSION_TTL_HOURS = 12;

function base64UrlEncode(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signJwt(key: string, secret: string): Promise<string> {
  const header = base64UrlEncode(new Uint8Array(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_HOURS * 3600;
  const payload = base64UrlEncode(new Uint8Array(JSON.stringify({ key, exp })));

  const sigInput = `${header}.${payload}.${secret}`;
  const sigKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sigBytes = await crypto.subtle.sign('HMAC', sigKey, new TextEncoder().encode(sigInput));
  const sig = base64UrlEncode(new Uint8Array(sigBytes));

  return `${header}.${payload}.${sig}`;
}

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Admin key is required' }, { status: 400 });
    }

    // Verify admin key against the backend API
    const res = await fetch(`${ADMIN_API}/admin/stats`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
    }

    // Sign JWT server-side only — secret never leaves the server
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const token = await signJwt(key, secret);
    const maxAge = SESSION_TTL_HOURS * 3600;

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
