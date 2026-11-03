import { and, desc, eq, inArray } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/index.js'
import { orderItems, orders } from '../db/schema.js'
import { requireAuth } from '../middleware/require-auth.js'
import { getStripe } from '../stripe.js'

const router = Router()
const checkoutSessionIdPattern = /^cs_(?:test|live)_[A-Za-z0-9]+$/

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
      const checkoutSession = await getStripe().checkout.sessions.retrieve(
        sessionId,
      )

      if (
        checkoutSession.id !== sessionId ||
        checkoutSession.client_reference_id !== req.authUser.id ||
        checkoutSession.metadata?.userId !== req.authUser.id ||
        checkoutSession.amount_total !== priceToMinorUnits(order.total) ||
        checkoutSession.currency !== order.currency.toLowerCase()
      ) {
        throw new Error(
          `Stripe checkout session ${sessionId} does not match its stored order.`,
        )
      }

      const confirmedStatus =
        checkoutSession.payment_status === 'paid'
          ? 'paid'
          : checkoutSession.status === 'expired'
            ? 'cancelled'
            : null

      if (confirmedStatus) {
        const [updatedOrder] = await db
          .update(orders)
          .set({ status: confirmedStatus })
          .where(and(eq(orders.id, order.id), eq(orders.status, 'pending')))
          .returning({ status: orders.status })

        if (updatedOrder) {
          order = { ...order, status: updatedOrder.status }
        } else {
          const [currentOrder] = await db
            .select({ status: orders.status })
            .from(orders)
            .where(eq(orders.id, order.id))
            .limit(1)

          if (!currentOrder) {
            throw new Error(
              `Order ${order.id} disappeared during confirmation.`,
            )
          }
          order = { ...order, status: currentOrder.status }
        }
      }
    }

    const items = await db
      .select({
        itemName: orderItems.itemName,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))

    res.json({ ...order, items })
  } catch (error) {
    next(error)
  }
})

export default router
