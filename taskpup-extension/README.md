# Task Pup — little companion

A personal, unpacked Chrome extension. Your dog or cat stays quietly in a corner of ordinary websites; meals, play, and progress stay in Task Pup. No Chrome Web Store publication or extension account is required.

## Install once

1. Open `chrome://extensions` in desktop Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose the **unpacked** folder next to this README. Select the folder that contains `manifest.json`, not the ZIP or the parent project directory.
4. Pin **Task Pup — little companion** from Chrome’s Extensions menu.
5. Click its toolbar icon, then **Open Task Pup to sync**. Sign in on Task Pup as usual. Refresh Task Pup once if it was already open before installation.
6. In the extension popup, choose **Show on websites…** and approve Chrome’s website-access prompt. Refresh any existing tabs that do not show the pet.

If using the ZIP, extract it first and keep the extracted folder somewhere permanent. Chrome loads files directly from that folder. To update, replace its files and click the extension’s reload button in `chrome://extensions`, then refresh Task Pup and your open pages.

## Keep it quiet

- **Mostly still** is the default; **Gentle wandering** is an optional short stroll near the edge at most every two minutes.
- Choose **Tiny (44 px)**, **Small (52 px)**, or **Roomy (64 px)** and either bottom corner.
- Click the pet for care, a corner move, or **Hide on this website**. Dragging it snaps to the nearest bottom corner. Popup corner preference applies across tabs; dragging/corner-menu movement is local to that page.
- **Snooze for 1 hour** temporarily hides it everywhere. **Keep me company** is the global switch. Restore individual sites under **Hidden websites & connection**.
- It settles while an input is focused or a Task Pup timer is running. Wandering respects reduced-motion and the planner’s pause-wandering preference. It disappears in fullscreen and hidden tabs.
- It is not a guilt meter: no notifications, sounds, forced breaks, or automatic meals. Browser time never earns task credit.

## Sync and privacy

Keep a Task Pup tab open (pinning it is handy) for live updates. With that tab closed or suspended, the companion keeps its last appearance/care state. Open Task Pup to refresh. A stale focus flag expires after two minutes. Logging out of an open Task Pup tab clears the extension’s pet; **Disconnect companion** explicitly forgets it and ignores further sync until you choose **Open Task Pup to sync** again. This does not log you out of the website.

The bridge sends only a pet name, chosen appearance, care flags, and a focus boolean. It never reads the login token, password, task names, calendar events, or page text. All extension state stays in this Chrome profile’s local storage. There is no telemetry, remote code, account API polling, or browsing-history database. Only hostnames you explicitly hide are saved. Although Chrome needs website access to draw the pet, this implementation does not collect those websites’ contents.

The extension skips the main Task Pup screen because its native companion is already there. Browser-owned pages (`chrome://…`), the Chrome Web Store, other extensions, and some built-in viewers cannot display an overlay. Use the toolbar popup on those screens. This package targets desktop Chrome 116+; it does not put a pet in nonbrowser apps or mobile Chrome.

## Source and build

`src/` is the extension source, `unpacked/` is the complete installable package. `build.mjs` reuses Task Pup’s local SVG renderer and copies the popup/worker files. It has no package-install step or runtime dependency.

```sh
# From the reyash repository root:
node taskpup-extension/build.mjs
node --test taskpup-extension/tests/*.test.mjs
node taskpup-extension/tests/browser.mjs
```

Browser tests use a disposable Chromium/Chrome for Testing profile and mocked websites. They never load a personal Chrome profile or real user account. Set `TASKPUP_TEST_CHROMIUM` to a current Chromium/Chrome for Testing executable if it is not found automatically. The browser fixture pregrants website permissions to test rendering; actual permission prompt acceptance is a manual installation step.

Task Pup also needs the tiny `companion-bridge.mjs` publisher imported by `app.mjs` and included in its public build. It does not change authentication, account data, the Worker, or D1. The sync bridge is live on Task Pup (good-day commit `1764ee3`), and its production files were verified on September 21, 2026. The clean integration checkout is `.release/taskpup-companion-site`. Do not replace that site's whole app with the portfolio’s older copy.

The detailed alternatives, sources, performance choices, and limits are in [RESEARCH.md](RESEARCH.md).
