'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { AlunoSearch } from './AlunoSearch'
import { StrategyConfigDrawer } from './StrategyConfigDrawer'
import { StrategyConfigEditor, type StrategyConfigSaveState } from './StrategyConfigEditor'
import { AIFormattedResponse } from '@/components/ai-formatted-response'
import type { HistoricoContatoItem, RenewalItem, StudentProfile } from '@/lib/types'
import type { StrategyConfig } from '@/lib/types/multitenancy'
import { DEFAULT_STRATEGY_CONFIG } from '@/lib/types/multitenancy'

type Tab = 'perfil' | 'config'

type ParsedSection = {
  title: string
  content: string
}

type ParsedMessage = {
  id: string
  label: string
  text: string
}

function parseMessagesFromSection(content: string): ParsedMessage[] {
  // Split on bold headers like **Mensagem 1:** or **1. Primeira abordagem:**
  const blockSplitRe = /(?=\*\*[^*]+\*\*:?\s*\n)/g
  const blocks = content.split(blockSplitRe).filter((b) => b.trim())

  if (blocks.length > 1) {
    return blocks.map((block, i) => {
      const headerMatch = block.match(/^\*\*([^*]+)\*\*:?\s*\n/)
      const label = headerMatch ? headerMatch[1].trim() : `Mensagem ${i + 1}`
      const text = block.replace(/^\*\*[^*]+\*\*:?\s*\n/, '').trim()
      return { id: `msg-${i}`, label, text }
    })
  }

  // Fallback: split on numbered lines (1. ... 2. ...)
  const numberedRe = /(?=^\d+[.)][\s])/m
  const numberedBlocks = content.split(numberedRe).filter((b) => b.trim())
  if (numberedBlocks.length > 1) {
    return numberedBlocks.map((block, i) => {
      const label = `Mensagem ${i + 1}`
      const text = block.replace(/^\d+[.)]\s*/, '').trim()
      return { id: `msg-${i}`, label, text }
    })
  }

  // Single message — return whole content as one card
  return [{ id: 'msg-0', label: 'Mensagem', text: content.trim() }]
}

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

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function mapHeadingToTitle(line: string): string | null {
  const normalized = normalizeText(line.replace(/^#+\s*/, '').trim())
  if (normalized.includes('resumo do perfil')) return 'Resumo do Perfil'
  if (normalized.includes('mensagens prontas')) return 'Mensagens Prontas'
  if (normalized.includes('respostas') && normalized.includes('objec')) return 'Respostas a Objecoes'
  if (normalized.includes('proximo passo')) return 'Proximo Passo'
  if (normalized.includes('gatilhos')) return 'Gatilhos'
  if (normalized.includes('historico do contato') || normalized.includes('historico de contato')) {
    return 'Historico do Contato'
  }
  return null
}

function parseStrategySections(output: string | null): ParsedSection[] {
  if (!output) return []

  const lines = output.split('\n')
  const sections: ParsedSection[] = []
  let currentTitle: string | null = null
  let currentLines: string[] = []

  const flush = () => {
    if (!currentTitle) return
    const content = currentLines.join('\n').trim()
    if (content) sections.push({ title: currentTitle, content })
  }

  for (const line of lines) {
    const trimmed = line.trim()
    const asHeading = mapHeadingToTitle(trimmed)
    const numberedHeadingMatch = trimmed.match(/^\d+[.)]\s+(.+)$/)
    const numberedTitle = numberedHeadingMatch ? mapHeadingToTitle(numberedHeadingMatch[1]) : null
    const title = asHeading || numberedTitle

    if (title) {
      flush()
      currentTitle = title
      currentLines = []
      continue
    }

    if (currentTitle) {
      currentLines.push(line)
    }
  }

  flush()
  return sections
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapTipoContatoLabel(tipo: HistoricoContatoItem['tipoContato']): string {
  if (tipo === 'primeiro_contato') return 'Primeiro contato'
  if (tipo === 'followup') return 'Follow-up'
  if (tipo === 'resposta') return 'Resposta'
  return 'Observacao'
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
const HAS_CHILDREN_OPTIONS = ['Nao', 'Sim, 1', 'Sim, 2', 'Sim, 3', 'Sim, +3']

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

  // Integration config
  const [whatsappConfigured, setWhatsappConfigured] = useState(false)
  useEffect(() => {
    fetch('/api/admin/integrations')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setWhatsappConfigured(!!d.data.hasWhatsappAccessToken)
      })
      .catch(() => {})
  }, [])

  // Student form state
  const [student, setStudent] = useState<StudentProfile>(EMPTY_STUDENT)
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | null>(null)
  const [renewalDate, setRenewalDate] = useState('')
  const [formCollapsed, setFormCollapsed] = useState(false)

  // Message action state
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [sendingMsgId, setSendingMsgId] = useState<string | null>(null)
  const [sentMsgIds, setSentMsgIds] = useState<Set<string>>(new Set())

  async function handleMessageAction(
    msgId: string,
    text: string,
    via: 'copy' | 'whatsapp',
  ) {
    if (via === 'copy') {
      await navigator.clipboard.writeText(text)
      setCopiedMsgId(msgId)
      setTimeout(() => setCopiedMsgId((id) => (id === msgId ? null : id)), 2000)
    }

    if (!selectedAlunoId) return

    if (via === 'whatsapp') {
      setSendingMsgId(msgId)
    }

    try {
      await authFetch(`/api/renewals/${selectedAlunoId}/contact`, {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          canal: via === 'whatsapp' ? 'whatsapp' : 'manual',
          tipoContato: contactHistory.some((h) => h.renovacaoId === selectedAlunoId)
            ? 'followup'
            : 'primeiro_contato',
        }),
      })
      if (via === 'whatsapp') setSentMsgIds((prev) => new Set(prev).add(msgId))
      // Refresh history
      const r = await authFetch('/api/renewals/contact-history?limit=20')
      const d = await r.json()
      if (d.success && Array.isArray(d.data)) setContactHistory(d.data as HistoricoContatoItem[])
    } catch {
      // silent — copy still worked
    } finally {
      if (via === 'whatsapp') setSendingMsgId(null)
    }
  }

  // Contact history
  const [contactHistory, setContactHistory] = useState<HistoricoContatoItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

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

  useEffect(() => {
    let active = true
    setHistoryLoading(true)
    setHistoryError(null)

    authFetch('/api/renewals/contact-history?limit=20')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        if (data.success && Array.isArray(data.data)) {
          setContactHistory(data.data as HistoricoContatoItem[])
          return
        }
        setHistoryError(data.error || 'Nao foi possivel carregar o historico')
      })
      .catch(() => {
        if (active) setHistoryError('Nao foi possivel carregar o historico')
      })
      .finally(() => {
        if (active) setHistoryLoading(false)
      })

    return () => {
      active = false
    }
  }, [authFetch])

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
  const strategySections = useMemo(() => parseStrategySections(output), [output])
  const filteredHistory = useMemo(() => {
    if (!selectedAlunoId) return contactHistory
    return contactHistory.filter((item) => item.renovacaoId === selectedAlunoId)
  }, [contactHistory, selectedAlunoId])

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Page title */}
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            💚 Retenção
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">Estratégia de Retenção</h1>
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
      setSentMsgIds(new Set())
      setCopiedMsgId(null)
                }}
              />
            </div>

            <div className="flex gap-6 items-start">
              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className={`grid gap-8 ${formCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
                  {/* Form */}
                  {!formCollapsed && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-emerald-400">📋 Perfil do Aluno</h2>
                      <button
                        onClick={() => setFormCollapsed(true)}
                        className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded px-2 py-1 transition-colors"
                        title="Recolher formulário"
                      >
                        ▲ Recolher
                      </button>
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
                        <select
                          value={student.hasChildren}
                          onChange={(e) => setStudent((p) => ({ ...p, hasChildren: e.target.value }))}
                          className="rounded-lg border border-emerald-400/20 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                        >
                          <option value="">Selecione</option>
                          {HAS_CHILDREN_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
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

                  )}

                  {/* AI Output */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-purple-400">✨ Estratégia IA</h2>
                      {formCollapsed && (
                        <button
                          onClick={() => setFormCollapsed(false)}
                          className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded px-2 py-1 transition-colors"
                          title="Expandir formulário"
                        >
                          ▼ Expandir formulário
                        </button>
                      )}
                    </div>
                    {output ? (
                      <div className="space-y-3">
                        {strategySections.length > 0 ? (
                          strategySections.map((section) => {
                            const isMensagens = section.title === 'Mensagens Prontas'
                            const messages = isMensagens
                              ? parseMessagesFromSection(section.content)
                              : null
                            return (
                              <div
                                key={section.title}
                                className="rounded-lg border border-emerald-400/20 bg-slate-900/50 p-5"
                              >
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300 mb-3">
                                  {section.title}
                                </h3>

                                {isMensagens && messages ? (
                                  <div className="space-y-3">
                                    {messages.map((msg) => (
                                      <div
                                        key={msg.id}
                                        className="rounded-lg border border-slate-700 bg-slate-950/60 p-4"
                                      >
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                          {msg.label}
                                        </p>
                                        <p className="text-sm text-slate-200 whitespace-pre-wrap mb-3">
                                          {msg.text}
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                          <button
                                            onClick={() => void handleMessageAction(msg.id, msg.text, 'copy')}
                                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                              copiedMsgId === msg.id
                                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                                : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            }`}
                                          >
                                            {copiedMsgId === msg.id ? '✓ Copiado' : '📋 Copiar'}
                                          </button>
                                          {whatsappConfigured && selectedAlunoId && (
                                            <button
                                              onClick={() => void handleMessageAction(msg.id, msg.text, 'whatsapp')}
                                              disabled={sendingMsgId === msg.id}
                                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                                                sentMsgIds.has(msg.id)
                                                  ? 'border-green-600 bg-green-500/20 text-green-300'
                                                  : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                              }`}
                                            >
                                              {sentMsgIds.has(msg.id)
                                                ? '✓ Enviado'
                                                : sendingMsgId === msg.id
                                                  ? 'Enviando...'
                                                  : '💬 Enviar WhatsApp'}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <AIFormattedResponse content={section.content} />
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="rounded-lg border border-emerald-400/20 bg-slate-900/50 p-5">
                            <AIFormattedResponse content={output} />
                          </div>
                        )}

                        <button
                          onClick={() => void navigator.clipboard.writeText(output)}
                          className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
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

                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200 mb-3">
                        Historico do Contato
                      </h3>

                      {historyLoading ? (
                        <p className="text-sm text-slate-400">Carregando historico...</p>
                      ) : historyError ? (
                        <p className="text-sm text-red-300">{historyError}</p>
                      ) : filteredHistory.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          {selectedAlunoId
                            ? 'Sem historico para o aluno selecionado.'
                            : 'Sem historico de contato ainda.'}
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {filteredHistory.map((item) => (
                            <div key={item.id} className="rounded-md border border-slate-700 bg-slate-950/60 p-3">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-xs font-semibold text-slate-200">{item.alunoNome}</p>
                                <p className="text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</p>
                              </div>
                              <p className="text-[11px] text-slate-400 mb-1">
                                {mapTipoContatoLabel(item.tipoContato)} • {item.canal}
                              </p>
                              <p className="text-xs text-slate-300 line-clamp-3">{item.mensagem}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
