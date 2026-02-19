import { createClient } from '@/lib/supabase/server';
import { getTenantMemberships } from '@/lib/auth/get-tenant-memberships';
import { redirect } from 'next/navigation';
import RoomsList from './rooms-list';

export default async function RoomsPage() {
  const memberships = await getTenantMemberships();
  if (memberships.length === 0) redirect('/app');
  const tenantId = memberships[0].tenant_id;

  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name, is_bookable')
    .eq('tenant_id', tenantId)
    .order('name');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Rooms</h1>
      <RoomsList tenantId={tenantId} initialRooms={rooms ?? []} />
    </div>
  );
}
