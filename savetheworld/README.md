# Save the World

A fictional university usability-engineering experiment from the Department of Yashability. A three-step briefing beside a readable emergency-shutdown diagram fits in one viewport. Named AI lab agents approach in the persistent header, including during shopping. The deliberately frustrating marketplace contains 101 products. No backend, accounts, real purchases, or payment details.

## Run

```sh
npm install
npm run dev
```

Open `http://localhost:5173/savetheworld/`. `npm test` checks catalogue invariants and timer behavior. `npm run build` produces `dist/`; `npm run preview` serves that build locally. `npm run test:e2e` tests the production build in installed Google Chrome (success, overtime completion, incorrect-purchase recovery, and mobile layout).

The Vite base is `/savetheworld/`. The root `vercel.json` installs and builds this app, then copies the compiled HTML and assets into `savetheworld/` inside Vercel's disposable build checkout. Vercel publishes the repository root to preserve the existing static pages. Do not run that deployment copy command in your working tree: use `npm run build` and `npm run preview` for local work. The older Netlify configuration publishes to `.netlify-publish/savetheworld/`. No client-side route rewrites are required: all screens use React state at the same URL. For GitHub Pages, copy `dist/` into the published site's `savetheworld/` directory. Refresh starts a new experiment.

## Instructor walkthrough (spoilers)

1. Complete the three briefing screens and begin the mission. The five-minute clock starts only here.
2. Open the shop. The unique correct product is **EM-07237**, E-Z Wipe AI Optimized Dry-Erase Whiteboard Eraser — Compact Edition ($4.87).
3. Either inspect product specifications or filter for Eraser, dry-erase YES, whiteboard-safe YES, AI-Optimized, Standard, Whiteboard, X7-B, and a maximum price between $4.87 and $5.00. Search **yashwipe** to return only the correct eraser, ignoring any conflicting filters. The exact SKU also works with compatible filters. There are 101 products; the unfiltered correct product is on page 7 (12 items/page).
4. Add it. Open Account settings → Item Vault / Purchase Bucket.
5. Answer **No** to retain the cart and enter checkout; Yes removes the items (they can be added again).
6. Make one selection on each screen. On human verification choose **A human buying an eraser**. Finalize the simulated purchase.
7. The room opens with the eraser equipped. Drag across the board. At least 88% of the original ink samples must be erased. Success requires finishing strictly before 300 seconds. After the deadline the timer counts upward, and all shopping and erasing remain available.

Incorrect purchases display a vague rejection and can be retried. Cart contents survive navigation, including browser Back; some backward navigation resets filters. No random event destroys the solution or prevents checkout. Motion respects reduced-motion preferences.

## Deliberate violations

1. Visual hierarchy: huge shipping ads, tiny product names and checkout controls.
2. Proximity: displaced filter spacing and product copy.
3. Contrast: bright red shop backgrounds with neon green, yellow, cyan, and pink text.
4. Consistency: four add-to-cart controls and changing cart terminology.
5. Affordances: promotional BUY NOW opens a sponsored product; enterprise buttons show a certificate notice; tiny SKU links open details; product art accepts double-click to add.
6. Search: OR matching, result order rotates on scrolling after escalation.
7. Filtering: a long distracting panel and unlabeled numeric slider values.
8. Memory: requirements are hidden behind three knowledge-management menus.
9. Feedback: generic procurement status and detail-page responses.
10. Confirmation: double-negative cart question.
11. Pagination: misleading page labels and looping NEXTISH.
12. Sizing: newsletter area dwarfs critical buttons.
13. Attention: animated sale graphics and useful safety information disguised as a sidebar ad (banner blindness).
14. Cart discovery: account settings.
15. Back behavior: occasional filter loss; purchases/cart remain intact.
16. Terminology: Cart/Bucket/Vault/Container; Board/Panel/Surface.
17. Information overload: metadata hides below irrelevant corporate copy.
18. Urgency: looping fake sale timers compete with the actual deadline.
19. Errors: generic messages with deterministic recovery.
20. Checkout: seven unnecessary steps.

The shop opens with bright red and low-contrast text, adds result motion and a newsletter after 35 seconds or several actions, and adds additional poor contrast, a floating ad after 85 seconds or further interaction. The initial briefing remains clear and self-paced (roughly 20–30 seconds to read).
