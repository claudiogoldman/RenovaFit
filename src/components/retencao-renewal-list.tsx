'use client';

import { useMemo, useState } from 'react';
import type { RenewalItem, RenewalStatus } from '@/lib/types';
import { usePersistedState } from '@/hooks/use-persisted-state';

const STATUS_OPTIONS: Array<{ value: RenewalStatus; label: string }> = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'sumido', label: 'Sumido' },
  { value: 'critico', label: 'Critico' },
  { value: 'renovado', label: 'Renovado' },
];

const INITIAL_FORM: Omit<RenewalItem, 'id'> = {
  name: '',
  plan: 'Mensal',
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

export function RetencaoRenewalList() {
  const [items, setItems] = usePersistedState<RenewalItem[]>('renovafit:retencao:lista', []);
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = usePersistedState<string>('renovafit:retencao:lista:search', '');
  const [statusFilter, setStatusFilter] = usePersistedState<string>('renovafit:retencao:lista:status', 'todos');
  const [planFilter, setPlanFilter] = usePersistedState<string>('renovafit:retencao:lista:plan', 'todos');

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

  const handleAddItem = () => {
    if (!form.name || !form.plan || !form.status) {
      return;
    }

    const newItem: RenewalItem = {
      id: `${Date.now()}`,
      ...form,
    };

    setItems((prev) => [newItem, ...prev]);
    setForm(INITIAL_FORM);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStatusUpdate = (id: string, status: RenewalStatus) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  return (
    <section className="mt-16 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white">Lista de Renovacao</h2>
        <p className="mt-2 text-slate-400">Controle operacional da carteira com filtros, prioridade e atualizacao rapida de status.</p>
      </div>

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
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            value={form.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder="Nome"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
          <input
            value={form.plan}
            onChange={(e) => handleFormChange('plan', e.target.value)}
            placeholder="Plano"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
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
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white lg:col-span-2"
          />
        </div>
        <button
          onClick={handleAddItem}
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
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900/80">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Aluno</th>
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
                  <td className="px-4 py-3">{item.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${statusBadgeClass(item.status)}`}>
                      {STATUS_OPTIONS.find((status) => status.value === item.status)?.label || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p>{item.renewalDate || '-'}</p>
                    {days !== null && <p className="text-xs text-slate-400">D{days >= 0 ? `-${days}` : `+${Math.abs(days)}`}</p>}
                  </td>
                  <td className="px-4 py-3">{item.owner || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusUpdate(item.id, e.target.value as RenewalStatus)}
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="rounded border border-rose-500/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                      >
                        Remover
                      </button>
                    </div>
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
    </section>
  );
}
