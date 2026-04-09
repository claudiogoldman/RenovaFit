import type { ExStudentProfile } from './types';

export function buildReativacaoPrompt(exStudent: ExStudentProfile): string {
  return `Você é um especialista em reativação de ex-alunos de academia.
Preciso criar uma estratégia para trazer este aluno de volta.

DADOS DO EX-ALUNO:
- Nome: ${exStudent.name}
- Idade: ${exStudent.age}
- Tempo de casa: ${exStudent.tenure}
- Cancelou: ${exStudent.cancelledWhen}
- Motivo do cancelamento: ${exStudent.cancelReason}
- Último plano: ${exStudent.lastPlan}
- Objeção principal: ${exStudent.mainObjection}
- Notas: ${exStudent.notes}

Por favor, gere:
1. Uma análise da barreira que causou o cancelamento
2. Três pontos de reaproximação (baseados no que funcionou antes)
3. Quatro perguntas de re-engajamento
4. Quatro versões de mensagem (reaproximação casual, oferta de valor, consultiva, com incentivo)
5. Respostas para objeções específicas (barreira antiga voltou, novos compromissos, experiência ruim, programa mudou)
6. Uma proposta de volta adaptada

Mantenha tom pessoal (já conhece o aluno), caloroso e sem ressalva. Use português brasileiro.`;
}

export function buildObjectionReativacaoPrompt(exStudent: ExStudentProfile, objection: string): string {
  return `Como especialista em reativação, responda a esta barreira de um ex-aluno:

EX-ALUNO:
- Nome: ${exStudent.name}
- Última experiência: ${exStudent.tenure} de casa
- Motivo do adeus: ${exStudent.cancelReason}

BARREIRA ATUAL: "${objection}"

Gere:
1. Uma resposta que reconheça o contexto anterior
2. Uma proposta que resolve especificamente essa barreira
3. Uma pequena mudança no programa / formato que oferece
4. Um incentivo de volta (desconto, teste grátis, ajuste de horário)

Seja pessoal, reconheça o que foi bom antes, e mostre que evoluiu. Use português brasileiro.`;
}
