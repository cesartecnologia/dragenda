import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const fallbackFirebaseConfig: FirebaseWebConfig = {
  apiKey: 'AIzaSyAY0B4ByMemGVX-Dct5oOVIMba6D5Hy6oY',
  authDomain: 'clinicasmart-19d40.firebaseapp.com',
  projectId: 'clinicasmart-19d40',
  storageBucket: 'clinicasmart-19d40.firebasestorage.app',
  messagingSenderId: '674182654830',
  appId: '1:674182654830:web:9179a8066a40d4d106ef7f',
};

const normalizeFirebaseEnvValue = (value?: string) => {
  if (!value) {
    return undefined;
  }

  let normalized = value.trim();

  normalized = normalized.replace(/,$/, '').trim();
  normalized = normalized.replace(/^[a-zA-Z]+\s*:\s*/, '').trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized || undefined;
};

const fromEnv = {
  apiKey: normalizeFirebaseEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalizeFirebaseEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeFirebaseEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalizeFirebaseEnvValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalizeFirebaseEnvValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: normalizeFirebaseEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const firebaseConfig: FirebaseWebConfig = {
  apiKey: fromEnv.apiKey ?? fallbackFirebaseConfig.apiKey,
  authDomain: fromEnv.authDomain ?? fallbackFirebaseConfig.authDomain,
  projectId: fromEnv.projectId ?? fallbackFirebaseConfig.projectId,
  storageBucket: fromEnv.storageBucket ?? fallbackFirebaseConfig.storageBucket,
  messagingSenderId: fromEnv.messagingSenderId ?? fallbackFirebaseConfig.messagingSenderId,
  appId: fromEnv.appId ?? fallbackFirebaseConfig.appId,
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firebaseWebConfig = firebaseConfig;
