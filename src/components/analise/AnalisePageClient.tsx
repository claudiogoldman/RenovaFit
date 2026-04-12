'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { AlunoSearch } from '@/components/retencao/AlunoSearch'
import { AIFormattedResponse } from '@/components/ai-formatted-response'
import type { HistoricoContatoItem, RenewalItem } from '@/lib/types'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function mapTipo(tipo: HistoricoContatoItem['tipoContato']): string {
  if (tipo === 'primeiro_contato') return 'Primeiro contato'
  if (tipo === 'followup') return 'Follow-up'
  if (tipo === 'resposta') return 'Resposta'
  return 'Observação'
}

type ParsedSection = { title: string; content: string }

function parseSections(text: string): ParsedSection[] {
  const lines = text.split('\n')
  const sections: ParsedSection[] = []
  let title: string | null = null
  let buf: string[] = []

  const flush = () => {
    if (!title) return
    const content = buf.join('\n').trim()
    if (content) sections.push({ title, content })
  }

  for (const line of lines) {
    const m = line.match(/^#{1,3}\s+(.+)$/)
    if (m) {
      flush()
      title = m[1].replace(/^\d+[.)]\s*/, '').trim()
      buf = []
    } else if (title) {
      buf.push(line)
    }
  }
  flush()
  return sections
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AnalisePageClient() {
  const router = useRouter()

  const supabase = useMemo(() => {
    try { return createSupabaseBrowserClient() } catch { return null }
  }, [])

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [supabase])

  const authFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const token = await getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> ?? {}),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(url, { ...init, headers })
  }, [getToken])

  /* --- input mode --- */
  const [inputMode, setInputMode] = useState<'historico' | 'livre'>('historico')

  /* --- aluno selecionado --- */
  const [selectedAluno, setSelectedAluno] = useState<RenewalItem | null>(null)
  const [alunoNomeLivre, setAlunoNomeLivre] = useState('')

  /* --- histórico carregado --- */
  const [history, setHistory] = useState<HistoricoContatoItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  /* --- texto livre --- */
  const [textoLivre, setTextoLivre] = useState('')

  /* --- análise --- */
  const [analise, setAnalise] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* --- ações pós-análise --- */
  const [script, setScript] = useState<string | null>(null)
  const [generatingScript, setGeneratingScript] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [savingHistory, setSavingHistory] = useState(false)
  const [savedHistoryMsg, setSavedHistoryMsg] = useState<string | null>(null)
  const [copiedAnalise, setCopiedAnalise] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  /* --- seções colapsadas --- */
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedScriptSections, setExpandedScriptSections] = useState<Record<string, boolean>>({})

  const analyseSections = useMemo(() => {
    const s = parseSections(analise ?? '')
    const all: Record<string, boolean> = {}
    s.forEach(sec => { all[sec.title] = false })
    return s
  }, [analise])

  const scriptSections = useMemo(() => parseSections(script ?? ''), [script])

  /* ---------------------------------------------------------------- */
  /* Load history for selected student                                */
  /* ---------------------------------------------------------------- */
  async function loadHistory(alunoId: string) {
    setLoadingHistory(true)
    setHistoryError(null)
    setHistory([])
    try {
      const r = await authFetch(`/api/renewals/contact-history?limit=50&alunoId=${encodeURIComponent(alunoId)}`)
      const data = await r.json()
      if (data.success && Array.isArray(data.data)) {
        const items = (data.data as HistoricoContatoItem[]).filter(
          (item) => item.renovacaoId === alunoId
        )
        setHistory(items)
      } else {
        setHistoryError(data.error || 'Não foi possível carregar o histórico')
      }
    } catch {
      setHistoryError('Não foi possível carregar o histórico')
    } finally {
      setLoadingHistory(false)
    }
  }

  function handleSelectAluno(aluno: RenewalItem) {
    setSelectedAluno(aluno)
    setAlunoNomeLivre(aluno.name)
    setAnalise(null)
    setScript(null)
    setError(null)
    void loadHistory(aluno.id)
  }

  /* ---------------------------------------------------------------- */
  /* Analyse                                                          */
  /* ---------------------------------------------------------------- */
  async function handleAnalyse() {
    setAnalise(null)
    setScript(null)
    setError(null)
    setScriptError(null)
    setSavedHistoryMsg(null)
    setLoading(true)
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)

    try {
      const alunoNome = inputMode === 'historico'
        ? (selectedAluno?.name ?? 'Aluno')
        : (alunoNomeLivre.trim() || 'Aluno')

      const body =
        inputMode === 'historico'
          ? {
              mode: 'historico',
              alunoNome,
              interacoes: history.map(h => ({
                data: formatDateTime(h.createdAt),
                canal: h.canal,
                tipo: mapTipo(h.tipoContato),
                mensagem: h.mensagem,
              })),
            }
          : {
              mode: 'livre',
              alunoNome,
              textoLivre,
            }

      const res = await authFetch('/api/analise', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao gerar análise')
      const text = String(data.data.analise)
      setAnalise(text)
      // open first section automatically
      const sections = parseSections(text)
      if (sections[0]) {
        setExpandedSections({ [sections[0].title]: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Post-analysis actions                                            */
  /* ---------------------------------------------------------------- */
  async function handleGenerateScript() {
    if (!analise) return
    setGeneratingScript(true)
    setScriptError(null)
    setScript(null)
    try {
      const alunoNome = (selectedAluno?.name ?? alunoNomeLivre.trim()) || 'Aluno'
      const res = await authFetch('/api/analise', {
        method: 'POST',
        body: JSON.stringify({ mode: 'script', alunoNome, analise }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao gerar script')
      const text = String(data.data.analise)
      setScript(text)
      const sections = parseSections(text)
      if (sections[0]) {
        setExpandedScriptSections({ [sections[0].title]: true })
      }
    } catch (err) {
      setScriptError(err instanceof Error ? err.message : 'Erro ao gerar script')
    } finally {
      setGeneratingScript(false)
    }
  }

  async function handleSaveToHistory() {
    if (!analise || !selectedAluno) return
    setSavingHistory(true)
    setSavedHistoryMsg(null)
    try {
      const resumo = analise.split('\n').slice(0, 6).join('\n').trim()
      const res = await authFetch(`/api/renewals/${selectedAluno.id}/contact`, {
        method: 'POST',
        body: JSON.stringify({
          message: `[Análise de Interações]\n${resumo}`,
          canal: 'manual',
          tipoContato: 'observacao',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao salvar')
      setSavedHistoryMsg('Síntese salva no histórico de contato.')
    } catch (err) {
      setSavedHistoryMsg(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSavingHistory(false)
    }
  }

  function handleOpenRetencao() {
    if (!selectedAluno) return
    router.push(`/retencao?alunoId=${encodeURIComponent(selectedAluno.id)}`)
  }

  async function handleCopyAnalise() {
    if (!analise) return
    await navigator.clipboard.writeText(analise)
    setCopiedAnalise(true)
    setTimeout(() => setCopiedAnalise(false), 2000)
  }

  async function handleCopyScript() {
    if (!script) return
    await navigator.clipboard.writeText(script)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  const canAnalyse =
    inputMode === 'historico'
      ? history.length > 0
      : textoLivre.trim().length > 20

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
            🔍 Análise
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">Analisador de Interações</h1>
          <p className="text-slate-400 text-sm mt-1">
            A IA avalia a qualidade das suas interações com um aluno e sugere próximos passos.
          </p>
        </div>

        {/* Input Mode Switcher */}
        <div className="flex gap-2 mb-6">
          {(['historico', 'livre'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => {
                setInputMode(mode)
                setAnalise(null)
                setScript(null)
                setError(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                inputMode === mode
                  ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'historico' ? '📋 Histórico cadastrado' : '✏️ Texto livre'}
            </button>
          ))}
        </div>

        {/* Input Panel */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 mb-6 space-y-4">
          {inputMode === 'historico' ? (
            <>
              <AlunoSearch
                authFetch={authFetch}
                onSelect={handleSelectAluno}
                onNew={() => {
                  setSelectedAluno(null)
                  setHistory([])
                  setAnalise(null)
                  setScript(null)
                }}
              />
              {loadingHistory && (
                <p className="text-sm text-slate-400">Carregando histórico...</p>
              )}
              {historyError && (
                <p className="text-sm text-red-300">{historyError}</p>
              )}
              {!loadingHistory && selectedAluno && history.length === 0 && (
                <p className="text-sm text-slate-400">
                  Nenhuma interação registrada para {selectedAluno.name}.
                </p>
              )}
              {history.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                    {history.length} interações encontradas
                  </p>
                  {history.map(item => (
                    <div key={item.id} className="rounded-md border border-slate-700 bg-slate-950/60 p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[11px] font-semibold text-slate-200">
                          {mapTipo(item.tipoContato)} · {item.canal}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{item.mensagem}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                Nome do aluno (opcional)
                <input
                  value={alunoNomeLivre}
                  onChange={e => setAlunoNomeLivre(e.target.value)}
                  placeholder="Ex.: Carlos Silva"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                Cole as interações aqui
                <textarea
                  value={textoLivre}
                  onChange={e => setTextoLivre(e.target.value)}
                  placeholder={`Ex.:\n[12/04 09:00] WhatsApp: "Oi Carlos, tudo bem? Queria falar sobre a renovação..."\n[12/04 18:30] WhatsApp: "Oi! Vou ver aqui e te retorno semana que vem."`}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none resize-none"
                  rows={8}
                />
              </label>
            </>
          )}

          <button
            onClick={() => void handleAnalyse()}
            disabled={loading || !canAnalyse}
            className="w-full rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? `Analisando... ${elapsedSeconds}s` : '🔍 Analisar Interações'}
          </button>

          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-900/20 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Analysis Result */}
        {analise && (
          <div className="space-y-6">
            {/* Action bar */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-sm font-semibold text-violet-300 mb-3">
                O que fazer com esta análise?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void handleGenerateScript()}
                  disabled={generatingScript}
                  className="flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 disabled:opacity-50 transition"
                >
                  {generatingScript ? 'Gerando...' : '📝 Gerar Script de Vendas'}
                </button>
                {selectedAluno && (
                  <>
                    <button
                      onClick={handleOpenRetencao}
                      className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                    >
                      💚 Abrir na Retenção
                    </button>
                    <button
                      onClick={() => void handleSaveToHistory()}
                      disabled={savingHistory}
                      className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition"
                    >
                      {savingHistory ? 'Salvando...' : '💾 Salvar no Histórico'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => void handleCopyAnalise()}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    copiedAnalise
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {copiedAnalise ? '✓ Copiado' : '📋 Copiar Análise'}
                </button>
              </div>
              {savedHistoryMsg && (
                <p className="mt-2 text-xs text-cyan-300">{savedHistoryMsg}</p>
              )}
              {scriptError && (
                <p className="mt-2 text-xs text-red-300">{scriptError}</p>
              )}
            </div>

            {/* Analysis sections */}
            <div>
              <h2 className="text-base font-bold text-violet-400 mb-3">📊 Resultado da Análise</h2>
              <div className="space-y-2">
                {analyseSections.length > 0 ? (
                  analyseSections.map(section => {
                    const isExpanded = !!expandedSections[section.title]
                    return (
                      <div key={section.title} className="rounded-lg border border-violet-400/20 bg-slate-900/50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-300">
                            {section.title}
                          </h3>
                          <button
                            onClick={() =>
                              setExpandedSections(prev => ({
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
                            <AIFormattedResponse content={section.content} />
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-lg border border-violet-400/20 bg-slate-900/50 p-5">
                    <AIFormattedResponse content={analise} />
                  </div>
                )}
              </div>
            </div>

            {/* Script de Vendas */}
            {script && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-amber-400">📝 Script de Vendas</h2>
                  <button
                    onClick={() => void handleCopyScript()}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      copiedScript
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {copiedScript ? '✓ Copiado' : '📋 Copiar Script'}
                  </button>
                </div>
                <div className="space-y-2">
                  {scriptSections.length > 0 ? (
                    scriptSections.map(section => {
                      const isExpanded = !!expandedScriptSections[section.title]
                      return (
                        <div key={section.title} className="rounded-lg border border-amber-400/20 bg-slate-900/50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
                              {section.title}
                            </h3>
                            <button
                              onClick={() =>
                                setExpandedScriptSections(prev => ({
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
                              <AIFormattedResponse content={section.content} />
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-lg border border-amber-400/20 bg-slate-900/50 p-5">
                      <AIFormattedResponse content={script} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
