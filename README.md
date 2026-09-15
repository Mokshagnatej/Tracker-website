# Moksha Tracker

A personal expense and habit tracking web application powered by **Notion as the database**. The entire app reads and writes data directly to Notion databases through the Notion API — no separate database needed.

---

## What This Project Does

Moksha Tracker is a full-stack web app with three main pages:

| Page | What it does |
|---|---|
| **Dashboard** | Shows spending trends (30-day area chart), category breakdown (donut + bar charts), monthly income vs expenses summary, and recent activity feed |
| **All Entries** | Full transaction list with search, sort, filter (Income/Expense), and a form to add new expenses or income |
| **Habits** | Daily habit tracker with streak counting, 28-day heatmap, 14-day trend chart, streak leaderboard, category progress bars, and mood tracking |

Everything syncs with Notion in real-time — add an expense here and it shows up in your Notion database, and vice versa.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework — all pages are React components |
| **TypeScript** | Type safety for components, props, and data models |
| **Vite 8** | Build tool and dev server (with HMR) |
| **Tailwind CSS 4** | Utility-first styling (via `@tailwindcss/vite` plugin) |
| **Recharts** | All charts — Area, Pie, Bar charts on Dashboard and Habits pages |

### Backend

| Technology | Purpose |
|---|---|
| **Express 5** | API server — serves both the REST API and the built frontend |
| **@notionhq/client** | Official Notion SDK — all database reads/writes go through this |
| **dotenv** | Loads environment variables from `.env.local` |
| **cors** | Cross-origin support for API requests |
| **concurrently** | Runs Vite dev server + Express API server simultaneously during development |

---

## Project Structure

```
moksha-tracker/
├── index.html              # Entry HTML (Vite injects React here)
├── server.js               # Express server — API routes + static file serving
├── vite.config.ts          # Vite config — proxy /api to Express, Tailwind plugin
├── render.yaml             # Render.com deployment config
├── seed-meta.js            # One-time script to seed habit metadata into Notion
│
├── lib/                    # Shared server utilities
│   ├── notion.js           # Notion client initialization (uses NOTION_TOKEN)
│   ├── cache.js            # In-memory TTL cache (reduces Notion API calls)
│   ├── retry.js            # Exponential backoff retry wrapper for Notion API
│   ├── rate-limit.js       # Request rate limiting
│   └── validate.js         # Input validation for expense data
│
├── api/                    # REST API route handlers
│   ├── expenses.js         # GET (list) + POST (create) expenses
│   ├── expenses/[id].js    # DELETE (archive) a single expense
│   ├── habits.js           # GET (list with streaks/heatmap) + POST (add new habit)
│   ├── habits/[id].js      # PATCH (toggle done) + DELETE (remove habit property)
│   ├── metadata.js         # GET categories and accounts from Notion
│   ├── mood.js             # POST — update today's mood in Notion
│   └── tasks/              # (Reserved for future task tracking)
│
├── src/                    # Frontend source
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Root component — routing, state, API calls
│   ├── index.css           # Global styles
│   ├── data/mockData.ts    # TypeScript types + category colors/icons + fallback data
│   ├── pages/
│   │   ├── Dashboard.tsx   # Spending trends, charts, category breakdown
│   │   ├── AllEntries.tsx  # Transaction list with CRUD
│   │   └── HabitsPage.tsx  # Habit tracker with heatmap, charts, streak board
│   └── components/
│       └── Toast.tsx       # Toast notification component
│
└── dist/                   # Production build output (served by Express)
```

---

## How Notion Is Connected

The app uses **Notion as its only database**. There is no PostgreSQL, MongoDB, or any other DB — every piece of data lives in Notion databases.

### The Connection Flow

```
┌─────────────┐     fetch('/api/...')     ┌──────────────┐     Notion SDK     ┌─────────────────┐
│   React UI  │ ──────────────────────▶  │  Express API  │ ────────────────▶ │  Notion Database │
│  (Browser)  │ ◀──────────────────────  │  (server.js)  │ ◀──────────────── │   (Your Pages)   │
└─────────────┘       JSON response       └──────────────┘    API response    └─────────────────┘
```

1. The **React frontend** makes `fetch()` calls to `/api/expenses`, `/api/habits`, etc.
2. The **Express server** receives these requests and uses the `@notionhq/client` SDK to talk to the Notion API.
3. The **Notion client** is initialized in `lib/notion.js` using a `NOTION_TOKEN` (a Notion internal integration token).
4. All reads use `notion.databases.query()` and all writes use `notion.pages.create()` / `notion.pages.update()`.

