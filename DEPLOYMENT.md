# Production hosting

- Portfolio: Vercel project `reyash`, GitHub repository `ysunkara-27/reyash`, production branch `main`, canonical domain `www.ysunkara.com`.
- Planner: Vercel project `good-day`, GitHub repository `ysunkara-27/good-day`, production branch `main`, canonical domain `www.taskpup.lol`.
- Portfolio `/dog` links redirect to Taskpup, preserving nested paths. Taskpup accepts legacy `/dog` links too.
- Both apex domains redirect to their `www` domains through Vercel project domain settings.

## Portfolio build

`vercel.json` installs and builds Save the World and Office Hours. `node scripts/build-site.mjs` assembles their outputs and the existing static sites into `dist/`. Only `dist/` is published. Election classroom downloads remain under `/kwatnoskiapgov/`; the election app is under `/apgovelections/`.

For a manual release, run `vercel link --project reyash`, then `vercel --prod`. Normal pushes to `main` deploy through the existing GitHub integration.

## Data and environment

These frontend deployments require no Netlify environment variables or services. Rides and Taskpup retain their existing Cloudflare Worker (`hooraas-rides-api`) and D1 database (`hooraas-rides`). Google OAuth secrets remain on that Worker. Do not delete Cloudflare resources when retiring the old website host.

Porkbun manages `ysunkara.com` DNS. At cutover, authoritative DNS points the apex to `216.198.79.1` and `www` to `9b56f018eeafd9ed.vercel-dns-017.com`. Follow Vercel's current domain settings if these values change. Older recursive DNS caches may briefly retain the previous host.
