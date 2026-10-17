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
├── apps/api          # Node + Express REST API
└── apps/web          # React + Vite web app, mobile-first
```

The project is set up for a **mobile app later**:

- All business logic (matching, validation, types, API response shapes) lives in `@jobster/shared`, which uses neither DOM nor Node APIs. A React Native / Expo app can import it unchanged.
- The API is plain REST with bearer tokens, which suits native clients as well as the browser.
- The web UI is already laid out as a phone-sized, touch-first app: swipe gestures, a bottom tab bar and safe-area insets.

**Storage:** in this MVP the API stores everything in a JSON file (`apps/api/data/db.json`), so it runs with no database to set up. All reads and writes go through `apps/api/src/store.ts`, so moving to Postgres later means changing that file and the queries in `service.ts`.

### API

All routes are under `/api`, and every route except auth needs `Authorization: Bearer <token>`.

| Method | Route | |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Accounts. A role is `candidate` or `employer` |
| GET / PUT | `/me`, `/me/profile` | Your account and profile |
| GET / POST / PUT | `/jobs/mine`, `/jobs`, `/jobs/:id` | Employers manage their adverts |
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
npm run build && npm start   # Production: the API serves the built web app on :4000
```

## What to build next

- **Mobile app:** an Expo app in `apps/mobile` that reuses `@jobster/shared`
- **Postgres** in place of the JSON store, plus real-time chat over WebSockets
- **Uploads:** CVs, photos and company logos
- **Smarter matching:** learn from who each side likes and skill embeddings, alongside the rule-based score
- **Notifications:** push and email for new likes, matches and interview reminders
- **Calendar sync** with Google and Outlook, and video links generated automatically
- **Trust and safety:** verified employers, reporting and rate limiting
