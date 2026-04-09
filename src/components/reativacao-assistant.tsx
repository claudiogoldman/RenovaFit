'use client';

import { useEffect, useRef, useState } from 'react';
import type { ExStudentProfile } from '@/lib/types';
import { AIFormattedResponse } from '@/components/ai-formatted-response';
import { usePersistedState } from '@/hooks/use-persisted-state';

export function ReativacaoAssistant() {
  const [exStudent, setExStudent] = usePersistedState<ExStudentProfile>('renovafit:reativacao:exStudent', {
    name: '',
    age: '',
    cancelledWhen: '',
    cancelReason: '',
    lastPlan: '',
    tenure: '',
    mainObjection: '',
    notes: '',
  });

  const [output, setOutput] = usePersistedState<string | null>('renovafit:reativacao:output', null);
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

  const handleChange = (field: keyof ExStudentProfile, value: string) => {
    setExStudent((prev) => ({ ...prev, [field]: value }));
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
      const response = await fetch('/api/reativacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'strategy', exStudent }),
        signal: abortController.signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao gerar estratégia');
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
        <h2 className="text-2xl font-bold text-purple-400">📋 Perfil do Ex-Aluno</h2>

        <div className="space-y-4">
          {[
            { key: 'name' as const, label: 'Nome', placeholder: 'Ex.: Carlos' },
            { key: 'age' as const, label: 'Idade', placeholder: 'Ex.: 45' },
            { key: 'tenure' as const, label: 'Tempo de Casa', placeholder: 'Ex.: 1 ano e 6 meses' },
            {
              key: 'cancelledWhen' as const,
              label: 'Quando Cancelou',
              placeholder: 'Ex.: há 3 meses',
            },
            { key: 'lastPlan' as const, label: 'Último Plano', placeholder: 'Ex.: plano anual' },
            {
              key: 'mainObjection' as const,
              label: 'Motivo Principal do Adeus',
              placeholder: 'Ex.: mudou de cidade, sem tempo',
            },
          ].map(({ key, label, placeholder }) => (
            <label key={key} className="flex flex-col gap-2 text-sm text-slate-200">
              {label}
              <input
                type="text"
                value={exStudent[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="rounded-lg border border-purple-400/20 bg-slate-900 px-4 py-2 text-white focus:border-purple-400 focus:outline-none"
              />
            </label>
          ))}

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Contexto e Notas
            <textarea
              value={exStudent.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="O que funcionava? Como era a experiência? Seu estado atual?"
              className="rounded-lg border border-purple-400/20 bg-slate-900 px-4 py-2 text-white focus:border-purple-400 focus:outline-none"
              rows={3}
            />
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !exStudent.name || !exStudent.cancelReason}
          className="w-full rounded-lg bg-purple-500 px-6 py-3 font-semibold text-slate-950 hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Gerando...' : 'Gerar Estratégia de Reativação'}
        </button>

        {loading && (
          <div className="rounded-lg border border-purple-400/20 bg-purple-400/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-purple-200">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-transparent" />
                <span className="text-sm">Gerando estratégia... {elapsedSeconds}s</span>
              </div>
              <button
                onClick={handleCancelGeneration}
                className="rounded-md border border-purple-300/30 bg-slate-900 px-3 py-1 text-xs font-semibold text-purple-200 hover:bg-slate-800"
              >
                Interromper
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Output */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-pink-400">✨ Estratégia IA</h2>

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-900/20 p-4 text-red-200">
            {error}
          </div>
        )}

        {output && (
          <div className="rounded-lg border border-purple-400/20 bg-slate-900/50 p-6">
            <AIFormattedResponse content={output} />

            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="mt-4 rounded-lg border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-300 hover:bg-purple-400/20 transition"
            >
              📋 Copiar Estratégia
            </button>

          </div>
        )}

        {!output && !error && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-600 p-12 text-slate-400">
            <p>Preencha o perfil do ex-aluno e clique em "Gerar Estratégia" para ver a resposta da IA</p>
          </div>
        )}
      </div>
    </div>
  );
}
