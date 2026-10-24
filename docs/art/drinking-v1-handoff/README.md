# Drinking animation integration handoff

Codex source audit and heads-up, October 24, 2026. Baseline de5cdf46. This is the next action-presentation pass, not completed drinking artwork or gameplay acceptance. Claude retains water/hydration, resource ownership, action semantics and persistence. Codex owns native body and contact artwork.

## Current-source findings

- src/render/behavior.js visualActionFromIntent uses the recent actor-matched lastPlayerAction for manual drinking. Its autonomous drink/learn-water branch also yields drink from isDrinkable or target proximity. Thus a drink pose alone proves neither liquid contact nor a positive hydration transfer.
- src/sim/simulation.js playerDrink writes a surface drink action even when hydration is already full, then returns ok based on the actual gain. That action record has no waterGain or source index; the freshwater-food variant supplies energyGain, not the actual water gain.
- simulation.js resolveAction performs autonomous surface sips, publishes actual amounts through regionalEcology.noteEngineerDrink and family.notePracticeInteraction, but has no common actor-local drinking receipt.
- Cave drinking and winter-water resolution have distinct owners. Snow melting, breaking ice and liquid uptake must not all emit a liquid ripple. Source medium cannot be guessed from intent, species, nearby water or a mouth part.
- renderer.js drawLifeEffects draws a smooth circle whenever action is drink on alternating frames. This is neither native-grid water-contact artwork nor evidence that the mouth touched exposed liquid. The body already lowers generally through behaviorVisualState; the missing refinement is coordinated reach/contact/swallow/recovery grounded in actual support.

## Integration order and ownership

1. Codex will replace the intent-only smooth circle with original native-grid contact artwork driven by actual exposed-liquid contact. No new biology receipt is inferred from that artwork: it may communicate contact, not successful hydration. Snow/ice work, airborne/perched bodies and incompatible traversal must suppress liquid contact. Preserve groundwater and marine distinctions and body-mounted mouth geometry.
2. A successful-sip sequence requires a shared canonical observation. Claude: when integrating water work, expose one actor-local successful-transfer record through the existing hydration owners (surface/manual/AUTO/cave/winter). Proposed minimum observation: actorId, tick, actual hydrationGain > 0, actual source position/index and medium. It must be written only after successful canonical transfer, include no second water account, retain existing save compatibility, and leave physiology/RNG/outcomes unchanged. This paragraph is a requested interface contract, not authority to invent records in presentation.
3. Codex consumes an available authoritative record read-only for one brief reach/swallow/recovery; interrupt on movement, threats, attack, nursing and lost support. Failed/full-hydration requests do not start a successful-sip cue. Co-occurring real filter meals retain their mouth/action channels rather than gaining two competing crouches.

## Required evidence

Inspect exact current owners before implementation. Test real positive and zero-gain surface actions, AUTO sips, finite cave water, snow/ice medium separation, actor/world replacement, pause/speed, interruption, source direction and full canonical state/RNG parity during drawing. Render native eight-facing body/contact examples, explicitly label staged pose fixtures, then observe real public gameplay water interactions in an exported build. Do not count intent-only poses or a fixture as proof of a successful drink. Applicable integration gate follows shared renderer changes; creator/anatomy/GPU acceptance stays separate.

No shared source change is installed by this handoff. Existing surface drinking receipts are insufficient for a universal successful-sip animation; presentation can proceed on verified physical-contact artwork while Claude owns the shared transfer record. No ecology, costs, save policy, population or action semantics should be altered to obtain screenshots.
