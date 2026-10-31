# GenVo release checklist

The one procedure for building, verifying and publishing a browser release. Run every step from a clean `main`, and record the results in the release's `release-provenance.json`.

## 1. Source

1. `git fetch`, then confirm `git rev-parse HEAD origin/main` agree and `git status` is clean.
2. Both gates pass on the release commit:
   - `node tools/check-playable.mjs` with Node 22, and again with Node 24.
3. Static checks pass:
   - `node tools/architecture-check.mjs`
   - `node tests/architecture-check.mjs`
   - `node tools/canonical-source-audit.mjs`
   - `node tests/public-export.mjs`
4. Optional full suite: `node tools/run-tests.mjs --all --jobs 6 --json OUT.json`. Its result must match `tests/known-failures.json`, with no new failures.

## 2. Build (outside the repository)

```sh
git archive <sha> | tar -x -C <release>/source
node tools/export_sprite_sheets.cjs          # in <release>/source
node tools/canonical-source-audit.mjs
node tools/export-public.mjs <release>/export
GITHUB_SHA=<full sha> python tools/package-itch-preview.py <release>/export <release>/GenVo-web-<short>.zip <release>/package-report.json
```

- Copy the full commit hash with `git rev-parse`; never type it.
- itch.io HTML5 limits: at most 1,000 files, 500 MB unpacked, 200 MB per file. The packager refuses anything larger.

## 3. Package integrity

- Extract to a fresh folder.
- Check the ZIP: CRC, no unsafe paths, every member byte-identical to the export, `index.html` at the root.
- Check every member against `git cat-file -p <sha>:<path>`; all must match. Record the result in `source-parity.json`.

## 4. Browser verification of the extracted ZIP (Chromium)

- `node tools/verify-release-browser.mjs <extracted> <evidence> --autonomous-populations`:
  - New World, movement, audio, food and water;
  - frame pacing, and Save → reload → Continue;
  - embed layouts;
  - 0 missing files and 0 errors.
- First-player and integrated acceptance. Point copies of `tools/capture-first-player-acceptance.cjs` and `tools/capture-integrated-acceptance.cjs` at the extracted folder, using `path.resolve(...)` for the root:
  - courtship, conception, the Creature Lab and birth;
  - touch-only play;
  - 20 days of play, Save/Continue and mobile portrait.
- Mature-world performance: `node tools/measure-mature-regions-browser.mjs <extracted> OUT.json 90`, compared with the previous release.

## 5. Store page assets (from the same extracted build)

Scripts are in `docs/itch-page-2026-10-30/tools/`.
- Screenshots come from genuine AUTO play through the New World menu, in Comfort View with the player's zoom.
- The cover is a UI-free canvas frame plus a real organism from the game's portrait renderer, scaled only by whole numbers. Check it at 315×250.
- Never stage outcomes, and never present a diagnostic (for example a staged giant) as natural.

## 6. Upload kit

`releases/GenVo-itch-upload-<date>/` contains:
- the ZIP;
- the cover (630×500 and 1260×1000);
- the screenshots;
- `description.html`, `AI_DISCLOSURE.txt` and `release-provenance.json`;
- `UPLOAD-STEPS.md`.

Keep exactly one rollback package: the build itch.io serves now, saved before replacing it, at `releases/rollback-<sha>/`.

## 7. After upload

On the public page, check:
- the cover and screenshots;
- that Run game loads, takes input, and plays sound after the first click;
- New World;
- that the game fits its frame, and fullscreen;
- portrait on a phone;
- Save, reload and Continue.

During the jam's rating period, upload only fixes for game-breaking bugs, each noted in a devlog.
