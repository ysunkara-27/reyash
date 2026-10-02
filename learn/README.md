# Learn

Static data-science preparation workspace at `/learn/`. Built by `scripts/build-site.mjs`.

- `content.mjs`: original diagnostic, lessons, quizzes, mock questions and executable answer checks.
- `app.mjs`: local progress, onboarding, timing, scoring, notebook export and review.
- `worker.mjs`: Pyodide 0.27.7 browser Python worker. Downloads packages from jsDelivr; uses Agg for matplotlib.
- Progress is localStorage only (`learn-ds-v1`). Export/import JSON for backups or moving devices.
- No AI service, telemetry of answers, server-side scoring, or account login is introduced.
- Coding checks validate outputs and selected contracts; they do not prove absence of leakage or assess all code-quality choices. Human review remains necessary.
- Framework details vary. The specific invite and test rules are authoritative. These are original exercises, not real assessment questions.

Verification: Chrome desktop and 390px mobile; all coding reference answers run in Pyodide, including sklearn and SQLite; diagnostic expiration and code persistence; full mock grading; hint/answer/redo controls. The test clock persists across refreshes.

## Assessment practice expansion

`practice.mjs` adds nine business-focused packs, 42 drills (30 Python/SQL + 12 numeric probability), 18 worked examples, 20 scenario questions, and two repeat-practice 30-minute sprints. Total: 26 lessons/packs, 77 practice drills, 40 concept questions, and 5 timed sessions. Existing task IDs and local progress are preserved.

Run the expansion checks with `node learn/tests/expansion.mjs` while the repository is served at `http://127.0.0.1:8098`; set `LEARN_URL` for a deployed site. Checks execute examples and reference answers in browser Python, verify independently calculated fixtures, and exercise the new navigation and grading controls.

## Complete offline practice

Open **Offline access → Download everything for offline** while connected. This explicitly saves the full course and the pinned Pyodide runtime, pandas, NumPy, SciPy, scikit-learn, matplotlib, SQLite, and their transitive dependencies. Cache inventory is checked before displaying readiness; a smoke test verifies SQL, model fitting, and plotting. Progress remains in the existing localStorage key. External documentation sites and Colab are not mirrored.

`sw.js` owns only the `/learn` scope; `vercel.json` permits that scope so `/learn` and `/learn/` both work offline. CDN resources are pinned to Pyodide 0.27.7 and cached only from that release directory. Bump `BUILD` in `sw.js` whenever deploying changed app/course assets. Keep the core asset list current. Do not delete runtime caches on a course update; complete partial downloads on retry. Browser/site-data removal can remove offline data; request persistent storage and offer progress export.

`node learn/tests/offline.mjs` starts a local test server with the scope header, downloads resources in a new persistent browser profile, clears its HTTP cache, closes the browser, and starts a new browser with networking disabled and an unreachable outbound proxy. It verifies cold navigation, draft persistence, pandas/SQL/sklearn/plot execution, missing-cache detection, and failed offline repair. Set `LEARN_URL=https://www.ysunkara.com/learn` to test production.
