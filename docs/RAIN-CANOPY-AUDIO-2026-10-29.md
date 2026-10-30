# Rain on living canopy

Rain previously used the same rain bed on bare ground and beneath foliage, while the canopy texture required wind. Added a separate nonvocal rain-on-foliage texture to the existing environmental mixer. Its gain follows actual liquid rain and actual local living woodspire canopy, independently of biome names or wind. Dry/no-canopy cells, caves, burrows, underwater and silent scenes target zero. Existing0.85-second transitions avoid abrupt weather or habitat changes. No droplets, animal calls or biological events are invented.

The layer uses a3200Hz broad band of the existing shared noise buffer with gentle5.7Hz amplitude flutter. Peak layer target is0.22, subordinate to the rain bed. It adds one looping buffer source, one filter, three gains and one modulator at initialization; no decoded buffer or per-update node generation. Existing wind, rain, water-source, music and action paths remain intact. No shared structural audio.js, biological state, saved fields or world policies were changed.

Focused rain-canopy and habitat tests cover liquid-rain/canopy requirements, wind independence, biome-label independence, dry/enclosure transitions, bounds, shared buffer reuse and1000 allocation-free mix updates. Existing habitat start-count assertion now expects10 starts for five source/modulator pairs. Runtime, weather-reading, audio, canonical-source, architecture, syntax and configured whitespace checks pass.

## Native evidence

rain-canopy-audio-2026-10-29/native/ records ordinary rainy/dry/snow new worlds, native Opus/AAC decoding,33 loaded assets, eight authored loops, five shared-buffer textures, mute/unmute and exact audio-query saved-state parity. These three listeners were in clearings with canopy0: they prove suppression, not foliage activation.

field/ adds actual keyboard travel in AUDIO-RAIN-3 to an existing rainy tree at55.5,49.5. The observer reached55.4204,49.5; actual liquid rain0.38768 and canopy0.27625 drove the new layer target0.03784. The local biome was wetland, demonstrating real foliage rather than label-based routing. The8-second native master recording peaked0.10719 with RMS0.01323; no Simulation/environment/event fields were staged, and the full saved graph remains exact across audio queries. Screenshot inspected.

comparison/ is a separate native OfflineAudioContext acoustic fixture, explicitly controlled. Same noise seed and authored beds, before disables only the new layer. Before/current8-second peaks0.05517/0.07251 and RMS0.00817/0.01178; isolated layer peak0.03898/RMS0.00847. Dry, bare and enclosed cases target the new layer at zero. This demonstrates measurable output and digital headroom, not listener approval or natural rainforest history. Eleven further controlled habitat palettes are under native/.

Creator listening acceptance, other major habitat audio, anatomical voices, mature-world performance and full C1-C8 integration remain open. No release published.
