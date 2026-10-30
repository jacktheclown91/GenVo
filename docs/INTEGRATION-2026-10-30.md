# Main consolidation — stabilization, PR #51 and Codex's branch (October 30)

One authoritative `main` combining the stabilization work (Claude) and the consolidated presentation candidate (ChatGPT, PR #51, branch `integration/visual-ux-candidate-20261030`). PR #51 already contains PRs #43–#50; they are not merged separately. PR #42 (original UX review) is preserved in PR #51's documentation.

## Incorporated

**Simulation and stabilization** (already on `main` before the merge):
- climate-water `/3`–`/6`: river discharge, ponded-water infiltration, bank spill, border runoff outflow and deep flooding.
- The multi-predator escape test, diagnosed as obsolete since the burrow refuge, is now gated.
- `grazing-nutrients/1` and `breeding-support/2`: two-year populations now persist (37, 92 and 87 alive at day 731, against 0, 3 and 5).

**Presentation, PR #51:**

| PR | Change |
| --- | --- |
| #43 | Field Guide readability |
| #44 | Journal family navigation |
| #45 | Population overview |
| #46 | Main menu identity |
| #47 | Inherited creature size rendering |
| #48 | Movement, braking, turning and structural strain |
| #49 | Day/night light |
| #50 | Heat frills, wax plates and drought dormancy |

The merge was automatic, with no conflicts. Its base was `e64d1ea8` (on `main`). The renderer and render adapters only read simulation state; a scan of the five new adapters found no writes to animals, sim or world.

**Fix during integration:** `tests/field-guide-ui-state.mjs` failed on PR #51's own branch. Its DOM mock compared `data-*` attribute names with camelCase `dataset` keys, so focus was never captured. The mock now maps names the way the DOM does; the assertions and the production code are unchanged. PR #51's seven tests join the playable gate (173 checks).

## Verification

- **Playable gate:** 173 checks on Node 22.23.4 and Node 24.14.0. Architecture gate, public export and canonical-source audit pass.
- **Browser** (`tools/capture-integrated-acceptance.cjs`, headless Chromium, receipt and screenshots in `integrated-acceptance-2026-10-30/`). No page errors and no gaps:
  - Guided New World with all new-game rules recorded; keyboard movement.
  - Feeding (HUD Eat) and drinking (radial Drink) raise their reserves.
  - Field Guide, Journal and Population open.
  - 130 juveniles render at growth 0.70–1.0; adult sizes 0.958–1.047.
  - Night light (alpha 0.205 at time 0.875).
  - Twenty days of real play.
  - Save World, page reload, then Continue restores day 21, the same player and all 186 animals with the same rules.
  - 800 × 600 and mobile portrait (no horizontal overflow).
- **Frame pacing, new world (800 × 600):** median 16.7 ms, p95 16.8, p99 33.3, worst 33.4 ms; 8 ticks/s.
- **Mature world** (bundled day-100 valley, two archived regions, 60 s each, quiet machine). The combined build matches the pre-merge baseline, so there is no regression:

  | Build | Median | p95 | p99 | Worst | Frames over 1 s | Ticks/s |
  | --- | --- | --- | --- | --- | --- | --- |
  | Baseline `e64d1ea8` | 33 ms | 50 ms | 267–283 ms | 1.8–2.5 s | 4–5 | 2.9–3.3 |
  | Combined | 33 ms | 50 ms | 200 ms | 1.77–2.13 s | 5–6 | 3.3 |


## Codex's branch reconciled (second merge)

The creator chose to reconcile Codex's `codex/audio-motion-presentation-20261028` into `main`. It held 73 commits not on `main` (105 not yet on GitHub): art, audio and motion presentation, including:
- detailed padded limbs, paddle tails, wing roots, heads and torsos;
- creature voices shaped by anatomy and size, rain-on-foliage and habitat audio, movement and wing sounds;
- wet surfaces and water columns, underwater view and dive cues, swim motion, work poses (climb, perch), aerial poses, ground contacts and foliage contact;
- general thermal posture, the giant-lineage Lab comparisons and portraits.

**Conflicts.** `renderer.js`, `genvo-draw.js`, `part-sprites.js` and `journal.js` conflicted. Both sides had built four of the same presentation features. Following the creator's direction (PR #51 is the consolidated presentation source; no competing renderer implementations), the live renderer keeps PR #51 for those four and takes every other Codex change:

| Feature | Kept (PR #51) | Codex version, not wired into the renderer |
| --- | --- | --- |
| Day/night wash | `diurnal-light.js` | `daylight.js` (its read-only phase label still feeds the inspector) |
| Heat frills, wax plates, aestivation | `arid-expression.js`, `arid-surface-art.js` | `arid-presentation.js` (pigment tint) |
| Movement, braking, strain | `physical-motion-expression.js` | `inertia-expression.js` |
| Inherited size | `inherited-size-presentation.js` (context scale) | `adultSizeScale` sprite scaling; it would have doubled the scale |

`support-load.js` (gait carriage from planted feet) and `thermal-expression.js` (general heat and cold posture) are distinct, so they stay wired. Codex's ground contacts take PR #51's inherited scale. The two unwired Codex modules stay in the repository for the tests and review tools that import them, classified as non-runtime in `implementation-authorities.json`.

**Tests.**
- `tests/arid-presentation.mjs` asserted Codex's pigment tint on native art. Its native-draw section now asserts the consolidated behaviour: the inherited pigment is unchanged, PR #51's accent marks a flushed frill and sealed wax, and nothing is drawn without a heat signal. Every other assertion (dormancy labels, life state, untouched saves) is unchanged.
- Codex's 55 passing tests join the playable gate (228 checks).
- Four Codex tests fail identically on Codex's own branch and stay outside the gate: `detailed-body-forms`, `detailed-heads`, `detailed-torsos` and `wing-root-refinement`. They are frozen art-catalog checks that the later padded-limb commit changed. They were neither weakened nor removed.

**Verification on the reconciled build.**
- Playable gate: 228 checks on Node 22 and 24. Architecture gate, public export and canonical-source audit pass.
- Browser acceptance: no page errors and no gaps. Save, reload and Continue restore day 21 exactly. New-world frames run at a median of 16.7 ms and 8.1 ticks/s. While time is advanced unattended, the player creature runs on the game's own Auto mode.
- Mature world, quiet machine, 60 s each:

  | Build | Median | p95 | p99 | Worst | Frames over 1 s | Ticks/s |
  | --- | --- | --- | --- | --- | --- | --- |
  | Previous `main` `1c23eb98` | 33 ms | 50–67 ms | 167–200 ms | 1.85–2.10 s | 4–5 | 3.2–3.3 |
  | Reconciled | 33 ms | 50–67 ms | 183–200 ms | 1.77–1.78 s | 4 | 3.27–3.29 |

No regression.

## Remaining

- **Mature-world throughput:** 3.3 ticks/s against the 8 tick/s target, with worst frames near 2 s. This predates the integration and has not been optimized.
- **Keyboard release:** the creature stops within one simulation tick of releasing the key; no glide was measurable. This is simulation behaviour, not a presentation regression; whether braking should be visible on keyboard release is a design question.
- **Not yet observed in this run:** courtship and a player birth (natural births occurred in the world).
- **Ecology:** regional founding still sizes populations with the logistic estimate, so new regions overshoot first; predators cannot breed at current prey numbers; S9-YEAR-2 still declines slowly in year two.
- **Codex catalog tests:** the four frozen art-catalog tests above need Codex-side catalog updates.
- **Not done:** creator acceptance in a real (GPU) browser, and an itch.io release.
