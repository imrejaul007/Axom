'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard' },
  { href: '/coordinator', label: '🌱 Seed Plans' },
  { href: '/plans',       label: 'Plans' },
  { href: '/moderation',  label: 'Moderation' },
  { href: '/users',       label: 'Users' },
  { href: '/gifts',       label: 'Gifts' },
  { href: '/meetups',     label: 'Meetups' },
  { href: '/fraud',       label: 'Fraud Flags' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/login') { setAuthed(true); return; }
    const key = sessionStorage.getItem('rendez_admin_key');
    if (!key) {
      router.replace('/login');
    } else {
      setAuthed(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('rendez_admin_key');
    document.cookie = 'rendez_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    router.replace('/login');
  };

  if (authed === null) return null;
  if (pathname === '/login') return <>{children}</>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: '#1a1a2e', color: '#fff', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>💜</div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Rendez Admin</h2>
        </div>
        <div style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'block', padding: '10px 12px', color: active ? '#fff' : '#9ca3af',
                  textDecoration: 'none', borderRadius: 8, marginBottom: 2,
                  background: active ? 'rgba(124,58,237,0.3)' : 'transparent',
                  fontWeight: active ? 700 : 400, fontSize: 14,
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent', border: '1px solid #374151', color: '#9ca3af',
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, textAlign: 'left',
          }}
        >
          Sign out
        </button>
      </nav>
      <main style={{ flex: 1, padding: 32, background: '#f5f5f5', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
