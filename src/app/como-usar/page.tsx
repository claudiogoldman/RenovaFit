'use client'

import { useState } from 'react'
import Link from 'next/link'

type DetailId = string | null

export default function ComoUsarPage() {
  const [openDetail, setOpenDetail] = useState<DetailId>(null)

  function toggle(id: string) {
    setOpenDetail(prev => prev === id ? null : id)
  }

  function Detail({ id, children }: { id: string; children: React.ReactNode }) {
    return openDetail === id ? (
      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 leading-relaxed">
        {children}
      </div>
    ) : null
  }

  function Box({
    id, title, sub, color
  }: {
    id: string
    title: string
    sub?: string
    color: 'purple' | 'teal' | 'amber' | 'green' | 'gray' | 'blue'
  }) {
    const colors = {
      purple: 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100',
      teal:   'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100',
      amber:  'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
      green:  'bg-green-50 text-green-800 border-green-300 hover:bg-green-100',
      gray:   'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100',
      blue:   'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100',
    }
    return (
      <button
        onClick={() => toggle(id)}
        className={`rounded-lg px-4 py-2 text-sm font-medium border text-center min-w-[130px] transition-colors ${colors[color]} ${openDetail === id ? 'ring-2 ring-offset-1 ring-current' : ''}`}
      >
        <div>{title}</div>
        {sub && <div className="text-xs font-normal opacity-70 mt-0.5">{sub}</div>}
      </button>
    )
  }

  function Arrow() {
    return <span className="text-gray-400 text-lg flex-shrink-0">→</span>
  }

  function Divider() {
    return <div className="border-t border-gray-100 my-6" />
  }

  function PhaseLabel({ children }: { children: React.ReactNode }) {
    return (
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
        {children}
      </p>
    )
  }

  function Row({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-1">
        {children}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900">RenovaFit</Link>
        <Link
          href="/retencao"
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Acessar sistema
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Como usar o RenovaFit
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-2xl">
            Jornada completa do sistema — do primeiro acesso até a renovação do aluno.
            Clique em qualquer etapa para ver os detalhes.
          </p>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mb-8">
          {[
            { color: 'bg-purple-400', label: 'Super admin (dono da rede)' },
            { color: 'bg-teal-400',   label: 'Admin de filial' },
            { color: 'bg-amber-400',  label: 'Atendente' },
            { color: 'bg-gray-400',   label: 'Visualizador' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>

        <Divider />

        {/* Fase 1 */}
        <PhaseLabel>Fase 1 — Primeiro acesso (super admin)</PhaseLabel>
        <Row>
          <Box id="d1" title="Acessa o sistema" sub="Tela inicial com 3 módulos" color="purple" />
          <Arrow />
          <Box id="d2" title="Cria conta" sub="Email + senha via Supabase" color="purple" />
          <Arrow />
          <Box id="d3" title="Perfil super_admin" sub="Vinculado à empresa" color="purple" />
        </Row>
        <Detail id="d1">
          <strong className="text-gray-800">Tela home:</strong> apresenta os 3 módulos — Conversão, Retenção e Reativação. Botão de login/cadastro no canto superior.
        </Detail>
        <Detail id="d2">
          <strong className="text-gray-800">Cadastro:</strong> email e senha. O Supabase Auth cria o usuário e o trigger automático cria o perfil na tabela profiles.
        </Detail>
        <Detail id="d3">
          <strong className="text-gray-800">Perfil inicial:</strong> o primeiro usuário é promovido a super_admin no setup. Depois, ele cria todos os demais usuários da rede.
        </Detail>

        <Divider />

        {/* Fase 2 */}
        <PhaseLabel>Fase 2 — Configuração da rede (super admin)</PhaseLabel>
        <Row>
          <Box id="d4" title="/admin/empresas" sub="Cria a empresa/rede" color="purple" />
          <Arrow />
          <Box id="d5" title="/admin/filiais" sub="Cria cada filial" color="purple" />
          <Arrow />
          <Box id="d6" title="/admin/usuarios" sub="Cria admins de filial" color="purple" />
          <Arrow />
          <Box id="d7" title="/admin/whatsapp" sub="Conecta WhatsApp" color="purple" />
        </Row>
        <Detail id="d4">
          <strong className="text-gray-800">Empresas:</strong> nome da rede, slug único, logo. Ex: &quot;Engenharia do Corpo&quot;.
        </Detail>
        <Detail id="d5">
          <strong className="text-gray-800">Filiais:</strong> nome, cidade, estado, telefone, empresa pai. O RLS garante que dados não vazam entre filiais.
        </Detail>
        <Detail id="d6">
          <strong className="text-gray-800">Usuários:</strong> email, nome, papel (branch_admin / attendant / viewer) e filial. O sistema envia convite pelo Supabase Auth.
        </Detail>
        <Detail id="d7">
          <strong className="text-gray-800">WhatsApp:</strong> fluxo Embedded Signup da Meta. Token salvo por filial — cada uma usa seu próprio número Business.
        </Detail>

        <Divider />

        {/* Fase 3 */}
        <PhaseLabel>Fase 3 — Operação diária (admin de filial)</PhaseLabel>
        <Row>
          <Box id="d8" title="Login na filial" sub="Vê só sua filial" color="teal" />
          <Arrow />
          <Box id="d9" title="/admin/renovacoes" sub="Lista de alunos" color="teal" />
          <Arrow />
          <Box id="d10" title="Cria atendentes" sub="/admin/usuarios" color="teal" />
          <Arrow />
          <Box id="d11" title="Acompanha KPIs" sub="Dashboard da filial" color="teal" />
        </Row>
        <Detail id="d8">
          <strong className="text-gray-800">Isolamento:</strong> o branch_admin vê apenas dados da própria filial. O RLS no Supabase bloqueia acesso a outras filiais automaticamente.
        </Detail>
        <Detail id="d9">
          <strong className="text-gray-800">Lista de renovação:</strong> alunos com status (Ativo / Sumido / Crítico / Renovado), dias até vencimento, último contato.
        </Detail>
        <Detail id="d10">
          <strong className="text-gray-800">Gestão de equipe:</strong> cria atendentes e visualizadores vinculados à própria filial. Não acessa outras filiais.
        </Detail>
        <Detail id="d11">
          <strong className="text-gray-800">Dashboard:</strong> taxa de renovação, alunos em risco, total de contatos, mensagens enviadas. Visão gerencial da filial.
        </Detail>

        <Divider />

        {/* Fase 4 */}
        <PhaseLabel>Fase 4 — Atendimento (atendente)</PhaseLabel>
        <Row>
          <Box id="d12" title="/admin/renovacoes" sub="Abre a lista" color="amber" />
          <Arrow />
          <Box id="d13" title="Clica no aluno" sub="Form pré-preenchido" color="amber" />
          <Arrow />
          <Box id="d14" title="Completa o perfil" sub="Idade, objetivo, rotina" color="amber" />
          <Arrow />
          <Box id="d15" title="Gera estratégia IA" sub="4 versões de mensagem" color="amber" />
        </Row>
        <Detail id="d12">
          <strong className="text-gray-800">Lista filtrada:</strong> o atendente vê apenas os alunos da sua filial. Filtra por status, plano e busca por nome.
        </Detail>
        <Detail id="d13">
          <strong className="text-gray-800">Auto-preenchimento:</strong> nome, plano, status e notas já vêm da lista. Atendente completa apenas o que a IA precisa para personalizar.
        </Detail>
        <Detail id="d14">
          <strong className="text-gray-800">Campos manuais:</strong> idade, sexo, objetivo (emagrecer, hipertrofia, saúde), filhos, rotina atual. Mais detalhes = mensagem mais personalizada.
        </Detail>
        <Detail id="d15">
          <strong className="text-gray-800">Resultado:</strong> IA gera 4 versões — primeira abordagem, follow-up, direta e consultiva. Mais respostas para objeções (preço, tempo, desmotivação).
        </Detail>

        <div className="mt-3">
          <Row>
            <Box id="d16" title="Escolhe a mensagem" sub="Copia ou envia direto" color="amber" />
            <Arrow />
            <Box id="d17" title="Envia via WhatsApp" sub="API da Meta" color="green" />
            <Arrow />
            <Box id="d18" title="Marca contatado" sub="Salva no histórico" color="amber" />
            <Arrow />
            <Box id="d19" title="Aluno renovado" sub="Status atualizado" color="green" />
          </Row>
          <Detail id="d16">
            <strong className="text-gray-800">Escolha:</strong> atendente lê as 4 versões e escolhe a mais adequada. Pode editar o texto antes de enviar.
          </Detail>
          <Detail id="d17">
            <strong className="text-gray-800">Envio:</strong> usa o número Business da filial configurado. Mensagem vai da conta da academia, não de número pessoal.
          </Detail>
          <Detail id="d18">
            <strong className="text-gray-800">Histórico:</strong> cada contato salvo com data, canal, mensagem e responsável. Aparece no card do aluno nas próximas aberturas.
          </Detail>
          <Detail id="d19">
            <strong className="text-gray-800">Fechamento:</strong> status atualizado para &quot;Renovado&quot;. A taxa de renovação sobe automaticamente no dashboard do admin.
          </Detail>
        </div>

        <Divider />

        {/* Fase 5 */}
        <PhaseLabel>Fase 5 — Visão gerencial (super admin da rede)</PhaseLabel>
        <Row>
          <Box id="d20" title="/admin" sub="Dashboard geral" color="purple" />
          <Arrow />
          <Box id="d21" title="Compara filiais" sub="KPIs side by side" color="purple" />
          <Arrow />
          <Box id="d22" title="Identifica riscos" sub="Alunos críticos" color="purple" />
          <Arrow />
          <Box id="d23" title="Toma decisões" sub="Reforça equipe" color="purple" />
        </Row>
        <Detail id="d20">
          <strong className="text-gray-800">Visão total:</strong> super_admin vê todas as empresas e filiais. Alterna entre filiais pelo BranchSelector no topo.
        </Detail>
        <Detail id="d21">
          <strong className="text-gray-800">Comparativo:</strong> taxa de renovação por filial, volume de contatos, alunos em risco. Identifica filiais performando bem e mal.
        </Detail>
        <Detail id="d22">
          <strong className="text-gray-800">Alerta:</strong> alunos com status &quot;Crítico&quot; (D-7 ou menos) aparecem em destaque. Super admin pode atribuir para atendente específico.
        </Detail>
        <Detail id="d23">
          <strong className="text-gray-800">Ação:</strong> cria novos atendentes para filiais sobrecarregadas, ajusta equipe, exporta dados para análise.
        </Detail>

        <Divider />

        {/* CTA */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pronto para começar?</h2>
          <p className="text-gray-500 text-sm mb-6">
            Crie sua conta e comece a reter mais alunos com IA.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/retencao"
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Acessar o sistema
            </Link>
            <Link
              href="/"
              className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Ver módulos
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
