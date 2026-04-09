import type { Metadata } from 'next';
import { RetencaoAssistant } from '@/components/retencao-assistant';

export const metadata: Metadata = {
  title: 'Retenção de Alunos | RenovaFit',
  description:
    'App de IA para reter alunos ativos. Gera estratégias de renovação, diagnóstico de obstáculos e propostas personalizadas.',
};

export default function RetencaoPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <span className="inline-block text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-4">
            💚 Retenção
          </span>
          <h1 className="text-5xl font-bold mb-4 text-white">
            Mantenha seus alunos ativos
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            Identifique barreiras de renovação, crie abordagens personalizadas e negocie com inteligência.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/50 p-8">
            <h2 className="text-2xl font-bold mb-4 text-emerald-400">📋 Funcionalidades</h2>
            <ul className="space-y-3 text-slate-300">
              <li>✓ Perfil completo do aluno (idade, plano, frequência, etc)</li>
              <li>✓ Diagnóstico de obstáculos de renovação</li>
              <li>✓ 4 versões de mensagens (primeira abordagem, follow-up, direta, consultiva)</li>
              <li>✓ Respostas para objeções (preço, tempo, motivação)</li>
              <li>✓ Recomendação de próximo passo</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-purple-400/20 bg-slate-900/50 p-8">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">🚀 Powered by Gemini</h2>
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

        <RetencaoAssistant />
      </div>
    </div>
  );
}
