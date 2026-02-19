'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function cancelBooking(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('bookings').update({ status: 'canceled' }).eq('id', id);
  if (error) throw error;
  revalidatePath('/app/bookings');
}
