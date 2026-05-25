# DESIGN.md — Willful Clone Design System & Spec

> **Scope:** Customer-facing (B2C) experience **+ Login/Signup only**.
> Excludes B2B/Pro and Admin surfaces.
>
> **Direction (locked):** Warm & approachable palette (deep teal + warm coral on
> cream) · Inter all-sans · Balanced ~10px corners · Light **and** dark themes.
>
> This doc is the single source of truth for visual design. Token names map 1:1
> to the shadcn/Tailwind CSS variables already in `app/globals.css`, so design →
> code handoff is direct.

---

## 0. Brand foundations

**Personality:** Trustworthy, calm, human, plain-spoken. We make an intimidating
task (writing a will) feel safe and doable. Credible like a good advisor — not
cold like a bank, not cute like a toy.

**Voice & tone**
- Plain language, short sentences. No legalese in the UI; explain terms inline.
- Reassuring and warm ("You're almost done", "We saved your progress").
- Canadian spelling (honour, organize→organize is fine, "centre", "cheque").
- Never alarmist. Death/incapacity framed gently ("if you're ever unable to…").
- Always show the legal disclaimer where relevant, but quietly (caption style).

**Logo / wordmark (to design)**
- Wordmark set in **Inter SemiBold**, tracking `-0.01em`.
- Optional mark conveying protection/legacy: a soft **shield**, **leaf**, or
  **checkmark-in-circle**. Single-color, works at 24px.
- Deliver: full-color, mono-dark, mono-light (reverse), and icon-only (square).

---

## 1. Color system

All values are hex; paste directly into the CSS variables (Tailwind v4 accepts
hex in `@theme`/`:root`). Brand scales come first, then the **semantic token
map** that the app actually consumes.

### 1.1 Brand scales

**Teal — primary (trust, calm, the "brand")**
| Token | Hex | Use |
|---|---|---|
| teal-50 | `#F0FAF9` | tint backgrounds |
| teal-100 | `#E0F4F2` | hover tints, info bg |
| teal-200 | `#BFEAE6` | borders on tinted areas |
| teal-300 | `#8FD9D3` | dark-mode accents |
| teal-400 | `#4FC2BA` | dark-mode primary |
| teal-500 | `#1FA89F` | highlights |
| teal-600 | `#178A83` | hover for primary (light) |
| teal-700 | `#126B66` | pressed |
| **teal-800** | **`#0E4C49`** | **primary** |
| teal-900 | `#0A3633` | deep headings on tint |

**Coral — accent (warmth, energy, highlights — NOT primary CTAs)**
| Token | Hex | Use |
|---|---|---|
| coral-50 | `#FFF4F2` | accent tint bg |
| coral-100 | `#FFE8E4` | badges, highlight bg |
| coral-200 | `#FFD2CC` | borders |
| coral-300 | `#FFB0A7` | illustration |
| coral-400 | `#FF8B7E` | dark-mode accent |
| **coral-500** | **`#FF6B5C`** | **accent fills, illustration, progress** |
| coral-600 | `#E85847` | accent hover |
| coral-700 | `#C7483B` | **coral text on light** (AA-safe) |

> ⚠️ **Coral is an accent, not a button color.** Coral on white fails text
> contrast. Primary CTAs use **teal**. Use coral for: small highlights, the
> progress bar, badges (with coral-700 text on coral-100), illustrations,
> underline-on-hover, "new" pills. For coral *text*, use `coral-700`.

**Warm neutrals (slightly warm-tinted grays — the "cream" family)**
| Token | Hex | Use |
|---|---|---|
| sand-0 | `#FFFFFF` | cards (light) |
| sand-50 | `#FBF7F0` | page background (light) |
| sand-100 | `#F5EFE4` | muted surface |
| sand-200 | `#ECE4D6` | hover surface |
| sand-300 | `#E0D6C5` | borders/dividers |
| sand-400 | `#C9BCA6` | disabled border |
| ink-500 | `#7A847F` | placeholder |
| ink-600 | `#5C6764` | muted/secondary text (AA on cream) |
| ink-700 | `#3A4543` | secondary headings |
| ink-800 | `#1C2B2A` | **body text** (pine) |
| ink-900 | `#14201F` | max-contrast headings |

