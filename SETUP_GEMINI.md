# 🚀 RenovaFit - Setup e Integração Gemini

## Status de Implementação

✅ **Integração Gemini Completa**
- Conversão: App gera perguntas diagnósticas, mensagens personalizadas e respostas para objeções
- Retenção: App gera estratégias de renovação adaptadas ao perfil do aluno  
- Reativação: App gera abordagens de recuperação baseadas em histórico

## 📋 Pré-requisitos

1. Node.js 18+ instalado
2. Chave de API do Google Gemini (gratuita)
3. GitHub com repositório sincronizado
4. Vercel account para deployment

## 🔑 Configuração Gemini API

### 1. Obter Chave de API

1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API Key"
3. Crie uma nova chave para seu projeto
4. Copie a chave (será usada nos próximos passos)

### 2. Configuração Local (Desenvolvimento)

```bash
# Clonar repositório
git clone https://github.com/claudiogoldman/RenovaFit.git
cd RenovaFit

# Instalar dependências
npm install

# Criar arquivo .env.local
cp .env.example .env.local

# Editar .env.local e adicionar sua chave
# GEMINI_API_KEY=sua-chave-aqui
```

### 3. Executar Localmente

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Acessar http://localhost:3000
```

### OpenRouter (Opcional, recomendado como fallback)

Se a cota do Gemini acabar ou o modelo ficar indisponivel, o backend pode usar OpenRouter automaticamente.

```bash
# No .env.local
OPENROUTER_API_KEY=sua-chave-openrouter
OPENROUTER_MODEL=openrouter/free
OPENROUTER_HTTP_REFERER=https://renovafit.vercel.app
OPENROUTER_APP_NAME=RenovaFit
```

No Vercel, adicione as mesmas variaveis em Environment Variables.
Se preferir fixar um modelo gratuito especifico, use um nome com sufixo :free no OPENROUTER_MODEL.

### 4. Testar os Módulos

**Conversão** (`/conversao`)
- Preencher perfil do visitante
- Clicar "Gerar Primeira Abordagem"
- IA gera pergunta diagnóstica personalizada

**Retenção** (`/retencao`)
- Preencher perfil do aluno
- Clicar "Gerar Estratégia"
- IA gera abordagem de renovação

**Reativação** (`/reativacao`)
- Preencher perfil do ex-aluno
- Clicar "Gerar Estratégia"
- IA gera plano de reativação

## 🌐 Configuração Vercel (Produção)

### 1. Conectar Vercel

```bash
# Fazer deploy (se não feito ainda)
vercel
```

### 2. Adicionar Variável de Ambiente

1. Acesse https://vercel.com/dashboard
2. Selecione projeto "RenovaFit"
3. Vá em "Settings > Environment Variables"
4. Clique "Add"
5. Adicione:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: (sua chave do Google Gemini)
   - **Environments**: Selecione todas (Production, Preview, Development)
6. Clique "Save"

### 3. Fazer Deploy

```bash
# Push para GitHub (auto-deploy via Vercel)
git add .
git commit -m "feat: adicionar configuração Gemini"
git push origin main
```

Vercel fará auto-deploy automaticamente. Acesse https://renovafit.vercel.app/

## 📚 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── conversao/route.ts      # API para conversão
│   │   ├── retencao/route.ts       # API para retenção  
│   │   └── reativacao/route.ts     # API para reativação
│   ├── conversao/page.tsx           # Página Conversão
│   ├── retencao/page.tsx            # Página Retenção
│   └── reativacao/page.tsx          # Página Reativação
├── components/
│   ├── conversao-assistant.tsx      # UI Conversão (form + output)
│   ├── retencao-assistant.tsx       # UI Retenção (form + output)
│   └── reativacao-assistant.tsx     # UI Reativação (form + output)
└── lib/
    ├── gemini.ts                    # Cliente Gemini centralizado
    ├── types.ts                     # Tipos TypeScript compartilhados
    ├── prompts-conversao.ts         # Prompt builders para conversão
    ├── prompts-retencao.ts          # Prompt builders para retenção
    └── prompts-reativacao.ts        # Prompt builders para reativação
```

## 🔧 Tecnologias

- **Framework**: Next.js 16 com TypeScript
- **Styling**: Tailwind CSS v4
- **IA**: Google Generative AI (Gemini 2.5 Flash)
- **Deployment**: Vercel
- **Version Control**: GitHub

## 📝 Modelos de IA

Cada módulo usa prompts personalizados com **Gemini 2.5 Flash** e fallback automático para **Gemini 2.0 Flash** em caso de alta demanda:

**Conversão** (Lead → Aluno)
- Perguntas diagnósticas para descobrir objetivos
- Mensagens personalizadas por perfil
- Respostas para objeções comuns

**Retenção** (Aluno → Renovação)  
- Análise de obstáculos de renovação
- Estratégias adaptadas ao contexto pessoal
- Ofertas personalizadas

**Reativação** (Ex-aluno → Volta)
- Entender por que saiu
- Remover barreiras
- Oferecer valor renovado

## ��� Troubleshooting

### Erro: "GEMINI_API_KEY is not set"

**Local**: Verifique `.env.local`
```bash
# Deve ter:
GEMINI_API_KEY=sua-chave-aqui
```

**Vercel**: Verifique Settings > Environment Variables

### Erro: "Invalid API Key"

- Confirme que copiou a chave corretamente
- Verifique em https://aistudio.google.com/app/apikey se está ativa
- Tente gerar uma nova chave se necessário

### Componente não renderiza

- Verifique se importou corretamente na página
- Confirme se `npm run build` passa sem erros
- Cheque console do navegador por erros

## 📊 Próximos Passos

1. ✅ Integração Gemini concluída
2. ⏳ Database (Supabase/MongoDB) - converter histórico em persistente
3. ⏳ Autenticação - múltiplos usuários
4. ⏳ Dashboard - analytics e relatórios
5. ⏳ Integração WhatsApp - enviar mensagens geradas

## 📧 Contato & Suporte

- **GitHub**: https://github.com/claudiogoldman/RenovaFit
- **Gemini Docs**: https://ai.google.dev/
- **Next.js Docs**: https://nextjs.org/docs

---

**Pronto para testar? Siga o guia "Configuração Local" acima! 🚀**
