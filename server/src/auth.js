import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { sql } from 'drizzle-orm'
import { db } from './db/index.js'
import { ensureAccountDeletionSchema } from './db/ensure-account-deletion-schema.js'
import {
  account,
  reservations,
  session,
  user,
  verification,
} from './db/schema.js'

const trustedOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
].filter(Boolean)

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[character]
  })
}

async function sendResendEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    throw new Error(
      'Password reset email requires RESEND_API_KEY and RESEND_FROM_EMAIL.',
    )
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  })

  if (!response.ok) {
    throw new Error(`Resend rejected the email (${response.status}).`)
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const safeUrl = escapeHtml(url)
      await sendResendEmail({
        to: user.email,
        subject: 'Reset your BrewHaus password',
        text: `Use this link to reset your BrewHaus password: ${url}`,
        html: `<p>We received a request to reset your BrewHaus password.</p><p><a href="${safeUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      })
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (accountToDelete) => {
        await ensureAccountDeletionSchema()
        await db
          .delete(reservations)
          .where(
            sql`lower(${reservations.email}) = lower(${accountToDelete.email})`,
          )
      },
    },
  },
  account: {
    accountLinking: {
      trustedProviders: ['google'],
      requireLocalEmailVerified: false,
    },
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  trustedOrigins,
})
