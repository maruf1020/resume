// Wording for the printable CV (/cv and the PDF). Same facts as the chat, written tighter:
// achievement-first bullets, numbers where they're verified, 2 A4 pages.

export const cv = {
  /** European CVs (DE/FR/NL...) usually include a photo; set false for UK/US/IE applications. */
  showPhoto: true,
  title: "Lead Software Engineer · Full-Stack (JavaScript & TypeScript)",
  availability: "Prefers on-site roles - in Bangladesh or relocating abroad",
  photo: "/images/cv-photo.webp",

  profile:
    "Lead Software Engineer with 5+ years of shipping production web platforms in JavaScript and TypeScript for clients in France, the UK and Germany. I lead a team of 10 and still write a large share of the code - React and Next.js, Node.js and NestJS, PostgreSQL, and AWS/Azure with CI/CD - and I'm known for owning hard problems end to end, from sync and KPI engines to a double-entry wallet and crash-safe checkout.",

  highlights: [
    "Shipped 1,500+ A/B experiments for 20+ brands of a global luxury group over 3 years.",
    "Lead 10 engineers; joint top contributor to the company HR platform (268 commits, 150+ merged PRs).",
    "Built a QA analytics platform almost alone: ~120k lines, 59 data models, 92-97% of commits.",
    "Built the company's A/B tooling: ABTestLab (open source) and ABTestPilot, used company-wide for 3 years.",
  ],

  skills: [
    { k: "Languages", v: "JavaScript (ES6+), TypeScript, SQL, HTML5, CSS3 / Sass, Java, Python" },
    { k: "Front end", v: "React, Next.js, Redux Toolkit, Redux-Saga, Zustand, TanStack, Tailwind CSS, MUI, shadcn/ui, GSAP, PWA" },
    { k: "Back end", v: "Node.js, NestJS, Express, REST + Swagger, WebSockets (Socket.IO), background jobs (BullMQ, pg-boss), integrations and middleware" },
    { k: "Cloud & DevOps", v: "AWS (Lambda, EC2, ECS, S3, SES, CloudWatch, Amplify, Lightsail), Azure (Blob Storage, Communication Services), Docker, GitHub Actions CI/CD, Vercel" },
    { k: "Data", v: "PostgreSQL, MySQL, DynamoDB, Firestore, Supabase; Prisma, TypeORM, Drizzle ORM" },
    { k: "Security & quality", v: "Entra ID (MSAL), OAuth 2.0, JWT, OTP, RBAC, AES-256-GCM, audit logging; Vitest, Jest, Playwright, Supertest" },
    { k: "Experimentation", v: "VWO, AB Tasty, Optimizely, Dynamic Yield, Kameleoon, Convert" },
    { k: "Leadership", v: "Leading 10 engineers, architecture, estimates, code review, mentoring, client communication" },
  ],

  experience: [
    {
      company: "Echologyx Ltd",
      role: "Lead Software Engineer",
      period: "2022 - Present",
      location: "Dhaka, Bangladesh",
      context: "Software and experimentation services for clients in France, the UK and Germany.",
      bullets: [
        "Lead a team of 10 engineers: technical design, code review and merges, estimates, mentoring and client calls.",
        "Built ABTestLab (open-source A/B test CLI) and moved the agency's 1,700-experiment monorepo onto it; with ABTestPilot it is the team's standard tooling.",
      ],
      engagements: [
        {
          title: "Global luxury group (France) - Front-End Engineer, A/B/n experimentation",
          period: "2022 - 2025",
          bullets: [
            "Built and shipped 1,500+ A/B/n experiments across 20+ luxury e-commerce brands, working daily with the client's optimisation team in France.",
            "Delivered product and gift finders, size guides, checkout redesigns and animated campaigns with performance-safe DOM injection across markets.",
          ],
          stack: "JavaScript, SCSS, GSAP, VWO, AB Tasty, Dynamic Yield, Kameleoon, GitHub Actions",
        },
        {
          title: "eHRMS - company employee-management platform - Lead Full-Stack Engineer",
          period: "2023 - Present",
          bullets: [
            "Company-wide platform for leave, holidays, profiles, calendars, shifts, KPIs and time tracking; joint top contributor to the React front end (268 of 973 commits, 150+ merged PRs) and third-highest on the NestJS API.",
            "Delivered the KPI module end to end (UI and API): goal templates, review periods, monthly scoring, permissions and dashboards; added Microsoft Entra ID SSO and partner APIs for leave data.",
            "Serverless API on AWS Lambda with CloudWatch, S3 storage, SES/SMTP email and a GitHub Actions staging pipeline with smoke tests.",
          ],
          stack: "React, TypeScript, Redux-Saga, MUI, NestJS, TypeORM, PostgreSQL, AWS Lambda, S3",
        },
        {
          title: "European CRO agency (Germany) - Full-Stack Engineer, QA & performance analytics",
          period: "2025 - 2026",
          bullets: [
            "Built the QA and performance-analytics platform almost single-handedly (92-97% of commits, ~120k lines): NestJS API with 59 data models and 38 modules, React 19 front end, on AWS EC2 and Lambda with SES/SMTP and GitHub Actions CI/CD.",
            "Engineered a Jira-to-PostgreSQL sync engine (full, incremental and webhook modes, idempotent mapping, per-config cron, live WebSocket progress, AES-256-GCM-encrypted tokens).",
            "Designed a configurable KPI system: 14 KPI equations, a JSONB bug-scoring rule engine, hours-share ticket attribution, cached leaderboards and target boards; Slack bot and HR-system integration.",
          ],
          stack: "NestJS 11, Prisma 7, PostgreSQL, Socket.IO, React 19, TanStack, AWS EC2, Lambda",
        },
        {
          title: "UK retail group - Full-Stack Engineer, integration middleware",
          period: "2026",
          bullets: [
            "Built middleware connecting the main business application with the warehouse application, with a React (Vite) front end on a large MySQL database.",
            "Migrated application logic from Ruby to JavaScript; containerised with Docker and deployed on AWS ECS with CI/CD on GitHub Actions.",
          ],
          stack: "React, Vite, Node.js, MySQL, Docker, AWS ECS",
        },
        {
          title: "Internal and client products",
          period: "2025 - 2026",
          bullets: [
            "ELX Project Management Tool: 103 of 167 commits of an Asana-style app with realtime collaboration, RBAC and a CRO module.",
            "Service Pro Plus (UK client): most of a garage directory and review platform with OTP login and Maps search, on AWS and Azure.",
            "Tour Console (sole developer): the company's annual-tour app - tournaments, roommate matching, polls, moderated feed - plus a React Native app.",
          ],
          stack: "Next.js, Prisma, PostgreSQL, Firebase, Socket.IO, AWS (Amplify, EC2, S3, SES), Azure, Docker",
        },
      ],
    },
    {
      company: "Goodfellas Limited (Walton)",
      role: "Lead Full-Stack Engineer",
      period: "2026",
      location: "Remote",
      context: "Travel and hospitality group.",
      bullets: [
        "Designed and built the API for a 9-vertical travel super-app as a NestJS modular monolith: 70 data models, ~236 endpoints and ~550 unit tests.",
        "Built a double-entry ledger and wallet with row-locked balance checks and an idempotent checkout saga with compensation, so multi-supplier orders recover after a crash.",
        "Added resilient supplier integrations (circuit breakers, backoff), a 75-page React app, EC2 deploys that snapshot the database before migrating, and walton.us.",
      ],
      engagements: [],
    },
    {
      company: "Nexkraft Limited",
      role: "Software Engineer",
      period: "2021 - 2022",
      location: "Dhaka, Bangladesh",
      context: "",
      bullets: ["Developed Android applications in Java, including a transport-management app for BRAC."],
      engagements: [],
    },
  ],

  projects: [
    {
      name: "AI Job Finder",
      meta: "Next.js 16, Prisma 7, PostgreSQL, pg-boss, Gemini",
      text: "Job search and outreach platform with 9-factor + LLM ranking, visa-sponsor checks and a self-checking email pipeline (~29k lines, 147 tests).",
    },
    {
      name: "ABTestLab",
      meta: "Node.js, WebSocket, Rollup, Sass",
      text: "Open-source CLI to build and live-preview A/B tests for any platform; adopted company-wide (192 commits).",
    },
    {
      name: "TrustPortal, ShadowFeed, TournaTrack",
      meta: "Next.js, Prisma, Firebase",
      text: "An interaction-design concept site, an anonymous moderated company feed, and the tournament app that became Tour Console.",
    },
  ],

  education: {
    degree: "BSc in Computer Science and Engineering",
    school: "North South University, Dhaka",
    year: "2021",
    note: "Capstone: Shikkha, an LMS with WebRTC video classes (136 of 233 commits, team of 4).",
  },

  courses: ["The Ultimate React Course", "Advanced CSS and Sass", "Complete Node.js Bootcamp", "The Complete JavaScript Course"],

  languages: [
    { name: "Bengali", level: "Native" },
    { name: "English", level: "C1 - full professional (CEFR)" },
  ],
};
