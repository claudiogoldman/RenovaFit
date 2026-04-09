'use client';

import { useState } from 'react';
import { usePersistedState } from '@/hooks/use-persisted-state';

type WhatsAppSendPanelProps = {
  message: string;
  storageKey: string;
  accentClassName: string;
};

export function WhatsAppSendPanel({ message, storageKey, accentClassName }: WhatsAppSendPanelProps) {
  const [phone, setPhone] = usePersistedState<string>(`${storageKey}:phone`, '');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setSending(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Erro ao enviar mensagem');
      }

      setStatus('Mensagem enviada com sucesso no WhatsApp.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <h3 className={`text-sm font-semibold ${accentClassName}`}>Enviar no WhatsApp</h3>
      <p className="mt-1 text-xs text-slate-400">Informe no formato DDI+DDD+numero. Exemplo: 5551999999999</p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefone do aluno"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-slate-400 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || !phone || !message}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Enviando...' : 'Enviar Agora'}
        </button>
      </div>

      {status && <p className="mt-2 text-xs text-emerald-300">{status}</p>}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
