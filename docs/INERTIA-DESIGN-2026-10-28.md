# Inertia design — acceleration and turning (`inertia/1`)

**Status.** Implemented and **on for new games** (creator approval October 28: 0.20 s reference ramp, evasive jinks as phase 2, player braking identical to wildlife). Saved worlds without `inertiaRules` stay kinematic and bit-identical. See §9 for what was built and measured. Creator direction (October 28): design inertia before S3. It fills the gap left by S2 ([S2 physics](MORPHOLOGY-S2-PHYSICS-2026-10-28.md)): the brief's movement list asks for size and structure to shape acceleration, turning and maneuverability, without automatic size bonuses.

## 1. What exists (measured)

All surface movement is kinematic: each update sets `position += direction × speed × dt`. There is no velocity state, so a body reaches full speed instantly and can reverse in a single tick.

The movement paths are:

| Path | Rate | Notes |
| --- | --- | --- |
| Wildlife, `Simulation.phaseMovement` | 8 Hz ecology steps plus locomotion-only substeps | Background wildlife moves in compensated coarse strides (`activity.movementBudget`, scale = stride) |
| Player, `phasePlayerMovement` | 64 Hz control steps | Returns early with no input, so it stops instantly |
| Engaged stalker, `PredatorEncounter.moveEngaged` | continuous `dt` | Windup creep, then a committed straight charge lane |
| Archived regions, `regional-demography` travel | coarse | Straight-line trips |
| Underground, jumps, glides, flight | own steppers | Jumps already have ballistic velocity |

Baseline: `tools/measure-movement-dynamics.mjs INERTIA-MEASURE 15` (new-game planetary world, current opt-ins, 15 days):

| Measure | Value |
| --- | --- |
| Moving steps that turn more than 90° | 28.3% |
| Moving steps that turn more than 150° | 27.5% |
| Land reversals per moving land step | 18.1% |
| Land reversals within one step of the body's own target | 93.9% |
| Speed p50 / p90 / p99 | 2.14 / 4.54 / 9.08 tiles/s (p99 = coarse background strides) |
| Hunts | 177 attempts, 3 kills, median chase 12 ticks (1.5 s) |

The reversals are almost all **overshoot dithering**. The locomotion substep moves a full step toward a point target without clamping to the remaining distance (only navigation routes clamp), so bodies hop back and forth across their target. Reversal shares by intent are swim 77%, migrate 60%, explore 55% and drink 47%. This wastes food on movement and shows on screen as jitter.

## 2. Physics

**Traction circle.** A body's acceleration vector, covering propulsion, braking and turning together, is bounded:

> |dv/dt| ≤ a_max = min(a_muscle, μ_surface · g_ref)

**Muscle limit.** Force grows with muscle cross-section (s²) and mass with s³, so the same anatomy scaled by s has a_muscle = a_ref / s. A 2× body takes twice as long to reach a given speed. At speed v it needs twice the turning radius (r = v²/a_max) and twice the time to reverse (2v/a_max). This is the size disadvantage the brief asks for. It costs no top speed, which stays anatomical, as S2 decided.

**Traction limit.** μ_surface is size-independent and comes from the medium:

| Medium | Traction |
| --- | --- |
| Firm ground | 1 |
| Mud, snow, loose sand | The existing terrain grip factors (`movementProfile` grip/footing/snow) |
| Ice | about 0.2: bodies slide and overshoot. Pads, claws or webbed feet can raise it through the existing grip factors |
| Water | 0.5 of land: added mass and drag. Top swim speed is unchanged |

**Arrival.** Desired speed toward a point target is min(v_max, √(2·a_max·d)): the body brakes to stop on its target instead of overshooting it. This removes the measured dithering as a consequence of having momentum, not as a special-case fix.

**Energy.** Positive kinetic work ½·m·(v² − v₀²), counted only when speeding up, is charged as work (M¹, `massCostToReserve`) on top of cost of transport. Braking is treated as free in `/1`. Wandering that keeps stopping and turning costs more than steady travel, so dithering also stops being free.

**Integrator.** It is exact for a constant desired velocity over a step of any length dt:
- If |Δv| ≤ a·dt, the body reaches v_d at t* = |Δv|/a. Displacement = v·t* + ½·a·û·t*² + v_d·(dt − t*).
- Otherwise v′ = v + û·a·dt, and displacement = v·dt + ½·û·a·dt².

Because the solution is closed-form, a background body moved in one coarse stride lands where eight fine steps would put it. This keeps the existing rule that computational capacity never selects biological outcomes. Arrival braking varies the desired velocity within a stride, so coarse and fine results differ by a bounded error that tests will measure.

## 3. Calibration (creator decision)

