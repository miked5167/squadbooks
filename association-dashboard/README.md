# HuddleBooks Association Command Center

A centralized financial oversight dashboard for minor hockey associations to monitor team health, detect risks, and generate board-ready reports.

## Overview

The Association Command Center provides association administrators with:

- **Real-time health monitoring** across all teams
- **Automated alerting** for budget, reconciliation, and approval issues
- **Drill-down views** into individual team finances
- **Board-ready PDF reports** generated in seconds
- **Daily snapshots** for consistent data freshness

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Deployment**: Vercel

## Prerequisites

Before starting, you need:

1. **Supabase Account** - Create a new project at https://supabase.com
2. **Clerk Account** - Create a new application at https://clerk.com
3. **Node.js** - Version 18+ installed
4. **npm** - Package manager

## Getting Started

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it: "association-command-center" (or your preferred name)
4. Set a strong database password
5. Choose your region
6. Wait for project to be provisioned (~2 minutes)

### 2. Get Database Connection Strings

From your Supabase project:

1. Go to **Settings** > **Database**
2. Scroll to **Connection String**
3. Copy the **URI** (for DATABASE_URL)
4. Copy the **Connection Pooling** URI (for DIRECT_URL)
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Create Clerk Application

1. Go to https://dashboard.clerk.com
2. Click "Add Application"
3. Name it: "Association Command Center"
4. Enable **Email** authentication
5. Copy the **Publishable Key** and **Secret Key**

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your actual values:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Clerk Auth (from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (from Supabase > Settings > API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Database Migration

```bash
npx prisma migrate dev --name init
```

This creates all 7 tables:
- `associations`
- `association_users`
- `association_teams`
- `team_financial_snapshots`
- `alerts`
- `reports`
- `dashboard_config`

### 7. Generate Prisma Client

```bash
npx prisma generate
```

### 8. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
association-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── page.tsx       # Overview dashboard
│   │   │   ├── teams/         # Team list & detail
│   │   │   ├── alerts/        # Alerts page
│   │   │   └── reports/       # Reports page
│   │   └── api/               # API routes
│   ├── components/             # React components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── db/                # Database utilities
│   │   │   └── prisma.ts      # Prisma client singleton
│   │   ├── huddlebooks/       # HuddleBooks API client
│   │   └── utils/             # Utility functions
│   ├── types/                 # TypeScript types
│   │   ├── auth.ts            # Auth & role types
│   │   └── index.ts           # Common types
│   └── generated/prisma/      # Generated Prisma Client
├── prisma/
│   └── schema.prisma          # Database schema
├── .env.local                 # Environment variables (gitignored)
├── .env.example               # Example env file
└── README.md                  # This file
```

## Database Schema

### Core Tables

1. **associations** - Association organization records
2. **association_users** - Admins, board members, auditors
3. **association_teams** - Teams connected to association
4. **team_financial_snapshots** - Daily snapshot of team finances
5. **alerts** - Automated alerts for issues
6. **reports** - Generated PDF reports
7. **dashboard_config** - Configurable thresholds per association

### Key Relationships

- Each **Association** has many **Users**, **Teams**, **Alerts**, and **Reports**
- Each **Team** has many **Snapshots** and **Alerts**
- Each **Snapshot** captures point-in-time financial data
- **Alerts** are automatically generated based on snapshot data

## Development Workflow

### Running Migrations

When you change the schema:

```bash
npx prisma migrate dev --name descriptive_name
```

### Viewing Database

```bash
npx prisma studio
```

Opens a browser UI to view/edit data at http://localhost:5555

### Type Safety

Prisma generates TypeScript types automatically. Import them:

```typescript
import { Association, AssociationTeam } from '@/generated/prisma'
```

## Environment Variables Reference

| Variable | Description | Required | Source |
|----------|-------------|----------|--------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) | ✅ | Supabase > Settings > Database |
| `DIRECT_URL` | Direct PostgreSQL connection | ✅ | Supabase > Settings > Database |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | ✅ | Clerk Dashboard |
| `CLERK_SECRET_KEY` | Clerk secret key | ✅ | Clerk Dashboard |
| `SUPABASE_URL` | Supabase project URL | ✅ | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ | Supabase > Settings > API |
| `SUPABASE_ANON_KEY` | Supabase anon key | ✅ | Supabase > Settings > API |
| `HUDDLEBOOKS_API_BASE_URL` | HuddleBooks API base URL | ✅ | Default provided |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio |
| `npx prisma migrate dev` | Run migrations in dev |
| `npx prisma generate` | Generate Prisma Client |

## Next Steps

Once Phase 0 is complete, you'll move to:

- **Phase 1**: Daily Snapshot Engine (HuddleBooks API integration)
- **Phase 2**: Dashboard UI (Overview & Team List)
- **Phase 3**: Team Detail & Alerts
- **Phase 4**: PDF Reports
- **Phase 5**: Testing & Beta Launch

## Documentation

- [Product Requirements Document](../docs/HuddleBooks-Association-Command-Center-PRD.md)
- [Task Tracker](../docs/HuddleBooks-Association-Command-Center-TASKS.md)
- [Team HuddleBooks (Squadbooks)](../README.md)

## Support

For issues or questions:
- Review the PRD and Task Tracker
- Check Prisma logs: `npx prisma studio`
- Review Next.js logs in the terminal

---

**Last Updated**: November 24, 2025
**Version**: Phase 0 - Infrastructure Setup
