# React + Vite

## Deploying on Vercel

Deploy this repository as one Vercel project with the Vercel project's Root
Directory set to the repository root. The root `vercel.json` defines the
`client` (Vite) and `server` (Express) services and routes `/api/*` to the
server, with all other requests going to the client.

Add these project environment variables in Vercel:

   - `DATABASE_URL`: the PostgreSQL connection string.
   - `BETTER_AUTH_SECRET`: a long, random secret.
   - `BETTER_AUTH_URL`: the public Vercel project URL, for example
     `https://brewhaus.vercel.app`.
   - `CLIENT_URL`: the exact public site origin, including `https://` and
     without a trailing slash. Set it to the deployed Vercel domain, for
     example `https://brew-haus-practicum-group-e-wk2-res.vercel.app`.
   - `STRIPE_SECRET_KEY`: the Stripe secret API key.
   - `STRIPE_WEBHOOK_SECRET`: the signing secret for the `/api/stripe/webhook`
     endpoint. Configure Stripe to send checkout completed, async payment
     succeeded/failed, and expired events to that URL.

The client uses same-origin `/api` requests, so no client API URL or
service-to-service binding is needed. The server connects directly to
PostgreSQL using `DATABASE_URL`. For local development, Vite proxies `/api` to
the Express server on port 3000. Better Auth trusts `CLIENT_URL` and, when
Vercel system environment variables are enabled, the exact production domain
from `VERCEL_PROJECT_PRODUCTION_URL`. Checkout return URLs use the requesting
site origin only when it matches one of those configured origins.

`POST /api/checkout` requires a signed-in session and accepts an `items` array
of `{ "menuId": "...", "quantity": 1 }` objects. The server reads prices from
the menu table, creates a pending order with item snapshots, and returns a
Stripe Checkout URL. Verified Stripe webhooks update order status after payment
or checkout expiration. When an authenticated owner checks a pending order, the
server also retrieves its Stripe Checkout Session and reconciles confirmed
payments or expired sessions.
Apply schema changes with
`npm --prefix .\server run db:push`.

After Checkout, Stripe redirects to `/checkout/success` with its checkout
session ID. The page polls the authenticated
`GET /api/orders/checkout/:sessionId` endpoint while a pending payment is
processing, confirms success only when that endpoint reports `paid`, and then
removes the purchased quantities from that user's local cart.

Signed-in users can open `/profile` from the navigation bar to see their
account details and order history. `GET /api/orders` returns orders and line
items scoped to the authenticated user. Pending checkouts can be rechecked
through `POST /api/orders/:orderId/confirm` or canceled through
`POST /api/orders/:orderId/cancel`; both actions verify the Stripe session, and
an order is only marked paid when Stripe confirms payment. Cancellation expires
an open checkout and is refused while payment is processing. The navigation
cart link appears only when the signed-in user's cart has items and shows its
total item quantity.

The reservation form submits requests to `POST /api/reservations` and stores
them in the `reservations` table. Requests are checked against the Nairobi
opening hours and returned as `requested`; the restaurant must confirm
availability before the booking is final. Apply the schema update with
`npm --prefix .\server run db:push`.

For local payment testing, use a Stripe test-mode secret key and run
`stripe listen --forward-to localhost:3000/api/stripe/webhook`. Set the
`whsec_...` signing secret printed by the CLI as `STRIPE_WEBHOOK_SECRET` in
`server/.env`, and make sure `CLIENT_URL` matches the browser origin. Use
`4242 4242 4242 4242` with any future expiry date and any CVC at Stripe
Checkout.

This template provides a minimal setup to get React working in Vite with HMR and ESLint.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Linting

Run `npm run lint` to check the project with ESLint.
