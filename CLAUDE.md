# CLAUDE.md — Willful Clone (Canadian Legal Will Platform)

## 🧠 Project Overview

We are building a **Canadian online will & estate planning SaaS platform** — a clone of [willful.co](https://www.willful.co). The platform allows Canadians to create legally valid wills and power of attorney documents online without needing a lawyer.

This is a **full-stack SaaS product** with two sides:
- **B2C (Consumer):** Regular Canadians create their own legal documents
- **B2B (Professionals):** Financial advisors/banks invite their clients to use the platform

---

## 🛠️ Tech Stack

**Architecture:** A single **Next.js (App Router)** full-stack app — one repo, one language (TypeScript). The browser talks to **Supabase directly** for all wizard/CRUD data (RLS-protected). Next.js **route handlers** (`app/api/*`) exist only for trusted server work: PDF generation, the Stripe webhook, and email.

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) — frontend + backend in one app |
| Language | TypeScript everywhere |
| UI | React + Tailwind CSS + Shadcn UI |
| Server logic | Next.js route handlers + server actions |
| Database | Supabase (PostgreSQL) — accessed directly from the client via RLS |
| Auth | Supabase Auth (cookie sessions via `@supabase/ssr`) |
| File Storage | Supabase Storage (for generated PDFs) |
| PDF Generation | Puppeteer (headless Chrome) rendering HTML templates |
| Payments | Stripe (one-time payments) |
| Email | AWS SES (transactional emails) |
| Hosting | To be decided later (Vercel is the natural fit; skip setup for now) |
| CI/CD | GitHub Actions (later) |
| Live Chat | Crisp (later) |

> **Why this shape:** Supabase already provides Postgres + Auth + Storage + RLS, so a separate full backend API would duplicate it. Next.js gives us a thin trusted server only where we truly need one (PDF, Stripe, email), and Puppeteer keeps the whole stack in TypeScript while still producing high-fidelity print PDFs from our HTML templates.

---

## 📁 Project Structure

```
willful-clone/                # Single Next.js (App Router) app
├── app/
│   ├── (marketing)/          # Public: homepage, pricing, about, FAQ
│   ├── (auth)/               # login, signup, forgot-password, reset, verify-email
│   ├── (app)/                # Authenticated app (layout guards the session)
│   │   ├── dashboard/        # User dashboard
│   │   ├── will/             # Will wizard steps
│   │   ├── poa-health/       # POA Health wizard steps
│   │   ├── poa-property/     # POA Property wizard steps
│   │   ├── assets/           # Asset List wizard steps
│   │   └── payment/          # Payment & checkout
│   ├── api/                  # Route handlers — SERVER ONLY (trusted)
│   │   ├── pdf/              # Puppeteer: render HTML template → PDF
│   │   ├── stripe/webhook/   # Stripe webhook receiver
│   │   └── email/            # AWS SES sends
│   ├── layout.tsx
│   └── globals.css           # Tailwind directives only
│
├── components/
│   ├── ui/                   # Shadcn components
│   ├── forms/                # Form wizard components
│   └── layout/               # Navbar, Footer, Sidebar
│
├── lib/
│   ├── supabase/             # browser + server clients (@supabase/ssr)
│   ├── pdf/                  # Puppeteer launcher + render helpers
│   ├── stripe/               # Stripe client + helpers
│   └── email/                # SES client + senders
│
├── pdf-templates/            # HTML/CSS templates → rendered by Puppeteer
│   ├── will/                 # per-province variants
│   ├── poa-health/
│   ├── poa-property/
│   └── asset-list/
│
├── hooks/                    # Custom React hooks
├── store/                    # Zustand (auth + wizard UI state)
├── types/                    # TypeScript types (incl. generated Supabase types)
├── package.json
├── tailwind.config.ts
└── CLAUDE.md                 # This file
```

---

## 🗄️ Database Schema (Supabase / PostgreSQL)

All tables are already created in Supabase. Here is the full schema reference:

### `profiles` — User Info
```sql
id uuid (FK → auth.users)
email text
full_name text
phone text
date_of_birth date
province text  -- 'ON', 'BC', 'AB', 'MB', 'NB', 'NL', 'NS', 'PE', 'SK', 'QC'
city text
address text
postal_code text
plan text  -- 'none', 'essentials', 'premium', 'premium_x2'
plan_purchased_at timestamptz
partner_profile_id uuid  -- linked partner for premium_x2
created_at, updated_at timestamptz
```

### `provinces` — Reference Table (pre-seeded)
```sql
code text (PK)  -- 'ON', 'BC', etc.
name text
name_fr text
is_active boolean
supports_electronic_signing boolean  -- only BC = true
will_template_version text
poa_health_template_version text
poa_property_template_version text
```

