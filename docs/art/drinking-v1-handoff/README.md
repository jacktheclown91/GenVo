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

## Surface-contact candidate

Codex shared-source heads-up applies to src/render/physicality.js and the removal of the intent-only ring in renderer.js. New water-contact-art.js paints original native-grid fragmented wakes. Physicality reads shared liquidContact/iceSupports and excludes submerged, airborne, perched and underground bodies; supported sheet ice does not displace liquid. A nearby water cell or drinkable flag alone no longer paints a bank ripple. No successful-sip body sequence is claimed or installed pending the authoritative positive-transfer observation.

Four focused checks pass: water-contact-art, physicality-render, birth-settlement, world-swap-render. The contact check uses synthetic water/ice geometry and must not be described as observed winter gameplay. Native artwork inspection and the full playable integration gate are pending on this candidate.

Native fixture follow-up: the first sampled contour looked too dotted, so the original half-grid fragments now connect between samples while retaining intentional crest gaps. The 24-cell actual native-body/synthetic-contact sheet was inspected, and the actual app graph is equal before/after painting. Both the targeted contact check and native fixture reran successfully after that refinement. This is artwork inspection, not genuine water-contact gameplay.

The first playable process was already running during this final contour refinement. Its eventual result cannot establish a fixed final-source full gate; retain that log as an intermediate run, then run the final committed candidate gate without source changes. No integration into main or acceptance claim is made while those checks and genuine gameplay observation remain pending.

Surface-contact integration result: fixed merged runtime 8912ee2b passes all 106 playable checks, six focused checks and native fixture/actual-world/main-UI/standalone-export browser reviews. Original intent-only ring removal changes presentation only. Canonical positive-transfer receipt and successful-sip body sequence are still pending under the previously documented ownership. Exact integration patch and evidence are retained. No natural winter or creator acceptance is implied.

## October25 native manual positive-transfer witness

The public mandatory tutorial path now has a bounded genuine manual surface drink witness: visible Water target, native Drink click, canonical actor109 lastPlayerAction type drink at tick16, hydration111.6 to114. See docs/ui-tutorial-steps-2026-10-25/receipt.json. No resource/reserve/position/action was authored. This updates the previous lack of any successful manual observation; it does not supply a common actor-local gain/source receipt for all routes, prove mouth/liquid contact, validate autonomous/cave/winter sip animation or establish creator acceptance. Preserve original historical receipts and the remaining authority requirements.
