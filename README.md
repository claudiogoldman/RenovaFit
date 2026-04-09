# RenovaFit - Ecossistema de IA para Academias

Ecossistema completo de IA para ajudar academias a gerenciar o ciclo de vida dos alunos: **Conversão** (leads → alunos), **Retenção** (manter alunos ativos), e **Reativação** (recuperar ex-alunos).

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
- **IA**: Google Gemini (API)
- **Banco de Dados**: A adicionar (Supabase, MongoDB ou similar)
- **Deploy**: Vercel
- **Autenticação**: A definir (OAuth, Auth0 ou similar)

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
```

## 📁 Estrutura de Pastas

```
renovafit/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home
│   │   ├── conversao/
│   │   ├── retencao/
│   │   ├── reativacao/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/            # Componentes reutilizáveis
│   └── lib/                   # Utilitários e helpers
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## 🔄 Fluxo de Desenvolvimento

1. **MVP Stateless** (atual): Função web com fallback local, sem banco de dados
2. **Integração Gemini**: API de IA em todas as abordagens
3. **Banco de Dados**: Histórico de alunos, leads e ex-alunos
4. **Autenticação**: Login para academias gerenciarem seus dados
5. **Dashboard**: Relatórios de conversão, retenção e reativação
6. **Integrações**: Webhook com sistemas de academia (iClub, Fittrix, etc)

## 📚 Documentação

- Conversão: `/conversao`
- Retenção: `/retencao`
- Reativação: `/reativacao`

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
