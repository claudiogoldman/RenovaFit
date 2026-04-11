'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RenewalItem, RenewalStatus } from '@/lib/types'

interface AlunoSearchProps {
  authFetch: (url: string, init?: RequestInit) => Promise<Response>
  onSelect: (aluno: RenewalItem) => void
  onNew: () => void
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function statusLabel(status: RenewalStatus): string {
  const map: Record<RenewalStatus, string> = {
    ativo: 'Ativo',
    sumido: 'Sumido',
    critico: 'Crítico',
    renovado: 'Renovado',
  }
  return map[status] ?? status
}

export function AlunoSearch({ authFetch, onSelect, onNew }: AlunoSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RenewalItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(
    async (term: string) => {
      if (term.length < 2) {
        setResults([])
        setOpen(false)
        return
      }
      setLoading(true)
      try {
        const res = await authFetch(`/api/renewals?q=${encodeURIComponent(term)}`)
        const data = await res.json()
        if (data.success) {
          setResults(data.data as RenewalItem[])
          setOpen(true)
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [authFetch],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(aluno: RenewalItem) {
    setQuery(aluno.name)
    setOpen(false)
    onSelect(aluno)
  }

  function handleNew() {
    setQuery('')
    setOpen(false)
    onNew()
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Buscar aluno existente
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Digite o nome do aluno (mín. 2 caracteres)..."
          className="w-full rounded-lg border border-emerald-400/20 bg-slate-900 pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            Buscando...
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              Nenhum aluno encontrado. Cadastre um novo ↓
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-800">
              {results.map((aluno) => {
                const days = daysUntil(aluno.renewalDate)
                return (
                  <li key={aluno.id}>
                    <button
                      onClick={() => handleSelect(aluno)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-white">{aluno.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-slate-400">{aluno.plan}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full border ${
                              aluno.status === 'renovado'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : aluno.status === 'critico'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : aluno.status === 'sumido'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {statusLabel(aluno.status)}
                          </span>
                          {days !== null && (
                            <span
                              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                days <= 7
                                  ? 'bg-red-500/20 text-red-300'
                                  : days <= 30
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              D-{days}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* New student button */}
      <button
        onClick={handleNew}
        className="mt-2 flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        <span>Novo aluno (preencher manualmente)</span>
      </button>
    </div>
  )
}
