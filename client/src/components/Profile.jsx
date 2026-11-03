import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { formatPrice } from '../lib/format'

function Profile() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const user = session?.user
  const userId = user?.id
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isSessionPending) return
    if (!userId) {
      setOrders([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setOrders([])

    async function loadOrders() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await fetch('/api/orders', {
          credentials: 'include',
          signal: controller.signal,
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Unable to load your order history.')
        }
        if (!Array.isArray(result)) {
          throw new Error('Your order history response is invalid.')
        }

        setOrders(result)
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load your order history.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [isSessionPending, userId])

  return (
    <main className="mx-auto min-h-[55vh] w-full max-w-[900px] px-4 py-12 sm:px-6">
      <section
        className="rounded-3xl border border-line bg-white p-6 shadow-[0_12px_36px_rgba(23,54,47,0.08)] sm:p-9"
        aria-labelledby="profile-heading"
      >
        <p className="text-sm font-semibold tracking-[0.12em] text-highlight uppercase">
          BrewHaus account
        </p>
        <h1 id="profile-heading" className="mt-2 text-3xl font-bold text-ink">
          Your profile
        </h1>

        {isSessionPending ? (
          <p className="mt-6 text-ink-soft" role="status">
            Checking account...
          </p>
        ) : !user ? (
          <div className="mt-6">
            <p className="text-ink-soft">
              Sign in to view your profile and order history.
            </p>
            <a
              href="/login"
              className="mt-5 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Sign in
            </a>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl bg-bg p-5">
              <h2 className="font-bold text-ink">{user.name}</h2>
              <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
            </div>

            <section className="mt-9" aria-labelledby="order-history-heading">
              <h2
                id="order-history-heading"
                className="text-2xl font-bold text-ink"
              >
                Order history
              </h2>
              {errorMessage && (
                <p className="mt-4 text-sm font-medium text-accent" role="alert">
                  {errorMessage}
                </p>
              )}
              {isLoading ? (
                <p className="mt-4 text-ink-soft" role="status">
                  Loading your orders...
                </p>
              ) : orders.length === 0 ? (
                <div className="mt-4">
                  <p className="text-ink-soft">You have no orders yet.</p>
                  <a
                    href="/#menu"
                    className="mt-4 inline-block font-semibold text-accent hover:underline"
                  >
                    Browse the menu
                  </a>
                </div>
              ) : (
                <ul className="mt-4 space-y-4">
                  {orders.map((order) => (
                    <li
                      key={order.id}
                      className="rounded-2xl border border-line p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-ink">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            order.status === 'paid'
                              ? 'bg-accent text-white'
                              : 'bg-bg text-ink-soft'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <ul className="mt-3 divide-y divide-line">
                        {order.items.map((item, index) => (
                          <li
                            key={`${item.itemName}-${index}`}
                            className="flex justify-between gap-4 py-2 text-sm"
                          >
                            <span>
                              {item.itemName} × {item.quantity}
                            </span>
                            <span className="shrink-0 text-ink-soft">
                              {formatPrice(
                                Number(item.unitPrice) * item.quantity,
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 flex justify-between border-t border-line pt-3 font-bold text-ink">
                        <span>Total</span>
                        <span>
                          {order.currency}{' '}
                          {Number(order.total).toLocaleString('en-KE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default Profile
