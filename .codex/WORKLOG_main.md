# WORKLOG — Coordenação Copilot + Codex

> **Arquivo único de estado compartilhado.**  
> Codex usa este arquivo como `WORKLOG_work.md` (sinônimo).

---

## Fluxo obrigatório para toda tarefa

```
1. git pull origin main          # sincronizar antes de começar
2. Registrar lock neste arquivo  # quais arquivos vai tocar
3. git checkout -b feat/nome     # NUNCA commitar direto na main
4. Fazer commits na branch
5. Abrir PR para main
6. Após merge: remover lock + atualizar Handoff abaixo
```

> ⚠️ Commits diretos na `main` são proibidos a partir de agora.  
> O lock evita que Copilot e Codex abram PRs tocando no mesmo arquivo.

---

## Objetivo
Manter o fluxo Copilot + Codex sincronizado, com handoff claro e sem conflitos.

## Arquivos em edicao (lock)
- **Copilot** (feat/history-client-response-base):
  - `src/components/retencao/RetencaoPageClient.tsx`

## Checklist da tarefa atual
- [x] Versionar template de rotina Codex/Copilot
- [x] Adicionar arquivo de coordenação para handoff
- [x] Ajustar lint para evitar falsos positivos em TypeScript/DOM
- [x] Corrigir warnings de variáveis/imports não usados no backend
- [x] Abas em /admin/configuracoes (Estratégia IA / Integrações)
- [x] Form colapsável na página de Retenção
- [x] Atualizar /como-usar com funcionalidades recentes
- [x] Definir fluxo branch + PR + lock como padrão

## Ultimas decisoes
- Padrão de coordenação fica em `CODEX_WORKFLOW_TEMPLATE.md`.
- Handoff operacional fica em `.codex/WORKLOG_main.md`.
- `no-undef` desativado no ESLint para evitar falso positivo em tipos TS.
- **Fluxo branch + PR obrigatório** — nunca commitar direto na main.
- Lock no WORKLOG complementa: sinaliza arquivos em uso mesmo antes do PR.

## Proximo passo (handoff)
- Próxima tarefa: registrar lock + abrir branch antes de qualquer edição.

## Template de handoff
```
HANDOFF
Branch: feat/<nome>
Objetivo: <objetivo>
Arquivos com lock: <lista>
Status: <feito|pendente>
Validacao: build ✓ | lint ✓ | testes —
PR: <url ou "aberto">
Pendencias: <itens>
```
