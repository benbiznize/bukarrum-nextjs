import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type TenantMembership = {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  role: string;
};

export async function getTenantMemberships(): Promise<TenantMembership[]> {
  const server = await createClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('tenant_members')
    .select('tenant_id, role, tenants!inner(slug, name)')
    .eq('user_id', user.id);

  if (error) return [];
  const tenantData = (row: { tenants: { slug: string; name: string } | { slug: string; name: string }[] }) =>
    Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
  return (rows ?? []).map((r: { tenant_id: string; role: string; tenants: { slug: string; name: string } | { slug: string; name: string }[] }) => {
    const t = tenantData(r);
    return {
      tenant_id: r.tenant_id,
      tenant_slug: t?.slug ?? '',
      tenant_name: t?.name ?? '',
      role: r.role,
    };
  });
}