### Notion Databases Required

The app connects to **6 Notion databases** (each identified by a database ID in environment variables):

| Env Variable | Notion Database | What It Stores |
|---|---|---|
| `NOTION_TOKEN` | — | Your Notion integration token (auth) |
| `EXPENSE_DB_ID` | Expenses DB | Every expense/income entry (Name, Amount, Date, Type, Categories relation, Accounts relation) |
| `HABIT_DB_ID` | Habits DB | One row per day with a `date` property and one **checkbox property per habit** (e.g., `Meditate`, `Morning run`) |
| `HABIT_META_DB_ID` | Habit Metadata DB | Stores metadata for each habit — Name, Category (select), Time (select), Icon (rich_text) |
| `CATEGORY_DB_ID` | Categories DB | List of expense categories (Food & Dining, Transport, etc.) — used as relation targets |
| `ACCOUNT_DB_ID` | Accounts DB | List of accounts (HDFC, SBI, Paytm, Cash, GPay) — used as relation targets |
| `MONTH_DB_ID` | Months DB | Auto-created monthly entries (e.g., `SEP2026`) — expenses are auto-linked to their month |

### How Each Feature Uses Notion

**Expenses:**
- `GET /api/expenses` → Queries the Expenses database, returns all rows sorted by Date descending
- `POST /api/expenses` → Creates a new page in the Expenses database. If `MONTH_DB_ID` is set, it also auto-creates/links a monthly rollup page (e.g., `SEP2026`)
- `DELETE /api/expenses/:id` → Archives the Notion page (sets `archived: true`)
- Categories and Accounts are stored as **Notion relations** pointing to separate databases

**Habits:**
- `GET /api/habits` → Queries the Habit database schema to discover all checkbox properties (those are your habits), then queries the last 30 days of rows. If today's row doesn't exist, it auto-creates it. Returns 14-day history, 28-day heatmap history, streaks, weekly completion rate, and today's mood
- `POST /api/habits` → Adds a new checkbox property to the Habit database (via `databases.update`) and creates a metadata entry in the Habit Meta database
- `PATCH /api/habits/:id` → Toggles a checkbox on today's page
- `DELETE /api/habits/:id` → Removes the checkbox property from the database schema entirely
- Each habit is a **database column** (checkbox type), not a row — this is an unconventional but effective pattern

**Mood:**
- `POST /api/mood` → Updates a `Mood` select property on today's habit page

**Metadata:**
- `GET /api/metadata` → Pulls all categories and accounts from their respective databases. Cached for 5 minutes to reduce API calls

---

## How the Frontend Works

### Architecture

The frontend is a **single-page application (SPA)** with client-side routing handled by React state (no React Router needed — just a `page` state variable).

```
App.tsx (Root)
├── State: transactions, habits, metadata, todayMood, toasts, activeCat, page
├── API calls: fetchData(), addTransaction(), deleteTransaction(), toggleHabit(), etc.
│
├── Dashboard.tsx       (page === "dashboard")
│   ├── Stat cards: Total Spent, Total Income, Net Balance, Avg Per Entry
│   ├── Monthly Summary bar (Income vs Expenses ratio)
│   ├── Spending Trend (30-day AreaChart with Expense/Income/Net toggle)
│   ├── Category Split (PieChart donut)
│   ├── Spend by Category (BarChart, sortable by amount or count)
│   ├── Category Breakdown (progress bars with percentages)
│   └── Recent Activity (last 7 transactions)
│
├── AllEntries.tsx       (page === "entries")
│   ├── New Entry form (Expense/Income toggle, name, amount, date, category, account)
│   ├── Income/Expense/Net summary badges
│   ├── Filter chips (All / Income / Expense)
│   ├── Search bar (searches name, category, account)
│   └── Sortable table (by name, date, amount) with delete buttons
│
└── HabitsPage.tsx       (page === "habits")
    ├── Today's progress circle (% done)
    ├── 2×2 stat grid: Best Streak, Active Habits, Perfect Days, Monthly Rate
    ├── Category Progress (progress bars per category)
    ├── 14-Day Trend (AreaChart — habits completed per day)
    ├── Streak Board (horizontal BarChart)
    ├── 28-Day Heatmap (grid of colored squares per habit per day)
    └── Today's Habits list (filter by category, toggle done, delete, 7-day dot history)
```

