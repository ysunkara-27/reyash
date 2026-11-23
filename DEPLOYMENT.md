# Production hosting

- Portfolio: Vercel project `reyash`, GitHub repository `ysunkara-27/reyash`, production branch `main`, canonical domain `www.ysunkara.com`.
- Planner: Vercel project `good-day`, GitHub repository `ysunkara-27/good-day`, production branch `main`, canonical domain `www.taskpup.lol`.
- Portfolio `/dog` links redirect to Taskpup, preserving nested paths. Taskpup accepts legacy `/dog` links too.
- Both apex domains redirect to their `www` domains through Vercel project domain settings.

## Portfolio build

`vercel.json` installs and builds Save the World and Office Hours. `node scripts/build-site.mjs` assembles their outputs and the existing static sites into `dist/`. Only `dist/` is published. Election classroom downloads remain under `/kwatnoskiapgov/`; the election app is under `/apgovelections/`.

Read `AGENTS.md` and [the release safety skill](skills/ysunkara-release-safety/SKILL.md) before publishing. Prepare releases from the latest `origin/main`; this shared workspace may contain older configuration and unrelated unpublished apps. Port only the requested changes into a clean checkout. Normal pushes to `main` deploy through the existing GitHub integration.

`config/production-routes.json` records published page identities, copied directories, redirects, rewrites and serverless source files. `scripts/build-site.mjs` reads the copy list and validates the final output with `scripts/production-routes.mjs`. Missing pages, initial local scripts/stylesheets, routing rules or API source fail the Vercel build before promotion. Register new endpoints in the contract; update existing entries only for intentional changes.

Run `node --test scripts/production-routes.test.mjs` and the complete build command from `vercel.json` in the release checkout. After the exact commit's deployment is Ready, run `node scripts/production-routes.mjs --live https://www.ysunkara.com`. This read-only check verifies page identities, scripts/stylesheets and redirect destinations. Exercise the changed app and probe touched APIs separately. The contract does not test every downstream API dependency or guarantee uptime.

## Data and environment

These frontend deployments require no Netlify environment variables or services. Rides and Taskpup retain their existing Cloudflare Worker (`hooraas-rides-api`) and D1 database (`hooraas-rides`). Google OAuth secrets remain on that Worker. Do not delete Cloudflare resources when retiring the old website host.

Porkbun manages `ysunkara.com` DNS. At cutover, authoritative DNS points the apex to `216.198.79.1` and `www` to `9b56f018eeafd9ed.vercel-dns-017.com`. Follow Vercel's current domain settings if these values change. Older recursive DNS caches may briefly retain the previous host.
