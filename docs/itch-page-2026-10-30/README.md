# itch.io page refresh (October 30, 2026)

**Status:** prepared and verified locally; the creator uploads it. The upload kit and step-by-step sheet are in `../../../releases/GenVo-itch-upload-2026-10-30/`, outside the repository. The public page has not been checked after upload yet.

## Build

- **Source:** `bc3017bf1db7748dd046d941e760dd17312835b1`. Its game files are identical to `8180e1cd`; `bc3017bf` changed only the export (see below).
- **ZIP:** `GenVo-web-bc3017bf.zip`, SHA-256 `eb70c7c8be0c79e0f36337853748762a8087c065a627297fbc579387b36a5923`, 919 files, 93.7 MB unpacked, 69.6 MB zipped.
- **Pipeline:** `git archive`, sprite sheets, source audit, `export-public.mjs`, `package-itch-preview.py`. An independent extraction checked CRC, safe paths, and byte equality with the export; all 919 files are byte-identical to Git at the source commit.
- **itch.io file limit:** the integrated art had grown the export to 1,077 files, over itch.io's 1,000-file HTML5 limit. Resolution experiments and per-part PNG previews are authoring material: the game loads compiled indexed art and the Lab loads part JSON. They are now excluded, and `tests/public-export.mjs` checks the limit and that nothing shipped reads them.
- **Checks:**
  - **Playable gate:** 249 checks pass on Node 22 and Node 24.
  - **`verify-release-browser.mjs` on the extracted ZIP:** New World, movement, audio, drink, eat, frame pacing (median 16.7 ms, none over 100 ms), Save → reload → Continue, embed layouts; 0 missing files, 0 errors.
  - **First-player acceptance on the ZIP:** courtship, conception, the Creature Lab, birth on day 17, touch-only play.
  - **Integrated acceptance on the ZIP:** feeding, drinking, journal, night, 20 days of play, Save/Continue, mobile portrait.
  - All in headless Chromium.
- **Rollback:** the build itch.io serves now is saved as `releases/itch-page-before-2026-10-30/GenVo-web-6d4964ba-LIVE-ROLLBACK.zip` (SHA-256 `11bb5087…741c7`). It was confirmed byte-identical to the live files, apart from itch.io's injected `htmlgame.js`. The old cover, screenshots and page HTML are saved beside it.

## Page assets

All images come from the extracted release, running in Chromium. Worlds were made through New World, AUTO played at 1×, and view mode and zoom are the player's own settings. Nothing in a world was created, edited or moved. The scripts are in `tools/`.

| Screenshot | What it shows |
| --- | --- |
| `1-living-world.png` | The shipped evolved Day-100 valley in summer: many species, flowering plants, water, worn paths. |
| `2-evolved-anatomy.png` | A UI-free region of the game canvas from that valley, scaled exactly 4× nearest-neighbour: five species with distinct 32-pixel anatomy. |
| `3-creature-lab.png` | The Creature Lab as the game opened it when a pregnancy began (flight starter, generation 2). |
| `4-first-young.png` | "Your First Young": three young born naturally on day 18 of AUTO play, each a mix of its parents. |
| `5-first-winter.png` | The valley as winter arrives, with the first snow settling. |

The **cover** (`cover/`) is a UI-free valley frame read from the game canvas, plus one real valley organism (mirelick #157) drawn by the game's portrait renderer. Pixels are scaled only by whole numbers. The title follows the menu's two-tone "GenVo", and the line under it is the menu's own tagline. `cover/thumbnail-check.png` shows it at 315×250 and smaller. `cover/source/compose.py` rebuilds it from the two source images.

No giant or staged diagnostic creature appears anywhere on the page.

## Text

- `description.html`: the page text.
- `../../submission/AI_DISCLOSURE.txt`: the jam's AI disclosure (code, art, music and sound, text).
- `../../submission/ITCH_PAGE_NOTES.md`: the jam checklist. The creator adds their Discord username and signs the attestation.

## Observed while preparing

- In the mature valley, "The world is busy" often appears top-left, which kept the Field Guide out of the screenshot set.
- `tools/capture-itch-screenshots.mjs` waits for `sim.climate`. A new world now pauses on its welcome card before the first tick, so the tool times out on new planetary worlds. `tools/store-captures.mjs` here waits for the world itself.
- The provenance ledger (`provenance/ledger.jsonl`) was last written on October 13. It needs a creator-decided release record.
