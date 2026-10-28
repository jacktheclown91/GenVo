# Shared presentation coordination

Codex's next bounded edit is `Renderer.easedDir` in `src/render/renderer.js`.
The correction retains elapsed render-time remainder when traversing the
existing eight facings. It keeps the same 70 ms cadence and shortest path, but
does not make turns slower merely because a frame arrives between cadence
boundaries. This note precedes the shared-file edit.

No simulation direction, movement, position, collision, action timing,
perception, anatomy, persistence, renderer structure or cache architecture will
change. The existing method interface and bounded presentation map remain.
Claude owns comprehensive regression and main integration; this Codex branch
will carry focused before/after cadence evidence and native sprite evidence.

The baseline native observation recorded 1,446 frames with visible NPCs, a
maximum 100 ms frame gap and one gap over 70 ms. Those measurements do not
establish a major performance problem. This is a presentation cadence
correction, not performance engineering or a claim to fix all locomotion.

Next shared styling edit: compact Help, Population and Home Range windows in
`styles.css`. Actual native bounds cover the player at both 800x600 and
1024x768. The bounded correction reduces only those compact widths at medium
viewports, retaining normal wide-screen layouts, phone layouts, independent
scroll owners and explicit expanded views. No camera, command or simulation
logic changes are planned. This note precedes the styling edit.
