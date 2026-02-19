import { createClient } from '@/lib/supabase/server';
import { getTenantMemberships } from '@/lib/auth/get-tenant-memberships';
import { redirect } from 'next/navigation';
import ServicesList from './services-list';

export default async function ServicesPage() {
  const memberships = await getTenantMemberships();
  if (memberships.length === 0) redirect('/app');
  const tenantId = memberships[0].tenant_id;

  const supabase = await createClient();
  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_minutes, buffer_minutes, price_clp, is_published')
    .eq('tenant_id', tenantId)
    .order('name');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Services</h1>
      <ServicesList tenantId={tenantId} initialServices={services ?? []} />
    </div>
  );
}
