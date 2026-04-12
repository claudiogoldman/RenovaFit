'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { AlunoSearch } from './AlunoSearch'
import { StrategyConfigDrawer } from './StrategyConfigDrawer'
import { StrategyConfigEditor, type StrategyConfigSaveState } from './StrategyConfigEditor'
import { AIFormattedResponse } from '@/components/ai-formatted-response'
import type { AlunoStrategyItem, HistoricoContatoItem, RenewalItem, StrategyProfileSnapshot, StudentProfile } from '@/lib/types'
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

/** Split a card block into the sendable message and the AI reasoning/explanation */
function splitMessage(text: string): { message: string; reasoning: string | null } {
  // Primary: [MENSAGEM]...[/MENSAGEM] markers — extract message and treat rest as reasoning
  const markerMatch = text.match(/\[MENSAGEM\]([\s\S]*?)\[\/MENSAGEM\]/i)
  if (markerMatch) {
    const msg = markerMatch[1]
      .replace(/^[""\u201C\u201D\s]+|[""\u201C\u201D\s]+$/g, '')
      .trim()
    const afterIdx = (markerMatch.index ?? 0) + markerMatch[0].length
    const rest = text.slice(afterIdx).trim()
    return { message: msg, reasoning: rest || null }
  }

  // Strip any orphaned [MENSAGEM] / [/MENSAGEM] tags before further processing
  const cleaned = text.replace(/\[\/?\s*MENSAGEM\s*\]/gi, '').trim()

  // Find the first reasoning/explanation bullet: "* **Raciocínio:**" or "- **Como usar:**" etc.
  const splitRe = /\n\n?[\*\-]\s+\*\*/
  const idx = cleaned.search(splitRe)
  if (idx === -1) {
    return {
      message: cleaned.replace(/^[""\u201C\u201D]|[""\u201C\u201D]$/g, '').trim(),
      reasoning: null,
    }
  }
  const message = cleaned
    .slice(0, idx)
    .replace(/^[""\u201C\u201D]|[""\u201C\u201D]$/g, '')
    .trim()
  const reasoning = cleaned.slice(idx).trim()
  return { message, reasoning }
}

/** Strip AI reasoning/explanation — returns only the sendable message text */
function extractMsgText(text: string): string {
  const { message } = splitMessage(text)
  return message || text.replace(/\[\/?\s*MENSAGEM\s*\]/gi, '').trim()
}

