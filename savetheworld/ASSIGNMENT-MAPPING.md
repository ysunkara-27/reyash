# How this matches the usability assignment

I kept the actual job easy to explain: erase the shutdown instructions before the AI lab agents reach the room. The frustration is in the store, not in guessing what the assignment is asking someone to do. There are 101 products, one product meets the three checks, and checkout and erasing still work.

The concept names below use the principles you gave me. I have not added extra UX theories to make the list look longer. Each row points to something that is present in the current interface; the task-clarity and completion requirements remain guardrails so a participant can finish.

| Principle from your list | Where it shows up |
| --- | --- |
| Use distinctive colors | The shop's bright red field and competing saturated accents make color memorable but less useful for separating the important controls from promotions. |
| Be consistent | Equivalent add-to-cart actions change label and styling across product cards. The same container is called a cart, bucket, vault, and order container. |
| Avoid ambiguity | The cart asks “Would you like to NOT avoid removing this item?” and the final review asks “Is this not the right information?” The adjacent Yes/No choices are intentionally easy to misread; the item remains recoverable. |
| Present long information in a terse way | The product detail view expands into irrelevant company, shipping, texture, magnet, and sustainability copy before surfacing useful specifications in Appendix C. |
| Present all info needed for a task on a single screen | The mission is explained in three short briefing screens; item checks, product specifications, cart, checkout questions, and physical erasing appear in separate screens. The three requirements are repeated in the shop so the task stays possible. |
| Limit calls to action per screen | Search, filters, product links, acquisition buttons, save hearts, ads, and pagination compete in the marketplace. Checkout keeps the deliberately long sequence you asked to retain. |
| Use visual cues to let users recognize where they are | Department/marketplace/account/checkout terminology and mixed visual treatments make the current step less consistent than the persistent approach monitor. The monitor is kept as a helpful orientation cue. |
| Avoid text on noisy backgrounds | Red shop surfaces and promotional panels put selected neon or low-contrast text over visually loud areas. The mission instructions and final task controls stay on calmer surfaces. |
| Tell users explicitly what they need to know | The three requirements are stated clearly in the briefing and repeated in the filter sidebar, but the actual specifications on individual items are visually buried in the long detail view. This is a partial violation, not an attempt to hide what the task is. |
| Minimize the number and complexity of settings | The sidebar has nine selectors. The price range is not initially available: a randomized pair of five-digit addends gates it, and paste is blocked in the answer field. |
| Provide all options | The catalogue does not show all 101 items together. It uses ten pages of 11 products (the last page has two); the products are shuffled when the mission begins, so the target can land on any page. |
| Don't make people calculate | The randomized five-digit addition is the finite, solvable gate for opening the price slider. It has no timer, and the user can retry. |

Search's OR matching and the ad inserted among the sidebar controls implement the search and banner-blindness examples you specifically asked for. They are not being presented here as additional principles. The pagination and price gate likewise add effort, but do not disable the task: all ten pages can be visited, the arithmetic can be entered by hand, and the one qualifying product can still be bought.

## The actual task and checks

The one task is to erase the board. The product check is limited to these three requirements:

1. **Compatible:** Whiteboard compatible.
2. **AI attribute:** AI-Optimized.
3. **Price:** less than $5.

The valid item is currently SKU EM-07237 at $4.87. Its position in the unfiltered catalogue is randomized for each mission and can be on any page. Product type and other metadata are not additional mission requirements. The price scale spans $0.10–$100 but has no visible numeric tick labels; the assignment gate only controls when it can be used.

## How I read the screenshots you sent

- **Role 1 / Objective** says to define a clear goal and make the task accomplishable (your first screenshot and Criterion Long Description screenshot 1). That's why this remains a single erase-the-board task with a correct product and a complete end-to-end path.
- **Criterion Long Description** asks that concepts come from class, be marked, and that a task cheat sheet be available (your screenshot 3). This table marks the concepts you supplied; the README's instructor walkthrough is the cheat sheet.
- **Criterion Long Description** asks for a regular-site baseline, at least 5× interaction cost, and testing with other people (your screenshot 4). The app's 3½-minute countdown is a story mechanic, not evidence of a 5× overhead. That part still needs a timed comparison with classmates or other participants; I have not claimed it is measured.
- **Criterion Long Description** asks for at least ten unique concepts and warns against random delays or impossible controls (your screenshot 5). The table maps twelve supplied principles. The random elements are only catalogue order and the arithmetic operands; neither blocks a control or makes the arithmetic unsolvable. The application and its automated completion path remain functional.

The automated tests cover product uniqueness, all ten catalogue pages, the price gate (including blocked paste), checkout recovery, mobile interaction, and completing the physical wipe. Automated tests do not replace the participant timing study requested in the assignment brief.
