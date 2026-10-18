# Jobster

**Hinge for hiring.** Job seekers swipe on short, profile-style job adverts. Employers swipe on candidates who fit what they need. When both sides like each other it's a match, and the match leads to a chat and a booked interview.

## The product

| | Job seekers | Employers |
|---|---|---|
| **Discover** | Swipe through roles ranked by how well they fit you | Choose a job, then swipe through candidates ranked by fit |
| **Like a section** | Heart a specific part of an advert (a prompt, the perks, the skills) and add a comment | Heart a specific part of a profile and say what stood out |
| **Standouts** | One a day, like Hinge's Roses: you go to the top of their Likes list | Same |
| **Likes you** | Employers who already like you. Like them back to match instantly | Candidates who liked your roles |
| **Matches** | Chat, then pick from the interview times you're offered | Chat, offer up to five interview times, and get a calendar invite |
| **Dealbreakers** | Hide roles that don't meet your salary, way of working or contract type | Hide candidates without the experience, skills or right to work |

Profiles use Hinge-style **prompts** ("My proudest work achievement is…", "A typical day looks like…") instead of a CV, so there is something specific to like and talk about.

## The matching algorithm

`packages/shared/src/matching.ts` gives each (candidate, job) pair a score from 0 to 100. Both sides see the same score, along with the reasons behind it.

| Factor | Weight | How it's scored |
|---|---|---|
| Skills | 40% | Required skills count for 80% and nice-to-haves for 20%. Aliases are handled, so "React.js" = "React" and "Postgres" = "PostgreSQL" |
| Experience | 25% | Full marks at or above the minimum years, scaled down below it |
| Level | 10% | Same seniority = 1, one level apart = 0.6, two apart = 0.25 |
| Location | 10% | Work mode accepted, plus the same city, a remote role or willing to relocate |
| Salary | 10% | Full marks if the top of the range meets the candidate's minimum |
| Contract | 5% | Full-time, part-time, contract or internship |

A **dealbreaker** from either side takes the pair out of both feeds. Feeds are sorted best match first. If someone has passed on you, they quietly disappear from your feed, as on Hinge.

## Architecture

```
jobster/
├── packages/shared   # Types, validation (zod), matching algorithm, labels. Plain TypeScript, no DOM or Node APIs
├── apps/api          # REST API (Hono), runs on Node locally and on Cloudflare Workers in production
└── apps/web          # React + Vite web app, mobile-first
```

The project is set up for a **mobile app later**:

- All business logic (matching, validation, types, API response shapes) lives in `@jobster/shared`, which uses neither DOM nor Node APIs. A React Native / Expo app can import it unchanged.
- The API is plain REST with bearer tokens, which suits native clients as well as the browser. It only uses web-standard `Request`/`Response`, so the same code runs under Node and on Cloudflare.
- The web UI is already laid out as a phone-sized, touch-first app: swipe gestures, a bottom tab bar and safe-area insets.

**Storage:** the API works against an in-memory `Store` (`apps/api/src/store.ts`), and where the data is saved depends on where it runs:

- **Locally** it's a JSON file (`apps/api/data/db.json`), so there's nothing to set up.
- **On Cloudflare** it's a single [Durable Object](https://developers.cloudflare.com/durable-objects/) with SQLite storage (`apps/api/src/worker.ts`). Each record is its own row and only changed rows are written.

This fits an MVP: one Durable Object handles requests one at a time, just like the single Node server. For real scale, move to a proper database (Cloudflare D1 or Postgres). That means replacing `store.ts` and the queries in `service.ts`; the routes and the web app stay the same.

### API

All routes are under `/api`, and every route except auth needs `Authorization: Bearer <token>`.

