# Classroom audit — October 7, 2026

The June first draft could not support the requested classroom: its sessions and teacher password were browser-local, the student interface was read-only, and the Smart Board only saw local games. The new default entry point is a server-backed classroom with scoped student identities.

## Findings addressed

| Area | Previous behavior | Current classroom behavior |
|---|---|---|
| Five tables / individual devices | Game codes only searched localStorage | One persistent classroom, up to 12 separate six-candidate games |
| Student participation | Read-only candidate dashboard | Private hand, draw/play/discard/finish workflow, server-enforced turns |
| Teacher access | Shared browser password | Unique private teacher credential, cross-device recovery |
| Turn progression | Wrapped back to the first player forever | A round ends; counts/advance unlock only when all turns finish |
| October | No explicit second round enforcement | Twelve turns, two per candidate |
| Calendar | Static preselected lists; redraw could exhaust the pool | January fixed, remaining 48 states shuffled once into 14/9/9/8/8 |
| Tokens | Unbounded numeric counters | Five shared spaces, explicit rival replacement previews |
| Incumbent and convention base | Three tokens for one party in every group | Exact 19-group shaded layout extracted from supplied PPTX |
| Card data | Small selection of cards with invented/older effects | All 198 cards extracted from the final printed PDF, with images |
| State data | Nineteen-group approximate profiles | Actual listed groups and printed percentages from all 51 cards |
| Delegate counts | Repeated finalization could add delegates twice | Phase/round validation, revisions, idempotent actions, recorded results |
| Closed primaries | A tie in one party erased the other party’s winner | Strict majorities evaluated independently per party |
| Convention | Could advance without a complete reset/platform flow | Nomination, eligible-platform selection, reset and effects are one guarded sequence |
| Projector | Local data; no classroom network | Read-only server view, 5/8/10-second cycling, pause/manual navigation |
| Pause | Browser-only | Server-enforced whole-class and individual-table pauses |
| Reconnect | No cross-device source of truth | Persisted server state, saved identities, safe retries, fresh-state conflicts |
| Beginner guidance | Tabs without an end-to-end flow | Automatic first-time tutorial, worked counting example, next-action panel |

## Source hierarchy

The final **Elections Game Instructions**, **Strategy and Event Cards PDF**, **State Cards PDF**, **Candidate Cards PDF**, **Game Board PDF**, and **Voter Group Board PPTX** govern gameplay. The earlier **Political Game Mechanics Design** and **Card Game Categories and Mechanics** are design drafts. For example, the draft Union Boss card says +3 labor; the final printed card says +1 labor and −2 corporate executives. The final printed card is used.

The primary-type spreadsheet contains more complex real-world categories and sometimes contradicts the cards. This teaching game uses the cards’ own open/closed labels. The UI explains that these are simplified classroom rules, not current election-law guidance.

Original materials used for extraction are retained under `public/materials/`. `scripts/extract-materials.py` regenerates `materials.json` and per-card PNGs, failing if an effect cannot be mapped. All 198 cards, 51 states, 19 groups, 100-point state allocations, and the 538-EV total are checked automatically.

## Printed source corrections

| State | Printed value | Game value |
|---|---|---|
| Alabama, Arkansas, Kentucky, Louisiana, South Carolina, Tennessee, West Virginia | Group percentages total 104 | Proportional allocation to 100 with largest remainders |
| Idaho | Group percentages total 102 | Proportional allocation to 100 with largest remainders |
| Colorado | 11 electoral votes | 10 |
| New Hampshire | 10 electoral votes | 4 |
| North Dakota | 10 electoral votes | 3 |
| Maine | “Secular/Religious” group label | Mapped to the board’s Secular/Non-Religious group |

Electoral votes were checked against the [National Archives allocation](https://www.archives.gov/electoral-college/allocation). The original PDF is always available beside the corrected game data. Percentages remain classroom abstractions.

## Intentional online adaptations

The in-app “Online rules & source corrections” panel and README list the complete adaptations. The significant choices are full-map counting instead of safe-state totals plus three challenges; server-recorded coin flips for tied states; advance-on-your-turn Cover-Up protection against the next scandal; explicit next-card Mic Drop duration; all-available platforms if fewer than five; and deterministic fallback replacement after the selected rival runs out of tiles.

A class can still compare these simplifications with real electoral rules during reflection. No real party delegate counts are invented: the original instructions explicitly prescribe 100 classroom delegates per state.

## Verification

Automated engine/service tests cover five complete campaigns through Election Day, all monthly state allocations, October’s twelve turns, the convention, 538 electoral votes, five-space limits, independent closed-primary awards, special cards, scoped credentials, private hands, pause enforcement, stale revisions and duplicate requests. Browser tests use a teacher, 30 separate student browser contexts, and a separate projector; they also exercise the tutorial, live moves, refresh, reconnect and narrow-screen counting.

Executed successfully: production build and TypeScript checks; 37 unit/service tests across eight files; five complete concurrent HTTP campaigns; teacher + 30 independent student browser rehearsal; first-time tutorial; and hosted teacher/student/recovery/locked-projector smoke test. The published site is https://www.ysunkara.com/elections/. School Wi-Fi/firewall access and the physical Smart Board cannot be reproduced by a local browser rehearsal; test the production URL on that equipment before class.
