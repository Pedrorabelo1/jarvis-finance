import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { getSession } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session.isLoggedIn
    ? { name: session.name || '', email: session.email || '' }
    : null;

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <BottomNav />
      <main className="md:pl-[64px] pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <Header user={user} />
          {children}
        </div>
      </main>
    </div>
  );
}
