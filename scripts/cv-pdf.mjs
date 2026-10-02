// Renders the /cv page to public/Md-Maruf-Billah-CV.pdf with headless Chrome or Edge.
// Usage: npm run build && npm run cv:pdf   (then rebuild so the new PDF is served)
import { existsSync, mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const target = resolve("public/Md-Maruf-Billah-CV.pdf");
// 46xx ports can be reserved on Windows (Hyper-V); 4421 is free on most machines.
const port = Number(process.env.CV_PORT || 4421);
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

if (!existsSync(resolve(process.env.NEXT_DIST_DIR || ".next", "BUILD_ID"))) {
  console.error("No production build found - run `npm run build` first.");
  process.exit(1);
}

const browsers = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browser = browsers.find((b) => existsSync(b));
if (!browser) {
  console.error("No Chrome/Edge found. Set CHROME_PATH.");
  process.exit(1);
}

const server = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "-p", String(port)], { stdio: "ignore" });
const stop = () => server.kill();
process.on("exit", stop);

const url = `http://localhost:${port}${base}/cv/`;
for (let i = 0; ; i++) {
  try {
    if ((await fetch(url)).ok) break;
  } catch {
    /* not up yet */
  }
  if (i > 60) {
    console.error("Server didn't start.");
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 500));
}

const child = spawn(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "cv-pdf-"))}`,
    "--no-pdf-header-footer",
    "--force-color-profile=srgb",
    "--virtual-time-budget=4000",
    `--print-to-pdf=${target}`,
    url,
  ],
  { stdio: "inherit" },
);
const timer = setTimeout(() => child.kill(), 60_000);
child.on("exit", (code) => {
  clearTimeout(timer);
  stop();
  if (code !== 0 || !existsSync(target)) {
    console.error("PDF generation failed.");
    process.exit(1);
  }
  console.log(`Wrote ${target} (${Math.round(statSync(target).size / 1024)} KB)`);
  process.exit(0);
});
