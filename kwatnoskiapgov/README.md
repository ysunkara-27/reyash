# Election Lab classroom platform

Live classroom: https://www.ysunkara.com/elections/

A teacher creates a class with 1–12 tables (five by default). Each student joins the class code on their own device, chooses their table, and claims one of six candidates. Tables play independent elections; the teacher can pause one or every table and project a dashboard that rotates every 5, 8 or 10 seconds.

## Run and verify

```sh
npm ci
npm run dev:api # persistent local Cloudflare Durable Object on :8787
npm run dev -- --port 5190
# Open http://localhost:5190/elections/
npm test
npm run lint
npm run test:classroom
npm run build
```

The browser tests start both local servers automatically (or reuse running servers). `ELECTION_URL` overrides the frontend address. Chromium must be installed (`npx playwright install chromium`). Test artifacts go to ignored `test-results/`.

`npm run build` writes the app and original material assets to `../apgovelections/`. The repository's portfolio builder copies this directory into its output. No changes to other portfolio applications are needed.

## Classroom instructions

1. Teacher → name the class → select five tables → Create classroom.
2. Save the private teacher recovery key from Teacher desk. Keep it off the projector. Recent sessions also remain available on the same browser.
3. Display the class code. Each student opens the app, enters the code, selects their table and claims a candidate with a first name/nickname.
4. Check six occupied candidates per table. For five students, use Assign remaining candidates to give one joined student a second candidate. It never creates an unplayable empty candidate.
5. Start all ready tables (or start a single table). Tables that are not ready stay in setup.
6. Select Smart Board view, or open the separate read-only projector link. Cycling can pause on a table; interval is adjustable.
7. Students follow the on-screen turn checklist. Draw three, play one or two, discard at least one, keep the rest, then finish. Only the current candidate's device can move. The board, counts and calendar are visible to everyone.
8. After all turns, any seated student or the teacher can count/advance once. January–June primaries are counted automatically. October has twelve turns, two for each candidate.
9. At the convention, choose among tied leaders if needed. Each nominee confirms five eligible platforms, or all available if fewer. Begin general election resets to exact printed shaded spaces and applies platforms and nominees. All six candidates continue as party teammates.
10. After November, count Election Day. Download a state-by-state CSV and discuss the reflection prompts.

## Recovery and connection behavior

- Authoritative server state persists across refreshes, closed tabs and Worker restarts.
- Private hands and turn permissions are checked on the server. Students cannot access another table or teacher controls. Monitor and teacher views do not include private hands or the deck order.
- Student sessions last 90 days. Refresh uses the same saved identity. If changing devices, the teacher releases the old candidate seat and the student claims it again; cards and progress remain with the candidate. The old credential loses control of that candidate.
- A teacher can restore on a different device with the class code and private recovery key. No shared default teacher password. Save the recovery key, then Lock teacher screen opens a read-only projector and removes teacher credentials from that browser. It does not pause games.
- State refreshes every 1.5 seconds. After six seconds without a successful sync the UI disables moves. Network requests time out after twelve seconds.
- Actions carry a table revision and unique request ID. Conflicting moves return fresh state for review. A lost response can be retried with the same ID without applying twice. There is no optimistic/offline move queue.
- Individual and whole-class pauses are independent. Resuming the class preserves any individual table pause.
- Undo last move is teacher-only and restores one game action, retaining current seat ownership. It cannot undo another table.
- Class-report JSON is a readable report, not a recovery credential or restorable backup. Live state is durable on the server.

## Game fidelity and explicit online adaptations

The final printed instructions, state cards, strategy deck, candidate cards and shaded voter board take precedence over the older brainstorm document or primary-type spreadsheet. See `AUDIT.md` for source corrections. The UI exposes the original card images and corrected game values.

- Exactly five shared tile spaces per group. Gains fill empties first, then replace a chosen rival. Fallback: largest opposing-party stack, then other rivals, with stable alphabetical tie breaking. Losses remove only the target's tiles.
- Incumbency gets only the incumbent party's printed shaded spaces. Candidate effects apply at the convention, as the final instructions specify.
- Primary state counts: 3, 14, 9, 9, 8, 8. January is IA/NH/SC. All remaining states are randomly allocated once per game. This is a classroom calendar.
- 100 classroom delegate points per state, based on its groups. Open = three candidate tiles. Closed = strict majority among that party's occupied tiles, evaluated separately per party. A party with no majority gets zero; it does not cancel the other party's winner.
- Non-100 printed percentages are normalized with largest remainders. Original values are retained alongside the corrected points.
- Each month uses a Fisher–Yates random order. October repeats that order for a second round.
- Scandals can target another candidate, or the opposite party in the general election. Other cards affect the player/their party.
- Cover-Up is armed on your turn and cancels the next targeted scandal. This replaces real-time interruption to avoid classroom connection delays. Mic Drop doubles positive gains on the next numeric card. Debate Walk-Off skips the player's next turn. Last Stand uses four distinct groups (+4, −1, −1, −1).
- At the convention, the printed board is restored. Platforms alternate parties with a randomly chosen first party, then candidate effects apply in that order. Fewer than five eligible platforms means selecting all available. Everyone keeps participating; hands carry over.
- Every state is counted from party tile control on Election Day, replacing fixed safe-state totals and the three-challenge step. Groups with equal party counts contribute to neither party. State ties use a server-side recorded coin flip. Each state is winner-take-all in this simplified model, including Maine/Nebraska. A 269–269 election is identified as contingent.

## Architecture

- `src/classroom/engine.ts`: pure authoritative rules shared by tests/server.
- `src/classroom/service.ts`: scoped sessions, redacted views, revisions, idempotency, recovery, one-step undo.
- `api/worker.js`: one SQLite-backed Cloudflare Durable Object per classroom; storage transactions serialize concurrent actions. Games are stored separately rather than in one growing classroom value.
- `src/classroom/ClassroomApp.tsx`, `Play.tsx`, `Board.tsx`, `Guide.tsx`: teacher, projector, student, tutorial, and transparent counting views.
- `src/classroom/materials.json`: source-derived 198 cards, 51 state cards, 19 exact base allocations.
- `scripts/extract-materials.py`: reproducible extraction (requires PyMuPDF). Originals used are in `public/materials/`. Raster images are rendered from supplied PDFs, not regenerated artwork.
- The old local-only app remains in `src/App.tsx` for reference; the entry point loads the new classroom app. Its browser-only sessions do not automatically migrate into live classrooms.

## Deployment

`wrangler.jsonc` defines a separate `apgov-classroom` Worker and durable storage namespace, isolated from the Rides/Taskpup APIs. Deploy the compiled app and API together with `npm run deploy:api` after building. Vercel serves the app at `/elections/` and proxies `/api/classes/*` to this Worker so classroom browsers use the same website for gameplay. CORS permits the portfolio origins and local development.
