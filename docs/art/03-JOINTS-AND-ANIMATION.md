# 03 — Joint-Driven, Part-Owned Animation Contract
**Status:** LOCKED DESIGN. Numeric ranges/curves below are **starting targets, not biological limits or implementation claims**.

## Fundamental ownership rule
**Each anatomical part owns** its rig, joint constraints, allowed degrees of freedom, motion clips/curves, local poses, priority reactions and limits. The **creature coordinator owns** cross-part intent, phase synchronization, targets, speed and action negotiation. **World simulation owns** actual movement, collisions, hit registration, grounding, stamina and travel. Animation visualizes authoritative state; it does not manufacture speed, damage or a teleport.

Do not build a monolithic species-specific walk sheet. Do not animate locomotion as a generic whole-body sine wave. Soft-tissue squash/sway is permitted as *secondary* reaction after joint animation and collision have resolved.

## Signal path
Shared emotional/physical state coordinates part-owned expression. Parts may respond to fear, curiosity, aggression, pain, fatigue, comfort, courtship and alertness; the coordinator combines these with actual actions, anatomy and constraints. Equivalent experiences may look different across anatomies. See the creator's [shared-state expression rule and acceptance contract](10-SHARED-STATE-AND-EXPRESSION.md). Runtime acceptance remains pending.

`Creature AI / player command + world contacts` → `Action Resolver` → `Movement/Gait Coordinator` → `per-part motion request` → `local joint solve/clamp` → `pose + attachments + materials` → `8-direction render`.

### Proposed signal payload (conceptual API, not existing code)
```
{
  intent: 'locomote' | 'look' | 'bite' | 'graze' | 'brace' | 'swim' | 'hurt' | 'court' | 'idle' | 'die',
  mode: 'walk' | 'sprint' | 'sneak' | 'stalk' | 'jump' | 'paddle',
  intensity: 0.0..1.0,
  localDesiredVelocity: [vx, vy],
  heading8: 0..7,
  targetWorld: optional position,
  footContact: optional grounded/contact normal,
  time: deterministic simulation time,
  priority: action priority
}
```
The coordinator does not directly alter pixels of a specific limb. It submits **targets**, timing and role; part controllers determine their own legal response.

## Rig representation
- A rig is a chain/tree of *named joints*. Every joint has `pivotPx`, parent, `type`, and bounded axes. For 2D in-plane art, a hinge typically has one signed `rotationDeg` DOF. Advanced parts may have stretch/hinge/squash DOFs, but all are declared.
- Constraints are stored on the **part definition**: `minDeg`, `maxDeg`, `restDeg`, `maxAngularSpeed`, `stiffness`, optional safe bend direction, contact end effector.
- Motion profiles name procedures/poses, not just eight baked frames: `idle`, `step`, `pushOff`, `recover`, `bite`, `track`, `blink`, `rear`, `swimStroke`, `defend`, `recoil` etc.
- Curves are deterministic functions of normalized action progress and available geometry. Clamp/resolve conflicting motions by priority. Allow data-driven expression across part instances.
- A part may contain image variants (e.g., eyes open/half/closed) while joints handle spatial motion.
- Parent pivots and child attachment transforms compose recursively. Surface masks are rendered in the part-local pose to prevent scales from sliding independently from the skin.

## Concrete part behaviors (proposed tuning examples)
| Part | Joints/DOF | Motion owned by part | Input triggers | Example safety constraints |
|---|---|---|---|---|
| Walking leg | hip hinge; knee hinge; foot tilt | lift, swing, plant, push, recover | locomotion stride; contact; velocity | hip -35°..+45°, knee 0°..95°; foot cannot remain planted when reach impossible |
| Spring leg | hip, hock, ankle | compressed rest, launch, airborne tuck, impact absorb | jump/pounce/stamina/landing | tendons compress before launch; knee fold direction stable |
| Sturdy leg | hip, knee, broad foot | planted bracing, slower heavy step | move, brace, recoil | lower swing velocity, wide contact patch |
| Eye stalk | stalk-root hinge; eyeball tracking | scan, blink, widen, recoil, aim | look target, surprise, danger | root about ±20°, eye aim about ±12° (illustrative) |
| Grazing jaw | jaw hinge | open, nibble, chew, carry | feeding target and chew cadence | collision-safe opening; food check performed by feeding authority |
| Tearing jaw | jaw hinge, recoil | telegraph, bite, snap, recover | valid attack request | attack hitbox only enabled by combat authority's active window |
| Tail | root, optional middle and tip | balance, steer, lash, settle | turn, sprint, swim, threat | max joint curvature and clearance |
| Fin | base rotation, flex | fold, paddle, stabilize | aquatic locomotion | no land swim bonus without a real capability |
| Frill/crest | base flare | display, fold, recoil | court/threat/alarm | no automatic threat success |
| Armor/material | no leg joints unless plates separate | skin-bound deformation, plate settling | flex/damage/wet | coverage remains in correct region as host part bends |

