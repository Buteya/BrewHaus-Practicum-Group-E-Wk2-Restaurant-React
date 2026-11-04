import { useState } from 'react'
import { authClient } from '../lib/auth-client'

function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!token) {
      setErrorMessage('This reset link is invalid or has expired. Request a new one.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('The passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (error) {
        setErrorMessage(error.message || 'Unable to reset your password.')
        return
      }

      setPassword('')
      setConfirmPassword('')
      setSuccess(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to reset your password.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className="border-t border-line px-6 py-16"
      aria-labelledby="reset-password-heading"
    >
      <div className="mx-auto max-w-[520px] rounded-3xl border border-line bg-white p-6 shadow-[0_12px_36px_rgba(23,54,47,0.08)] sm:p-9">
        <h1 id="reset-password-heading" className="text-2xl font-bold">
          Reset your password
        </h1>
        {success ? (
          <>
            <p className="mt-3 text-sm text-ink-soft" role="status">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <a
              className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover"
              href="/login"
            >
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              Choose a new password with at least 8 characters.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              {errorMessage && (
                <p className="text-sm font-medium text-accent" role="alert">
                  {errorMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Please wait...' : 'Update password'}
              </button>
            </form>
            {!token && (
              <p className="mt-4 text-sm text-accent" role="alert">
                This reset link is invalid or has expired.{' '}
                <a className="font-semibold underline" href="/login">
                  Request another link.
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default ResetPassword
