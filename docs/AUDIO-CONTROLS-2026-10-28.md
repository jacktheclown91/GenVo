# Independent audio controls

Options now exposes Music, Environment, and Creatures & actions alongside the existing master and mute controls. Each updates its existing WebAudio bus and persists in browser-local `genvo8-audio` preferences. Old preferences retain the existing .34/.42/.68 balance. Invalid values are ignored; finite values clamp to 0..1. Channel changes preserve foreground/handoff ducking and never unmute the master. The master range now supports the actual default 72%, rather than rounding its thumb to a five-percent step.

No simulation, biological event, asset, or save schema changed.

Verification: `tests/audio-preferences.mjs`, `tests/audio-runtime.mjs`, `tests/audio-assets.mjs`, `tools/architecture-check.mjs`, and `tests/canonical-source.mjs` pass. The initial attempted `tests/architecture.mjs` path did not exist; the actual architecture tool above passed.

`tools/review-audio-controls.cjs` exercises public Options sliders, mute and reload in isolated native Chromium. `audio-controls-2026-10-28/verified/receipt.json` records all assertions, no browser errors, and 1440x900, 1024x768 and 800x600 layouts. Top and bottom screenshots were inspected at 800px; existing panel scrolling keeps Back reachable. Earlier captures are retained separately. This is Options/UI and bus behavior evidence, not a new perceptual listening acceptance or full C6 completion.

Claude morphology S2/reserve conversion and inertia design were merged normally before this pass. The broader C1-C8 objective remains active; next work should consume the now physical size contract in presentation, prevent double growth, and demonstrate real size differences with ordinary movement and world reference features.
