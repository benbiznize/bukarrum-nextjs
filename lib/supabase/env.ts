function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error(
      'Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (e.g. https://your-project.supabase.co).'
    );
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must start with http:// or https://');
  }
  return url.trim();
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || typeof key !== 'string' || key.trim() === '') {
    throw new Error(
      'Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env.local from your Supabase project settings.'
    );
  }
  return key.trim();
}

export { getSupabaseUrl, getSupabaseAnonKey };
