import { Request, Response } from 'express';
import Stripe from 'stripe';
import { constructWebhookEvent } from './stripe';
import { ENV } from './_core/env';
import { getDb } from './db';
import { orders, transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Handle Stripe webhook events
 * This endpoint must be registered with express.raw() middleware
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signatureHeader = req.headers['stripe-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  if (!ENV.stripeWebhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(req.body, signature, ENV.stripeWebhookSecret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Webhook] Test event detected, returning verification response');
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Processing checkout.session.completed:', session.id);

  const db = await getDb();
  if (!db) {
    console.error('[Webhook] Database not available');
    return;
  }

  const orderNumber = session.metadata?.order_number;
  if (!orderNumber) {
    console.error('[Webhook] Missing order_number in session metadata');
    return;
  }

  // Update order with Stripe session and payment intent IDs
  await db
    .update(orders)
    .set({
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(orders.orderNumber, orderNumber));

  console.log(`[Webhook] Order ${orderNumber} marked as completed`);
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Webhook] Processing payment_intent.succeeded:', paymentIntent.id);

  const db = await getDb();
  if (!db) {
    console.error('[Webhook] Database not available');
    return;
  }

  // Find order by payment intent ID
  const orderResults = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
    .limit(1);

  if (orderResults.length === 0) {
    console.warn('[Webhook] No order found for payment intent:', paymentIntent.id);
    return;
  }

  const order = orderResults[0];

  // Create transaction record
  await db.insert(transactions).values({
    orderId: order.id,
    stripeChargeId: paymentIntent.latest_charge as string,
    amount: (paymentIntent.amount / 100).toString(),
    currency: paymentIntent.currency.toUpperCase(),
    status: 'succeeded',
    metadata: JSON.stringify({
      payment_method: paymentIntent.payment_method,
      receipt_email: paymentIntent.receipt_email,
    }),
    createdAt: new Date(),
  });

  console.log(`[Webhook] Transaction created for order ${order.id}`);
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Webhook] Processing payment_intent.payment_failed:', paymentIntent.id);

  const db = await getDb();
  if (!db) {
    console.error('[Webhook] Database not available');
    return;
  }

  // Update order status to failed
  await db
    .update(orders)
    .set({
      status: 'failed',
      updatedAt: new Date(),
    })
    .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

  // Create failed transaction record
  const orderResults = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
    .limit(1);

  if (orderResults.length > 0) {
    await db.insert(transactions).values({
      orderId: orderResults[0].id,
      amount: (paymentIntent.amount / 100).toString(),
      currency: paymentIntent.currency.toUpperCase(),
      status: 'failed',
      metadata: JSON.stringify({
        error: paymentIntent.last_payment_error,
      }),
      createdAt: new Date(),
    });
  }

  console.log(`[Webhook] Payment failed for intent ${paymentIntent.id}`);
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('[Webhook] Processing charge.refunded:', charge.id);

  const db = await getDb();
  if (!db) {
    console.error('[Webhook] Database not available');
    return;
  }

  // Find transaction by charge ID and update status
  await db
    .update(transactions)
    .set({
      status: 'refunded',
    })
    .where(eq(transactions.stripeChargeId, charge.id));

  // Update order status to refunded
  const transactionResults = await db
    .select()
    .from(transactions)
    .where(eq(transactions.stripeChargeId, charge.id))
    .limit(1);

  if (transactionResults.length > 0) {
    await db
      .update(orders)
      .set({
        status: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, transactionResults[0].orderId));

    console.log(`[Webhook] Order ${transactionResults[0].orderId} marked as refunded`);
  }
}
