export type Project = {
  id: string;
  name: string;
  year: string;
  kind: "Personal" | "Open source" | "Work" | "Freelance";
  tagline: string;
  problem: string;
  built: string[];
  numbers: string[];
  stack: string[];
  link?: { label: string; href: string };
};

export const projects: Project[] = [
  {
    id: "ai-job-finder",
    name: "AI Job Finder",
    year: "2026",
    kind: "Personal",
    tagline: "Job search and outreach platform with rule + LLM ranking and a self-checking email pipeline.",
    problem:
      "Finding international roles with visa sponsorship means checking dozens of job boards, employer registers and inboxes by hand.",
    built: [
      "Pulls jobs from 14 sources plus Greenhouse, Lever, Ashby, Workday and Recruitee boards, and merges reposts into one record.",
      "Explainable 9-factor rule score, then an LLM fit score in batches that halve and retry on malformed output.",
      "Checks employers against official visa-sponsor registers for Ireland, the UK and the Netherlands.",
      "Email pipeline: draft → autofix → deterministic linter → LLM judge → rewrite, keeping every version for review.",
      "Gemini key pool with encrypted keys, per-model daily quotas and automatic fallback to cheaper models.",
    ],
    numbers: ["~29k lines of code", "26 data models", "147 test cases", "8 background queues"],
    stack: ["Next.js 16", "React 19", "Prisma 7", "PostgreSQL", "pg-boss", "Gemini", "Gmail API", "Playwright", "Docker"],
  },
  {
    id: "travel-super-app",
    name: "Travel Super-App",
    year: "2024 - Present",
    kind: "Work",
    tagline: "Nine travel verticals on one platform, with a double-entry wallet and a crash-safe checkout.",
    problem:
      "A luggage-storage marketplace needed to grow into hotels, flights, parking, transfers, eSIM and more - without orders going inconsistent when one of several suppliers fails mid-checkout.",
    built: [
      "NestJS modular monolith: 70 data models, ~236 endpoints and role-scoped permissions for travellers, partners and admins.",
      "Double-entry ledger and wallet with row-locked balance checks inside one transaction, so money can't be double-spent.",
      "Persisted, idempotent checkout saga (reserve → authorize → confirm → capture) with compensation and crash recovery; outbox and idempotency keys.",
      "Supplier adapter framework with per-supplier timeouts, retry with backoff and circuit breakers; live Duffel flights adapter.",
      "React web app (75 pages): Google Maps discovery, geolocation, live order tracking over WebSockets and QR booking passes.",
      "GitHub Actions deploys to AWS EC2 that snapshot the database before running migrations.",
    ],
    numbers: ["~57k lines API + ~58k lines web", "70 data models", "~550 unit tests", "100% of commits"],
    stack: ["NestJS 11", "Prisma", "PostgreSQL", "BullMQ", "Socket.IO", "React", "Tailwind", "Google Maps", "AWS EC2"],
  },
  {
    id: "qa-analytics",
    name: "QA Analytics Platform",
    year: "2025 - 2026",
    kind: "Work",
    tagline: "Jira-synced bug tracking with 14 team KPIs, leaderboards and target boards, built almost single-handedly.",
    problem:
      "An agency's QA and dev teams tracked bugs in Jira and spreadsheets, with no fair, shared way to measure quality and delivery per person.",
    built: [
      "Jira → PostgreSQL sync engine with full, incremental and webhook modes; idempotent entity mapping and orphan clean-up.",
      "One cron job per Jira config with overlap protection, and live sync progress streamed over WebSockets.",
      "API tokens encrypted with AES-256-GCM; webhooks verified with timing-safe HMAC-SHA256.",
      "14 KPI equations and a JSONB rule engine for bug scoring; ticket credit based on each person's share of logged hours.",
      "Decorator-based permission system (any/all logic) whose permissions are seeded by scanning the compiled controllers.",
      "React 19 + TanStack app with performance boards, KPI radar charts, Excel exports and multi-tab-safe token refresh.",
      "Started from a Next.js prototype I built in a month (Jira and CSV import, RBAC, charts) to prove the idea.",
    ],
    numbers: ["92-97% of commits", "~120k lines of code", "59 data models", "38 API modules"],
    stack: ["NestJS 11", "Prisma 7", "PostgreSQL", "Socket.IO", "React 19", "TanStack", "Recharts", "Jira API", "Slack API"],
  },
  {
    id: "abtestlab",
    name: "ABTestLab",
    year: "2025",
    kind: "Open source",
    tagline: "CLI to build and live-preview A/B tests locally, adopted company-wide.",
    problem:
      "A/B test developers were writing variations straight into vendor dashboards, with no local tooling, bundling or live reload.",
    built: [
      "Scaffolds websites, tests, touchpoints and variations; bundles JS and SCSS with Rollup.",
      "Runs single, grouped and multi-touchpoint tests in parallel, for VWO, AB Tasty, Optimizely, Dynamic Yield, Kameleoon and Convert.",
      "Local WebSocket server pushes rebuilt code to the browser, which checks targeting and goals before showing the variation.",
      "In-page status panel with search, sort and per-test details, plus a migration script for old projects.",
      "Ported into the company's shared services repo and used to restructure a 1,700-experiment monorepo onto one scaffold / start / build workflow.",
    ],
    numbers: ["192 commits", "~7.9k lines", "Adopted as the company's shared CLI"],
    stack: ["Node.js", "WebSocket", "Rollup", "Sass", "Chokidar", "Commander"],
    link: { label: "github.com/maruf1020/ABTestLab", href: "https://github.com/maruf1020/ABTestLab" },
  },
  {
    id: "ab-testing-cli",
    name: "Internal A/B Testing CLI",
    year: "3 years in use",
    kind: "Work",
    tagline: "The company's internal A/B testing CLI, used across the company for 3 years.",
    problem: "A CRO team shipping experiments every week needed one shared, reliable way to build, preview and ship A/B tests.",
    built: [
      "Internal command-line tool the developers use to build, preview and ship A/B tests.",
      "In daily use across the company for 3 years.",
    ],
    numbers: ["3 years in production use", "Used company-wide"],
    stack: ["Node.js", "JavaScript", "TypeScript"],
  },
  {
    id: "hr-platform",
    name: "Company HR Platform",
    year: "2023 - now",
    kind: "Work",
    tagline: "The company's full employee-management system. I'm the joint top contributor to its front end and built its KPI module.",
    problem: "The company ran HR, leave, timesheets and KPIs across spreadsheets and disconnected tools.",
    built: [
      "Covers the whole employee lifecycle: leave, holidays, employee profiles, calendars, shifts, KPIs, time tracking and more.",
      "KPI module end to end: goal templates, review periods, monthly scoring, permissions and dashboards.",
      "Microsoft Entra ID single sign-on, role and permission management, menu management.",
      "Leave calendar, profile change-request wizard, managerial tree and timesheet/employee exports.",
      "Third-party APIs sharing leave and holiday data with partner systems; migrations and a GitHub Actions staging pipeline.",
    ],
    numbers: ["268 of 973 front-end commits (joint 1st)", "3rd-highest API contributor", "150+ PRs merged"],
    stack: ["React", "JavaScript", "TypeScript", "Redux-Saga", "MUI", "NestJS", "TypeORM", "PostgreSQL", "AWS Lambda"],
  },
  {
    id: "pm-tool",
    name: "Project Management Tool",
    year: "2026",
    kind: "Work",
    tagline: "Asana-style work management with realtime collaboration and a CRO programme module.",
    problem: "The team needed one place to plan work and run a CRO programme from research to test results.",
    built: [
      "Email OTP two-step login, workspace RBAC with custom roles, secure invites and multi-account switching.",
      "Realtime channels, notification batching, Trello import, templates and board filters.",
      "CRO programme module: research, test lifecycle with computed statistics, launch gates and shareable reports.",
      "Convert.com integration to import A/B tests; deployed on AWS with backup-and-restore drills.",
    ],
    numbers: ["103 of 167 commits", "24-table CRO module", "Playwright smoke + a11y checks"],
    stack: ["Next.js", "Prisma", "PostgreSQL", "Better Auth", "Socket.IO", "pg-boss", "Docker", "AWS"],
  },
  {
    id: "tour-app",
    name: "Company Tour App",
    year: "2025 - 2026",
    kind: "Work",
    tagline: "The company's annual-tour app. I'm its only developer.",
    problem: "Running a company-wide annual tour meant juggling rooms, schedules, tournaments and announcements across chats and spreadsheets.",
    built: [
      "Multi-tenant Microsoft login and an admin console for events, programmes and seasons, with season migration.",
      "Tournament brackets and matches, an event map and a programme explorer on Google Maps.",
      "Roommate matching and room generation with Excel export; polls with an analytics page.",
      "Community feed with moderation and mentions, notifications, and a PWA with a service worker.",
      "Companion mobile app in React Native (Expo) on the same Firebase back end.",
    ],
    numbers: ["Sole developer", "56 of 56 commits"],
    stack: ["Next.js", "Firebase", "Genkit", "Gemini", "Google Maps", "GSAP", "TanStack Table"],
  },
  {
    id: "trustportal",
    name: "TrustPortal",
    year: "2026",
    kind: "Personal",
    tagline: "A satirical 23-page SaaS site whose hidden trust score changes how the whole site behaves.",
    problem: "An experiment in interaction design: what if a website slowly grew suspicious of you?",
    built: [
      "Trust-score engine with six levels that changes the site's tone and behaviour.",
      "Hand-drawn component kit built on Rough.js.",
      "Seeded RNG so server and client HTML match; full keyboard and reduced-motion support.",
    ],
    numbers: ["23 pages", "~7.9k lines"],
    stack: ["Next.js", "JavaScript", "TypeScript", "Radix UI", "Framer Motion", "Rough.js"],
    link: { label: "github.com/maruf1020/TrustPortal", href: "https://github.com/maruf1020/TrustPortal" },
  },
  {
    id: "shadowfeed",
    name: "ShadowFeed",
    year: "2026",
    kind: "Personal",
    tagline: "Anonymous company feed with moderation and a full audit log.",
    problem: "Teams wanted a safe, anonymous place to share feedback without losing moderation.",
    built: [
      "Quiz gate before signup, posts, comments, 8 reaction types and polls, all validated with Zod in server actions.",
      "Admin moderation and suspensions, audit logging of 20 action types, recovery-question password reset.",
    ],
    numbers: ["~4.9k lines", "20 audited action types"],
    stack: ["Next.js", "NextAuth", "Prisma", "PostgreSQL", "TanStack Query", "Zod"],
    link: { label: "github.com/maruf1020/ShadowFeed", href: "https://github.com/maruf1020/ShadowFeed" },
  },
  {
    id: "tournatrack",
    name: "TournaTrack",
    year: "2025",
    kind: "Personal",
    tagline: "Tournament platform that grew into the company's annual-tour app.",
    problem: "The company's annual tour ran its tournaments on paper and spreadsheets.",
    built: [
      "Knockout, group-stage and battle-royale brackets, live scores and an interactive bracket tree.",
      "Excel employee import, Microsoft sign-in, multi-admin roles and full backup and restore.",
      "Gemini matchup suggestions through a Genkit flow with Zod-typed input and output.",
    ],
    numbers: ["~11.6k lines", "Built in 8 days"],
    stack: ["Next.js", "Firebase", "Genkit", "Gemini", "shadcn/ui"],
    link: { label: "github.com/maruf1020/TournaTrack", href: "https://github.com/maruf1020/TournaTrack" },
  },
  {
    id: "resume-builder",
    name: "Resume Builder",
    year: "2026 · in progress",
    kind: "Personal",
    tagline: "One set of layout primitives renders the résumé in the editor and as a PDF.",
    problem: "Most résumé builders show one thing on screen and export something slightly different.",
    built: [
      "Shared render primitives for the browser editor and the PDF, covered by a dual-backend test.",
      "Versioned, Zod-validated document schema with migrations; 7 section archetypes; themes and font pairs.",
      "Zustand editor store with autosave and undo/redo; credentials and Google login with argon2.",
    ],
    numbers: ["~7.5k lines", "7 section archetypes"],
    stack: ["Next.js", "Auth.js", "Prisma", "PostgreSQL", "Zustand", "Zod", "React PDF"],
  },
];

export const projectById = (id: string) => projects.find((p) => p.id === id);
