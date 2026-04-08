import { cache } from 'react';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getClinicById, getUserProfileById } from '@/server/clinic-data';
import { resolvePrivilegedAccess } from '@/lib/access';
import { adminAuth } from '@/lib/firebase-admin';
import type { UserRole } from '@/db/schema';

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? '__clinic_smart_session';

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    plan: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    role: UserRole;
    bypassSubscription: boolean;
    hasSubscriptionAccess: boolean;
    clinic?: {
      id: string;
      name: string;
    };
  };
}

export const hasPrivilegedAccess = (session: AppSession | null) =>
  Boolean(session?.user.bypassSubscription || session?.user.role === 'master' || session?.user.role === 'support');

export const hasSubscriptionAccess = (session: AppSession | null) =>
  Boolean(session?.user.plan || hasPrivilegedAccess(session));

export const getServerSession = cache(async (): Promise<AppSession | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decodedToken = await adminAuth().verifySessionCookie(sessionCookie);
    const userProfile = await getUserProfileById(decodedToken.uid);
    if (!userProfile) return null;
    const clinic = userProfile.clinicId ? await getClinicById(userProfile.clinicId) : null;
    const access = resolvePrivilegedAccess(userProfile.email, userProfile);

    return {
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        image: userProfile.image,
        plan: clinic?.plan ?? userProfile.plan,
        stripeCustomerId: userProfile.stripeCustomerId,
        stripeSubscriptionId: userProfile.stripeSubscriptionId,
        role: access.role,
        bypassSubscription: access.bypassSubscription,
        hasSubscriptionAccess: Boolean(clinic?.plan || userProfile.plan || access.bypassSubscription),
        clinic: clinic ? { id: clinic.id, name: clinic.name } : undefined,
      },
    };
  } catch {
    return null;
  }
});

export const requireSession = cache(async () => {
  const session = await getServerSession();
  if (!session?.user) redirect('/autenticacao');
  return session;
});

export const requireClinicSession = cache(async () => {
  const session = await requireSession();
  if (!session.user.clinic) redirect('/configuracoes/clinica');
  return session;
});

export const requireSubscribedSession = cache(async () => {
  const session = await requireSession();
  if (!session.user.hasSubscriptionAccess) redirect('/assinatura');
  if (!session.user.clinic) redirect('/configuracoes/clinica');
  return session;
});

export const auth = {
  api: {
    getSession: async (_options?: unknown) => getServerSession(),
  },
};
