# Save the World

A fictional university usability-engineering experiment from the Department of Yashability. A three-step briefing beside a readable emergency-shutdown diagram fits in one viewport. Named AI lab agents approach in the persistent header, including during shopping. The deliberately frustrating marketplace contains 101 products. No backend, accounts, real purchases, or payment details.

On phones, the filters collapse above a full-width catalogue, menus stay within the viewport, and essential controls have touch-sized targets. The red palette, misleading hierarchy, terminology, and spacing remain intentional. Finger erasing uses a minimum 16px contact width; the same 88% ink threshold applies. Short landscape screens can scroll rather than clipping the mission.

## Run

```sh
npm install
npm run dev
```

Open `http://localhost:5173/savetheworld/`. `npm test` checks catalogue invariants and timer behavior. `npm run build` produces `dist/`; `npm run preview` serves that build locally. `npm run test:e2e` tests the production build in installed Google Chrome (success, overtime completion, incorrect-purchase recovery, and mobile layout).

The Vite base is `/savetheworld/`. The root `vercel.json` builds this app and Office Hours, then `scripts/build-site.mjs` assembles the portfolio's public files in `dist/`. Vercel publishes only that directory. No client-side route rewrites are required: all screens use React state at the same URL. Refresh starts a new experiment.

## Instructor walkthrough (spoilers)

1. Complete the three briefing screens and begin the mission. The 3½-minute clock starts only here.
2. Open the shop. The unique correct product is **EM-07237**, E-Z Wipe AI Optimized Dry-Erase Whiteboard Eraser — Compact Edition ($4.87).
3. Use only three mission filters: **Compatible = Whiteboard compatible**, **AI readiness = AI-Optimized**, and the unlabeled **Price range** slider ($0.10–$100). These identify exactly one eraser. Size, style, classification, magnetism, and the other sidebar attributes are optional distractions, not purchase requirements. The AI and surface filters leave multiple prices; only one candidate costs less than $5. The correct eraser is also on the first catalogue page. Search **yashwipe** for the instructor shortcut, which ignores conflicting filters.
4. Add it. Open Account settings → Shopping cart.
5. Answer **No** to retain the cart and enter checkout; Yes removes the items (they can be added again).
6. Make one selection on each screen. On human verification choose **A human buying an eraser**. Final confirmation asks **Is this not the right information?** The **Yes** button occupies the previous Continue location and returns to the cart, retaining the item but restarting checkout. **No — information is correct** completes the simulated purchase.
7. The room opens with a large eraser. Click **Pick up eraser**, then press and drag across the board. At least 88% of the original ink samples must be erased. Success requires finishing strictly before 210 seconds. After the deadline the timer counts upward, and all shopping and erasing remain available.

Incorrect purchases return to the room with “You got the wrong eraser. Please go find the right one.” The timer continues and the user can shop again. Cart contents survive navigation, including browser Back; some backward navigation resets filters. No random event destroys the solution or prevents checkout. Motion respects reduced-motion preferences.

## Deliberate violations

1. Visual hierarchy: huge shipping ads, tiny product names and checkout controls.
2. Proximity: displaced filter spacing and product copy.
3. Contrast: bright red shop backgrounds with neon green, yellow, cyan, and pink text.
4. Consistency: four add-to-cart controls and changing cart terminology.
5. Affordances: promotional banners dismiss with a brief joke rather than blocking the task; enterprise buttons show a certificate notice; tiny SKU links open details; product art accepts double-click to add.
6. Search: OR matching, result order rotates on scrolling after escalation.
7. Filtering: nine dropdowns (AI readiness and surface compatibility first), a distracting sidebar ad, and an unlabeled $0.10–$100 price slider near the bottom.
8. Memory: requirements are visible in the sidebar and one click inside Account settings.
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
