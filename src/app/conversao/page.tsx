import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conversão de Alunos | RenovaFit',
  description:
    'App de IA para converter visitantes e leads em alunos pagantes. Gera perguntas diagnósticas, mensagens personalizadas e respostas para objeções.',
};

export default function ConversaoPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <span className="inline-block text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-4">
            🎯 Conversão
          </span>
          <h1 className="text-5xl font-bold mb-4 text-white">
            Transforme visitantes em alunos
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            Use IA para entender o visitante, fazer perguntas certas e oferecer a solução ideal para cada perfil.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/50 p-8">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">📋 Funcionalidades</h2>
            <ul className="space-y-3 text-slate-300">
              <li>✓ Perguntas diagnósticas baseadas em IA</li>
              <li>✓ Mensagens personalizadas por perfil</li>
              <li>✓ Respostas para objeções comuns</li>
              <li>✓ Integração com WhatsApp</li>
              <li>✓ Histórico de interações</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/50 p-8">
            <h2 className="text-2xl font-bold mb-4 text-emerald-400">🚀 Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Módulo</p>
                <p className="text-lg font-semibold text-white">Em Desenvolvimento</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Próximos Passos</p>
                <p className="text-slate-300">
                  Integração com Gemini AI, banco de dados e API de WhatsApp
                </p>
              </div>
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
