// Wildlife movement parity (Phase 3K Priority 1, creator decision 2026-10-16). Identical bodies covered the
// same 0.291 tiles per movement update whether player-controlled or autonomous, but the player gets a
// movement update every tick (through control steps) while autonomous animals got one per 6-tick ecology
// step (Simulation.update returns early between steps), so their speed while moving was a sixth of the
// player's and of their listed speed (tools/movement-parity-audit.mjs). With this on, autonomous animals also
// get a locomotion-only update on every tick between ecology steps: they keep moving toward the target
// their last decision chose, at the same distance and energy per tick as the player. Decisions, meals,
// drinks, courtship, interactions and metabolism stay on the ecology step, so nothing is consumed more
// often just because movement is continuous. Ambient pauses, rest and caution are unchanged.
// A hand-steered player is never moved by the substep (its movement is the control step's): otherwise a released
// key let it slide on its last steering vector until the next decision cleared it (found by
// tests/decisions-under-pressure.mjs: a sprint into cover overshot 0.8 tiles).
// ?movementParity=0 restores ecology-step-only movement.
export const MOVEMENT_PARITY={enabled:true};
