import type { StudentProfile } from './types';

export type RetencaoStrategyStyle = 'executivo' | 'detalhado';

export function buildRetencaoPrompt(
  student: StudentProfile,
  strategyStyle: RetencaoStrategyStyle = 'executivo',
): string {
  if (strategyStyle === 'executivo') {
    return `Você é um especialista em retenção de alunos de academia.
Preciso de uma estratégia EXECUTIVA, objetiva e acionável para renovação.

DADOS DO ALUNO:
- Nome: ${student.name}
- Idade: ${student.age}
- Sexo: ${student.gender}
- Plano: ${student.selectedPlan || 'Não informado'}
- Objetivo: ${student.goal}
- Tem filhos: ${student.hasChildren}
- Rotina: ${student.routine}
- Notas: ${student.notes}

Formato obrigatório (curto e direto):
1) Diagnóstico em 3 bullets
2) Riscos de churn em 3 bullets
3) Plano de ação de 7 dias em 5 bullets
4) Mensagem pronta para WhatsApp (máx. 5 linhas)
5) Mensagem pronta para alinhamento interno com equipe (transparência + controle + fechamento, máx. 6 linhas)
6) Critério de decisão (go/no-go) com prazo

Regras:
- Máximo de 220 palavras no total
- Linguagem profissional, sem floreio
- Não repetir o contexto
- Entregar em português brasileiro.`;
  }

  return `Você é um especialista em retenção de alunos de academia.
Preciso gerar uma estratégia de renovação para um aluno específico.

DADOS DO ALUNO:
- Nome: ${student.name}
- Idade: ${student.age}
- Sexo: ${student.gender}
- Plano: ${student.selectedPlan || 'Não informado'}
- Objetivo: ${student.goal}
- Tem filhos: ${student.hasChildren}
- Rotina: ${student.routine}
- Notas: ${student.notes}

Entregue em markdown, seguindo EXATAMENTE esta estrutura:

## 1. Resumo do Perfil e Contexto de Renovação
- (3 a 5 bullets objetivos)

## 2. Pontos de Atenção
- (3 bullets: risco percebido, barreira provável, oportunidade de retenção)

## 3. Perguntas Diagnósticas
- (4 perguntas curtas e práticas)

## 4. Cadência de Contato (D-30 até D+1)
- (4 passos com objetivo de cada contato)

## 5. Mensagens Prontas
### 5.1 Primeira abordagem
### 5.2 Follow-up
### 5.3 Direta
### 5.4 Consultiva

## 6. Objeções e Respostas
### 6.1 Preço
### 6.2 Falta de tempo
### 6.3 Falta de progresso
### 6.4 Mudança de prioridade

## 7. Próximo Passo Recomendado (48h)
- (plano de ação claro em 3 itens)

## 8. Template Operacional (CRM)
- canal: whatsapp
- tipo_contato: primeiro_contato
- mensagem: (versão curta pronta)
- próximo_passo: (ação + prazo)

Regras obrigatórias:
- Linguagem em português brasileiro
- Tom consultivo, objetivo e ético
- Máximo de 520 palavras
- Não deixar seção vazia
- Encerrar obrigatoriamente com a linha: FIM_DA_ESTRATEGIA`;
}

export function buildObjectionRetencaoPrompt(student: StudentProfile, objection: string): string {
  return `Como especialista em renovação de alunos, responda a esta objeção:

ALUNO:
- Nome: ${student.name}
- Objetivo: ${student.goal}
- Situação: ${student.routine}

OBJEÇÃO: "${objection}"

Gere:
1. Uma validação empática da preocupação
2. Uma contra-proposta baseada no histórico e objetivo
3. Uma pergunta para clarificar a barreira real
4. Um path para manter o aluno sem pressão

Use português brasileiro, seja direto mas nunca agressivo.`;
}
