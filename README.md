# OwnWill

A Canadian estate-planning web app. Users complete a guided wizard, OwnWill
generates a printable will (and optional POA/asset list), payment is collected
through Stripe, and the finished PDFs are emailed via AWS SES.

Stack: Next.js (App Router) · React · TypeScript · Supabase (auth, Postgres,
storage) · Stripe (checkout + webhooks) · AWS SES · Puppeteer
(`puppeteer-core` + `@sparticuz/chromium` on serverless) · Zustand · zod.

---

## Prerequisites

- **Node.js 20+** and **npm 10+** (`node --version`).
- A **Supabase project** (free tier is fine).
- A **Stripe account** in test mode.
- An **AWS account** with **SES** out of the sandbox in the region you intend
  to send from (default: `ca-central-1`).
- For local PDF rendering: **Google Chrome** installed in the default location,
  or `PUPPETEER_EXECUTABLE_PATH` pointing at any Chromium binary.

---

## Environment variables

Copy [.env.example](./.env.example) to `.env.local` and fill in:

| Variable                              | Where to get it                                                | Notes                                                  |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`            | Supabase → Project settings → API                              | Shipped to the browser.                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Supabase → Project settings → API                              | Shipped to the browser.                                |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | Stripe → Developers → API keys                                 | `pk_test_…` in dev.                                    |
| `SUPABASE_SERVICE_ROLE_KEY`           | Supabase → Project settings → API                              | **Server-only.** Never expose to the browser.          |
| `STRIPE_SECRET_KEY`                   | Stripe → Developers → API keys                                 | `sk_test_…` in dev.                                    |
| `STRIPE_WEBHOOK_SECRET`               | `stripe listen --forward-to localhost:3000/api/stripe/webhook` | Print on first run; copy the `whsec_…` value.          |
| `AWS_SES_ACCESS_KEY`                  | AWS IAM user with `ses:SendEmail` permission                   | —                                                      |
| `AWS_SES_SECRET_KEY`                  | Same IAM user                                                  | —                                                      |
| `AWS_SES_REGION`                      | SES region                                                     | Default `ca-central-1`.                                |
| `SES_FROM_EMAIL`                      | Verified SES identity (`OwnWill <noreply@example.ca>`)         | Must be verified in SES; sandbox-restricted otherwise. |
| `PUPPETEER_EXECUTABLE_PATH` *(opt.)*  | Path to a Chromium binary                                      | Local-only override; serverless uses `@sparticuz/chromium`. |

`NEXT_PUBLIC_` prefixed values are bundled into the client — keep secrets
without it.

---

## Supabase

1. Create a project at <https://supabase.com>.
2. Open **SQL editor** → paste the contents of [supabase/schema.sql](./supabase/schema.sql)
   → Run. This creates tables, indexes, storage buckets, and RLS policies in
   one shot.
3. **Authentication → URL configuration**:
   - Site URL: `http://localhost:3000` (dev) / your production domain.
   - Redirect URLs: add `http://localhost:3000/auth/callback` and the prod
     equivalent.
4. **Authentication → Providers**: enable Email (magic link) and any social
   providers you want.

Useful checks once the schema is loaded:

- `profiles`, `documents`, `will_data`, `email_logs` exist.
- RLS is **enabled** on each (Supabase shows a green shield).
- Storage bucket `documents` exists and is private.

---

## Stripe

1. Create products + prices in test mode for each plan
   (`essentials`, `premium`, `premium_x2`).
2. Map the Stripe price IDs in [lib/stripe/plans.ts](./lib/stripe/plans.ts).
3. Install the Stripe CLI: <https://stripe.com/docs/stripe-cli>.
4. Forward webhooks locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
5. Trigger a test event:

   ```bash
   stripe trigger checkout.session.completed
   ```

---

## AWS SES

1. **Verify a sending domain** (preferred) or single sender address in the
   region matching `AWS_SES_REGION`.
2. **Request production access** to leave the SES sandbox — without this, SES
   will only send to other verified addresses.
3. Create an IAM user with a policy granting `ses:SendEmail` and
   `ses:SendRawEmail`. Use those credentials for `AWS_SES_ACCESS_KEY` /
   `AWS_SES_SECRET_KEY`.
4. Set `SES_FROM_EMAIL` to a string SES will accept, e.g.
   `OwnWill <noreply@yourdomain.ca>`.

---

## Local development

```bash
npm install
cp .env.example .env.local        # then fill in values
npm run dev                       # http://localhost:3000
```

In separate terminals, you'll typically want:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Useful scripts:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run analyze     # build with @next/bundle-analyzer
```

---

## Production deployment

OwnWill is built to run on Vercel (serverless), but any Node 20+ host works.

1. Push the repository to GitHub.
2. Import the project into Vercel (or your host of choice).
3. Add **all** environment variables from `.env.example` in the Vercel
   dashboard (Production + Preview).
4. Confirm the SES sender domain is verified in the production AWS account.
5. In Stripe, replace test keys with **live** keys and create a webhook
   endpoint at `https://yourdomain.com/api/stripe/webhook`. Copy that webhook
   signing secret into `STRIPE_WEBHOOK_SECRET`.
6. In Supabase, add the production domain to **Site URL** and **Redirect
   URLs**.
7. Deploy. The first request can take a few extra seconds while
   `@sparticuz/chromium` initialises in the PDF route.

Notes:

- PDF rendering on serverless requires the `@sparticuz/chromium` package
  (already a dependency). It will not work on edge runtimes — keep the PDF
  route on the Node.js runtime.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`) are configured in [next.config.ts](./next.config.ts).
