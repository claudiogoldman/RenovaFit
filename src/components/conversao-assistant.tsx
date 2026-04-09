'use client';

import { useEffect, useRef, useState } from 'react';
import type { LeadProfile } from '@/lib/types';
import { AIFormattedResponse } from '@/components/ai-formatted-response';
import { usePersistedState } from '@/hooks/use-persisted-state';

export function ConversaoAssistant() {
  const genderOptions = ['Masculino', 'Feminino', 'Nao-binario', 'Prefere nao informar'];
  const goalOptions = [
    'Emagrecer',
    'Ganhar massa muscular',
    'Melhorar condicionamento',
    'Saude e bem-estar',
    'Reabilitacao',
    'Qualidade de vida',
  ];

  const [lead, setLead] = usePersistedState<LeadProfile>('renovafit:conversao:lead', {
    name: '',
    age: '',
    gender: '',
    goal: '',
    availability: '',
    currentActivity: '',
    mainObjection: '',
    notes: '',
  });

  const [output, setOutput] = usePersistedState<string | null>('renovafit:conversao:output', null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);

  const handleChange = (field: keyof LeadProfile, value: string) => {
    setLead((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (loading) {
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setElapsedSeconds(0);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch('/api/conversao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initial', lead }),
        signal: abortController.signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao gerar conteúdo');
      }

      setOutput(result.data.messages[0]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Geracao interrompida.');
        return;
      }
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 py-12">
      {/* Formulário */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400">📋 Perfil do Lead</h2>

        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Sexo/Gênero
            <select
              value={lead.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="rounded-lg border border-cyan-400/20 bg-slate-900 px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">Selecione</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Objetivo
            <select
              value={lead.goal}
              onChange={(e) => handleChange('goal', e.target.value)}
              className="rounded-lg border border-cyan-400/20 bg-slate-900 px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">Selecione</option>
              {goalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {[
            { key: 'name' as const, label: 'Nome', placeholder: 'Ex.: João Silva' },
            { key: 'age' as const, label: 'Idade', placeholder: 'Ex.: 28' },
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

        {loading && (
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-cyan-200">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                <span className="text-sm">Gerando resposta... {elapsedSeconds}s</span>
              </div>
              <button
                onClick={handleCancelGeneration}
                className="rounded-md border border-cyan-300/30 bg-slate-900 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-slate-800"
              >
                Interromper
              </button>
            </div>
          </div>
        )}
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
            <AIFormattedResponse content={output} />

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
