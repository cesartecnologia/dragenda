# Firebase + Vercel setup

## O que ja vem pronto neste pacote
- O frontend ja tem fallback para a configuracao Web do Firebase do projeto `clinicasmart-19d40`.
- Mesmo assim, para deploy na Vercel, mantenha as variaveis `NEXT_PUBLIC_FIREBASE_*` cadastradas.
- O backend continua precisando das credenciais do Admin SDK no servidor.

## 1) Firebase Authentication
Ative no Firebase Authentication:
- Email/Password
- Google

## 2) Variaveis da Vercel
Cadastre estas variaveis no projeto da Vercel.

### Publicas (frontend)
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

### Privadas (servidor)
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

## 3) Credenciais do Firebase Admin
No ambiente local, voce pode usar `GOOGLE_APPLICATION_CREDENTIALS` apontando para o arquivo JSON da service account.
Na Vercel, use `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY`.

## 4) Dominios autorizados
Em Firebase Authentication > Settings > Authorized domains, adicione:
- localhost
- seu dominio da Vercel
- dominios de preview, se necessario

## 5) Firestore
Crie o Firestore e use estas colecoes:
- users
- clinics
- doctors
- patients
- appointments

## 6) Local
Crie um `.env.local` com base no `.env.example`.
Mesmo com o fallback do frontend, as variaveis do Admin SDK continuam obrigatorias para login persistente no servidor.
