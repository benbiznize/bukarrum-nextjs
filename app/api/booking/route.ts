import { createAdminClient } from '@/lib/supabase/admin';
import { checkConflict } from '@/lib/booking/check-conflict';
import { sendConfirmation } from '@/lib/email/send-confirmation';
import { bookingSchema } from '@/lib/validate/booking';
import { addMinutes } from 'date-fns';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { tenantSlug, roomId, serviceId, startAt, customerName, customerEmail, customerPhone, notes } =
    parsed.data;
  const admin = createAdminClient();

  const [{ data: tenant }, { data: room }, { data: service }] = await Promise.all([
    admin.from('tenants').select('id, name, status, timezone').eq('slug', tenantSlug).single(),
    admin.from('rooms').select('id, tenant_id, name, is_bookable').eq('id', roomId).single(),
    admin.from('services').select('id, tenant_id, name, duration_minutes, buffer_minutes, is_published').eq('id', serviceId).single(),
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

  const endAt = addMinutes(
    new Date(startAt),
    service.duration_minutes + (service.buffer_minutes ?? 0)
  );

  const hasConflict = await checkConflict(roomId, startAt, endAt.toISOString());
  if (hasConflict) {
    return Response.json({ error: 'This slot is no longer available' }, { status: 409 });
  }

  const { data: booking, error: insertError } = await admin
    .from('bookings')
    .insert({
      tenant_id: tenant.id,
      room_id: roomId,
      service_id: serviceId,
      start_at: startAt,
      end_at: endAt.toISOString(),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone ?? null,
      notes: notes ?? null,
      status: 'confirmed',
    })
    .select('id')
    .single();

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const emailResult = await sendConfirmation({
    tenantName: tenant.name,
    timezone: tenant.timezone ?? 'America/Santiago',
    customerEmail,
    customerName,
    roomName: room.name,
    serviceName: service.name,
    startAt,
    endAt: endAt.toISOString(),
  });
  if (!emailResult.sent) {
    console.error('Send confirmation email failed:', emailResult.error);
  }

  return Response.json({
    id: booking.id,
    start: startAt,
    end: endAt.toISOString(),
    roomName: room.name,
    serviceName: service.name,
    emailSent: emailResult.sent,
  });
}
