# UE Prototype

From the portfolio root, run `python3 -m http.server 8136` and open `http://localhost:8136/UEPrototype/`. The prototype is plain HTML, CSS, and browser JavaScript. The desktop review size is 1440 × 900.

| Task | Test instruction | Completion |
| --- | --- | --- |
| 1 · Provider | Find a psychologist in Todd County. | Identify a matching provider and open its details. |
| 2 · Careers | Find a Health and Family Services job in Frankfort. | Find matching openings and open Healthcare Administrator II. |
| 3 · Benefits and Assistance | Find a support group for recovering alcoholics. | Open Recovery Connections and find information about its peer support group. |

The Kentucky redesign PDF supplies the Careers screens (pages 64–66) and the Kynect visual compositions (pages 50–56). Careers starts with blank filters. Kynect starts its search at ZIP 40507, as shown in the supplied composition. ZIP codes 40502, 40508, and 40601 can also be used with the sample records. “Not implemented” dialogs mark off-task actions. Refresh to restart the current task's filters or use browser history to return to the launcher.

Edit the career sample records in `careers.mjs` and the recovery records and illustrative map in `benefits.mjs`. The Provider button opens the shared `../ProviderTask/` directory, where the provider records and county map are stored. Provider records, jobs, recovery meetings, and locations are illustrative.
