# Moksha Tracker

A personal expense, habit, and attendance tracking web application powered by **Notion as the database**. The entire app reads and writes data directly to Notion databases through the Notion API, while using a lightweight Turso SQLite database exclusively for secure authentication.

---

## What This Project Does

Moksha Tracker is a full-stack web app with four main pages:

| Page | What it does |
|---|---|
| **Dashboard** | Shows spending trends (30-day area chart), category breakdown (donut + bar charts), monthly income vs expenses summary, and recent activity feed. |
| **All Entries** | Full transaction list with search, sort, filter (Income/Expense/Cash Tx), and a form to add new expenses or income. Features a dedicated "Add Cash" mode for seamless cash flow tracking. |
| **Habits** | Daily habit tracker with streak counting, 28-day heatmap, 14-day trend chart, streak leaderboard, category progress bars, and mood tracking. |
| **Attendance** | Student attendance tracker with a batch image upload feature that uses Google Cloud Vision OCR to automatically parse and record attendance from screenshots. |

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
| **Node.js & Express 5** | API server — serves both the REST API and the built frontend |
| **@notionhq/client** | Official Notion SDK — all database reads/writes go through this |
| **@libsql/client (Turso)**| SQLite edge database used strictly for storing hashed passwords |
| **jsonwebtoken & bcryptjs**| Secures the app behind a JWT-based authentication gate |
| **@google-cloud/vision** | OCR engine for parsing attendance reports from images |

---

## Project Structure

The project was recently refactored into a clear client/server monorepo structure:

```
moksha-tracker/
├── frontend/                 # React UI Codebase
│   ├── index.html            # Entry HTML (Vite injects React here)
│   ├── vite.config.ts        # Vite config — proxy /api to Express backend
│   ├── src/                  
│   │   ├── main.tsx          # React entry point, global fetch interceptor (JWT)
│   │   ├── App.tsx           # Root component — routing, state, API calls
│   │   ├── components/       # UI Components (AuthGate, Toast, etc.)
│   │   ├── pages/            # Dashboard, AllEntries, HabitsPage, AttendancePage, SettingsPage
│   │   └── data/             # Types and mock fallbacks
│
├── backend/                  # Node/Express API Codebase
│   ├── server.js             # Express server — API routes + static file serving
│   ├── api/                  # REST API route handlers (auth, expenses, habits, attendance, etc.)
│   └── lib/                  # Shared server utilities
│       ├── auth.js           # JWT verification middleware
│       ├── db.js             # Turso SQLite client initialization
│       ├── notion.js         # Notion client initialization (uses NOTION_TOKEN)
│       └── vision.js         # Google Cloud Vision client
│
├── deploy.sh                 # Deployment script (commits and pushes to GitHub)
├── render.yaml               # Render.com deployment config
└── README.md                 
```

---

## Security & Authentication

The app is protected by a unified **Password Gate**. 
- A single master password is required to access the UI or the REST API.
- The password is symmetrically hashed using `bcrypt` and stored in a **Turso SQLite** database table (`app_settings`).
- Upon login, the backend issues a `jsonwebtoken` (JWT) which the frontend stores in `localStorage`.
- A global `fetch` interceptor automatically attaches the `Bearer` token to all outgoing `/api/*` requests.
- Passwords can be changed via the internal **Settings** page.

---

## How Notion Is Connected

The app uses **Notion as its primary data store**. 

### Notion Databases Required
The app connects to several Notion databases (each identified by a database ID in `.env.local`):

| Env Variable | What It Stores |
|---|---|
| `EXPENSE_DB_ID` | Every expense/income entry |
| `HABIT_DB_ID` | One row per day with a checkbox property per habit |
| `HABIT_META_DB_ID` | Stores metadata for each habit |
| `CATEGORY_DB_ID` | List of expense categories |
| `ACCOUNT_DB_ID` | List of accounts (HDFC, SBI, Paytm, Cash, GPay) |
| `MONTH_DB_ID` | Auto-created monthly entries (e.g., `SEP2026`) |
| `ATTENDANCE_DB_ID` | Tracks course attendance numbers and margins |

---

## API Endpoints

All API endpoints (except `/api/auth`) require a valid JWT `Authorization: Bearer <token>` header.

| Method | Endpoint | Action |
|---|---|---|
| `POST` | `/api/auth` | Authenticate or change password |
| `GET` | `/api/expenses` | List all expenses/incomes from Notion |
| `POST` | `/api/expenses` | Create a new expense/income |
| `DELETE` | `/api/expenses/:id` | Archive an expense |
| `GET` | `/api/habits` | Get all habits with streaks, heatmap, mood |
| `POST` | `/api/habits` | Add a new habit |
| `PATCH` | `/api/habits/:id` | Toggle a habit's done status for today |
| `POST` | `/api/attendance/upload` | Process batch screenshots of attendance records using OCR |
| `GET` | `/api/metadata` | Get categories and accounts (cached) |

---

## How Dev and Production Work

### Development
In development, run two terminals from the root directory:
- `npm run dev:api` - Starts the Express server on port 3000
- `npm run dev:ui` - Starts the Vite server on port 8443

Vite proxies all `/api` requests to the Express server.

### Production
In production (e.g., on Render.com):
- The `render.yaml` config tells Render to run `cd backend && npm install && cd ../frontend && npm install && npm run build`
- Only the Express server runs (`cd backend && node server.js`)
- Express serves the pre-built static React files from `frontend/dist/`
- Express handles all API routes securely.
