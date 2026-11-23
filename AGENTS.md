# Production availability

This repository publishes many independent sites on ysunkara.com through one Vercel project (`reyash`). A successful deployment can still remove unrelated endpoints. Preserve every existing public page, asset, redirect, proxy and API when changing any part of this project.

For website creation, endpoint fixes, routing, builds or deployments, read and apply [the release safety skill](skills/ysunkara-release-safety/SKILL.md). This applies even when a different website or hosting skill is also in use.

- Start releases from the latest `origin/main` in an isolated checkout when this workspace is dirty or behind production. Carry over only the requested changes. Never deploy this entire working directory simply to publish one subsite; never replace current production routing/build configuration with an older local copy.
- `config/production-routes.json` is the availability contract. Register new pages and routing rules, preserve existing entries, and remove or migrate an endpoint only when the user's task explicitly calls for it. Do not weaken checks to make an unrelated release pass.
- Run the relevant app checks, `node --test scripts/production-routes.test.mjs`, and the configured full build. The build must run the production contract against the final `dist/`. Use the actual deployment source, not an unrelated local build, for validation.
- Push complete source, build configuration and routes together to `main` for the existing Vercel integration. Wait for that exact commit's deployment to become Ready. Run `node scripts/production-routes.mjs --live https://www.ysunkara.com` and exercise the changed interaction before claiming success. Check the apex URL as well when relevant.
- If a release breaks a previously healthy route, restore it immediately with a focused forward fix or roll back to the previously verified deployment. Do not overwrite a concurrent newer deployment. Keep the repository fix and production synchronized.

These instructions authorize no additional publication, deletion, access change or endpoint retirement beyond the user's task.