### 1.2 Semantic colors

| Role | Light | Dark | Text-on |
|---|---|---|---|
| Success | `#2E7D5B` (bg `#E6F4EC`) | `#4ECB8E` (bg `#10231B`) | white / `#06140E` |
| Warning | `#B7791F` (bg `#FBF1DC`) | `#E2B53D` (bg `#241B07`) | `#3A2A06` / `#241B07` |
| Error/Destructive | `#C0392B` (bg `#FBEAE8`) | `#E5534B` (bg `#2A100E`) | white / `#1A0807` |
| Info | `#178A83` (bg `#E0F4F2`) | `#4FC2BA` (bg `#0A2422`) | white / `#06201E` |

### 1.3 Semantic token map → CSS variables

These are the names the app uses (shadcn). **Light / Dark.**

| Variable | Light | Dark | Notes |
|---|---|---|---|
| `--background` | `#FBF7F0` | `#0E1A19` | page |
| `--foreground` | `#1C2B2A` | `#E8EFEC` | body text |
| `--card` | `#FFFFFF` | `#14201F` | |
| `--card-foreground` | `#1C2B2A` | `#E8EFEC` | |
| `--popover` | `#FFFFFF` | `#14201F` | |
| `--popover-foreground` | `#1C2B2A` | `#E8EFEC` | |
| `--primary` | `#0E4C49` | `#2FB8AD` | teal; CTA fills |
| `--primary-foreground` | `#FFFFFF` | `#06201E` | |
| `--secondary` | `#F0E9DD` | `#1E2C2A` | secondary buttons/surfaces |
| `--secondary-foreground` | `#1C2B2A` | `#E8EFEC` | |
| `--muted` | `#F5EFE4` | `#1A2725` | muted surfaces |
| `--muted-foreground` | `#5C6764` | `#9DACA8` | captions, hints |
| `--accent` | `#F0E9DD` | `#1E2C2A` | **subtle hover bg** (UI, not brand) |
| `--accent-foreground` | `#1C2B2A` | `#E8EFEC` | |
| `--destructive` | `#C0392B` | `#E5534B` | |
| `--destructive-foreground` | `#FFFFFF` | `#1A0807` | |
| `--border` | `#E0D6C5` | `#2A3937` | |
| `--input` | `#E0D6C5` | `#324340` | control borders |
| `--ring` | `#0E4C49` | `#2FB8AD` | focus ring (use at 50% alpha) |
| `--cta` *(new)* | `#FF6B5C` | `#FF7E70` | **coral accent** (custom token) |
| `--cta-foreground` *(new)* | `#3A0E08` | `#2A0A05` | text on coral fills |
| `--chart-1..5` | teal `#0E4C49`, coral `#FF6B5C`, amber `#B7791F`, sage `#5C8A6E`, slate `#5C6764` | lightened equivalents | asset-list/data viz |

**Usage rules**
- **Primary action** → `--primary` (teal) fill, white text.
- **Coral** → highlights/accents only (`--cta`); never body text; badge text uses `coral-700`.
- Page is **cream** (`--background`); content sits on **white cards** (`--card`).
- Borders are warm (`--border`), never pure gray.
- Min contrast: text **4.5:1**, large text/UI **3:1** (all tokens above pass).

---

## 2. Typography

**Family:** `Inter` (Google Fonts). Load weights **400, 500, 600, 700**.
Fallback: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
Display sizes use `Inter` with tighter tracking (no separate display font).

**Type scale** (rem @ 16px base)

