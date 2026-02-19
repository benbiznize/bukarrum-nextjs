import { createClient } from '@/lib/supabase/server';
import { getTenantMemberships } from '@/lib/auth/get-tenant-memberships';
import { redirect } from 'next/navigation';
import AvailabilityRulesList from './availability-rules-list';
import AvailabilityExceptionsList from './availability-exceptions-list';

export default async function AvailabilityPage() {
  const memberships = await getTenantMemberships();
  if (memberships.length === 0) redirect('/app');
  const tenantId = memberships[0].tenant_id;

  const supabase = await createClient();
  const [{ data: rooms }, { data: rules }, { data: exceptions }] = await Promise.all([
    supabase.from('rooms').select('id, name').eq('tenant_id', tenantId).order('name'),
    supabase
      .from('availability_rules')
      .select('id, room_id, day_of_week, start_time, end_time')
      .eq('tenant_id', tenantId)
      .order('day_of_week'),
    supabase
      .from('availability_exceptions')
      .select('id, room_id, date, is_closed, start_time, end_time')
      .eq('tenant_id', tenantId)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date'),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <section>
        <h2 className="text-lg font-medium mb-2">Recurring rules</h2>
        <AvailabilityRulesList
          tenantId={tenantId}
          rooms={rooms ?? []}
          initialRules={(rules ?? []).map((r) => ({
            ...r,
            start_time: r.start_time?.toString().slice(0, 5) ?? '',
            end_time: r.end_time?.toString().slice(0, 5) ?? '',
          }))}
        />
      </section>
      <section>
        <h2 className="text-lg font-medium mb-2">Exceptions (date-specific)</h2>
        <AvailabilityExceptionsList
          tenantId={tenantId}
          rooms={rooms ?? []}
          initialExceptions={(exceptions ?? []).map((e) => ({
            ...e,
            start_time: e.start_time?.toString().slice(0, 5) ?? null,
            end_time: e.end_time?.toString().slice(0, 5) ?? null,
          }))}
        />
      </section>
    </div>
  );
}
