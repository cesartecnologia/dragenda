import { cache } from 'react';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { DecodedIdToken } from 'firebase-admin/auth';

import type { UserRole } from '@/db/schema';
import { getDefaultPostLoginRoute, resolvePrivilegedAccess } from '@/lib/access';
import { adminAuth } from '@/lib/firebase-admin';
import { withServerCache } from '@/lib/server-cache';
import { getClinicById, getUserProfileById, updateUserAsaasSubscription, upsertUserProfile } from '@/server/clinic-data';
import { getSubscriptionSummaryForUser } from '@/server/subscription-data';

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? '__clinic_smart_session';

const ACCESS_RELEASING_STATUSES = new Set(['active']);
const SUBSCRIPTION_OVERDUE_GRACE_DAYS = Number(process.env.SUBSCRIPTION_OVERDUE_GRACE_DAYS ?? '3');
const DEFAULT_SUBSCRIPTION_PLAN = 'essential';

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    plan: string | null;
    asaasCustomerId: string | null;
    asaasSubscriptionId: string | null;
    subscriptionStatus: string | null;
    paidThroughDate: Date | null;
    role: UserRole;
    bypassSubscription: boolean;
    hasSubscriptionAccess: boolean;
    mustChangePassword: boolean;
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
  paidThroughDate?: Date | null;
  bypassSubscription?: boolean;
}) => {
  if (params.bypassSubscription) return true;

  const normalizedStatus = normalizeSubscriptionStatus(params.subscriptionStatus);
  if (normalizedStatus && ACCESS_RELEASING_STATUSES.has(normalizedStatus)) return true;

  if (normalizedStatus === 'overdue' && params.paidThroughDate instanceof Date) {
    const graceUntil = params.paidThroughDate.getTime() + SUBSCRIPTION_OVERDUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() <= graceUntil;
  }

  return false;
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
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      subscriptionStatus: null,
      role: access.role,
      bypassSubscription: access.bypassSubscription,
      paidThroughDate: null,
      hasSubscriptionAccess: hasAccessBySubscription({ bypassSubscription: access.bypassSubscription }),
      mustChangePassword: false,
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
        paidThroughDate: session.user.paidThroughDate,
        bypassSubscription: session.user.bypassSubscription,
      }),
  );

export const getServerSession = cache(async (): Promise<AppSession | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decodedToken = await withServerCache(`session:${sessionCookie}`, 30_000, async () => {
      return adminAuth().verifySessionCookie(sessionCookie);
    });
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
        asaasCustomerId: clinic?.asaasCustomerId ?? userProfile.asaasCustomerId ?? null,
        asaasSubscriptionId: clinic?.asaasSubscriptionId ?? userProfile.asaasSubscriptionId ?? null,
        subscriptionStatus,
        paidThroughDate: clinic?.paidThroughDate ?? userProfile.paidThroughDate ?? null,
        role: access.role,
        bypassSubscription: access.bypassSubscription,
        hasSubscriptionAccess: hasAccessBySubscription({
          plan,
          subscriptionStatus,
          paidThroughDate: clinic?.paidThroughDate ?? userProfile.paidThroughDate ?? null,
          bypassSubscription: access.bypassSubscription,
        }),
        mustChangePassword: Boolean(userProfile.mustChangePassword),
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
  if (!session?.user) redirect('/login');
  return session;
});

export const ensureSessionSubscriptionAccess = async (session: AppSession) => {
  if (session.user.hasSubscriptionAccess || session.user.bypassSubscription) return session;

  try {
    const summary = await getSubscriptionSummaryForUser(session.user.id);
    const nextPlan = ['cancelled', 'deleted', 'inactive', 'refunded'].includes(summary.resolvedStatus ?? '')
      ? null
      : session.user.plan ?? DEFAULT_SUBSCRIPTION_PLAN;

    await updateUserAsaasSubscription(session.user.id, {
      asaasCustomerId: summary.asaasCustomerId ?? undefined,
      asaasSubscriptionId: summary.asaasSubscriptionId ?? undefined,
      subscriptionStatus: summary.resolvedStatus,
      paidThroughDate: summary.paidThroughDate ?? undefined,
      plan: nextPlan,
    }).catch(() => null);

    const nextStatus = summary.resolvedStatus ?? session.user.subscriptionStatus;
    const nextPaidThroughDate = summary.paidThroughDate ?? session.user.paidThroughDate;
    const hasSubscriptionAccess = hasAccessBySubscription({
      plan: nextPlan,
      subscriptionStatus: nextStatus,
      paidThroughDate: nextPaidThroughDate,
      bypassSubscription: session.user.bypassSubscription,
    });

    return {
      ...session,
      user: {
        ...session.user,
        plan: nextPlan,
        asaasCustomerId: summary.asaasCustomerId ?? session.user.asaasCustomerId,
        asaasSubscriptionId: summary.asaasSubscriptionId ?? session.user.asaasSubscriptionId,
        subscriptionStatus: nextStatus,
        paidThroughDate: nextPaidThroughDate,
        hasSubscriptionAccess,
      },
    };
  } catch (error) {
    console.error('SESSION_SUBSCRIPTION_RECONCILE_FAILED', error);
    return session;
  }
};

export const requireClinicSession = cache(async () => {
  const session = await requireSession();
  if (!session.user.clinic) redirect('/configuracoes/clinica?onboarding=1');
  return session;
});

export const requireSubscribedSession = cache(async () => {
  const session = await ensureSessionSubscriptionAccess(await requireSession());
  if (session.user.mustChangePassword) redirect('/primeiro-login');
  if (!session.user.hasSubscriptionAccess) redirect('/assinatura');
  if (!session.user.clinic) redirect('/configuracoes/clinica?onboarding=1');
  return session;
});

export const auth = {
  api: {
    getSession: async () => getServerSession(),
  },
};

export { getDefaultPostLoginRoute } from '@/lib/access';
