import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from './env';

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || typeof key !== 'string' || key.trim() === '') {
    throw new Error(
      'Missing or invalid SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local from Supabase Project Settings > API.'
    );
  }
  return createClient(getSupabaseUrl(), key.trim(), { auth: { persistSession: false } });
}
