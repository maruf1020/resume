# Maruf Billah - portfolio

A portfolio you can chat with. It looks like ChatGPT or Claude, but every answer is written from my CV:
visitors pick from allowed questions (chips, the sidebar, or typing, which filters the list), and the
"assistant" streams a pre-written answer with rich cards. Nothing in those answers is generated, so nothing is made up.
A question none of them covers can go to Google's Gemini, which answers from the same CV text only (optional: set
`GEMINI_API_KEY`); those answers are labelled as AI.

Visitors can also send a message, share feedback, and give each answer a thumbs up or down. All of that
is stored in a Postgres database (Neon), and a private inbox shows it grouped by visitor.

The same app can show more than one **persona**: the job portfolio (the default, built from `src/content`)
and, for example, a marriage biodata in English and Bangla with details shared only through access codes.
Each persona is edited in the admin's **Persona Studio** and goes live with **Publish & train**, without a rebuild.

Built with Next.js 16, React 19, JavaScript and TypeScript, Tailwind CSS v4 and Motion.

## Run it

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL, BETTER_AUTH_SECRET and PERSONA_SIGNING_SECRET
npm run admin:create -- --email you@example.com   # once: the admin account (asks for the password, hidden)
npm run dev                  # http://localhost:3000 (applies database migrations on start)
npm run build && npm start   # production
npm run cv:pdf               # after a build: renders /cv to public/Md-Maruf-Billah-CV.pdf (headless Chrome/Edge)
npm run check                # typecheck + lint + unit tests + production build
npm test                     # unit tests (vitest; never calls a model)
npm run eval                 # asks a persona's AI the questions in evals/<persona>.json with the real model (see "AI evals")
npm run db:migrate           # applies pending migrations by hand (`-- --check` only lists them)
npm run db:import            # copies an old data/feedback.json (or an inbox export) into the database
```

After `cv:pdf`, rebuild so the new PDF is served. While `npm run dev` is running, build into a separate folder instead so the dev server isn't disturbed: `NEXT_DIST_DIR=.next-cv npx next build && NEXT_DIST_DIR=.next-cv npm run cv:pdf`. Every `.next*` folder is git-ignored and skipped by Tailwind. A build into a private folder uses `tsconfig.private.json` (git-ignored, created on demand, it only extends `tsconfig.json`), so `tsconfig.json` is left alone. Next still rewrites the git-ignored `next-env.d.ts` to point at that folder; the next `npm run dev` or `npm run build` puts it back to `.next`. If an older build added `.next-<name>` lines to `tsconfig.json`, remove them by hand.

## Environment (server-only, never sent to the browser)

| Variable | What it does |
|---|---|
| `DATABASE_URL` | Postgres connection string (a Neon database works well; keep `sslmode=require`). Required: without it every write and the admin answer 503, and the site shows the job persona from the code. The schema is `migrations/*.sql`, applied on start |
| `BETTER_AUTH_SECRET` | Signs and encrypts the admin login's cookies and codes. 32+ random characters, required in production. Changing it signs every device out and voids the backup codes |
| `BETTER_AUTH_URL` | The site's public address (`https://...` in production; `http://` makes the cookies non-Secure, for local tests only) |
| `ADMIN_OTP_STATIC` | Temporary fixed sign-in code (4 to 10 digits, e.g. `112233`). While set, nothing is emailed and every sign-in accepts it; the page still says "check your email". A warning is printed at every start. Remove it once `MAIL_PROVIDER` sends real codes |
| `MAIL_PROVIDER`, `MAIL_FROM`, `RESEND_API_KEY` | How sign-in codes are sent: `log` (server log, development default), `none` (production default), `resend` |
| `PERSONA_ROUTING`, `DEFAULT_PERSONA`, `PERSONA_HOSTS`, `PERSONA_PREFIXES` | Which persona a request shows: `single` (default: `DEFAULT_PERSONA`, `job`), `host` (by host name) or `prefix` (by path, e.g. `/biodata`). See `.env.example` |
| `PERSONA_SIGNING_SECRET` | Signs visitor access cookies (unlocked details), the admin's draft preview and PDF print links. 32+ characters, required in production |
| `DOCS_DIR` | Where the PDFs printed at each publish are kept (default `var/documents`, git-ignored). Outside `public/`: they are served by `/d/<file>` only to visitors allowed to see them. Keep it on a persistent disk |
| `CHROME_PATH` | Chrome or Chromium used to print those PDFs (found automatically in the usual places). Without one, publishing still works and only the PDF is skipped |
| `PDF_BASE_URL` | The address this server can reach itself on, for printing (default `http://127.0.0.1:$PORT`, else the publishing request's address) |
| `TRUST_PROXY_HOPS` | Reverse proxies in front of the app. **Production behind nginx: `1`** (set in `ecosystem.config.cjs`). Default `0` ignores `X-Real-IP` and `X-Forwarded-For`, which visitors can forge, so every visitor shares one rate limit; the server logs a warning at startup when it is `0` in production |
| `GEMINI_API_KEY` | Turns on AI answers for free-form questions (`POST /api/ask/`). Empty = off: the chat says "outside what this chat covers" as before |
| `AI_MODEL` (or `GEMINI_MODEL`) | Gemini model for those answers and the Studio's AI helpers (default `gemini-2.5-flash`; it must support JSON output). Read per request, so no rebuild is needed after changing the key |
| `AI_FALLBACK_MODEL` (or `GEMINI_FALLBACK_MODEL`) | Asked as well when the first model hasn't answered after 5 s, is busy or has been retired; the first answer wins (default `gemini-3.5-flash-lite`; empty to disable) |
| `AI_EMBEDDING_MODEL` | Embeddings for the knowledge index (default `gemini-embedding-2`, 768 dimensions). Changing it re-indexes on the next publish |
| `AI_DAILY_LIMIT` | Answered free-form questions per day, across everyone (default 500), so a bot can't run up the bill |
| `ENABLE_HSTS` | `1` sends `Strict-Transport-Security` (only once the site is on HTTPS for good) |
| `NEXT_PUBLIC_BASE_PATH` | Optional, when the site is served under a sub-path |
| `NEXT_PUBLIC_SITE_URL` | Set in production: public URL for canonical links, Open Graph, `robots.txt` and `sitemap.xml` (falls back to localhost, with a build warning) |

None of these variables may ever start with `NEXT_PUBLIC_`: they are read only by server code and never reach the browser bundle.

**The admin account:** there is exactly one. Create it with `npm run admin:create -- --email you@example.com` (it asks for the password twice without showing it, turns on the code step and prints backup codes once). The same script shows the account (`--show`), resets the password (`--reset-password`), changes the email (`--set-email new@example.com`), signs out every device (`--revoke-sessions`), clears lockouts (`--unlock`) and sets up the code step again (`--reset-2fa`). It uses `DATABASE_URL` and `BETTER_AUTH_SECRET` from `.env.local`.

## Feedback store and inbox

- **Endpoints:**
  - `POST /api/contact/`: name, email, optional company, message.
  - `POST /api/feedback/`: 1-5 rating and/or message, optional name and email.
  - `POST /api/vote/`: one 👍/👎 per visitor per answer wording; voting the same way again removes it.
  - `POST /api/ask/`: a free-form question plus the last few turns of the chat (only when `GEMINI_API_KEY` is set). Answers with a curated topic to play, a short AI answer with cards and follow-ups, or a decline; on any error the chat shows its usual fallback. 20 per 10 minutes per client, `AI_DAILY_LIMIT` answered questions per day overall. Every question and outcome is kept in the `ai_answers` table (newest 5,000).
  - `GET /api/health/`: `{ ok: true }` when the database answers (for uptime checks).
- **Storage:** everything lives in a Postgres database (`DATABASE_URL`): tables `contacts`, `feedback`, `votes`, `events`, `ai_answers` and `settings`, plus the personas, the admin login and the AI knowledge index. Each row records which persona it came from. The schema is `migrations/*.sql`, applied in order on start (and by `npm run db:migrate`). Lists are capped (5,000 messages, feedback and votes; events and AI answers are rolling windows of 20,000 and 5,000), bodies must be JSON and at most 16 KB, inputs are validated, each endpoint is rate-limited, and a hidden honeypot field drops bot submissions. If the database can't be reached, the API answers 503 instead of crashing.
- **Old JSON store:** `npm run db:import -- data/feedback.json` copies a `feedback.json` (or an inbox export) into the database; rows that are already there are skipped. Start the app once first so the tables exist.
- **Visitor details:** each browser gets an anonymous visitor id (localStorage) so one visitor's messages, feedback and votes group together. Device details are added only if the visitor accepted the privacy banner. No IP addresses are stored.
- **Cross-site requests:** every `POST` and `DELETE` must come from this site (`Sec-Fetch-Site`, or `Origin` on older browsers, checked against the request host and `NEXT_PUBLIC_SITE_URL`), and bodies must be exactly `application/json`; anything else gets 403 or 400.
- **Admin login:** `/admin/login/` asks for the email and password, then a 6-digit code ("We sent a code to your email"); while `ADMIN_OTP_STATIC` is set that code is fixed and nothing is emailed. Built on Better Auth: the password is hashed (scrypt), sessions live in the database (12 hours, extended while in use, one row per device), the code is single-use and expires after 5 minutes, and 5 wrong codes void it. Limits: 10 failed sign-ins per email per hour (the same for unknown addresses, so nothing is revealed), 30 per hour overall, and per-address limits behind a trusted proxy (`TRUST_PROXY_HOPS`); 10 failed codes in a row lock the account for a while. "Remember this device" skips the code for 30 days. Cookies are httpOnly and SameSite=Strict (Secure over https). `/admin/*` without a session redirects to the login page; `/api/admin/*` answers 401. Settings (the gear in the inbox) changes the password (signing out every other device), lists signed-in devices and signs any of them out. Typing `/admin` in the chat opens the login page. The export is a JSON snapshot of every table, in the same shape the old file store used (`npm run db:import` reads it back).
- **Inbox tabs:**
  - Visitors: each visitor's details and timeline.
  - Messages (with reply links).
  - Feedback.
  - Votes per answer.
  - AI answers: every free-form question, what the AI did with it (answered, routed, declined, failed), the model and time it took, and its thumbs.
  - Plus search, JSON export and sign-out.

## Personas and the Persona Studio

A persona is one face of the site: who it is about, what it knows (sections of facts, each marked
**Everyone**, **With access code** or **Only me**), its ready-made questions, the typed greeting, the rules
for the AI and its document (the CV, or a biodata). `job` is built from `src/content` until it is first
published; other personas are created in the admin at `/admin/personas/` (from a blank or the marriage
biodata template).

- **Studio tabs:** Overview (problems, publish, preview, versions), Identity & site (names, links, photos,
  languages, search engine texts, every word the chat shows), Knowledge, Questions (plus landing chips,
  sidebar menus and the fallback answer), Hero & AI rules (with "What the AI sees", the exact prompt per
  kind of visitor), Document & access, Review, Checks and JSON. Every change saves itself a moment later;
  a second tab that saved first stops the other from overwriting it.
- **The easy way in:** "Import or paste text" takes the Markdown template (download it with your current
  data, edit it anywhere, paste it back; the preview lists exactly what changes) or any text (an old
  biodata, notes, English or Bangla) that the AI sorts into the template for you to check first.
  "Suggest questions", "Draft an answer from my facts" and "Fill in missing Bangla" use AI the same way.
  Parts marked "Only me" are never sent to the AI.
- **Publish & train:** checks the draft, builds what the AI may know for each kind of visitor, indexes it
  (embeddings, if `pgvector` is available), asks the test questions plus privacy and prompt-injection
  probes (a leaked hidden value stops the publish), makes it live and prints the document PDF. Nothing is
  fine-tuned: the model only ever sees the facts the visitor may see. Earlier versions can be made live
  again in one click.
- **Preview:** shows the draft on the real site in your browser only (as a visitor, or as one with an
  access code), with a bar to exit; nothing done in a preview is recorded.
- **Review:** questions the AI declined, wasn't sure about, sent to "access code", or that got a thumbs
  down. One click turns one into a fact or a ready-made question for the next publish.
- **Routing:** decided by environment only, so hosting can be chosen later: one persona everywhere
  (`PERSONA_ROUTING=single`), one host name per persona (`host`), or one path prefix per persona
  (`prefix`, for example `PERSONA_PREFIXES=marriage=/shadi`). Bangla pages live under `/bn/`.

## Private details: access codes and requests

A persona whose access mode is "Access code" or "Code or request" keeps its "With access code" facts,
photos and document for people the owner trusts.

- **Codes** are made in Document & access (shown once, with a message to copy), limited by uses and days,
  and revocable; "Sign everyone out" ends every unlock at once. Only a hash is stored.
- **Visitors** type the code in the card under a gated answer, on the document page, in the chat box, or
  open the link `/unlock/?code=...` (one click, so link previews in messaging apps can't use it up). The
  unlock is a signed cookie for 7 days. Wrong codes are limited (5 per 15 minutes per visitor). A code is
  never sent to the AI.
- **Requests:** visitors can ask for access with their name, how they are connected, and a phone or email.
  Requests appear in Document & access (and in the inbox); approving one makes a code to send them yourself.
- **The AI** gets only what the visitor may see. When a question needs hidden details it says they are
  shared privately and shows the code box, and a leak filter stops any hidden value that slips into an
  answer anyway.

## Documents and PDFs

- **The CV** (`/cv/`, job persona) is edited in the Studio's Document & access tab with a live preview of
  the printed sheet. Publishing prints a new PDF (and warns if it grows past two A4 pages). The old address
  `/Md-Maruf-Billah-CV.pdf` keeps working: it serves the newest printed PDF, or the one in `public/` before
  the first publish. `npm run cv:pdf` still makes that shipped copy from the code content.
- **A biodata** (or any other persona's document) is a page at `/<document address>/`, built from the
  sections you choose, printable and downloadable as a PDF when the visitor may see it. A gated document
  shows the code box and the request form instead.
- **Printing** uses Chrome or Chromium on the server (`CHROME_PATH`). PDFs are stored in `DOCS_DIR`.

## AI evals

`npm run eval` asks a persona the questions in `evals/<persona>.json` (and the test questions saved in the
Studio) with the real model, then prints each outcome, the pass rate, latency (p50/p95), tokens per
question and how much of the prompt Gemini served from its cache. It fails only on a privacy leak; other
misses are for you to judge, since model answers vary a little. `EVAL_PERSONA=marriage` evaluates a
published persona (reads its live version through `DATABASE_URL`), `EVAL_DOC=file.json` a persona document
from a file. It reads `GEMINI_API_KEY` from the environment or `.env.local`. Names that must never appear
in an answer can be listed one per line in `info/forbidden-terms.txt` (git-ignored); the tests and the
eval check every answer against them.

## SEO

- **Indexable pages** (server-rendered, one `h1`, unique title and description, breadcrumbs, JSON-LD):
  - `/about/`, `/experience/`, `/projects/`, `/projects/<id>/`, `/skills/`, `/contact/`.
  - Plus the chat home and `/cv/`.
- **Chat pages** (`/ask/*`) are `noindex, follow`. Every chip, sidebar topic and project card in the chat is a real link to its content page. A normal click still answers in the chat.
- **Structured data:** one `Person` and `WebSite` graph on every page (`src/lib/seo.ts`).
  - `ProfilePage` on home and about, `ContactPage` on contact.
  - `ItemList` plus `SoftwareSourceCode`/`CreativeWork` for projects, and `BreadcrumbList` everywhere.
- **Files:**
  - `sitemap.xml` lists indexable pages with images and `lastModified` from `CONTENT_UPDATED`.
  - `robots.txt`, `/og.png`, and `/og/<project>.png` share images for each project.
  - `/llms.txt` gives AI assistants a plain-text summary.
  - `/indexnow.txt` holds the IndexNow key.
- **Set the domain at build time:** `NEXT_PUBLIC_SITE_URL=https://<domain>` must be set when you run `npm run build`, not only at runtime. Canonicals, `sitemap.xml`, `robots.txt`, Open Graph URLs and JSON-LD are baked in at build time.
- **After each deploy:** run `SITE_URL=https://<domain> INDEXNOW_KEY=<key> npm run seo:indexnow`. Also submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools. Set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` for the verification meta tags.
- **Other personas:** each one gets its own home, a page per public section marked "Its own page for search
  engines" (`/<section>/`), its document page when it is open to everyone, a Bangla copy of each under
  `/bn/` with `hreflang` links, `Person` structured data (never birth date, address or phone), and its own
  `robots.txt`, `sitemap.xml` and `llms.txt` (public facts only). Their addresses use the persona's own
  site address, else the host it was reached on.
- **Full strategy:** `info/SEO_PLAN.md` (private).

## Privacy and analytics

- **First visit:** a banner asks the visitor to Accept or Reject. Their choice is kept in their browser and can be changed later in the "Privacy" answer (type *privacy* in the chat).
- **Everyone, anonymously:** page views and questions asked go to `POST /api/events/` with no visitor id and no device details. Stored in the database, as a rolling window of 20,000 events.
- **Only when asked:** a question that matches no curated answer is sent, with the last few turns of that chat, to Google's Gemini API (when `GEMINI_API_KEY` is set). Nothing else goes to Google: no device details, no visitor id. The question and the answer are kept in the store with the visitor's anonymous id, like votes, so the owner can review them and write curated answers for frequent ones. The "Privacy" answer in the chat says all this.
- **Accepted only:** device details are added: browser, OS, screen and window size, timezone, language, colour scheme, touch support, referrer, campaign (`utm_*`), landing page and visit count. The landing page, campaign and visit count are only written to browser storage after Accept (until then they are kept in memory for the current page), and Reject removes them.
- **Never stored:** IP addresses. There are no third-party trackers; the only third party is Google's Gemini API, and only for free-form questions.
- **Inbox:** the Analytics tab shows visits per day, top questions, sources, browsers, devices, timezones and the consent rate. These are added up on the server, so the browser only receives the totals and each visitor's summary, never the raw event log.

## Hosting

The app needs a Node server (Node 20.9 or newer) and a Postgres database (`DATABASE_URL`; Neon's free tier is plenty). It runs on a VPS (`npm start` behind nginx, kept alive with PM2) and, since nothing is written to disk any more, also on serverless hosts such as Vercel (rate limits are then per instance). Back up the database with your provider's tools, or with the inbox's JSON export.

- **One process is simplest.** Data is in Postgres, so several instances won't lose writes, but the visitor rate limits, the persona cache and background jobs (publish, PDF) live in each process's memory. `ecosystem.config.cjs` runs one: `npm ci && npm run build && pm2 start ecosystem.config.cjs`.
- **nginx:** pass the real client address and cap request bodies, then set `TRUST_PROXY_HOPS=1` (already set in `ecosystem.config.cjs`; without it all visitors share one rate limit):

  ```nginx
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location /api/ {
    client_max_body_size 32k;
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  ```

- **More than one persona:** with `PERSONA_ROUTING=host`, add every persona's host name to nginx's
  `server_name` (all pointing at the same app; `proxy_set_header Host $host` is required) and to the
  persona's Identity & site settings or `PERSONA_HOSTS`. With `prefix`, nothing changes in nginx. The admin
  lives on the main address (`BETTER_AUTH_URL`).
- **PDFs:** install Chrome or Chromium on the server (`apt install chromium`, then `CHROME_PATH=/usr/bin/chromium`)
  and a Bangla font (`apt install fonts-noto-core`) so biodata PDFs print Bangla correctly. Keep `DOCS_DIR`
  on a disk that survives deploys (outside the app folder if deploys replace it). On a serverless host there
  is no Chrome: publishing still works and the PDF step is skipped.
- **HTTPS:** terminate TLS in nginx (for example with Let's Encrypt). Once it works, set `ENABLE_HSTS=1`. With `BETTER_AUTH_URL=https://...` the admin cookies are `Secure`, so `/admin/` works over HTTPS only.
- **Headers:** every response gets a Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy and a locked-down Permissions-Policy, and `X-Powered-By` is off. `/admin/` and `/api/` also send `X-Robots-Tag: noindex, nofollow`. Pages are rendered per request (the persona, its published content and the visitor's access can differ) and are never cached by a CDN. Images under `/images/` are cached for 7 days and `icon.svg` for 1 day: rename an image (or wait) when you replace it. Open PDFs are cached for an hour; gated ones never.
- **Admin secrets:** generate `BETTER_AUTH_SECRET` and `PERSONA_SIGNING_SECRET` randomly (see `.env.example`) and keep them in `.env.local` (or the PM2 environment) on the server only, never with a `NEXT_PUBLIC_` prefix. Use a long, unique admin password, above all while `ADMIN_OTP_STATIC` is set.
- **Build cache:** build on the server itself. Next's build cache (`.next/cache`) can hold copies of the values in `.env.local`. It is never served to visitors, but don't copy `.next/cache` between machines or into backups and images; `rm -rf .next/cache` after the build if the folder could leave the server.
- **Health check:** point uptime monitoring at `/api/health/` (it checks the database connection; pending migrations are applied first).
- **Before deploying:** `npm run check`.

## Edit the content

Once a persona is published, edit it in the Persona Studio (`/admin/personas/`). Before the job persona's
first publish, everything visitors see comes from `src/content/` (and the first draft is copied from it):

| File | What it holds |
|---|---|
| `profile.ts` | Name, contact details, links, headline stats, "what I do" |
| `experience.ts` | Jobs and client engagements |
| `projects.ts` | Project cards and drill-downs |
| `details.ts` | Skills, cloud services, education, languages, all LinkedIn recommendations, fun facts |
| `intro.ts` | The rotating sentences typed on the landing screen (kept short so they fit in 4 lines) |
| `intents.ts` | Every question the chat can answer: label, keywords, answer wordings, blocks, follow-ups |

## Pages

- `/`: the chat
- `/ask/<question>/`: each answer with its own URL (shareable; `noindex`, its content page is the indexable copy)
- `/cv/`: a plain, printable CV (also the source of the PDF)
- `/admin/`: private inbox (sign in at `/admin/login/` with the email, the password and a code; `/admin/settings/` for the password and devices)
- `/admin/personas/`: the Persona Studio
- `/<section>/`, `/<document address>/`: another persona's public pages and document; `/bn/...` their Bangla versions
- `/unlock/?code=...`: the link that comes with an access code; `/d/<file>`: a document's PDF
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`: per persona (set `NEXT_PUBLIC_SITE_URL` for the job persona)

## Repo layout

- `src/app`: pages and API routes
- `src/components`: UI
- `src/content`: what the site says
- `src/server`: Postgres store (`db.ts`, `store.ts`, migrations runner `migrate.mjs`), validation, rate limits, the admin login (`auth.ts`, `auth-options.mjs`, `admin-session.ts`), personas (`persona/`: resolve, cache, publish, preview, PDF, Studio queries), the AI (`brain/`: prompt per visitor tier, answers, leak filter, embeddings, retrieval, checks, Studio helpers) and access codes (`access/`)
- `migrations/`: the database schema, applied in order
- `src/lib/persona`: the persona schema, labels, icons, the Markdown template and import merge, Studio edit helpers, the CV data, and the browser-side context
- `src/components/admin/studio`: the Persona Studio; `src/components/document`: the CV sheet
- `evals/`: AI eval questions per persona (`npm run eval`)
- `info/`: source material (CV drafts, LinkedIn recommendations, GitHub review, the plan, the old 2022 résumé page)
