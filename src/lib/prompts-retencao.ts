import type { StudentProfile } from './types';

export function buildRetencaoPrompt(student: StudentProfile): string {
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
