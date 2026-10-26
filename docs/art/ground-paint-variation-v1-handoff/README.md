# Ground paint variation heads-up

Renderer baseline e1331e34 runtime, exact before/renderer.js and range-audit.json retained. Its signed-shift hash limits intended32-pixel grain placement to0..15 on each axis and never reaches the light-grain branch. Consequently the same dark microtexture occupies one quarter of each tile. The actual sampled14336 grain events substantiate this, independently of the still-needed native candidate review.

Planned Codex change: a full-range unsigned ground-paint hash for fine grain and matching cached/live soil microdetails only. Keep the renderer's other hash consumers, water/shore geometry, vegetation selection, botanical resources, biology, saved world fields and simulation RNG unchanged. Shared renderer.js heads-up before implementation. Existing pregnancy/flora source remains frozen during its gate; this commit adds diagnostic tooling/documentation only.

Acceptance requires inspected native before/after actual terrain, equivalent cached/live painting, correct source-world coordinates at boundaries/negative coordinates, complete canonical-state parity, actual exported target interactions and applicable integration. A proposed hash model alone does not meet those requirements. Do not claim whole terrain or weather completion from this narrow texture correction.