| Token | Size | Line | Weight | Tracking | Use |
|---|---|---|---|---|---|
| display | 56px / 3.5rem | 1.05 | 700 | -0.02em | hero H1 (desktop) |
| h1 | 40px / 2.5rem | 1.1 | 700 | -0.02em | page titles |
| h2 | 32px / 2rem | 1.15 | 700 | -0.01em | section headings |
| h3 | 24px / 1.5rem | 1.25 | 600 | -0.01em | card/sub headings |
| h4 | 20px / 1.25rem | 1.3 | 600 | 0 | step titles |
| h5 | 18px | 1.4 | 600 | 0 | small headings |
| body-lg | 18px | 1.6 | 400 | 0 | lead paragraphs |
| body | 16px | 1.6 | 400 | 0 | **base** |
| body-sm | 14px | 1.5 | 400 | 0 | secondary, hints |
| caption | 13px | 1.4 | 500 | 0.01em | meta, disclaimers |
| overline | 12px | 1.3 | 600 | 0.06em UPPERCASE | eyebrows/labels |
| button | 15px | 1 | 600 | 0 | button label |

**Responsive:** scale display/h1/h2 down on mobile — display→34px, h1→28px,
h2→24px. Use fluid `clamp()` if comfortable.

**Rules**
- Body copy max line length **~68ch** (use `max-w-prose`).
- Headings in `--foreground`; supporting text in `--muted-foreground`.
- Never set body below 14px. Links: teal, underline on hover (coral underline ok).

---

## 3. Spacing, layout & grid

**Spacing scale (4px base)** — use Tailwind steps: `0, 1=4, 2=8, 3=12, 4=16,
5=20, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80, 24=96, 32=128`.

**Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

**Containers / max-widths**
| Context | Max width | Notes |
|---|---|---|
| Marketing content | `1120px` | centered, `px-6` gutters |
| Wizard / forms | `640px` (`max-w-2xl`) | single column, focus |
| Auth cards | `400px` (`max-w-sm`) | centered vertically |
| App pages (logged-in) | **full width** (app shell) | sidebar 256px + fluid main; inner form width ~640px, rails ~320px |
| Reading (blog) | `680px` | comfortable prose |

**Section rhythm (marketing):** vertical padding `py-20` desktop / `py-12`
mobile. Hero `py-24`. Cards gap `gap-4`/`gap-6`.

**Grid:** 12-col on desktop for marketing; forms are single-column; dashboard
doc cards 2-col (`sm:grid-cols-2`).

---

## 4. Radius, elevation, borders, motion

**Radius (balanced):** base `--radius = 10px`.
`sm 6 · md 8 · lg 10 · xl 14 · 2xl 20 · pill 9999`.
Buttons/inputs `lg (10)`; cards `xl (14)`; modals `2xl (20)`; badges `pill`.

**Elevation (soft, warm shadows)** — shadow color `rgba(20,32,31,…)`:
| Token | Value |
|---|---|
| shadow-xs | `0 1px 2px rgba(20,32,31,.04)` |
| shadow-sm | `0 1px 3px rgba(20,32,31,.06), 0 1px 2px rgba(20,32,31,.04)` |
| shadow-md | `0 4px 14px rgba(20,32,31,.08)` |
| shadow-lg | `0 14px 36px rgba(20,32,31,.10)` |
| focus-ring | `0 0 0 3px rgba(14,76,73,.45)` (teal 45%) |

Prefer **border + shadow-sm** for cards; reserve shadow-lg for popovers/modals.
Dark mode: shadows are subtle; rely more on `--border` + slightly lighter `--card`.

**Borders:** 1px `--border`. Inputs get a 1px `--input` border; focus swaps to
`--ring` + focus-ring.

**Motion** (see also "interaction" per component)
- Durations: micro **120ms**, default **180ms**, enter **240ms**, overlay **280ms**.
- Easing: enter/user-initiated `cubic-bezier(0.16,1,0.3,1)` (ease-out emphasized);
  standard `cubic-bezier(0.4,0,0.2,1)`.
