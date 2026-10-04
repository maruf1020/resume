export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["JavaScript (ES6+)", "TypeScript", "SQL", "HTML5", "CSS3 / Sass", "Java", "Python"] },
  {
    group: "Front end",
    items: ["React", "Next.js (App Router)", "Vite", "Redux Toolkit", "Redux-Saga", "Zustand", "TanStack Query & Table", "React Hook Form", "MUI", "Tailwind CSS", "shadcn/ui", "Radix UI", "Framer Motion", "GSAP", "PWA"],
  },
  {
    group: "Back end",
    items: ["Node.js", "NestJS", "Express", "REST + Swagger", "WebSockets (Socket.IO)", "Background jobs (pg-boss, BullMQ)", "Middleware & integrations", "Serverless"],
  },
  {
    group: "Data",
    items: ["PostgreSQL", "MySQL", "DynamoDB", "Firestore", "Supabase", "Neon", "Prisma", "TypeORM", "Drizzle ORM"],
  },
  {
    group: "Cloud & DevOps",
    items: ["AWS Lambda", "EC2", "ECS", "S3", "SES", "SMTP", "CloudWatch", "Amplify", "Lightsail", "Azure Blob Storage", "Azure Communication Services", "Docker", "GitHub Actions", "CI/CD pipelines", "Vercel"],
  },
  {
    group: "Auth & security",
    items: ["Microsoft Entra ID (MSAL)", "OAuth 2.0", "JWT", "Auth.js", "Better Auth", "OTP login", "RBAC", "argon2 / bcrypt", "Audit logging"],
  },
  { group: "AI", items: ["Google Gemini API", "Firebase Genkit", "LLM pipelines", "Zod-validated structured output"] },
  { group: "Testing", items: ["Vitest", "Jest", "Playwright", "React Testing Library", "Supertest"] },
  { group: "Experimentation", items: ["VWO", "AB Tasty", "Optimizely", "Dynamic Yield", "Kameleoon", "Convert"] },
];

export const cloud: { name: string; where: string }[] = [
  { name: "AWS Lambda", where: "eHRMS API serverless on Lambda; Lambda functions for the QA analytics platform" },
  { name: "ECS", where: "Containerised integration middleware for a UK retail group" },
  { name: "CloudWatch", where: "Logs and monitoring for Lambda services" },
  { name: "SES & SMTP", where: "Transactional email on every project - HR system, QA platform, client apps" },
  { name: "S3", where: "Documents, exports and media - eHRMS and client apps" },
  { name: "EC2 & Lightsail", where: "Travel super-app API on EC2 (PM2, nginx); CI deploys snapshot the database before migrating" },
  { name: "Amplify", where: "Next.js hosting for the PM tool and AI Job Finder" },
  { name: "Azure Blob Storage", where: "Media storage for Service Pro Plus" },
  { name: "Azure Communication Services", where: "Email delivery for Service Pro Plus" },
  { name: "GitHub Actions", where: "CI/CD pipelines on every project, staging pipelines with smoke tests" },
  { name: "Docker", where: "Local stacks and background workers" },
];

export const education = {
  degree: "BSc in Computer Science and Engineering",
  school: "North South University",
  location: "Dhaka, Bangladesh",
  year: "2021",
  capstone:
    "Shikkha - a learning management system (Laravel) with a WebRTC video-class module (Node.js, Socket.IO, PeerJS). Wrote 136 of 233 commits in a team of 4: faculty, admin and institution dashboards and the video room.",
  courses: ["The Ultimate React Course", "Advanced CSS and Sass", "Complete Node.js Bootcamp", "The Complete JavaScript Course"],
};

export const languages: { name: string; level: string; cefr: string; score: number }[] = [
  { name: "Bengali", level: "Native", cefr: "Native", score: 6 },
  { name: "English", level: "Full professional", cefr: "C1", score: 5 },
];

export type Recommendation = { name: string; title: string; relation: string; date: string; highlight: string; text: string };

