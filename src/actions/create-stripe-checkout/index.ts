'use server';

import Stripe from 'stripe';

import { requireSession } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { createClinicForUser, getClinicById, getUserProfileById, updateUserSubscription } from '@/server/clinic-data';

const PLAN_NAME = 'essential';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key not found');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
  });
};

export const createStripeCheckout = actionClient.action(async () => {
  const session = await requireSession();

  if (session.user.bypassSubscription) {
    throw new Error('Seu perfil não exige assinatura.');
  }

  if (!process.env.ESSENTIAL_PLAN_PRICE_ID) {
    throw new Error('Stripe price not configured');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL not configured');
  }

  const stripe = getStripe();
  const userProfile = await getUserProfileById(session.user.id);
  if (!userProfile) throw new Error('User not found');

  let clinicId = userProfile.clinicId;
  let clinic = clinicId ? await getClinicById(clinicId) : null;

  if (!clinic) {
    clinic = await createClinicForUser({
      userId: session.user.id,
      name: `Clínica de ${session.user.name.split(' ')[0] || 'Novo cliente'}`,
    });
    clinicId = clinic.id;
  }

  if (!clinicId || !clinic) {
    throw new Error('Clinic not found');
  }

  let customerId = clinic.stripeCustomerId ?? userProfile.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: clinic.name || session.user.name,
      metadata: {
        userId: session.user.id,
        clinicId,
      },
    });
    customerId = customer.id;

    await updateUserSubscription(session.user.id, {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: userProfile.stripeSubscriptionId,
      plan: clinic.plan ?? userProfile.plan,
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracoes/clinica?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?checkout=cancelled`,
    client_reference_id: session.user.id,
    metadata: {
      userId: session.user.id,
      clinicId,
      plan: PLAN_NAME,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        clinicId,
        plan: PLAN_NAME,
      },
    },
    line_items: [
      {
        price: process.env.ESSENTIAL_PLAN_PRICE_ID,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
  });

  return {
    sessionId: checkoutSession.id,
  };
});
