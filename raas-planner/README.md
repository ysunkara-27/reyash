# Raas Atlas

Interactive attendance and season planner for 2026–2027. Run from the repository root:

```sh
node raas-planner/server.mjs
```

Open http://127.0.0.1:8107/. No npm installation is required. The server binds to loopback only. The original workbook is unchanged; no existing apps or deployment settings are changed.

The imported data includes 38 teams (37 from the workbook plus user-confirmed Wisconsin Raas), 17 upcoming competitions, and 1,680 unique team–competition attendance records over 17 historical seasons. `scripts/import_workbook.py` reads the source XLSX with Python's standard library. Each record retains its worksheet and cell. Nationals and duplicate show-order lists are excluded. Historical aliases `SRC` → `SCR` and `AKD x DRD` → `DRD` are explicit assumptions in the importer. UW and Wisconsin remain separate.

## Model

The default five recorded seasons inform a smoothed, recency-weighted attendance factor. Missing team-seasons and competitions without attendance observations are excluded from its denominator. A heuristic weighted average combines history, straight-line distance, airfare, estimated total trip cost, and travel time. Weights and costs are editable; these are not learned probabilities.

The circuit allocator assigns teams jointly: fill each competition to six, place remaining team demand up to eight, then improve fit minus rest penalties through reassignment. Multiple deterministic starts improve the draft; this heuristic does not prove global optimality or infeasibility. Team event targets are upper limits. It blocks all competitions in a host team's Monday–Sunday week and disallows double-booking. Hosting and competing count toward rest requirements. A preferred rest gap adds a soft penalty; a strict gap rules out nearby events and can cause a shortfall. Budgets exclude unknown-cost trips.

All complete lineups have 6–8 teams per event. Incomplete drafts explicitly show shortages, while maintaining the maximum of eight and team constraints. Actual selection decisions are not modeled. Missing prices receive a neutral factor rather than being treated as free. Default costs, airports, driving ratios, and travel-time estimates are assumptions. Geography is city-level, sourced from state-matched Open-Meteo/GeoNames responses in `geography.json`.

## Live flight connection (SerpApi Free recommended)

