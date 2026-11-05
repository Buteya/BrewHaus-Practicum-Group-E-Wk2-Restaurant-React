import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'
import {
  clearUserCart,
  removePurchasedItemsFromUserCart,
} from '../lib/cart'
import { formatPrice } from '../lib/format'

function Profile() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const user = session?.user
  const userId = user?.id
  const expectedDeleteUserId = new URLSearchParams(
    window.location.search,
  ).get('confirm-delete')
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeOrderAction, setActiveOrderAction] = useState(null)
  const [orderFeedback, setOrderFeedback] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isReauthenticating, setIsReauthenticating] = useState(false)
  const [requiresReauthentication, setRequiresReauthentication] =
    useState(false)

  useEffect(() => {
    if (isSessionPending || !expectedDeleteUserId) return

    if (userId === expectedDeleteUserId) {
      setIsDeleteDialogOpen(true)
    } else if (userId) {
      setDeleteError(
        'You signed in to a different BrewHaus account. Sign in with the account you intended to delete.',
      )
    }

    window.history.replaceState(null, '', '/profile')
  }, [expectedDeleteUserId, isSessionPending, userId])

  async function handleReauthenticate() {
    setDeleteError('')
    setIsReauthenticating(true)

    try {
      const { error } = await authClient.signOut()
      if (error) {
        throw new Error(error.message || 'Unable to sign out. Please try again.')
      }

      window.location.assign(
        `/login?reauth-delete=${encodeURIComponent(userId)}`,
      )
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to restart sign-in. Please try again.',
      )
      setIsReauthenticating(false)
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault()
    setDeleteError('')
    setIsDeletingAccount(true)

    try {
      const { error } = await authClient.deleteUser(
        deletePassword ? { password: deletePassword } : {},
      )

      if (error) {
        const needsFreshSession = error.code === 'SESSION_EXPIRED'
        setRequiresReauthentication(needsFreshSession)
        setDeleteError(
          needsFreshSession
            ? 'For your security, confirm your identity by signing in again before deleting your account.'
            : error.message ||
                `Unable to delete your account. Please try again.${error.code ? ` (${error.code})` : ''}`,
        )
        return
      }

      let cartCleanupFailed = false
      try {
        clearUserCart(userId)
      } catch {
        cartCleanupFailed = true
      }

      window.location.assign(
        `/login?account-deleted=1${cartCleanupFailed ? '&cart-cleanup=failed' : ''}`,
      )
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to delete your account. Please try again.',
      )
    } finally {
      setIsDeletingAccount(false)
    }
  }

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

  async function handleOrderAction(order, action) {
    setActiveOrderAction({ orderId: order.id, action })
    setOrderFeedback(null)

    try {
      const response = await fetch(`/api/orders/${order.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      })
      const result = await response.json()

      if (result.status) {
        setOrders((currentOrders) =>
          currentOrders.map((currentOrder) =>
            currentOrder.id === order.id
              ? { ...currentOrder, status: result.status }
              : currentOrder,
          ),
        )
      }
      if (!response.ok) {
        throw new Error(result.error || 'Unable to update this order.')
      }

      if (result.status === 'paid') {
        try {
          removePurchasedItemsFromUserCart(userId, order.items)
        } catch (error) {
          setOrderFeedback({
            orderId: order.id,
            message:
              error instanceof Error
                ? `Payment is confirmed, but we couldn't update your cart: ${error.message}`
                : "Payment is confirmed, but we couldn't update your cart.",
            type: 'error',
          })
          return
        }
      }

      const message =
        result.status === 'paid'
          ? 'Payment confirmed. Thank you for your order!'
          : result.status === 'cancelled'
            ? 'Your unpaid checkout was canceled.'
            : action === 'cancel'
              ? 'This checkout could not be canceled yet.'
              : 'Payment is still processing. Check again in a moment.'
      setOrderFeedback({
        orderId: order.id,
        message,
        type: result.status === 'pending' ? 'info' : 'success',
      })
    } catch (error) {
      setOrderFeedback({
        orderId: order.id,
        message:
          error instanceof Error ? error.message : 'Unable to update this order.',
        type: 'error',
      })
    } finally {
      setActiveOrderAction(null)
    }
  }

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
                      {order.status === 'pending' && (
                        <div className="mt-4 rounded-2xl bg-bg p-4">
                          <p className="text-sm text-ink-soft">
                            Payment hasn&apos;t been confirmed yet. Confirm its
                            status or cancel this checkout.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleOrderAction(order, 'confirm')
                              }
                              disabled={Boolean(activeOrderAction)}
                              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
                            >
                              {activeOrderAction?.orderId === order.id &&
                              activeOrderAction.action === 'confirm'
                                ? 'Checking payment...'
                                : 'Confirm payment'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOrderAction(order, 'cancel')}
                              disabled={Boolean(activeOrderAction)}
                              className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
                            >
                              {activeOrderAction?.orderId === order.id &&
                              activeOrderAction.action === 'cancel'
                                ? 'Canceling checkout...'
                                : 'Cancel order'}
                            </button>
                          </div>
                          {orderFeedback?.orderId === order.id && (
                            <p
                              className={`mt-3 text-sm font-medium ${
                                orderFeedback.type === 'error'
                                  ? 'text-accent'
                                  : 'text-ink-soft'
                              }`}
                              role={
                                orderFeedback.type === 'error'
                                  ? 'alert'
                                  : 'status'
                              }
                            >
                              {orderFeedback.message}
                            </p>
                          )}
                        </div>
                      )}
                      {order.status !== 'pending' &&
                        orderFeedback?.orderId === order.id && (
                          <p
                            className={`mt-3 text-sm font-medium ${
                              orderFeedback.type === 'error'
                                ? 'text-accent'
                                : 'text-ink-soft'
                            }`}
                            role={
                              orderFeedback.type === 'error'
                                ? 'alert'
                                : 'status'
                            }
                          >
                            {orderFeedback.message}
                          </p>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              className="mt-10 rounded-2xl border border-accent/30 bg-bg p-5 sm:p-6"
              aria-labelledby="delete-account-heading"
            >
              <p className="text-sm font-semibold tracking-[0.12em] text-accent uppercase">
                Account settings
              </p>
              <h2
                id="delete-account-heading"
                className="mt-2 text-xl font-bold text-ink"
              >
                Delete your account
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Deleting your account permanently removes your BrewHaus profile,
                sign-in details, and reservation requests made with this email.
                You will lose access to your order history. Transaction records
                are retained for restaurant records but will no longer be linked
                to your account. This cannot be undone.
              </p>
              {deleteError && !isDeleteDialogOpen && (
                <p className="mt-4 text-sm font-medium text-accent" role="alert">
                  {deleteError}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setDeletePassword('')
                  setDeleteError('')
                  setRequiresReauthentication(false)
                  setIsDeleteDialogOpen(true)
                }}
                className="mt-5 rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Delete account
              </button>
            </section>
          </>
        )}
      </section>

      {isDeleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeletingAccount) {
              setIsDeleteDialogOpen(false)
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-heading"
            className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 shadow-[0_12px_36px_rgba(23,54,47,0.2)] sm:p-8"
          >
            <p className="text-sm font-semibold tracking-[0.12em] text-accent uppercase">
              Permanent action
            </p>
            <h2
              id="confirm-delete-heading"
              className="mt-2 text-2xl font-bold text-ink"
            >
              Are you sure you want to leave BrewHaus?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Your profile, sign-in details, and reservation requests made with
              this email will be deleted. Your past transaction records will be
              kept for restaurant records, but you will no longer be able to
              view them. You cannot undo this action.
            </p>
            <form className="mt-6" onSubmit={handleDeleteAccount}>
              <label
                htmlFor="delete-account-password"
                className="block text-sm font-semibold text-ink"
              >
                Current password
                <span className="font-normal text-ink-soft">
                  {' '}
                  (if you use email and password)
                </span>
              </label>
              <input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                disabled={isDeletingAccount}
                className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
              />
              {deleteError && (
                <p className="mt-3 text-sm font-medium text-accent" role="alert">
                  {deleteError}
                </p>
              )}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeletingAccount}
                  className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent disabled:opacity-60"
                >
                  Keep my account
                </button>
                <button
                  type="button"
                  onClick={handleReauthenticate}
                  disabled={isDeletingAccount || isReauthenticating}
                  className={`rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-60 ${
                    requiresReauthentication ? '' : 'hidden'
                  }`}
                >
                  {isReauthenticating
                    ? 'Signing out...'
                    : 'Sign in again'}
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount}
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
                >
                  {isDeletingAccount ? 'Deleting account...' : 'Yes, delete it'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default Profile
