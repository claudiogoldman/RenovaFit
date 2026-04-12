export type InteractionEntry = {
  data: string;
  canal: string;
  tipo: string;
  mensagem: string;
};

export function buildAnaliseInteracoesPrompt(
  alunoNome: string,
  interacoes: InteractionEntry[],
): string {
  const linhas = interacoes
    .map(
      (i, idx) =>
        `### Interação ${idx + 1}\nData: ${i.data}\nCanal: ${i.canal}\nTipo: ${i.tipo}\nMensagem:\n${i.mensagem}`,
    )
    .join('\n\n');

  return `Você é um especialista em comunicação e vendas para academias de ginástica.
Analise as interações abaixo com o aluno "${alunoNome}" e entregue uma avaliação profissional e objetiva.

${linhas}

---

Entregue em markdown seguindo EXATAMENTE esta estrutura:

## 1. Resumo das Interações
- Quantas interações houve, por canal, por tipo.
- Linha do tempo resumida (primeiro contato → último).

## 2. Avaliação Geral de Qualidade
- Pontuação de 0 a 10 com justificativa em 2 linhas.
- Aspectos positivos (2 a 3 bullets).
- Pontos de melhoria (2 a 3 bullets).

## 3. Padrões Identificados
- Padrão de linguagem e tom usados.
- Frequência e cadência dos contatos.
- Presença ou ausência de personalização.

## 4. Análise de Respostas do Cliente
- O cliente demonstrou interesse? Em que momento?
- Houve objeções? Como foram tratadas?
- Sinais de risco de churn identificados.

## 5. Mensagens Mais Efetivas
- Cite as mensagens (ou trecho) com maior potencial de engajamento e explique por quê.

## 6. Recomendações de Próximos Contatos
- Próximo contato recomendado (quando, canal e abordagem).
- Adaptação de linguagem sugerida para este aluno.
- Ação corretiva prioritária (se houver).

Regras:
- Seja direto, profissional e acionável.
- Entregue em português brasileiro.
- Não repita o texto das mensagens desnecessariamente.`;
}

export function buildScriptVendasPrompt(
  alunoNome: string,
  analise: string,
): string {
  return `Você é um especialista em vendas e retenção para academias de ginástica.
Com base na análise de interações abaixo do aluno "${alunoNome}", gere um script de vendas estruturado e pronto para uso.

## Análise das Interações
${analise}

---

Entregue em markdown seguindo EXATAMENTE esta estrutura:

## 1. Abertura (primeiros 30 segundos)
- Saudação personalizada para este aluno
- Gancho de abertura que gera rapport

## 2. Diagnóstico Rápido (perguntas-chave)
- 2 a 3 perguntas curtas para confirmar contexto e despertar necessidade

## 3. Apresentação da Solução
- Argumento central alinhado ao objetivo e perfil do aluno
- Benefício emocional + benefício racional

## 4. Tratamento de Objeções
- Objeção mais provável deste aluno + resposta pronta
- Objeção secundária + resposta pronta

## 5. Fechamento
- Frase de fechamento consultivo
- Alternativa de fechamento (caso o primeiro não funcione)
- Call to action concreto (o que o aluno deve fazer agora)

## 6. Mensagem de Follow-up (caso não feche na hora)
- Mensagem curta para WhatsApp (máx. 4 linhas)

Regras:
- Linguagem natural, brasileira, sem jargão corporativo
- Scripts curtos e memorizáveis
- Ação clara em cada etapa`;
}

export function buildAnaliseTextoLivrePrompt(
  alunoNome: string,
  textoLivre: string,
): string {
  return `Você é um especialista em comunicação e vendas para academias de ginástica.
Analise as interações abaixo com o aluno "${alunoNome}" e entregue uma avaliação profissional e objetiva.

${textoLivre}

---

Entregue em markdown seguindo EXATAMENTE esta estrutura:

## 1. Resumo das Interações
- Quantas interações houve, por canal, por tipo.
- Linha do tempo resumida (primeiro contato → último).

## 2. Avaliação Geral de Qualidade
- Pontuação de 0 a 10 com justificativa em 2 linhas.
- Aspectos positivos (2 a 3 bullets).
- Pontos de melhoria (2 a 3 bullets).

## 3. Padrões Identificados
- Padrão de linguagem e tom usados.
- Frequência e cadência dos contatos.
- Presença ou ausência de personalização.

## 4. Análise de Respostas do Cliente
- O cliente demonstrou interesse? Em que momento?
- Houve objeções? Como foram tratadas?
- Sinais de risco de churn identificados.

## 5. Mensagens Mais Efetivas
- Cite as mensagens (ou trecho) com maior potencial de engajamento e explique por quê.

## 6. Recomendações de Próximos Contatos
- Próximo contato recomendado (quando, canal e abordagem).
- Adaptação de linguagem sugerida para este aluno.
- Ação corretiva prioritária (se houver).

Regras:
- Seja direto, profissional e acionável.
- Entregue em português brasileiro.
- Não repita o texto das mensagens desnecessariamente.`;
}
