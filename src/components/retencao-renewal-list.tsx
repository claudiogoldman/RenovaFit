'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { HistoricoContatoItem, RenewalItem, RenewalStatus } from '@/lib/types';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getAppUrl } from '@/lib/app-url';
import { isValidPhone, normalizePhone } from '@/lib/whatsapp';

const STATUS_OPTIONS: Array<{ value: RenewalStatus; label: string }> = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'sumido', label: 'Sumido' },
  { value: 'critico', label: 'Critico' },
  { value: 'renovado', label: 'Renovado' },
];

const PLAN_OPTIONS = ['Anual', 'Semestral', 'Trimestral', 'Mensal'];

const INITIAL_FORM: Omit<RenewalItem, 'id'> = {
  name: '',
  telefone: '',
  plan: 'Anual',
  status: 'ativo',
  renewalDate: '',
  lastContact: '',
  owner: '',
  notes: '',
};

function daysUntil(dateValue: string): number | null {
  if (!dateValue) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function statusBadgeClass(status: RenewalStatus): string {
  if (status === 'renovado') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (status === 'critico') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  if (status === 'sumido') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
}

function formatSentAt(value: string): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) {
      const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `há ${diffMinutes} min`;
    }
    return `há ${diffHours}h`;
  }
  if (diffDays === 1) {
    return 'há 1 dia';
  }
  return `há ${diffDays} dias`;
}

function buildWhatsAppMessage(item: RenewalItem): string {
  return [
    `Oi ${item.name}, tudo bem?`,
    '',
    `Passando para te lembrar da renovacao do seu plano ${item.plan}.`,
    'Quer que eu te envie agora as opcoes e valores atualizados?',
  ].join('\n');
}

