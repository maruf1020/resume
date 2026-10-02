// Makes a FEEDBACK_ADMIN_CODE_HASH value from an admin code read on stdin (never from argv,
// so the code doesn't end up in shell history or the process list).
//   npm run -s admin:hash            then type the code (hidden) and press Enter
//   printf %s "$CODE" | npm run -s admin:hash
// Paste the printed line into .env.local as FEEDBACK_ADMIN_CODE_HASH=..., then remove FEEDBACK_ADMIN_CODE.
import { randomBytes, scryptSync } from "node:crypto";

const N = 2 ** 15;
const r = 8;
const p = 1;

/** Typed in a terminal: read without echoing. */
function readHidden() {
  return new Promise((resolve) => {
    process.stderr.write("Admin code (hidden): ");
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\u0003") {
          process.stderr.write("\n");
          process.exit(130);
        } else if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stderr.write("\n");
          resolve(value);
          return;
        } else if (ch === "\u007f" || ch === "\b") {
          value = value.slice(0, -1);
        } else {
          value += ch;
        }
      }
    };
    stdin.on("data", onData);
    stdin.resume();
  });
}

/** Piped in: read everything. */
async function readPiped() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, "");
}

const code = (process.stdin.isTTY ? await readHidden() : await readPiped()).trim();
// Same rule as hasCodeShape() in src/lib/match-intent.ts: the chat only sends text of this shape.
if (code.length < 8 || code.length > 128) {
  console.error("The code must be 8 to 128 characters so the chat box can recognise it.");
  process.exit(1);
}
if (/\s/.test(code) || code.startsWith("/")) {
  console.error("The code must not contain spaces or start with '/': the chat only checks single words.");
  process.exit(1);
}
if (!/[a-z]/i.test(code) || !/\d/.test(code) || !/[A-Z]|[^a-zA-Z0-9]/.test(code)) {
  console.error("The code needs a letter, a digit, and an uppercase letter or a symbol, or the chat treats it as a question.");
  process.exit(1);
}

if (code.length < 16) {
  console.error("Note: a random code of 16 or more characters is recommended (this one still works).");
}

const salt = randomBytes(16);
const hash = scryptSync(code, salt, 32, { N, r, p, maxmem: 256 * N * r + 1024 * 1024 });
// Colons and base64url only: Next.js loads .env files through dotenv-expand, which would treat
// "$..." as a variable reference and silently corrupt the value.
process.stdout.write(`scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${hash.toString("base64url")}\n`);
