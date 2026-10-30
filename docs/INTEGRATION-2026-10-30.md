# Main consolidation — stabilization and PR #51 (October 30)

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

## Remaining

- **Mature-world throughput:** 3.3 ticks/s against the 8 tick/s target, with worst frames near 2 s. This predates the integration and has not been optimized.
- **Keyboard release:** the creature stops within one simulation tick of releasing the key; no glide was measurable. This is simulation behaviour, not a presentation regression; whether braking should be visible on keyboard release is a design question.
- **Not yet observed in this run:** courtship and a player birth (natural births occurred in the world).
- **Ecology:** regional founding still sizes populations with the logistic estimate, so new regions overshoot first; predators cannot breed at current prey numbers; S9-YEAR-2 still declines slowly in year two.
- **Not done:** creator acceptance in a real (GPU) browser, and an itch.io release.
