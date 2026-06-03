# Oxecute — Founder Operating Record & Execution Intelligence

Oxecute is a high-fidelity verified operating record tool built for high-velocity founders. Instead of general pitch decks or unverified claims, Oxecute lets founders build a solid, verifiable track record of daily execution. It enforces strict, append-only daily proof submissions, tracks milestones, computes "Signal Scores," and opens consent-based visibility to investors and peer founders.

---

## Folder Structure

The application is structured as a modern Next.js 14 project using the App Router and TypeScript:

```text
├── public/                       # Static public assets (brand icons, lock screens, badges)
├── src/
│   ├── app/                      # Next.js App Router (Pages & API endpoints)
│   │   ├── (auth)/               # Authentication pages (forgot password, update password)
│   │   ├── angels/               # Investor Visibility Dashboard checklist page
│   │   ├── coaches/              # Coach access coming-soon lock page
│   │   ├── community/            # Peer connection list page (Day 45 locked)
│   │   ├── conexa/               # Conexa execution assistant page
│   │   ├── dashboard/            # Founder main operating record grid & submit hub
│   │   ├── settings/             # User settings (profile, integrations)
│   │   ├── u/[username]/         # Publicly shareable verified operating profile
│   │   ├── api/                  # Backend API routes
│   │   │   ├── auth/             # Session bootstrap and cookie cleanups
│   │   │   ├── conexa/           # Activation synthesis, day 14 reads, and chat
│   │   │   ├── cron/             # Vercel daily event heartbeats
│   │   │   └── entries/          # Daily operating ledger submissions & upgrades
│   │   └── layout.tsx            # Main HTML layout, fonts, and script loaders
│   ├── components/               # Frontend UI components
│   │   ├── app/                  # Dashboard shell and app-specific utilities
│   │   ├── marketing/            # Landing page and outer marketing layouts
│   │   ├── onboarding/           # Calibration flows and question forms
│   │   └── profile/              # Public profile statistics, grid, and detail modals
│   └── lib/                      # Shared business logic and library integrations
│       ├── conexa/               # Conexa Anthropic prompt construction and parsers
│       ├── cron/                 # Heartbeat scheduler logic
│       ├── email/                # Resend templates and mail handlers
│       ├── supabase/             # Supabase clients (client, server, service role)
│       └── validation/           # Proof URL parsing and storage path checks
├── supabase/
│   └── migrations/               # PostgreSQL schema definitions, triggers, and storage SQLs
├── .env.example                  # Environment template file
├── tailwind.config.ts            # Tailwind layout and theme extensions
└── tsconfig.json                 # TypeScript compiler options
```

---

## How to Run Locally

Follow these steps to get a local development environment running:

### 1. Prerequisites
Ensure you have **Node.js** (v18+ recommended) and **npm** installed on your system.

### 2. Configure Environment Variables
Copy `.env.example` to create a local environment file:
```bash
cp .env.example .env.local
```
Fill in the Supabase, Resend, and Anthropic API keys (refer to [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for details on where to acquire them).

### 3. Install Dependencies
Run npm install in the project root:
```bash
npm install
```

### 4. Database Schema Setup
Apply the migrations in your Supabase database. You can do this by executing the SQL files located in the `supabase/migrations/` folder inside the Supabase SQL editor in chronological order (starting with `20260508000000_initial.sql`).

### 5. Start the Local Server
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 6. Verify Production Build
To test compilation correctness, run:
```bash
npm run build
```
