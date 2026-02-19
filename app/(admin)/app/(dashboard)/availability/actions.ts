'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addAvailabilityRule(
  tenantId: string,
  payload: { room_id: string | null; day_of_week: number; start_time: string; end_time: string }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('availability_rules')
    .insert({
      tenant_id: tenantId,
      room_id: payload.room_id || null,
      day_of_week: payload.day_of_week,
      start_time: payload.start_time,
      end_time: payload.end_time,
    })
    .select('id, room_id, day_of_week, start_time, end_time')
    .single();
  if (error) throw error;
  revalidatePath('/app/availability');
  return data;
}

export async function deleteAvailabilityRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('availability_rules').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/availability');
}

export async function addAvailabilityException(
  tenantId: string,
  payload: { room_id: string | null; date: string; is_closed: boolean; start_time?: string; end_time?: string }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('availability_exceptions')
    .insert({
      tenant_id: tenantId,
      room_id: payload.room_id || null,
      date: payload.date,
      is_closed: payload.is_closed,
      start_time: payload.start_time ?? null,
      end_time: payload.end_time ?? null,
    })
    .select('id, room_id, date, is_closed, start_time, end_time')
    .single();
  if (error) throw error;
  revalidatePath('/app/availability');
  return data;
}

export async function deleteAvailabilityException(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('availability_exceptions').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/availability');
}
