import type { AIResponse, ExStudentProfile, LeadProfile, StudentProfile } from '@/lib/types';

function baseResponse(message: string, nextAction: string): AIResponse {
  return {
    generatedAt: new Date().toISOString(),
    source: 'fallback',
    messages: [message],
    objectionReplies: {},
    nextAction,
    diagnosticQuestions: [],
  };
}

export function buildRetencaoFallback(
  action: 'strategy' | 'objection',
  student: StudentProfile,
  objection?: string,
): AIResponse {
  if (action === 'objection') {
    const objectionText = objection || student.notes || 'falta de tempo e motivacao';
    return baseResponse(
      [
        `Objeção principal: ${objectionText}.`,
        `Resposta sugerida para ${student.name || 'o aluno'}:`,
        '1) Validar a dificuldade sem confronto.',
        '2) Reforcar o objetivo original com exemplo concreto de progresso.',
        '3) Oferecer ajuste simples: 2 treinos curtos por semana por 14 dias.',
        '4) Agendar retorno em 7 dias com acompanhamento ativo.',
      ].join('\n'),
      'Enviar mensagem de acolhimento e marcar check-in em 7 dias',
    );
  }

  return baseResponse(
    [
      `Plano de retenção para ${student.name || 'aluno'}:`,
      `Objetivo: ${student.goal || 'manter consistencia'}.`,
      `Rotina: ${student.routine || 'nao informada'}.`,
      'Acoes recomendadas:',
      '1) Definir meta de curto prazo (14 dias) com indicador simples.',
      '2) Ajustar carga horaria para o horario mais viavel da semana.',
      '3) Registrar evolucao semanal por mensagem e reforco positivo.',
      '4) Oferecer renovacao com beneficio de continuidade (avaliacao + plano ajustado).',
    ].join('\n'),
    'Executar contato hoje e validar adesao ao plano de 14 dias',
  );
}

export function buildConversaoFallback(
  action: 'initial' | 'messages' | 'objection',
  lead: LeadProfile,
  objection?: string,
): AIResponse {
  if (action === 'objection') {
    const objectionText = objection || lead.mainObjection || 'preco';
    return baseResponse(
      [
        `Objeção detectada: ${objectionText}.`,
        'Resposta sugerida:',
        '1) Reconhecer a preocupacao do lead.',
        '2) Conectar investimento ao objetivo principal.',
        '3) Oferecer primeiro passo de baixo risco (avaliacao + 7 dias guiados).',
        '4) Fechar com convite para horario definido.',
      ].join('\n'),
      'Enviar resposta e propor horario especifico para inicio',
    );
  }

  if (action === 'messages') {
    return baseResponse(
      [
        `Mensagem 1: Oi ${lead.name || 'tudo bem'}! Vi que seu foco e ${lead.goal || 'evoluir nos treinos'}. Posso te mostrar um plano simples para comecar essa semana?`,
        'Mensagem 2: Se fizer sentido, te envio 2 opcoes de horario para avaliacao inicial sem compromisso.',
      ].join('\n\n'),
      'Enviar as duas mensagens com intervalo curto e aguardar resposta',
    );
  }

  return baseResponse(
    [
      `Primeira abordagem para ${lead.name || 'lead'}:`,
      `Objetivo informado: ${lead.goal || 'nao informado'}.`,
      'Perguntas diagnosticas:',
      '1) O que mais te motivou a procurar academia agora?',
      '2) Qual horario voce consegue manter com consistencia?',
      '3) O que te atrapalhou em tentativas anteriores?',
      '4) Em 30 dias, qual resultado te faria dizer que valeu a pena?',
    ].join('\n'),
    'Coletar respostas e propor plano inicial com data de inicio',
  );
}

export function buildReativacaoFallback(
  action: 'strategy' | 'objection',
  exStudent: ExStudentProfile,
  objection?: string,
): AIResponse {
  if (action === 'objection') {
    const objectionText = objection || exStudent.mainObjection || 'falta de tempo';
    return baseResponse(
      [
        `Objeção para retorno: ${objectionText}.`,
        `Resposta para ${exStudent.name || 'ex-aluno'}:`,
        '1) Retomar contato com empatia e sem pressao.',
        '2) Oferecer retorno progressivo (2 semanas de readaptacao).',
        '3) Ajustar plano para rotina atual e remover friccao de horario.',
        '4) Confirmar acompanhamento proximo no primeiro mes.',
      ].join('\n'),
      'Enviar proposta de retorno progressivo com data de inicio',
    );
  }

  return baseResponse(
    [
      `Plano de reativacao para ${exStudent.name || 'ex-aluno'}:`,
      `Motivo de saida: ${exStudent.cancelReason || 'nao informado'}.`,
      'Acoes recomendadas:',
      '1) Mensagem de reconexao com foco em acolhimento.',
      '2) Proposta curta de readaptacao com meta de 14 dias.',
      '3) Ajuste de plano e rotina conforme obstaculo anterior.',
      '4) Convite para retorno em horario fixo com suporte ativo.',
    ].join('\n'),
    'Enviar mensagem de reaproximacao e agendar volta assistida',
  );
}
