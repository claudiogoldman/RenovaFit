'use client'

import type { StrategyConfig } from '@/lib/types/multitenancy'
import { StrategyConfigEditor, type StrategyConfigSaveState } from './StrategyConfigEditor'

interface StrategyConfigDrawerProps {
  config: StrategyConfig
  onChange: (config: StrategyConfig) => void
  onClose: () => void
  onSaveStateChange?: (state: StrategyConfigSaveState) => void
}

function activeCount(config: StrategyConfig): number {
  return [
    true, // resumo always active
    config.section_mensagens,
    config.section_objecoes,
    config.section_proximo_passo,
    config.section_gatilhos,
    config.section_historico,
  ].filter(Boolean).length
}

export function StrategyConfigDrawer({
  config,
  onChange,
  onClose,
  onSaveStateChange,
}: StrategyConfigDrawerProps) {
  return (
    <div className="w-80 flex-shrink-0 rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div>
          <h3 className="text-sm font-semibold text-white">Configurações</h3>
          <p className="text-xs text-slate-400">{activeCount(config)} seções ativas</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-lg leading-none transition-colors"
          aria-label="Fechar configurações"
        >
          ×
        </button>
      </div>
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        <StrategyConfigEditor
          config={config}
          onChange={onChange}
          autoSave
          onSaveStateChange={onSaveStateChange}
        />
      </div>
    </div>
  )
}
