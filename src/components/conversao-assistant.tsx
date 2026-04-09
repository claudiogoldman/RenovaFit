'use client';

import { useState } from 'react';
import type { LeadProfile } from '@/lib/types';

export function ConversaoAssistant() {
  const [lead, setLead] = useState<LeadProfile>({
    name: '',
    age: '',
    gender: '',
    goal: '',
    availability: '',
    currentActivity: '',
    mainObjection: '',
    notes: '',
  });

  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof LeadProfile, value: string) => {
    setLead((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch('/api/conversao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initial', lead }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao gerar conteúdo');
      }

      setOutput(result.data.messages[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 py-12">
      {/* Formulário */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400">📋 Perfil do Lead</h2>

        <div className="space-y-4">
          {[
            { key: 'name' as const, label: 'Nome', placeholder: 'Ex.: João Silva' },
            { key: 'age' as const, label: 'Idade', placeholder: 'Ex.: 28' },
            { key: 'gender' as const, label: 'Sexo/Gênero', placeholder: 'Ex.: masculino' },
            { key: 'goal' as const, label: 'Objetivo', placeholder: 'Ex.: emagrecer, ganhar força' },
            {
              key: 'availability' as const,
              label: 'Disponibilidade',
              placeholder: 'Ex.: mornings, 3x semana',
            },
            { key: 'currentActivity' as const, label: 'Atividade Atual', placeholder: 'Ex.: sedentário' },
            {
              key: 'mainObjection' as const,
              label: 'Objeção Principal',
              placeholder: 'Ex.: caro, sem tempo',
            },
          ].map(({ key, label, placeholder }) => (
            <label key={key} className="flex flex-col gap-2 text-sm text-slate-200">
              {label}
              <input
                type="text"
                value={lead[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="rounded-lg border border-cyan-400/20 bg-slate-900 px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
              />
            </label>
          ))}

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Notas
            <textarea
              value={lead.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Qualquer detalhe adicional sobre o lead..."
              className="rounded-lg border border-cyan-400/20 bg-slate-900 px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
              rows={3}
            />
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !lead.name || !lead.goal}
          className="w-full rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Gerando...' : 'Gerar Estratégia com Gemini'}
        </button>
      </div>

      {/* Output */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-emerald-400">✨ Resposta IA</h2>

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-900/20 p-4 text-red-200">
            {error}
          </div>
        )}

        {output && (
          <div className="rounded-lg border border-cyan-400/20 bg-slate-900/50 p-6">
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-slate-200">{output}</p>
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/20 transition"
            >
              📋 Copiar Resposta
            </button>
          </div>
        )}

        {!output && !error && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-600 p-12 text-slate-400">
            <p>Preencha o perfil do lead e clique em "Gerar Estratégia" para ver a resposta da IA</p>
          </div>
        )}
      </div>
    </div>
  );
}
