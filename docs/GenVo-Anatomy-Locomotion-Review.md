# Anatomy-driven locomotion at normal zoom — October 14, 2026

Whole-creature movement now differs according to the anatomy a body actually carries: which leg types it stands on and how much registered part mass it carries. Species labels are not used. This is presentation only. Movement speed, energy, simulation state, RNG and saves are unchanged, and planted toes stay fixed in world coordinates.

## Audit before changes

Five legal bodies were measured: founder walker, runner legs, a heavy build (sturdy legs + reinforced torso + plates), spring legs and webbed legs.

| Property | Before this pass |
| --- | --- |
| Foot lift height | Differed per leg type (`LEG_GAIT.lift`): runner 1.5, sturdy 1.1, spring 3, webbed 1.7 sprite px |
| Step length / cadence | **Identical for every body.** Steps per tile came from limb scale only; `LEG_GAIT.stride` shaped only the swing arc. |
| Body bob | **Identical.** One shared `BODY_BOB` table (±1 sprite px). |
| Side roll and forward carriage | **None.** |

The creator-reviewed v1.59 contract in `tests/animation.mjs` ("runner legs take the longest strides, sturdy legs the shortest") was failing on HEAD for this reason.

## What changes

| Body | Step / cadence | Carriage |
| --- | --- | --- |
| Walking legs | Unchanged | **Exactly the previous bob; no roll or lean** (asserted for every phase) |
| Runner legs | 1.3× step, fewer strides per tile | About half the bob, forward lean into the stride |
| Heavy (registry mass above the founder body, sturdy legs) | 0.78× step, more strides per tile | Rides low, deeper bob with a drop onto each stance, side-to-side roll, slight backward carriage |
| Spring legs | 1.15× step | Two-beat bound: the walk bob is replaced by lift clear above the walk line |
| Webbed legs | 0.9× step | Waddle roll on land; in water, a stronger forward stroke surge than other swimmers |

The changes work as follows:

- **Step length per leg type.** `LEG_GAIT.step` feeds one shared function, `gaitTravelFor(limbScale, legSlots)`. Pose stance sweep, renderer gait phase and the planted-toe test all use it, so cadence follows anatomy while supported toes stay stationary. `tests/grounded-locomotion.mjs` still passes all 256 cases; its world-distance call now passes the same leg slots.
- **Carriage.** `src/render/locomotion-style.js` computes the style once per body plan from mounted leg types and registry part mass. The registry mass is informational: it is reported by `resolvePhenotype`, has no physical effect, and the uncalibrated tissue model is not used. Side roll lags the bob by a quarter cycle. When the roll was in phase, an east/west heading (whose side axis is screen-vertical) cancelled the heavy body's own bob; the browser measurement caught this and a test now covers it.

## Evidence

- `tests/anatomy-locomotion.mjs` covers:
  - the walker's bob is unchanged at every phase;
  - step length and cadence order: runner > walker > sturdy;
  - runner glides low and leans forward;
  - heavy drops below the walk line and rolls;
  - spring bounds above it;
  - webbed waddles and strokes harder in water;
  - roll does not cancel the bob on screen-vertical headings;
  - the same plan reads the same on any species;
  - no RNG, no mutation, no carriage while standing.
