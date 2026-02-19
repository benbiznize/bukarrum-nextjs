'use client';

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Handles hash-fragment (implicit) flow only. PKCE code exchange is done
 * server-side in app/auth/callback/route.ts so the code verifier in cookies is available.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get('next') ?? '/app';
    const supabase = createClient();

    const run = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: e } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (e) {
          setError(e.message);
          return;
        }
        router.push(next);
        router.refresh();
        return;
      }

      // Code exchange is handled by GET /auth/callback/exchange route (server); if we reach
      // the client with ?code= (e.g. old link), redirect to the exchange route.
      const code = searchParams.get('code');
      if (code) {
        window.location.href = `/auth/callback/exchange?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
        return;
      }

      setError('No tokens or code found');
    };

    run();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <a href="/app/login" className="underline mt-4 inline-block">Back to login</a>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p>Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
