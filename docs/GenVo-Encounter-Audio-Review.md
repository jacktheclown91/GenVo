# Anatomy-driven encounter audio

This pass changes runtime audio behavior, not simulation reproduction probabilities or the HUD layout.

## Source and gameplay

`src/audio/creature-voice.js` derives a voice palette and stable pitch from mounted capabilities and part mass. Mounted call anatomy is required. Tearing/swallowing, pecking/nibbling, filtering/sucking and other call-capable bodies use different existing authored palettes. These are acoustic presentation choices, not new diet or fertility rules. Founding species labels do not choose the voice. Original samples remain shipped.

`src/audio/model.js` uses canonical hunting and prey eligibility for nearby threat music, excludes the listener itself, and retains current encounter/territory-controller escalation. Ordinary nonpredatory bodies do not create a threat merely because their ancestry label was a hunter.

`src/audio/audio.js` chooses native creature voices through the new resolver, retains existing spatial attenuation/music beds and polls funded courtship sequences. The current lawful beat produces one spatial cue: calls use the creature voice, dance produces paired footfalls, flare/gesture produce quiet movement sounds, scent/approach stay quiet. Pause, dead/distant actors and invalid anatomy do not emit beats. WeakMap event deduplication is presentation-owned and resets with the world. Initiating courtship now uses a soft nonvocal cue; it does not falsely perform a biological call before one has begun.

No hidden mate scores, acceptance probabilities, preference calculations or genetics are read for partner sound feedback. Existing reciprocal choice, learned rituals, reproduction and combat remain authoritative. No RNG from the simulation is consumed by audio.

## Verification

`phenotype-audio-tests.json`: nine of ten focused tests pass. The remaining `evolving-courtship-rituals.mjs` assertion expects repeated limited dance to conceive; it fails identically in prior source. It is not declared fixed or waived. The old `audio.mjs` threat fixture also failed in prior source because it placed the hunter across water; the fixture now chooses the same actual landmass and retains danger/escalation assertions.

`audio-phenotype.mjs` checks identical mounted bodies across different founding labels, live mouth-dependent voice changes, no vocal mouth, canonical threat eligibility, beat deduplication, quiet pause and simulation RNG neutrality.

`phenotype-audio-browser-proof.json` records native Chromium 800x600 with all 32 authored audio buffers loaded. Actual mouse courtship sequencing, live future-beat changes, interruption, eventual observable outcome, attack, held brace, canonical injury and retreat use existing controllers. Actor readiness, valid anatomy and positioning are controlled fixtures; mate acceptance and injury outcomes are not authored. The recorded master mix includes actual authored music, ambience and action/voice sounds. `phenotype-encounter-mix.wav` contains that native output; `phenotype-audio-runtime.webm` is the separate browser visual recording. ScriptProcessor capture is a diagnostic tap only, not shipped gameplay audio.

This establishes output, timing/controller integration and absence of clipping in the captured mix. It does not establish subjective mix quality, creator sonic approval, a human listening/playtest, natural encounter frequency or readable chaotic encounters. Real gameplay screenshots show the current whole-creature poses; no new creature rendering or visual approval is claimed in this pass.

## Remaining scope

The full seven-priority goal remains active. Priority 2 gains real anatomy-driven and timed encounter sound; priority 4 removes specific founding-label audio gates. Reproduction/population authority still requires a grounded audit, the conception failure requires diagnosis, broader creature/vegetation presentation and listening review remain open, and naturally evolving generations/human comprehension/height foundations remain unfinished.

Next substantial milestone: resolve courtship conception versus readiness/physiology contracts and finish inappropriate reproduction/population label gates, preserving approved inherited compatibility and creator ownership of any new biological rule.
