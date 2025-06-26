import SideNav from '@/app/ui/dashboard/sidenav';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/login');
    }
    
    return (
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="w-full flex-none md:w-64">
          <SideNav />
        </div>
        <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard layout error:', error);
    redirect('/login');
  }
}