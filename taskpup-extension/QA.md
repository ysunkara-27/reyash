# Verification — September 21, 2026

- 12 extension/bridge unit and worker tests passed: source-origin/frame validation, field filtering, trusted-context storage, optional permission gating, persistent script registration, host exclusions, snooze/off visibility, disconnect/reconnect, logout, and change-only website publishing.
- 17 existing Task Pup profile, progression, and care tests passed after adding the publisher hooks.
- Task Pup production-source build passed; the bridge module is included in its public output. No Worker or database changes are needed.
- Real Manifest V3 integration test passed in an isolated Chrome for Testing 153 profile. It exercises the service worker, Task Pup content bridge, overlay rendering under strict CSP/Trusted Types, closed Shadow DOM, keyboard menu use, ordinary typing, settings, small viewport, fullscreen hiding, snooze/wake, per-site hide/restore, and logout. No real accounts or browsing pages were used.
- Desktop and menu screenshots were visually checked. No unsolicited menu is shown; the pet is small and in the bottom corner.
- The test-only manifest grants website hosts in a disposable profile. Acceptance/denial of Chrome's real permission prompt remains part of manual installation; tests do not approve it in the user's browser.
- Optional wandering is implemented as bounded 24 px motion with quiet/focus/reduced-motion gates. Comfort across the user's real daily sites and every possible browser-owned viewer is not claimed by the fixture test.

An old locally installed Chromium crashed on this macOS version, so tests used a current official Playwright Chrome for Testing download in `/private/tmp/taskpup-test-browsers`. The user's normal Chrome profile was not used.

Production verification: good-day commit `1764ee3` was pushed to main. The live `companion-bridge.mjs` matches the tested source byte-for-byte, and the live app imports it and publishes from both timer and care rendering.