/** All LinkedIn recommendations, verbatim (highlight = the line shown as the pull quote). */
export const quotes: Recommendation[] = [
  {
    name: "Melanie Debein",
    title: "Experience Optimization Director · Team Lead, CRO",
    relation: "Worked with Maruf on the same client team",
    date: "January 2025",
    highlight: "He's an exceptional developer, incredibly thorough, and always available to help.",
    text: "I've truly enjoyed working with Maruf on the [client] project. He's an exceptional developer, incredibly thorough, and always available to help. His strong technical expertise allows him to find quick and effective solutions, which is invaluable for [client] clients. It's a real pleasure working with him on a daily basis, as he's not only highly professional but also committed to delivering top-quality work. I highly recommend him - he's a major asset to any team.",
  },
  {
    name: "Romain Berger",
    title: "Team Lead Data & Optimization, Welyft",
    relation: "Worked with Maruf on the same client team",
    date: "February 2024",
    highlight: "He consistently went above and beyond to ensure that our CRO projects were not only successful but also innovative.",
    text: "I had the pleasure of working closely with Maruf Billah for more than a year at [client]. His commitment to delivering high-quality work is truly commendable. He consistently went above and beyond to ensure that our CRO projects were not only successful but also innovative. His proficiency and expertise as a developer were evident in every project we collaborated on.",
  },
  {
    name: "S M Azad Rahman",
    title: "Head of Engineering, Echologyx",
    relation: "Managed Maruf directly",
    date: "February 2024",
    highlight: "His ability to come up with effective solutions is remarkable.",
    text: "I highly recommend Maruf as a Software Engineer specializing in A/B testing and front end framework like ReactJS. In the time I've worked with him, he consistently demonstrated exceptional proficiency and problem-solving skills. His ability to come up with effective solutions is remarkable. He is not only technically adept but also a collaborative team player. He'd be a valuable asset to any software engineering team.",
  },
  {
    name: "Saabbir Hossain",
    title: "Senior Software Engineer, EchoLogyx",
    relation: "Senior to Maruf, didn't manage him directly",
    date: "February 2024",
    highlight: "A great communicator who is able to explain complex technical concepts in a way that is easy for non-technical stakeholders to understand.",
    text: "I have had the pleasure of working with Maruf at EchoLogyx, where he has been a software engineer for the past few years. Maruf is an exceptional engineer who consistently delivers high-quality work on time and on budget. He is a great team player and always willing to go the extra mile to ensure that his team's projects are successful. Maruf is also a great communicator who is able to explain complex technical concepts in a way that is easy for non-technical stakeholders to understand. I highly recommend Maruf for any software engineering role.",
  },
  {
    name: "Rajesh Bhartia",
    title: "Software Developer",
    relation: "Worked with Maruf on a different team",
    date: "February 2024",
    highlight: "When he started, he didn't know much about Javascript, but now he's one of the best Javascript developers in our team.",
    text: "I've been working with Maruf for about 2 years, and he's been awesome. He's great at fixing problems, a team player, and a quick learner. When he started, he didn't know much about Javascript, but now he's one of the best Javascript developers in our team. Besides handling his own tasks, he's always helping out with our big React application. I love his attitude - he's always ready to listen and understand problems before jumping into solutions. He's super supportive and ready to help others. I hope we keep working together for a long time because Maruf is a valuable team member, and his contributions make a real difference.",
  },
  {
    name: "Junaid Ullah",
    title: "Senior Software Engineer · Team Lead, EchoLogyx",
    relation: "Worked with Maruf on the same team",
    date: "March 2024",
    highlight: "His work is top-notch, making our in house projects look great and function smoothly.",
    text: "I'm excited to share my thoughts on Maruf, who's been an outstanding member of our team. He's really good not only A/B Tasting but also with other frontend technologies like React, and Next.js. His work is top-notch, making our in house projects look great and function smoothly.\n\nWhat makes Maruf stand out is his eagerness to learn new things. He's always curious about the latest tech trends and is quick to pick up new skills. This helps keep our team up-to-date and ready for whatever comes our way.\n\nBesides his tech skills, Maruf is just a nice guy to be around. He's friendly, easy to talk to, and always willing to help out. Working with him is a breeze, and he makes our team stronger just by being himself.\n\nMaruf is super dedicated to his work. He's always eager to tackle new challenges and push our projects to the next level. His commitment to excellence is clear in everything he does.\n\nOverall, Maruf is not only great at what he does but also a great person to work with. I highly recommend him for any project that needs someone skilled in A/B testing, HTML, CSS, JavaScript, React, Next.js, and who's always eager to learn and grow.",
  },
  {
    name: "Sajal Karmakar",
    title: "Product Designer, Echotex (by Echologyx)",
    relation: "Worked with Maruf on the same team",
    date: "March 2024",
    highlight: "Maruf is a true team player. He goes above and beyond to assist his colleagues, offering support and guidance whenever needed.",
    text: "I have had the privilege of collaborating with Maruf Billah at Echologyx, and I am thrilled to recommend him without hesitation. As an expert software developer, Maruf consistently demonstrates unparalleled proficiency and creativity in his work.\n\nWhat truly sets Maruf apart is his warm personality and genuine friendliness. He always brings a positive energy to the team, with a smile that brightens even the busiest of days. Maruf thrives in diverse environments, embracing different perspectives and fostering collaboration.\n\nBeyond his technical skills, Maruf is a true team player. He goes above and beyond to assist his colleagues, offering support and guidance whenever needed. His proactive approach ensures that projects run smoothly and deadlines are met with ease.\n\nAdditionally, Maruf is incredibly active on LinkedIn, sharing valuable insights and engaging with the community. His dedication to professional development is evident in everything he does.\n\nIn summary, Maruf Billah is an exceptional software developer and a wonderful colleague. I wholeheartedly recommend him for any opportunity where his skills and positive attitude can shine.",
  },
  {
    name: "Sakib Mahmood Dhrubo",
    title: "Senior SQA Engineer · SDET, Brain Station 23",
    relation: "Worked with Maruf on a different team",
    date: "February 2024",
    highlight: "His expertise in JavaScript, React.js, and CRO is truly impressive.",
    text: "I highly recommend him for his exceptional web development skills. His expertise in JavaScript, React.js, and CRO is truly impressive. His dedication to delivering high-quality and efficient solutions makes him a valuable asset to any team.",
  },
  {
    name: "Thuee Mong Sing",
    title: "Frontend Developer for CRO & E-commerce",
    relation: "Worked with Maruf on a different team",
    date: "February 2024",
    highlight: "From making Android apps to AB Testing he's absolutely crushed it.",
    text: "Maruf is great at problem solving and always thrives new knowledge and skills and is always ready to take on new challenges. From making Android apps to AB Testing he's absolutely crushed it and I believe he will achieve greater stuffs as time goes by.",
  },
  {
    name: "MD. Raihanuzzaman",
    title: "Software Engineer (Front End)",
    relation: "Managed Maruf directly",
    date: "September 2024",
    highlight: "Devoted and passionate! Always finds a way around.",
    text: "devoted and passionate! always finds a way around.",
  },
];


