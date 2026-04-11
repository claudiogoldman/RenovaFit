import type { Metadata } from 'next';
import { ReativacaoAssistant } from '@/components/reativacao-assistant';

export const metadata: Metadata = {
  title: 'Reativação de Ex-Alunos | RenovaFit',
  description:
    'App de IA para recuperar ex-alunos. Entenda por que saíram, remova barreiras e ofereça valor renovado.',
};

export default function ReativacaoPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <span className="inline-block text-sm font-semibold uppercase tracking-widest text-purple-400 mb-4">
            🔄 Reativação
          </span>
          <h1 className="text-5xl font-bold mb-4 text-white">
            Traga ex-alunos de volta
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            Recupere alunos inativos identificando barreiras anteriores e oferecendo soluções renovadas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="rounded-2xl border border-purple-400/20 bg-slate-900/50 p-8">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">📋 Funcionalidades</h2>
            <ul className="space-y-3 text-slate-300">
              <li>✓ Histórico de cancelamento (quanto tempo, motivo)</li>
              <li>✓ Análise de barreiras anteriores</li>
              <li>✓ Propostas de volta ajustadas aos obstáculos</li>
              <li>✓ Incentivos e ofertas personalizadas</li>
              <li>✓ Estratégia de re-engajamento</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-pink-400/20 bg-slate-900/50 p-8">
            <h2 className="text-2xl font-bold mb-4 text-pink-400">🚀 Powered by Gemini</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <p className="text-lg font-semibold text-white">✅ Ao vivo com IA</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Modelo</p>
                <p className="text-slate-300">Google Gemini 1.5 Flash</p>
              </div>
            </div>
          </div>
        </div>

        <ReativacaoAssistant />
      </div>
    </div>
  );
}
