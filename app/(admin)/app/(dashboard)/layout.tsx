import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/get-user';
import { getTenantMemberships } from '@/lib/auth/get-tenant-memberships';
import LogoutButton from '../logout-button';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect('/app/login');
  }

  const memberships = await getTenantMemberships();
  if (memberships.length === 0) {
    return (
      <div className="p-8">
        <p>No tenant access. Contact your admin.</p>
        <LogoutButton />
      </div>
    );
  }

  const tenant = memberships[0];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-4">
          <Link href="/app" className="font-medium">Dashboard</Link>
          <Link href="/app/rooms">Rooms</Link>
          <Link href="/app/services">Services</Link>
          <Link href="/app/availability">Availability</Link>
          <Link href="/app/bookings">Bookings</Link>
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{tenant.tenant_name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