- **Animate only `transform`/`opacity`.** Never `transition: all`.
- Hover lifts: `translateY(-1px)` + shadow step up. Press: `translateY(0)`.
- **Respect `prefers-reduced-motion`** — drop transforms, keep opacity ≤120ms.

---

## 5. Iconography & imagery

- **Icons:** `lucide-react`. Stroke `1.75`, sizes `16 / 20 / 24`. Inherit text
  color (`currentColor`). Use for inline meaning and buttons; never decorative-only.
- **Illustration style:** soft, rounded, flat with subtle grain; teal + coral +
  cream palette. Friendly humans, families, pets, home — warm not corporate.
  Used on: hero, empty states, auth side panel, "how it works", success screens.
- **Photography (optional):** natural light, real Canadian families, candid.
  Warm grade. Never stocky/handshake-y.
- **Spot graphics:** each document type gets a simple icon-illustration (Will,
  POA Health, POA Property, Asset List) used on dashboard cards.

---

## 6. Components (full library)

Each spec lists **variants · sizes · states · interaction**. Build these as a
Figma component library with variants. (★ = already exists in code.)

### 6.1 Button ★ (`components/ui/button.tsx`, Base UI)
- **Variants:** `primary` (teal fill/white), `secondary` (sand fill), `outline`
  (border + transparent), `ghost` (transparent, hover `--accent`), `cta` (coral
  fill `--cta`, dark text — use sparingly for marketing hero), `destructive`,
  `link` (teal text underline).
- **Sizes:** `sm 32h / px-3`, `default 40h / px-4`, `lg 44h / px-5`, `icon 40²`.
  (Heights are min touch-friendly; mobile primary actions ≥44h.)
- **States:** default, hover (bg darken one step + `translateY(-1px)`), active
  (`translateY(0)`), focus-visible (focus-ring), disabled (50% opacity, no shadow),
  loading (spinner + label e.g. "Saving…", keep width).
- Radius `lg`. Label `button` type style. Icon gap `8px`.

### 6.2 Inputs ★ (`Input`, `NativeSelect`, `Textarea`)
- Height 40 (textarea min 96). Radius `lg`. Border `--input`, bg `--card`
  (light) / transparent (dark). Placeholder `ink-500`.
- **States:** focus (border `--ring` + focus-ring), error (border `--destructive`
  + helper text destructive), disabled (muted bg, 50%).
- Label above (see Field). Optional leading icon (20px, `ink-500`).
- Select: native chevron tinted `ink-600`.

### 6.3 Field ★ (`components/forms/will/field.tsx`)
- Stack: **Label** (body-sm, 500, `--foreground`) → control → **hint/error**
  (caption; hint `--muted-foreground`, error `--destructive`).
- Required marker: subtle `*` in `--muted-foreground` (not red).
- Spacing: label→control `6px`, control→hint `6px`.

### 6.4 Checkbox / Radio
- 18px box, radius `sm` (checkbox) / pill (radio). Checked = teal fill, white
  check. Focus-ring. 8px gap to label. (Add via shadcn when needed.)

### 6.5 YesNo toggle ★ (`components/forms/will/yes-no.tsx`)
- Two segmented buttons. Selected = `primary`, unselected = `outline`.
- Consider a unified **segmented control** look (shared track, pill thumb) as a
  later polish. Min height 36–40.

### 6.6 Card ★
- bg `--card`, border `--border`, radius `xl`, shadow-sm, padding `24`.
- **Interactive card** (dashboard doc): hover border `--ring`/30 + shadow-md +
  `translateY(-2px)`, cursor pointer, 180ms.
- Subcomponents: Header (title h3/h4 + description `--muted-foreground`),
  Content, Footer (actions, `gap-3`).

### 6.7 Badge / Pill
- Pill radius, `caption` 600, `px-2.5 py-0.5`.
- **Status variants** (document status):
  - `draft` → sand bg `--muted`, text `ink-700`
  - `completed` → info: teal-100 bg, teal-900 text
  - `paid` → success: `#E6F4EC` bg, `#1E5C42` text
  - `generated` → success solid
  - `locked` → outline + lock icon, `ink-500`
