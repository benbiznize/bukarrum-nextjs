'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    const supabase = createClient();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback/exchange?next=/app` },
    });
    if (error) {
      setStatus('error');
      const isRateLimit =
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('rate_limit');
      setMessage(
        isRateLimit
          ? 'Too many sign-in attempts. Please try again in an hour.'
          : error.message
      );
      return;
    }
    setStatus('success');
    setMessage('Check your email for the sign-in link.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="you@example.com"
          required
          disabled={status === 'loading'}
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Send magic link'}
      </button>
      {message && (
        <p className={status === 'error' ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
          {message}
        </p>
      )}
    </form>
  );
}
