import type { LeadProfile } from './types';

export function buildConversaoPrompt(lead: LeadProfile): string {
  return `Você é um especialista em conversão de leads para academias. 
Estou em uma conversa com um potencial aluno e preciso de respostas estratégicas.

DADOS DO LEAD:
- Nome: ${lead.name}
- Idade: ${lead.age}
- Sexo: ${lead.gender}
- Objetivo: ${lead.goal}
- Disponibilidade: ${lead.availability}
- Atividade Atual: ${lead.currentActivity}
- Objeção Principal: ${lead.mainObjection || 'Nenhuma mencionada'}
- Notas: ${lead.notes}

Por favor, gere:
1. Uma saudação personalizada de abertura
2. Três perguntas diagnósticas para entender melhor o lead
3. Uma proposta de solução adaptada ao perfil
4. Respostas para três objeções comuns (preço, tempo, falta de experiência)
5. Um call-to-action para próximo passo

Mantenha um tom consultivo, amigável e sem pressão comercial. Use português brasileiro.`;
}

export function buildMediaPrompt(lead: LeadProfile): string {
  return `Como especialista em mensagens de follow-up, crie uma mensagem para WhatsApp
destinada a um lead que ainda não respondeu à primeira abordagem.

DADOS DO LEAD:
- Nome: ${lead.name}
- Objetivo: ${lead.goal}
- Disponibilidade: ${lead.availability}

Gere 4 versões da mensagem:
1. Uma versão breve (uma linha)
2. Uma versão direta (com CTA claro)
3. Uma versão consultiva (focada em entender barreiras)
4. Uma versão que oferece valor primeiro

Mantenha cada mensagem entre 50-200 caracteres. Use português brasileiro.`;
}

export function buildObjectionPrompt(lead: LeadProfile, objection: string): string {
  return `Como especialista em objeções de venda, crie uma resposta para a seguinte objeção:

LEAD:
- Nome: ${lead.name}
- Objetivo: ${lead.goal}
- Disponibilidade: ${lead.availability}

OBJEÇÃO RECEBIDA: "${objection}"

Gere:
1. Uma resposta empática que valida a preocupação
2. Uma proposta que resolve a barreira
3. Uma pergunta clarificadora
4. Um call-to-action suave

Seja honesto, consultivo e sem manipulação. Use português brasileiro.`;
}