### `documents` — Master Document Record
```sql
id uuid (PK)
user_id uuid (FK → profiles)
type text  -- 'will', 'poa_health', 'poa_property', 'asset_list'
province text (FK → provinces)
status text  -- 'draft', 'completed', 'paid', 'generated'
is_current boolean  -- true = latest version
version integer
pdf_url text  -- Supabase Storage URL
pdf_generated_at timestamptz
completed_at timestamptz
created_at, updated_at timestamptz
```

### `will_data` — Will Questionnaire Answers
```sql
id uuid (PK)
document_id uuid (FK → documents)
user_id uuid (FK → profiles)

-- Personal
full_legal_name, date_of_birth, province, city, marital_status

-- Executor + Backup Executor (first/last name, relationship, email, phone, city, province)

-- Beneficiaries (JSONB array)
-- [{ "name", "relationship", "percentage", "dob" }]

-- Children (JSONB array)
-- [{ "name", "dob", "is_minor" }]

-- Child Guardian + Backup Guardian

-- Pets (JSONB array)
-- [{ "name", "type", "breed" }]

-- Pet Guardian + pet_care_fund

-- Specific Gifts (JSONB array)
-- [{ "item", "recipient_name", "recipient_relationship" }]

-- Charitable Donations (JSONB array)
-- [{ "organization", "amount", "is_percentage" }]

-- Funeral wishes, business interests
-- current_step, total_steps, is_complete
```

### `poa_health_data` — POA Health Answers
```sql
id uuid, document_id, user_id
full_legal_name, date_of_birth, province
attorney (primary + backup): first/last name, relationship, phone, email, city, province
life_support_wishes  -- 'maintain', 'remove', 'attorney_decides'
organ_donation boolean
organ_donation_specifics, specific_organs
additional_health_wishes
activation_condition  -- 'incapacity_only', 'immediately'
current_step, total_steps, is_complete
```

### `poa_property_data` — POA Property Answers
```sql
id uuid, document_id, user_id
full_legal_name, date_of_birth, province
attorney (primary + backup): first/last name, relationship, phone, email, city, province
manage_bank_accounts, manage_real_estate, manage_investments, manage_taxes (booleans)
make_gifts boolean, gift_limit_per_year numeric
additional_powers, restrictions
activation_condition  -- 'incapacity_only', 'immediately'
requires_two_doctors_confirmation boolean
attorney_compensation  -- 'no_compensation', 'reasonable_compensation', 'specific_amount'
compensation_amount numeric
current_step, total_steps, is_complete
```

### `asset_list_data` — Asset List Answers
```sql
id uuid, document_id, user_id
properties (JSONB)    -- [{ address, city, province, ownership_type, estimated_value }]
vehicles (JSONB)      -- [{ make, model, year, vin }]
bank_accounts (JSONB) -- [{ bank_name, account_type, last_4_digits }]
investments (JSONB)   -- [{ institution, type, approximate_value }]
insurance_policies (JSONB) -- [{ provider, type, policy_number, beneficiary }]
digital_assets (JSONB)     -- [{ platform, type, notes }]
will_location, passport_location, sin_location
other_documents (JSONB)
lawyer_name/phone, accountant_name/phone, financial_advisor_name/phone
current_step, total_steps, is_complete
```

### `payments` — Stripe Records
```sql
id uuid, user_id
stripe_payment_intent_id text (unique)
stripe_customer_id text
plan text  -- 'essentials', 'premium', 'premium_x2'
amount numeric  -- in CAD
currency text  -- 'cad'
status text  -- 'pending', 'succeeded', 'failed', 'refunded'
refunded_at, refund_reason
created_at
```

### `email_logs` — Email Tracking
```sql
id uuid, user_id
email_type text  -- 'welcome', 'payment_confirmation', 'signing_instructions', 'reminder'
to_email, subject, status
sent_at
```

### `signing_instructions` — Signing Email Log
```sql
id uuid, document_id, user_id
province, document_type
emailed_at
```

---

## 📦 Pricing Plans

| Plan | Price (CAD) | Documents |
|---|---|---|
| `essentials` | $129 | 1x Will |
| `premium` | $199 | 1x Will + 1x POA Health + 1x POA Property + 1x Asset List |
| `premium_x2` | $349 | Everything in Premium × 2 adults |

All plans include:
- Free unlimited document updates for life
- Will registry access
- 30-day money-back guarantee

---

## 🌍 Provinces Supported

All 10 Canadian provinces:
`ON` `BC` `AB` `MB` `NB` `NL` `NS` `PE` `SK` `QC`

- Each province has its own legal document template
- BC is the only province that supports electronic signing
- Quebec has bilingual support (English + French)
- Province is detected at signup and routes to the correct template

---

## 📋 Document Types & What They Cover

