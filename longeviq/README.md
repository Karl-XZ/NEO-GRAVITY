# LongevIQ

Patient-facing longevity web app that turns fragmented health data (EHR, wearable telemetry, lifestyle surveys) into actionable, personalised longevity insights.

Built for the **BCG Platinion AI Hackathon** at the Future Leader Summit 2026.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Server Components)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database + Auth:** Supabase (Postgres, RLS, email/password + magic link)
- **Charts:** Recharts
- **Icons:** lucide-react
- **Forms:** react-hook-form + zod
- **Date handling:** date-fns
- **Testing:** vitest

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A Supabase project (free tier works)

### Setup

```bash
# Clone and install
cd longeviq
pnpm install

# Copy env template and fill in your Supabase credentials
cp .env.local.example .env.local

# Run dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | No | For the optional LLM coach layer |

### Data Loading

> Detailed instructions will be added in Phase 1.

1. Place CSV files in `data/raw/`:
   - `ehr_records.csv`
   - `wearable_telemetry_1.csv`
   - `lifestyle_survey.csv`
   - `data_dictionary.xlsx`
2. Run the Supabase migration: `supabase db push`
3. Run the data loader: `pnpm tsx scripts/load-data.ts`

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript type check |
| `pnpm test` | Run vitest tests |
| `pnpm test:watch` | Run vitest in watch mode |

## Project Structure

```
src/
  app/                    # Next.js App Router routes
    (auth)/               # Authentication pages (login, signup, forgot-password)
    (app)/                # Protected app routes
      dashboard/          # Main longevity dashboard
      biomarkers/         # Detailed biomarker views
      journey/            # Longevity journey visualisation
      coach/              # AI health coach
      settings/           # User settings & data export
    api/                  # API route handlers
  components/
    ui/                   # shadcn/ui primitives
    charts/               # Recharts wrapper components
    dashboard/            # Dashboard tile components
    layout/               # Sidebar, topbar, app shell
  lib/
    supabase/             # Supabase client + server helpers
    features/             # Derived feature computation (bio-age, scores, etc.)
    coach/                # Rules-based coach logic
    thresholds.ts         # Clinical thresholds from data dictionary
    types.ts              # Shared TypeScript types
    utils.ts              # Utility functions (cn, etc.)
  hooks/                  # Custom React hooks
supabase/
  migrations/             # Postgres migration files
  tests/                  # RLS test files
scripts/                  # Data loading & utility scripts
data/raw/                 # Source CSV/XLSX files (not committed)
```

## Design System

- **Background:** `#0E1116`
- **Card:** `#1A1F27` with 1px `#2A313B` border, 12px radius
- **Accent green:** `#00D26A` (primary actions, success)
- **Warning amber:** `#F5A623`
- **Danger red:** `#E24B4A`
- **Info blue:** `#378ADD`
- **Typography:** Inter (UI), JetBrains Mono (numeric callouts in expert mode)

## Phases

- [x] Phase 0 — Project scaffolding
- [ ] Phase 1 — Supabase schema + data loading
- [ ] Phase 2 — Feature engineering layer
- [ ] Phase 3 — Authentication
- [ ] Phase 4 — Dashboard
- [ ] Phase 5 — Biomarkers page
- [ ] Phase 6 — Longevity Journey page
- [ ] Phase 7 — AI Health Coach
- [ ] Phase 8 — Settings & data export