/** Build a WhatsApp Web deep-link with pre-filled phone and message */
function buildWhatsAppWebLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`
}

function parseMessagesFromSection(content: string): ParsedMessage[] {
  // --- Primary: [MENSAGEM]...[/MENSAGEM] markers (new prompt format) ---
  const markerRe = /\[MENSAGEM\]([\s\S]*?)\[\/MENSAGEM\]/gi
  const markerMatches = [...content.matchAll(markerRe)]
  if (markerMatches.length > 0) {
    return markerMatches.map((m, i) => {
      const before = content.slice(0, m.index)
      const headerMatch = [...before.matchAll(/\*\*([^*]+)\*\*:?\s*$/gm)].pop()
      const label = headerMatch ? headerMatch[1].trim() : `Mensagem ${i + 1}`
      const text = m[1].replace(/^[""\u201C\u201D\s]+|[""\u201C\u201D\s]+$/g, '').trim()
      return { id: `msg-${i}`, label, text }
    })
  }

  // --- Fallback: bold headers (old responses) ---
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

  // Single message — return whole content as one card (strip any leftover markers)
  const singleText = content.replace(/\[\/?\s*MENSAGEM\s*\]/gi, '').trim()
  return [{ id: 'msg-0', label: 'Mensagem', text: singleText }]
}

/**
 * Parse the Gatilhos section.
 * Primary format (new): **NomeDoGatilho:** desc\n[MENSAGEM] text [/MENSAGEM]
 * Fallback (old): "Como usar: \"message\""
 */
function parseGatilhosFromSection(content: string): ParsedMessage[] | null {
  // --- Primary: [MENSAGEM]...[/MENSAGEM] markers ---
  const markerRe = /\[MENSAGEM\]([\s\S]*?)\[\/MENSAGEM\]/gi
  const markerMatches = [...content.matchAll(markerRe)]
  if (markerMatches.length > 0) {
    // For each match, find the nearest **bold:** header before it as the label
    const items: ParsedMessage[] = markerMatches.map((m, i) => {
      const before = content.slice(0, m.index)
      const headerMatch = [...before.matchAll(/\*\*([^*]+)\*\*:/g)].pop()
      const label = headerMatch ? headerMatch[1].trim() : `Gatilho ${i + 1}`
      // Description = text between the header and [MENSAGEM]
      const descStart = headerMatch ? (headerMatch.index ?? 0) + headerMatch[0].length : 0
      const descEnd = m.index ?? 0
      const desc = before.slice(descStart, descEnd).trim()
      const msgText = m[1].replace(/^["\u201C\u201D\s]+|["\u201C\u201D\s]+$/g, '').trim()
      const text = desc ? `${msgText}\n\n* **Contexto:** ${desc}` : msgText
      return { id: `gatilho-${i}`, label, text }
    })
    return items
  }

  // --- Fallback: "Como usar:" pattern (old responses) ---
  if (!content.toLowerCase().includes('como usar')) return null
  const items: ParsedMessage[] = []
  let idx = 0
  let titleLabel = ''
  let descLines: string[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const comoUsarRe = /^(?:[*\-]\s+)?(?:\*{1,2})?Como usar:?(?:\*{1,2})?\s*(.+)$/i
    const comoUsarMatch = trimmed.match(comoUsarRe)
    if (comoUsarMatch) {
      const msgText = comoUsarMatch[1].replace(/^["\u201C\u201D\*]+|["\u201C\u201D\*]+$/g, '').trim()
      const desc = descLines.join(' ').trim()
      const text = desc ? `${msgText}\n\n* **Contexto:** ${desc}` : msgText
      items.push({ id: `gatilho-${idx++}`, label: titleLabel || `Gatilho ${idx}`, text })
      titleLabel = ''
      descLines = []
    } else if (!titleLabel) {
      const colonIdx = trimmed.indexOf(':')
      titleLabel = colonIdx > 0 ? trimmed.slice(0, colonIdx).replace(/\*/g, '').trim() : trimmed
      const rest = colonIdx > 0 ? trimmed.slice(colonIdx + 1).trim() : ''
      if (rest) descLines.push(rest)
    } else {
      descLines.push(trimmed)
    }
  }
  return items.length > 0 ? items : null
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
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null)
  const [renewalDate, setRenewalDate] = useState('')
  const [baseMessage, setBaseMessage] = useState('')
  const [formCollapsed, setFormCollapsed] = useState(false)

  // Message action state
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [sendingMsgId, setSendingMsgId] = useState<string | null>(null)
  const [sentMsgIds, setSentMsgIds] = useState<Set<string>>(new Set())
  const [copiedStrategy, setCopiedStrategy] = useState(false)
  const [alunoTelefone, setAlunoTelefone] = useState('')
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({})

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
          strategyId: selectedStrategyId,
          canal: via === 'whatsapp' ? 'whatsapp' : 'manual',
          tipoContato: contactHistory.some((h) => h.renovacaoId === selectedAlunoId)
            ? 'followup'
            : 'primeiro_contato',
        }),
      })
      if (via === 'whatsapp') setSentMsgIds((prev) => new Set(prev).add(msgId))
      await loadHistory()
    } catch {
      // silent — copy still worked
    } finally {
      if (via === 'whatsapp') setSendingMsgId(null)
    }
  }

  // Contact history
  const [contactHistory, setContactHistory] = useState<HistoricoContatoItem[]>([])
  const [studentStrategies, setStudentStrategies] = useState<AlunoStrategyItem[]>([])
  const [loadingStrategies, setLoadingStrategies] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null)
  const [loadingHistoryItemId, setLoadingHistoryItemId] = useState<string | null>(null)
  const [historyResponseDrafts, setHistoryResponseDrafts] = useState<Record<string, string>>({})
  const [historyNoResponseFlags, setHistoryNoResponseFlags] = useState<Record<string, boolean>>({})
  const [savingHistoryResponseId, setSavingHistoryResponseId] = useState<string | null>(null)

  // AI state
  const [output, setOutput] = useState<string | null>(null)
  const [expandedStrategySections, setExpandedStrategySections] = useState<Record<string, boolean>>({})
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

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const r = await authFetch('/api/renewals/contact-history?limit=20')
      const data = await r.json()
      if (data.success && Array.isArray(data.data)) {
        setContactHistory(data.data as HistoricoContatoItem[])
        return
      }
      setHistoryError(data.error || 'Nao foi possivel carregar o historico')
    } catch {
      setHistoryError('Nao foi possivel carregar o historico')
    } finally {
      setHistoryLoading(false)
    }
  }, [authFetch])

  const loadStrategies = useCallback(async (alunoId: string) => {
    setLoadingStrategies(true)
    try {
      const r = await authFetch(`/api/renewals/${alunoId}/strategies?limit=20`)
      const data = await r.json()
      if (data.success && Array.isArray(data.data)) {
        setStudentStrategies(data.data as AlunoStrategyItem[])
      }
    } catch {
      // silent - nao bloqueia uso da tela
    } finally {
      setLoadingStrategies(false)
    }
  }, [authFetch])

  const saveStrategy = useCallback(async (alunoId: string, strategyText: string, source: 'ia' | 'manual' | 'historico') => {
    try {
      const r = await authFetch(`/api/renewals/${alunoId}/strategies`, {
        method: 'POST',
        body: JSON.stringify({
          alunoNome: student.name,
          strategyText,
          baseMessage,
          profileSnapshot: {
            student,
            renewalDate,
          } satisfies StrategyProfileSnapshot,
          source,
        }),
      })
      const data = await r.json()
      if (r.ok && data.success && data.data?.id) {
        setSelectedStrategyId(String(data.data.id))
        await loadStrategies(alunoId)
      }
    } catch {
      // silent - estrategia visual continua disponivel mesmo sem salvar
    }
  }, [authFetch, baseMessage, loadStrategies, renewalDate, student])

  async function handleDeleteHistory(id: string) {
    const confirmed = window.confirm('Excluir este item do historico de contatos?')
    if (!confirmed) return
    setDeletingHistoryId(id)
    setHistoryError(null)
    try {
      const res = await authFetch(`/api/renewals/contact-history?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nao foi possivel excluir este contato')
      }
      setContactHistory((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Nao foi possivel excluir este contato')
    } finally {
      setDeletingHistoryId(null)
    }
  }

  async function handleRegisterClientResponse(item: HistoricoContatoItem) {
    const noResponse = historyNoResponseFlags[item.id] ?? false
    const typedResponse = (historyResponseDrafts[item.id] || '').trim()
    const message = noResponse
      ? 'Cliente nao respondeu a tentativa anterior.'
      : typedResponse

    if (!message) {
      setHistoryError('Informe a resposta do cliente ou marque "Sem resposta" no item desejado.')
      return
    }

    setSavingHistoryResponseId(item.id)
    setHistoryError(null)
    try {
      const res = await authFetch(`/api/renewals/${item.renovacaoId}/contact`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          strategyId: item.strategyId || selectedStrategyId,
          canal: 'manual',
          tipoContato: noResponse ? 'observacao' : 'resposta',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nao foi possivel registrar resposta do cliente')
      }

      await loadHistory()
      setBaseMessage(message)
      setHistoryResponseDrafts((prev) => ({ ...prev, [item.id]: '' }))
      setHistoryNoResponseFlags((prev) => ({ ...prev, [item.id]: false }))
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Nao foi possivel registrar resposta')
    } finally {
      setSavingHistoryResponseId(null)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    if (!selectedAlunoId) {
      setStudentStrategies([])
      setSelectedStrategyId(null)
      return
    }
    void loadStrategies(selectedAlunoId)
  }, [loadStrategies, selectedAlunoId])

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
    if (aluno.telefone) setAlunoTelefone(aluno.telefone)
    setStudent((prev) => ({
      ...prev,
      name: aluno.name,
      selectedPlan: aluno.plan || prev.selectedPlan,
      notes: aluno.notes || prev.notes,
    }))
    if (aluno.renewalDate) setRenewalDate(aluno.renewalDate)
  }

  function prefillFromStrategySnapshot(snapshot: AlunoStrategyItem['profileSnapshot']) {
    if (!snapshot || typeof snapshot !== 'object') return
    if (snapshot.student && typeof snapshot.student === 'object') {
      setStudent((prev) => ({
        ...prev,
        ...snapshot.student,
      }))
    }
    if (typeof snapshot.renewalDate === 'string') {
      setRenewalDate(snapshot.renewalDate)
    }
  }

  function buildStrategyFromHistory(item: HistoricoContatoItem): string {
    const sectionTitle = item.tipoContato === 'resposta' ? 'Respostas a Objecoes' : 'Mensagens Prontas'
    const sectionLabel = item.tipoContato === 'resposta' ? 'Resposta aplicada' : 'Mensagem aplicada'
    return [
      '## 1. Resumo do Perfil',
      `Contato carregado do historico em ${formatDateTime(item.createdAt)} (${item.canal}).`,
      '',
      `## 2. ${sectionTitle}`,
      `**${sectionLabel}:**`,
      item.mensagem,
      '',
      '## 4. Proximo Passo',
      'Adaptar o texto conforme contexto atual do aluno e registrar novo contato.',
    ].join('\n')
  }

  async function handleLoadFromHistory(item: HistoricoContatoItem) {
    setLoadingHistoryItemId(item.id)
    setError(null)
    try {
      const res = await authFetch(`/api/renewals/${item.renovacaoId}`)
      const data = await res.json()
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Nao foi possivel carregar os dados do aluno')
      }

      prefillFromAluno(data.data as RenewalItem)

      if (item.strategyId) {
        const strategyRes = await authFetch(`/api/renewals/strategies/${item.strategyId}`)
        const strategyData = await strategyRes.json()
        if (strategyRes.ok && strategyData.success && strategyData.data) {
          setOutput(String(strategyData.data.strategyText || ''))
          setBaseMessage(String(strategyData.data.baseMessage || item.mensagem || ''))
          setSelectedStrategyId(String(strategyData.data.id))
          prefillFromStrategySnapshot(strategyData.data.profileSnapshot as AlunoStrategyItem['profileSnapshot'])
        } else {
          setOutput(buildStrategyFromHistory(item))
          setBaseMessage(item.mensagem)
          setSelectedStrategyId(null)
        }
      } else {
        setOutput(buildStrategyFromHistory(item))
        setBaseMessage(item.mensagem)
        setSelectedStrategyId(null)
      }

      setTab('perfil')
      setFormCollapsed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar item do historico')
    } finally {
      setLoadingHistoryItemId(null)
    }
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

  useEffect(() => {
    if (strategySections.length === 0) {
      setExpandedStrategySections({})
      return
    }
    const collapsedByDefault = strategySections.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.title] = false
      return acc
    }, {})
    setExpandedStrategySections(collapsedByDefault)
  }, [strategySections])

  useEffect(() => {
    // Ultima mensagem enviada vira base padrao para nova estrategia
    if (!selectedAlunoId) return
    const latest = filteredHistory[0]
    if (!latest) return
    setBaseMessage((prev) => (prev.trim() ? prev : latest.mensagem))
  }, [filteredHistory, selectedAlunoId])

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
            telefone: alunoTelefone,
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
          baseMessage,
          config,
          ...(diasParaRenovacao !== null ? { diasParaRenovacao } : {}),
        }),
        signal: abortRef.current.signal,
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error ?? 'Erro ao gerar estratégia')
      const strategyText = result.data.messages[0] as string
      setOutput(strategyText)
      if (alunoId) {
        await saveStrategy(alunoId, strategyText, 'ia')
      }
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
                  setSelectedStrategyId(null)
                  setStudent(EMPTY_STUDENT)
                  setRenewalDate('')
                  setBaseMessage('')
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

                      {/* Phone */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Telefone (WhatsApp)
                        <input
                          type="tel"
                          value={alunoTelefone}
                          onChange={(e) => setAlunoTelefone(e.target.value)}
                          placeholder="5511999999999"
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

                      {/* Base message */}
                      <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                        Ultima mensagem enviada (base para nova estrategia)
                        <textarea
                          value={baseMessage}
                          onChange={(e) => setBaseMessage(e.target.value)}
                          placeholder="Cole aqui a ultima mensagem enviada para usar como base"
                          className="rounded-lg border border-cyan-400/20 bg-slate-900 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none resize-none"
                          rows={3}
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
                          <div className="space-y-3">
                            {strategySections.map((section) => {
                              const isMensagens = section.title === 'Mensagens Prontas'
                              const isObjecoes = section.title === 'Respostas a Objecoes'
                              const isGatilhos = section.title === 'Gatilhos'
                              const hasMessageCards = isMensagens || isObjecoes || isGatilhos
                              const messages = hasMessageCards
                                ? (isGatilhos
                                    ? (parseGatilhosFromSection(section.content) ?? parseMessagesFromSection(section.content))
                                    : parseMessagesFromSection(section.content))
                                : null
                              const isExpanded = !!expandedStrategySections[section.title]
                              return (
                                <div
                                  key={section.title}
                                  className="rounded-lg border border-emerald-400/20 bg-slate-900/50 p-5"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                                      {section.title}
                                    </h3>
                                    <button
                                      onClick={() =>
                                        setExpandedStrategySections((prev) => ({
                                          ...prev,
                                          [section.title]: !isExpanded,
                                        }))
                                      }
                                      className="rounded border border-slate-600 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"
                                    >
                                      {isExpanded ? 'Recolher' : 'Expandir'}
                                    </button>
                                  </div>

                                  {isExpanded && (
                                    <div className="mt-3">
                                      {hasMessageCards && messages ? (
                                        <div className="space-y-3">
                                          {messages.map((msg) => {
                                            const messageId = `${section.title}-${msg.id}`
                                            const { message: msgClean, reasoning } = splitMessage(msg.text)
                                            const reasoningExpanded = !!expandedReasoning[messageId]
                                            return (
                                              <div
                                                key={messageId}
                                                className="rounded-lg border border-slate-700 bg-slate-950/60 p-4"
                                              >
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                                  {msg.label}
                                                </p>
                                                {/* Sendable message — highlighted */}
                                                <div className="rounded-md border border-emerald-400/20 bg-emerald-950/30 px-3 py-2.5 mb-3">
                                                  <p className="text-sm text-slate-100 whitespace-pre-wrap">
                                                    {msgClean}
                                                  </p>
                                                </div>
                                                {/* AI reasoning — collapsible */}
                                                {reasoning && (
                                                  <div className="mb-3">
                                                    <button
                                                      onClick={() =>
                                                        setExpandedReasoning((prev) => ({
                                                          ...prev,
                                                          [messageId]: !reasoningExpanded,
                                                        }))
                                                      }
                                                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                                                    >
                                                      <span>{reasoningExpanded ? '▾' : '▸'}</span>
                                                      Ver explicação da IA
                                                    </button>
                                                    {reasoningExpanded && (
                                                      <div className="mt-1.5 rounded-md border border-slate-700/50 bg-slate-900/40 px-3 py-2">
                                                        <p className="text-xs text-slate-400 whitespace-pre-wrap">
                                                          {reasoning.replace(/^\n+/, '')}
                                                        </p>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                                <div className="flex gap-2 flex-wrap">
                                                  <button
                                                    onClick={() => void handleMessageAction(messageId, extractMsgText(msg.text), 'copy')}
                                                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                      copiedMsgId === messageId
                                                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                                        : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                    }`}
                                                  >
                                                    {copiedMsgId === messageId ? '✓ Copiado' : '📋 Copiar'}
                                                  </button>
                                                  {(isMensagens || isObjecoes || isGatilhos) && (
                                                    <a
                                                      href={buildWhatsAppWebLink(alunoTelefone, extractMsgText(msg.text))}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                                                    >
                                                      💬 WhatsApp Web
                                                    </a>
                                                  )}
                                                  {isMensagens && whatsappConfigured && selectedAlunoId && (
                                                    <button
                                                      onClick={() => void handleMessageAction(messageId, msg.text, 'whatsapp')}
                                                      disabled={sendingMsgId === messageId}
                                                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                                                        sentMsgIds.has(messageId)
                                                          ? 'border-green-600 bg-green-500/20 text-green-300'
                                                          : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                      }`}
                                                    >
                                                      {sentMsgIds.has(messageId)
                                                        ? '✓ Enviado'
                                                        : sendingMsgId === messageId
                                                          ? 'Enviando...'
                                                          : '💬 Enviar WhatsApp'}
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      ) : (
                                        <AIFormattedResponse content={section.content} />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-emerald-400/20 bg-slate-900/50 p-5">
                            <AIFormattedResponse content={output} />
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(output)
                              setCopiedStrategy(true)
                              setTimeout(() => setCopiedStrategy(false), 2000)
                            }}
                            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                              copiedStrategy
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
                            }`}
                          >
                            {copiedStrategy ? '✓ Estratégia Copiada' : '📋 Copiar Estratégia'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-600 p-12 text-slate-400 text-center">
                        <p>
                          Preencha o perfil do aluno e clique em &quot;Gerar Estratégia&quot;
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                          Historico do Contato
                        </h3>
                        <span className="text-[11px] rounded-full border border-slate-700 bg-slate-950/70 px-2 py-0.5 text-slate-400">
                          {selectedAlunoId ? 'Filtro: aluno selecionado' : 'Filtro: todos os alunos'}
                        </span>
                      </div>

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
                                <div className="flex items-center gap-2">
                                  <p className="text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</p>
                                  <button
                                    onClick={() => void handleLoadFromHistory(item)}
                                    disabled={loadingHistoryItemId === item.id}
                                    className="text-[11px] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 rounded px-1.5 py-0.5 disabled:opacity-50"
                                  >
                                    {loadingHistoryItemId === item.id ? 'Carregando...' : 'Carregar'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setBaseMessage(item.mensagem)
                                      setSelectedStrategyId(item.strategyId || null)
                                    }}
                                    className="text-[11px] text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded px-1.5 py-0.5"
                                  >
                                    Usar como base
                                  </button>
                                  <button
                                    onClick={() => void handleDeleteHistory(item.id)}
                                    disabled={deletingHistoryId === item.id}
                                    className="text-[11px] text-red-300 hover:text-red-200 border border-red-500/30 rounded px-1.5 py-0.5 disabled:opacity-50"
                                  >
                                    {deletingHistoryId === item.id ? 'Excluindo...' : 'Excluir'}
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-400 mb-1">
                                {mapTipoContatoLabel(item.tipoContato)} • {item.canal}
                              </p>
                              <p className="text-xs text-slate-300 line-clamp-3">{item.mensagem}</p>
                              <div className="mt-3 rounded border border-slate-700 bg-slate-900/60 p-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 mb-1">
                                  Retorno deste contato
                                </p>
                                <textarea
                                  value={historyResponseDrafts[item.id] || ''}
                                  onChange={(e) =>
                                    setHistoryResponseDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  disabled={historyNoResponseFlags[item.id] || false}
                                  placeholder="Ex.: Cliente respondeu que vai verificar e retornar..."
                                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-60 resize-none"
                                  rows={2}
                                />
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                  <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={historyNoResponseFlags[item.id] || false}
                                      onChange={(e) =>
                                        setHistoryNoResponseFlags((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.checked,
                                        }))
                                      }
                                    />
                                    Sem resposta
                                  </label>
                                  <button
                                    onClick={() => void handleRegisterClientResponse(item)}
                                    disabled={savingHistoryResponseId === item.id}
                                    className="rounded border border-cyan-500/30 px-2 py-1 text-[11px] text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50"
                                  >
                                    {savingHistoryResponseId === item.id ? 'Salvando...' : 'Registrar retorno'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                          Estrategias Salvas do Aluno
                        </h3>
                        <span className="text-[11px] rounded-full border border-slate-700 bg-slate-950/70 px-2 py-0.5 text-slate-400">
                          {selectedAlunoId ? 'Aluno selecionado' : 'Selecione um aluno'}
                        </span>
                      </div>

                      {!selectedAlunoId ? (
                        <p className="text-sm text-slate-400">Selecione um aluno para ver estrategias salvas.</p>
                      ) : loadingStrategies ? (
                        <p className="text-sm text-slate-400">Carregando estrategias...</p>
                      ) : studentStrategies.length === 0 ? (
                        <p className="text-sm text-slate-400">Nenhuma estrategia salva para este aluno.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {studentStrategies.map((strategy) => (
                            <div key={strategy.id} className="rounded-md border border-slate-700 bg-slate-950/60 p-3">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-xs font-semibold text-slate-200">{strategy.alunoNome}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[11px] text-slate-400">{formatDateTime(strategy.createdAt)}</p>
                                  <button
                                    onClick={() => {
                                      setOutput(strategy.strategyText)
                                      setBaseMessage(strategy.baseMessage || '')
                                      setSelectedStrategyId(strategy.id)
                                      prefillFromStrategySnapshot(strategy.profileSnapshot)
                                      setFormCollapsed(false)
                                    }}
                                    className="text-[11px] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 rounded px-1.5 py-0.5"
                                  >
                                    Carregar
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-400 mb-1">Origem: {strategy.source}</p>
                              <p className="text-xs text-slate-300 line-clamp-3">{strategy.strategyText}</p>
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
