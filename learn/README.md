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
