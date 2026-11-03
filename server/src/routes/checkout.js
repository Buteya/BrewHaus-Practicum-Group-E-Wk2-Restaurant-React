import { inArray } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/index.js'
import { menu, orderItems, orders } from '../db/schema.js'
import { requireAuth } from '../middleware/require-auth.js'
import { getStripe } from '../stripe.js'

const router = Router()
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const pricePattern = /^\d+(?:\.\d{1,2})?$/

function priceToMinorUnits(price) {
  if (typeof price !== 'string' || !pricePattern.test(price)) {
    throw new Error(`Invalid menu price: ${price}`)
  }

  const [whole, fraction = ''] = price.split('.')
  const minorUnits = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
    throw new Error('Menu item price is outside the supported range.')
  }

  return minorUnits
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items } = req.body ?? {}
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50 ||
      items.some(
        (item) =>
          !item ||
          typeof item !== 'object' ||
          typeof item.menuId !== 'string' ||
          !uuidPattern.test(item.menuId) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 50,
      )
    ) {
      res.status(400).json({ error: 'The cart contains invalid items.' })
      return
    }

    const menuIds = items.map(({ menuId }) => menuId)
    if (new Set(menuIds).size !== menuIds.length) {
      res.status(400).json({ error: 'The cart contains duplicate items.' })
      return
    }

    const menuItems = await db
      .select({
        id: menu.id,
        name: menu.name,
        price: menu.price,
        currency: menu.currency,
      })
      .from(menu)
      .where(inArray(menu.id, menuIds))

    if (menuItems.length !== items.length) {
      res.status(400).json({ error: 'One or more menu items are unavailable.' })
      return
    }

    const currencies = new Set(menuItems.map(({ currency }) => currency))
    if (currencies.size !== 1) {
      res.status(400).json({ error: 'The cart must use a single currency.' })
      return
    }

    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]))
    const checkoutItems = items.map(({ menuId, quantity }) => {
      const item = menuItemsById.get(menuId)
      const unitAmount = priceToMinorUnits(item.price)
      return {
        menuId: item.id,
        itemName: item.name,
        quantity,
        unitPrice: item.price,
        unitAmount,
        currency: item.currency,
      }
    })
    const totalMinorUnits = checkoutItems.reduce(
      (total, item) => total + item.unitAmount * item.quantity,
      0,
    )
    if (!Number.isSafeInteger(totalMinorUnits)) {
      throw new Error('Checkout total is outside the supported range.')
    }

    const requestOrigin = req.get('origin')
    const configuredClientOrigins = [
      process.env.VERCEL_PROJECT_PRODUCTION_URL &&
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
      process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
      process.env.CLIENT_URL,
      process.env.BETTER_AUTH_URL,
    ]
      .filter(Boolean)
      .map((origin) => new URL(origin).origin)
    const clientUrl = requestOrigin
      ? new URL(requestOrigin).origin
      : (configuredClientOrigins[0] ?? null)

    if (!clientUrl) {
      throw new Error('CLIENT_URL or BETTER_AUTH_URL must be configured.')
    }
    if (!configuredClientOrigins.includes(clientUrl)) {
      res.status(403).json({ error: 'Checkout origin is not allowed.' })
      return
    }

    const stripe = getStripe()
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: req.authUser.id,
      metadata: { userId: req.authUser.id },
      line_items: checkoutItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: item.currency.toLowerCase(),
          unit_amount: item.unitAmount,
          product_data: {
            name: item.itemName,
            metadata: { menuId: item.menuId, unitPrice: item.unitPrice },
          },
        },
      })),
      success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/checkout/cancelled`,
    })

    if (!checkoutSession.url) {
      throw new Error('Stripe did not return a checkout URL.')
    }

    try {
      await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            userId: req.authUser.id,
            stripeCheckoutSessionId: checkoutSession.id,
            status: 'pending',
            total: (totalMinorUnits / 100).toFixed(2),
            currency: checkoutItems[0].currency,
          })
          .returning({ id: orders.id })

        await tx.insert(orderItems).values(
          checkoutItems.map(({ menuId, itemName, quantity, unitPrice }) => ({
            orderId: order.id,
            menuId,
            itemName,
            quantity,
            unitPrice,
          })),
        )
      })
    } catch (error) {
      try {
        await stripe.checkout.sessions.expire(checkoutSession.id)
      } catch (expirationError) {
        console.error(
          'Unable to expire Stripe session after order creation failed:',
          expirationError,
        )
      }
      throw error
    }

    res.json({ url: checkoutSession.url })
  } catch (error) {
    next(error)
  }
})

export default router