- `tests/animation.mjs` now gets past its stride-order contract, which HEAD failed. It then stops at a stale source-pattern check (`nearLegs.push(leg)` is absent from HEAD's `genvo-draw.js`), so it remains a baseline failure one assertion further on.
- **Native browser measurement.** 800×600 at the default 2× zoom, with real player control walking each body east and south. Each rendered frame was diffed with and without the player, with clock, selection ring and markers excluded. Screen-pixel centroid travel, vertical / horizontal:

| Body | Gait cycles per tile | East | South |
| --- | --- | --- | --- |
| Walker | 3.13 | 2.3 / 1.8 | 3.0 / 1.8 |
| Runner | 2.41 | 1.2 / 1.8 | 1.6 / 1.5 |
| Heavy | 4.01 | 3.3 / 1.1 | 3.3 / 2.2 |
| Spring | 2.72 | 4.1 / 1.8 | 5.8 / 1.6 |
| Webbed | 3.48 | 2.5 / 1.8 | 2.8 / 2.1 |

A harness note for future captures: the renderer predicts the player pose from `renderer.setPlayerPresentation(controls)`. Driving the sim without setting it makes the player render as idle, and every body then measures about 0.5 px.

## Readability at native size

- **Reads:** step rhythm (runner's few long strides vs. heavy's many short ones), runner's low glide, heavy's deeper bob and spring's bound. The spring bound is the clearest.
- **Marginal (first pass, superseded below):** the waddle roll for webbed and heavy bodies added only about 0.3–0.4 px of centroid side-travel. It is now articulation; see the second pass.
- **Not natively verified:** swimming. The stroke surge is covered by the test only.
- **Not established:** judgement of real-time motion by a person. The pane was throttled, so frames were driven manually at about 60 Hz.


## Second pass: articulation, swimming and full speed (October 15)

### Waddle by articulation, not displacement

The sideways body sway is removed: no body's centre slides sideways. Weight transfer is now two pose channels drawn in `genvo-draw.js` with whole-pixel offsets:
- `torsoTwist`: the head group (head, face organs, mouth) and the tail swing to opposite sides about the torso centre. Hip roots ride with their end of the body, knees take half the shift, and **feet are never moved**.
- `dorsalRoll`: dorsal parts move 1.5× and flank parts 1× the roll, past the unmoved torso outline.

| Body | Twist | Roll |
| --- | --- | --- |
| Heavy | ±1.6 sprite px | 0.9 |
| Webbed | ±2.0 sprite px | 0.7 |
| Walker, runner | 0 | 0 |
| Spring | ≈0 | — |

The twist is measured to be in quadrature (correlation |r|<0.2) with the bob, so the two never cancel on any heading. The first `cos(a)` attempt correlated 0.35, because the stepped `BODY_BOB` table is phase-shifted; the offset was set from measurement.

`tests/anatomy-locomotion.mjs` adds a drawing-level contract. A recording canvas shows more than 10 head-group pixels moving exactly +4 screen px and the tail group moving −4, deterministically. The 256-case planted-toe test still passes. Untwisted drawing issues exactly the same canvas calls as before, with no extra save/restore, so minimal test mocks are unaffected.

### Swimming under the current contract

The stroke is driven by actual propulsion: `movementProfile(...).speed / 0.66` in water. Eligibility is `canSwim`. The stricter "functional propulsors" migration in `docs/swimming-migration-audit.json` still awaits review and is not adopted.

| Body | `canSwim` | Propulsion | Surge (max lean) | Undulation |
| --- | --- | --- | --- | --- |
| Ordinary | no | — | — | — |
| One webbed leg | no | — | — | — |
| Two webbed legs | yes | 1.07 | 0.44 | 1.4 |
| All webbed legs | yes | 1.14 | 0.58 | 1.8 |
| All webbed + paddle tail | yes | 1.53 | 1.20 | 3.6 |

In real gameplay, the full-speed capture walks each body off a shore with `KeyD` held:
- the plain walker is held at the shoreline (0 frames in water, 0.35 tiles/s);
- webbed legs swim (47 water frames, 1.42 tiles/s);
- webbed + paddle swims faster (48 water frames, 1.81 tiles/s).

### Full-speed playback

`tools/capture-anatomy-locomotion.cjs` runs real 800×600 headless Chromium with the game's own `requestAnimationFrame` loop and keyboard input. There is no manual stepping. It covers all five gait families × east/south/northwest, plus three swim runs. Output: `docs/anatomy-locomotion/` (video, native stills, `contact-sheet-native.png`, `video-strip-native.png`, `capture.json`).

| Body | fps | Tiles/s | Gait cycles/s |
| --- | --- | --- | --- |
| Walker | 47–60 | 1.82–2.00 | 7.8–8.6 |
| Runner | 46–56 | 2.02–2.16 | 6.6–7.2 |
| Heavy | 40–50 | 1.69–1.85 | 8.5–10.2 |
| Spring | 46–53 | 1.86–1.97 | 6.9–7.3 |
| Webbed | 47–55 | 1.63–1.80 | 7.8–8.5 |

Swim runs rendered at 23–29 fps headless; water rendering cost is not investigated here.

Findings:
- **Runner strides are not unnaturally fast.** The runner covers more ground with fewer cycles per second than the walker.
- **The inherited base cadence is high.** The original walker cycles about 8 times per second at 2 tiles/s. Every once-per-cycle articulation therefore oscillates at 8–10 Hz. That is fine in pose terms, but near the rate where a waddle reads as shimmer, and heavy's short steps push it to 10 Hz. The base cadence predates this work and was not changed; a slower global gait is a creator decision.
- **Recording limits.** Playwright records at 25 fps, which samples an 8–10 Hz gait about three times per cycle. The video and strips prove the twist, bound, shoreline block and swim strokes happen in real time, but they cannot judge feel. "Not jittery" and "not hopping" still need a person watching the live game at 60 fps.

### Visual mass stays separate

`visualBuildWeight()` in `locomotion-style.js` is now the single, explicitly provisional input for "how much body". It reads the registry's informational part mass, which drives no physics, and labels its source. When the tissue volume/density model is approved, only that function's body changes; its 0..1 `relative` contract stays.

## Source changes

| File | Reason |
| --- | --- |
| `src/render/creature-assembler.js` | `LEG_GAIT.step` per leg type |
| `src/render/genvo.js` | `strideLengthFor` / `gaitTravelFor(limbScale, legSlots)` shared by pose and renderer |
| `src/render/locomotion-style.js` (new) | Carriage, twist/roll articulation, propulsion-driven stroke, provisional `visualBuildWeight` |
| `src/render/genvo-draw.js` | Whole-pixel torso twist and dorsal roll; feet untouched |
| `src/render/renderer.js` | Uses anatomy step length for gait phase and applies carriage; a plain walker keeps the previous bob |
| `tests/grounded-locomotion.mjs` | World distance uses the same leg-slot step length (same planted-toe contract) |
| `tests/anatomy-locomotion.mjs` (new) | Focused contrast, articulation, swim and drawing contracts |
| `tools/capture-anatomy-locomotion.cjs` (new) | Full-speed Chromium capture |