### 1. Last Will & Testament (`will`)
- Executor + backup executor
- Beneficiaries with percentage splits
- Child guardians (for minor children)
- Pet guardians + care fund
- Specific gifts to specific people
- Charitable donations
- Funeral/burial preferences
- Business carry-on clause (auto-included)

### 2. Power of Attorney for Health (`poa_health`)
- Attorney who makes medical decisions if incapacitated
- Life support wishes
- Organ donation preferences
- Activation condition (immediately or only on incapacity)

### 3. Power of Attorney for Property (`poa_property`)
- Attorney who manages finances/property if incapacitated
- What powers they have (banking, real estate, investments, etc.)
- Compensation for attorney
- Activation condition

### 4. Asset List (`asset_list`)
- Not a legal document — a reference guide for family/executor
- Lists all properties, vehicles, bank accounts, investments, insurance, digital assets
- Important contacts (lawyer, accountant, financial advisor)
- Location of important documents

---

## 🔐 Authentication Flow

Using **Supabase Auth** with cookie-based sessions via `@supabase/ssr`:

1. User signs up with email + password
2. Supabase sends verification email
3. On verification, Supabase trigger auto-creates a `profiles` row
4. User logs in → Supabase session stored in cookies (readable by both client and server)
5. Client reads/writes data directly via the Supabase browser client — **RLS** enforces per-user access
6. Server route handlers (`app/api/*`) use the Supabase **server** client to confirm the session before any trusted op (PDF, webhook-adjacent reads, email)
7. Next.js middleware refreshes the session cookie and guards the `(app)` route group

> Plain CRUD does **not** go through a custom API — the browser hits Supabase directly and RLS is the authorization layer. Server code is only for things the client must not be trusted with.

**Auth pages to build:**
- `/signup` — Email + password registration + province selection
- `/login` — Email + password login
- `/forgot-password` — Send reset email
- `/reset-password` — Set new password (from email link)
- `/verify-email` — Email verification confirmation page

---

## 🧭 User Dashboard Flow

After login, user lands on `/dashboard`:

```
Dashboard
├── My Documents
│   ├── Will (draft / completed / paid)
│   ├── POA Health (locked if not premium)
│   ├── POA Property (locked if not premium)
│   └── Asset List (locked if not premium)
├── My Profile
├── Billing / Upgrade Plan
└── Signing Instructions (after payment)
```

Document statuses:
- `draft` → In progress, not paid
- `completed` → All questions answered, not paid
- `paid` → Payment successful, PDF available for download
- `generated` → PDF generated and stored in Supabase Storage

---

## 📝 Form Wizard Rules

The multi-step wizard is the **core of this product**. Key rules:

1. **Auto-save every step** — save to Supabase on "Next" click, never lose progress
2. **Conditional logic** — questions appear/disappear based on previous answers:
   - `has_children = false` → skip guardian questions
   - `has_pets = false` → skip pet guardian questions
   - `has_specific_gifts = false` → skip gift questions
   - `marital_status = 'single'` → modify beneficiary questions
3. **Resume anytime** — user can close browser and come back; always resume from last step
4. **Review screen** — show all answers in a summary before payment
5. **Province-aware** — some questions differ by province (e.g., Quebec has different terminology)
6. **Progress bar** — show current step / total steps at the top

---

## 💳 Payment Flow

1. User completes the questionnaire (status = `completed`)
2. User clicks "Download My Will" → redirected to payment page
3. Stripe Checkout opens (one-time payment)
4. On success → Stripe webhook hits the Next.js route handler `/api/stripe/webhook`
5. Handler verifies the signature, then updates `payments` table + `profiles.plan` (service-role client)
6. Handler triggers PDF generation via Puppeteer (`/api/pdf` or a shared lib call)
7. PDF stored in Supabase Storage
8. Email sent with signing instructions (SES, via `/api/email`)
9. User redirected to dashboard → download button appears

---

## 📧 Email Types to Build

| Email | Trigger |
|---|---|
| `welcome` | On signup |
| `payment_confirmation` | After successful payment |
| `signing_instructions` | After payment (province-specific instructions) |
| `document_updated` | When user updates + re-generates a document |
| `reminder` | 7 days after signup if no payment (drip campaign) |

---

## 🏢 B2B (Professionals) — Phase 5 Only

Skip this for now. Will be built in Phase 5. Separate subdomain: `pro.{domain}.com`

Features (future):
- Advisor dashboard
- Import clients via CSV
- Send invite emails to clients
- Track client progress
- Co-branded client experience
- Tiered B2B subscriptions

---

## 🚀 Development Phases

### ✅ Phase 1 — Foundation (Current Phase)
- [ ] Supabase project setup + schema (DONE)
- [ ] Django backend setup + connect Supabase
- [ ] React frontend setup + Tailwind + Shadcn UI
- [ ] Auth pages (signup, login, forgot password, email verify)
- [ ] User dashboard (basic layout)
- [ ] Province selection flow
- [ ] Basic routing & navigation

