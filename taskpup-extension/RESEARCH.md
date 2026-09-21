# A quiet Task Pup companion across browser tabs

Research and source inspection: September 21, 2026. This document separates platform facts from the implementation choices made here.

## What Task Pup does today

Inspected the live `https://www.taskpup.lol/` HTML and `app.mjs`, the current `good-day` production branch, and the shared `reyash/dog` source. The live site is a static, framework-free planner. Its existing Cloudflare Worker owns account sessions, plans, profiles, and earned care. The separate Vercel `good-day` project serves the frontend; updating `reyash/dog` alone does not update Task Pup.

`createCompanion` renders an inline SVG dog or cat, positions it in free page space, and changes behavior in response to care and focus. Its pathfinding is designed for the planner's known components. Reusing that whole wandering engine on arbitrary websites would require scanning their layouts, avoiding their controls, and responding to frequent DOM changes. That is unnecessary work and an unpredictable browsing experience.

The app already holds everything the browser companion needs: the chosen pet's name/coat/collar/species, two small care flags, and whether its timer is running. Tasks, calendar events, last-task memories, account identity, tokens, and XP are unnecessary for the overlay. We reuse the SVG artwork but use a much smaller positioning/behavior layer.

## Options considered

| Approach | Advantages | Costs / limits | Decision |
| --- | --- | --- | --- |
| Manifest V3 content-script extension | Pet can sit inside ordinary pages; persists across navigation; direct local installation | Requires website access; cannot draw over browser-owned/protected pages | Best match |
| Document Picture-in-Picture | Website can open an always-on-top HTML companion window | Separate window and browser controls; requires an initiating user gesture; lifetime tied to opener | Useful possible alternative, less suitable for an unobtrusive in-page pet |
| Chrome side panel | Persistent extension UI beside sites | Occupies meaningful horizontal space rather than a tiny corner | Better for a planner, not this companion |
| Userscript | A small injection prototype is straightforward | Still needs a script-manager extension and site access; a second installation and update surface | Little advantage over a dedicated, small extension |
| Native desktop overlay | Could follow nonbrowser apps and browser chrome | App installation, OS-specific behavior and window-management complexity | Outside this browser-focused request |
| Ordinary Task Pup tab / PWA | No extension installation | A website cannot inject a persistent companion into unrelated origins | Cannot provide the requested cross-tab experience |

Chrome documents content scripts as isolated execution environments that can modify page DOM. Static scripts run at the configured lifecycle stage; dynamically registered scripts suit user-granted website access. We use top-frame-only scripts at `document_idle`. There is no repeated pet in each embedded frame. [Chrome: content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

Chrome's unpacked workflow is Developer mode → Load unpacked → select the directory containing the manifest. No store listing is needed for personal use. The folder must remain on disk; changing files requires reloading the extension, and existing pages may need a refresh. This is a local developer installation, not an auto-updating distribution system. [Chrome: Hello World / load unpacked](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world)

Document Picture-in-Picture supports arbitrary HTML in a floating window, but opening requires a user gesture and the window cannot outlive its opener. Those restrictions and the separate window treatment led us to prefer the content-script approach. [Chrome: Document Picture-in-Picture](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)

Chrome's side panel API provides extension UI alongside page content and supports global or per-tab panels. It is a reasonable future location for an optional planner, but it changes the browsing layout more than a 44–64 px pet. [Chrome: side panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)

## Chosen architecture

1. Task Pup publishes a versioned, display-only snapshot when appearance, care, login, or focus changes.
2. An isolated script installed only on the two exact Task Pup HTTPS origins forwards that snapshot to the extension worker. A one-minute handshake refreshes freshness and recovers missed initialization events. The script never reads localStorage or credentials.
3. The worker checks the actual sender origin and frame, validates fields against fixed allowlists, and strips unknown fields. It persists the snapshot in extension-local storage, restricted to trusted extension contexts.
4. After the user grants optional website access, a dynamically registered content script shows the pet on ordinary HTTP(S) pages. Its closed Shadow DOM and constructed stylesheet isolate it from page styling. The native Task Pup pet is detected and not duplicated.
5. The toolbar popup owns global settings. The on-page menu can only open Task Pup, move locally, or hide its actual sender hostname. The website bridge cannot change global extension preferences.

Optional permissions let access be requested in response to a user action rather than granting all websites at installation. `activeTab` alone would only cover individually invoked tabs, so it cannot provide automatic following. The manifest requests `storage` and `scripting`; the popup asks for HTTP(S) origins only when “Show on websites” is clicked. No history, cookies, webRequest, debugger, identity, notifications, clipboard, or remote API permission is requested. Chrome's broad website-access warning is still real: content scripts technically have DOM access even though this implementation does not collect page contents. [Chrome: permissions](https://developer.chrome.com/docs/extensions/reference/api/permissions), [Chrome: declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)

The extension does not fetch the account API. This avoids storing a full planner session inside a broadly injected extension, adding password entry, or creating a new token/revocation backend. Browser pages send only the minimum cosmetic state. The cost is explicit: when Task Pup is closed, the extension retains the last synced appearance and care state; it is not a background cloud-sync client. Reopen Task Pup to refresh. Focus expires locally after two minutes without a heartbeat, so a closed planner cannot leave a stale focus state indefinitely.

Service workers may be stopped when idle, so no essential state lives exclusively in globals. Preferences and the snapshot use `chrome.storage.local`; content-script registration persists. A disconnected companion ignores future snapshots until the user explicitly reconnects. No forever-running worker, polling API, or offscreen keepalive is used. [Chrome: worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [Chrome: storage and access levels](https://developer.chrome.com/docs/extensions/reference/api/storage)

## Attention and efficiency

Default: mostly still, 52 px, bottom right, no sound, badges, popovers, or notifications on task completion. The pet’s controls open only on a click or keyboard activation. Dragging snaps it to the nearest bottom corner. Preferences include 44/52/64 px, left/right, snooze for an hour, persistent site exclusions, and a global off switch.

Optional gentle wandering is a 24 px inward-and-back stroll, lasting six seconds and no more often than once per two quiet minutes. It stops for text entry, the pet menu, a running Task Pup focus timer, reduced-motion preference, and the Task Pup “pause wandering” preference. Hidden tabs and fullscreen pages suppress the pet. Background tabs have no active animation. One low-frequency interval checks freshness; there is no requestAnimationFrame loop, full-page mutation observer, or page-layout scan. The only profile HTML is the local, validated SVG renderer; text labels use textContent.

These are implementation choices to keep attention cost low, not claims that any exact pixel size or animation cadence has been validated by a user study. Real browsing on the user's common sites remains the final comfort test.

## Hard limits and distribution

Content scripts cannot run on Chrome internal pages or browser-protected pages such as the Web Store; some built-in document viewers also prevent injection. The toolbar popup remains available. An extension cannot promise a pet on literally every browser screen. This targets desktop Chrome 116+; mobile Chrome and nonbrowser apps are not supported by this package. [MDN: restricted domains and privileged pages](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)

All extension code/art is packaged locally; there are no web-accessible resources or remote scripts. The extension CSP disallows network connections. Chrome-local storage is used instead of Google account sync. The only saved website names are those explicitly chosen in “Hide on this website.” No visited-page log is created or sent to Task Pup.

For browser testing use Chromium or Chrome for Testing in a disposable profile. Official Chrome branded builds removed the command-line load-extension mechanism starting in Chrome 137; the user-facing Load unpacked flow remains available. Tests should not alter the user's normal Chrome profile. [Chromium team's announcement](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/1-g8EFx2BBY), [Chrome: extension end-to-end tests](https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing)
