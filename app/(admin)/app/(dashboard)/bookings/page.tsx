import { createClient } from '@/lib/supabase/server';
import { getTenantMemberships } from '@/lib/auth/get-tenant-memberships';
import { redirect } from 'next/navigation';
import BookingsList from './bookings-list';

export default async function BookingsPage() {
  const memberships = await getTenantMemberships();
  if (memberships.length === 0) redirect('/app');
  const tenantId = memberships[0].tenant_id;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('bookings')
    .select(`
      id, start_at, end_at, customer_name, customer_email, status, created_at,
      rooms(name),
      services(name)
    `)
    .eq('tenant_id', tenantId)
    .gte('start_at', new Date().toISOString())
    .order('start_at');

  const bookings = (rows ?? []).map((b: {
    id: string;
    start_at: string;
    end_at: string;
    customer_name: string;
    customer_email: string;
    status: string;
    rooms: { name: string } | { name: string }[] | null;
    services: { name: string } | { name: string }[] | null;
  }) => ({
    id: b.id,
    start_at: b.start_at,
    end_at: b.end_at,
    customer_name: b.customer_name,
    customer_email: b.customer_email,
    status: b.status,
    room_name: Array.isArray(b.rooms) ? b.rooms[0]?.name ?? '' : b.rooms?.name ?? '',
    service_name: Array.isArray(b.services) ? b.services[0]?.name ?? '' : b.services?.name ?? '',
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Bookings</h1>
      <BookingsList initialBookings={bookings} />
    </div>
  );
}
