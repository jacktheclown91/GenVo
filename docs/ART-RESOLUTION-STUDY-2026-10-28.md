# Native artwork resolution prototype

The creator's [major presentation objective](../design/PRESENTATION-EVOLUTION-2026-10-28.md) supersedes the earlier A-E package naming. This is implementation of the first resolution prototype, not completion of the initiative or approval of a global art switch.

## Implemented

`tools/art-resolution/` compares four legal modular bodies (small, fur/runner/tail, shell/sturdy, feather/compound-eye/beak). Existing native32 parts are the reference. Fifteen original code-authored pixel recipes supply real 64px and 128px rasters, with 16 facing/contact frames each. Optional atlases and indexed assets live in `assets/art/experiments/resolution-v1/`; original artwork/catalog entries are untouched. Artwork is AI-assisted and remains experimental.

The existing indexed codec/renderer supports the larger rasters. All anchors, bone sections, body bounds and display scale preserve their original 32-unit rig geometry. Protected eye/beak/material colors and inherited skin ramps retain their source identity. Unsupplied anatomy uses the existing 32px fallback. Tint-cache frame limits scale inversely with pixel area to retain the existing byte budget. No new biological capabilities, simulation rules or save fields exist.

The workshop offers eight facings, animated/static poses, four camera scales, juvenile scaling and pigment studies, matched composition timings and actual-world previews. An observed player can be imported for comparison. Preview selection is explicit, reversible and not persistent; the ordinary runtime/catalog remains native32. World screenshots use the same paused generated world with only artwork switched.

## Evidence and evaluation

[Native comparison receipt](art-resolution-2026-10-28/receipt.json) covers 4 bodies × 4 scales × 3 resolutions. [Normal-scale comparison](art-resolution-2026-10-28/specimen-0-scale-2.png), [fur](art-resolution-2026-10-28/specimen-1-scale-7.png), [shell](art-resolution-2026-10-28/specimen-2-scale-7.png) and [feathers](art-resolution-2026-10-28/specimen-3-scale-7.png) were inspected, alongside actual-world 32/64/128 screenshots. Initial radial fur and diagrammatic shell studies were rejected and revised; their original local captures remain in reports. The final workshop additionally corrects the scale-bar label and respects reduced-motion preferences.

At 2×, per-creature composition medians were 0.2–0.3 ms across the sampled bodies/resolutions. At 7× they were 0.6–0.8 ms (32), 0.6–0.7 ms (64), and 0.5–0.6 ms (128). These short browser microbenchmarks are **not** many-creature frame-rate acceptance or a claim that higher resolution is inherently faster. The matched high-detail frame buffers occupy 3.75 MiB at 64 and 15 MiB at 128, excluding tint caches, JavaScript data and existing fallback assets. Compressed experimental indexed data totals about 235 KiB, plus editable PNG atlases.

The body, covering and optical materials now differ visibly in close-up, while ordinary-scale differences are modest. Fur/feather layering and shell scutes remain candidates for artistic refinement. There is currently insufficient normal-scale benefit to recommend a global 128px gameplay pipeline. Continue refining the optional 64px world / 128px inspection direction while retaining native32; the creator's resolution decision remains pending. No catalog-wide quality upgrade or production acceptance is claimed.

Focused checks pass: `art-resolution-study`, `indexed-part-art`, `indexed-part-renderer`, `native-catalog-loading`, `source-rgba-part-art`, syntax, whitespace and architecture. The asset check verifies every checksum, protected ramp, pivot, rig, original source identity, non-enlarged pixel blocks, eight facings and PNG atlas dimensions. Browser preview/restoration retains exact complete simulation snapshots. Comprehensive integration remains Claude's responsibility; a representative many-creature visual/performance pass and inherited-save variety still need broader coverage.

## Continue

Serve the repository and open `/tools/art-resolution/`. Regenerate indexed candidates with `node tools/art-resolution/generate.mjs`; the native review tool exports PNG atlases and fresh evidence: `node tools/review-art-resolution.mjs . reports/<fresh-directory>`.

Continue the anatomical gait pass independently of the pending global art decision. The full A-I objective remains active; later behavior, environment, soundscape, voices, interface and mix-settings requirements are not achieved by this prototype.

Research references: [Hecker/Spore](https://www.chrishecker.com/How_To_Animate_a_Character_You%27ve_Never_Seen_Before) and [Rain World GDC](https://www.gdcvault.com/play/1023475/Animation-Bootcamp-Rainworld-Animation) endpoints were unavailable during this run, so no lecture-specific technique is claimed as verified. [Niche developer material](https://strayfawnstudio.com/presskit/sheet.php?p=niche_a_genetics_survival_game) provides the inherited-character readability reference. No external expressive assets were copied.
