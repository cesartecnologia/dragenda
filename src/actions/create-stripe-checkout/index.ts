'use server';

import { actionClient } from '@/lib/next-safe-action';

export const createStripeCheckout = actionClient.action(async () => {
  throw new Error('Stripe desabilitado neste projeto. Use a integracao com Asaas.');
});