There is one reference constant: the time a reference-size body takes to reach the reference walking speed (genvo, 2.15 tiles/s) on firm ground.

| t_ref | a_ref (tiles/s²) | Reference reversal at walk | 2× body reversal at walk | 2× turn radius at sprint 3.3 tiles/s |
| --- | --- | --- | --- | --- |
| 0.15 s | 14.3 | 0.30 s | 0.60 s | 1.5 tiles |
| **0.20 s (recommended)** | **10.75** | **0.40 s** | **0.80 s** | **2.0 tiles** |
| 0.30 s | 7.2 | 0.60 s | 1.20 s | 3.0 tiles |

At 0.20 s a reference body reaches walking speed in under two 8 Hz ticks, so the player's controls stay crisp. A 2× body visibly carries momentum, and a 0.7× body turns inside a 0.85-tile capture radius. Faster anatomies (needlejaw 2.8 tiles/s) take proportionally longer to reach their own top speed.

The kinetic-work constant is tied to the existing cost of transport (0.072 × mass per tile). The target: one start from rest to sprint costs about half a tile of travel. After implementation the tool will report acceleration's share of locomotion energy; that number is evidence, not a tuning target.

## 4. Behaviour

- **Wildlife:** decisions still choose targets and intents. Locomotion turns them into a desired velocity and integrates it. Capture still requires being within 0.85 tiles on an ecology step, so a hunter that overshoots has to turn back.
- **Player:** input sets the desired velocity. Releasing the keys brakes at a_max, and the control step keeps integrating until the body stops. Player and wildlife use the same body dynamics (movement parity).
- **Engaged stalker:** the windup creep and charge lane keep their rules. The charge accelerates from the creep speed and cannot stop or turn instantly, so a sidestep against a heavy hunter works better, and the "overrun is the opening" outcome now follows from momentum.
- **Evasive jinks (phase 2):** prey currently flee toward a point 6 tiles away, re-decided every 0.75 s. A sharp turn when a hunter is inside its own stopping distance would let agile prey use the predator's larger turning radius. That is a cognition change, so it lands only after phase 1 has been measured. No outcome is forced.
- **Out of scope for `/1`:** underground, jump, glide and flight steppers keep their own dynamics; jumps are already ballistic. Archived-region travel stays straight-line, since trips there are long compared with the 0.2–0.8 s ramps.

## 5. State, saves and presentation

- **Rule.** `inertia/1` is recorded at construction for new games, via one line in `SURVIVAL_OPT_IN` in `src/main.js` (shared file: heads-up to Codex). Saved worlds without it stay kinematic and bit-identical. It does not require `body-size/1`: without a size, s = 1.
- **State.** `a.motion = {schema:1, vx, vy}` exists exactly when the world records the rule. Restore validates that it is finite and bounded by the anatomy's top sprint speed, and rejects state without the rule or the rule without state. Planetary travel copies the rule. A body leaving the resident simulation for an archived region comes to rest (v = 0).
- **Blocked moves.** When the target cell cannot be occupied, the blocked velocity component is zeroed; the existing water steering then supplies a new desired direction. There is no collision damage at these speeds.
- **Presentation contract (Codex, read-only).** `motionStateOf(a)` returns `{vx, vy, speed, heading, acceleration, turnRate, braking}` for gait, lean and skid presentation. Presentation never writes motion.

## 6. Evidence plan (before enabling)

1. **Unit:** the closed-form integrator matches fine stepping exactly for a constant desired velocity, and within a stated bound with arrival braking. Coarse background strides cover the same distance as fine steps.
2. **Size:** a 2× body reaches speed in twice the time and needs twice the radius and reversal time. Top speed is unchanged.
3. **Arrival:** there is no overshoot onto the target. The movement tool's overshoot share falls from 93.9% toward zero, and reversals per moving step fall from 18.1%.
4. **Ice:** slide distance grows as traction falls, and grip anatomy shortens it.
5. **Energy:** acceleration work is charged once per start, and steady travel is unchanged.
6. **Player:** ramp and braking times at 64 Hz match the wildlife integrator; `control-response`, `decisions-under-pressure` and the stalker suites are re-validated.
7. **Saves:** exact roundtrip and continuation, the rejection paths, and old worlds unchanged (frozen fixtures and the full playable gate on Node 22 and 24).
8. **Field:** 60-day new-game soaks with and without `inertia/1`, comparing distance travelled per day, energy, hunts and kills, survival, and frame cost. These are observations, not tuning.
9. **Browser:** a headless check that the player ramps and stops with no page errors. Creator feel acceptance comes separately.

## 7. Implementation order

