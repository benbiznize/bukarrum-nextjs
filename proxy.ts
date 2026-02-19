import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/app/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);

    // Allow /app/login through without auth so the login page can render (avoids redirect loop)
    if (pathname === '/app/login') {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              response.cookies.set(name, value)
            );
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/app/login', request.url));
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
