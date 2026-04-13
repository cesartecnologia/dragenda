# Dr. Agenda - Firebase edition

Sistema de clinica em Next.js com:
- Firebase Authentication (email/senha + Google)
- Firebase Firestore para os dados da aplicacao
- Firebase Admin SDK para sessoes seguras no servidor
- Asaas para assinatura
- Deploy preparado para Vercel

## Estrutura de dados no Firestore
- users
- clinics
- doctors
- patients
- appointments

## Variaveis de ambiente
Copie `.env.example` e preencha no ambiente local ou na Vercel.

### Firebase Web SDK
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

### Firebase Admin SDK
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

### App
- NEXT_PUBLIC_APP_URL
- SESSION_COOKIE_NAME

### Asaas
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL
- ESSENTIAL_PLAN_PRICE_ID

## Rodando o projeto
```bash
npm install
npm run dev
```

## Deploy na Vercel
1. Suba o projeto no GitHub.
2. Importe o repositorio na Vercel.
3. Configure as variaveis de ambiente.
4. Habilite Email/Password e Google no Firebase Authentication.
5. Adicione os dominios da Vercel em Authorized Domains no Firebase Authentication.
6. Gere uma service account do Firebase/Google Cloud e configure no Admin SDK.

## Observacoes
- O login usa cookie de sessao HTTP-only criado no servidor.
- As paginas protegidas leem a sessao no servidor e continuam funcionando no App Router.
- Os dados antigos do banco SQL nao sao migrados: o sistema nasce limpo no Firestore.

Mais detalhes em `FIREBASE_VERCEL_SETUP.md`.


## Controle de acesso

- Usuarios com `MASTER_EMAIL`, `MASTER_EMAILS`, `SUPPORT_EMAIL` ou `SUPPORT_EMAILS` recebem bypass de assinatura automaticamente no Firestore.
- Esses perfis entram normalmente com email/senha, mas nao sao bloqueados por plano ativo.
- Clientes comuns continuam seguindo o fluxo clinica + assinatura.

## Otimizacoes aplicadas

- Sessao do sidebar passada pelo servidor, eliminando requisicao extra no carregamento.
- Checagem de acesso centralizada para reduzir duplicacao e inconsistencias entre rotas.
- Leituras basicas de usuario e clinica memoizadas por requisicao.
