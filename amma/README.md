# Amma job dashboard

`/amma/` is a compact technology-management job feed. It uses the existing Vercel project, no database, no login, and no new production packages. The resume file and contact details stay out of the repository and public assets.

## User features

- 50 compact rows per page, with title/company, work setup, salary, publication date, match label and a direct original posting link. Expand a row for full match reasons and requirements.
- Applied / Not applied toggles, plus application-status filters. Opening a posting never implies an application. Applied snapshots survive removal from the live feed; the Applied filter includes older/closed history.
- Status lives in localStorage (`amma-applied-v1`), **only in this browser/profile**. It does not sync across devices. Clearing site data removes it. Storage failures are shown explicitly.
- Keyword search includes title, company, location and up to 24,000 characters of the employer description. Space-separated words all must match; commas mean alternatives. This filters the fetched matching jobs; it does not issue arbitrary source queries.
- Suggested keyword buttons, role/sector/work-mode/date filters, and an optional active-clearance filter. Active-clearance-required jobs are hidden by default because the resume does not establish clearance. Applied history retains them.

## Source coverage

34 automated source configurations: the original eight plus 26 new boards. Five additional official contractor portals are directly linked, with suggested searches; they are **not** advertised as automatically imported. The inventory, specific researched leads and fit limitations are in [the research audit](../docs/amma-research.md).

Adapters: public Greenhouse, Ashby and Lever job interfaces, official USAJOBS, and crawl-policy-checked Progressive/Leidos career pages. A configured adapter is not a live verification claim. Source failures, missing dates, caps and credentials problems are disclosed in the source panel. No static research lead or demo job is planted in the feed.

Seven predefined groups: priority, civic, federal-delivery, insurance, platforms, finance, software. `/api/amma/jobs` serves priority; `?group=insurance` and other allowlisted group names serve additional groups. Other query strings canonicalize or reject. Each group is cached for six hours at the CDN and in warm memory; requests in a warm process coalesce. Total outages get a five-minute cache. Different cold instances/regions can each refresh; there is no durable crawler or cron service.

The browser renders priority first, then loads two additional groups at a time and merges results incrementally. Source timestamps remain visible; failed refresh groups can retain explicitly dated browser snapshots. Snapshots expire after two days; job deadlines and 30-day recency are rechecked before display. Initial cold loading can take multiple minutes for all groups while early results remain usable.

Each source has a 48-second budget. HTTP calls time out after eight seconds. API reads are spaced per origin within a group; HTML detail reads honor robots.txt (404 = absent), disallows, one-second spacing, and skip longer crawl delays. 429/503 stops further detail requests for that source in the refresh. No authentication bypass, CAPTCHA circumvention or LinkedIn scraping.

- Greenhouse: index scan, recently updated leadership candidates, up to 24 details for **first_published**, salary and deadline. Updated date is never passed off as posting date.
- Ashby: all returned public (`isListed: true`) jobs; date explicitly labeled **Published / reposted**, consistent with its API.
- Lever: paginate up to 2,000 public index records, then up to 24 relevant employer details for actual structured publication dates. Undated or disallowed details are skipped and coverage marked partial.
- Progressive/Leidos: up to three relevant category/search pages and 12 matching details, subject to robots policy and timeout.
- USAJOBS: public hiring path, 2210 IT and 0340 program-management series, last 30 days, up to 1,500 announcements. Technical relevance and leadership are still required; federal grade, citizenship and specialized eligibility are never inferred.

This is broad, bounded coverage—not every vacancy on the internet. Explicit foreign-only locations, junior titles, unsuitable engineering disciplines, weak matches, unknown publication dates, expired deadlines and stale postings are excluded. Ambiguous remote restrictions remain the applicant's responsibility. Employer sector labels are curated and do not establish the customer of every individual position.

## Run and test

Node 22+ recommended:

```sh
node --test amma/tests/feed.test.mjs
node scripts/serve-amma.mjs
```

Local dashboard: `http://127.0.0.1:4178/amma/`. The development server does not load environment files automatically.

Optional DOM behavior tests use an existing development-only linkedom install:

```sh
AMMA_DOM_MODULE=/absolute/path/to/linkedom node --test amma/tests/*.test.mjs
```

Without that module, DOM tests explicitly skip. Tests cover actual application behavior, adapters, dates, clearance, safe rendering, keyword matching, pagination, persistence, archived applications, grouped caches and partial failures. They do not replace visual browser or real-source verification.

`node scripts/build-site.mjs` copies only public dashboard assets, excluding tests and README. The normal Vercel build compiles the other portfolio apps before assembling `dist`.

## Federal credentials

Vercel → **reyash → Settings → Environment Variables → Add Environment Variable**:

| Name | Value | Environment | Type |
| --- | --- | --- | --- |
| `USAJOBS_API_KEY` | The developer key issued by USAJOBS | Production | Secret / Sensitive |
| `USAJOBS_EMAIL` | The exact email registered for the key | Production | Config |

Save both before a new deployment. Do not add frontend prefixes (`VITE_`, `NEXT_PUBLIC_`), put keys in source, or paste them into chat. The federal feed specifically flags 401/403 credential rejection.

## Deployment

Run from the repository root:

```sh
node scripts/deploy-amma.mjs
```

The script runs backend tests, creates an isolated snapshot of HEAD plus only the dashboard changes, links the existing reyash project, deploys production and checks **all seven source groups**. It excludes unrelated uncommitted work. `--prepare-only` creates the release without uploading. Metadata is in `.release/amma-latest.json`. It never reads or copies the API key. A nonzero result after upload can mean the page deployed but source verification found an outage; read the printed source statuses.

**Vercel's Redeploy button alone cannot upload local changes.** It rebuilds the selected deployment's existing source. Use the command above for local changes, or commit the dashboard changes and push through the existing main-branch integration. A later Git-based deployment must contain these source changes to preserve `/amma`.

Production: `https://www.ysunkara.com/amma/`. `/amma` redirects to `/amma/`. Noindex/CSP headers are configured, but the dashboard is public and has no authentication.

This session blocks external DNS, local listening sockets and browser execution. The implementation and fixture/DOM tests can be checked here; deployment, source health and visual layout need verification in a network-enabled environment. Do not call a configured but unreachable source operational.

### Mobile and personal career sites

The dashboard uses blue accents and the tagline “For your next chapter.” On phones, search and application status stay visible; More filters expands the other choices. Job actions have 44px touch targets, narrow screens put them below the job summary, and suggested terms scroll horizontally. Feed pagination remains 50 jobs per page.

“Add your own career sites” saves up to 10 HTTPS career links in the current browser. Greenhouse (`job-boards.greenhouse.io` or `boards.greenhouse.io`), Lever (`jobs.lever.co`), and Ashby (`jobs.ashbyhq.com`) board/posting URLs normalize to their employer board and import resume-matched recent jobs. Other sites are explicitly link-only. No arbitrary webpage scraper is exposed. Saved sites do not sync between devices; removing a site keeps Applied history.

`GET /api/amma/custom?provider=ashby&board=example` accepts only the three fixed providers and validated board slugs. It reuses the existing adapters, robots policies, bounded request budgets and matching rules. Results are cached for six hours (five minutes on failure), with duplicate in-flight checks coalesced and bounded server memory/concurrency. New employers default to private-sector unless already present in the verified source registry. These are matching/coverage checks, not promises that a source contains new jobs.
