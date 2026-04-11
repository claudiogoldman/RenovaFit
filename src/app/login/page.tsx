'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getAppUrl } from '@/lib/app-url';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [team, setTeam] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!supabase) return;
    
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/retencao');
      }
    };

    checkSession();
  }, [supabase, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setError('Configuracao de autenticacao indisponivel.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.replace('/retencao');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              team: team || undefined,
            },
            emailRedirectTo: `${getAppUrl()}/auth/callback`,
          },
        });

        if (signUpError) throw signUpError;
        setMessage('Conta criada com sucesso! Verifique seu email se solicitado. Você pode fazer login agora.');
        setEmail('');
        setPassword('');
        setFullName('');
        setTeam('');
        setMode('signin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de autenticacao');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-12">
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            RenovaFit
          </span>
        </Link>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="text-slate-400">
              {mode === 'signin'
                ? 'Acesse sua carteira de retenção'
                : 'Comece a reter alunos com IA'}
            </p>
          </div>

          {/* Errors and Success */}
          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-900/20 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-900/20 p-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50 transition-colors"
              placeholder="seu.email@exemplo.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* Signup fields */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50 transition-colors"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Equipe <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50 transition-colors"
                  placeholder="Ex: Atendimento Rio"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email || !password || (mode === 'signup' && !fullName)}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 font-semibold text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading
              ? mode === 'signin'
                ? 'Entrando...'
                : 'Criando conta...'
              : mode === 'signin'
              ? 'Entrar'
              : 'Criar conta'}
          </button>

          {/* Toggle mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setMessage(null);
              }}
              disabled={loading}
              className="text-sm text-cyan-300 hover:text-cyan-200 disabled:opacity-50 transition-colors"
            >
              {mode === 'signin'
                ? 'Não tem conta? Criar agora'
                : 'Já tem conta? Entrar'}
            </button>
          </div>
        </form>

        {/* Back to home */}
        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
            ← Voltar para home
          </Link>
        </div>
      </div>
    </div>
  );
}