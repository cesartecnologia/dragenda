import { cache } from 'react';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { DecodedIdToken } from 'firebase-admin/auth';

import type { UserRole } from '@/db/schema';
import { resolvePrivilegedAccess } from '@/lib/access';
import { adminAuth } from '@/lib/firebase-admin';
import { getClinicById, getUserProfileById, upsertUserProfile } from '@/server/clinic-data';

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? '__clinic_smart_session';

const ACCESS_RELEASING_STATUSES = new Set(['active']);

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    plan: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    asaasCustomerId: string | null;
    asaasSubscriptionId: string | null;
    subscriptionStatus: string | null;
    role: UserRole;
    bypassSubscription: boolean;
    hasSubscriptionAccess: boolean;
    clinic?: {
      id: string;
      name: string;
    };
  };
}

const normalizeSubscriptionStatus = (value?: string | null) => value?.trim().toLowerCase() ?? null;

const hasAccessBySubscription = (params: {
  plan?: string | null;
  subscriptionStatus?: string | null;
  bypassSubscription?: boolean;
}) => {
  if (params.bypassSubscription) return true;
  if (params.plan) return true;
  const normalizedStatus = normalizeSubscriptionStatus(params.subscriptionStatus);
  return Boolean(normalizedStatus && ACCESS_RELEASING_STATUSES.has(normalizedStatus));
};

const buildFallbackSession = (decodedToken: DecodedIdToken): AppSession | null => {
  const email = decodedToken.email?.trim().toLowerCase();
  if (!email) return null;

  const access = resolvePrivilegedAccess(email, null);

  return {
    user: {
      id: decodedToken.uid,
      name: decodedToken.name ?? email.split('@')[0],
      email,
      image: typeof decodedToken.picture === 'string' ? decodedToken.picture : null,
      plan: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      subscriptionStatus: null,
      role: access.role,
      bypassSubscription: access.bypassSubscription,
      hasSubscriptionAccess: hasAccessBySubscription({ bypassSubscription: access.bypassSubscription }),
    },
  };
};

export const hasPrivilegedAccess = (session: AppSession | null) =>
  Boolean(session?.user.bypassSubscription || session?.user.role === 'master' || session?.user.role === 'support');

export const hasSubscriptionAccess = (session: AppSession | null) =>
  Boolean(
    session &&
      hasAccessBySubscription({
        plan: session.user.plan,
        subscriptionStatus: session.user.subscriptionStatus,
        bypassSubscription: session.user.bypassSubscription,
      }),
  );

export const getAuthenticatedRedirectPath = (session: AppSession) => {
  if (!session.user.clinic && !hasPrivilegedAccess(session)) return '/configuracoes/clinica';
  if (!session.user.hasSubscriptionAccess) return '/assinatura';
  return '/painel';
};

export const getServerSession = cache(async (): Promise<AppSession | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decodedToken = await adminAuth().verifySessionCookie(sessionCookie);
    let userProfile = await getUserProfileById(decodedToken.uid);

    if (!userProfile && decodedToken.email) {
      try {
        userProfile = await upsertUserProfile({
          id: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name ?? null,
          image: typeof decodedToken.picture === 'string' ? decodedToken.picture : null,
          emailVerified: decodedToken.email_verified,
        });
      } catch (error) {
        console.error('SESSION_PROFILE_RECOVERY_FAILED', error);
      }
    }

    if (!userProfile) {
      return buildFallbackSession(decodedToken);
    }

    let clinic = null;

    if (userProfile.clinicId) {
      try {
        clinic = await getClinicById(userProfile.clinicId);
      } catch (error) {
        console.error('SESSION_CLINIC_READ_FAILED', error);
      }
    }
    const access = resolvePrivilegedAccess(userProfile.email, userProfile);
    const plan = clinic?.plan ?? userProfile.plan;
    const subscriptionStatus = clinic?.subscriptionStatus ?? userProfile.subscriptionStatus ?? null;

    return {
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        image: userProfile.image,
        plan,
        stripeCustomerId: userProfile.stripeCustomerId,
        stripeSubscriptionId: userProfile.stripeSubscriptionId,
        asaasCustomerId: clinic?.asaasCustomerId ?? userProfile.asaasCustomerId ?? null,
        asaasSubscriptionId: clinic?.asaasSubscriptionId ?? userProfile.asaasSubscriptionId ?? null,
        subscriptionStatus,
        role: access.role,
        bypassSubscription: access.bypassSubscription,
        hasSubscriptionAccess: hasAccessBySubscription({
          plan,
          subscriptionStatus,
          bypassSubscription: access.bypassSubscription,
        }),
        clinic: clinic ? { id: clinic.id, name: clinic.name } : undefined,
      },
    };
  } catch (error) {
    console.error('SESSION_READ_FAILED', error);
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
  if (!session.user.clinic && !hasPrivilegedAccess(session)) redirect('/configuracoes/clinica');
  if (!session.user.hasSubscriptionAccess) redirect('/assinatura');
  return session;
});

export const auth = {
  api: {
    getSession: async () => getServerSession(),
  },
};