### Data Flow

1. **On page load**, `App.tsx` calls `fetchData()` which fires three parallel API requests:
   - `GET /api/expenses` — fetches all transactions
   - `GET /api/habits` — fetches habits with streaks, heatmap, mood
   - `GET /api/metadata` — fetches categories and accounts
2. The raw Notion data is **adapted** — category IDs and account IDs are resolved to human-readable names using the metadata
3. All state lives in `App.tsx` and is passed down as props to page components
4. **Optimistic updates** — when you toggle a habit or add an expense, the UI updates immediately, then syncs with Notion in the background. If the API call fails, the state is rolled back

### Navigation

- **Desktop**: Sidebar on the left with Dashboard / All Entries / Habits links + category filter list
- **Mobile**: Bottom navigation bar with three tab buttons
- Both use the same `page` state — no URL routing

### Charts (Recharts)

All charts use the Recharts library:
- **AreaChart** — 30-day spending trend (Dashboard) and 14-day habit trend (Habits)
- **PieChart** — Category split donut chart (Dashboard)
- **BarChart** — Spend by category (Dashboard) and Streak board (Habits, horizontal layout)
- Custom tooltip components for each chart type

---

## API Endpoints

| Method | Endpoint | Action |
|---|---|---|
| `GET` | `/api/expenses` | List all expenses/incomes from Notion |
| `POST` | `/api/expenses` | Create a new expense/income in Notion |
| `DELETE` | `/api/expenses/:id` | Archive an expense in Notion |
| `GET` | `/api/habits` | Get all habits with streaks, heatmap, mood |
| `POST` | `/api/habits` | Add a new habit (creates checkbox column + metadata) |
| `PATCH` | `/api/habits/:id` | Toggle a habit's done status for today |
| `DELETE` | `/api/habits/:id` | Remove a habit column from the database |
| `GET` | `/api/metadata` | Get categories and accounts (cached 5 min) |
| `POST` | `/api/mood` | Set today's mood on the habits page |

---

## Server Utilities

The `lib/` directory contains shared utilities used by all API routes:

- **`notion.js`** — Initializes the Notion client with `NOTION_TOKEN`
- **`cache.js`** — In-memory Map-based cache with TTL expiry. Metadata is cached for 5 minutes to reduce Notion API calls
- **`retry.js`** — `withRetry(fn)` wraps any Notion API call with exponential backoff (3 retries, base delay 300ms, multiplier 3×). This handles Notion's rate limit of ~3 requests/second
- **`rate-limit.js`** — Per-IP rate limiting to prevent abuse
- **`validate.js`** — Input validation for expense data (name, amount, type)

---

## How Dev and Production Work

### Development

In development, two servers run simultaneously (via `concurrently`):
- **Vite** dev server on port `8443` — serves the React frontend with hot module replacement
- **Express** API server on port `3000` — handles all `/api/*` routes

Vite proxies all `/api` requests to the Express server (configured in `vite.config.ts`):

```
Browser → localhost:8443 → Vite (for .tsx/.css) 
                         → Proxy → localhost:3000 (for /api/*)
```

### Production

In production (e.g., on Render), only the Express server runs:
- It serves the pre-built static files from `dist/`
- It handles all API routes
- SPA fallback — any non-API route returns `index.html` so client-side routing works

---

## Deployment

The project includes a `render.yaml` for **Render.com** deployment:
- Build command: `npm install && npm run build`
- Start command: `node server.js`
- All Notion credentials are set as environment variables in the Render dashboard

---

## Key Design Decisions

1. **Notion as the database** — No separate DB to manage. Your data lives where you already organize your life. You can view and edit it directly in Notion too
2. **Habits as checkbox columns** — Each habit is a checkbox property on the Habit database. This means every daily row has a column per habit — making it easy to see completion at a glance in Notion
3. **Relation-based categories** — Expenses use Notion relations to link to Categories and Accounts databases, keeping data normalized
4. **Auto-created daily rows** — The habit API auto-creates today's row if it doesn't exist, so you never have to manually add a new day
5. **Optimistic UI** — State updates instantly on user action, then syncs with Notion. If the API call fails, the change is rolled back with an error toast
6. **In-memory caching** — Metadata is cached server-side to avoid hitting Notion's rate limits on every page load
