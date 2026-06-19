import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// RZ-A-C2 FIX: Server-side route protection via JWT session cookie.
// Without this, all admin pages are publicly accessible via direct URL.
// The client-side sessionStorage check in layout.tsx only fires after hydration —
// middleware blocks unauthenticated access before any JS executes.

const SESSION_COOKIE = 'rendez_admin_session';
// RD-HIGH-03 FIX: Removed NEXT_PUBLIC_DEV_MODE fallback.
// NEXT_PUBLIC_* vars are client-accessible and must not gate server-side auth secrets.
// ADMIN_JWT_SECRET is now required unconditionally.
if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET environment variable is required. Set it in your .env.local file.');
}
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

function base64UrlEncode(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = s + '=='.slice(0, (4 - s.length % 4) % 4);
  return atob(padded);
}

async function verifyJwt(token: string, secret: string): Promise<{ valid: boolean }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const [headerB64, payloadB64, signatureB64] = parts;
    const sigInput = `${headerB64}.${payloadB64}.${secret}`;

    // Compute HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sigInput));
    const expectedSig = base64UrlEncode(new Uint8Array(sigBytes));

    // Constant-time comparison — prevent timing oracle
    let diff = 0;
    const actualBytes = new TextEncoder().encode(signatureB64);
    const expectedBytes = new TextEncoder().encode(expectedSig);
    if (actualBytes.length !== expectedBytes.length) return { valid: false };
    for (let i = 0; i < actualBytes.length; i++) {
      diff |= actualBytes[i] ^ expectedBytes[i];
    }
    if (diff !== 0) return { valid: false };

    // Check expiry
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return { valid: false };
    }

    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const result = await verifyJwt(token!, ADMIN_JWT_SECRET!);

  if (!result.valid) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
