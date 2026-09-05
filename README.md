# Passenger Resource Management System


## Approach

I treated the brief as a small domain product, not a CRUD demo. The work is split into two TypeScript apps so the access rules live in one place (the API) and the UI can stay a thin client.

frontend (Next.js :3001, BrowserSync :3000) 
- REST + JWT            
- Socket.IO (crew only)
                    
backend (Express :4000)
routes -> controllers -> services -> models (Prisma) -> mySQL                            

Level 1 — catalog and discovery.
Resources have a name, family, minimum membership, and status. Passengers request `/api/resources/available` and receive only active stations their rank can access. Crew Leads see the full inventory, including decommissioned rows.

Level 2 — validation, tier changes, audit.
`useResource` re-checks status and membership on the server, then writes a `UsageEvent`. Denied attempts are stored before the 403/409 is returned, so the activity feed is an audit log rather than a success-only stream. Crew Leads can create passengers and change levels; those changes immediately affect the next use.

Level 3 — history, reports, live ops.
Passengers have a personal history. Crew Leads get activity and demand reports. Socket.IO pushes `activity:upsert` and a fresh `reports:update` snapshot when usage or roster data changes, so the bridge does not poll.

The backend is layered on purpose:

Routes -> Paths, HTTP verbs, auth gates 
Controllers -> Read params, call a service, wrap `ok` / `created` 
Services -> Zod validation, invariants, orchestration 
Models -> Prisma queries only

## Design decisions

Membership is a ranked lookup, not a hard-coded matrix.
Silver / Gold / Platinum are rows with `rank` 0 / 1 / 2. Access is `passengerRank >= minRank`. Inheritance is one comparison, and a future tier is a seed row rather than a new `if` ladder.

Statuses are application constants, not Prisma enums.
`ACTIVE` / `DECOMMISSIONED` and `ALLOWED` / `DENIED` live in `backend/src/utils/status.ts`. That avoided MySQL enum migrations during a short build, while still giving one source of truth for the API.

The Crew Lead cap is a service invariant.
`CREW_LEAD_CAP = 3`. Create locks the Crew Lead role row (`SELECT … FOR UPDATE`) inside a `READ COMMITTED` transaction, then counts and inserts. Two concurrent creates cannot both sneak under the cap. The overview page includes a “fourth lead” form so a reviewer can see the rule fail closed.

Denied use is still a first-class event.
If the station is retired or the passenger’s tier is too low, the API writes `DENIED` and then fails the request. Crew activity therefore shows attempted misuse, not only successful sessions.

Realtime is crew-only Socket.IO.
The handshake reuses the JWT. Passengers do not join the crew room. Activity upserts by event id so an “end session” updates the existing row instead of inserting a duplicate.

**One JSON envelope for every HTTP response.**

json
{ "success": true, "status": 200, "message": "success", "data": { } }


Errors use the same shape via `fail()`. The frontend `api()` helper unwraps `data` and throws `ApiError` from `message`. Zod failures attach field issues in `data`.

**Auth is JWT in `localStorage`, 12-hour expiry.** Enough for a take-home and a shared demo password. Route layouts still hide the wrong role’s shell, but every mutating endpoint is gated again on the server (`requireAuth` + `requireCrewLead` / `requirePassenger`).

**UI: search in place, create in a dialog.** Passenger and resource list pages reuse the old create fields as live filters. Add / provision opens a modal. Destructive decommission asks for confirmation. Tables collapse into labeled cards on small screens.

**UI language is English or Malay.** `next-intl` loads `frontend/messages/en.json` and `frontend/messages/ms.json`. The choice is stored in `localStorage` (`x26_locale`) so routes stay `/bridge` and `/cabin`. Switch language from the header, sidebar, or sign-in screen.

## Assumptions

- The brief did not mandate a stack. I chose Express + Prisma + MySQL and Next.js App Router because they are familiar, typed, and easy for a reviewer to run locally.
- “Exactly three Crew Leads” is a hard business rule, not a UI hint. The API must reject a fourth even if someone posts directly.
- Higher membership always includes lower-tier stations. The PDF’s inheritance model is the whole access policy.
- Decommission is irreversible for this exercise. History keeps the row; passengers can no longer start a session.
- Concurrent capacity (one pod, many passengers) was not specified, so a station can have overlapping open sessions.
- Listing payloads stay small enough that search and pagination can run in the browser for this assessment.

## Trade-offs

**Layered backend vs fewer files.** 
Four hops per request is more ceremony than a single route handler. I accepted that so access rules, Prisma, and HTTP stay independently readable. For a larger team I would keep this; for a one-file prototype I would not.

**Prisma `db push` vs migrations.** 
Faster iteration, weaker history. A shipping system would use versioned migrations from day one.

**SQL report aggregation, ranked in the service.** 
Passenger and demand totals are grouped in MySQL (`backend/src/models/reports.ts`). The service still sorts demand rank and the “high demand” tie (every resource at the peak allowed-use count) in TypeScript — that is a small result set, not the full usage log.

**Socket.IO vs polling or SSE.** 
Polling is simpler and was enough for a take-home. I still chose sockets because the brief’s activity/report screens are operations views: a denied use should appear without a refresh. The cost is a second auth path and a shared HTTP server.

**JWT in `localStorage` vs httpOnly cookies.** 
Cookies are the better XSS default. `localStorage` made the SPA and the Socket.IO handshake straightforward. I would not keep this for a real ship network.

**Client-side search/pagination vs query params.** 
Instant filtering, no extra API. Wrong once the roster is large or a Crew Lead expects a stable shareable URL.

**Synchronous bcrypt.** 
Simple and visible. Under load I would switch to async hashing so login does not block the event loop.

**Vitest against the real MySQL schema.** 
Unit tests cover `canAccess`. Integration tests hit services with a wiped roster: Silver/Gold/Platinum × ACTIVE/DECOMMISSIONED, login, downgrade ending inaccessible sessions, Crew Lead cap (including a concurrent pair), and SQL report totals. That is slower than mocked Prisma and it clears demo users, so re-seed after a run.

## Improvements

1. **HTTP-level tests.** The current suite calls services. Add route tests for unauthenticated and wrong-role requests.
2. **Resource capacity.** Decide whether a station has concurrent occupancy, and reject or queue overlapping sessions.
3. **Server-side list queries.** `q`, `level`, `status`, `page`, `pageSize` on passengers, resources, activity, and reports. Keep the current filters in the UI.
4. **Auth hardening.** httpOnly secure cookies, CSRF for cookie sessions, refresh tokens, and lockout on repeated login failures.
5. **Prisma migrations and Docker Compose.** One command for MySQL + API + web, with a checked-in migration history.
6. **Product polish.** Confirm whether `family` should become a first-class category entity; add rate limits; structured request logs.

## Run locally

Requires Node.js 20+ and MySQL.

```bash
# backend
cd backend
cp .env.example .env   # or create .env — see below
npx prisma generate
npx prisma db push
npm run db:seed
npm test               # wipes users/resources/usage; re-seed afterwards
npm run db:seed
npm run dev            # http://localhost:4000
```

```bash
# frontend
cd frontend
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > .env
npm install
npm run dev            # http://localhost:3000 (BrowserSync) or :3001 (Next)
```

`backend/.env`:

```
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/assessment"
JWT_SECRET="replace-me"
PORT=4000
FRONTEND_ORIGIN="http://localhost:3000,http://localhost:3001"
```

## Postman

Import both files from `backend/postman/`:

- `X26-PRMS.postman_collection.json`
- `X26-PRMS.local.postman_environment.json`
