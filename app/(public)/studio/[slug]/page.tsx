import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BookingForm from './booking-form';

type Props = { params: Promise<{ slug: string }> };

export default async function StudioPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  let t: { id: string; slug: string; name: string; timezone: string | null } | null = null;
  const { data: fromView } = await supabase
    .from('public_tenants')
    .select('id, slug, name, timezone')
    .eq('slug', slug)
    .single();
  if (fromView) {
    t = fromView;
  } else {
    const { data: fromTable } = await supabase
      .from('tenants')
      .select('id, slug, name, timezone')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();
    t = fromTable;
  }
  if (!t) notFound();

  const [{ data: rooms }, { data: services }] = await Promise.all([
    supabase.from('rooms').select('id, name, is_bookable').eq('tenant_id', t.id).eq('is_bookable', true),
    supabase.from('services').select('id, name, duration_minutes, price_clp').eq('tenant_id', t.id).eq('is_published', true),
  ]);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">{t.name}</h1>
      <p className="text-gray-600 mb-6">Book a session</p>
      <BookingForm
        tenantSlug={t.slug}
        tenantName={t.name}
        tenantTimezone={t.timezone ?? 'America/Santiago'}
        rooms={rooms ?? []}
        services={services ?? []}
      />
    </main>
  );
}
