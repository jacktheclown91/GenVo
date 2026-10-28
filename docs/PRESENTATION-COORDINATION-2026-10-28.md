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

Persistent contacts heads-up: bounded integration in renderer.js and genvo-draw.js passes the actual final sprite origin into a presentation-only GroundContactTracker after socket insertion. Stance feet retain world-space display anchors; starts and stopped/turning feet recover visually with current hips and knees. Existing eight-direction body/control response, authoritative displacement, biology and saves do not change. Idle actors return to existing sprite caches after a short recovery; state is bounded/pruned and identity/world changes reset it. Special actions keep their current poses. No renderer-loop restructuring or simulation edits.

Swimming presentation heads-up: renderer.js resolves its existing water/flight/landing action before computing carriage, so aquatic-range swimmers receive water carriage rather than a walking bob. A renderer-only helper gives real mounted webbed feet paired power/recovery strokes and ordinary limbs smaller alternating paddles. Assembler metadata exposes the mounted part ID; biology, water eligibility, speed, costs and saves remain untouched. Ground contacts remain excluded for swimming.

Creator-reported mirrored parts: correcting native two-bone limb tissue handedness in indexed-part-renderer.js / part-sprites.js. Mirrored anatomical limbs now mirror transverse bone/hip/knee paint, keeping every joint coordinate, part ID, directional frame and biological record unchanged. Checking actual Lab at all three artwork resolutions. Flight work is deferred while this defect is addressed.

Creator clarified inconsistent forward/backward limbs: distal foot paint was locked to the shin axis, so rear limbs could show backward feet. The existing lower tissue is now partitioned once into shin/foot paint; grounded distal feet align with body forward while exact foot contacts and hip/knee geometry remain unchanged. Swimming/climbing/digging/aerial and raised-strike orientations remain specialized. No source artwork, anatomy, biology or saves rewritten.

Aerial presentation heads-up: local renderer sampling of actual airborne/glide/ground transitions drives powered wing deployment/sweep, tucked limbs and a brief landing recovery. Native dorsal panels rotate about existing mirrored hinges with root tissue fixed; no asset/root metadata changes. Uses the existing pause-aware presentation clock; physical flight availability, costs, altitude, routes, biology and saves remain Claude-owned and untouched. Active aerial sprites bypass stale pose caches; paused keys carry their frozen pose.

Climb/excavation presentation heads-up: renderer-only bounded observation interpolates actual climb height or burrowWork.elapsed without extrapolation. The same displayed climb height drives body projection and height-locked grip/reach phases. Actual mounted digging organs scoop from excavation progress while other legs brace; perched bodies hold a static grip. No controller, terrain/passages, resource work, physical position, eligibility or save changes. Active work avoids stale sprite caches; pause remains exact.

Canopy verification dependency for Claude: the real Day-30/Day-100 catalog checkpoints contain zero Woodspire cells meeting CANOPY.minimumTree=.85 (maxima .3659063/.5332412). Public sandbox climber import succeeded; fresh-region and mature/current-rules attempts found no supported canopy. Need an actual matured supported-tree checkpoint/observation for genuine climb/ascent/descent acceptance. No threshold, biomass or physiology was changed for the visual test. Excavation is natively verified through public paid work and completed underground entry.

Frozen work/aerial cache compatibility: genvo-draw.js accepts a renderer-only frozenPose flag so a paused climbing actor can reuse its exact keyed bitmap even though its real climb still sets moving=true. Active work remains uncached; source keys include the frozen work/aerial data. No pose or simulation authority changes.
