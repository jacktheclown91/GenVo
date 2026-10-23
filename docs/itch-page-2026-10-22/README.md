# itch.io page refresh (October 22, 2026)

**Status:** prepared, not published. The creator chose to upload it themselves. The upload kit and checklist are in `../GenVo-itch-upload-2026-10-22/`, outside the repository.

## Release

- **Source:** commit `af020f9971edbcd6548cb83494b7d29af770763e`, exported with `tools/export-public.mjs` from a `git archive` of that commit and packaged with `tools/package-itch-preview.py`.
- **HTML5 ZIP:** `GenVo-web-af020f9.zip`, SHA-256 `114b5c5943962dd1b06aca369cd9c457181d4979ea4f9a415476eb7a696cc4f5`. It has 773 files and 78.1 MB unpacked (55.2 MB zipped), within itch.io's limits, and includes the scenario checkpoints `established-valley-d30` and `mature-valley-d100`.
- **Copies:** `builds/GenVo-itch-2026-10-22-af020f9/` (ignored by Git) and `../GenVo-web-2026-10-22-af020f9.zip`. The previous `../GenVo-web.zip` is unchanged.

## Verification (local Chromium, the exact ZIP contents)

- **Release CI suite on the pinned source:**
  - the playable gate (90 checks);
  - render cache, habitat ground art, scene, frame stepper and audio;
  - public-export equivalence.
- **`tools/verify-release-browser.mjs`:**
  - New World with a Quick start creature;
  - each direction key moves about 2 tiles;
  - audio is running after the first input;
  - Shift+E drinks and E eats (the creature was placed beside water or food);
  - frames over 20 s at 1x: median 16.7 ms, worst 50 ms;
  - Save World → reload → Continue returns to the same creature, body and position;
  - no overflow at 800×500, 960×600, 1280×720 or 1920×1080;
  - no missing resources, no page or console errors.
- **`tools/verify-first-legacy-realtime.mjs` at 1x:**
  - the opening completes, and the pill runs through `Legacy 1/3` and `2/3`;
  - the heir is ready on day 56 (5.95 min);
  - real H handoff, generation reveal, "Your Legacy Begins" summary, then Continue Evolving;
  - no errors.
- **Not verified:** the hosted itch.io environment (iframe, storage, fullscreen), other browsers, and real-GPU timing.

## Page assets

- **`previous/`:** the archived live page before this refresh (cover, five screenshots, tiled background, `page.json` with the description HTML, settings, theme and jam link).
- **`screenshots/`:** five genuine 1920×1080 captures from the release build via `tools/capture-itch-screenshots.mjs` and the game's AUTO play. Sources were the menu's evolved Day-100 valley and new planetary worlds with Quick start creatures. Nothing was created or edited, and the Creature Lab frame is the real editor opened by a pregnancy.
- **`cover/`:** `cover-630x500.png` (also at 1260×1000), two alternates and a comparison with the previous cover. `source/` holds `compose.py`, the UI-free valley frame read from the game canvas, and real evolved organisms from that valley drawn by the game's sprite renderer. Pixels are scaled only by whole-number nearest-neighbour factors.
- **`description.html`:** the rewritten page text. Controls follow the in-game help, and credits follow the in-game credits screen, including AI-assisted code and artwork.
