# True NHL Standings

NHL standings recalculated with a point system where a regulation win counts
for more than an overtime loss:

| Result | Points |
|---|---|
| Regulation win | 3 |
| OT/SO win | 2 |
| OT/SO loss | 1 |
| Regulation loss | 0 |

The site shows this "True" table, the NHL's actual ("Real") standings, and a
view of how much each team's placing changes between the two. Tables are
laid out by conference and division (East: Atlantic, Metropolitan; West:
Central, Pacific), with the top 3 in each division and the two wild cards
per conference highlighted, and a season dropdown for looking back at past
seasons.

## How it's built

- **Next.js (App Router)** — server-rendered pages, revalidated every 5 minutes.
- **Postgres via [Neon](https://neon.tech)**, accessed with **Prisma**. We
  store one row per finished game (`prisma/schema.prisma`); standings are
  always *computed* from those rows (`lib/standings.ts`), never stored as a
  running total — so a fix to the points logic or a corrected score is
  reflected everywhere the next time the page renders, with nothing to
  backfill.
- **NHL public API** (`api-web.nhle.com`, no key needed) — `lib/nhl-api.ts`
  fetches finished games for a date and tells us whether each was decided in
  regulation, OT, or a shootout.
- **GitHub Actions cron** (`.github/workflows/sync-scores.yml`) — runs
  `scripts/sync-scores.ts` a few times a day, free, no server to keep running.

## Local setup

1. **Create a Neon project.** [neon.tech](https://neon.tech) → new project →
   copy the pooled connection string and the direct connection string.
2. **Copy env vars:**
   ```bash
   cp .env.example .env
   # paste in your Neon connection strings
   ```
3. **Install and set up the database:**
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```
4. **Run a sync once to pull in real data:**
   ```bash
   npm run sync
   ```
5. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Loading a past season

The nightly sync only looks back a few days, so whole past seasons are
loaded once, by hand:

```bash
npm run backfill -- 20252026
```

That pulls every club's full schedule from the NHL API (32 requests), stores
the finished regular-season games, and verifies the total. It's safe to
re-run. Once a season has games in the database it appears in the season
dropdown automatically, at `/season/20252026`. The 2025–26 season is
already loaded and matches the NHL's official final standings exactly (every
team's record and every playoff spot).

Seasons back to 2021–22 work as-is. 2020–21 used one-off divisions
(North/East/Central/West) and would need its own division map in
`lib/teams.ts` before it could be shown correctly.

## Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com) — it'll detect Next.js
   automatically. Add `DATABASE_URL` and `DIRECT_URL` as environment
   variables in the Vercel project settings (same values as your `.env`).
3. **Turn on the score sync:** in your GitHub repo, go to Settings → Secrets
   and variables → Actions, and add a `DATABASE_URL` secret (use the pooled
   Neon string). The workflow in `.github/workflows/sync-scores.yml` will
   start running on its schedule automatically — you can also trigger it
   manually from the Actions tab (`workflow_dispatch`) to test it.
4. Run `npx prisma migrate deploy` (pointed at your production `DATABASE_URL`)
   once, so the production database has the `Game` table.

Note: Vercel's free Hobby tier is for non-commercial projects. Once you're
running ads on the site, Vercel's terms call for the Pro plan ($20/mo) —
see the plan comparison at vercel.com/pricing if you want to check current terms.

## Embedding the widget elsewhere

Anyone can drop the standings (with all three toggles) into their own page:

```html
<iframe
  src="https://truenhlstandings.com/embed"
  width="100%"
  height="640"
  style="border: none;"
  loading="lazy"
></iframe>
```

`/embed` renders the same standings as the main page, just without the site
header/footer, so it stays compact in a sidebar or a content column. Below
about 520px wide it switches to tri-codes and drops the GF/GA columns so it
fits without scrolling. `/embed/season/20252026` embeds a past season, and a
`#real` or `#diff` suffix on any URL opens that view directly.

## Project structure

```
app/
  page.tsx                       current season
  season/[seasonId]/page.tsx      a past season, e.g. /season/20252026
  embed/page.tsx                  embeddable widget, current season
  embed/season/[seasonId]/page.tsx  embeddable widget, past season
  layout.tsx                      fonts + global styles
  globals.css
components/
  StandingsPage.tsx    server component: loads a season, computes all three
                       tables, renders the page shell (main + embed)
  StandingsView.tsx    client component: True/Real/Diff toggle + season dropdown
  StandingsTable.tsx   one division's table, rows highlighted by playoff spot
  DiffTable.tsx        one division's rank-difference table
  SeasonSelect.tsx     the season dropdown
lib/
  points.ts            point calculation for both systems
  standings.ts         aggregates games -> team rows (NHL tiebreakers), groups
                       by conference/division, marks top-3 + wild cards
  seasons.ts           season id helpers (current season, parsing, labels)
  games.ts             database queries: games for a season, seasons available
  nhl-api.ts           fetches + normalizes NHL score data
  teams.ts             static team metadata (names, divisions, colors, and
                       which seasons each club existed)
  db.ts                Prisma client singleton
scripts/
  sync-scores.ts       the cron job's entry point (last few days)
  backfill-season.ts   one-off: load a whole past season
prisma/
  schema.prisma        the one table: Game
.github/workflows/
  sync-scores.yml      free scheduled sync via GitHub Actions
```

## Extending this

- **Tiebreakers**: `computeStandings` uses the NHL's order — points, fewer
  games played, regulation wins, regulation + OT wins, goal differential,
  goals for. The one official step it skips is head-to-head points between
  tied clubs; if that ever matters, it would go in `compareRows` in
  `lib/standings.ts`.
- **Older seasons**: add `firstSeason`/`lastSeason` bounds in `lib/teams.ts`
  for any club that moved or joined (Arizona → Utah is already handled), then
  run the backfill for that season.
