# Original locomotion-contact sound candidates

Twelve original mono contact sounds provide three deterministic variants each for soil, litter, compacting snow and shallow water. Each is a single .32-second contact, not a walking loop. Soil combines a soft load impulse and short grit; litter adds irregular microfractures; snow uses a muted compression/squeeze; shallow water uses a short splash and damped low droplet. No animal calls, fixed foot counts, musical step sequence or external samples/models are embedded. The existing project DSP helpers and the new generator are retained source. No new licensing dependency is introduced.

Open index.html through the project HTTP server to audition each sound, or play contact-review-reel.wav. Reel order is soil, litter, snow, shallow water, three variants apiece, with silence between contacts and longer surface gaps. This reel is isolated sound design, not gameplay audio. Subjective listening and creator approval remain unproven.

## Production verification

All twelve WAVs reproduce byte-for-byte, with distinct variant hashes and nonidentical within-surface waveforms. They are mono 22050-Hz 16-bit PCM, .32 seconds each; peaks are approximately .48 and RMS ranges .029-.057. DC and first/last-sample edge limits pass without clipping, non-finite replacement or test-budget changes. Native Chromium WebAudio decodes all twelve at this device's 192-kHz context to finite mono .32-second audio with bounded peaks. This verifies asset/decoder behavior, not gameplay scheduling, device listening or sonic acceptance. Source and file SHA256 values are in manifest.json.

The twelve prospective masters total 169872 bytes. The actual unchanged runtime pack remains 33 assets, 4674284 master bytes and 1545682 compressed bytes, passing the existing audio-assets test. These candidates are deliberately outside AUTHORED_AUDIO and the public export; no unused runtime audio or new UI control is installed. The public-export check passes. Future compression/playback integration must satisfy the existing shipped-byte and voice budgets without raising them.

## Integration remains required

The checked-in ../art/contact-audio-v1-handoff/README.md defines the Claude event/playback handoff. Real contacts, material evidence, anatomical support, pause/block/scene reset, spatial/acoustic limits and bounded concurrency must drive scheduling. Ground contacts cannot be inferred from idle elapsed time; vegetation does not prove litter, calendar winter does not prove snow, supported ice is not liquid, and fins are not feet. Keep canonical simulation RNG and movement/resource outcomes unchanged.

Run python tools/verify-contact-audio-review.py and node tools/review-contact-audio-decode.cjs. Then retain the current audio-assets/public-export checks. This is completed sound-design production with an explicit runtime integration gap, not completed locomotion audio or full v1 acceptance.
