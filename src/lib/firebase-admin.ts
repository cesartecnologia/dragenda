import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

type ServiceAccountShape = {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
};

type FirebaseAdminCredential = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

const normalizeMultiline = (value?: string | null) =>
  value?.replace(/\\n/g, '\n').trim();

const buildCredentialFromJson = (rawJson: string): FirebaseAdminCredential => {
  let parsed: ServiceAccountShape;

  try {
    parsed = JSON.parse(rawJson) as ServiceAccountShape;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON_INVALID');
  }

  const projectId =
    parsed.projectId ??
    parsed.project_id ??
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const clientEmail = parsed.clientEmail ?? parsed.client_email;
  const privateKey = normalizeMultiline(parsed.privateKey ?? parsed.private_key);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON_INCOMPLETE');
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

const buildCredentialFromEnv = (): FirebaseAdminCredential | null => {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizeMultiline(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId && !clientEmail && !privateKey) {
    return null;
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_ADMIN_ENV_INCOMPLETE');
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

const getFirebaseAdminCredential = (): FirebaseAdminCredential => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return buildCredentialFromJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const envCredential = buildCredentialFromEnv();

  if (!envCredential) {
    throw new Error('FIREBASE_ADMIN_MISSING_CREDENTIALS');
  }

  return envCredential;
};

let cachedApp: App | null = null;

const createFirebaseAdminApp = (): App => {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const credential = getFirebaseAdminCredential();

  return initializeApp({
    credential: cert({
      projectId: credential.projectId,
      clientEmail: credential.clientEmail,
      privateKey: credential.privateKey,
    }),
    projectId: credential.projectId,
  });
};

export const getFirebaseAdminApp = (): App => {
  if (cachedApp) return cachedApp;
  cachedApp = createFirebaseAdminApp();
  return cachedApp;
};

export const adminAuth = (): Auth => getAuth(getFirebaseAdminApp());
export const adminDb = (): Firestore => getFirestore(getFirebaseAdminApp());
export const getAdminAuth = adminAuth;
export const getFirestoreDb = adminDb;