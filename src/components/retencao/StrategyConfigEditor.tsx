'use client'

import { useEffect, useRef, useState } from 'react'
import type { StrategyConfig } from '@/lib/types/multitenancy'

export interface StrategyConfigSaveState {
  saving: boolean
  lastSaved: Date | null
  saveError: string | null
}

interface StrategyConfigEditorProps {
  config: StrategyConfig
  onChange: (config: StrategyConfig) => void
  autoSave?: boolean
  onSaveStateChange?: (state: StrategyConfigSaveState) => void
}

export function StrategyConfigEditor({
  config,
  onChange,
  autoSave = false,
  onSaveStateChange,
}: StrategyConfigEditorProps) {
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    onSaveStateChange?.({ saving, lastSaved, saveError })
  }, [saving, lastSaved, saveError, onSaveStateChange])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current)
      }
    }
  }, [])

  async function saveConfig(cfg: StrategyConfig) {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/strategy-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao salvar')
      if (isMounted.current) setLastSaved(new Date())
    } catch (err) {
      if (isMounted.current) setSaveError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      if (isMounted.current) setSaving(false)
    }
  }

  function update(patch: Partial<StrategyConfig>) {
    const next = { ...config, ...patch, section_resumo: true } as StrategyConfig
    onChange(next)
    if (autoSave) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
      autoSaveRef.current = setTimeout(() => void saveConfig(next), 800)
    }
  }

  function Toggle({
    label,
    checked,
    onToggle,
    disabled,
    indent,
  }: {
    label: string
    checked: boolean
    onToggle: () => void
    disabled?: boolean
    indent?: boolean
  }) {
    return (
      <label
        className={`flex items-center gap-3 cursor-pointer ${indent ? 'ml-5' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={onToggle}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            checked ? 'bg-emerald-500' : 'bg-slate-600'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-slate-200">{label}</span>
      </label>
    )
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    )
  }

  function relativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime()
    const diffSecs = Math.round(diffMs / 1000)
    if (diffSecs < 60) return 'agora mesmo'
    const diffMins = Math.round(diffSecs / 60)
    if (diffMins === 1) return 'há 1 min'
    return `há ${diffMins} min`
  }

  return (
    <div className="space-y-4">
      <Section title="Seções da estratégia">
        <Toggle label="Resumo do perfil (obrigatório)" checked={true} onToggle={() => {}} disabled />
        <Toggle
          label="Mensagens prontas para WhatsApp"
          checked={config.section_mensagens}
          onToggle={() => update({ section_mensagens: !config.section_mensagens })}
        />
        {config.section_mensagens && (
          <>
            <Toggle
              label="1ª abordagem"
              checked={config.msg_primeira_abordagem}
              onToggle={() => update({ msg_primeira_abordagem: !config.msg_primeira_abordagem })}
              indent
            />
            <Toggle
              label="Follow-up"
              checked={config.msg_followup}
              onToggle={() => update({ msg_followup: !config.msg_followup })}
              indent
            />
            <Toggle
              label="Versão direta"
              checked={config.msg_direta}
              onToggle={() => update({ msg_direta: !config.msg_direta })}
              indent
            />
            <Toggle
              label="Versão consultiva"
              checked={config.msg_consultiva}
              onToggle={() => update({ msg_consultiva: !config.msg_consultiva })}
              indent
            />
          </>
        )}
        <Toggle
          label="Respostas a objeções"
          checked={config.section_objecoes}
          onToggle={() => update({ section_objecoes: !config.section_objecoes })}
        />
        {config.section_objecoes && (
          <>
            <Toggle
              label="Preço / dinheiro"
              checked={config.obj_preco}
              onToggle={() => update({ obj_preco: !config.obj_preco })}
              indent
            />
            <Toggle
              label="Falta de tempo"
              checked={config.obj_tempo}
              onToggle={() => update({ obj_tempo: !config.obj_tempo })}
              indent
            />
            <Toggle
              label="Desmotivação"
              checked={config.obj_motivacao}
              onToggle={() => update({ obj_motivacao: !config.obj_motivacao })}
              indent
            />
            <Toggle
              label="Concorrência"
              checked={config.obj_concorrencia}
              onToggle={() => update({ obj_concorrencia: !config.obj_concorrencia })}
              indent
            />
            <Toggle
              label="Problema de saúde"
              checked={config.obj_saude}
              onToggle={() => update({ obj_saude: !config.obj_saude })}
              indent
            />
          </>
        )}
        <Toggle
          label="Próximo passo recomendado"
          checked={config.section_proximo_passo}
          onToggle={() => update({ section_proximo_passo: !config.section_proximo_passo })}
        />
        <Toggle
          label="Gatilhos emocionais"
          checked={config.section_gatilhos}
          onToggle={() => update({ section_gatilhos: !config.section_gatilhos })}
        />
        <Toggle
          label="Considerar histórico de contatos"
          checked={config.section_historico}
          onToggle={() => update({ section_historico: !config.section_historico })}
        />
      </Section>

      <Section title="Tom da estratégia">
        <div className="flex flex-wrap gap-3">
          {(['executivo', 'equilibrado', 'consultivo'] as const).map((tom) => (
            <label key={tom} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tom"
                value={tom}
                checked={config.tom === tom}
                onChange={() => update({ tom })}
                className="accent-emerald-400"
              />
              <span className="text-sm text-slate-200 capitalize">{tom}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {config.tom === 'executivo' && 'Direto e conciso. Bullet points.'}
          {config.tom === 'equilibrado' && 'Equilibrio entre objetividade e empatia.'}
          {config.tom === 'consultivo' && 'Detalhado e empático. Explica o raciocínio.'}
        </p>
      </Section>

      <Section title="Contexto adicional">
        <textarea
          value={config.contexto_adicional ?? ''}
          onChange={(e) => update({ contexto_adicional: e.target.value })}
          placeholder='Ex.: "Nossa academia tem piscina e sauna. Enfatize os diferenciais ao mencionar estrutura."'
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none resize-none"
        />
      </Section>

      {!autoSave && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => void saveConfig(config)}
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
          {lastSaved && (
            <span className="text-xs text-slate-400">Último save: {relativeTime(lastSaved)}</span>
          )}
        </div>
      )}

      {autoSave && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{saving ? 'Salvando...' : lastSaved ? `Salvo ${relativeTime(lastSaved)}` : 'Alterações salvas automaticamente'}</span>
        </div>
      )}

      {saveError && (
        <p className="text-sm text-red-300 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2">
          {saveError}
        </p>
      )}
    </div>
  )
}
