'use client'

import { useEffect, useState } from 'react'
import type { IntegrationConfigView, StrategyConfig } from '@/lib/types/multitenancy'
import { DEFAULT_INTEGRATION_CONFIG_VIEW, DEFAULT_STRATEGY_CONFIG } from '@/lib/types/multitenancy'
import { StrategyConfigEditor } from '@/components/retencao/StrategyConfigEditor'

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<StrategyConfig>({ ...DEFAULT_STRATEGY_CONFIG } as StrategyConfig)
  const [strategyLoading, setStrategyLoading] = useState(true)

  const [integrations, setIntegrations] = useState<IntegrationConfigView>({
    ...DEFAULT_INTEGRATION_CONFIG_VIEW,
  })
  const [integrationLoading, setIntegrationLoading] = useState(true)
  const [integrationSaving, setIntegrationSaving] = useState(false)
  const [integrationMessage, setIntegrationMessage] = useState<string | null>(null)
  const [integrationError, setIntegrationError] = useState<string | null>(null)

  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [openrouterApiKey, setOpenrouterApiKey] = useState('')
  const [openrouterModel, setOpenrouterModel] = useState('openrouter/free')
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('')
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('')
  const [whatsappBusinessAccountId, setWhatsappBusinessAccountId] = useState('')
  const [whatsappVerifyToken, setWhatsappVerifyToken] = useState('')

  useEffect(() => {
    fetch('/api/strategy-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setConfig(data.data as StrategyConfig)
      })
      .catch(() => {})
      .finally(() => setStrategyLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/admin/integrations')
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data) return
        const view = data.data as IntegrationConfigView
        setIntegrations(view)
        setOpenrouterModel(view.openrouterModel || 'openrouter/free')
        setWhatsappPhoneNumberId(view.whatsappPhoneNumberId || '')
        setWhatsappBusinessAccountId(view.whatsappBusinessAccountId || '')
      })
      .catch(() => {})
      .finally(() => setIntegrationLoading(false))
  }, [])

  async function saveIntegrations() {
    setIntegrationSaving(true)
    setIntegrationError(null)
    setIntegrationMessage(null)

    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeProvider: integrations.activeProvider,
          geminiApiKey,
          openrouterApiKey,
          openrouterModel,
          whatsappAccessToken,
          whatsappPhoneNumberId,
          whatsappBusinessAccountId,
          whatsappVerifyToken,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao salvar integrações')

      const updatedView = data.data as IntegrationConfigView
      setIntegrations(updatedView)
      setOpenrouterModel(updatedView.openrouterModel || 'openrouter/free')
      setWhatsappPhoneNumberId(updatedView.whatsappPhoneNumberId || '')
      setWhatsappBusinessAccountId(updatedView.whatsappBusinessAccountId || '')

      // Never keep secrets in memory after save success.
      setGeminiApiKey('')
      setOpenrouterApiKey('')
      setWhatsappAccessToken('')
      setWhatsappVerifyToken('')

      setIntegrationMessage('Integrações salvas com sucesso.')
    } catch (err) {
      setIntegrationError(err instanceof Error ? err.message : 'Erro ao salvar integrações')
    } finally {
      setIntegrationSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Configurações do Admin</h2>
        <p className="text-gray-500 mt-1">
          Configure estratégia e integrações da sua conta. Tudo salvo por usuário.
        </p>
      </div>

      {strategyLoading ? (
        <div className="text-gray-400 text-sm">Carregando configurações...</div>
      ) : (
        <div className="max-w-2xl space-y-8">
          {/* Dark wrapper to match the config editor style */}
          <div className="rounded-2xl bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Estratégia de IA</h3>
            <p className="text-sm text-slate-400 mb-5">
              Defina o que a IA deve gerar em cada análise de retenção.
            </p>
            <StrategyConfigEditor config={config} onChange={setConfig} autoSave={false} />
          </div>

          <div className="rounded-2xl bg-slate-900 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Integrações de API</h3>
              <p className="text-sm text-slate-400">
                Configure suas chaves de IA e WhatsApp para uso por esta conta.
              </p>
            </div>

            {integrationLoading ? (
              <div className="text-slate-400 text-sm">Carregando integrações...</div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">IA</h4>

                  <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                    Provedor ativo
                    <select
                      value={integrations.activeProvider}
                      onChange={(e) =>
                        setIntegrations((prev) => ({
                          ...prev,
                          activeProvider: e.target.value as IntegrationConfigView['activeProvider'],
                        }))
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="gemini">Gemini</option>
                      <option value="openrouter">OpenRouter</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                    Gemini API Key
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder={integrations.hasGeminiApiKey ? 'Chave ja cadastrada (digite para substituir)' : 'Cole sua chave Gemini'}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                    OpenRouter API Key
                    <input
                      type="password"
                      value={openrouterApiKey}
                      onChange={(e) => setOpenrouterApiKey(e.target.value)}
                      placeholder={
                        integrations.hasOpenrouterApiKey
                          ? 'Chave ja cadastrada (digite para substituir)'
                          : 'Cole sua chave OpenRouter'
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                    Modelo OpenRouter
                    <input
                      type="text"
                      value={openrouterModel}
                      onChange={(e) => setOpenrouterModel(e.target.value)}
                      placeholder="openrouter/free"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">WhatsApp</h4>

                  <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                    Access Token
                    <input
                      type="password"
                      value={whatsappAccessToken}
                      onChange={(e) => setWhatsappAccessToken(e.target.value)}
                      placeholder={
                        integrations.hasWhatsappAccessToken
                          ? 'Token ja cadastrado (digite para substituir)'
                          : 'Cole o access token da Meta'
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                    Phone Number ID
                    <input
                      type="text"
                      value={whatsappPhoneNumberId}
                      onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                      placeholder="Ex.: 123456789012345"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                    Business Account ID
                    <input
                      type="text"
                      value={whatsappBusinessAccountId}
                      onChange={(e) => setWhatsappBusinessAccountId(e.target.value)}
                      placeholder="Ex.: 987654321098765"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm text-slate-200">
                    Verify Token
                    <input
                      type="password"
                      value={whatsappVerifyToken}
                      onChange={(e) => setWhatsappVerifyToken(e.target.value)}
                      placeholder={
                        integrations.hasWhatsappVerifyToken
                          ? 'Token ja cadastrado (digite para substituir)'
                          : 'Token de verificacao do webhook'
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void saveIntegrations()}
                    disabled={integrationSaving}
                    className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {integrationSaving ? 'Salvando...' : 'Salvar integrações'}
                  </button>

                  <div className="text-xs text-slate-400 text-right">
                    <p>Gemini: {integrations.hasGeminiApiKey ? 'configurado' : 'pendente'}</p>
                    <p>OpenRouter: {integrations.hasOpenrouterApiKey ? 'configurado' : 'pendente'}</p>
                    <p>WhatsApp token: {integrations.hasWhatsappAccessToken ? 'configurado' : 'pendente'}</p>
                  </div>
                </div>

                {integrationMessage && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
                    {integrationMessage}
                  </div>
                )}

                {integrationError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-200">
                    {integrationError}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
