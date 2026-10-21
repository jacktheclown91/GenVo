# Exploration feedback | October 21, 2026

Recognized cave entrances already share real geology, optical visibility, artwork and `sim.caveStatus`. The contextual mouse target now reports that exact execution status rather than generic ground descriptions. A player can see whether the selected entrance must be approached, their body cannot fit, movement is blocked, or they can interact. An entrance outside current biological vision remains simply unknown ground; no hidden passage or enemy state is exposed.

The existing sight, hearing and scent cues remain unchanged. Their on-screen symbols now show concise labels for sound, scent and ground vibration, without giving precise origin coordinates. The 32px top-down cave artwork and renderer remain intact.

The deterministic cave-ui regression stages a player at an actual generated opening and separately outside their visual range. It verifies target selection, authority parity and hidden-information boundaries. Real novice comprehension and Chromium screenshots remain unverified.
