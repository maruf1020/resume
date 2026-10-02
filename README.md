# Maruf Billah - portfolio

A portfolio you can chat with. It looks like ChatGPT or Claude, but every answer is written from my CV:
visitors pick from allowed questions (chips, the sidebar, or typing, which filters the list), and the
"assistant" streams a pre-written answer with rich cards. Nothing in those answers is generated, so nothing is made up.
A question none of them covers can go to Google's Gemini, which answers from the same CV text only (optional: set
`GEMINI_API_KEY`); those answers are labelled as AI.

Visitors can also send a message, share feedback, and give each answer a thumbs up or down. All of that
is stored in a Postgres database (Neon), and a private inbox shows it grouped by visitor.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4 and Motion.

## Run it

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL, FEEDBACK_ADMIN_CODE and ADMIN_SESSION_SECRET
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm run cv:pdf               # after a build: renders /cv to public/Md-Maruf-Billah-CV.pdf (headless Chrome/Edge)
npm run check                # typecheck + lint + production build
npm run -s admin:hash        # turns an admin code into FEEDBACK_ADMIN_CODE_HASH (reads it from stdin)
npm run db:import            # copies an old data/feedback.json (or an inbox export) into the database
```

After `cv:pdf`, rebuild so the new PDF is served. While `npm run dev` is running, build into a separate folder instead so the dev server isn't disturbed: `NEXT_DIST_DIR=.next-cv npx next build && NEXT_DIST_DIR=.next-cv npm run cv:pdf`. Every `.next*` folder is git-ignored and skipped by Tailwind. A build into a private folder uses `tsconfig.private.json` (git-ignored, created on demand, it only extends `tsconfig.json`), so `tsconfig.json` is left alone. Next still rewrites the git-ignored `next-env.d.ts` to point at that folder; the next `npm run dev` or `npm run build` puts it back to `.next`. If an older build added `.next-<name>` lines to `tsconfig.json`, remove them by hand.

## Environment (server-only, never sent to the browser)

| Variable | What it does |
|---|---|
| `FEEDBACK_ADMIN_CODE` | Typing this into the chat box opens the private inbox at `/admin/`. Use a random code of 16 or more characters. 8 to 128 characters, no spaces, with a letter, a digit and an uppercase letter or a symbol, no topic word in it (such as "projects") and no `$`. Anything else is treated as a question and never sent to the server |
| `FEEDBACK_ADMIN_CODE_HASH` | Recommended instead of the plain code: `scrypt:N:r:p:<salt>:<hash>` from `npm run -s admin:hash`. When set, it is used and `FEEDBACK_ADMIN_CODE` is ignored. Use the colon form: Next.js expands `$` in `.env` files, so the older `scrypt$...` form only works when set outside `.env` files |
| `ADMIN_SESSION_SECRET` | Signs the 2-hour admin session cookie (httpOnly, SameSite=Strict). At least 32 characters; in production no admin session is issued without it. The sample values from `.env.example` are rejected (the sample code never signs in, the sample secret counts as missing) |
| `DATABASE_URL` | Postgres connection string (a Neon database works well; keep `sslmode=require`). Required: without it every write and the inbox answer 503. Tables are created on first use |
| `TRUST_PROXY_HOPS` | Reverse proxies in front of the app. **Production behind nginx: `1`** (set in `ecosystem.config.cjs`). Default `0` ignores `X-Real-IP` and `X-Forwarded-For`, which visitors can forge, so every visitor shares one rate limit; the server logs a warning at startup when it is `0` in production |
| `GEMINI_API_KEY` | Turns on AI answers for free-form questions (`POST /api/ask/`). Empty = off: the chat says "outside what this chat covers" as before |
| `GEMINI_MODEL` | Gemini model for those answers (default `gemini-2.5-flash`; it must support JSON output). The on/off flag the pages read is baked in at build time, so build on the machine that has the key |
| `GEMINI_FALLBACK_MODEL` | Asked as well when the first model hasn't answered after 5 s, is busy or has been retired; the first answer wins (default `gemini-3.5-flash-lite`; empty to disable) |
| `AI_DAILY_LIMIT` | Answered free-form questions per day, across everyone (default 500), so a bot can't run up the bill |
| `ENABLE_HSTS` | `1` sends `Strict-Transport-Security` (only once the site is on HTTPS for good) |
| `ADMIN_COOKIE_INSECURE` | `1` drops the cookie's `Secure` flag, for testing a production build over plain http only |
| `NEXT_PUBLIC_BASE_PATH` | Optional, when the site is served under a sub-path |
| `NEXT_PUBLIC_SITE_URL` | Set in production: public URL for canonical links, Open Graph, `robots.txt` and `sitemap.xml` (falls back to localhost, with a build warning) |

None of the admin variables may ever start with `NEXT_PUBLIC_`: they are read only by server code and never reach the browser bundle.

**Switching to a hashed admin code:** run `npm run -s admin:hash`, type the code (it isn't shown) and press Enter. Put the printed `scrypt:...` line in `.env.local` as `FEEDBACK_ADMIN_CODE_HASH=scrypt:...` (no quotes needed), delete the `FEEDBACK_ADMIN_CODE` line and restart the server. The plain variable keeps working until you do. A hash made before the switch to colons (`scrypt$...`) is still read, but it gets mangled when loaded from a `.env` file, so generate a new one.

## Feedback store and inbox

- **Endpoints:**
  - `POST /api/contact/`: name, email, optional company, message.
  - `POST /api/feedback/`: 1-5 rating and/or message, optional name and email.
  - `POST /api/vote/`: one 👍/👎 per visitor per answer wording; voting the same way again removes it.
  - `POST /api/ask/`: a free-form question plus the last few turns of the chat (only when `GEMINI_API_KEY` is set). Answers with a curated topic to play, a short AI answer with cards and follow-ups, or a decline; on any error the chat shows its usual fallback. 20 per 10 minutes per client, `AI_DAILY_LIMIT` answered questions per day overall. Every question and outcome is kept in the `ai_answers` table (newest 5,000).
  - `GET /api/health/`: `{ ok: true }` when the server can write its data folder (for uptime checks).
- **Storage:** everything lives in a Postgres database (`DATABASE_URL`): tables `contacts`, `feedback`, `votes`, `events`, `ai_answers` and `settings`, created automatically on first use (any request, for example `/api/health/`). Lists are capped (5,000 messages, feedback and votes; events and AI answers are rolling windows of 20,000 and 5,000), bodies must be JSON and at most 16 KB, inputs are validated, each endpoint is rate-limited, and a hidden honeypot field drops bot submissions. If the database can't be reached, the API answers 503 instead of crashing.
- **Old JSON store:** `npm run db:import -- data/feedback.json` copies a `feedback.json` (or an inbox export) into the database; rows that are already there are skipped. Start the app once first so the tables exist.
- **Visitor details:** each browser gets an anonymous visitor id (localStorage) so one visitor's messages, feedback and votes group together. Device details are added only if the visitor accepted the privacy banner. No IP addresses are stored.
- **Cross-site requests:** every `POST` and `DELETE` must come from this site (`Sec-Fetch-Site`, or `Origin` on older browsers, checked against the request host and `NEXT_PUBLIC_SITE_URL`), and bodies must be exactly `application/json`; anything else gets 403 or 400.
- **Admin inbox:** only a single word with the code's shape (see `FEEDBACK_ADMIN_CODE`) that isn't a topic is checked as a code, via `POST /api/admin/session/`, so ordinary words never are. The code is compared in constant time. Only wrong codes count (5 per 15 minutes per client when `TRUST_PROXY_HOPS` lets clients be told apart, and 30 per hour overall). Each client may have at most 2 codes checked at the same time; further parallel requests from it get the 401 without the code being checked. Over the limit, each checked wrong code is answered after 500 ms (taking the next free half-second slot across everyone), and at most 16 over-limit codes are checked and waiting at once; the rest get the 401 unchecked, also after 500 ms, so every over-limit answer looks the same. No request waits longer than about 2.5 s, so one client's flood can't hold up anyone else's answer for long, and every failure is the same 401 (never a 429), so a visitor whose word merely looks like a code still gets a normal answer. A correct code that gets checked signs in at once. While a flood is running from the same client (or, without `TRUST_PROXY_HOPS`, from anyone, since then every visitor shares one key), the owner's code may be turned away unchecked, so try again once it stops. The limit slows a guesser down to about 2 checked codes a second per client; it can't stop many clients guessing at once, so the real protection is a long random code. With `FEEDBACK_ADMIN_CODE_HASH`, at most 4 scrypt checks run at once (off the main thread) and at most 16 wait for a slot; when that line is full a code is refused unchecked with the same 401, so in hash mode sign-in can also be delayed or refused while a flood is running. A failed check (server error) never shows what was typed. On success it sets the cookie and opens `/admin/`. Without a valid cookie, `/admin/` and `/api/admin/export/` return 404. Signing out (with a valid session) revokes every session on every device (it bumps an epoch kept in the database's `settings` table). The export is a JSON snapshot of every table, in the same shape the old file store used (`npm run db:import` reads it back).
- **Inbox tabs:**
  - Visitors: each visitor's details and timeline.
  - Messages (with reply links).
  - Feedback.
  - Votes per answer.
  - AI answers: every free-form question, what the AI did with it (answered, routed, declined, failed), the model and time it took, and its thumbs.
  - Plus search, JSON export and sign-out.

## Privacy and analytics

- **First visit:** a banner asks the visitor to Accept or Reject. Their choice is kept in their browser and can be changed later in the "Privacy" answer (type *privacy* in the chat).
- **Everyone, anonymously:** page views and questions asked go to `POST /api/events/` with no visitor id and no device details. Stored in the database, as a rolling window of 20,000 events.
- **Only when asked:** a question that matches no curated answer is sent, with the last few turns of that chat, to Google's Gemini API (when `GEMINI_API_KEY` is set). Nothing else goes to Google: no device details, no visitor id. The question and the answer are kept in the store with the visitor's anonymous id, like votes, so the owner can review them and write curated answers for frequent ones. The "Privacy" answer in the chat says all this.
- **Accepted only:** device details are added: browser, OS, screen and window size, timezone, language, colour scheme, touch support, referrer, campaign (`utm_*`), landing page and visit count. The landing page, campaign and visit count are only written to browser storage after Accept (until then they are kept in memory for the current page), and Reject removes them.
- **Never stored:** IP addresses. There are no third-party trackers; the only third party is Google's Gemini API, and only for free-form questions.
- **Inbox:** the Analytics tab shows visits per day, top questions, sources, browsers, devices, timezones and the consent rate. These are added up on the server, so the browser only receives the totals and each visitor's summary, never the raw event log.

## Hosting

The app needs a Node server (Node 20.9 or newer) and a Postgres database (`DATABASE_URL`; Neon's free tier is plenty). It runs on a VPS (`npm start` behind nginx, kept alive with PM2) and, since nothing is written to disk any more, also on serverless hosts such as Vercel (rate limits are then per instance). Back up the database with your provider's tools, or with the inbox's JSON export.

- **One process is simplest.** Data is in Postgres, so several instances won't lose writes, but the rate limits and the admin sign-in queue live in each process's memory and would apply per instance. `ecosystem.config.cjs` runs one: `npm ci && npm run build && pm2 start ecosystem.config.cjs`.
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

- **HTTPS:** terminate TLS in nginx (for example with Let's Encrypt). Once it works, set `ENABLE_HSTS=1`. The admin cookie is `Secure` in production, so `/admin/` only works over HTTPS (or with `ADMIN_COOKIE_INSECURE=1` for a local test).
- **Headers:** every response gets a Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy and a locked-down Permissions-Policy, and `X-Powered-By` is off. `/admin/` and `/api/` also send `X-Robots-Tag: noindex, nofollow`. Pages send `Cache-Control: public, max-age=0, s-maxage=600, stale-while-revalidate=86400`, so a CDN may keep them for 10 minutes after a deploy. Images under `/images/` are cached for 7 days, the CV PDF and `icon.svg` for 1 day: rename an image (or wait) when you replace it.
- **Admin secrets:** prefer `FEEDBACK_ADMIN_CODE_HASH` (from `npm run -s admin:hash`) over the plain `FEEDBACK_ADMIN_CODE`, and use a random code of 16 or more characters. Generate `ADMIN_SESSION_SECRET` randomly (see `.env.example`); changing it signs every admin out. Keep both in `.env.local` (or the PM2 environment) on the server only, never with a `NEXT_PUBLIC_` prefix.
- **Build cache:** build on the server itself. Next's build cache (`.next/cache`) can hold copies of the values in `.env.local`. It is never served to visitors, but don't copy `.next/cache` between machines or into backups and images; `rm -rf .next/cache` after the build if the folder could leave the server.
- **Health check:** point uptime monitoring at `/api/health/` (it checks the database connection, and creates the tables on a fresh database).
- **Before deploying:** `npm run check`.

## Edit the content

Everything visitors see lives in `src/content/`:

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
- `/ask/<question>/`: each answer prerendered with its own URL (shareable, crawlable)
- `/cv/`: a plain, printable CV (also the source of the PDF)
- `/admin/`: private inbox (secret code only)
- `/robots.txt`, `/sitemap.xml`: generated from the answers (set `NEXT_PUBLIC_SITE_URL`)

## Repo layout

- `src/app`: pages and API routes
- `src/components`: UI
- `src/content`: what the site says
- `src/server`: Postgres store (`db.ts`, `store.ts`), validation, rate limits, admin auth, the Gemini adapter (`ai.ts`)
- `info/`: source material (CV drafts, LinkedIn recommendations, GitHub review, the plan, the old 2022 résumé page)
