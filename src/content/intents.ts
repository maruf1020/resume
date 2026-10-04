import {
  Award,
  BookOpen,
  Briefcase,
  Cloud,
  Code2,
  Download,
  FlaskConical,
  Hammer,
  Languages,
  type LucideIcon,
  Lightbulb,
  ShieldCheck,
  Mail,
  MessageSquareHeart,
  MessageSquareText,
  Quote,
  Rocket,
  Shuffle,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import type { Block } from "@/lib/persona/types";
import { facts } from "./details";
import { profile } from "./profile";
import { projects } from "./projects";

// The job persona's questions as code. The site reads them through the persona (src/server/persona),
// which starts from this file until a job persona is published from the admin.
export type { Block };

export type Intent = {
  id: string;
  label: string;
  prompt: string;
  icon: LucideIcon;
  keywords: string[];
  /** Shown as a chip on the landing screen and in the sidebar. */
  primary?: boolean;
  /** Alternative wordings; "Regenerate" cycles through them. */
  answers: string[];
  blocks: Block[];
  followUps: string[];
};

const base: Intent[] = [
  {
    id: "about",
    label: "About me",
    prompt: "Who are you?",
    icon: User,
    primary: true,
    keywords: ["about", "who", "you", "bio", "intro", "yourself", "summary", "maruf", "profile"],
    answers: [
      "I'm **Md Maruf Billah**, a Lead Software Engineer based in Dhaka, working in **JavaScript and TypeScript** across the whole stack. For 5+ years I've built production web apps for clients in France, the UK, Germany and the rest of Europe: **1,500+ A/B experiments** for luxury e-commerce brands, the company's HR and KPI system, a QA analytics platform and the back end of a nine-vertical travel super-app - **500k+ lines of code** in all. Today I lead a team of 10 engineers, and I still ship code every week.",
      "Short version: I'm a **hands-on lead engineer**. I run a team of 10, review the code, talk to clients - and I still build the hard parts myself in JavaScript and TypeScript, from React front ends to NestJS APIs on AWS. **1,500+ experiments and 500k+ lines of code** so far.",
    ],
    blocks: [{ kind: "stats" }, { kind: "focus" }],
    followUps: ["experience", "projects", "beliefs"],
  },
  {
    id: "experience",
    label: "Experience",
    prompt: "Walk me through your experience.",
    icon: Briefcase,
    primary: true,
    keywords: ["experience", "work", "job", "career", "history", "company", "employer", "luxury", "agency", "retail", "echologyx", "nexkraft", "travel", "timeline"],
    answers: [
      "Here's my career so far. Most of it is at **Echologyx**, where I grew into Lead Software Engineer and worked on long client engagements - a global luxury group in France, a European CRO agency and a UK retail group - alongside our own HR system. Since 2024 I've also been building a travel super-app for a travel and hospitality group.",
      "Three companies, many products. At **Echologyx** I lead a team of 10 and have worked for a global luxury group, a European CRO agency and a UK retail group. Since 2024 I've also been building a travel super-app for a travel and hospitality group, and before all that I built Android apps at Nexkraft.",
    ],
    blocks: [{ kind: "experience" }],
    followUps: ["projects", "skills", "recommendations"],
  },
  {
    id: "projects",
    label: "Projects",
    prompt: "Show me your projects.",
    icon: Rocket,
    primary: true,
    keywords: ["projects", "portfolio", "work", "built", "build", "apps", "side", "github", "showcase"],
    answers: [
      "These are the projects I'm proudest of - client platforms, company products, open source and personal builds. Tap any card for the full story.",
      "Here's what I've built. The **travel super-app** and the **QA analytics platform** are my biggest back ends; **ABTestLab** is the one my whole company now uses. Tap a card for details.",
    ],
    blocks: [{ kind: "projects" }],
    followUps: ["project-travel-super-app", "project-qa-analytics", "project-ai-job-finder"],
  },
  {
    id: "skills",
    label: "Skills",
    prompt: "What's your tech stack?",
    icon: Code2,
    primary: true,
    keywords: ["skills", "stack", "tech", "technologies", "tools", "languages", "frameworks", "react", "nextjs", "node", "nestjs", "typescript"],
    answers: [
      "My core is **JavaScript and TypeScript, end to end**: React and Next.js on the front, Node.js and NestJS on the back, PostgreSQL underneath, and AWS or Azure to run it. Every skill below shows up in real projects I can walk you through.",
      "Full-stack JavaScript and TypeScript, mostly. I'm strongest in **React, Next.js, NestJS and PostgreSQL**, with plenty of AWS in production.",
    ],
    blocks: [{ kind: "skills" }],
    followUps: ["cloud", "projects", "hire"],
  },
  {
    id: "cloud",
    label: "Cloud & DevOps",
    prompt: "What's your cloud and DevOps experience?",
    icon: Cloud,
    primary: true,
    keywords: ["cloud", "devops", "aws", "azure", "lambda", "cloudwatch", "ses", "ec2", "s3", "amplify", "docker", "ci", "cd", "deploy", "github actions", "infrastructure"],
    answers: [
      "I run what I build. Our HR system's API is **serverless on AWS Lambda**, and I've shipped email, storage, hosting and CI/CD across AWS and Azure. Here's each service and where I used it.",
    ],
    blocks: [{ kind: "cloud" }],
    followUps: ["skills", "experience", "hire"],
  },
  {
    id: "cro",
    label: "A/B testing",
    prompt: "Tell me about your A/B testing work.",
    icon: FlaskConical,
    keywords: ["ab", "a/b", "testing", "cro", "experiment", "experimentation", "vwo", "optimizely", "conversion", "luxury", "abtestlab"],
    answers: [
      "For about **3 years I built A/B/n experiments for a global luxury group** - **1,500+ tests across 20+ of its brands**: product and gift finders, size guides, mini-cart and checkout redesigns, galleries and animated campaigns. To make that work faster, I built **ABTestLab**, a local build-and-preview CLI, and moved the agency's 1,700-experiment monorepo onto it."
    ],
    blocks: [{ kind: "project", id: "abtestlab" }],
    followUps: ["recommendations", "experience", "projects"],
  },
  {
    id: "education",
    label: "Education",
    prompt: "Where did you study?",
    icon: BookOpen,
    primary: true,
    keywords: ["education", "study", "studies", "university", "degree", "school", "nsu", "bsc", "college", "course", "certificate"],
    answers: [
      "I studied **Computer Science and Engineering at North South University** in Dhaka, graduating in 2021. I've kept learning since - mostly deep, project-based courses on React, Node.js and CSS.",
    ],
    blocks: [{ kind: "education" }],
    followUps: ["languages", "experience", "download"],
  },
  {
    id: "languages",
    label: "Languages",
    prompt: "Which languages do you speak?",
    icon: Languages,
    primary: true,
    keywords: ["language", "languages", "speak", "english", "bengali", "bangla", "german", "french", "cefr"],
    answers: [
      "Bengali is my native language, and I work in **English every day** - client calls, code review and documentation with teams in France, the UK and Germany.",
    ],
    blocks: [{ kind: "languages" }],
    followUps: ["hire", "contact", "about"],
  },
  {
    id: "recommendations",
    label: "Recommendations",
    prompt: "What do people say about working with you?",
    icon: Quote,
    primary: true,
    keywords: ["recommendations", "references", "testimonials", "reviews", "say", "colleagues", "linkedin", "farewell", "team", "card"],
    answers: [
      "I'd rather let people I've worked with answer this one. Here are all 10 of my LinkedIn recommendations - from a client's optimisation team to my head of engineering - plus notes from my team.",
    ],
    blocks: [{ kind: "quotes" }],
    followUps: ["hire", "contact", "experience"],
  },
  {
    id: "now",
    label: "What I'm building now",
    prompt: "What are you working on right now?",
    icon: Zap,
    keywords: ["now", "current", "currently", "working", "building", "latest", "today"],
    answers: [
      "Right now I lead my team at Echologyx. Alongside that I'm building a **travel super-app** for a travel and hospitality group (wallet ledger, checkout saga, nine travel verticals) and **AI Job Finder**, my own project.",
    ],
    blocks: [{ kind: "project", id: "travel-super-app" }, { kind: "project", id: "ai-job-finder" }],
    followUps: ["projects", "experience", "hire"],
  },
  {
    id: "hire",
    label: "Hire me",
    prompt: "Can I hire you?",
    icon: Sparkles,
    primary: true,
    keywords: ["hire", "hiring", "job", "role", "position", "available", "availability", "relocate", "relocation", "visa", "on-site", "onsite", "offer", "recruit", "work with"],
    answers: [
      `Yes - I'm **open to new roles** as a tech lead, engineering lead or senior full-stack engineer. I prefer working **on-site** - in Bangladesh, or **relocating abroad** for the right team. The quickest way to reach me is email at **${profile.email}**, or call me on **${profile.phone}**.`,
      `I'd love to hear about it. I'm looking for **lead and senior full-stack roles** - leading a team and still shipping code across front end, back end and cloud. I prefer on-site work, in Bangladesh or relocating abroad. Email **${profile.email}** or call **${profile.phone}**.`,
    ],
    blocks: [{ kind: "hire" }],
    followUps: ["message", "download", "recommendations"],
  },
  {
    id: "contact",
    label: "Contact",
    prompt: "How can I contact you?",
    icon: Mail,
    primary: true,
    keywords: ["contact", "email", "mail", "phone", "call", "reach", "linkedin", "github", "message", "talk"],
    answers: ["Here's how to reach me. Email is fastest - I usually reply within a day. Or leave a message right here."],
    blocks: [{ kind: "contact" }, { kind: "contact-form" }],
    followUps: ["hire", "download", "feedback"],
  },
  {
    id: "message",
    label: "Send a message",
    prompt: "I'd like to get in touch.",
    icon: MessageSquareText,
    keywords: ["message", "write", "send", "form", "contact us", "get in touch", "inquiry", "enquiry", "reach out", "talk"],
    answers: ["Great - leave your details and a short note, and I'll get back to you, usually within a day."],
    blocks: [{ kind: "contact-form" }],
    followUps: ["hire", "download", "recommendations"],
  },
  {
    id: "feedback",
    label: "Share feedback",
    prompt: "I have some feedback on your site.",
    icon: MessageSquareHeart,
    primary: true,
    keywords: ["feedback", "review", "rate", "rating", "suggest", "suggestion", "improve", "opinion", "thoughts", "site"],
    answers: ["I'd love to hear it. What worked, what didn't, what you'd add - every note helps."],
    blocks: [{ kind: "feedback-form" }],
    followUps: ["projects", "contact", "surprise"],
  },
  {
    id: "download",
    label: "Download CV",
    prompt: "Can I download your CV?",
    icon: Download,
    primary: true,
    keywords: ["download", "cv", "resume", "résumé", "pdf", "file", "print"],
    answers: ["Of course. Here's my CV as a PDF - or open the plain web version if you'd rather read it in the browser."],
    blocks: [{ kind: "download" }],
    followUps: ["hire", "contact", "experience"],
  },
  {
    id: "surprise",
    label: "Surprise me",
    prompt: "Tell me something surprising.",
    icon: Shuffle,
    primary: true,
    keywords: ["surprise", "fun", "fact", "random", "interesting", "something", "joke"],
    answers: facts,
    blocks: [],
    followUps: ["surprise", "projects", "about"],
  },
  {
    id: "beliefs",
    label: "What I believe",
    prompt: "What do you believe in as an engineer?",
    icon: Lightbulb,
    keywords: ["believe", "beliefs", "values", "principles", "philosophy", "motto", "quote", "quotes", "mindset", "approach"],
    answers: ["A few things I believe, and try to work by every day:"],
    blocks: [{ kind: "beliefs" }],
    followUps: ["about", "recommendations", "hire"],
  },
  {
    id: "privacy",
    label: "Privacy",
    prompt: "How do you use my data?",
    icon: ShieldCheck,
    keywords: ["privacy", "data", "cookies", "cookie", "gdpr", "tracking", "analytics", "consent"],
    answers: ["Simply and honestly. Here's exactly what this site keeps, and you can change your choice any time:"],
    blocks: [{ kind: "privacy" }],
    followUps: ["stack", "contact", "about"],
  },
  {
    id: "stack",
    label: "How this site works",
    prompt: "How did you build this site?",
    icon: Hammer,
    keywords: ["site", "website", "this", "built", "how", "ai", "chatgpt", "gemini", "llm", "model", "bot", "real"],
    answers: [
      "Mostly no AI. It's a **Next.js app** whose listed answers are all written from my CV, so nothing in them is invented. If you ask something none of them covers, **Google's Gemini** writes a short answer from that same CV text - labelled as AI, and with nothing else as its source. The site keeps a small database: anonymous counts of pages and questions, what you choose to send me - messages, feedback, thumbs up or down and free-form questions - and basic device details only if you accept. No third-party trackers, no ads.",
    ],
    blocks: [{ kind: "stack" }],
    followUps: ["projects", "privacy", "surprise"],
  },
];

const projectIntents: Intent[] = projects.map((p) => ({
  id: `project-${p.id}`,
  label: p.name,
  prompt: `Tell me about the ${p.name} project.`,
  icon: Award,
  keywords: [p.name.toLowerCase(), ...p.name.toLowerCase().split(/\s+/), p.id, ...p.stack.map((s) => s.toLowerCase())],
  answers: [`**${p.name}**: ${p.tagline}`],
  blocks: [{ kind: "project", id: p.id }],
  followUps: [...projects.filter((o) => o.id !== p.id).slice(0, 2).map((o) => `project-${o.id}`), "download"],
}));

export const fallbackIntent: Intent = {
  id: "fallback",
  label: "Not sure",
  prompt: "",
  icon: Sparkles,
  keywords: [],
  answers: [
    "That one's outside what this chat covers - I only answer from my CV. Try one of these:",
    "Good question, but I keep this chat to my own work and CV. How about one of these?",
  ],
  blocks: [{ kind: "suggest" }],
  followUps: [],
};

export const intents: Intent[] = [...base, ...projectIntents];
export const primaryIntents = intents.filter((i) => i.primary);

const byId = new Map(intents.map((i) => [i.id, i]));
export const getIntent = (id: string): Intent | undefined => byId.get(id);
