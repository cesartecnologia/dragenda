import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { updateUserSubscription } from '@/server/clinic-data';

const PLAN_NAME = 'essential';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key not found');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
  });
};

const getMetadata = (object: { metadata?: Record<string, string | undefined> | null }) => {
  const metadata = object.metadata ?? {};
  return {
    userId: metadata.userId ?? null,
    clinicId: metadata.clinicId ?? null,
    plan: metadata.plan ?? PLAN_NAME,
  };
};

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe webhook secret not found');
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    throw new Error('Stripe signature not found');
  }

  const payload = await request.text();
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const { userId, plan } = getMetadata(checkoutSession);
      const subscriptionId = typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : null;
      const customerId = typeof checkoutSession.customer === 'string' ? checkoutSession.customer : null;

      if (checkoutSession.mode === 'subscription' && checkoutSession.payment_status === 'paid' && userId) {
        await updateUserSubscription(userId, {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          plan,
        });
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      const userId =
        invoice.parent?.subscription_details?.metadata?.userId ??
        invoice.lines.data.find((line) => line.parent?.type === 'subscription_item_details')?.metadata?.userId ??
        null;
      const plan =
        invoice.parent?.subscription_details?.metadata?.plan ??
        invoice.lines.data.find((line) => line.parent?.type === 'subscription_item_details')?.metadata?.plan ??
        PLAN_NAME;

      if (!subscriptionId || !customerId || !userId) {
        break;
      }

      await updateUserSubscription(userId, {
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        plan,
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const { userId, plan } = getMetadata(subscription);
      if (!userId) break;

      const activeStatuses = new Set(['active', 'trialing', 'past_due']);
      await updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : null,
        plan: activeStatuses.has(subscription.status) ? plan : null,
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const { userId } = getMetadata(subscription);
      if (!userId) break;

      await updateUserSubscription(userId, {
        stripeSubscriptionId: null,
        stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : null,
        plan: null,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
};
