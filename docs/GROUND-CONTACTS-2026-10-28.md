# Persistent presentation ground contacts

Implemented on `codex/audio-motion-presentation-20261028`, following support carriage `a3f21447`. Main through `75d22b50` was merged first without conflicts; Claude's regional biology and frozen controls are preserved.

## Source change

The preceding gait already held phase-relative supports, but rounded actor origins, quarter-frame NPC phases, torso socket placement and eight-facing changes could still slide the final painted feet. `src/render/ground-contacts.js` now retains temporary world-space artwork contacts. `renderer.js` supplies actual painted origins and real movement, facing, anatomy identity and pause state. `genvo-draw.js` applies contacts after authored hip/socket insertion and solves each knee from its current hip and held foot.

Walking starts ease from the previous neutral posture over 120 ms. Stopping and standing turns lift and recover feet with staggered 180 ms recovery; torso carriage eases over 150 ms. A sharp reversal releases an overstretched artwork support through 110 ms recovery. These are render transitions, not physical forces, navigation constraints or new biological events.

Temporary state is bounded to 512 observed actors, pruned after 2.5 seconds, and reset on world/anatomy changes, teleports and unsuitable observation gaps. Stationary actors return to their original sprite cache after 280 ms. Frozen contacts can use the existing sprite cache; normal cache keys remain unchanged. Special aerial, submerged, climbing, burrowing-transition, reaction, feeding and combat poses retain their existing paths. Native32 remains default; the same contact implementation also works with the approved optional64/128 artwork at unchanged world size.

## Focused evidence

- `node tests/ground-contacts.mjs`: stance/turn continuity, start/stop/reversal recovery, pause, identity/teleport/world resets, repeated-pass idempotence, immutable inputs and bounded idle-cache recovery.
- `node tests/ground-contact-paint.mjs`: actual final authored limb insertion across four legal plans, eight directions and three zooms; 39,876 consecutive support observations. Preceding raw straight-path coordinate drift reaches 0.08839 tiles in this deliberately quantized fixture; new held coordinates differ by at most 1.12e-16 tiles. This measures coordinates, not perfect subpixel raster registration.
- Support-load, gait-coordination, grounded-locomotion, limb-articulation, motion-render, render-cache and world-swap-render checks pass. Static/display/swim/legacy frozen pose parity remains exact. Architecture, canonical-source audit, syntax and whitespace checks pass.
- [Native controlled comparison](ground-contacts-2026-10-28/native-reviewed/receipt.json): four real registered body plans, actual optional64 assets, staged start/turn/stop traces. Full paused biological snapshot stays exact. The overlay leaves the actual game UI and world intact. This is an explicitly staged animation comparison, not spontaneous behavior evidence.
- [Native autonomous run and cache timing](ground-contacts-2026-10-28/native-cache-check/receipt.json): public New World and AUTO controls, 1,047 walking observations, 14 NPCs, 56 heading changes, zero browser errors; no movement injection. Matched paused young-world composition with contacts / preceding path / contacts measures median 3.7 / 4.0 / 3.5 ms, 30 measured samples each, nine visible actors and 576 sprite-cache hits in each window. Canonical snapshot is exact. These timings are scene-specific CPU composition, not an FPS or mature-crowd certificate.

The native gameplay frame and before/after motion frames were inspected. Supports recover without the former immediate turn/start snap; different limb counts retain their anatomical gait. Pixel-grid rounding remains visible at low zoom. Creator acceptance is pending.

## Remaining initiative

This completes this contact/recovery slice only. Full locomotion, specialized swimming/flying/climbing/burrowing, injury/action expression, production anatomy catalog refinement, environments, voices and interface/audio-settings work remain active under the major A-I objective. No save schema, organism, simulation authority or public release changed. Claude retains comprehensive integration and performance ownership.