- `accent`/"new" → coral-100 bg, coral-700 text.

### 6.8 Progress bar (wizard) ★ (in `will-wizard.tsx`)
- Track: `--muted`, height `8px`, radius pill.
- Fill: **teal** (or coral for warmth — choose teal for trust), radius pill,
  width % animated 240ms ease-out.
- Above it: "Step X of N" (body-sm, `--muted-foreground`) + "NN%".

### 6.9 Stepper (optional richer wizard nav)
- Horizontal on desktop, condensed on mobile (just the bar). Steps: done
  (teal check), current (teal ring), upcoming (`ink-500`). Clickable to revisit
  completed steps.

### 6.10 Toast ★ (Sonner, `components/ui/sonner.tsx`)
- bottom-right (desktop), top (mobile). Card style: `--popover`, border,
  shadow-lg, radius `lg`. Success = teal/green icon; error = destructive icon.
  Enter: slide+fade 240ms ease-out. Auto-dismiss 4s; errors 6s.

### 6.11 Dialog / Modal
- Overlay `rgba(20,32,31,.45)` + backdrop-blur(2px). Panel `--popover`, radius
  `2xl`, shadow-lg, `max-w-md`, padding `24`. Enter: opacity + scale `0.97→1`
  240ms. Close X top-right (ghost icon). Focus-trapped.

### 6.12 Tooltip
- `--foreground` bg / `--background` text? Better: dark pill (`ink-900` bg,
  `sand-50` text), caption, radius `md`, 8px padding, 120ms fade. For inline
  legal-term explanations.

### 6.13 Accordion (FAQ)
- Row: title (h5) + chevron; expand 200ms (height/opacity). Divider `--border`.
  Used on FAQ/Support and pricing.

### 6.14 Alert / Callout
- Left accent border (4px) in semantic color + tinted bg + icon. Variants:
  info (teal), success, warning, error. Used for save confirmations, legal
  notices, plan limits.

### 6.15 Navbar — marketing
- Height 64–72. Left: logo. Center/right: links (How it works, Pricing, Learn,
  Support) + **Log in** (ghost/link) + **Get started** (primary).
- Transparent over hero → solid `--card`/blur on scroll (border-bottom appears).
- Mobile: hamburger → full-screen sheet, links stacked, CTA pinned bottom.

### 6.16 App shell — **left sidebar + full width** (logged-in pages)

The logged-in experience is a **full-page app shell**, not a centered column.
Layout = fixed sidebar + fluid main that fills the rest of the viewport.

**Sidebar (left, persistent)**
- Width **256px** desktop; collapsible to a **64px icon rail**; on mobile it's a
  slide-over drawer (hamburger in the slim topbar opens it; scrim behind).
- bg `--card` (or `--muted` for subtle separation), `border-right --border`,
  full height, its own scroll.
- **Top:** logo (leaf + "OwnWill") → `/dashboard`.
- **Nav items** (icon 20 + label, `body-sm` 500): Dashboard · My Documents ·
  Profile · Billing · Support. Active = teal-tint pill (`--accent`/teal-50) +
  teal text + 3px left accent bar. Hover = `--accent`. Icon-rail shows tooltips.
- **Plan badge** ("Essentials") under the logo or above the footer.
- **Footer (bottom):** avatar + email (truncate) → menu (Account, Sign out) +
  **theme toggle**.

**Topbar (within main, slim ~56–60px)**
- Left: current page title / breadcrumb (+ hamburger on mobile).
- Right: contextual — e.g. wizard "Saved ✓" status, plan badge, help. Keep light;
  identity lives in the sidebar.
- Border-bottom `--border`; sticky.

**Main**
- Fills remaining width. Padding `px-8 py-8` (lg) / `px-4 py-6` (mobile).
- **No outer max-width** — pages fill the canvas. Readability is protected by
  *inner* widths (forms ~`640px`) and **multi-pane layouts + side rails**, never
  by stretching inputs/text edge-to-edge.

