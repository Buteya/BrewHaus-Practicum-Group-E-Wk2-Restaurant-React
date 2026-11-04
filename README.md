# BrewHaus Restaurant

BrewHaus is a restaurant website with a browsable food menu, customer accounts,
per-user carts, Stripe Checkout, order history, and a reservation-request form.
The project is a React/Vite client and an Express API backed by PostgreSQL.

## Features

- Restaurant landing page with Home, About, Menu, Reservation, and Contact
  sections.
- Menu items loaded from PostgreSQL, grouped by category, with item details,
  quantity selection, and add-to-cart/order-now actions. Menu details open in a
  full-screen view; Back to menu returns to the menu, and section navigation
  closes the detail view before opening the selected landing-page section.
- Email/password sign-up, sign-in, session handling, and sign-out using
  Better Auth.
- Google sign-in links to an existing account only when its verified Google
  email matches the account email.
- A cart stored in the signed-in user's browser storage under a user-specific
  key. Carts are separated by account in the same browser; cart contents are
  not synced across devices.
- Stripe Checkout sessions created by the server using prices read from the
  database. Order records and item snapshots are stored before redirecting to
  Stripe.
- Stripe webhook processing and server-side payment reconciliation. An order
  is only marked paid after Stripe confirms payment.
- Profile and order history, including pending-order actions to recheck payment
  or cancel an open, unpaid checkout.
- Reservation requests persisted in PostgreSQL and checked against the
  restaurant's Nairobi-time opening hours. A request is not a confirmed
  reservation; the restaurant must confirm availability.
- Responsive styling with Tailwind CSS.

## Technology

- Client: React, Vite, Tailwind CSS
- API: Node.js, Express 5
- Database and schema: PostgreSQL, Drizzle ORM and Drizzle Kit
- Authentication: Better Auth
- Payments: Stripe Checkout and webhooks
- Deployment: Vercel multi-service project

## Project layout

```text
client/
  src/components/    React page sections, account pages, menu, cart, and forms
  src/lib/           Auth client, cart storage, and formatting helpers
  src/App.jsx        Page routing and section navigation
server/
  src/routes/        Menu, checkout, orders, reservations, and Stripe webhook
  src/db/            Drizzle schema, database connection, and menu seed data
  src/auth.js        Better Auth server configuration
  src/index.js       Express app and API route registration
  .env.example       Local server environment variable template
vercel.json          Vercel client/server service and rewrite configuration
```

## Run locally

### Prerequisites

- Node.js 20.19 or newer (or 22.12 or newer) and npm. These versions satisfy
  Vite 8's runtime requirement.
- A PostgreSQL database. A hosted PostgreSQL provider works; local PostgreSQL
  is also supported.
- Stripe credentials to exercise checkout. Stripe CLI is optional for local
  webhook testing.

### Install dependencies

From the repository root:

```powershell
npm --prefix .\client install
npm --prefix .\server install
```

### Configure the server

Copy the example environment file, then set the values:

```powershell
Copy-Item .\server\.env.example .\server\.env
```

```dotenv
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173
PORT=3000
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
```

`DATABASE_URL`, `BETTER_AUTH_SECRET`, and `STRIPE_SECRET_KEY` must be set for
the corresponding features to work. Use a long, unique secret for
`BETTER_AUTH_SECRET`; for example, generate one with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

For testing reservations without payments, Stripe variables can be left unset.
The database URL must point to a PostgreSQL database that the server can reach.
Do not commit `.env` files or production credentials.

### Create the database schema and menu

From the repository root, push the Drizzle schema and seed the menu:

```powershell
npm --prefix .\server run db:push
npm --prefix .\server run db:seed
```

The seed operation can be run again safely; it updates menu entries by slug.
It seeds menu items and their primary images.

### Start the client and API

Run each command in its own terminal from the repository root:

```powershell
npm --prefix .\server run dev
```

```powershell
npm --prefix .\client run dev
```

Open `http://localhost:5173`. Vite serves the client and proxies `/api` requests
to the Express server at `http://localhost:3000`.
From any page, the header's Home, About, Menu, Reservation, and Contact links
navigate to those sections on the landing page. In the menu-detail view, these
links close the detail view before navigating.

## Application pages

| URL | Description |
| --- | --- |
| `/` | Restaurant landing page and menu |
| `/#hero`, `/#about`, `/#menu`, `/#reservation`, `/#contact` | Landing-page sections; header links also navigate here from other pages and close menu details |
| `/login` | Sign in or create an account |
| `/cart` | The signed-in user's cart and checkout action |
| `/profile` | Account details and order history |
| `/checkout/success?session_id=...` | Verifies the returned Stripe session and shows order status |
| `/checkout/cancelled` | Returns to the landing page after a canceled Stripe Checkout |

## API reference

