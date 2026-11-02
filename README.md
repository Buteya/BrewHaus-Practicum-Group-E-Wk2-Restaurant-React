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
   - `CLIENT_URL`: the same public Vercel project URL.

The client uses same-origin `/api` requests, so no client API URL or
service-to-service binding is needed. The server connects directly to
PostgreSQL using `DATABASE_URL`. For local development, Vite proxies `/api` to
the Express server on port 3000.

This template provides a minimal setup to get React working in Vite with HMR and ESLint.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Linting

Run `npm run lint` to check the project with ESLint.
