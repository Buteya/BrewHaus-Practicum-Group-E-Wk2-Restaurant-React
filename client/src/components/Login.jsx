import { useState } from 'react'
import { authClient } from '../lib/auth-client'

function getOAuthErrorMessage() {
  const error = new URLSearchParams(window.location.search).get('error')
  if (!error) return ''

  const messages = {
    account_not_linked:
      'This Google email matches an existing account. Try Google sign-in again using the same email address.',
    account_already_linked_to_different_user:
      'This Google account is already linked to a different BrewHaus account.',
    email_does_not_match:
      'The Google email does not match the BrewHaus account being linked.',
    email_not_found: 'Google did not provide an email address for this account.',
    email_not_verified: 'Verify your Google email address and try again.',
    state_not_found:
      'Google sign-in expired or was interrupted. Please try again.',
  }

  return messages[error] || 'Google sign-in could not be completed. Please try again.'
}

function Login() {
  const requiresOrderSignIn =
    new URLSearchParams(window.location.search).get('reason') ===
    'order-required'
  const deleteReauthUserId = new URLSearchParams(
    window.location.search,
  ).get('reauth-delete')
  const deleteReauthCallback = deleteReauthUserId
    ? `${window.location.origin}/profile?confirm-delete=${encodeURIComponent(deleteReauthUserId)}`
    : null
  const [mode, setMode] = useState('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(getOAuthErrorMessage)
  const noticeMessage =
    deleteReauthUserId
      ? 'Sign in again with the same BrewHaus account to confirm your account deletion.'
      : requiresOrderSignIn
        ? 'Sign in or create an account to add items to your cart or place an order.'
        : ''
  const accountWasDeleted =
    new URLSearchParams(window.location.search).get('account-deleted') === '1'
  const cartCleanupFailed =
    new URLSearchParams(window.location.search).get('cart-cleanup') === 'failed'
  const [successMessage, setSuccessMessage] = useState(
    accountWasDeleted
      ? cartCleanupFailed
        ? "Your account has been deleted, but this browser could not clear its saved cart. Please clear this browser's local storage."
        : 'Your BrewHaus account has been deleted. You can no longer sign in with it.'
      : '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSigningUp = mode === 'sign-up'
  const isForgotPassword = mode === 'forgot-password'

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const { error } = isForgotPassword
        ? await authClient.requestPasswordReset({
            email: email.trim().toLowerCase(),
            redirectTo: `${window.location.origin}/reset-password`,
          })
        : isSigningUp
          ? await authClient.signUp.email({
              name,
              email,
              password,
              callbackURL: window.location.origin,
            })
          : await authClient.signIn.email({
              email,
              password,
              callbackURL:
                deleteReauthCallback || window.location.origin,
            })

      if (error) {
        setErrorMessage(error.message || 'Unable to authenticate. Please try again.')
        return
      }

      if (isForgotPassword) {
        setSuccessMessage(
          'If an account exists for that email, a password reset link will be sent.',
        )
      } else if (isSigningUp) {
        setName('')
        setEmail('')
        setPassword('')
        setMode('sign-in')
        setSuccessMessage('Your account has been created. Please sign in.')
      } else {
        if (deleteReauthCallback) {
          window.location.assign(deleteReauthCallback)
          return
        }
        if (requiresOrderSignIn) {
          window.location.assign('/#menu')
          return
        }
        setSuccessMessage('You are now signed in.')
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to authenticate. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL:
          deleteReauthCallback ||
          (requiresOrderSignIn
            ? `${window.location.origin}/#menu`
            : window.location.origin),
        errorCallbackURL: deleteReauthUserId
          ? `${window.location.origin}/login?reauth-delete=${encodeURIComponent(deleteReauthUserId)}`
          : `${window.location.origin}/login`,
      })

      if (error) {
        setErrorMessage(error.message || 'Unable to sign in with Google.')
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to sign in with Google.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setErrorMessage('')
    setSuccessMessage('')
  }

  return (
    <section
      id="login"
      className="border-t border-line px-6 py-16"
      aria-labelledby="login-heading"
    >
      <div className="mx-auto grid max-w-[900px] overflow-hidden rounded-3xl border border-line bg-white shadow-[0_12px_36px_rgba(23,54,47,0.08)] md:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col justify-center bg-ink px-7 py-9 text-white sm:px-10">
          <p className="text-sm font-semibold tracking-[0.12em] text-highlight uppercase">
            Welcome to BrewHaus
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Good food brings us together.
          </h2>
          <p className="mt-4 leading-relaxed text-white/80">
            Sign in or create an account to make your next visit even more
            memorable.
          </p>
        </div>

        <div className="p-6 sm:p-9">
          <h2 id="login-heading" className="text-2xl font-bold">
            {isSigningUp
              ? 'Create your account'
              : isForgotPassword
                ? 'Reset your password'
                : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {isSigningUp
              ? 'Join us for something delicious.'
              : isForgotPassword
                ? 'Enter your email and we will send a reset link if an account exists.'
                : 'Sign in to your BrewHaus account.'}
          </p>
          {noticeMessage && (
            <p className="mt-3 text-sm font-medium text-accent" role="status">
              {noticeMessage}
            </p>
          )}

          {!isForgotPassword && (
            <div className="mt-6 grid grid-cols-2 rounded-full border border-line bg-bg p-1">
              <button
                type="button"
                aria-pressed={!isSigningUp}
                onClick={() => changeMode('sign-in')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  !isSigningUp
                    ? 'bg-accent text-white'
                    : 'text-ink-soft hover:text-accent'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-pressed={isSigningUp}
                onClick={() => changeMode('sign-up')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isSigningUp
                    ? 'bg-accent text-white'
                    : 'text-ink-soft hover:text-accent'
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          {!isForgotPassword && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-6 py-3 font-semibold text-ink transition-colors hover:bg-bg disabled:cursor-wait disabled:opacity-60"
              >
                <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.9 46.98 24.55Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.13 1.43-4.86 2.28-8.18 2.28-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                  />
                </svg>
                Continue with Google
              </button>
              <p className="my-4 text-center text-sm text-ink-soft">
                or continue with email
              </p>
            </>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isSigningUp && (
              <div>
                <label
                  htmlFor="login-name"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Your name
                </label>
                <input
                  id="login-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-semibold"
              >
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete={
                    isSigningUp ? 'new-password' : 'current-password'
                  }
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            )}

            {!isSigningUp && !isForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => changeMode('forgot-password')}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {errorMessage && (
              <p className="text-sm font-medium text-accent" role="alert">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-sm font-medium text-ink-soft" role="status">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-white transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting
                ? 'Please wait...'
                : isForgotPassword
                  ? 'Send reset link'
                  : isSigningUp
                    ? 'Create account'
                    : 'Sign in'}
            </button>
          </form>

          {isForgotPassword && (
            <button
              type="button"
              onClick={() => changeMode('sign-in')}
              className="mt-4 w-full text-center text-sm font-semibold text-accent hover:underline"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default Login