## Grounded locomotion — mandatory
1. Coordinator schedules gait phases according to **actual velocity** and supporting limb count, not species label. Support 2/4/6/8/10/12-limb assemblies without foot skating.
2. When a foot enters `stance`, lock its **world contact** temporarily to collision-grounded terrain. Body translation is compensated through its hip/knee solve. When reach is exhausted, release and transition to `swing` (no endlessly stretching legs).
3. In `swing`, select a reachable landing target using terrain, posture and direction. Then plant and produce feedback. Turn-in-place and reverse require distinct planting logic.
4. Damping/IK is bounded by joint limits. If an end target cannot be reached, use a visible stumble, shortened step or replan; do not dislocate joints.
5. Movement modes impose capability prerequisites: a webbed leg may paddle while swimming; an ordinary leg may struggle. Land access remains governed by terrain collision.
6. Push/impact reaction belongs to contact physics; parts display the reaction without granting extra displacement.
7. When no locomotion anatomy is installed, do not silently draw phantom legs or allow normal walking through a species stat.

## Multiple simultaneous requests
- Proposed priority: `death/disabled > physical collision/injury > committed attack/contact > active locomotion/support > targeting/feeding > idle/secondary`.
- Lower-priority channels may still drive unaffected joints. An eye can track while legs run, unless its tracking would conflict with recoil or damage.
- Mouth chewing and a bite attack share a hinge: arbitrate; do not sum angles. Multi-appendage creature action selects a compatible subset by capability and stability.
- Bone/part definitions must expose which channels each motion claims so the coordinator can detect contention.
- Each controller has deterministic transition and blending policy; no per-frame random snapping between states.

## Eight-direction rendering
- `heading8` remains 0..7. Facing conversion of front/side/down/up pose is consistent. Rig space rotates/mirrors with orientation; edit-preview facing cycles through all eight.
- Prefer authored directional corrections for facial surfaces, near/far eyes, handedness and overlapping limbs if naïve rotation/mirroring damages pixel clarity.
- Runtime sprite rotation must use nearest-neighbor and intentional pixel snapping; avoid fractional blurry pivots. Use stable pose projection to reduce limb flicker on diagonals.
- The 8-frame tradition is a **motion presentation/authoring convention**, not a limit on joint interpolations or the number of part motion states.

## Full runtime examples
**Stalk eye:** creature acquires a predator target → look intent → eye stalk rotates toward target within its ±limit and returns toward neutral if occluded → eyelid state blinks independently → head/body can continue locomotion. No fixed Stalker-only eye logic.

**Six-legged runner:** move request + actual traversable route → coordinator chooses stable multi-leg alternating phase → each runner-leg uses its own stride/lift range → grounded stance feet remain visually planted → body mass leans on real acceleration → lateral eyes continue scanning.

**Heavily armored animal:** incoming hit → combat resolves body-region/coverage → hurt request → armor plates settle, affected limb recoils within its joint constraints → weight shift uses still-planted limbs → exposed skin material does not detach.

## Performance and determinism
- Offscreen wildlife uses regional/population simulation without rendering full articulated bones; near camera solves high fidelity; distant sprites may use reduced joint updates/baked approved LOD *derived from the same rig*.
- Keep animation **deterministic** from creature state/seed and simulation timestamps. Pause, replay, save/load, screenshot capture and slow motion must yield consistent poses.
- Cache static assets, masks, rig topology and palette tables; avoid creating canvases and per-part allocations every frame.
- Keep pixel-snap stable across zoom and camera tracking. No animation-driven mutation of genetic anatomy or stats.

## Acceptance tests
- Leg-foot contact points do not slide when stance-locked on stationary ground in a controlled test; no exposed joint gaps during walking/turning.
- Same leg authored asset renders correctly in three different bodies without species-specific animation overrides.
- Run idle/walk/sprint/turn/hurt/attack/eat/swim where supported at all eight facings; animation clips neither clip out of dynamic creature bounds nor reverse knee bend.
- First-frame, final-frame and interrupted action transitions settle correctly without snaps.
- Locomotion throughput, combat outcomes and energy costs come from the simulation; replacing an animation skin cannot change them.
- Record genuine runtime videos/screenshots, not substitute rendered proofs. Include reproducible seeds and automated perf checks before milestone approval.
