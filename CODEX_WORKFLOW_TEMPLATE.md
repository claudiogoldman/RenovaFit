# Workflow Rapido: Copilot + Codex

## Objetivo
Padronizar trabalho paralelo sem conflito, mantendo historico limpo e previsivel.

## Rotina Diaria (Checklist)

1. Atualizar base local:
   - `git checkout main`
   - `git pull --ff-only origin main`

2. Criar branch da tarefa:
   - `git checkout -b feat/<nome-curto-da-tarefa>`

3. Implementar em blocos pequenos:
   - `git add .`
   - `git commit -m "feat: descricao objetiva"`

4. Sincronizar antes de publicar:
   - `git fetch origin`
   - `git rebase origin/main`

5. Publicar branch:
   - `git push -u origin feat/<nome-curto-da-tarefa>`

6. Abrir PR para `main` (evitar push direto na `main`).

## Regra de Ouro

- Nunca codar direto na `main`.
- Uma branch por tarefa.
- Commits pequenos e frequentes.
- Sempre rebase antes de push final.
- Se precisar atualizar branch rebaseada: usar `git push --force-with-lease`.

## Fluxo de Conflito (Rapido)

1. `git fetch origin`
2. `git rebase origin/main`
3. Resolver conflito no arquivo
4. `git add <arquivo>`
5. `git rebase --continue`
6. `git push --force-with-lease`

## Mensagem pronta para enviar ao Codex

Use este prompt no inicio de cada tarefa:

"Contexto do repo: RenovaFit.
Trabalhe somente na branch feat/<nome-da-tarefa>.
Nao faca push na main.
Faça commits pequenos com mensagens claras.
Antes de finalizar, rode build e reporte resultado.
Se houver conflito com origin/main, rebase e mantenha minhas alteracoes funcionais.
Nao remova funcionalidades existentes sem justificativa.
No final, entregue:
1) lista de arquivos alterados,
2) resumo do que mudou,
3) comando exato para eu publicar."

## Mensagem curta (modo rapido)

"Codex, tarefa: <tarefa>. Branch: feat/<nome>. Nao usar main. Commit pequeno. Rodar build. Entregar resumo + arquivos + comando de push."

## Hand-off recomendado entre agentes

Quando trocar de agente (Copilot <-> Codex), registrar:

- Branch atual
- Objetivo da tarefa
- Arquivos tocados
- O que falta
- Resultado do build/teste

Template de hand-off:

"HANDOFF
Branch: <branch>
Objetivo: <objetivo>
Arquivos: <lista>
Status: <feito / pendente>
Validacao: <build/testes>
Pendencias: <itens>"
