# Native-weather environmental audio refinement

Three existing background stems are refined as nonvocal wind/vegetation/water textures. Fixed bird, cricket and frog phrases are removed from backgrounds that do not know whether those organisms exist. The soil-moisture bed no longer embeds rain. Existing anatomy-driven voices, actions, courtship, music, fire and thunder paths remain intact.

A separate original 12-second rain stem uses the existing authored-loop/decoder/bus system. Its gain consumes only canonical atmosphereAt(...).liquid at the actual listener position. Dry and snow-only air, absent observers, underground and submerged listener readings are quiet. The amplitude curve is presentation-only; no precipitation, resources, climate, events, biology, time or save policy changes.

## Verified evidence

- All six focused audio/asset/phenotype/weather/public-export checks and the canonical source audit pass. The exact loop test now names all eight loops, including rain; no asset/headroom/size budget changed.
- All four mono 22050-Hz 16-bit masters remain exactly 12 seconds, finite and within original peak/RMS limits. Seam steps are bounded against each stem's ordinary adjacent-sample variation. Pack totals: 4,674,284 master bytes and 1,545,682 shipped bytes, below the existing 5 MB / 2 MB gates.
- Full regeneration keeps all 29 unrelated masters byte-identical to the old generator and preserves its final build-only RNG state. All 87 unrelated actual master/compressed files stay unchanged. Scoped and full regeneration produce the same four revised/new ambience masters.
- The ordinary public export has 836 files. It includes Opus plus AAC fallback and uses no review source overlays. Three public seeded worlds run in the same application with the native 30-second clock: actual rain, dry air and snow-only precipitation. No weather, organism, reserve or event field is injected.
- Native WebAudio loads all 33 assets and eight loops. All four ambience stems decode through both formats. Actual rain enables its stem; dry/snow cases retain only the existing inaudible gain floor. Native master output is recorded without adding an audible path, has measured peaks below .09 in these excerpts, and public mute/unmute controls work. Complete saved-state graph is identical across synchronous weather reading/mix updates.

The device's native context runs at 192 kHz. AAC decodes roughly 47 microseconds short of 12 seconds, within one master sample plus resampling round-off; original exact-length checks remain on PCM masters, and existing loopEnd handles encoder padding. Native 192-kHz recordings remain in the raw archive; the listening copies below are explicitly resampled to portable 48-kHz stereo WAV.

## Listening copies and limits

[Actual rain scene](AUDIO-RAIN-3-review.wav) · [Dry scene](GENVO8-TEST-A-review.wav) · [Snow-only scene](AUDIO-RAIN-4-review.wav)

These are genuine game mixes, not isolated demonstration events. Numerical/decoder/output verification is established; subjective listening quality and creator sonic approval are not claimed. Complete biome identity, locomotion/material variety, finer shelter/ice/acoustic occlusion, all intensity extremes, mature-world performance and full v1 acceptance remain open.

## Reproduce and provenance

`python tools/generate_audio_assets.py --ambience-only` updates only the four ambience masters and their compressed copies. The default command still rebuilds the whole authored pack. All sound is original deterministic synthesis using the retained project DSP authoring code, with no external samples/models/music or new asset licenses. Existing original masters/source are retained in Git and in the development archive. Before/failed candidate outputs and the complete generation/runtime evidence are under `reports/art-session-20261023-audio-v1-raw` in the original repository.

Use the ordinary public exporter, then `node tools/review-environment-audio.cjs <export> <new-report>`. The checked-in runtime patch is an integration record, not something to reapply to active source. The first edit attempt stopped on CRLF mismatch and inadvertently launched the old generator; all 96 original hashes were restored before refinement. An invalid fractional envelope endpoint was caught by the unchanged asset test, corrected by clipping its mathematical domain, and the writer now rejects non-finite source audio rather than hiding it as silence. Original failures are retained.

This pass does not migrate, push, release or certify the complete game.
