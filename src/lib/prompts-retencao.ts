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

Por favor, gere:
1. Um resumo do perfil e contexto de renovação
2. Três pontos de atenção principais
3. Quatro perguntas diagnósticas para entender barreiras
4. Quatro versões de mensagem (primeira abordagem, follow-up, direta, consultiva)
5. Respostas para quatro objeções comuns (preço, tempo, falta de progresso, mudança de prioridade)
6. Recomendação do próximo passo

Mantenha um tom consultivo, empático e etico. Use português brasileiro.`;
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
