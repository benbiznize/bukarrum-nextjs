import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Server-side auth callback for PKCE flow.
 * Exchanges the auth code for a session using the code verifier from request cookies.
 * Required for SSR: the code verifier is stored in cookies by createBrowserClient
 * when the flow starts; only the server can read those cookies on the redirect request.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/app';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const redirectUrl = new URL('/app/login', requestUrl.origin);
      redirectUrl.searchParams.set('error', error.message);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/app/login', requestUrl.origin));
}