export function RetencaoRenewalList() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [team, setTeam] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [items, setItems] = useState<RenewalItem[]>([]);
  const [history, setHistory] = useState<HistoricoContatoItem[]>([]);
  const [telefoneDraftById, setTelefoneDraftById] = useState<Record<string, string>>({});
  const [updatingTelefoneById, setUpdatingTelefoneById] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState(INITIAL_FORM);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingHistoryById, setDeletingHistoryById] = useState<Record<string, boolean>>({});
  const [sendingWhatsAppById, setSendingWhatsAppById] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = usePersistedState<string>('renovafit:retencao:lista:search', '');
  const [statusFilter, setStatusFilter] = usePersistedState<string>('renovafit:retencao:lista:status', 'todos');
  const [planFilter, setPlanFilter] = usePersistedState<string>('renovafit:retencao:lista:plan', 'todos');
  const [authUnavailable, setAuthUnavailable] = useState(false);

  const hasAuthConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const supabase = useMemo(() => {
    if (!hasAuthConfig) {
      setAuthUnavailable(true);
      return null;
    }

    try {
      return createSupabaseBrowserClient();
    } catch {
      setAuthUnavailable(true);
      return null;
    }
  }, [hasAuthConfig]);

  const fetchWithAuth = async (url: string, init?: RequestInit) => {
    if (!session?.access_token) {
      throw new Error('Sessao de usuario nao encontrada. Faca login novamente.');
    }

    return fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  };

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    const init = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      if (sessionError) {
        setAuthError(sessionError.message);
      }

      setSession(data.session || null);
      setAuthLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession || null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const loadItems = async () => {
    setLoadingList(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/renewals');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Erro ao carregar lista');
      }

      const fetchedItems = (result.data || []) as RenewalItem[];
      setItems(fetchedItems);
      setTelefoneDraftById(
        fetchedItems.reduce<Record<string, string>>((acc, item) => {
          acc[item.id] = item.telefone || '';
          return acc;
        }, {}),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoadingList(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/renewals/contact-history?limit=12');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Erro ao carregar historico');
      }

      setHistory(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!session) {
      setItems([]);
      setHistory([]);
      return;
    }

    void loadItems();
    void loadHistory();
  }, [session]);

  const plans = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.plan).filter(Boolean)));
    return values.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const bySearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.owner.toLowerCase().includes(search.toLowerCase());
      const byStatus = statusFilter === 'todos' || item.status === statusFilter;
      const byPlan = planFilter === 'todos' || item.plan === planFilter;
      return bySearch && byStatus && byPlan;
    });
  }, [items, search, statusFilter, planFilter]);

  const sortedUrgent = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aDays = daysUntil(a.renewalDate);
      const bDays = daysUntil(b.renewalDate);
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays;
    });
  }, [filteredItems]);

  const kpis = useMemo(() => {
    const total = items.length;
    const renovados = items.filter((item) => item.status === 'renovado').length;
    const criticos = items.filter((item) => item.status === 'critico').length;
    const emAberto = total - renovados;
    const taxa = total > 0 ? Math.round((renovados / total) * 100) : 0;
    return { total, renovados, criticos, emAberto, taxa };
  }, [items]);

  const handleFormChange = (field: keyof Omit<RenewalItem, 'id'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = async () => {
    if (!form.name || !form.plan || !form.status) {
      return;
    }

    try {
      const response = await fetchWithAuth('/api/renewals', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Erro ao criar item');
      }

      const createdItem = result.data as RenewalItem;
      setItems((prev) => [createdItem, ...prev]);
      setTelefoneDraftById((prev) => ({ ...prev, [createdItem.id]: createdItem.telefone || '' }));
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/api/renewals/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Erro ao remover item');
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const handleStatusUpdate = async (id: string, status: RenewalStatus) => {
    const previous = items;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));

    try {
      const response = await fetchWithAuth(`/api/renewals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Erro ao atualizar status');
      }
    } catch (err) {
      setItems(previous);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const handleSendWhatsApp = async (item: RenewalItem) => {
    const telefone = normalizePhone(telefoneDraftById[item.id] || item.telefone || '');
    if (!isValidPhone(telefone)) {
      setError(`Informe um telefone valido para ${item.name} antes de enviar.`);
      return;
    }

    setSendingWhatsAppById((prev) => ({ ...prev, [item.id]: true }));
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/renewals/${item.id}/contact`, {
        method: 'POST',
        body: JSON.stringify({
          telefone,
          message: buildWhatsAppMessage(item),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Erro ao enviar WhatsApp');
      }

      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id ? { ...current, lastContact: String(result.data?.sentAt || current.lastContact) } : current,
        ),
      );
      void loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      void loadHistory();
    } finally {
      setSendingWhatsAppById((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleDeleteHistory = async (historyId: string) => {
    const confirmed = window.confirm('Excluir este item do historico de contatos?');
    if (!confirmed) {
      return;
    }

    setDeletingHistoryById((prev) => ({ ...prev, [historyId]: true }));
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/renewals/contact-history?id=${encodeURIComponent(historyId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Erro ao excluir contato do historico');
      }

      setHistory((prev) => prev.filter((entry) => entry.id !== historyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setDeletingHistoryById((prev) => ({ ...prev, [historyId]: false }));
    }
  };

  return (
    <section className="mt-16 space-y-8">
      {/* Logout button */}
      <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-3">
        <p className="text-sm text-slate-300">
          Logado como{' '}
          <span className="font-semibold text-white">
            {(session?.user.user_metadata?.full_name as string | undefined) || session?.user.email}
          </span>
          {session?.user.user_metadata?.team ? ` · Equipe: ${String(session.user.user_metadata.team)}` : ''}
        </p>
        <button
          onClick={async () => {
            if (!supabase) return;
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
        >
          Sair
        </button>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-white">Lista de Renovacao</h2>
        <p className="mt-2 text-slate-400">Controle operacional da carteira com filtros, prioridade e atualizacao rapida de status.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-900/20 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-white">{kpis.total}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Em aberto</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{kpis.emAberto}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Criticos</p>
          <p className="mt-1 text-2xl font-bold text-rose-300">{kpis.criticos}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Renovados</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{kpis.renovados}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Taxa</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">{kpis.taxa}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-400/20 bg-slate-900/60 p-6">
        <h3 className="text-xl font-semibold text-emerald-300">Adicionar aluno</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <input
            value={form.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder="Nome"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
          <input
            value={form.telefone}
            onChange={(e) => handleFormChange('telefone', e.target.value)}
            placeholder="Telefone (DDI+DDD+numero)"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
          <select
            value={form.plan}
            onChange={(e) => handleFormChange('plan', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          >
            {PLAN_OPTIONS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(e) => handleFormChange('status', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.renewalDate}
            onChange={(e) => handleFormChange('renewalDate', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
          <input
            value={form.lastContact}
            onChange={(e) => handleFormChange('lastContact', e.target.value)}
            placeholder="Ultimo contato"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
          <input
            value={form.owner}
            onChange={(e) => handleFormChange('owner', e.target.value)}
            placeholder="Responsavel"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
          <input
            value={form.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            placeholder="Notas"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white lg:col-span-3"
          />
        </div>
        <button
          onClick={() => void handleAddItem()}
          className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Adicionar na lista
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou responsavel"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
        >
          <option value="todos">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
        >
          <option value="todos">Todos os planos</option>
          {plans.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700">
        {loadingList && (
          <div className="border-b border-slate-700 bg-slate-900/80 px-4 py-2 text-xs text-slate-400">
            Carregando lista da equipe...
          </div>
        )}
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900/80">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Renovacao</th>
              <th className="px-4 py-3">Responsavel</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/80 text-sm text-slate-200">
            {sortedUrgent.map((item) => {
              const days = daysUntil(item.renewalDate);
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{item.name}</p>
                    {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={telefoneDraftById[item.id] ?? item.telefone ?? ''}
                        onChange={(e) =>
                          setTelefoneDraftById((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="w-40 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                        placeholder="DDI+DDD+numero"
                      />
                      <button
                        onClick={async () => {
                          const telefoneNormalizado = normalizePhone(telefoneDraftById[item.id] || '');
                          setUpdatingTelefoneById((prev) => ({ ...prev, [item.id]: true }));
                          try {
                            const response = await fetchWithAuth(`/api/renewals/${item.id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ telefone: telefoneNormalizado }),
                            });
                            const result = await response.json();
                            if (!response.ok || !result.success) {
                              throw new Error(result.details || result.error || 'Erro ao salvar telefone');
                            }
                            setItems((prev) =>
                              prev.map((current) =>
                                current.id === item.id ? { ...current, telefone: telefoneNormalizado } : current,
                              ),
                            );
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Erro desconhecido');
                          } finally {
                            setUpdatingTelefoneById((prev) => ({ ...prev, [item.id]: false }));
                          }
                        }}
                        disabled={updatingTelefoneById[item.id] || !isValidPhone(telefoneDraftById[item.id] || '')}
                        className="rounded border border-cyan-500/30 px-2 py-1 text-[11px] text-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingTelefoneById[item.id] ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${statusBadgeClass(item.status)}`}>
                      {STATUS_OPTIONS.find((status) => status.value === item.status)?.label || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p>{item.renewalDate || '-'}</p>
                      {days !== null && (
                        <span
                          className={`inline-flex rounded-full border px-1.5 py-0.5 text-[11px] font-semibold mt-0.5 ${
                            days <= 7
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : days <= 30
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {days >= 0 ? `D-${days}` : `D+${Math.abs(days)}`}
                        </span>
                      )}
                    <p className="mt-1 text-xs text-slate-500">Ultimo: {formatSentAt(item.lastContact)}</p>
                  </td>
                  <td className="px-4 py-3">{item.owner || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => void handleStatusUpdate(item.id, e.target.value as RenewalStatus)}
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => void handleSendWhatsApp(item)}
                        disabled={sendingWhatsAppById[item.id] || !isValidPhone(telefoneDraftById[item.id] || item.telefone || '')}
                        title={isValidPhone(telefoneDraftById[item.id] || item.telefone || '') ? 'Enviar mensagem no WhatsApp' : 'Informe um telefone valido para habilitar'}
                        className="rounded border border-emerald-500/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendingWhatsAppById[item.id] ? 'Enviando...' : 'WhatsApp'}
                      </button>
                      <button
                        onClick={() => void handleRemove(item.id)}
                        className="rounded border border-rose-500/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                      >
                        Remover
                      </button>
                    </div>
                      <a
                        href={`/retencao?alunoId=${item.id}`}
                        className="mt-2 inline-flex rounded border border-purple-500/30 px-2 py-1 text-xs text-purple-300 hover:bg-purple-500/10 transition-colors"
                      >
                        ✨ Gerar estratégia
                      </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedUrgent.length === 0 && (
          <div className="p-6 text-center text-slate-400">Nenhum aluno encontrado com os filtros atuais.</div>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
        <h3 className="text-lg font-semibold text-white">Historico de Contatos</h3>
        {loadingHistory && <p className="mt-2 text-sm text-slate-400">Carregando historico...</p>}
        {!loadingHistory && history.length === 0 && (
          <p className="mt-2 text-sm text-slate-400">Nenhum contato registrado ainda.</p>
        )}
        {!loadingHistory && history.length > 0 && (
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white">
                    <span className="font-semibold">{entry.alunoNome}</span> · {entry.telefone}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-wide ${
                        entry.statusEnvio === 'enviado'
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : entry.statusEnvio === 'manual'
                            ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
                            : 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {entry.statusEnvio}
                    </span>
                    <button
                      onClick={() => void handleDeleteHistory(entry.id)}
                      disabled={Boolean(deletingHistoryById[entry.id])}
                      className="rounded border border-rose-500/40 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingHistoryById[entry.id] ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {formatSentAt(entry.createdAt)} · {entry.canal} · {entry.tipoContato} · por {entry.owner || 'Atendente'}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-slate-300">{entry.mensagem}</p>
                {entry.erroDetalhe && <p className="mt-2 text-xs text-rose-300">Erro: {entry.erroDetalhe}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
