import { and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { orders } from '../db/schema.js'
import { getStripe } from '../stripe.js'

async function updateOrderStatus(checkoutSession, status) {
  if (!checkoutSession.id) {
    throw new Error('Stripe checkout session is missing its ID.')
  }

  const [order] = await db
    .update(orders)
    .set({ status })
    .where(
      and(
        eq(orders.stripeCheckoutSessionId, checkoutSession.id),
        eq(orders.status, 'pending'),
      ),
    )
    .returning({ id: orders.id })

  if (!order) {
    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.stripeCheckoutSessionId, checkoutSession.id))
      .limit(1)

    if (!existingOrder) {
      throw new Error(
        `No order found for Stripe checkout session ${checkoutSession.id}.`,
      )
    }
  }
}

export async function stripeWebhookHandler(req, res, next) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    next(new Error('STRIPE_WEBHOOK_SECRET is not configured.'))
    return
  }

  let event
  try {
    const signature = req.headers['stripe-signature']
    if (!signature) {
      res.status(400).json({ error: 'Missing Stripe signature.' })
      return
    }
    event = getStripe().webhooks.constructEvent(req.body, signature, webhookSecret)
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error)
    res.status(400).json({ error: 'Invalid Stripe webhook signature.' })
    return
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.payment_status === 'paid') {
        await updateOrderStatus(session, 'paid')
      }
    } else if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object
      if (session.payment_status === 'paid') {
        await updateOrderStatus(session, 'paid')
      }
    } else if (event.type === 'checkout.session.async_payment_failed') {
      await updateOrderStatus(event.data.object, 'failed')
    } else if (event.type === 'checkout.session.expired') {
      await updateOrderStatus(event.data.object, 'cancelled')
    }
    res.sendStatus(200)
  } catch (error) {
    next(error)
  }
}
