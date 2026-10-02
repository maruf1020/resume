// Rotating sentence pools for the typed hero. One line from each pool is typed on the first pass,
// then random pools swap their line for another. `^n` pauses typing for n ms.
// Keep lines short: the heading is sized so the longest possible combination fits in 4 lines.
export type IntroPool = { id: string; lines: string[]; firstPass: boolean };

export const introPools: IntroPool[] = [
  { id: "hello", firstPass: true, lines: ["Hi.", "Hey.", "Hello.", "Hi there.", "Hey there.", "Oh,^250 hi."] },
  { id: "name", firstPass: true, lines: ["I'm Maruf.", "Maruf here.", "This is Maruf."] },
  {
    id: "work",
    firstPass: true,
    lines: [
      "I lead 10 engineers.",
      "I still ship code.",
      "I build full-stack apps.",
      "I design APIs that scale.",
      "I run it all on AWS.",
      "I ship with CI/CD.",
      "Cloud and DevOps, end to end.",
      "Docker, Lambda, ECS, EC2.",
      "I've written 500k+ lines of code.",
      "I build tools teams use.",
      "3 years in luxury e-commerce.",
    ],
  },
  { id: "where", firstPass: true, lines: ["Open to relocating globally.", "Happy to work remotely.", "On-site, abroad or remote."] },
  {
    id: "belief",
    firstPass: true,
    lines: [
      "Ask me anything.",
      "I believe nothing is impossible.",
      "Languages are just syntax.",
      "An experiment beats an opinion.",
      "Ship small, ship often.",
      "Simple is hard. Worth it.",
      "Stay curious. Keep shipping.",
    ],
  },
];

export const staticIntro = "Hi there. I'm Maruf. I lead 10 engineers. Open to relocating globally. Ask me anything.";

/** The longest sentence the typing loop can ever show, used to size the heading. */
export const longestIntro = introPools
  .map((p) => p.lines.map((l) => l.replace(/\^\d+/g, "")).reduce((a, b) => (b.length > a.length ? b : a), ""))
  .join(" ");

/** Things I believe - rotated under the heading and listed in "What I believe". */
export const beliefs: string[] = [
  "I believe nothing is impossible.",
  "I'm an engineer. Languages are just syntax.",
  "Good code is code the next person can change.",
  "An experiment beats an opinion.",
  "Ship small, ship often, measure everything.",
  "Simple is hard. That's why it's worth it.",
  "Every bug is a lesson in disguise.",
  "The best teams make each other better.",
  "Stay curious. Keep learning. Keep shipping.",
];
