# Physical contact and size-aware audio

Movement previously played the same short hiss for every surface and used a fixed distance between cues. Voice selection followed mounted call/feeding anatomy but did not read inherited size.

`src/audio/movement-contact.js` now observes actual contact: owned liquid volume, canonical ice support, broken ice, canonical snow cover, soil moisture, live vegetation and underground earth. Nearby water or a season/biome label never creates a splash or snow sound. Padded feet soften the contact. The existing player displacement path passes this reading into distinct bounded noise/transient envelopes; no held key, blocked move, teleport or pause creates a step. Current ordinary movement, AUTO and click travel still share this path.

Canonical adult size and development now affect contact weight, spectral balance, decay and world-distance cadence. The same distance creates fewer contacts for the longer inherited stride. At2x, dry contacts add a deeper bounded body transient, with capped gain rather than an8x mass multiplier. Existing call-capable anatomy keeps its authored palette; canonical current size/growth modulates its bounded playback pitch (and therefore sample duration). Size never grants a voice to a body without the existing call capability.

No simulation, resources, movement mechanics, conception, biological event or save schema changed. Audio uses its existing local noise/RNG and effects bus. The33 authored assets and master/shipped budgets remain unchanged. Mute, locked startup, channel levels and foreground mixing remain in place.

## Verification

- `audio-contact-size.mjs`: actual liquid/empty stock, supported/cracked ice, snow, soil/vegetation, underground, padded feet, canonical size/growth and distance cadence, bounded envelopes, absent voice capability, safe locked playback, and exact complete biological graph after queries.
- Existing audio runtime, phenotype/courtship, movement, preferences and asset checks pass. Architecture and canonical-source gates pass.
- Native public New World/onboarding/keyboard movement:9 actual contact calls over mud/vegetation. Recorded2.315s master output at192000Hz stereo, peak0.03868/RMS0.00900. This is actual player movement evidence; other natural surfaces remain unobserved here.
- Twelve controlled native OfflineAudioContext listening files cover seven surfaces, small/reference/large dry contacts and three sizes of the existing source voice. Final contact peaks0.00494-0.00896; voice peaks0.07085-0.07216 at the normal listener gain. Every file is nonzero/headroom-safe, and the complete paused live saved graph stays exact across private rendering. These metrics are not human listening acceptance.
- Final reproduction: `tools/review-contact-size-audio.cjs`; final receipt and WAVs under `contact-size-audio-2026-10-28/final/`. Earlier `native` captures are retained; their private voice renders lacked a listener facade and consequently used the existing no-listener bus gain. Final controlled voices provide a private stationary listener and normal volume; no live organism is modified.

## Remaining

C6 and the master objective remain active. Autonomous ground contact, actual wing-contact sounds, genuine rock substrate where the physical authority exposes it, larger bodies in real populations, broader live surface coverage and human listening/mix review remain open. Existing wildlife voices already use the new size reading; nearby autonomous footsteps require a separate displacement-gated spatial implementation. Do not replace missing live evidence with controlled palette claims.