All API routes use the same origin under `/api`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Basic API health check |
| `GET` | `/api/menu` | Public | List menu items and images |
| `GET` | `/api/menu/:slug` | Public | Get a menu item by slug |
| `GET/POST` | `/api/auth/*` | Public/session | Better Auth sign-up, sign-in, session, and sign-out endpoints |
| `POST` | `/api/checkout` | Signed in | Create a Stripe Checkout session and pending order |
| `GET` | `/api/orders` | Signed in | List the current user's orders and item snapshots |
| `GET` | `/api/orders/checkout/:sessionId` | Signed in | Verify/reconcile a Checkout session belonging to the current user |
| `POST` | `/api/orders/:orderId/confirm` | Signed in, order owner | Recheck Stripe payment and reconcile the pending order |
| `POST` | `/api/orders/:orderId/cancel` | Signed in, order owner | Expire an open unpaid Checkout session |
| `POST` | `/api/reservations` | Public | Validate and save a reservation request |
| `POST` | `/api/stripe/webhook` | Stripe signature | Process supported Checkout payment events |

Checkout accepts menu IDs and quantities; the server validates them and reads
item names, prices, and currencies from the database. It does not trust prices
sent by the browser. Order APIs are scoped to the authenticated user. Canceling
a pending order only expires an open session; the API does not cancel paid
orders and will not mark an unverified payment as paid.

The reservation API accepts a name, email, phone, date, time, party size, and
optional notes. It accepts future times during these restaurant hours
(`Africa/Nairobi`):

- Monday-Thursday: 11:00-22:00
- Friday-Saturday: 11:00-23:00
- Sunday: 12:00-21:00

## Database

Drizzle defines the following PostgreSQL tables:

- Better Auth: `user`, `session`, `account`, `verification`
- Restaurant: `menu`, `menu_image`
- Commerce: `orders`, `orderitems`
- Reservations: `reservations`

Use `npm --prefix .\server run db:push` after schema changes. The seed data is
defined in `server/src/db/menu.data.js` and loaded with
`npm --prefix .\server run db:seed`.

## Stripe testing

Use Stripe test-mode credentials locally; never use live credentials for
development tests.

1. Set `STRIPE_SECRET_KEY` to a Stripe test secret key in `server/.env`.
2. Start the server and client.
3. If testing webhook delivery, start Stripe CLI:

   ```powershell
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the `whsec_...` signing secret printed by Stripe CLI into
   `STRIPE_WEBHOOK_SECRET`, then restart the server.
5. Sign in, add an item, and complete a test Checkout using Stripe's documented
   test payment details.

Stripe redirects to `/checkout/success`. That page verifies the Checkout
session with the authenticated API; the cart is updated only after payment is
confirmed. Webhooks handle completed/paid, asynchronous payment success or
failure, and expired sessions. Order history can also reconcile a pending
session directly with Stripe.

## Checks

Run the client ESLint check and production build:

```powershell
npm --prefix .\client run lint
npm --prefix .\client run build
```

There is no automated test script currently configured. The server source uses
ES modules and can be syntax-checked with Node, for example:

```powershell
node --check .\server\src\index.js
```

## Deploy to Vercel

Deploy the repository as one Vercel project:

1. Set the Vercel **Root Directory** to the repository root (`.`).
2. Keep the root `vercel.json`; it defines the Vite client and Express server,
   routes `/api/*` to the server, and sends other paths to the client service.
   The client service rewrite serves its SPA entry point for direct page loads.
3. Add these environment variables to the Vercel project:

   - `DATABASE_URL`: production PostgreSQL connection string.
   - `BETTER_AUTH_SECRET`: long, private random secret.
   - `BETTER_AUTH_URL`: public site origin, including `https://`.
   - `CLIENT_URL`: exact public site origin, including `https://` and without a
     trailing slash.
   - `STRIPE_SECRET_KEY`: Stripe secret key for the chosen mode.
   - `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret.

4. Enable Vercel system environment variables so the API can trust the exact
   production hostname from `VERCEL_PROJECT_PRODUCTION_URL`. Better Auth and
   Checkout also trust only configured site origins.
5. Configure a Stripe webhook to call
   `https://YOUR_DOMAIN/api/stripe/webhook` for:
   `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, and
   `checkout.session.expired`.
6. Apply the database schema and seed menu data against the production
   database as appropriate for the release:

   ```powershell
   npm --prefix .\server run db:push
   npm --prefix .\server run db:seed
   ```

`CLIENT_URL` and `BETTER_AUTH_URL` should be the browser-facing production
domain, not the server service URL. The checkout return URL is based on the
requesting site only when that origin is configured/trusted. After deployment,
check `/api/health`, `/login`, and `/profile` for successful responses.

## Operational notes

- Carts use browser `localStorage`; clearing browser data removes the saved
  cart. Orders and reservation requests are persisted in PostgreSQL.
- Reservations are requests only. This project does not include staff
  availability management, automatic reservation confirmation, or a staff
  notification workflow.
- Order history is customer-facing. The project does not currently include an
  administrative order dashboard.
- Menu images reference remote image URLs defined in the seed data.
