'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addRoom(tenantId: string, name: string, isBookable: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rooms')
    .insert({ tenant_id: tenantId, name, is_bookable: isBookable })
    .select('id, name, is_bookable')
    .single();
  if (error) throw error;
  revalidatePath('/app/rooms');
  return data;
}

export async function deleteRoom(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/app/rooms');
}
