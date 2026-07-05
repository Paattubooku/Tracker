# Trackr — Personal Water & Expense Tracker

## Complete Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack & Why](#tech-stack--why)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Core Modules](#core-modules)
6. [Data Flow](#data-flow)
7. [Supabase Integration](#supabase-integration)
8. [API Reference (DataContext)](#api-reference-datacontext)
9. [Database Schema](#database-schema)
10. [Scriptable iPhone Widgets](#scriptable-iphone-widgets)
11. [Theming](#theming)
12. [Configuration](#configuration)
13. [Deploying to Vercel (Step-by-Step)](#deploying-to-vercel-step-by-step)

---

## Overview

Trackr is a personal, single-user web application for tracking daily water intake and expenses (debit only). It features a clean, dark-first dashboard UI with glassmorphism cards, smooth charts, quick-add actions, history tables, goal progress rings, and budget tracking. The app is designed to work offline with local data and can optionally connect to Supabase for persistent cloud storage and real-time sync.

**Key Design Decisions:**
- **No authentication** — This is a personal tool, not a multi-user SaaS. All data belongs to one user.
- **Debit-only expenses** — Tracks money spent, not income. No "need vs want" categorization.
- **Dark-first design** — The dark theme is the primary experience with rich gradients, glow effects, and glassmorphism.
- **Offline-first** — Works fully without Supabase using local React state with mock data. Supabase is an optional upgrade for persistence.

---

## Tech Stack & Why

| Technology | Version | Why It's Used |
|-----------|---------|---------------|
| **React** | 19.x | Industry-standard UI library. Component-based architecture makes it easy to build modular, reusable UI pieces. Hooks provide clean state management. |
| **TypeScript** | 5.9 | Static type checking catches bugs at compile time. Makes the codebase self-documenting and safer to refactor. |
| **Vite** | 7.x | Blazing fast dev server (HMR in <50ms) and optimized production builds. Replaces Webpack with native ES modules. |
| **Tailwind CSS** | 4.x | Utility-first CSS framework. Eliminates custom CSS files, provides consistent design tokens, and makes responsive design trivial. |
| **Recharts** | 2.x | React-native charting library built on D3. Declarative API, responsive containers, and beautiful defaults. Used for area charts, bar charts, and pie charts. |
| **Lucide React** | latest | Clean, consistent icon set. Tree-shakeable so only used icons are bundled. MIT licensed. |
| **Supabase** | 2.x (JS client) | Open-source Firebase alternative. Provides PostgreSQL database, REST API (PostgREST), and real-time subscriptions. Chosen over Firebase because: (1) SQL is more powerful than NoSQL for analytics queries, (2) Row Level Security is built-in, (3) Real-time subscriptions use WebSockets efficiently, (4) No vendor lock-in — it's just Postgres. |

**Why NOT other options:**
- *Firebase/Firestore*: NoSQL makes aggregation queries (category breakdown, weekly sums) complex and expensive.
- *MongoDB Atlas*: Overkill for this scale, and aggregation pipelines are harder than SQL.
- *Chart.js*: Imperative API requires manual DOM manipulation. Recharts is declarative and React-native.
- *Material UI*: Too opinionated. Hard to achieve custom glassmorphism and gradient effects. Tailwind gives full control.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Theme    │  │   Data   │  │    Supabase   │  │
│  │  Context  │  │  Context │  │    Client     │  │
│  │          │  │          │  │               │  │
│  │ isDark   │  │ entries  │◄─┤  .from()      │  │
│  │ toggle() │  │ goals    │  │  .insert()    │  │
│  │          │  │ settings │  │  .delete()    │  │
│  └──────────┘  │ addX()   │  │  .channel()   │  │
│                │ delX()   │  │               │  │
│                └────┬─────┘  └───────┬───────┘  │
│                     │                │           │
│                     │  Optimistic    │  Realtime │
│                     │  Updates       │  Sync     │
│                     │                │           │
│  ┌──────────────────▼────────────────▼────────┐  │
│  │              React Components               │  │
│  │                                             │  │
│  │  Dashboard │ Water │ Expenses │ Settings    │  │
│  │  Layout    │ Tracker│ Tracker │             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
                        │
                        │  HTTPS / WebSocket
                        ▼
              ┌───────────────────┐
              │     Supabase      │
              │                   │
              │  PostgreSQL DB    │
              │  PostgREST API    │
              │  Realtime Server  │
              │  RLS Policies     │
              └───────────────────┘
```

**Key Architectural Patterns:**

1. **Context + Provider Pattern** — Theme and Data are provided via React Context, making them accessible anywhere without prop drilling.

2. **Optimistic Updates** — When you add a water entry, the UI updates instantly with a temporary ID. The Supabase insert happens in the background. If it fails, the entry is rolled back locally.

3. **Real-time Subscriptions** — When Supabase is configured, the app subscribes to `INSERT` and `DELETE` events on both `water_entries` and `expense_entries` tables. This means if you add an entry from another device (or the Scriptable widget), it appears instantly.

4. **Graceful Degradation** — If Supabase is not configured (no env vars), the app works entirely with local React state and mock data. All CRUD operations still function; they just don't persist to the cloud.

5. **Single-User Design** — No auth, no user IDs in queries. The Supabase schema uses RLS policies that allow all operations (since there's only one user). The `user_settings` table has a single row with `id = 1`.

---

## Project Structure

```
trackr/
├── public/                          # Static assets
├── scriptable/
│   ├── water-widget.js              # iPhone Scriptable widget (water)
│   └── expense-widget.js            # iPhone Scriptable widget (expenses)
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx            # Overview page with summary cards & charts
│   │   ├── ExpenseTracker.tsx       # Full expense tracking module
│   │   ├── Layout.tsx               # Sidebar + mobile nav + theme toggle
│   │   ├── Settings.tsx             # All app settings
│   │   └── WaterTracker.tsx         # Full water tracking module
│   ├── contexts/
│   │   ├── DataContext.tsx           # All data state + Supabase CRUD + computed values
│   │   └── ThemeContext.tsx          # Dark/light theme with localStorage persistence
│   ├── lib/
│   │   └── supabase.ts              # Supabase client initialization
│   ├── utils/
│   │   └── cn.ts                    # Class name utility (clsx + tailwind-merge)
│   ├── App.tsx                       # Root component with providers
│   ├── index.css                     # Tailwind + custom CSS + theme variables
│   ├── main.tsx                      # React entry point
│   └── vite-env.d.ts                 # TypeScript env declarations
├── .env.example                      # Template for environment variables
├── supabase-schema.sql               # Complete database schema for Supabase
├── index.html                        # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── DOCUMENTATION.md                  # This file
```

---

## Core Modules

### 1. Dashboard (`src/components/Dashboard.tsx`)

The landing page after opening the app. Shows:

- **Greeting** with time-of-day awareness (morning/afternoon/evening)
- **Connection status** badge (Synced with cloud / Local data only / Connecting)
- **4 Summary Cards**: Water progress (with mini progress bar), Today's expenses (with budget %), Weekly water average, Monthly spend
- **Weekly Hydration Area Chart** — 7-day water intake trend using Recharts `<AreaChart>`
- **Category Pie Chart** — Monthly expense breakdown by category using Recharts `<PieChart>` with donut style
- **Recent Activity** — Last 3 entries for both water and expenses in compact list format

### 2. Water Tracker (`src/components/WaterTracker.tsx`)

Full-featured water intake tracking:

- **SVG Progress Ring** — Custom-drawn circular progress indicator showing percentage of daily goal. Uses `stroke-dashoffset` animation.
- **Quick Add Buttons** — One-tap add for Cup (150ml), Glass (250ml), Bottle (500ml)
- **Custom Amount Stepper** — Adjustable amount with +/- buttons (50ml increments, range 50-2000ml)
- **Today's Log** — Scrollable list of today's water entries with timestamps, amounts, and types. Hover to reveal delete button.
- **Weekly Bar Chart** — 7-day bar chart comparing intake vs goal using Recharts `<BarChart>`
- **Full History Table** — Paginated table of all water entries with "Show All/Less" toggle
- **Goal Setting Modal** — Adjust daily water goal (1500ml - 4000ml)
- **Streak & Stats** — Day streak counter and total drinks count

### 3. Expense Tracker (`src/components/ExpenseTracker.tsx`)

Debit-only expense tracking:

- **3 Summary Cards**: Today's spend, This month with budget progress bar, Top spending category
- **Weekly Spending Area Chart** — 7-day expense trend with gradient fill
- **Category Donut Chart** — Monthly breakdown with color-coded segments
- **Category Comparison Bar Chart** — Horizontal bar chart showing relative spending per category
- **All Transactions Table** — Date, description, category badge, amount, and delete action. "Show All/Less" toggle for expanding.
- **Add Expense Modal** — Amount input, description input, 8-category grid selector (Food, Transport, Shopping, Entertainment, Bills, Health, Education, Subscriptions)
- **Budget Modal** — Set monthly budget from preset options ($500 - $5000)

### 4. Settings (`src/components/Settings.tsx`)

Organized settings sections:

- **Database** — Supabase connection status with setup instructions
- **Appearance** — Dark mode toggle (dark is default and recommended)
- **Water Tracking** — Daily goal selector, reminder toggle, unit selector (ml/oz)
- **Expense Tracking** — Monthly budget, currency ($ € £ ₹ ¥), week start day
- **About** — App version info
- **iPhone Widgets** — Info about the Scriptable widgets

### 5. Layout (`src/components/Layout.tsx`)

Responsive navigation shell:

- **Desktop**: Fixed left sidebar (280px) with logo, nav items (active state with gradient), and theme toggle
- **Mobile**: Top header bar with hamburger menu + fixed bottom tab bar
- **Theme toggle**: Smooth animated switch in both desktop sidebar and mobile header

---

## Data Flow

### Adding a Water Entry

```
User clicks "Add 250ml"
       │
       ▼
addWaterEntry(250, 'glass') called
       │
       ├──► Optimistic: New entry added to React state with temp ID
       │    UI updates INSTANTLY
       │
       └──► If Supabase configured:
            supabase.from('water_entries').insert({...})
                 │
                 ├──► Success: Real-time subscription fires,
                 │    but entry already exists in state (deduplicated by temp ID)
                 │
                 └──► Failure: Rollback — remove entry from state,
                      log error to console
```

### Real-time Sync

```
Another device adds an entry
       │
       ▼
Supabase Realtime broadcasts INSERT event
       │
       ▼
WebSocket message received by subscription channel
       │
       ▼
DataContext's .on('postgres_changes', ...) handler fires
       │
       ▼
setWaterEntries(prev => [newEntry, ...prev])
       │
       ▼
React re-renders affected components
```

### Computed Values

All computed values (todayWaterTotal, weekWaterData, categoryBreakdown, etc.) are recalculated on every render from the raw entry arrays. This is efficient because:

1. The arrays are small (60 days of data max)
2. React only re-renders components that consume these values
3. No need for memoization at this scale

---

## Supabase Integration

### Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run the contents of `supabase-schema.sql`
3. Go to Settings → API and copy your Project URL and anon/public key
4. Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

5. Restart the dev server

### What Happens When Supabase Is Configured

| Feature | Without Supabase | With Supabase |
|---------|-----------------|---------------|
| Add entries | ✅ Local state only | ✅ Local state + DB insert |
| Delete entries | ✅ Local state only | ✅ Local state + DB delete |
| Persistence | ❌ Lost on refresh | ✅ Survives refresh |
| Settings | ✅ Session only | ✅ Persisted to DB |
| Real-time sync | ❌ Not available | ✅ Cross-device via WebSocket |
| Charts & stats | ✅ Works (mock data) | ✅ Works (real data) |

### How It Works Internally

The `DataContext` checks `isSupabaseConfigured()` on mount. If true:

1. **Initial Load** — Fetches last 60 days of water/expense entries and settings from Supabase REST API (PostgREST)
2. **Real-time Subscription** — Subscribes to INSERT and DELETE events on both tables via Supabase Realtime (WebSocket)
3. **All mutations** — INSERT and DELETE operations are sent to Supabase. The real-time subscription is used as a confirmation mechanism.

If Supabase is NOT configured, all data lives in React state with pre-generated mock data.

---

## API Reference (DataContext)

The `DataContext` provides the following through the `useData()` hook:

### State

| Property | Type | Description |
|----------|------|-------------|
| `waterEntries` | `WaterEntry[]` | All water entries sorted by timestamp (newest first) |
| `expenseEntries` | `ExpenseEntry[]` | All expense entries sorted by timestamp (newest first) |
| `waterGoal` | `{ daily: number, reminderInterval: number }` | Daily water goal in ml and reminder interval in minutes |
| `expenseBudget` | `{ monthly: number, categories: Record<string, number> }` | Monthly budget and per-category limits |
| `settings` | `AppSettings` | Currency, water unit, week start, notifications |
| `isLoading` | `boolean` | Whether Supabase data is being loaded |
| `dbStatus` | `'connected' \| 'local' \| 'checking'` | Current database connection status |

### Computed Values

| Property | Type | Description |
|----------|------|-------------|
| `todayWaterTotal` | `number` | Total ml of water consumed today |
| `todayExpenseTotal` | `number` | Total $ spent today |
| `weekWaterData` | `{ day, amount, goal }[]` | 7-day water intake with daily goal |
| `weekExpenseData` | `{ day, amount, budget }[]` | 7-day expenses with daily budget fraction |
| `categoryBreakdown` | `{ name, value, color }[]` | Monthly expense totals per category with colors |

### Actions

| Method | Signature | Description |
|--------|-----------|-------------|
| `addWaterEntry` | `(amount: number, type: 'glass'\|'bottle'\|'cup'\|'custom') => void` | Add a water entry with optimistic update |
| `addExpenseEntry` | `(entry: { amount, category, description }) => void` | Add an expense entry with optimistic update |
| `deleteWaterEntry` | `(id: string) => void` | Delete a water entry with optimistic rollback |
| `deleteExpenseEntry` | `(id: string) => void` | Delete an expense entry with optimistic rollback |
| `updateWaterGoal` | `(goal: Partial<WaterGoal>) => void` | Update water goal settings |
| `updateExpenseBudget` | `(budget: Partial<ExpenseBudget>) => void` | Update budget settings |
| `updateSettings` | `(settings: Partial<AppSettings>) => void` | Update app settings |

### Types

```typescript
interface WaterEntry {
  id: string;
  amount: number;        // milliliters
  timestamp: string;     // ISO 8601
  type: 'glass' | 'bottle' | 'cup' | 'custom';
}

interface ExpenseEntry {
  id: string;
  amount: number;        // currency units
  category: string;      // Food, Transport, Shopping, etc.
  description: string;
  timestamp: string;     // ISO 8601
}

interface AppSettings {
  currency: string;           // '$', '€', '£', '₹', '¥'
  waterUnit: 'ml' | 'oz';
  weekStartsOn: 'monday' | 'sunday';
  notifications: boolean;
}
```

---

## Database Schema

### `water_entries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated UUID |
| `amount` | INTEGER | Water amount in ml (must be > 0) |
| `entry_type` | TEXT | One of: 'glass', 'bottle', 'cup', 'custom' |
| `created_at` | TIMESTAMPTZ | Auto-set to insertion time |

**Index**: `created_at DESC` for fast date-range queries

### `expense_entries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated UUID |
| `amount` | DECIMAL(10,2) | Expense amount (must be > 0) |
| `category` | TEXT | Category name (e.g., Food, Transport) |
| `description` | TEXT | Human-readable description |
| `created_at` | TIMESTAMPTZ | Auto-set to insertion time |

**Index**: `created_at DESC` for fast date-range queries

### `user_settings`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | INTEGER (PK) | 1 | Single row — always id=1 |
| `daily_water_goal` | INTEGER | 2500 | Daily goal in ml |
| `reminder_interval_minutes` | INTEGER | 60 | Reminder interval |
| `monthly_budget` | DECIMAL(10,2) | 2000 | Monthly budget |
| `currency` | TEXT | '$' | Display currency symbol |
| `water_unit` | TEXT | 'ml' | 'ml' or 'oz' |
| `week_starts_on` | TEXT | 'monday' | 'monday' or 'sunday' |
| `notifications_enabled` | BOOLEAN | true | Notification preference |
| `created_at` | TIMESTAMPTZ | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOW() | Auto-updated on change |

### RPC Function: `get_monthly_category_breakdown`

```sql
-- Returns category totals and percentages for a given month
SELECT * FROM get_monthly_category_breakdown('2025-01');
-- Returns: { category: 'Food', total: 450.50, percentage: 35.2 }
```

### RLS Policies

Since this is a single-user app with no authentication, all tables use permissive RLS policies:

```sql
CREATE POLICY "Allow all operations" ON public.water_entries
  FOR ALL USING (true) WITH CHECK (true);
```

> ⚠️ If you want to restrict access, add authentication and change the RLS policies to filter by `user_id`.

---

## Scriptable iPhone Widgets

### Water Widget (`scriptable/water-widget.js`)

**What it shows:**
- 💧 Header with "Water" title and fire streak badge
- Circular progress ring with liters consumed and percentage
- Remaining amount or "Goal reached!" message
- Last entry time and total drinks count

**How it works:**
1. Fetches today's water entries from Supabase REST API
2. Calculates total, percentage, and remaining
3. Falls back to simulated data if API fails
4. Uses Scriptable's `DrawContext` for the progress ring
5. Medium widget size (recommended)

**Setup:**
1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) from the App Store
2. Copy the script into a new Scriptable script
3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` at the top
4. Store your auth token (if using auth): `Keychain.set("trackr-auth-token", "your-jwt")`
5. Add a Scriptable widget to your home screen and select this script

### Expense Widget (`scriptable/expense-widget.js`)

**What it shows:**
- 💰 Header with "Expenses" title and current date
- Today's total spend with transaction count
- Needs/Wants breakdown bar
- Category mini bar chart (top 4 categories)
- Monthly budget progress bar with percentage
- Top category highlight badge

**Setup:** Same as water widget above.

---

## Theming

### Dark Theme (Default & Primary)

The dark theme uses a deep navy palette:

- **Background**: `#020617` → `#0f172a` gradient
- **Glass cards**: `rgba(15, 23, 42, 0.65)` with 20px blur
- **Glass borders**: `rgba(99, 102, 241, 0.08)` (subtle indigo tint)
- **Text primary**: `#f1f5f9` (near white)
- **Text secondary**: `#94a3b8` (slate)
- **Text muted**: `#64748b` (dark slate)
- **Water accent**: Cyan gradient `#0891b2` → `#22d3ee`
- **Expense accent**: Pink gradient `#db2777` → `#f472b6`
- **Primary accent**: Indigo gradient `#6366f1` → `#a5b4fc`
- **Glow effects**: Gradient buttons cast colored shadows (e.g., water cards glow cyan)

### Light Theme

Functional but secondary:

- **Background**: `#f8fafc` → `#e2e8f0` gradient
- **Glass cards**: `rgba(255, 255, 255, 0.7)` with 20px blur
- **Text primary**: `#0f172a` (near black)

### Theme Persistence

Theme preference is stored in `localStorage` under key `trackr-theme`. Defaults to dark on first visit.

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No | Your Supabase project URL (e.g., `https://abc123.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | No | Your Supabase anon/public key |

If both are set, the app connects to Supabase. If either is missing, the app runs in local-only mode.

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Deploying to Vercel (Step-by-Step)

### Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- (Optional) A Supabase project set up with the schema

### Step 1: Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Trackr personal tracker"

# Create a GitHub repo at https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/trackr.git
git branch -M main
git push -u origin main
```

### Step 2: Set Up Supabase (Optional but Recommended)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to provision (~2 minutes)
3. Go to **SQL Editor** in the left sidebar
4. Click **New query**, paste the entire contents of `supabase-schema.sql`, and click **Run**
5. Verify the tables were created: Go to **Table Editor** — you should see `water_entries`, `expense_entries`, and `user_settings`
6. Go to **Settings** → **API**
7. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`)
8. Copy the **anon/public** key (starts with `eyJ...`)

### Step 3: Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Under "Import Git Repository", find your GitHub repo and click **"Import"**
4. You'll see the "Configure Project" screen

### Step 4: Configure Build Settings

Vercel should auto-detect Vite. Verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `./` (default) |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `dist` (default) |
| **Install Command** | `npm install` (default) |

### Step 5: Add Environment Variables

This is the critical step for Supabase connectivity.

1. Expand the **"Environment Variables"** section
2. Add two variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (your full anon key) |

3. Make sure the Environment dropdown is set to **Production**, **Preview**, and **Development** (all three)

> ⚠️ **Important**: The `VITE_` prefix is required. Vite only exposes environment variables that start with `VITE_` to the client bundle. Without this prefix, the variables will be undefined at runtime.

> ⚠️ **Security Note**: The Supabase anon key is designed to be public. It's safe to include in client-side code because Row Level Security (RLS) policies on your Supabase tables control what data can be accessed. Since this is a personal app with permissive RLS policies, anyone with your URL could read/write data. If this concerns you, add authentication or restrict RLS policies.

### Step 6: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 30-60 seconds)
3. Vercel will show a ✅ success screen with your deployment URL

### Step 7: Verify Your Deployment

1. Click the deployment URL (looks like `trackr-xyz123.vercel.app`)
2. The app should load with the dark theme
3. Check the connection status in the dashboard — it should say **"Synced with cloud"**
4. Try adding a water entry — it should persist after page refresh
5. Check your Supabase Table Editor — the entry should appear in `water_entries`

### Step 8: Custom Domain (Optional)

1. Go to your project in the Vercel dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain (e.g., `trackr.yourdomain.com`)
4. Follow the DNS configuration instructions (usually adding a CNAME record)
5. Wait for SSL certificate provisioning (usually automatic within minutes)

### Step 9: Automatic Deployments

Vercel automatically deploys when you push to your Git repository:

- **`main` branch** → Production deployment
- **Pull requests** → Preview deployment (unique URL for testing)

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails with TypeScript errors | Run `npm run build` locally first to catch errors |
| App loads but shows "Local data only" | Check that both env vars are set correctly in Vercel |
| App shows blank page | Open browser console (F12) — likely a missing env var |
| Supabase connection fails | Verify the URL format is `https://xxx.supabase.co` (no trailing slash) |
| Data doesn't persist | Check Supabase Table Editor — if no entries appear, the RLS policies might not be set up. Re-run the schema SQL. |
| Real-time not working | In Supabase dashboard, go to Database → Replication and ensure `water_entries` and `expense_entries` are enabled for Realtime |
| Charts not rendering | This is a server-side rendering issue. Make sure your build output is correct. Recharts only works in the browser. |

### Updating After Code Changes

```bash
# Make your changes locally
git add .
git commit -m "Update: description of changes"
git push
```

Vercel automatically detects the push and redeploys. You can monitor the deployment in the Vercel dashboard.

---

## License

Personal use. Built with ❤️ using React, Tailwind CSS, and Supabase.