**Responsive:** `lg` sidebar 256 · `md` icon-rail 64 (optional) · `sm` drawer.

> Replaces the old centered `max-w-4xl` app pages. `sign-out-button.tsx` moves
> into the sidebar footer menu.

### 6.17 Footer — **light (card)**
- bg `--card` with a 1px top `--border` (airy, blends with the warm page).
  Columns: Product, Learn, Company, Legal. Muted links (`--muted-foreground`),
  hover → `--foreground` with coral underline. Bottom row: logo, copyright,
  province note, social, the "not a law firm" disclaimer (caption). Newsletter
  input optional (Field + primary button).

### 6.18 Pricing card
- 3 cards (Essentials / Premium / Premium ×2). Premium = **highlighted**
  (teal border 2px + "Most popular" coral pill, subtle shadow-md, slight scale).
  Contents: name, price (h2) + "CAD one-time", feature list (check icons teal),
  CTA (primary), fine print. Equal heights, align CTAs to bottom.

### 6.19 Empty state
- Centered: spot illustration (160–200px) + h4 + body-sm `--muted-foreground` +
  primary CTA. Used: dashboard before first doc, empty asset list, etc.

### 6.20 Skeleton / loading
- `--muted` blocks, radius matching content, subtle shimmer (opacity pulse
  1.4s, reduced-motion → static). Use for dashboard cards & wizard load
  (replaces the current "Loading your will…" text).

### 6.21 Avatar
- Circle, initials on teal-100/teal-900 text, sizes 28/32/40. Image optional.

### 6.22 Banner (global)
- Full-width strip (e.g., "30-day money-back guarantee" / promo). Dismissible.
  Teal-50 bg, teal-900 text, or coral for promos.

---

## 7. Page specs (B2C + Auth)

For each page: **layout, sections, components, states, responsive.** Design
desktop + mobile for all. All pages share Navbar/App-header + Footer as noted.

### 7.A Marketing

**A1 · Homepage `/`** ★ (stub exists)
- **Hero:** eyebrow (overline), display H1, lead body-lg, primary CTA + secondary
  ("See how it works"), trust line ("Wills from $129 · 30-day guarantee"),
  hero illustration. Trust strip below: logos/press, star rating, "X wills
  created".
- **Value props** (3–4 cards w/ icons): Lawyer-approved, 20 minutes, Update free
  for life, All 10 provinces.
- **How it works** (3 steps with numbers + illustration).
- **Document types** (Will, POA Health, POA Property, Asset List) — 4 cards.
- **Pricing teaser** (link to /pricing) or compact plan cards.
- **Testimonials** (carousel or grid), **FAQ** (accordion, top 5), **final CTA**
  band (teal-900 reverse section + coral accent), **Footer**.

**A2 · Pricing `/pricing`**
- Heading + subhead. 3 **pricing cards** (Premium highlighted). Comparison table
  (features × plans, check/dash). Money-back + "update free for life" callout.
  FAQ accordion. Final CTA.

**A3 · How it works `/how-it-works`**
- Step-by-step with alternating illustration/text rows. Time estimate, what
  you'll need, legal validity explainer (witness/printing). CTA.

**A4 · About `/about`** — mission, "not a law firm" transparency, team
(optional), values. Warm imagery.

**A5 · Learn / Blog `/learn`** — index (card grid w/ category chips, search) +
**post** template (680px prose, headings, callouts, related posts, CTA).

**A6 · Support / FAQ `/support`** — search, category accordions, contact card
(Crisp chat entry), links to Learn.

**A7 · Gift a plan `/gift`** — explainer + simple form (recipient, plan, message)
→ checkout. (Customer-facing gifting only.)

**A8 · Legal pages** `/privacy`, `/terms`, `/legal-disclaimer` — prose template,
last-updated caption, TOC for long pages.

