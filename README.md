# Brainwave Employee Portal

A single sign-in portal that gives employees access to the Zoho One applications their role allows,
without handing out Zoho credentials. Access is decided entirely by the portal's own role-based
access control; a single Zoho service account is used for every API call on the backend.

| Role    | Zoho application | What they see                         |
| ------- | ---------------- | ------------------------------------- |
| HR      | Zoho People      | Employee records                      |
| Sales   | Zoho CRM         | Leads                                 |
| Support | Zoho Desk        | Tickets                               |
| Finance | Zoho Books       | Invoices                              |
| Manager | (plus their functional role) | Own department's team and activity |
| Admin   | Everything       | Users, roles, permissions, audit log, Zoho connection |

## Stack

- **Frontend** `apps/web`: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend** `apps/api`: Node.js, Express 5, TypeScript, Prisma, PostgreSQL
- **Auth**: argon2id password hashing, short-lived JWT access token and rotating refresh token in
  httpOnly cookies, idle timeout, per-request permission checks
- **Zoho**: OAuth 2.0 authorization-code flow for one service account, refresh token encrypted at
  rest with AES-256-GCM, per-application API clients, mock mode for local development

## Quick start

Requirements: Node 20+, pnpm 9+, Docker (for PostgreSQL).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # then set JWT_SECRET and TOKEN_ENCRYPTION_KEY
cp apps/web/.env.example apps/web/.env

pnpm db:up          # starts PostgreSQL in Docker
pnpm db:migrate     # applies migrations
pnpm db:seed        # creates roles, permissions, departments and demo users
pnpm dev            # API on :4000, web on :3000
```

Generate the two secrets with:

```bash
openssl rand -base64 48   # JWT_SECRET
openssl rand -base64 32   # TOKEN_ENCRYPTION_KEY (must decode to exactly 32 bytes)
```

Open http://localhost:3000 and sign in with one of the demo accounts. The password for all of
them is `Password123!`.

| Email                   | Roles           | Department      |
| ----------------------- | --------------- | --------------- |
| admin@brainwave.dev     | Admin           |                 |
| manager@brainwave.dev   | Manager, Sales  | Sales           |
| hr@brainwave.dev        | HR              | Human Resources |
| sales@brainwave.dev     | Sales           | Sales           |
| support@brainwave.dev   | Support         | Support         |
| finance@brainwave.dev   | Finance         | Finance         |
| employee@brainwave.dev  | Employee        | Engineering     |

With `ZOHO_MOCK=true` (the default) the Zoho pages show fixture data so the portal works before a
Zoho account exists.

## Connecting a real Zoho One account

1. Sign up for a Zoho One trial and enable CRM, People, Desk and Books.
2. Go to the API console for your data centre (https://api-console.zoho.in for India,
   https://api-console.zoho.com for the US) and create a **Server-based Applications** client.
3. Set the authorized redirect URI to `http://localhost:4000/api/zoho/oauth/callback`
   (or `${API_URL}/api/zoho/oauth/callback` in other environments).
4. Put the client id and secret in `apps/api/.env`, set `ZOHO_REGION` to your data centre and
   `ZOHO_MOCK=false`, then restart the API.
5. Sign in as an admin, open **Admin → Integrations** and click **Connect Zoho**. Approve the
   consent screen with the Zoho account that owns the organisation.

A step-by-step walkthrough with troubleshooting is in [docs/zoho-setup.md](docs/zoho-setup.md).

The refresh token is stored encrypted in the `zoho_connections` table. Access tokens are refreshed
on demand and never sent to the browser. Employees only ever talk to the portal API.

## How access control works

- `permissions` is a fixed catalogue (for example `zoho:crm`, `users:write`, `audit:read`).
- A role is a named set of permissions; a user can hold several roles. Effective permissions are the
  union of all roles.
- Every API route declares the permission it needs through the `authorize()` middleware. Permissions
  are resolved from the database on each request, so a role change or deactivation applies
  immediately.
- The dashboard asks `GET /api/zoho/services`, which only returns the services the caller may use.
  Requesting data for any other service returns 403, even if the URL is guessed.
- Managers see `/team`, which is scoped to their own department on the server side.

## Security notes

- Passwords are hashed with argon2id. Login is rate limited and unknown emails take the same time
  as wrong passwords.
- The access token lives 15 minutes. The refresh token is an opaque random value stored as a SHA-256
  hash, rotated on every refresh and revoked on logout, password change, or deactivation. Sessions
  idle for more than 30 minutes cannot be refreshed.
- Cookies are `httpOnly`, `SameSite=Lax` and `Secure` in production. Mutating requests must be
  `application/json`, which combined with same-site cookies blocks cross-site form posts.
- In production the API redirects plain HTTP to HTTPS and sends HSTS; run it behind a TLS-terminating
  proxy that sets `X-Forwarded-Proto`.
- Every login attempt, session refresh, admin change and Zoho access is written to `audit_logs`.

## Project layout

```
apps/
  api/
    prisma/            schema, migrations, seed
    src/
      config/          environment validation, permission and audit catalogues
      lib/             prisma client, logger, errors, crypto, tokens, cookies
      middleware/      authenticate, authorize, security, error handler
      rbac/            permission resolution
      modules/         auth, users, roles, permissions, departments, audit, team, zoho
    tests/             unit tests (jest)
  web/
    src/app/           routes (login, dashboard, services, team, settings, admin/*)
    src/components/    layout, admin dialogs, shared UI
    src/lib/           api client, types, permission helpers
```

## Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `pnpm dev`        | Run API and web in watch mode                |
| `pnpm build`      | Build both apps                              |
| `pnpm test`       | Run API unit tests                           |
| `pnpm lint`       | Type-check the API and lint the web app      |
| `pnpm db:migrate` | Create/apply a migration in development      |
| `pnpm db:seed`    | Seed reference data and demo users           |
| `pnpm db:reset`   | Drop, recreate, migrate and seed the database|

## Deploying

Step-by-step instructions for Vercel (web) plus Render (API and PostgreSQL), or everything on Render,
are in [docs/deployment.md](docs/deployment.md). Set `DEMO_MODE=true` on a public demo: seeded accounts
and roles become undeletable, their passwords fixed, and the Zoho connection locked, while everything
else stays editable. Rate limits apply per IP, per login email, per user for Zoho calls and per admin
for changes.

## Running everything in Docker

```bash
docker compose --profile full up --build
```

This builds both images, runs migrations on start, and exposes the web app on port 3000. Seed the
database once with `docker compose exec api npx prisma db seed` or run `pnpm db:seed` from the host.
