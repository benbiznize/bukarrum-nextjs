import { createAdminClient } from '@/lib/supabase/admin';

export async function checkConflict(
  roomId: string,
  startAt: string,
  endAt: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('room_id', roomId)
    .eq('status', 'confirmed')
    .lt('start_at', endAt)
    .gt('end_at', startAt)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
