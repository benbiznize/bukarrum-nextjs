'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/app/login');
        router.refresh();
      }}
      className="text-sm text-gray-600 hover:text-gray-900 underline"
    >
      Sign out
    </button>
  );
}
