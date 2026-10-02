// Sentence pools for the typed hero. The first pass types line 0 of every pool - a short, real intro.
// After that, parts are swapped one at a time following `introSchedule`, each pool stepping through its
// own lines in order. Every line is a complete sentence. `^n` pauses typing for n ms.
// Keep lines short: the heading is sized so the longest possible combination fits in 4 lines.
export type IntroPool = { id: string; lines: string[]; /** false = starts empty and joins later. */ firstPass?: boolean };

export const introPools: IntroPool[] = [
  { id: "hello", lines: ["Hi, I'm Maruf Billah.", "Hello, I'm Maruf.", "Hey there, I'm Maruf."] },
  {
    id: "role",
    lines: [
      "I'm a Lead Software Engineer.",
      "I lead 10 engineers.",
      "I still ship code.",
      "I build full-stack apps.",
      "I design APIs that scale.",
      "I run it all on AWS.",
      "I ship with CI/CD.",
      "I deploy on Docker and ECS.",
      "I build tools teams use.",
    ],
  },
  {
    id: "experience",
    lines: [
      "I have 5+ years of professional experience.",
      "I've written 500k+ lines of code.",
      "I spent 3 years on luxury brands.",
      "I'm open to relocating globally.",
      "I prefer working on-site.",
      "I'm ready to relocate.",
    ],
  },
  {
    id: "belief",
    firstPass: false,
    lines: [
      "I believe nothing is impossible.",
      "I believe languages are just syntax.",
      "I trust experiments over opinions.",
      "I ship small and ship often.",
      "I stay curious and keep shipping.",
      "Ask me anything.",
    ],
  },
];

/** Which part changes next, in a loop. The greeting changes rarely. */
export const introSchedule = ["belief", "role", "experience", "belief", "role", "experience", "belief", "role", "hello", "belief", "role", "experience"];

export const staticIntro = "Hi, I'm Maruf Billah. I'm a Lead Software Engineer. I have 5+ years of professional experience.";

/** The longest sentence the typing loop can ever show, used to size the heading. */
export const longestIntro = introPools
  .map((p) => p.lines.map((l) => l.replace(/\^\d+/g, "")).reduce((a, b) => (b.length > a.length ? b : a), ""))
  .join(" ");

/** Things I believe - listed in the "What I believe" answer. */
export const beliefs: string[] = [
  "I believe nothing is impossible.",
  "I believe languages are just syntax.",
  "I believe good code is code the next person can change.",
  "I believe an experiment beats an opinion.",
  "I ship small, ship often and measure everything.",
  "I believe simple is hard - and worth it.",
  "I treat every bug as a lesson.",
  "I believe the best teams make each other better.",
  "I stay curious, keep learning and keep shipping.",
];
