'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { AlunoSearch } from './AlunoSearch'
import { StrategyConfigDrawer } from './StrategyConfigDrawer'
import { StrategyConfigEditor, type StrategyConfigSaveState } from './StrategyConfigEditor'
import { AIFormattedResponse } from '@/components/ai-formatted-response'
import type { RenewalItem, StudentProfile } from '@/lib/types'
import type { StrategyConfig } from '@/lib/types/multitenancy'
import { DEFAULT_STRATEGY_CONFIG } from '@/lib/types/multitenancy'

type Tab = 'perfil' | 'config'

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function DaysBadge({ renewalDate }: { renewalDate: string }) {
  const days = daysUntil(renewalDate)
  if (days === null) return null
  const isUrgent = days <= 7
  const label = days >= 0 ? `D-${days}` : `D+${Math.abs(days)}`
  const cls = isUrgent
    ? 'bg-red-500/20 text-red-300 border-red-500/40'
    : days <= 30
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
      {isUrgent && <span>🔴</span>}
    </span>
  )
}

function activeConfigCount(config: StrategyConfig): number {
  return [
    true,
    config.section_mensagens,
    config.section_objecoes,
    config.section_proximo_passo,
    config.section_gatilhos,
    config.section_historico,
  ].filter(Boolean).length
}

const EMPTY_STUDENT: StudentProfile = {
  name: '',
  age: '',
  gender: '',
  selectedPlan: 'Anual',
  goal: '',
  hasChildren: '',
  routine: '',
  notes: '',
}

const GOAL_OPTIONS = [
  'Emagrecer',
  'Ganhar massa muscular',
  'Melhorar condicionamento',
  'Saude e bem-estar',
  'Reabilitacao',
  'Qualidade de vida',
]
const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Nao-binario', 'Prefere nao informar']
const PLAN_OPTIONS = ['Anual', 'Semestral', 'Trimestral', 'Mensal']

function relativeSaveTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSecs = Math.round(diffMs / 1000)
  if (diffSecs < 60) return 'agora'
  const diffMins = Math.round(diffSecs / 60)
  if (diffMins === 1) return '1 min'
  return `${diffMins} min`
}

