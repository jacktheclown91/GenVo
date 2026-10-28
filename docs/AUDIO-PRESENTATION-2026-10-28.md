# Soundscape and travel-feedback pass

Creator assignment: Codex visual/audio work, Claude simulation and integration.
Review branch: `codex/audio-motion-presentation-20261028`, based on verified main
`629ad29a91fdfceb1de7770596c27c5069ac4d49`. The full visual/audio assignment
remains active; this is the first audio implementation pass.

## Implemented

- Authored habitat beds fade over the generic synthesized fallback, reducing
  persistent background hiss. Missing assets retain the fallback. Unlock fades
  its initial gain in rather than abruptly starting at full gain.
- The ambience and lineage music have modestly more presence. User master and
  mute preferences remain intact. Existing weather, concealment, danger and
  handoff transitions still use their actual state.
- Movement rustles follow actual canonical displacement for manual, click and
  AUTO travel. Blocked keys no longer produce imaginary footsteps. Airborne,
  perched, underwater and paused movement stays quiet; character and region
  changes reset the presentation accumulator without a sound burst.

Only `src/audio/audio.js` changes runtime behavior. No assets, codecs, movement,
anatomy, RNG, simulation event hooks or save rules were changed. Existing
anatomy-based creature voice palettes remain intact; this does not claim a new
voice library or completion of every audio refinement.

## Evidence

Three ordinary native New Worlds cover actual rain, dry ground and snow-only
conditions. All 33 assets load. Opus and AAC decoding, real rain-only routing,
UI mute/unmute and complete canonical state parity pass. The updated captured
mix is approximately 1.8–1.9 dB louder in these observations. Maximum captured
peak is 0.116, leaving headroom in the sampled scenes; combat/transient extremes
and subjective comfort are not certified by these short captures.

[Full native mix receipt](audio-presentation-2026-10-28/native-mix-verification.json)
retains the before/after measurements. These previews preserve relative gain:

- [Before: native field mix](audio-presentation-2026-10-28/before-native-field.wav)
- [After: native field mix](audio-presentation-2026-10-28/after-native-field.wav)

Preview WAVs are mono, linearly resampled to 22,050 Hz without normalization.
Original stereo 192 kHz captures remain under
`reports/audio-presentation-{before,after}-629ad29a/`.

Native public Menu > Auto observation records 1,443 player frames, 16,699 nearby
NPC samples across 32 creatures, and 14 movement cues tied to real travel, with
no browser errors. The inspected midpoint and curated observation are retained
beside this document. Original video and samples remain in
`reports/audio-autonomous-native-20261028-5/`. This is observation for the next
animation pass, not a claim that all NPC animation has been improved.

Earlier observer attempts selected a nonexistent creature option, waited for a
climate tick before dismissing welcome, or attempted AUTO while its Menu was
closed. Their failed diagnostics remain in reports. The successful observer
uses public controls and does not skip onboarding or inject organism state.

## Focused verification and integration handoff

Passing focused checks: `tests/audio.mjs`, `audio-runtime.mjs`,
`audio-weather-reading.mjs`, `audio-phenotype.mjs`, `audio-assets.mjs` and
`audio-movement-presentation.mjs`; plus syntax, architecture and the native
captures described above. The new targeted test is ready for Claude to include
in the maintained integration plan. Comprehensive regression and integration
remain Claude's responsibility; no replacement full-game gate was run here.
The checked-in `audio-presentation-2026-10-28/runtime.patch` contains the audio
source and targeted test, with reverse applicability checked against this tree.

There are no missing biological event-hook dependencies for this pass. New
biological/action events, if later needed for voices or expressions, must be
requested from Claude rather than invented in presentation. No structural
shared-renderer/UI edit, main integration, release or itch replacement is part
of this change.

Next: evaluate recorded autonomous stops/turns and anatomy articulation, then
implement the animation correction supported by that evidence. Interface,
environment and anatomical-detail packages remain open. External listening and
creator visual acceptance have not been claimed.
