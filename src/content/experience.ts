export type Engagement = {
  title: string;
  role: string;
  period: string;
  bullets: string[];
  stack?: string[];
};

export type Job = {
  company: string;
  role: string;
  period: string;
  location: string;
  context?: string;
  bullets: string[];
  engagements?: Engagement[];
};

export const experience: Job[] = [
  {
    company: "Echologyx Ltd",
    role: "Lead Software Engineer",
    period: "2022 - Present",
    location: "Dhaka, Bangladesh",
    context: "Software services for UK and European clients",
    bullets: [
      "Lead a team of 10 engineers: code review and pull-request merges, technical design, estimates, mentoring and client calls.",
      "Built ABTestLab, an open-source CLI for building and live-previewing A/B tests locally, then moved the agency's 1,700-experiment CRO monorepo onto it; it now ships as the team's shared developer CLI.",
    ],
    engagements: [
      {
        title: "Global luxury group (France)",
        role: "Front-End Engineer, A/B/n experimentation",
        period: "2022 - 2025 · ~3 years",
        bullets: [
          "Built and shipped 1,500+ A/B/n experiments across 20+ luxury e-commerce brands, working daily with the client's optimisation team in France.",
          "Delivered interactive product and gift finders, size guides, mini-cart and checkout redesigns, product-page galleries, mega-menus and GSAP-animated campaigns.",
          "Wrote performance-safe DOM injection code that ran reliably across markets, devices and browsers.",
          "Automated experiment builds and checks with CI/CD pipelines on GitHub Actions.",
        ],
        stack: ["JavaScript", "SCSS", "GSAP", "Webpack", "VWO", "AB Tasty", "Dynamic Yield", "Kameleoon", "GitHub Actions"],
      },
      {
        title: "eHRMS - company HR system",
        role: "Lead Full-Stack Engineer",
        period: "2023 - Present",
        bullets: [
          "A full employee-management system for the whole company: leave, holidays, employee profiles, calendars, shifts, KPIs, time tracking and more.",
          "Joint top contributor to the React front end (268 of 973 commits, plus 150+ merged pull requests) and third-highest contributor to the NestJS API on AWS Lambda.",
          "Delivered the KPI module end to end - UI and the whole KPI API: goal templates, review periods, monthly scoring, fine-grained permissions and dashboards.",
          "Added Microsoft Entra ID single sign-on, role and permission management, leave calendar, profile change requests and data exports.",
          "Built third-party APIs that share leave and holiday data with partner systems, plus database migrations and a GitHub Actions staging pipeline with smoke tests.",
          "Cloud & DevOps: serverless API on AWS Lambda with CloudWatch logs, S3 buckets for documents and exports, SMTP/SES email, and CI/CD on GitHub Actions.",
        ],
        stack: ["React", "JavaScript", "TypeScript", "Redux-Saga", "MUI", "NestJS", "TypeORM", "PostgreSQL", "AWS Lambda", "S3", "CloudWatch", "SES / SMTP", "GitHub Actions"],
      },
      {
        title: "European CRO agency (Germany)",
        role: "Full-Stack Engineer",
        period: "2025 - 2026 · ~1 year",
        bullets: [
          "Built a QA and performance-analytics platform almost single-handedly - 92-97% of commits, ~120k lines of TypeScript and JavaScript across a NestJS API (59 data models, 38 modules) and a React 19 app.",
          "Engineered a Jira → PostgreSQL sync engine: full, incremental and webhook modes, idempotent entity mapping, per-config cron without overlapping runs, live progress over WebSockets and AES-256-GCM-encrypted API tokens.",
          "Designed a configurable KPI system: 14 KPI equations, a JSONB bug-scoring rule engine, ticket credit based on each person's share of logged hours, cached leaderboards and target boards.",
          "Integrated HR leave data from eHRMS and built a Slack bot with slash commands and daily digests.",
          "Cloud & DevOps: deployed on AWS EC2 with AWS Lambda functions, SMTP/SES email, and CI/CD pipelines on GitHub Actions.",
        ],
        stack: ["NestJS 11", "Prisma 7", "PostgreSQL", "Socket.IO", "React 19", "TanStack", "Jira API", "Slack API", "AWS EC2", "AWS Lambda", "SES / SMTP", "GitHub Actions"],
      },
      {
        title: "UK retail group",
        role: "Full-Stack Engineer, integration middleware",
        period: "2026",
        bullets: [
          "Built a middleware application connecting the main business application with the warehouse application.",
          "Developed the React (Vite) front end on a large MySQL database.",
          "Migrated application logic from Ruby to JavaScript.",
          "Cloud & DevOps: containerised with Docker and deployed on AWS ECS, with SMTP notifications and CI/CD on GitHub Actions.",
        ],
        stack: ["React", "Vite", "Node.js", "MySQL", "Docker", "AWS ECS", "SMTP", "GitHub Actions"],
      },
      {
        title: "Internal & client products",
        role: "Full-Stack Engineer",
        period: "2025 - 2026",
        bullets: [
          "ELX Project Management Tool: wrote 103 of 167 commits of an Asana-style app with realtime collaboration, email OTP login, workspace RBAC, Trello import and a CRO programme module.",
          "Service Pro Plus (UK client): built most of a garage directory and review platform with OTP login, approval workflow and Google Maps search, on AWS and Azure.",
          "Tour Console (sole developer): the company's annual-tour app - multi-tenant Microsoft login, multi-season events, tournaments, roommate matching, polls, a moderated community feed, PWA and a companion React Native app.",
          "ABTestPilot: the company's internal A/B testing CLI, used across the company for 3 years to build, preview and ship experiments.",
          "Cloud & DevOps: AWS (Amplify, EC2, S3, SES/SMTP) and Azure (Blob Storage, Communication Services), Docker, and CI/CD pipelines on GitHub Actions.",
        ],
        stack: ["AWS Amplify", "AWS EC2", "S3", "SES / SMTP", "Azure", "Docker", "GitHub Actions"],
      },
    ],
  },
  {
    company: "Goodfellas Limited",
    role: "Lead Full-Stack Engineer",
    period: "2026",
    location: "Remote",
    context: "Walton - travel and hospitality group",
    bullets: [
      "Designed and built the API for a 9-vertical travel super-app (luggage storage, hotels, flights, parking, transfers and more) as a NestJS modular monolith: 70 data models, ~236 endpoints, ~550 unit tests.",
      "Built a double-entry ledger and wallet with row-locked balance checks, and a persisted, idempotent checkout saga with compensation, so multi-supplier orders stay consistent and recover after a crash.",
      "Built resilient supplier integrations (Duffel flights) with circuit breakers and retry with backoff, geo \"near me\" discovery, and GitHub Actions deploys to AWS EC2 that snapshot the database before migrating.",
      "Built the React web app (75 pages) with traveller, partner and admin consoles, Google Maps search, live order tracking over WebSockets and QR booking passes.",
      "Shipped the group's corporate website (walton.us) with GSAP and Lottie motion and continuous deployment to cPanel behind Cloudflare.",
    ],
  },
  {
    company: "Nexkraft Limited",
    role: "Software Engineer",
    period: "2021 - 2022",
    location: "Dhaka, Bangladesh",
    bullets: ["Developed Android applications in Java, including a transport-management app for BRAC."],
  },
];