export function RetencaoPageClient({ initialAlunoId }: { initialAlunoId?: string }) {
  const [tab, setTab] = useState<Tab>('perfil')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient()
    } catch {
      return null
    }
  }, [])

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!supabase) return null
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [supabase])

  const authFetch = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      const token = await getToken()
      return fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    },
    [getToken],
  )

  // Strategy config state
  const [config, setConfig] = useState<StrategyConfig>({ ...DEFAULT_STRATEGY_CONFIG } as StrategyConfig)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [configSaveState, setConfigSaveState] = useState<StrategyConfigSaveState>({
    saving: false,
    lastSaved: null,
    saveError: null,
  })

  // Student form state
  const [student, setStudent] = useState<StudentProfile>(EMPTY_STUDENT)
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | null>(null)
  const [renewalDate, setRenewalDate] = useState('')

  // AI state
  const [output, setOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Load config on mount (cookie auth — no Bearer needed)
  useEffect(() => {
    fetch('/api/strategy-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setConfig(data.data as StrategyConfig)
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true))
  }, [])

  // Pre-load student from ?alunoId query param
  useEffect(() => {
    if (!initialAlunoId) return
    authFetch(`/api/renewals/${initialAlunoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) prefillFromAluno(data.data as RenewalItem)
      })
      .catch(() => {})
  }, [initialAlunoId]) // authFetch stable after mount

  function prefillFromAluno(aluno: RenewalItem) {
    setSelectedAlunoId(aluno.id)
    setStudent((prev) => ({
      ...prev,
      name: aluno.name,
      selectedPlan: aluno.plan || prev.selectedPlan,
      notes: aluno.notes || prev.notes,
    }))
    if (aluno.renewalDate) setRenewalDate(aluno.renewalDate)
  }

  // Elapsed timer
  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [loading])

  const diasParaRenovacao = daysUntil(renewalDate)

  async function handleGenerate() {
    if (loading) return
    abortRef.current = new AbortController()
    setLoading(true)
    setElapsedSeconds(0)
    setError(null)
    setOutput(null)
    try {
      let alunoId = selectedAlunoId

      // If no aluno selected from list, create it first in renewal_items.
      if (!alunoId) {
        const createRes = await authFetch('/api/renewals', {
          method: 'POST',
          body: JSON.stringify({
            name: student.name,
            telefone: '',
            plan: student.selectedPlan || 'Anual',
            status: 'ativo',
            renewalDate,
            lastContact: '',
            owner: '',
            notes: student.notes || '',
          }),
        })
        const createResult = await createRes.json()
        if (!createRes.ok || !createResult.success) {
          throw new Error(createResult.error ?? 'Erro ao salvar aluno antes de gerar estratégia')
        }
        alunoId = (createResult.data as RenewalItem).id
        setSelectedAlunoId(alunoId)
      }

      const res = await fetch('/api/retencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'strategy',
          alunoId,
          student,
          config,
          ...(diasParaRenovacao !== null ? { diasParaRenovacao } : {}),
        }),
        signal: abortRef.current.signal,
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error ?? 'Erro ao gerar estratégia')
      setOutput(result.data.messages[0] as string)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Geração interrompida.')
        return
      }
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              💚 Retenção
            </span>
            <h1 className="text-3xl font-bold text-white mt-1">Estratégia de Retenção</h1>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin/renovacoes"
              className="text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-2 transition-colors"
            >
              Lista de Alunos
            </a>
            {supabase && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-2 transition-colors"
              >
                Sair
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-8">
          {(
            [
              { id: 'perfil' as Tab, label: 'Perfil do Aluno' },
              { id: 'config' as Tab, label: 'Configurações da Estratégia' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1 — Perfil do Aluno */}
        {tab === 'perfil' && (
          <div>
            {/* Student search */}
            <div className="mb-6">
              <AlunoSearch
                authFetch={authFetch}
                onSelect={(aluno) => prefillFromAluno(aluno)}
                onNew={() => {
                  setSelectedAlunoId(null)
                  setStudent(EMPTY_STUDENT)
                  setRenewalDate('')
                  setOutput(null)
                }}
              />
            </div>

            <div className="flex gap-6 items-start">
              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Form */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-emerald-400">📋 Perfil do Aluno</h2>
                    </div>

                    <div className="space-y-3">
                      {/* Name */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Nome
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => setStudent((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Ex.: Mariana"
                          className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </label>

                      {/* Age + Gender */}
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                          Idade
                          <input
                            type="text"
                            value={student.age}
                            onChange={(e) => setStudent((p) => ({ ...p, age: e.target.value }))}
                            placeholder="Ex.: 34"
                            className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                          Sexo/Gênero
                          <select
                            value={student.gender}
                            onChange={(e) => setStudent((p) => ({ ...p, gender: e.target.value }))}
                            className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                          >
                            <option value="">Selecione</option>
                            {GENDER_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {/* Plan */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Plano
                        <select
                          value={student.selectedPlan ?? 'Anual'}
                          onChange={(e) => setStudent((p) => ({ ...p, selectedPlan: e.target.value }))}
                          className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                        >
                          {PLAN_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>

                      {/* Renewal date */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Data de renovação
                        <input
                          type="date"
                          value={renewalDate}
                          onChange={(e) => setRenewalDate(e.target.value)}
                          className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                        />
                        {renewalDate && <DaysBadge renewalDate={renewalDate} />}
                      </label>

                      {/* Goal */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Objetivo
                        <select
                          value={student.goal}
                          onChange={(e) => setStudent((p) => ({ ...p, goal: e.target.value }))}
                          className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                        >
                          <option value="">Selecione</option>
                          {GOAL_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>

                      {/* HasChildren */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Filhos
                        <input
                          type="text"
                          value={student.hasChildren}
                          onChange={(e) => setStudent((p) => ({ ...p, hasChildren: e.target.value }))}
                          placeholder="Ex.: sim, 2 filhos"
                          className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </label>

                      {/* Routine */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Rotina
                        <textarea
                          value={student.routine}
                          onChange={(e) => setStudent((p) => ({ ...p, routine: e.target.value }))}
                          placeholder="Ex.: trabalha o dia todo, treina à noite..."
                          className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none resize-none"
                          rows={2}
                        />
                      </label>

                      {/* Notes */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Notas
                        <textarea
                          value={student.notes}
                          onChange={(e) => setStudent((p) => ({ ...p, notes: e.target.value }))}
                          placeholder="Histórico de frequência, problemas, feedback anterior..."
                          className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none resize-none"
                          rows={2}
                        />
                      </label>
                    </div>

                    {/* Config drawer toggle */}
                    <button
                      onClick={() => setDrawerOpen((o) => !o)}
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg px-3 py-2 transition-colors"
                    >
                      ⚙️ Configurações
                      {configLoaded && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5">
                          {activeConfigCount(config)} seções
                        </span>
                      )}
                      {configSaveState.saving && (
                        <span className="rounded-full bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5">
                          Salvando...
                        </span>
                      )}
                      {!configSaveState.saving && configSaveState.saveError && (
                        <span className="rounded-full bg-red-500/20 text-red-300 text-xs px-2 py-0.5">
                          Erro ao salvar
                        </span>
                      )}
                      {!configSaveState.saving && !configSaveState.saveError && configSaveState.lastSaved && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5">
                          Salvo ha {relativeSaveTime(configSaveState.lastSaved)}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => void handleGenerate()}
                      disabled={loading || !student.name || !student.goal}
                      className="w-full rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {loading
                        ? `Gerando... ${elapsedSeconds}s`
                        : 'Gerar Estratégia de Retenção'}
                    </button>

                    {loading && (
                      <button
                        onClick={() => abortRef.current?.abort()}
                        className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
                      >
                        Interromper
                      </button>
                    )}

                    {error && (
                      <div className="rounded-lg border border-red-400/20 bg-red-900/20 p-3 text-sm text-red-200">
                        {error}
                      </div>
                    )}
                  </div>

                  {/* AI Output */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-purple-400">✨ Estratégia IA</h2>
                    {output ? (
                      <div className="rounded-lg border border-emerald-400/20 bg-slate-900/50 p-5">
                        <AIFormattedResponse content={output} />
                        <button
                          onClick={() => void navigator.clipboard.writeText(output)}
                          className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
                        >
                          📋 Copiar Estratégia
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-600 p-12 text-slate-400 text-center">
                        <p>
                          Preencha o perfil do aluno e clique em &quot;Gerar Estratégia&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Config Drawer */}
              {drawerOpen && (
                <StrategyConfigDrawer
                  config={config}
                  onChange={setConfig}
                  onClose={() => setDrawerOpen(false)}
                  onSaveStateChange={setConfigSaveState}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 2 — Configurações */}
        {tab === 'config' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Configurações da Estratégia de IA</h2>
              <p className="text-slate-400 text-sm mt-1">
                Defina o que a IA deve gerar em cada análise. Salvo automaticamente.
              </p>
            </div>
            <StrategyConfigEditor
              config={config}
              onChange={setConfig}
              autoSave
              onSaveStateChange={setConfigSaveState}
            />
          </div>
        )}
      </div>
    </div>
  )
}
