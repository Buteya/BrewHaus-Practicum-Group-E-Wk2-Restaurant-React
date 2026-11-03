import { and, desc, eq, inArray } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/index.js'
import { orderItems, orders } from '../db/schema.js'
import { requireAuth } from '../middleware/require-auth.js'
import { getStripe } from '../stripe.js'

const router = Router()
const checkoutSessionIdPattern = /^cs_(?:test|live)_[A-Za-z0-9]+$/
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function priceToMinorUnits(price) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(price)
  if (!match) {
    throw new Error('Stored order total has an invalid format.')
  }

  const amount =
    Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  if (!Number.isSafeInteger(amount)) {
    throw new Error('Stored order total is outside the supported range.')
  }

  return amount
}

async function findOrderForUser(orderId, userId) {
  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      stripeCheckoutSessionId: orders.stripeCheckoutSessionId,
      status: orders.status,
      total: orders.total,
      currency: orders.currency,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)

  return order
}

async function getVerifiedCheckoutSession(order) {
  if (!checkoutSessionIdPattern.test(order.stripeCheckoutSessionId)) {
    throw new Error(`Order ${order.id} has an invalid Stripe session ID.`)
  }

  const checkoutSession = await getStripe().checkout.sessions.retrieve(
    order.stripeCheckoutSessionId,
  )

  if (
    checkoutSession.id !== order.stripeCheckoutSessionId ||
    checkoutSession.client_reference_id !== order.userId ||
    checkoutSession.metadata?.userId !== order.userId ||
    checkoutSession.amount_total !== priceToMinorUnits(order.total) ||
    checkoutSession.currency !== order.currency.toLowerCase()
  ) {
    throw new Error(
      `Stripe checkout session ${order.stripeCheckoutSessionId} does not match its stored order.`,
    )
  }

  return checkoutSession
}

async function updatePendingOrderStatus(orderId, status) {
  if (status !== 'pending') {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')))
      .returning({ status: orders.status })

    if (updatedOrder) return updatedOrder.status
  }

  const [currentOrder] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!currentOrder) {
    throw new Error(`Order ${orderId} disappeared during status confirmation.`)
  }

  return currentOrder.status
}

async function reconcilePendingOrder(order, checkoutSession) {
  const status =
    checkoutSession.payment_status === 'paid'
      ? 'paid'
      : checkoutSession.status === 'expired'
        ? 'cancelled'
        : 'pending'

  return updatePendingOrderStatus(order.id, status)
}

async function getOrderItems(orderId) {
  return db
    .select({
      menuId: orderItems.menuId,
      itemName: orderItems.itemName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        currency: orders.currency,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, req.authUser.id))
      .orderBy(desc(orders.createdAt))

    if (userOrders.length === 0) {
      res.json([])
      return
    }

    const items = await db
      .select({
        orderId: orderItems.orderId,
        menuId: orderItems.menuId,
        itemName: orderItems.itemName,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, userOrders.map(({ id }) => id)))

    const itemsByOrderId = new Map()
    for (const item of items) {
      const orderItemsForOrder = itemsByOrderId.get(item.orderId) ?? []
      orderItemsForOrder.push({
        menuId: item.menuId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })
      itemsByOrderId.set(item.orderId, orderItemsForOrder)
    }

    res.json(
      userOrders.map((order) => ({
        ...order,
        items: itemsByOrderId.get(order.id) ?? [],
      })),
    )
  } catch (error) {
    next(error)
  }
})

router.get('/checkout/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params
    if (!checkoutSessionIdPattern.test(sessionId)) {
      res.status(400).json({ error: 'Invalid checkout session ID.' })
      return
    }

    let [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        stripeCheckoutSessionId: orders.stripeCheckoutSessionId,
        status: orders.status,
        total: orders.total,
        currency: orders.currency,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.stripeCheckoutSessionId, sessionId),
          eq(orders.userId, req.authUser.id),
        ),
      )
      .limit(1)

    if (!order) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    if (order.status === 'pending') {
      const checkoutSession = await getVerifiedCheckoutSession(order)
      order = {
        ...order,
        status: await reconcilePendingOrder(order, checkoutSession),
      }
    }

    const items = await getOrderItems(order.id)
    res.json({ ...order, items })
  } catch (error) {
    next(error)
  }
})

router.post('/:orderId/confirm', requireAuth, async (req, res, next) => {
  try {
    const { orderId } = req.params
    if (!uuidPattern.test(orderId)) {
      res.status(400).json({ error: 'Invalid order ID.' })
      return
    }

    const order = await findOrderForUser(orderId, req.authUser.id)
    if (!order) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }
    if (order.status !== 'pending') {
      res.json({ status: order.status })
      return
    }

    const checkoutSession = await getVerifiedCheckoutSession(order)
    const status = await reconcilePendingOrder(order, checkoutSession)
    res.json({ status })
  } catch (error) {
    next(error)
  }
})

router.post('/:orderId/cancel', requireAuth, async (req, res, next) => {
  try {
    const { orderId } = req.params
    if (!uuidPattern.test(orderId)) {
      res.status(400).json({ error: 'Invalid order ID.' })
      return
    }

    const order = await findOrderForUser(orderId, req.authUser.id)
    if (!order) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }
    if (order.status !== 'pending') {
      res.json({ status: order.status })
      return
    }

    let checkoutSession = await getVerifiedCheckoutSession(order)
    let status = await reconcilePendingOrder(order, checkoutSession)
    if (status !== 'pending') {
      res.json({ status })
      return
    }
    if (checkoutSession.status !== 'open') {
      res.status(409).json({
        status,
        error:
          'Payment is still processing, so this order cannot be canceled yet. Check its payment status again shortly.',
      })
      return
    }

    try {
      await getStripe().checkout.sessions.expire(
        order.stripeCheckoutSessionId,
      )
    } catch (expirationError) {
      checkoutSession = await getVerifiedCheckoutSession(order)
      if (checkoutSession.status === 'open') throw expirationError
    }

    if (checkoutSession.status === 'open') {
      checkoutSession = await getVerifiedCheckoutSession(order)
    }
    status = await reconcilePendingOrder(order, checkoutSession)
    if (status === 'pending') {
      res.status(409).json({
        status,
        error:
          'Payment is still processing, so this order cannot be canceled yet. Check its payment status again shortly.',
      })
      return
    }

    res.json({ status })
  } catch (error) {
    next(error)
  }
})

export default router