| Method | Route | |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Accounts. A role is `candidate` or `employer` |
| GET / PUT | `/me`, `/me/profile` | Your account and profile |
| GET | `/me/summary` | Counts for the navigation badges: likes waiting, chats where it's your turn, upcoming interviews |
| GET / POST / PUT | `/jobs/mine`, `/jobs`, `/jobs/:id` | Employers manage their adverts |
| GET | `/jobs/pipeline` | Each role's progress: to review, liked you, matches, interviews |
| GET | `/feed` (`?jobId=` for employers) | Ranked cards you haven't decided on yet |
| GET | `/likes` | People waiting on your decision |
| POST | `/swipes` | `{ jobId, candidateId?, decision, standout?, likedSection?, note? }` returns any match |
| GET | `/matches`, `/matches/:id` | Match list and chat |
| POST | `/matches/:id/messages` | Send a message |
| POST | `/matches/:id/interview` (`/accept`, `/decline`, `/cancel`) | Interview booking |
| POST | `/matches/:id/unmatch` | Unmatch |

## Running it

You need Node 20 or later.

```bash
npm install
npm run dev        # API on :4000, web app on http://localhost:5173
```

On first run the API seeds a demo world. Sign in with either account (password `password123`), or use the demo buttons on the sign-in page:

- **Job seeker:** `candidate@jobster.dev`
- **Employer:** `employer@jobster.dev`

Both accounts start with likes waiting and one active match.

```bash
npm test           # Matching algorithm unit tests and an API test from swipe to interview
npm run typecheck
npm run seed       # Reset the demo data
npm run build && npm start   # Production on Node: the API serves the built web app on :4000
npm run cf:dev     # Run the Cloudflare version locally on http://localhost:8787 (builds the web app first)
```

## Deploying to Cloudflare

Cloudflare hosts both halves on one domain: the web app as static assets and the API as a Worker, with the data in a Durable Object. The Workers **free plan** covers trying it out. GitHub Pages can't host Jobster on its own, because it only serves static files and can't run the API.

### Automatic deploys from GitHub (recommended)

Use Cloudflare's Git integration (Workers Builds) to build and deploy on every push:

1. In the Cloudflare dashboard, open **Workers & Pages → Create → Import a repository** and pick this repo.
2. Name the Worker **`jobster`**. It must match `name` in `wrangler.jsonc`.
3. Keep the default settings: root directory `/` and deploy command `npx wrangler deploy`. You don't need a build command, because `wrangler.jsonc` builds the web app before every deploy.
4. Under **Settings → Build**, choose your production branch.

Each push to that branch then deploys to `https://jobster.<your-subdomain>.workers.dev`. Separately, GitHub Actions (`.github/workflows/ci.yml`) runs the type checks, tests and build on every push and pull request.

### Deploying from your own computer

```bash
npx wrangler login     # one-off: opens a browser to sign in to Cloudflare
npm run deploy
```

### Before a real launch

- **Turn off the demo data.** A fresh deploy fills itself with the demo world, and the demo logins are public. Set `SEED_DEMO_DATA` to `"false"` in `apps/api/wrangler.jsonc` first. The setting only affects an empty database, so data that's already there stays until you clear it.
- **Consider Workers Paid ($5/month).** Passwords are hashed with scrypt, which is deliberately slow (about 60 ms of CPU per sign-up or sign-in). The free plan allows 10 ms of CPU per request, so sign-ins may sometimes fail under it. The paid plan's limits are far higher.
- **Custom domain:** add one under the Worker's **Settings → Domains & Routes** in the Cloudflare dashboard.

## What to build next

- **Mobile app:** an Expo app in `apps/mobile` that reuses `@jobster/shared`
- **Postgres** in place of the JSON store, plus real-time chat over WebSockets
- **Uploads:** CVs, photos and company logos
- **Smarter matching:** learn from who each side likes and skill embeddings, alongside the rule-based score
- **Notifications:** push and email for new likes, matches and interview reminders
- **Calendar sync** with Google and Outlook, and video links generated automatically
- **Trust and safety:** verified employers, reporting and rate limiting
