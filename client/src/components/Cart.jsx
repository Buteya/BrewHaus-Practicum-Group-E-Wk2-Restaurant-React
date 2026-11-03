import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { readUserCart, writeUserCart } from '../lib/cart'
import { formatPrice } from '../lib/format'

function Cart() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const userId = session?.user?.id ?? null
  const [cartState, setCartState] = useState({ userId: null, items: [] })
  const [errorMessage, setErrorMessage] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const cart =
    !isSessionPending && cartState.userId === userId ? cartState.items : []
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  )

  useEffect(() => {
    if (isSessionPending) return

    try {
      setCartState({ userId, items: readUserCart(userId) })
      setErrorMessage('')
    } catch (error) {
      setCartState({ userId, items: [] })
      setErrorMessage(
        error instanceof Error
          ? `Unable to load your saved cart: ${error.message}`
          : 'Unable to load your saved cart.',
      )
    }
  }, [isSessionPending, userId])

  function updateCart(nextCart) {
    try {
      writeUserCart(userId, nextCart)
      setCartState({ userId, items: nextCart })
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Unable to update your cart: ${error.message}`
          : 'Unable to update your cart.',
      )
    }
  }

  function changeQuantity(itemId, change) {
    updateCart(
      cart.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item,
      ),
    )
  }

  function removeItem(itemId) {
    updateCart(cart.filter((item) => item.id !== itemId))
  }

  async function handleCheckout() {
    setErrorMessage('')
    setIsCheckingOut(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cart.map(({ id, quantity }) => ({
            menuId: id,
            quantity,
          })),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to start checkout.')
      }
      if (typeof result.url !== 'string') {
        throw new Error('Checkout did not return a payment link.')
      }

      window.location.assign(result.url)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to start checkout.',
      )
      setIsCheckingOut(false)
    }
  }

  return (
    <main className="mx-auto min-h-[55vh] w-full max-w-[900px] px-4 py-12 sm:px-6">
      <section
        className="rounded-3xl border border-line bg-white p-6 shadow-[0_12px_36px_rgba(23,54,47,0.08)] sm:p-9"
        aria-labelledby="cart-heading"
      >
        <p className="text-sm font-semibold tracking-[0.12em] text-highlight uppercase">
          BrewHaus order
        </p>
        <h1 id="cart-heading" className="mt-2 text-3xl font-bold text-ink">
          Your cart
        </h1>

        {errorMessage && (
          <p className="mt-4 text-sm font-medium text-accent" role="alert">
            {errorMessage}
          </p>
        )}

        {isSessionPending ? (
          <p className="mt-6 text-ink-soft" role="status">
            Checking account...
          </p>
        ) : !session?.user ? (
          <div className="mt-6">
            <p className="text-ink-soft">
              Sign in to view and save a cart associated with your account.
            </p>
            <a
              href="/login"
              className="mt-5 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Sign in
            </a>
          </div>
        ) : cart.length === 0 ? (
          <div className="mt-6">
            <p className="text-ink-soft">Your cart is empty.</p>
            <a
              href="/#menu"
              className="mt-5 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Browse menu
            </a>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm font-semibold text-ink-soft">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 className="font-semibold text-ink">{item.name}</h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      {formatPrice(item.price)} each
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className="inline-flex items-center overflow-hidden rounded-full border border-line"
                      role="group"
                      aria-label={`Quantity for ${item.name}`}
                    >
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={item.quantity <= 1}
                        onClick={() => changeQuantity(item.id, -1)}
                        className="grid size-10 place-items-center text-lg font-semibold text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>
                      <output className="min-w-9 text-center text-sm font-semibold">
                        {item.quantity}
                      </output>
                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() => changeQuantity(item.id, 1)}
                        className="grid size-10 place-items-center text-lg font-semibold text-ink hover:bg-bg"
                      >
                        +
                      </button>
                    </div>
                    <p className="min-w-28 text-right font-semibold text-ink">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <a
                href="/#menu"
                className="font-semibold text-accent hover:underline"
              >
                Continue shopping
              </a>
              <p className="text-xl font-bold text-ink">
                Total: {formatPrice(total)}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
              >
                {isCheckingOut ? 'Starting checkout...' : 'Proceed to checkout'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default Cart
