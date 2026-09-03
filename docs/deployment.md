# Deploying Brainwave

Recommended layout: the **web app on Vercel**, the **API and PostgreSQL on Render**. A second option
runs everything on Render. Both give you HTTPS out of the box.

```
browser ──HTTPS──▶ Vercel (Next.js)  ──rewrite /api/* ──▶ Render (Express API) ──▶ Render PostgreSQL
                                                                 └──────────────▶ Zoho APIs
```

The browser only ever talks to the Vercel domain. Next.js rewrites `/api/*` to the Render URL on the
server side, so cookies stay first-party and there is no CORS in the browser.

## Before you start

- Push the repository to GitHub (already done).
- Decide the demo password. The seed uses `Password123!` unless `SEED_PASSWORD` is set when seeding.
- Have the Zoho client id and secret ready. You will add a second redirect URI to that client.

## Option A: Vercel + Render

### 1. PostgreSQL on Render

1. Render dashboard → **New → PostgreSQL**.
2. Name `brainwave-db`, region closest to you (Singapore for India), plan Free.
3. After it is created, open it and copy the **Internal Database URL** (for the API service) and the
   **External Database URL** (for seeding from your machine).

Free Postgres on Render is deleted after 30 days unless upgraded. Note the date.

### 2. API on Render

1. **New → Web Service** → connect the GitHub repo.
2. Settings:
   - Name: `brainwave-api`
   - Region: same as the database
   - Runtime: **Docker**
   - Dockerfile path: `apps/api/Dockerfile`
   - Docker build context: `.` (repository root)
   - Instance type: Free (spins down after inactivity; first request takes ~30 s)
3. Environment variables (Environment tab):

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | the **Internal** database URL from step 1 |
   | `JWT_SECRET` | `openssl rand -base64 48` |
   | `TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` |
   | `WEB_URL` | your Vercel URL, e.g. `https://brainwave-portal.vercel.app` (fill after step 3, then redeploy) |
   | `API_URL` | this service's URL, e.g. `https://brainwave-api.onrender.com` |
   | `TRUST_PROXY` | `2` (Vercel rewrite in front of Render's proxy) |
   | `DEMO_MODE` | `true` |
   | `ZOHO_REGION` | `in` |
   | `ZOHO_CLIENT_ID` | from the Zoho API console |
   | `ZOHO_CLIENT_SECRET` | from the Zoho API console |
   | `ZOHO_MOCK` | `false` |
   | `ZOHO_CACHE_TTL_SECONDS` | `60` |
   | `LOG_LEVEL` | `info` |

   Use new secrets for production; do not reuse the ones from `.env`.

4. Click **Create Web Service**. The container runs `prisma migrate deploy` on start, so the tables
   are created automatically. Check `https://brainwave-api.onrender.com/api/health` returns `{"status":"ok"}`.

### 3. Seed the production database

From your machine, using the **External** database URL:

```bash
cd apps/api
DATABASE_URL='postgresql://…external…' SEED_PASSWORD='ChooseADemoPassword1' pnpm db:seed
```

The seed is idempotent; rerun it any time to restore the demo accounts and roles.

### 4. Web on Vercel

1. Vercel dashboard → **Add New → Project** → import the GitHub repo.
2. Settings:
   - Framework preset: Next.js
   - Root Directory: `apps/web`
   - Build and install commands: leave the defaults (Vercel detects pnpm from the lockfile)
3. Environment variable: `API_URL` = `https://brainwave-api.onrender.com`
4. Deploy. Note the production URL (for example `https://brainwave-portal.vercel.app`).
5. Go back to Render → brainwave-api → Environment → set `WEB_URL` to that URL → **Save** (Render redeploys).

### 5. Zoho for production

1. Zoho API console → your client → **Client Details** → add a second Authorized Redirect URI:
   `https://brainwave-api.onrender.com/api/zoho/oauth/callback`
2. Open the deployed portal, sign in as admin, **Administration → Integrations → Connect Zoho**, accept.
3. Because `DEMO_MODE=true`, that connection can no longer be removed or replaced from the UI. To
   change it, temporarily set `DEMO_MODE=false` on Render, reconnect, set it back.

### 6. Check

- Sign in as finance; the Books page shows live invoices.
- Sign in as admin; try to delete `hr@brainwave.dev`: the API answers 403 "Demo accounts cannot be deleted".
- Nine wrong passwords for one account in 15 minutes returns 429.

## Option B: everything on Render

Same as above for the database and API. For the web app:

1. **New → Web Service**, Runtime **Docker**, Dockerfile path `apps/web/Dockerfile`, context `.`.
2. Environment: `API_URL` = the API's **internal** hostname if both are in the same region
   (`http://brainwave-api:4000`) or its public URL.
3. On the API set `WEB_URL` to the web service's public URL and `TRUST_PROXY=1`.

Render's `render.yaml` blueprint can describe all three services; the manual steps above are
equivalent.

## What DEMO_MODE changes

| Action | Normal | Demo mode |
| --- | --- | --- |
| Delete, deactivate, re-role or reset the password of a seeded account | allowed for admins | 403 |
| Seeded user changes their own password | allowed | 403 |
| Delete a seeded role (hr, sales, support, finance) | allowed | 403 |
| Disconnect Zoho or start a new OAuth flow while connected | allowed | 403 |
| Create new users and roles, edit permissions, view everything | allowed | allowed |

Combined with the rate limits below, a visitor with the public demo credentials cannot lock anyone
out, break the Zoho connection, or exhaust the Zoho API quota.

## Rate limits

| Scope | Limit |
| --- | --- |
| Whole API, per IP | 240 requests / minute |
| Login, per IP | 20 attempts / 15 min |
| Login, per email (failures only) | 8 attempts / 15 min |
| Session refresh, per IP | 60 / 15 min |
| Zoho records and launch, per user | 30 / minute, plus a 60 s server-side cache per service |
| User and role changes, per admin | 60 / 15 min |

`TRUST_PROXY` must equal the number of proxies in front of the API, otherwise every visitor shares
one IP bucket (too low) or clients can spoof their address (too high).

## Resetting the demo

```bash
DATABASE_URL='postgresql://…external…' pnpm --filter @brainwave/api db:seed
```

restores the seeded accounts and roles without touching audit logs or the Zoho connection. To wipe
everything, run `prisma migrate reset` against the external URL and reconnect Zoho.

## Custom domain and cookies

If you attach a custom domain to Vercel, set `WEB_URL` on Render to that domain. Cookies are set by
the API on the response that passes through the Vercel rewrite, so they belong to your domain and
need no extra configuration.
