import Stripe from 'stripe';
import { ENV } from './_core/env';

if (!ENV.stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

export const stripe = new Stripe(ENV.stripeSecretKey, {
  typescript: true,
});

/**
 * Create a Stripe checkout session for ticket purchase
 */
export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    description: string;
    priceInCents: number;
    quantity: number;
  }>;
  origin: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const { userId, userEmail, userName, orderNumber, items, origin, metadata = {} } = params;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
    price_data: {
      currency: 'eur',
      product_data: {
        name: item.name,
        description: item.description,
      },
      unit_amount: item.priceInCents,
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    allow_promotion_codes: true,
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      order_number: orderNumber,
      ...metadata,
    },
  });

  return session;
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Create a refund for a payment intent
 */
export async function createRefund(paymentIntentId: string, amountInCents?: number): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  if (amountInCents) {
    refundParams.amount = amountInCents;
  }

  return await stripe.refunds.create(refundParams);
}

/**
 * Verify webhook signature and construct event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
