# Convenient Budgeter

A mobile-first, installable **Progressive Web App** for tracking daily expenses with clean, interactive visualizations.

Built with Next.js (App Router) + TypeScript, Tailwind CSS, Supabase (Postgres + Auth + Row Level Security), and Recharts.

## Features (v1)

- Email + password authentication (Supabase Auth)
- Fast mobile expense entry with category chips, remembered category, and a floating add button
- Add / edit / delete / repeat expenses (amount, category, date, note)
- Manage categories (name + color), with sensible defaults seeded on sign-up
- Daily, weekly, and monthly total-spending budgets with graphical remaining-budget progress
- Dashboard: budget progress, monthly total, daily average, spending-over-time area chart, spend-by-category donut, and recent activity
- Month-by-month navigation, search, and category filters for expense history
- Installable to an iPhone / Android home screen (standalone PWA)

> AI features (natural-language expense entry, receipt parsing) are intentionally deferred to a later update.

## Tech stack

| Component       | Technology                                  |
| --------------- | ------------------------------------------- |
| Framework       | Next.js 15 (App Router, TypeScript)         |
| Styling & UI    | Tailwind CSS + shadcn-style components       |
| Charts          | Recharts                                    |
| Database / Auth | Supabase (Postgres, Auth, RLS)              |
| PWA             | `@ducanh2912/next-pwa` + Web App Manifest   |
| Deployment      | Vercel                                       |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In the SQL Editor, run the migrations in order:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) creates the `profiles`, `categories`, and `transactions` tables, enables Row Level Security, and adds a trigger that seeds a profile + default categories for every new user.
   - [`supabase/migrations/0002_budgets.sql`](supabase/migrations/0002_budgets.sql) creates daily, weekly, and monthly total-spending budgets with Row Level Security.
3. (Optional, recommended for local testing) In **Authentication → Providers → Email**, you can turn off "Confirm email" so new sign-ups get an immediate session.

### 3. Configure environment variables

Copy the example file and fill in your project's API credentials (Supabase dashboard → **Project Settings → API**):

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`; create an account to get started.

> The PWA service worker is disabled in development and only active in production builds.

## Project structure

```
app/
  (auth)/            Login & signup (route group, public)
    actions.ts       Server actions: login / signup / signOut
  (app)/             Authenticated app (route group)
    dashboard/       Charts + summary
    budgets/         Daily, weekly, and monthly budget settings
    transactions/    Expense list + CRUD server actions
    categories/      Category management + CRUD server actions
  layout.tsx         Root layout + metadata
  manifest.ts        Web App Manifest (display: standalone)
components/
  ui/                shadcn-style primitives (button, input, card, modal, ...)
  charts/            Recharts chart components
lib/
  supabase/          Browser, server, and middleware Supabase clients
  types.ts           Domain types
middleware.ts        Session refresh + route protection
supabase/migrations/ SQL schema + RLS policies
scripts/             PWA icon generator
```

## Regenerating PWA icons

Icons live in `public/icons/`. To regenerate them (solid-green app icon, no image dependencies required):

```bash
node scripts/generate-icons.mjs
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in **Project Settings → Environment Variables**.
4. In Supabase **Authentication → URL Configuration**, set the **Site URL** to your Vercel domain so email/redirect links resolve correctly.
5. Deploy. Vercel builds the production bundle and the service worker automatically.

## Installing on a phone (PWA)

**iPhone (Safari):** open the deployed site → tap the **Share** button → **Add to Home Screen**. The `display: standalone` manifest hides the browser chrome so it behaves like a native app.

**Android (Chrome):** open the site → menu → **Install app** / **Add to Home screen**.

## Roadmap / deferred

- AI: natural-language entry ("spent 15 bucks on chipotle") and receipt parsing via the Vercel AI SDK
- Budget alerts and notifications
- Recurring transactions, multi-currency, CSV export
- OAuth providers (Google / Apple) — add via the Supabase dashboard
