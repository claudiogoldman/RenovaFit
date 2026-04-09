import type { Metadata } from 'next';

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

        <div className="grid md:grid-cols-2 gap-8">
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
            <h2 className="text-2xl font-bold mb-4 text-purple-400">🎯 Estratégia</h2>
            <div className="space-y-3 text-slate-300">
              <p>
                O app analisa contexto do aluno (família, rotina, plano, frequência) e gera uma abordagem adaptada para cada caso.
              </p>
              <p className="font-semibold text-white">
                Modo local: Funciona sem IA, apenas com heurísticas.
              </p>
              <p className="font-semibold text-white">
                Com Gemini: Respostas 100% personalizadas via IA.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-8 rounded-2xl border border-slate-700 bg-slate-900/30">
          <p className="text-slate-400 text-center">
            Este módulo fará parte do ecossistema RenovaFit. Volte em breve para acessar o app completo.
          </p>
        </div>
      </div>
    </div>
  );
}
