# Project Structure

This document outlines the folder and file structure for the **Vitae** project.

```text
.
├── __tests__/                      # Automated (Jest) tests
│   └── <user story>/               # Organized by feature/behavior (e.g., versions/)
│       └── <test>.test.tsx         # Specific test cases for that story
├── .github/                        # GitHub specific configurations
│   └── workflows/                  # CI/CD pipelines (GitHub Actions)
│       └── <run.yaml>              # Individual workflow definitions (e.g. tests, lint, build)
├── app/                            # Next.js App Router (Pages & API) **kebab-case**
│   ├── api/                        # Next.js API Routes (Backend/Server logic)
│   │   └── <feature>/              # API route implementations (e.g., canon, working-state)
│   │       └── route.ts            # Route handlers (GET, POST, PUT, PATCH, DELETE)
│   ├── auth/                       # Clerk Authentication Pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── <feature>/                  # Page routes (e.g., home, resume, versions)
│   │   ├── page.tsx                # Server Component
│   │   └── <feature>-client.tsx    # Client Component
│   ├── layout.tsx                  # Root application layout
│   └── globals.css                 # Global styles
├── backend/                        # External Services & Infrastructure
│   └── infra/                      # Infrastructure configuration
│       ├── docker-compose.yml      # PostgreSQL container via Docker
│       └── initdb/                 # Database initialization / migrations
│           └── 001_schema.sql      # SQL Schema scripts
├── docs/                           # Project Documentation
│   └── <README>.md                 # External Documents **ALL_CAPS**
├── lib/                            # Logic, UI, and more
│   ├── <feature>/                  # Feature-specific based on user stories (e.g., canon, versions)
│   │   ├── api.ts                  # Client-side API wrappers & network calls
│   │   ├── use<Feature>.ts         # Hooks & State management & React logic (e.g., useCanon.ts) **camelCase**
│   │   └── components/             # Specific UI components **PascalCase**
│   │       └── <ComponentName>.tsx
│   └── <shared>/                   # Any components or logic that are used by multiple features
│       ├── db.ts                   # Database configuration/connection
│       ├── schemas.ts              # Zod validation schemas
│       ├── types.ts                # Global TypeScript type definitions
│       └── utils.ts                # Generic shared helper functions
└── *                               # Root configurations (next.config.ts, jest.config.js, etc.)
```
