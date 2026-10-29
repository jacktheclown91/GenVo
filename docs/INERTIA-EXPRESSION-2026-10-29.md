# Physical acceleration and turning in body presentation

The renderer now consumes Claude's canonical `motionStateOf` under `inertia/1`. Actual acceleration projected into the current eight-direction body frame creates bounded forward/backward lean and inside-turn banking. Braking yields the body slightly; head/torso twist and tail follow-through counter the actual turn load. Runner and sturdy limb shares modulate tissue flex without changing any physical acceleration, speed or turning limit. The existing gait/contact system still owns foot placement.

`src/render/inertia-expression.js` reads actual motion, never derives a competing velocity from targets, keys or position differences. It smooths visual deformation over75ms, returns to neutral under constant velocity/rest, freezes under the paused presentation clock and keeps at most512 active histories. Idle zero-force bodies exit early. Feeding, birth settlement, combat reaction/committed actions, work and aerial poses retain priority. Swimming is excluded pending its own propulsion presentation. Old worlds without the rule return null and retain their current paint path.

The existing body/hip/socket frame receives the deformation; no organism/world translation, foot spread, movement, steering, physiology, RNG, save field or inherited anatomy is written. Quantized NPC deformation enters the existing bounded sprite cache key. Regional fauna use the same drawAnimal path.

## Verification

- `tests/inertia-expression.mjs`:32 actual modular body/facing cases driven with canonical planMotion/commitMotion, acceleration/brake/turn signs, neutral recovery, frozen pause, action priorities, legacy no-op, bounded/pruned history, additive body-only composition and complete canonical saved-graph parity.
- Existing painted ground-contact integration now also varies torso lean/bank/twist/drop across its size/facing/zoom sequences.158,630 consecutive support observations pass; maximum held-foot drift2.29e-16 tiles. No assertion or budget was weakened.
- Existing grounded/anatomy locomotion, aerial, work-motion, thermal, architecture and canonical-source checks pass. The old grounded-locomotion test writes its receipt to a historical path: this run's output is archived here as `inertia-expression-2026-10-29/grounded-support-current.json`; the original tracked receipt was restored byte-for-byte, not rewritten.
- Native public sandbox-founder gameplay uses the existing furred runner and armored sturdy plans, optional64 art and public keyboard controls. Actual acceleration, turning and braking are observed; actual autonomous bodies share the path. No motion, target, position, resource or event injection.
- Fur:73 nonzero player /25 autonomous paint observations,302 queries, mean query0.01821ms. Sturdy:53 player /47 autonomous,304 queries, mean0.01776ms. Both record `inertia/1`, zoom3 and full paused saved-state parity. Ground tracker reports zero hold drift in both. These are bounded small-scene query timings, not whole-frame or mature-world acceptance.
- `tools/review-inertia-expression.mjs`; native receipts, actual phase screenshots and videos under `inertia-expression-2026-10-29/native-fur` and `native-shell`. Turning context was visually inspected. Screenshots show different actual movement moments, not matched-frame before/after comparisons.

## Still open

C3 and the full C1-C8 objective remain active. Broader body configurations, asymmetric/injured locomotion, aquatic inertia expression, mature-world performance and creator movement-feel acceptance remain open. Continue the remaining anatomical artwork (especially torso/head/feeler readability), conditional structures and physically supported large population/navigation requirements. Preserve Claude's movement and structural authority.
