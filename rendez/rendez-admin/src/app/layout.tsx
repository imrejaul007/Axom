import AdminShell from '@/components/AdminShell';

export const metadata = {
  title: 'Rendez Admin',
  description: 'Rendez moderation and analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