**A9 · 404 / error** — friendly illustration, message, back-home CTA.

### 7.B Auth (light, focused — **in scope**)

Shared: centered card (`max-w-sm`) on cream, logo above, optional warm
illustration side-panel on `lg` (split layout: left brand panel teal gradient +
illustration + 1-line testimonial; right form).

**B1 · Login `/login`** ★ — email, password, "Forgot password?" link, primary
"Log in", divider, link to Signup. Error toast on failure. Loading state on
button. (Form already wrapped in Suspense for `redirectTo`.)

**B2 · Signup `/signup`** ★ — full legal name, email, password (min 8, strength
hint), **province select** (all 10), primary "Create account", link to Login,
fine print (terms/privacy). **Success state:** "Check your email" panel with
illustration. Province choice sets the document template downstream.

**B3 · Forgot password `/forgot-password`** ★ (route exists) — email field →
"Send reset link" → confirmation panel.

**B4 · Reset password `/reset-password`** — new password + confirm, strength,
submit → success → redirect to login.

**B5 · Verify email `/verify-email`** — confirmation/illustration, resend link,
auto-continue to dashboard when verified.

### 7.C App (customer) — **full-width app shell** (§6.16)

All pages render **inside the sidebar shell** and fill the canvas. Forms keep a
comfortable inner width; empty space is filled with **useful side rails**, not
stretched inputs.

**C1 · Dashboard `/dashboard`** ★ — fills width.
- **Welcome band** (full width): greeting (h1) + "Pick up where you left off…",
  with an optional right-aligned **plan/summary card** or upgrade CTA.
- **My Documents** — responsive grid, **`xl:grid-cols-3` / `md:2` / `1`**. Cards:
  spot icon, title, blurb, **status badge** (top-right), progress (if in
  progress), primary action ("Continue"/"Start"/"Download"); **locked** = lock +
  "Upgrade" for non-premium docs.
- **Account** — full-width row of wide cards/list items: Profile · Billing ·
  Signing instructions (post-payment).
- Empty first-time state; plan/upgrade banner if `none`.

**C2 · Wizard (Will / POA Health / POA Property / Asset List)** ★ — **two-pane,
full width.**
- **Left (primary, max ~`680px`):** step card — title (h3/h4) + description +
  fields; **conditional sections** (e.g. guardian only if minor child);
  **RepeatableList** for repeating items; sticky bottom **Back / Next-Finish** nav.
- **Right rail (sticky, ~`320px`):** vertical **stepper** (all steps, done/
  current/upcoming, click to revisit completed) · **autosave status**
  ("Saved · just now ✓") · **contextual help / legal tip** for the step · chat link.
- **Mobile:** rail collapses → horizontal **progress bar** at top + a "Steps"
  expander; nav becomes a sticky bottom bar.
- **Resume** to last step automatically. States: loading (skeleton on both panes),
  error (callout), saving (button spinner + rail status).

**C3 · Review screen** ★ — **two-pane, full width.**
- **Left:** grouped summary cards (About you, Executor, Beneficiaries, …) with a
  per-line **Edit** link that jumps to that step.
- **Right rail (sticky):** **order/plan card** — selected plan, price (CAD,
  one-time), "what's included", legal note (witness/printing/BC e-sign), primary
  **Continue to payment** + "Back to wizard".

**C4 · Payment / Checkout `/payment`** ★ — **full-bleed split.**
- **One side = brand/trust panel** (teal bg, leaf, "Secured by Stripe", 30-day
  guarantee, what you get, short testimonial), edge-to-edge.
- **Other side =** plan selector (3 chips) + Stripe card form + **order summary**
  (line items, total). Pay button. Success → redirect; failure → inline error.
- **Mobile:** stack — trust panel becomes a compact banner above the form.

**C5 · Profile / Account** — full width; form (name, dob, province, address) in a
~640px column + **right rail** (account context / linked-partner for
`premium_x2`). Save → toast.

