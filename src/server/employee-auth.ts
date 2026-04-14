import { adminAuth } from '@/lib/firebase-admin';

const generateTemporaryPassword = () => {
  const seed = Math.random().toString(36).slice(-6);
  return `Clinica@${seed.toUpperCase()}`;
};

export const provisionEmployeeAuthAccount = async (params: {
  email: string;
  name: string;
  password?: string;
}) => {
  const email = params.email.trim().toLowerCase();
  const password = params.password?.trim() || generateTemporaryPassword();

  try {
    const existingUser = await adminAuth().getUserByEmail(email);
    await adminAuth().updateUser(existingUser.uid, {
      displayName: params.name,
      password,
      disabled: false,
    });

    return {
      uid: existingUser.uid,
      email,
      password,
      created: false,
    };
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
    const message = error instanceof Error ? error.message : '';

    if (code !== 'auth/user-not-found' && !message.includes('auth/user-not-found')) {
      throw error;
    }
  }

  const createdUser = await adminAuth().createUser({
    email,
    password,
    displayName: params.name,
    emailVerified: false,
    disabled: false,
  });

  return {
    uid: createdUser.uid,
    email,
    password,
    created: true,
  };
};


export const deleteEmployeeAuthAccount = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await adminAuth().getUserByEmail(normalizedEmail);
    await adminAuth().deleteUser(existingUser.uid);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
    const message = error instanceof Error ? error.message : '';

    if (code === 'auth/user-not-found' || message.includes('auth/user-not-found')) {
      return;
    }

    throw error;
  }
};
