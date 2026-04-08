import { existsSync, readFileSync } from 'fs';
import path from 'path';

import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
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

const normalizeMultiline = (value?: string | null) => value?.replace(/\\n/g, '\n');

const readJsonFile = (filePath: string): ServiceAccountShape => {
  const fileContent = readFileSync(filePath, 'utf-8');

  if (!fileContent.trim()) {
    throw new Error(`Firebase service account file is empty: ${filePath}`);
  }

  return JSON.parse(fileContent) as ServiceAccountShape;
};

const toCredential = (serviceAccount: ServiceAccountShape) => ({
  projectId: serviceAccount.projectId ?? serviceAccount.project_id ?? process.env.FIREBASE_PROJECT_ID,
  clientEmail: serviceAccount.clientEmail ?? serviceAccount.client_email,
  privateKey: normalizeMultiline(serviceAccount.privateKey ?? serviceAccount.private_key),
});

const getServiceAccountFromEnv = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return toCredential(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccountShape);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizeMultiline(process.env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
};

const getServiceAccountFromFile = () => {
  const candidatePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'firebase-adminsdk.json'),
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'clinicasmart-19d40-firebase-adminsdk-fbsvc-40f80a8dbc.json'),
  ].filter((value): value is string => Boolean(value));

  for (const candidatePath of candidatePaths) {
    const absolutePath = path.isAbsolute(candidatePath)
      ? candidatePath
      : path.resolve(process.cwd(), candidatePath);

    if (existsSync(absolutePath)) {
      return toCredential(readJsonFile(absolutePath));
    }
  }

  return null;
};

let cachedApp: App | null = null;
let cachedError: Error | null = null;

const createFirebaseAdminApp = () => {
  const serviceAccount = getServiceAccountFromEnv() ?? getServiceAccountFromFile();

  return (
    getApps()[0] ??
    initializeApp({
      credential:
        serviceAccount?.projectId && serviceAccount?.clientEmail && serviceAccount?.privateKey
          ? cert(serviceAccount)
          : applicationDefault(),
      projectId:
        serviceAccount?.projectId ??
        process.env.FIREBASE_PROJECT_ID ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  );
};

export const getFirebaseAdminApp = () => {
  if (cachedApp) return cachedApp;
  if (cachedError) throw cachedError;

  try {
    cachedApp = createFirebaseAdminApp();
    return cachedApp;
  } catch (error) {
    cachedError = error instanceof Error ? error : new Error('Unable to initialize Firebase Admin');
    throw cachedError;
  }
};

export const adminAuth = (): Auth => getAuth(getFirebaseAdminApp());
export const adminDb = (): Firestore => getFirestore(getFirebaseAdminApp());
export const getAdminAuth = adminAuth;
export const getFirestoreDb = adminDb;
