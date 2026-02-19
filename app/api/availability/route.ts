import { createAdminClient } from '@/lib/supabase/admin';
import { generateSlots } from '@/lib/availability/generate-slots';
import { addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get('tenantSlug');
  const roomId = searchParams.get('roomId');
  const serviceId = searchParams.get('serviceId');
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '14', 10) || 14));

  if (!tenantSlug || !roomId || !serviceId) {
    return Response.json(
      { error: 'tenantSlug, roomId, and serviceId are required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const [{ data: tenant }, { data: room }, { data: service }] = await Promise.all([
    admin.from('tenants').select('id, status, timezone').eq('slug', tenantSlug).single(),
    admin.from('rooms').select('id, tenant_id, is_bookable').eq('id', roomId).single(),
    admin.from('services').select('id, tenant_id, is_published').eq('id', serviceId).single(),
  ]);

  if (!tenant || tenant.status !== 'active') {
    return Response.json({ error: 'Tenant not found or inactive' }, { status: 404 });
  }
  if (!room || room.tenant_id !== tenant.id || !room.is_bookable) {
    return Response.json({ error: 'Room not found or not bookable' }, { status: 404 });
  }
  if (!service || service.tenant_id !== tenant.id || !service.is_published) {
    return Response.json({ error: 'Service not found or not published' }, { status: 404 });
  }

  const timezone = tenant.timezone ?? 'America/Santiago';
  const zonedNow = toZonedTime(new Date(), timezone);
  const y = zonedNow.getFullYear(), m = zonedNow.getMonth(), d = zonedNow.getDate();
  const rangeStart = fromZonedTime(new Date(y, m, d, 0, 0, 0), timezone);
  const rangeEnd = addDays(rangeStart, days);
  const dateRangeStart = rangeStart.toISOString();
  const dateRangeEnd = rangeEnd.toISOString();

  const slots = await generateSlots(
    tenant.id,
    timezone,
    roomId,
    serviceId,
    dateRangeStart,
    dateRangeEnd
  );

  return Response.json({ slots });
}
