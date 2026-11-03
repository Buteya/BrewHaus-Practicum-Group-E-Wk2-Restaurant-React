import { useEffect, useState } from 'react'
import { formatPrice } from '../lib/format'
import { authClient } from '../lib/auth-client'
import { clearUserCart } from '../lib/cart'

const maxAttempts = 6
const retryDelayMs = 1000

function CheckoutSuccess() {
  const sessionId = new URLSearchParams(window.location.search).get('session_id')
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [order, setOrder] = useState(null)
  const [orderOwnerId, setOrderOwnerId] = useState(null)
  const [message, setMessage] = useState('Checking your payment...')
  const [isChecking, setIsChecking] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [cartCleanupError, setCartCleanupError] = useState('')

  useEffect(() => {
    if (
      order?.status !== 'paid' ||
      isSessionPending ||
      !session?.user?.id ||
      session.user.id !== orderOwnerId
    ) {
      return
    }

    try {
      clearUserCart(session.user.id)
      setCartCleanupError('')
    } catch (error) {
      setCartCleanupError(
        error instanceof Error
          ? `Payment is confirmed, but we couldn't update your cart: ${error.message}`
          : "Payment is confirmed, but we couldn't update your cart.",
      )
    }
  }, [isSessionPending, order, orderOwnerId, session?.user?.id])

  useEffect(() => {
    const controller = new AbortController()

    async function checkOrder() {
      if (!sessionId) {
        setMessage('We could not find the checkout session for this payment.')
        setIsChecking(false)
        return
      }

      setIsChecking(true)
      setOrder(null)

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (controller.signal.aborted) return

        try {
          const response = await fetch(
            `/api/orders/checkout/${encodeURIComponent(sessionId)}`,
            {
              credentials: 'include',
              signal: controller.signal,
            },
          )
          const result = await response.json()

          if (response.status === 401) {
            setMessage('Sign in to verify the payment for your order.')
            setIsChecking(false)
            return
          }
          if (response.status === 404 && attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
            continue
          }
          if (!response.ok) {
            throw new Error(result.error || 'Unable to verify your payment.')
          }

          setOrder(result)
          setOrderOwnerId(result.userId)
          if (result.status === 'paid') {
            setMessage('Payment confirmed. Thank you for your order!')
            setIsChecking(false)
            return
          }
          if (result.status === 'failed' || result.status === 'cancelled') {
            setMessage('This payment was not completed.')
            setIsChecking(false)
            return
          }
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
            continue
          }

          setMessage(
            'Payment is still processing. You can check again in a moment.',
          )
          setIsChecking(false)
          return
        } catch (error) {
          if (controller.signal.aborted) return
          setMessage(
            error instanceof Error
              ? error.message
              : 'Unable to verify your payment.',
          )
          setIsChecking(false)
          return
        }
      }

      if (!controller.signal.aborted) {
        setMessage('We could not find this order. Please contact us for help.')
        setIsChecking(false)
      }
    }

    checkOrder()
    return () => controller.abort()
  }, [retryCount, sessionId])

  return (
    <main className="mx-auto flex min-h-[55vh] w-full max-w-[760px] items-center px-4 py-12 sm:px-6">
      <section
        className="w-full rounded-3xl border border-line bg-white p-7 shadow-[0_12px_36px_rgba(23,54,47,0.08)] sm:p-10"
        aria-labelledby="checkout-result-heading"
      >
        <p className="text-sm font-semibold tracking-[0.12em] text-highlight uppercase">
          BrewHaus order
        </p>
        <h1
          id="checkout-result-heading"
          className="mt-3 text-3xl font-bold text-ink"
        >
          {order?.status === 'paid' ? 'Payment successful' : 'Order status'}
        </h1>
        <p
          className="mt-3 text-ink-soft"
          role={isChecking || order?.status === 'paid' ? 'status' : 'alert'}
        >
          {message}
        </p>
        {cartCleanupError && (
          <p className="mt-3 text-sm font-medium text-accent" role="alert">
            {cartCleanupError}
          </p>
        )}

        {order && (
          <div className="mt-7 border-t border-line pt-5">
            <h2 className="font-bold text-ink">Order summary</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((item, index) => (
                <li
                  key={`${item.itemName}-${index}`}
                  className="flex justify-between gap-4 py-2 text-sm"
                >
                  <span>
                    {item.itemName} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-semibold text-ink-soft">
                    {formatPrice(Number(item.unitPrice) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t border-line pt-4 font-bold text-ink">
              <span>Total</span>
              <span>
                {order.currency}{' '}
                {Number(order.total).toLocaleString('en-KE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>
        )}

        {!isChecking && order?.status === 'pending' && (
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-6 rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Check payment again
          </button>
        )}
        {order?.status === 'paid' && (
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/#menu"
              className="inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Back to menu
            </a>
            <a
              href="/profile"
              className="inline-block rounded-full border border-line px-6 py-3 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              View order history
            </a>
          </div>
        )}
        {!sessionId && (
          <a
            href="/#menu"
            className="mt-6 inline-block rounded-full border border-line px-6 py-3 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Back to menu
          </a>
        )}
        {message === 'Sign in to verify the payment for your order.' && (
          <a
            href="/login"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Sign in
          </a>
        )}
      </section>
    </main>
  )
}

export default CheckoutSuccess
