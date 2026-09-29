# Raas Atlas

Public interactive 2026–27 lineup planner: https://ysunkara.com/atlas/

Run `node raas-planner/server.mjs` from the repository root and open http://127.0.0.1:8107/. No npm install is needed for the app. The loopback server serves only the public asset allowlist; it no longer runs flight jobs or exposes fare APIs. The public site uses the same interface, with analytics added by the site build.

## Views

- **Lineups:** all 17 competitions grouped by weekend, complete team names, team colours, drive/fly labels, weekend/search filters, CSV export, and a compact view (default on phones).
- **Tune model:** history/travel slider, break influence, zero/one/history break preferences, 1–5 attendance seasons, and optional difficulty preference. Presets recalculate the whole circuit. Changed teams are highlighted against the fixed five-year baseline.
- **Teams:** competition target, automatic/prefer/avoid choices, unavailable weekends, optional required rest, and drive/fly cutoff. Compare baseline/current schedules and two teams side by side. Click a competition for weighted contributions and source cells.
- **History:** independent five-year default, any single prior season, historical difficulty with coverage and workbook evidence, and circuit/team/year breakdowns of observed breaks.

Source dates, hosts, city coordinates, and workbook records remain read-only. Scenario preferences stay on the viewer's device. No API key, fare, budget, hotel, or estimated trip-cost inputs are published. V1 preferences are not imported because their cost and spacing assumptions are incompatible with this model.

## Evidence and rules

`data.json` contains 38 teams, 17 upcoming competitions, 1,680 unique historical attendance records over 17 seasons, and 179 sourced team-season performance records for 2021–22 through 2025–26. The XLSX importer is unchanged; original workbook cells are retained. Nationals and duplicate show-order lists are excluded. Historical aliases SRC → SCR and AKD x DRD → DRD remain documented importer assumptions. UW Seattle and Wisconsin remain distinct. Confirmed hosts include ECS/UVA, BND/Wisconsin, Mania/Illini, and BNB/Northeastern + BU.

`evidence.mjs` analyzes consecutive recorded spring appearances (January–April of the season's ending year). It deduplicates same-week appearances, excludes missing dates and fall-to-spring transitions, and never counts the weeks before the first or after the last appearance. Across five years:

| Season | 0 off | 1 off | 2 off | 3+ off | Gaps |
|---|---:|---:|---:|---:|---:|
| 2021–22 | 32 | 29 | 4 | 0 | 65 |
| 2022–23 | 43 | 34 | 8 | 4 | 89 |
| 2023–24 | 35 | 37 | 18 | 3 | 93 |
| 2024–25 | 44 | 34 | 2 | 1 | 81 |
| 2025–26 | 38 | 39 | 6 | 3 | 86 |
| Total | 192 | 173 | 38 | 11 | 414 |

88% of observed gaps contain zero or one weekend off. These are attendance gaps, not evidence of deliberate rest: historical hosting and unsuccessful applications are not reliably recorded.

Default rest frequencies blend each team's gap counts with two observations at circuit-wide rates. Schedule penalty is break influence × the difference between the team's most common smoothed bucket rate and each observed gap's bucket rate. The slider starts at 20. “One weekend off” penalizes consecutive weekends; “none” removes the soft penalty. Current hosting weekends count as commitments. Required rest is separately enforced as a hard constraint.

Targets start at the rounded median number of recorded spring appearances during active seasons, or 3 when no recent evidence exists. Zero targets are allowed. Attendance fit is the fraction of comparable editions attended during active team seasons, equally weighted. Events without comparable editions use that team's overall observed spring attendance rate; completely unknown teams use a documented neutral fallback of 0.5.

Default fit is 75% attendance and 25% travel ease. Travel ease is the percentile of straight-line distance among upcoming competitions, with half credit for ties. It is a practical travel proxy, not a dollar estimate. The drive/fly label defaults to a 500-mile cutoff and does not independently change fit. The slider weights, two-observation prior, and preference boosts are adjustable modelling choices, not learned probabilities. Optional field difficulty uses 25% of fit and scales history/travel proportionally. Prefer adds up to 20 points; avoid excludes the event.

`lineups.mjs` uses deterministic multi-start construction and local reassignment: fill six places first, then remaining team targets up to eight. It enforces hosting conflicts, same-week conflicts, unavailable weekends, avoids, target upper bounds, and optional strict rest. Shortages remain explicit. This is a heuristic; it does not guarantee global optimality or prove infeasibility. Proposed lineups are not confirmed attendance or selection predictions.

Historical team rating = 100 × bid points / (4 × appearances). Editions average known team ratings; the five-year baseline averages editions equally, using pooled five-year ratings. A selected prior year uses only that year's points and fields, without later results. Team schedule difficulty excludes that team from opponent fields. Unknown editions remain unknown and coverage is visible. These are retrospective results, not pre-event backtests or current roster ratings.

Coordinates are city-level Open-Meteo/GeoNames data in `geography.json`. Source dates come from the supplied workbook/screenshots and are not independently organizer-confirmed. Colours supplement names. The earlier airfare implementation remains in the repository for archival purposes, but is excluded from the public build and no longer used by the application. Hosted searches were paused, and the scheduled Worker cron was removed.

## Checks and release

```sh
node --test raas-planner/tests/evidence.test.mjs
node raas-planner/tests/public-browser.mjs
node scripts/build-site.mjs
```

Browser checks use the existing `savetheworld` Playwright installation and Chrome. They build a fresh public directory and check all lineups, filters, scenario changes, host blocking, team comparisons, saved preferences, historical views, mobile widths, absence of writes/fare requests, and asset isolation. Old model/backend tests describe the archived V1 implementation.

Public entry: `atlas.html`, `atlas.mjs`, `atlas.css`. Model: `evidence.mjs`, `lineups.mjs`, `planner-state.mjs`, `calendar.mjs`. `scripts/build_public.mjs` explicitly allowlists assets; `.local/`, worker code, keys, scripts and price data are never published. The root site build adds `/atlas/`; `/rides/` already links to it, and `/stats/` already tracks it separately.
