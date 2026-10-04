export const profile = {
  name: "Md Maruf Billah",
  shortName: "Maruf",
  initials: "MB",
  role: "Lead Software Engineer",
  headline: "Full-stack JavaScript & TypeScript · React, Next.js, Node.js, NestJS · AWS & Azure",
  location: "Dhaka, Bangladesh",
  openTo: "Prefer on-site roles in Bangladesh or relocation abroad",
  /** The "Hire me" card. */
  hire: {
    lookingFor: [
      {
        k: "Roles",
        v: "Tech Lead · Engineering Lead · Senior / Lead Full-Stack Engineer",
        note: "Owning architecture, delivery and the team - while still shipping code.",
      },
      {
        k: "Where",
        v: "On-site in Dhaka or anywhere in Bangladesh, or relocation abroad",
        note: "Used to working across time zones with teams in France, the UK and Germany.",
      },
    ],
    strengths: [
      { k: "Front end", v: "React, Next.js, Redux, TanStack, Tailwind CSS - from luxury e-commerce to large dashboards" },
      { k: "Back end", v: "Node.js, NestJS, Express - REST APIs, sync engines, queues, WebSockets" },
      { k: "Cloud & DevOps", v: "AWS (Lambda, EC2, ECS, S3, SES, CloudWatch, Amplify), Azure, Docker, CI/CD on GitHub Actions" },
      { k: "Data", v: "PostgreSQL, MySQL, DynamoDB, Firestore - Prisma, TypeORM, Drizzle" },
      { k: "Programming languages", v: "JavaScript, TypeScript, Java, Python, SQL" },
      { k: "Leadership", v: "Leading a team of 10: architecture, code review, estimates, mentoring and client calls" },
    ],
  },
  email: "marufbillah03033@gmail.com",
  phone: "+880 1675 708783",
  phoneHref: "tel:+8801675708783",
  links: {
    github: "https://github.com/maruf1020",
    facebook: "https://www.facebook.com/marufbillah1020/",
    instagram: "https://www.instagram.com/marufbillah1020/",
    whatsapp: "https://wa.me/8801675708783",
    linkedin: "https://www.linkedin.com/in/marufbillah1020/",
    linkedinHandle: "linkedin.com/in/marufbillah1020",
    /** Every recommendation below is on this one LinkedIn page. */
    linkedinRecommendations: "https://www.linkedin.com/in/marufbillah1020/details/recommendations/?detailScreenTabIndex=0",
    portfolioRepo: "https://github.com/maruf1020",
  },
  cvPdf: "/Md-Maruf-Billah-CV.pdf",
  cvUpdated: "October 2026",
  summary:
    "Lead Software Engineer with 5+ years building production web applications in JavaScript and TypeScript for clients in France, the UK, Germany and the rest of Europe. Shipped 1,500+ A/B experiments over 3 years for a global luxury group, wrote 500k+ lines of code, led full-stack delivery of HR, KPI and QA-analytics platforms, and built the back end of a multi-vertical travel platform. Currently lead a team of 10 engineers, owning architecture, code review and client communication.",
  stats: [
    { value: "5+", label: "years shipping production software" },
    { value: "1,500+", label: "A/B experiments built and shipped" },
    { value: "500k+", label: "lines of JavaScript & TypeScript written" },
    { value: "10", label: "engineers in the team I lead" },
    { value: "20+", label: "luxury e-commerce brands I've built for" },
    { value: "3 yrs", label: "for a global luxury group in France" },
  ],
  /** What I do, shown under "About me". */
  focus: [
    { area: "Lead", text: "Lead a team of 10: architecture, code review, estimates, mentoring and client calls." },
    { area: "Front end", text: "JavaScript and TypeScript with React and Next.js - from luxury e-commerce experiments to large dashboards." },
    { area: "Back end", text: "Node.js and NestJS APIs on PostgreSQL: sync engines, KPI engines, ledgers and checkout flows." },
    { area: "Cloud", text: "AWS (Lambda, EC2, S3, SES, CloudWatch, Amplify) and Azure, with CI/CD on GitHub Actions." },
    { area: "Experimentation", text: "1,500+ A/B tests on VWO, AB Tasty, Dynamic Yield and Kameleoon, plus the CLI the team builds them with." },
  ],
} as const;

export type Profile = typeof profile;
