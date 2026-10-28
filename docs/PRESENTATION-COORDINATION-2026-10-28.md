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

Next bounded presentation edit: src/render/motion.js separates position interpolation from canonical animation-frame interpolation. Tick/frame-only updates will not restart an in-progress step. No renderer structure, movement authority, anatomy, save or simulation file changes. Focused regression checks cover continuous travel, turns and stationary endpoints.

Resolution prototype heads-up: extend indexed-art codec validation to explicit 32/64/128 square art and add a reversible, nonpersistent art-preview overlay in runtime-part-art.js. Comparison tools supply optional high-detail renderers; default catalog and gameplay resolution remain 32. No simulation, physical geometry, main loop, save, performance policy or shared renderer structure changes. Creator review precedes any global art-resolution change.

Anatomical locomotion pass: genvo.js will read a renderer-only gait-coordination module keyed by the existing mounted leg-slot array. Bipeds alternate; quadrupeds use diagonal pairs; numerous bilateral limbs use a traveling bank wave; irregular layouts retain independent recovery turns. Existing stride travel and toe retraction remain unchanged. Static/courtship/swim/legacy poses retain their phase convention. No shared simulation, renderer loop, movement authority or save edits.

Creature Lab navigation-only edit: add a link to the optional artwork-resolution workshop. No editor anatomy or authored pixel/save behavior changes. The high-detail choice remains explicit and experimental.

Creator approved refinement of 64px gameplay candidates and 128px Lab/inspection art, retaining stable32 until clear improvement. Next: sibling production-candidate catalog with original imagegen fur/feather/shell masters and canonical indexed derivatives; actual Creature Lab assembly gains a resolution selector through the existing renderer. Authored artist overrides keep priority, physical sockets/footprints and biological plans remain unchanged. Default gameplay still loads only the native32 catalog. No simulation/main/renderer-loop edits.

Next locomotion edit is local to genvo.js and a renderer-only support-load helper: smooth load sharing from the existing planted-foot phases moves torso/head carriage toward actual supporting limbs, with more deliberate carriage for sturdy legs. Candidate feet, stride distance and physical positions remain unchanged. Static, display, swimming, flight, climbing and other specialized action paths are excluded. No renderer-loop/main/simulation/save changes.
