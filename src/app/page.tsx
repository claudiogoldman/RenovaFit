import Link from 'next/link';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { AppLogo } from '@/components/layout/AppLogo';

export const metadata: Metadata = {
  title: 'RenovaFit | IA para Retenção de Alunos',
  description: 'Ecossistema de IA para academias: Conversão, Retenção e Reativação',
};

export default async function Home() {
  let user = null;
  
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // User not authenticated
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Header with login/signup buttons */}
      <div className="fixed top-0 left-0 right-0 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <AppLogo size="md" priority />
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/retencao"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all"
              >
                Ir para o sistema
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-20">
        <div className="text-center mb-12">
          <div className="mb-4 flex justify-center">
            <AppLogo size="lg" priority />
          </div>
          <p className="text-xl text-slate-300">
            Ecossistema de IA para academias: Conversão, Retenção e Reativação
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversão */}
          <Link
            href="/conversao"
            className="group relative p-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 to-slate-800 hover:border-cyan-400/50 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2 text-cyan-400">🎯 Conversão</h2>
              <p className="text-slate-400 mb-4">
                Atenda alunos novos com perguntas diagnósticas, mensagens personalizadas e respostas para objeções
              </p>
              <div className="text-sm text-cyan-300 font-semibold">
                Acessar App →
              </div>
            </div>
          </Link>

          {/* Retenção */}
          <Link
            href="/retencao"
            className="group relative p-8 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-slate-900 to-slate-800 hover:border-emerald-400/50 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2 text-emerald-400">💚 Retenção</h2>
              <p className="text-slate-400 mb-4">
                Mantenha alunos ativos com estratégias de renovação, diagnóstico de obstáculos e propostas personalizadas
              </p>
              <div className="text-sm text-emerald-300 font-semibold">
                Acessar App →
              </div>
            </div>
          </Link>

          {/* Reativação */}
          <Link
            href="/reativacao"
            className="group relative p-8 rounded-2xl border border-purple-400/20 bg-gradient-to-br from-slate-900 to-slate-800 hover:border-purple-400/50 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2 text-purple-400">🔄 Reativação</h2>
              <p className="text-slate-400 mb-4">
                Recupere ex-alunos entendendo por que saíram, removendo barreiras e oferecendo valor renovado
              </p>
              <div className="text-sm text-purple-300 font-semibold">
                Acessar App →
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/como-usar"
            className="group relative p-8 rounded-2xl border border-slate-600/50 bg-gradient-to-br from-slate-800 to-slate-900 hover:border-slate-400/50 transition-all duration-300 max-w-xl"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 text-center">
              <h2 className="text-2xl font-bold mb-2 text-slate-200">📖 Como usar</h2>
              <p className="text-slate-400">
                Guia completo: jornada do sistema do primeiro acesso até a renovação do aluno
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-slate-700 bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-3">📋 Sobre o RenovaFit</h3>
          <p className="text-slate-300 leading-relaxed">
            RenovaFit é um ecossistema de IA projetado para ajudar academias a lidar com três momentos críticos no ciclo de vida do aluno:
            <strong className="block mt-2">Conversão:</strong> transformar visitantes e leads em alunos pagantes
            <strong className="block mt-2">Retenção:</strong> manter alunos ativos durante o período de renovação
            <strong className="block mt-2">Reativação:</strong> trazer de volta ex-alunos que cancelaram ou pararam de frequentar
          </p>
        </div>
      </div>
    </div>
  );
}
