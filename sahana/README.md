# Sahana internship board

Public page: https://www.ysunkara.com/sahana/

Profile: George Mason University, first-year Health Informatics, graduation 2029/2030, US citizen. Rankings favor government, health data, and DC / Northern Virginia / Maryland or remote. Eligibility is heuristic, never guaranteed. Explicit graduate/upper-year requirements are placed behind the stretch toggle; credit-hour requirements are shown in details.

## Daily pipeline

Cloudflare Worker `sahana-internship-feed`, isolated from the existing apps. Cron `0 11 * * *` (7 am EDT / 6 am EST), persisted in KV namespace `SAHANA_FEED`. The worker calls the existing portfolio's new `/api/sahana/jobs` Vercel function for USAJOBS, using the existing server-only `USAJOBS_API_KEY` and `USAJOBS_EMAIL` environment variables. No credentials are sent to the browser or copied to Cloudflare.

Ten sources: USAJOBS student hiring path, ICF's public Workday board, seven Greenhouse healthcare boards, insitro's Ashby board. Successful empty responses remove old listings; failures retain previously verified listings for up to seven days with stale labels. Closed dated listings are excluded. Employer listing APIs are the source of truth for undated availability. A missed cron gets a background retry when a feed older than 26 hours is read. The UI reports source failures and a refresh older than 36 hours. The initial empty KV read bootstraps the feed.

Source coverage is bounded. USAJOBS: up to 1,500 student announcements. ICF: up to 200 search results and 24 relevant details. Partial collection is reported. Other employer APIs return public board indexes. The program watchlist is curated and is not represented as open jobs.

## Browser tracker

Saved jobs, application statuses, and notes use `sahana-tracker-v1` in localStorage, including snapshots for roles removed from the live feed. CSV export preserves a portable copy. No applications are submitted; opening a link never marks a job applied.

## Check and deploy

- `node --test sahana/tests/feed.test.mjs`
- `node --check sahana/app.mjs`
- `npx wrangler@4.128.0 deploy --config sahana/feed/wrangler.jsonc`
- Portfolio's existing Vercel build assembles the frontend in `dist/sahana`, excludes the `feed` and `tests` directories, and includes the federal serverless function.
- `scripts/serve-sahana.mjs` previews at port 4189 using `/private/tmp/sahana-preview-feed.json`, a locally generated live-source check.

The first release was prepared in an isolated worktree at the exact current production revision, preserving unrelated local work and existing site routes.
