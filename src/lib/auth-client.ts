'use client';

import {
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

import type { AppSession } from './auth';
import { firebaseAuth } from './firebase';

type CallbackContext = {
  error: {
    code: string;
    message: string;
  };
};

const normalizeErrorCode = (code?: string) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'USER_ALREADY_EXISTS';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'INVALID_CREDENTIALS';
    case 'auth/operation-not-allowed':
      return 'EMAIL_PASSWORD_DISABLED';
    case 'auth/weak-password':
      return 'WEAK_PASSWORD';
    case 'auth/invalid-api-key':
      return 'INVALID_API_KEY';
    case 'auth/network-request-failed':
      return 'NETWORK_ERROR';
    case 'SESSION_LOGIN_FAILED':
      return 'SESSION_LOGIN_FAILED';
    case 'ACCOUNT_CREATED_BUT_SESSION_FAILED':
      return 'ACCOUNT_CREATED_BUT_SESSION_FAILED';
    default:
      return code ?? 'UNKNOWN_ERROR';
  }
};

const parseResponseError = async (response: Response) => {
  try {
    const payload = (await response.json()) as {
      error?: string;
      details?: string;
    };

    return {
      code: payload.error ?? 'SESSION_LOGIN_FAILED',
      details: payload.details,
    };
  } catch {
    return {
      code: 'SESSION_LOGIN_FAILED',
      details: undefined,
    };
  }
};

const exchangeIdTokenForSession = async (user: User) => {
  const idToken = await user.getIdToken(true);
  const response = await fetch('/api/session/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken,
      profile: {
        name: user.displayName,
        email: user.email,
        image: user.photoURL,
        emailVerified: user.emailVerified,
      },
    }),
  });

  if (!response.ok) {
    const { code, details } = await parseResponseError(response);
    throw new Error(details ? `${code}:${details}` : code);
  }

  await firebaseSignOut(firebaseAuth);
};


const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const signInWithRetry = async (email: string, password: string) => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await wait(500 * (attempt + 1));
      }
    }
  }

  throw lastError;
};

const fetchSession = async (): Promise<AppSession | null> => {
  const response = await fetch('/api/session', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { session: AppSession | null };
  return payload.session;
};

const toCallbackError = (error: unknown): CallbackContext['error'] => {
  const rawMessage = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
  const [rawCode, ...detailsParts] = rawMessage.split(':');
  const normalizedCode = normalizeErrorCode(rawCode);
  const details = detailsParts.join(':').trim();

  return {
    code: normalizedCode,
    message: details || rawMessage,
  };
};

export const authClient = {
  signIn: {
    email: async (
      values: { email: string; password: string },
      callbacks?: {
        onSuccess?: () => void;
        onError?: (ctx: CallbackContext) => void;
      },
    ) => {
      try {
        await setPersistence(firebaseAuth, inMemoryPersistence);
        const credentials = await signInWithRetry(values.email, values.password);
        await exchangeIdTokenForSession(credentials.user);
        callbacks?.onSuccess?.();
      } catch (error) {
        callbacks?.onError?.({
          error: toCallbackError(error),
        });
      }
    },
  },
  signUp: {
    email: async (
      values: { email: string; password: string; name: string; clinicName: string; clinicCnpj: string; clinicPhoneNumber: string; clinicAddress: string; clinicAddressNumber: string; clinicAddressComplement?: string; clinicPostalCode: string; clinicProvince: string },
      callbacks?: {
        onSuccess?: () => void;
        onError?: (ctx: CallbackContext) => void;
      },
    ) => {
      try {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!registerResponse.ok) {
          const { code, details } = await parseResponseError(registerResponse);
          throw new Error(details ? `${code}:${details}` : code);
        }

        await setPersistence(firebaseAuth, inMemoryPersistence);
        const credentials = await signInWithRetry(values.email, values.password);
        await exchangeIdTokenForSession(credentials.user);
        callbacks?.onSuccess?.();
      } catch (error) {
        callbacks?.onError?.({
          error: toCallbackError(error),
        });
      }
    },
  },
  signOut: async (options?: {
    fetchOptions?: {
      onSuccess?: () => void;
      onError?: () => void;
    };
  }) => {
    try {
      await fetch('/api/session/logout', {
        method: 'POST',
      });
      await firebaseSignOut(firebaseAuth);
      options?.fetchOptions?.onSuccess?.();
    } catch {
      options?.fetchOptions?.onError?.();
    }
  },
  useSession: () => {
    const [data, setData] = useState<AppSession | null>(null);
    const [isPending, setIsPending] = useState(true);

    useEffect(() => {
      let active = true;

      const loadSession = async () => {
        try {
          const session = await fetchSession();
          if (active) {
            setData(session);
          }
        } finally {
          if (active) {
            setIsPending(false);
          }
        }
      };

      void loadSession();

      return () => {
        active = false;
      };
    }, []);

    return {
      data,
      isPending,
    };
  },
};
