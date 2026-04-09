# RenovaFit - Ecossistema de IA para Academias

Ecossistema completo de IA para ajudar academias a gerenciar o ciclo de vida dos alunos: **Conversão** (leads → alunos), **Retenção** (manter alunos ativos), e **Reativação** (recuperar ex-alunos).

Ambiente de produção: https://renovafit.vercel.app

## 🎯 Três Módulos

### 1. **Conversão** 🎯
Transforme visitantes em alunos pagantes.
- Perguntas diagnósticas baseadas em IA
- Mensagens personalizadas por perfil
- Respostas para objeções comuns
- Integração com WhatsApp

### 2. **Retenção** 💚
Mantenha alunos ativos durante a renovação.
- Análise de perfil completo (idade, plano, frequência, objetivo, rotina)
- Diagnóstico de obstáculos
- 4 versões de mensagens (primeira abordagem, follow-up, direta, consultiva)
- Respostas para objeções (preço, tempo, motivação)

### 3. **Reativação** 🔄
Recupere ex-alunos entendendo por que saíram.
- Histórico de cancelamento
- Análise de barreiras anteriores
- Propostas personalizadas de volta
- Estratégia de re-engajamento

## 🛠 Stack Tecnológico

- **Frontend**: Next.js 16+ com TypeScript, Tailwind CSS, App Router
- **Backend**: API Routes do Next.js
- **IA**: Google Gemini + fallback OpenRouter + fallback local
- **Banco de Dados**: Supabase (módulo de retenção)
- **Deploy**: Vercel
- **Autenticação**: Supabase Auth (módulo de retenção)

## 🚀 Como Começar

### Requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
git clone https://github.com/claudiogoldman/RenovaFit.git renovafit
cd renovafit
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Build para Produção

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## 📝 Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
GEMINI_API_KEY=sua_chave_aqui

# OpenRouter fallback (opcional)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
OPENROUTER_HTTP_REFERER=https://renovafit.vercel.app
OPENROUTER_APP_NAME=RenovaFit

# Supabase server-side (API)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Supabase client-side (Auth)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## 📁 Estrutura de Pastas

```
renovafit/
├── .github/workflows/       # CI pipeline
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home
│   │   ├── conversao/
│   │   ├── retencao/
│   │   ├── reativacao/
│   │   ├── api/
│   │   │   ├── conversao/
│   │   │   ├── retencao/
│   │   │   ├── reativacao/
│   │   │   ├── renewals/
│   │   │   └── whatsapp/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/            # Componentes reutilizáveis
│   └── lib/                   # Utilitários e helpers
├── SUPABASE_SETUP.md
├── SETUP_GEMINI.md
├── CHANGELOG.md
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## ✅ Estado Atual

1. Módulos Conversão, Retenção e Reativação ativos com IA.
2. Fallback entre providers de IA e fallback local quando necessário.
3. Respostas formatadas em markdown para melhor legibilidade.
4. Persistência local de formulário e última saída da IA.
5. Módulo de retenção com lista operacional e KPIs.
6. Lista de retenção conectada ao Supabase via API.
7. Autenticação por atendente no fluxo de retenção.
8. CI de lint e build em push/PR para main.

## 🧭 Próximos Passos

1. Consolidar modelagem única de ciclo de vida (lead -> ativo -> ex-aluno).
2. Expandir autenticação/multi-tenant para todos os módulos.
3. Dashboard consolidado por equipe e por unidade.
4. Histórico de interação e trilha de decisões por aluno.
5. Endurecimento de segurança e políticas de acesso no Supabase.

## 📚 Documentação

- Conversão: `/conversao`
- Retenção: `/retencao`
- Reativação: `/reativacao`
- Setup IA: `SETUP_GEMINI.md`
- Setup banco: `SUPABASE_SETUP.md`
- Evolução do projeto: `CHANGELOG.md`

## 🤝 Contribuindo

Este é um projeto em desenvolvimento. Sugestões e melhorias são bem-vindas!

## 📄 Licença

MIT

## 👤 Autor

**Claudio Goldman**
- GitHub: [@claudiogoldman](https://github.com/claudiogoldman)
- Portfolio: [onlinepersonaltrainer.com.br](https://onlinepersonaltrainer.com.br)

---

**RenovaFit**: Transformando o negócio de academias com IA e dados.
