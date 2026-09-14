# Rides

Static public UI with a Cloudflare Worker and D1 database. Public rides are automatic; only Meera and Yashaswi have admin editing access. No rider accounts are used.

## Data

The `/v2/state` endpoint migrates the existing roster into the separate `rides_v2` table on first read. Legacy data and existing hashed PINs are preserved. Event attendance and car overrides are separate from roster defaults. Writes compare a revision number to prevent silent overwrites. Verification is set server-side and cleared by edits; all unverified plans stay public. Missing locations, missing pins and seat shortages block verification.

Pins are saved once. Initial apartment labels are retained **without invented coordinates**. Admins must confirm the actual car-accessible pickup spots. A driver collects their home cluster first; other riders are assigned by incremental geographic trip distance subject to passenger capacity. Up to five pickup stops are exhaustively ordered to minimize geographic distance per car. This is a deterministic geographic suggestion, not a road-network/traffic optimizer or an ETA service. Driving links include the saved stops and split routes when needed for Google Maps mobile waypoint limits.

Practice destination centers: OpenStreetMap ways [44528462](https://www.openstreetmap.org/way/44528462), [44528577](https://www.openstreetmap.org/way/44528577), [44528718](https://www.openstreetmap.org/way/44528718), retrieved 2026-09-14. © OpenStreetMap contributors, ODbL. The map uses standard, on-demand OSM tiles with attribution; no bulk geocoding or live-device location.

## Test and deploy

`node --test rides/tests/model.test.mjs` tests routing and validation.

Local integration tests use a separate D1 directory `/private/tmp/hooraas-v2-test`, API at 8787, static page at 8093, and dummy local credentials. `rides/tests/browser.mjs` uses the existing Playwright dependency in `savetheworld` and Chrome. Run it only against a fresh local test dataset, followed by `rides/tests/api.mjs`. Never point these write tests at production.

Worker migration/deployment (from `rides/api`):

```
npx wrangler@4.128.0 d1 execute hooraas-rides --remote --file=v2.sql
npx wrangler@4.128.0 deploy
```

The static site needs no secret/environment variable. Worker secrets `SESSION_SECRET` and `MANAGER_SETUP_CODE` stay in Cloudflare. Existing admin PINs continue to work. First-time admins choose a numeric PIN and use the separate, unrestricted setup-code field. Public views refresh every minute; event links preserve the selected event.
