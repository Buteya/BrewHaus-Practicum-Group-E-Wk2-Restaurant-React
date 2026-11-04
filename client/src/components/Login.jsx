import { useState } from 'react'
import { authClient } from '../lib/auth-client'

function Login() {
  const [mode, setMode] = useState('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSigningUp = mode === 'sign-up'

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const { error } = isSigningUp
        ? await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: window.location.origin,
          })
        : await authClient.signIn.email({
            email,
            password,
            callbackURL: window.location.origin,
          })

      if (error) {
        setErrorMessage(error.message || 'Unable to authenticate. Please try again.')
        return
      }

      if (isSigningUp) {
        setName('')
        setEmail('')
        setPassword('')
        setMode('sign-in')
        setSuccessMessage('Your account has been created. Please sign in.')
      } else {
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
            {isSigningUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {isSigningUp
              ? 'Join us for something delicious.'
              : 'Sign in to your BrewHaus account.'}
          </p>

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
                autoComplete={isSigningUp ? 'new-password' : 'current-password'}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

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
                : isSigningUp
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Login