**C6 · Billing / Upgrade** — full width; left = current plan + invoices/receipts
list; **right rail** = upgrade CTA → plan comparison (reuse pricing cards) +
money-back info.

**C7 · Signing instructions** (post-payment) — full width; left = province-
specific **checklist** (print, 2 witnesses, who can't witness, BC e-sign note);
**right rail** = per-document **download** buttons + "email me these instructions".

**C8 · Document download / view** — PDF-ready state: preview/summary (left) +
**download + "what's next" + re-generate after edits** (right rail).

---

## 8. Accessibility

- Contrast: text ≥ **4.5:1**, large/UI ≥ **3:1** (palette verified).
- Every input has a `<label>`; errors announced (aria-live) + not color-only
  (icon + text).
- Focus-visible ring on all interactive elements (never remove outline w/o
  replacement).
- Touch targets ≥ **44×44** for primary mobile actions.
- Honor `prefers-reduced-motion` (drop transforms).
- Keyboard: full nav, focus-trap modals, `Esc` closes, logical tab order.
- Don't rely on coral/teal alone to convey meaning (pair with text/icon).

---

## 9. Token & asset deliverables (what to create)

**Design tokens** (export as both):
- `tokens.json` (style-dictionary-ish: color/space/radius/type/shadow/motion).
- A `:root` + `.dark` CSS block matching §1.3 + §4 (drop into `app/globals.css`).

**Figma file structure**
1. **Cover** — brand summary, version.
2. **Foundations** — color styles (all tokens, light+dark), type styles, spacing,
   radius, elevation, motion notes, iconography, illustration samples.
3. **Components** — library w/ variants for every item in §6 (all states).
4. **Patterns** — forms, wizard step, repeatable list, empty/loading/error,
   nav/header/footer, pricing.
5. **Pages — Marketing** (§7.A) desktop + mobile.
6. **Pages — Auth** (§7.B) desktop + mobile, incl. split-panel.
7. **Pages — App** (§7.C) desktop + mobile, incl. all doc statuses & wizard steps.

**Brand assets**
- Logo set (full-color, mono-dark, reverse, icon-only) — SVG.
- Favicon (16/32/180 apple-touch) + maskable PWA icon.
- OG/social share images (1200×630) for home, pricing, blog template.
- Icon usage sheet (lucide subset list).
- Illustration set: hero, 3× how-it-works, 4× document spot icons, 4× empty
  states, auth side-panel, success/confirmation, 404.

**Hand-off notes**
- Provide redlines/specs auto via Figma Dev Mode.
- Name layers/components to match code (`Button/primary/lg`, `Card/interactive`,
  `Field`, `YesNo`, `ProgressBar`, `StatusBadge/paid`).
- Export illustrations as SVG (or optimized PNG @2x where complex).

---

## 10. Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Palette | **Warm & approachable** — teal `#0E4C49` + coral `#FF6B5C` on cream `#FBF7F0` |
| 2 | Typography | **Inter** all-sans (400/500/600/700) |
| 3 | Shape | **Balanced** — base radius **10px** |
| 4 | Theme | **Light + dark** (both token sets in §1.3) |
| 5 | Scope | **B2C customer + Login/Signup** (no B2B/Pro, no admin) |
| 6 | Logo | **Create new from spec** (§0 direction): Inter SemiBold wordmark + soft shield/leaf/check mark; deliver full-color, mono-dark, reverse, icon-only |
| 7 | Illustrations | **Custom set** (bespoke, brand-exact) — see list in §9 |
| 8 | Marketing depth | **All marketing pages** (full §7.A), desktop + mobile |
| 9 | Footer | **Light (card)** variant (§6.17) |
| 10 | Progress-bar fill | **Teal** (trust) |
| 11 | Internal (logged-in) pages | **Full-width app shell** — left sidebar 256px + fluid main; multi-pane layouts w/ side rails (§6.16, §7.C). Replaces centered `max-w-4xl`. |

*Last updated: 2026-05-25.*
