'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

/**
 * Handles Supabase email-confirmation redirects.
 *
 * Flow (implicit grant, default for @supabase/supabase-js v2):
 *   1. User clicks the confirmation link in their inbox.
 *   2. Supabase redirects to  <APP_URL>/auth/callback#access_token=...&type=signup
 *   3. The Supabase JS client automatically parses the hash and fires SIGNED_IN.
 *   4. This page listens for that event and forwards the user to /retencao.
 *
 * Security notes:
 *  - Never log the access_token from the URL.
 *  - After the session is established the client removes the hash from the URL.
 *  - Old confirmation links generated before this fix pointed to localhost; they
 *    should be treated as expired and users asked to request a new link.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Confirmando acesso...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setMessage('Configuração de autenticação indisponível.');
      setIsError(true);
      return;
    }

    const searchParams = new window.URLSearchParams(window.location.search);
    const hashFragment = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new window.URLSearchParams(hashFragment);
    const errorDescription =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error');

    if (errorDescription) {
      setMessage('Link de confirmação inválido ou expirado. Solicite um novo link e tente novamente.');
      setIsError(true);
      return;
    }

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setMessage('Não foi possível confirmar a sessão automaticamente. Solicite um novo link de acesso.');
      setIsError(true);
    }, 8000);

    // Supabase v2 parses the hash automatically on client init.
    // Listen for the resulting SIGNED_IN event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.clearTimeout(timeoutId);
        router.replace('/retencao');
        return;
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        window.clearTimeout(timeoutId);
        router.replace('/retencao');
        return;
      }
    });

    // Also handle the case where the session is already established
    // (e.g., user opened the link in a tab where they were already signed in).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !timedOut) {
        window.clearTimeout(timeoutId);
        router.replace('/retencao');
      }
    });

    return () => {
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        {!isError && (
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        )}
        <p className={`text-sm ${isError ? 'text-rose-400' : 'text-slate-300'}`}>{message}</p>
        {isError && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <a href="/retencao" className="text-xs text-emerald-400 underline">
              Voltar para o início
            </a>
            <a href="/retencao" className="text-xs text-slate-400 underline">
              Solicitar novo link de confirmação
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