Use **Flight prices → Connect & fetch prices** to save a SerpApi Free key and start a backend queue. The account must be active with a zero-dollar monthly price. SerpApi advertises 250 searches/month and 50/hour (https://serpapi.com/pricing, checked 2026-09-27). The app allows at most 40 searches in a rolling hour and preserves 25 credits for manual searches. It checks the free Account API before each uncached lookup. No automatic paid upgrade is made.

The initial queue can cover proposed schedules plus two flight alternatives per team (127 unique routes with default inputs), or all eligible flight routes (382). Identical airport/date routes are searched once; proposed trips have priority. Choose daily, weekly, fortnightly, or monthly refresh. These are desired intervals subject to free quota; 382 routes cannot all be fetched in one 250-search monthly allowance. The queue resumes after hourly limits and checks for monthly renewal. Browser closure does not stop the queue. The computer and local server must stay running; this is not a deployed hosted service or an operating-system startup job.

`fare-store.mjs` persists the queue, rolling search counter, and price snapshots in `.local/fares.json`; credentials go in `.local/secrets.json`. The directory is mode 0700 and files are 0600, excluded by the app's `.gitignore`, and inaccessible through the static server. The key is never returned through an API, included in scenario exports, or stored in browser storage. Disconnect removes the saved key and pauses refresh. `SERPAPI_API_KEY` can alternatively be supplied in the server environment; an environment-provided key remains under the operator's control. `RAAS_DATA_DIR` can override the backend data directory.

Round-trip USD searches use exact airports and dates, one adult, economy, and at most one stop: depart the day before competition, return the day after. Only the outbound itinerary is fetched. Saved prices remain available as dated planning estimates after the six-hour freshness window; this is not a booking guarantee or proof of group availability. Failed/no-result refreshes retain older estimates. Browser tabs merge backend quotes by exact airport pair and date; valid manual prices take precedence. Changes to scenario airports/dates require updating the queue from Flight prices. Manual quotes expire after 24 hours.

Current limitations: academic calendars are verified only for UVA; lodging prices are assumptions. Organizers have not independently confirmed the workbook schedule. The UI discloses these gaps. Connection state and price coverage are visible in Flight prices.

Sources: supplied workbook and screenshots; https://open-meteo.com/en/docs/geocoding-api ; https://registrar.virginia.edu/calendar/academic/2026-2027 ; https://duffel.com/docs/api/offer-requests ; University of Washington Board records linked in the app. User-confirmed host updates: Bucky Noh Dhol → Wisconsin Raas; Raas Mania → Illini; Boston Ni Baaje → Northeastern Nakhraas and BU. These supplement the workbook. Saved scenarios automatically receive this one-time update while keeping their dates, prices, and preferences.

## Checks

```sh
node --test raas-planner/tests/model.test.mjs raas-planner/tests/backend.test.mjs
node raas-planner/tests/browser.mjs
```

Browser checks use the existing repository Playwright installation and Chrome, and run against the local server with an isolated browser context. Scenario edits persist in localStorage; JSON export/restore and all-team CSV export are available. This app has not been deployed publicly.

## Circuit and schedule comparisons

Across the circuit has a competition calendar (all 17 events with suggested attendees), a 38-team weekend schedule grid, and the original fit-score matrix. Hosting, competing, unavailable, and free weekends are distinct; empty weekends between events remain visible. Schedule CSV exports include all teams and weekends.

Compare schedules supports up to four teams side by side, showing costs with missing-fare counts, travel, free weekends, rest gaps, shared competitions, and each event’s fit. Save a baseline before changing inputs to compare a frozen snapshot against recalculated schedules; the baseline persists in browser storage and scenario JSON exports. Host/date/rest changes affect current schedules without rewriting the snapshot.

## Explanations, what-if models, and historical strength

Advanced weights are collapsed initially. Team colors reuse the existing bid-points registry; UW Seattle uses official purple, distinct from Wisconsin red. Names remain visible because some schools share colors.

Competition details show exact signal calculations, normalized weights, score contributions, attendance weights and source cells, cost arithmetic, and historical opponent evidence. Schedule summaries expose the sum of fit scores minus rest penalties.

Seven nonmutating what-if previews cover balanced weights, last-two-season history, travel cost, recovery, +25% entered airfare, stronger fields, and lighter fields. Applying a preset preserves unrelated inputs and an existing baseline; creates a baseline when absent. It is a heuristic comparison, not a fitted statistical forecast.

Historical strength has 179 sourced team-season records across 2021–2022 through 2025–2026. The separate Strength history control supports the last 2, 3, 4, or 5 seasons (default 2), independently of attendance history. Team rating = 100 × summed bid points / (4 × regular-season appearances). Each past field averages known opponent ratings, excluding the selected team. Event strength averages available editions equally; schedule strength averages known events and displays coverage. No-data fields remain unknown in displays and use a documented neutral 0.5 only when strength is given nonzero ranking weight. Retrospective past-season schedule comparisons use pooled ratings over the selected strength window, so these are not pre-event forecasts or validation results. Nationals excluded. Strength is optional to display and defaults to zero influence on attendance fit.

## Public Atlas and hosted refresh

Production lives at `/atlas/` on ysunkara.com. The public build uses an explicit asset allowlist. Viewers can change their personal forecast weights, event targets, rest preferences, strength window, and what-if models in browser storage; competition/source inputs, quotes, imports, API credentials, and refresh controls are read-only. Historical strength has its own navigation tab and competition evidence selector. The rides page links to Atlas, and Atlas is a separate source in the private stats dashboard.

`worker/` contains the isolated `raas-atlas-api` Cloudflare Worker and `raas-atlas` D1 database. A five-minute cron checks the queue, processes up to four due routes, and enforces the same 40/hour and 25-credit-reserve limits. Each route retains the selected refresh interval (currently monthly). D1 stores snapshots, route progress, and rate-limit history. A database lease prevents concurrent refresh workers. The free key and admin token are private Worker secrets. GET `/fares` is public; all `/admin/*` operations require the private admin token. Public page visits never trigger paid/provider searches.

The initial hosted migration preserved the existing route list, quotes, monthly interval, and recent searches, then paused the local queue to avoid duplicate quota usage. The hosted scheduler continues without the laptop. `scripts/migrate_hosted.mjs` installs secrets through CLI stdin without printing them, verifies the free account, imports the saved store, and produces a public fallback snapshot. `--resume` skips reinstalling secrets. Do not rerun a migration over newer hosted data without first reconciling the local copy.

Checks also include `node --test raas-planner/tests/worker.test.mjs` and `node raas-planner/tests/public-browser.mjs`.