1. Integrator and traction model in a leaf module (`organisms/motion.js`), with unit tests.
2. Wildlife `phaseMovement` (ecology steps, substeps and coarse strides), with arrival braking.
3. Player control step, including braking without input.
4. Engaged stalker.
5. State, saves, planetary travel and the presentation contract.
6. Kinetic work cost.
7. Field comparison, gate, then enable for new games.
8. Phase 2, evasive jinks, only after phase 1 has been measured.

## 8. Decisions for the creator

1. **Reference ramp time:** 0.20 s is recommended. 0.15 s gives snappier controls with smaller size effects; 0.30 s gives heavier bodies everywhere.
2. **Evasive jinks:** recommended as a separate phase 2, after measuring phase 1.
3. **Player braking:** recommended to be identical to wildlife (parity), so releasing the keys glides to a stop over 0.2 s at reference size and 0.4 s at 2×.

## 9. Implementation and evidence (October 28)

**Code.**
- `organisms/motion.js` (leaf): the traction circle, the closed-form integrator, arrival speed, kinetic work, the saved-state rules and `motionStateOf`.
- `Simulation`: wildlife locomotion with arrival braking. Coasting for bodies that are not steering, as `coastBody` and `coastUnsteered`. Player ramp and braking, via `brakePlayer`.
- The engaged stalker, with momentum along its path; lanes and stand-offs bound its position.
- `lifestyle.movementProfile` now reports land `traction` (footing × snow).
- Saves, via `restoreInertiaRules`. Planetary travel copies the rule. Archived travel arrives at rest.
- `SURVIVAL_OPT_IN` gains `inertia`.

**Two findings while building**, each fixed and tested:
1. With no input, the empty control step braked an *autonomous* player every tick, so it covered 36% less ground than a hand-steered one. Braking now applies only to the hand-steered player, and `movement-parity` is equal under inertia.
2. Births fell to about half in two of three seeds. Mating needs the pair to stay within 0.9 tiles through the courtship beats. Kinematic suitors snapped back into range every tick; inertial suitors coasted to rest beside a partner that kept moving, so courtship reset (18 attempts against 28). Inside the radius a suitor now matches its partner's velocity, within its own acceleration limit (28 attempts against 28). Arrival braking also applies to animal targets other than hunted prey; hunters still overshoot.

**Movement** (`tools/measure-movement-dynamics.mjs INERTIA-MEASURE 15`):

| Measure | Kinematic | `inertia/1` |
| --- | --- | --- |
| Moving steps that turn more than 90° | 28.3% | 1.9% |
| Land reversals per moving step | 18.1% | 1.1% |
| Overshoot share of reversals | 93.9% | 25% |
| Speed p50 / p90 (tiles/s) | 2.14 / 4.54 | 1.85 / 3.69 |
| Hunts (attempts / kills) | 177 / 3 | 143 / 2 |

**60-day new-game soaks** (body size on, seeds SOAK-SIZE-1/2/3), day 61:

| Seed | Kinematic: alive / births | `inertia/1`: alive / births |
| --- | --- | --- |
| 1 | 124 / 18 | 127 / 19 |
| 2 | 141 / 16 | 140 / 12 |
| 3 | 155 / 3 | 160 / 5 |

Per-day cost was the same. These are observations; nothing was tuned.

**Player-facing suites.** These were run with the rule forced on, as a local experiment only; the gate keeps them on their recorded kinematic worlds. 21 of 24 pass:
- `decisions-under-pressure` expects a body starting from rest to cover its full walking speed in its first second. It covers 2.15 − 0.215 tiles: the approved ramp.
- `movement-parity`'s "released key stops the player" measures the approved braking glide: 0.50 tiles from a sprint, v²/2a.
- `perceived-threat-escape` fails identically without inertia, and already failed at `10e49daf`, before the morphology work. It is outside the gate and recorded as a pre-existing follow-up.

**Tests.** `tests/inertia.mjs` (gated) covers:
- the integrator: coarse equals fine, 0.20 s ramp, 0.40 s reversal;
- size: half the acceleration and twice the turn radius at 2×;
- ice, water and loose-ground traction;
- arrival without overshoot, coasting and braking distance;
- background strides equal fine steps in the real loop;
- courtship pacing;
- the player's ramp and braking at 64 Hz, and autonomous/manual parity;
- kinetic work;
- exact saves, rejection paths, and kinematic worlds never gaining motion.

**Headless browser.** A new game records `inertia/1` and `body-size/1`. The player ramps to 2.19 tiles/s in about 0.2 s and brakes to rest in about 0.2 s, with no page errors. The headless page registers keys about 1 s late in both inertial and kinematic worlds, so that is a harness artefact. Creator feel acceptance is separate.

**Next.** Phase 2 (evasive jinks), measured against this baseline, then S3.
