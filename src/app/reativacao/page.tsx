import type { Metadata } from 'next';

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

        <div className="grid md:grid-cols-2 gap-8">
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
            <h2 className="text-2xl font-bold mb-4 text-pink-400">💡 Diferencial</h2>
            <div className="space-y-3 text-slate-300">
              <p>
                A reativação é diferente da retenção porque precisa entender <strong>por que</strong> o aluno saiu.
              </p>
              <p>
                Não é apenas renovacao de contrato; é <strong>recuperação estratégica</strong> baseada no histórico.
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