### 🔲 Phase 2 — Core Product
- [ ] Multi-step will wizard (all steps with conditional logic)
- [ ] POA Health wizard
- [ ] POA Property wizard
- [ ] Asset List wizard
- [ ] Auto-save progress
- [ ] Review screen
- [ ] WeasyPrint PDF generation
- [ ] Supabase Storage for PDFs

### 🔲 Phase 3 — Payments & Emails
- [ ] Stripe integration
- [ ] Payment page + checkout
- [ ] Stripe webhook handler
- [ ] PDF generation trigger post-payment
- [ ] AWS SES email integration
- [ ] All email templates
- [ ] Admin panel (basic)

### 🔲 Phase 4 — Marketing Site
- [ ] Homepage
- [ ] Pricing page
- [ ] About page
- [ ] Learn centre / blog
- [ ] Support / FAQ page
- [ ] Gift a plan
- [ ] SEO basics

### 🔲 Phase 5 — B2B & Expansion
- [ ] B2B landing page
- [ ] Pro dashboard
- [ ] Advisor client management
- [ ] Additional province template support
- [ ] Partner programs

---

## ⚙️ Environment Variables Needed

One `.env.local` for the whole app. **Rule:** anything prefixed `NEXT_PUBLIC_` is shipped to the browser — only safe, public values go there. Everything else is server-only and must never get that prefix.

```
# --- Public (exposed to the browser) ---
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# --- Server-only (NEVER prefix with NEXT_PUBLIC_) ---
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
AWS_SES_ACCESS_KEY=xxx
AWS_SES_SECRET_KEY=xxx
AWS_SES_REGION=ca-central-1
```

---

## 📌 Coding Conventions

### Next.js (server)
- Server logic lives in **route handlers** (`app/api/*`) and **server actions** — only for trusted work (PDF, Stripe webhook, email)
- **Never** write a CRUD endpoint that just proxies Supabase — the client talks to Supabase directly
- Use the **service-role** Supabase client only in server code; never expose it to the browser
- Always verify the Stripe webhook signature before acting on it
- Use `@supabase/ssr` for server + browser clients; refresh sessions in middleware
- Generate Supabase TypeScript types and keep them in `types/`

### React / Frontend
- TypeScript throughout — no `any` without a reason
- Use the **Next.js App Router** (server components by default; `"use client"` only when needed)
- Use Zustand for client UI state (auth snapshot, wizard step/progress)
- Use TanStack Query for client-side Supabase reads/mutations (cache + optimistic updates)
- Use Shadcn UI components for consistent design
- Use Tailwind CSS for all styling — no custom CSS files
- Form wizard state saved **directly to Supabase** on every "Next" click (RLS-protected)

### PDF (Puppeteer)
- Templates are HTML/CSS in `pdf-templates/`, one variant per province + doc type
- Use print CSS (`@page`, page breaks) for legal-document layout
- Reuse a single browser instance per invocation; render template → PDF buffer → upload to Supabase Storage
- For serverless hosting (Vercel), use `@sparticuz/chromium` + `puppeteer-core`

### General
- All monetary values stored in CAD dollars as `numeric` in DB
- All dates stored as ISO 8601 in DB
- JSONB arrays used for repeating items (beneficiaries, children, pets, etc.)
- Province always stored as 2-letter code (`ON`, `BC`, etc.)

---

## 🔗 Key External Services

| Service | Purpose | Docs |
|---|---|---|
| Supabase | DB + Auth + Storage | supabase.com/docs |
| Stripe | Payments | stripe.com/docs |
| Puppeteer | PDF generation (HTML → PDF) | pptr.dev |
| AWS SES | Transactional emails | aws.amazon.com/ses |
| Crisp | Live chat widget | crisp.chat |

---

## ⚠️ Important Legal Notes

- Willful is NOT a law firm — cannot give legal advice
- Documents must be **printed and physically signed** to be legally valid (except BC which allows electronic signing)
- Each will requires **2 adult witnesses** present at the same time
- Witnesses **cannot be beneficiaries**
- Templates are drafted by licensed Canadian estate lawyers per province
- Quebec has separate French and English templates
- Around **80–90% of Canadian estates** are simple enough for this platform
- Complex cases (Henson trusts, dual wills, disinheritance) are out of scope

---

## 🧪 Test Data

For development/testing:
- Test province: `ON` (Ontario)
- Test Stripe cards: `4242 4242 4242 4242` (success), `4000 0000 0000 9995` (decline)
- Test email: Use Supabase's built-in email for auth in development

---

*This file is the single source of truth for Claude Code. Always refer back to this before making architectural decisions.*
