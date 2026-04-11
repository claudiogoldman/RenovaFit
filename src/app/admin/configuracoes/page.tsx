'use client'

import { useEffect, useState } from 'react'
import type { StrategyConfig } from '@/lib/types/multitenancy'
import { DEFAULT_STRATEGY_CONFIG } from '@/lib/types/multitenancy'
import { StrategyConfigEditor } from '@/components/retencao/StrategyConfigEditor'

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<StrategyConfig>({ ...DEFAULT_STRATEGY_CONFIG } as StrategyConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/strategy-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setConfig(data.data as StrategyConfig)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Configurações da Estratégia de IA</h2>
        <p className="text-gray-500 mt-1">
          Defina o que a IA deve gerar em cada análise de retenção. As configurações são salvas por usuário.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Carregando configurações...</div>
      ) : (
        <div className="max-w-2xl">
          {/* Dark wrapper to match the config editor style */}
          <div className="rounded-2xl bg-slate-900 p-6">
            <StrategyConfigEditor config={config} onChange={setConfig} autoSave={false} />
          </div>
        </div>
      )}
    </div>
  )
}