/** Notes from the team's card (recocards.com): praise only, in their own words. */
export const farewellCard = { url: "https://recocards.com/board/farewell-maruf-120854762430", title: "Notes from the team" };

export const farewell: { name: string; text: string }[] = [
  { name: "Mélanie", text: "You've been such a solid, positive presence in the team - always reliable & kind. You're seriously one of a kind. Thank you for everything you brought to the team - both professionally and personally." },
  { name: "Yasmine", text: "Your professionalism, reliability, and openness made every collaboration easy and enjoyable. You've always been available when we needed support, and that truly made a difference." },
  { name: "Sunny", text: "Thank you Maruf for your positivity, professionalism, and quality of work on our projects! Thanks for also being such a great team player." },
  { name: "Roukaya", text: "You've been not only a great dev but also an amazing teammate. I really appreciated your help and your positive energy." },
  { name: "Arthur", text: "Maruf, it was trully a pleasure working with you, you were always kind, gentle and very efficient in your work." },
  { name: "Mathilde", text: "I really appreciated your professionalism and proactivity." },
  { name: "Yoan", text: "Thank you so much for all your support, Maruf - it's been a real pleasure working with you." },
];

export const facts: string[] = [
  "I started my career building Android apps in Java - including a transport app for BRAC.",
  "ABTestLab, my open-source A/B testing CLI, started as a side project and became the company's standard build tool.",
  "I've shipped more than 1,500 A/B experiments for luxury brands. Gift finders are my favourite kind.",
  "I built a job finder that checks employers against official visa-sponsor registers.",
  "I once built a website that slowly grows suspicious of its visitors. It's called TrustPortal.",
  "I built a tournament app in 8 days. It grew into the app my company uses for its annual tour.",
  "A teammate wrote that I barely knew JavaScript when I started - and became one of the team's best JS developers.",
  "I wrote 136 of the 233 commits on my university capstone, including a WebRTC video-class room.",
  "I'm the only developer on my company's annual-tour app - every one of its commits is mine.",
  "I built a double-entry wallet ledger for a travel super-app, so a crash mid-checkout can't lose anyone's money.",
  "The listed answers on this site aren't AI - just a very well-prepared résumé. AI only steps in for the questions I didn't see coming.",
];

export const siteStack = ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Motion", "next-themes", "Postgres (Neon)", "Gemini (free-form questions)"];
