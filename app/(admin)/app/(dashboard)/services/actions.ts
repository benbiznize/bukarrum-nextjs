'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addService(
  tenantId: string,
  payload: { name: string; duration_minutes: number; buffer_minutes: number; price_clp: number; is_published: boolean }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      duration_minutes: payload.duration_minutes,
      buffer_minutes: payload.buffer_minutes,
      price_clp: payload.price_clp,
      is_published: payload.is_published,
    })
    .select('id, name, duration_minutes, buffer_minutes, price_clp, is_published')
    .single();
  if (error) throw error;
  revalidatePath('/app/services');
  return data;
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/services');
}
