# Maruf Billah - portfolio

A portfolio you can chat with. It looks like ChatGPT or Claude, but every answer is written from my CV:
visitors pick from allowed questions (chips, the sidebar, or typing, which filters the list), and the
"assistant" streams a pre-written answer with rich cards. There's no AI behind it, so nothing is made up.

Visitors can also send a message, share feedback, and give each answer a thumbs up or down. All of that
is stored in one JSON file on the server, and a private inbox shows it grouped by visitor.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4 and Motion.

## Run it

```bash
npm install
cp .env.example .env.local   # then set FEEDBACK_ADMIN_CODE and ADMIN_SESSION_SECRET
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm run cv:pdf               # after a build: renders /cv to public/Md-Maruf-Billah-CV.pdf (headless Chrome/Edge)
```

After `cv:pdf`, rebuild so the new PDF is served. While `npm run dev` is running, build into a separate folder instead so the dev server isn't disturbed: `NEXT_DIST_DIR=.next-cv npx next build && NEXT_DIST_DIR=.next-cv npm run cv:pdf`.

## Environment (server-only, never sent to the browser)

| Variable | What it does |
|---|---|
| `FEEDBACK_ADMIN_CODE` | Typing this into the chat box opens the private inbox at `/admin/` |
| `ADMIN_SESSION_SECRET` | Signs the 8-hour admin session cookie (httpOnly, SameSite=Strict) |
| `FEEDBACK_DB_PATH` | Where the JSON store lives (default `./data/feedback.json`, git-ignored) |
| `NEXT_PUBLIC_BASE_PATH` | Optional, when the site is served under a sub-path |
| `NEXT_PUBLIC_SITE_URL` | Optional, canonical URL for metadata |

## Feedback store and inbox

- **Endpoints:**
  - `POST /api/contact/`: name, email, optional company, message.
  - `POST /api/feedback/`: 1-5 rating and/or message, optional name and email.
  - `POST /api/vote/`: one 👍/👎 per visitor per answer wording; voting the same way again removes it.
- **Writes:** writes are queued and atomic (temp file + rename), lists are capped, inputs are validated and size-limited, each endpoint is rate-limited, and a hidden honeypot field drops bot submissions.
- **Visitor details:** each browser gets an anonymous visitor id (localStorage). Submissions include it plus user agent, language, timezone, screen size and referrer. No IP addresses are stored.
- **Admin inbox:** typing the code in the chat calls `POST /api/admin/session/`, which compares it in constant time and is limited to 5 attempts per 15 minutes. On success it sets the cookie and opens `/admin/`. Without a valid cookie, `/admin/` and `/api/admin/export/` return 404.
- **Inbox tabs:**
  - Visitors: each visitor's details and timeline.
  - Messages (with reply links).
  - Feedback.
  - Votes per answer.
  - Plus search, JSON export and sign-out.

## Privacy and analytics

- **First visit:** a banner asks the visitor to Accept or Reject. Their choice is kept in their browser and can be changed later in the "Privacy" answer (type *privacy* in the chat).
- **Everyone, anonymously:** page views and questions asked go to `POST /api/events/` with no visitor id and no device details. Stored in the same JSON file, as a rolling window of 20,000 events.
- **Accepted only:** device details are added: browser, OS, screen and window size, timezone, language, colour scheme, touch support, referrer, campaign (`utm_*`), landing page and visit count.
- **Never stored:** IP addresses. There are no third-party trackers.
- **Inbox:** the Analytics tab shows visits per day, top questions, sources, browsers, devices, timezones and the consent rate.

## Hosting

The JSON store needs a Node server with a **persistent disk**, for example an EC2/Lightsail box or VPS (`npm start` behind nginx, kept alive with PM2) or Docker with a volume mounted at `data/`. Serverless hosts like Vercel, and static hosts like GitHub Pages, can't keep a writable file. Back up `data/feedback.json` along with the server.

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

## Repo layout

- `src/app`: pages and API routes
- `src/components`: UI
- `src/content`: what the site says
- `src/server`: JSON store, validation, rate limits, admin auth
- `info/`: source material (CV drafts, LinkedIn recommendations, GitHub review, the plan, the old 2022 résumé page)
