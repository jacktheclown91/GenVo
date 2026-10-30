# Nearby autonomous movement contacts

Nearby wildlife now shares the player's physical contact sound palette. A presentation-only tracker observes actual world displacement, selects at most12 animals within8 tiles, and allows at most one nearest ready contact per120ms. It drops excess simultaneous contacts rather than queuing stale herd footsteps. Distance cadence follows the existing size/growth contact profile.

All synthesized layers route through the existing spatial destination, with world-left/right panning, distance attenuation and a quiet0.38 source gain. Effects/mute/master controls remain canonical. This does not duck music for every step. The tracker excludes dead/hidden/torpid/airborne/perched/climbing/digging/transiting/submerged animals and a different underground plane. A submerged listener is excluded. First arrivals, pause/resume, muted playback, region/listener changes and teleports cannot replay accumulated contacts. At most12 ephemeral histories are retained; no actor, world, RNG, save or biological event is written.

## Evidence

`tests/audio-wildlife-contact.mjs` verifies actual displacement, stationary silence, nearest bounded selection, no backlog, cadence gating, exclusions, teleport/pause/identity resets, crowded100-animal bounds, unchanged full canonical saved graph, routed noise/tone layers and muted/session reset. An initial added reset test used an incomplete artificial World with no idx method; corrected to the actual Simulation fixture before passing.

Existing audio contact-size, phenotype/courtship, runtime, preferences, asset, architecture and canonical-source checks pass. The33 shipped assets and their size budgets are unchanged.

`tools/review-wildlife-contact.cjs` launches ordinary public New World/onboarding, then leaves the player idle while actual wildlife moves. The native receipt records14 spatial movement contacts over mud/vegetation in4.213s; master peak0.07495/RMS0.01389 at192000Hz stereo. No browser errors. Recording and scene capture are in `wildlife-contact-audio-2026-10-28/native/`. The review only wraps/delegates audio calls and taps the output; it injects no actor positions, behavior, anatomy, terrain or sound events. Existing contact listening review now forwards spatial destinations when it wraps playContact.

This is live autonomous movement evidence, not perceptual listening acceptance, coverage of every surface or overall C6 completion. The full C1-C8 initiative remains active. Further work includes real flapping-wing sounds, canonical exposed-rock contact where supported, broader live habitat/surface listening, and mature populated-world mix/performance review.
