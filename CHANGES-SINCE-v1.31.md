# GenVo8 changes since v1.31

This summary was written because the session's project-chat connection failed. It covers everything after the v1.31.0 build.

## Where the ZIPs stand

Both canonical ZIPs in `game jam october` (`genvo8-itch.zip` and `genvo8-toolkit.zip`) hold **v1.33.5** (readability pass 2). They were replaced with v1.32.2 after James said "let it finish, replace updated zips, then reset", with v1.32.3 after "replace and proceed", with v1.32.5 after "replace both zips and proceed", with v1.32.6 after "proceed", with v1.32.7 after "replace both zips and proceed", with v1.33.0 after "replace both zips and proceed", with v1.33.1 after "replace zips and proceed", with v1.33.2 after "replace both zips and proceed", with v1.33.3 after "replace both zips and proceed", with v1.33.4 after "replace both zips and proceed", and with v1.33.5 after "replace both zips and proceed". Before each replacement, each package was unzipped and checked: the manifest version matches the build, the itch files match their fingerprint, the toolkit matches the provenance ledger, and both ZIPs carry the same manifest. Nothing was uploaded anywhere.

## What each step changed

**v1.31.1: release and provenance cleanup (no gameplay change).** The v1.29 to v1.31 ZIPs carried a `release-provenance.json` that said 1.28.0, because the packaging step used a fixed version. The step now reads the version from the build and verifies every package after zipping.

**Consolidation Stage A: baseline (no gameplay change).** `tools/evolution-baseline.mjs` measures how genes, adaptations, forms, proto-traits, lifestyles, habits and family tendency combine into a creature's speed, forage range, threat sense, metabolism, water use, shelter and food value. It records each system on its own, three fully stacked cases and three natural 60-day AUTO runs in `docs/evolution-baseline.json`. `tests/evolution-baseline.mjs` fails if any of those numbers change without the baseline being rewritten on purpose.

**v1.32.0, Stage B: one pressure vocabulary.** Creature pressures and population pressures now use one list of names: scarcity, competition, predation, crowding, dryness, wetness, heat, cold, disease and few mates. One deliberate change: Webbed Limbs now comes from living against water rather than from thirst. Save schema 5.

**v1.32.1, Stage C: one effect pipeline.** Every lineage effect on travel, forage range, threat sense, shelter, metabolism and water use now combines in `lineage/effects.js` under one limit per effect. No single system lost any effect. Only fully stacked lineages changed: the widest-ranging stack now searches 18.9 tiles instead of 28.5 and walks at 2.89 instead of 3.0, and the most vigilant stack spots threats at 10.2 tiles instead of 13.7.

**v1.32.2, Stage D: adaptations are anatomy.** Each founder-line creature carries twelve inherited body parts. An adaptation appears when its body part crosses a threshold, and tier 2 adaptations are the same part developed further. Lived pressure grows the matching body part a little in every newborn, so adaptations can emerge over generations. Successor and journal cards show parts that are close to a threshold. The successor choice is kept. Save schema 6 converts every existing adaptation into its body part, so no creature gains or loses one.

**v1.32.3, Stage E: forms and proto-traits are anatomy readings.** Forager and Colony form strength now lives on the body as long reach or a compact frame, and each of the eight proto-traits has its own body axis (for example Watch Crest is a watch crest, Dryland Skin a dry mantle). The label is read from whichever axis is developed, in `lineage/readings.js`. Where a trait came from and how long it has been reinforced is history, so it stays on the old fields, which are now a cache until Stage G. Play is unchanged: the Stage A baseline matches exactly, including the natural 60-day runs. Save schema 7 moves every form and proto-trait onto the body, so no creature gains or loses one. James approved it, and both ZIPs were replaced with v1.32.3 after the same package checks.

**v1.32.4, Stage F: lifestyles and generation goals are readings.** A lifestyle is now recognized from the taxon's average body, adaptations, habits, lived pressure and residence instead of its own daily score, and it stays once formed. Hunter needs a settled hunting habit plus a hunting build; Grazer needs Efficient Gut, Forager form and no hunting habit; Burrower needs a home habit. The day's hunts, meals and water travel only drive a formed lifestyle's play loop. The G2 trials are now any-order goals shown like the opening goals: Rangebreak is feed beyond the old range plus a ranging habit, Kin Gathering is gather the family at home plus a home habit. G3 shows its population goals as the same checklist. Save schema stays 7. 

**v1.32.5: terrain fix after loading a world.** When the title-screen world was swapped for a loaded or new world, the renderer kept per-tile terrain caches from the title world, so title-world land drew as flat land with a stepped bank over the loaded world's water, and the reverse showed phantom water. Every per-tile terrain cache and the habitat field are now rebuilt on the swap. Reproduced in the browser by loading a save from another world, and the same lakeside view is correct after the fix. No simulation or save change.

**v1.32.6: opening drink goal fix.** Drinking was recorded, but "Fed and watered" stayed unticked until the creature had also eaten, so a drink looked unregistered. Each half now shows as soon as it is done. Separately, the goal read the first drink from a 24-event recent history; a first is recorded only once, so after enough later events the goal could never tick again. It now reads the creature's permanent record. Reproduced in the browser on v1.32.3 with a real E press at a bank. No simulation or save change. Stage G was set aside, unchanged, while this shipped on its own.

**v1.32.7, Stage G: cleanup.** Forms and proto-traits no longer keep a cached copy on each creature; their strength exists only on the body and their history beside it, and every reader uses the body. Unused Stage F lifestyle evidence code is removed, and the simulation spec describes the consolidated model in one place. The adaptation list stays as the cache that ability checks read, and each system's effect factor stays as the input to the shared pipeline. The Stage A baseline matches exactly. Save schema 8 converts older saves with nothing gained or lost. This completes the v1.32 consolidation.

**v1.33.0: knowledge inheritance and loss.** Each lineage creature knows only the water banks, shelters and food patches it has used or been shown. A young beside its caregiver learns every place the caregiver uses, but its copy is less sure, can be a little off, and does not know how picked-over a patch was. Places are forgotten after about 16 days without a visit. What only one creature knew dies with it, with a field note. A successor is guided only to water it knows, or told to search. Autonomous creatures still find water as before, and the Stage A baseline matches exactly.

**v1.33.1: Pounce.** The first evolved ability, read from the body rather than granted: once the rear-leg tendons behind Spring Tendons are developed past 0.8, Shift+Space toward a creature in front of you crouches, leaps 2.5 to 3.5 tiles, bites on landing and recovers for longer, longest after a miss. It costs 32 breath, and without the body, the breath or a target it is the ordinary bite. Lineages with Spring Tendons keep developing their legs under predator, scarce or dry conditions, and successor cards show "Close to: Pounce". Only the creature you control pounces. The Stage A baseline matches exactly.

**v1.33.2: learned fear.** Where a Stalker attacks or kills a family creature becomes a place the family fears. The surviving victim and relatives in sight learn it, young learn it from a wary caregiver, and it fades over about 24 days. While strong it keeps autonomous family's feeding and roaming out of the zone and drops feared feeding grounds from route suggestions; walking your creature back in brings the memory up. It dies with those who hold it. Also fixed: self-learned shelters were rarely recorded in live play since v1.33.0. The Stage A baseline matches exactly. 

**v1.33.3: grazing scars.** The most heavily grazed ground (roughly the top 1% of grazed tiles) now regrows up to 40% slower until the wear fades over a few weeks; a scar never strips existing plants. A stronger first tuning collapsed Diggers in the 20-year ecology test and was rejected. With this tuning that test passes for the first time since v1.27. The Stage A baseline was regenerated on purpose: every single-factor number is identical, the natural runs show fewer deaths overall (29 to 24 and 23 to 20; the third run unchanged), and family forage range moved under 1%. The full test suite now passes.

**v1.33.4: readability pass 1.** Successor cards draw each descendant's body portrait. In AUTO the HUD says what the creature is doing now, including when fear steers it. The journal's "Places remembered" lists the water banks, food patches and shelters the creature knows and the places it fears, replacing the old lines and their "today ago" wording. Presentation only.

**v1.33.5: readability pass 2.** TAB names the relative you switch to with its habits, known places and fears, and the HUD habit line wraps instead of being cut off. The handoff reveal's opening line says what the new creature brings. Relatives near you carry a gold pip while following your Family Command and a faint ring while acting on their own. Presentation only.

**v1.33.6: readability pass 3.** In AUTO the opening goals describe what the creature does on its own and say plainly that a home needs you to take over and press N; any goal that names a key adds "take over to do this". Presentation only.

**v1.33.7: AUTO builds the first home.** James chose yes on the decision card. With AUTO on, the creature builds the family's first shelter on its own once its home range settles, the same way N would, and the Stalker grace period ends as it does for the player. Second homes stay the player's choice. The Stage A baseline was regenerated on purpose because its natural runs use AUTO: the factor matrix is identical, deaths moved 24 to 22 and 15 to 19, family forage range grew in one run, and family survival is unchanged.

**v1.34.0 (paused, never shipped): Shape and spring pass 1.** Evolution points, shaping rules and development-drawn bodies. Superseded by the Evolution Expansion GDD before release.

**v1.35.0: Evolution Expansion Phase A.** James supplied GenVo8_Evolution_Expansion_GDD_v1 and locked its section 0 decisions. The v1.34.0 work was salvaged: its ledger now feeds only the GDD's capped earned bonus (base 8 MP plus 0 to 4), its newborn nudge and spending on living creatures were removed, and its body drawing waits for Phase B with the v1.33.7 sprite restored exactly. Phase A adds the part registry (18 starter parts), the body-plan graph and the phenotype resolver as an adapter over the existing authorities. Gate met: all 113 frozen v1.33.7 creatures migrate with identical adaptations, effects, Pounce and water results, same-seed natural runs match v1.33.7 exactly, and nothing visible changes.

**v1.36.0: Evolution Expansion Phase B.** James chose code-drawn pixel parts in the current style. Every starter part now has its own component, and bodies are assembled from their plan in eight facings. Existing creatures draw exactly as before (all 113 fixture creatures checked frame by frame) except a new heel tendon on Spring Tendons legs. A body built from every new part stays connected while walking and pouncing in the browser, and 560 animals hold a 16.7 ms frame. The paddle tail and jaws are still subtle at normal zoom.

**v1.37.0: Evolution Expansion Phase C, the creature editor.** James chose: the editor opens at mating when a litter is on the way, from Generation 2; the six parts with no ability yet are shown locked until Phase D; committed parts work right away where an ability exists. A draft of the next generation's body starts from the active creature, costs mutation points against the 8 MP plus earned bonus, explains prerequisites, and previews gains, losses and measured numbers. Committing attaches the design to the expecting mother and shapes only that litter. Cancelling spends nothing. Gate met in the real browser: a Generation 2 mating opens the editor, edits and commit work, the litter is born with the design and its abilities, save and reload give the same litter, no UI is clipped or overlapping at 1280, 820 and 390 pixels wide, and the v1.33.7 fixture saves still open unchanged.

**v1.38.0: Evolution Expansion Phase D, body-derived abilities.** James approved one ability and one cost for each of the six locked parts (digging forelimb, claw, venom gland, wide-field eye, reinforced torso, paddle tail), with no new keys. Abilities come only from a designed body plan and apply equally to the active creature, its family and wild creatures; bodies without designed plans are unchanged and the v1.33.7 baseline still matches. Gate met in the real browser: in the same lean-ground Stalker charge, a spring-legged runner escapes untouched, an armored digger braces, takes less than a plain body and then digs roots, and a venom-and-wide-eye body drives the Stalker off poisoned; a plain body cannot dig or poison. Wording change from the approved plan: hiding was already instant, so the digging forelimb makes hiding need less plant cover rather than making it faster.

**v1.39.0: a new start and wave 1 parts.** James's decisions: eight parts per family to start (Rule of 8, not the limit); body shapes and slot counts differ, bigger bodies carry more parts at a higher cost; leg count sets speed; new creatures start with very few parts and the old body is mid-developed; a small founder body with four legs, a grazing mouth and two simple eyes at the original speed; wild GenVo8s start the same and evolve; saves start fresh. 22 parts were added (40 in all) with code-drawn art. Newborns inherit a parent's body with occasional reachable mutation, and expressed traits become visible parts. Balance: food upkeep follows the body's total part upkeep, and parts that had no cost were given one, after evolving GenVo8s crowded out Diggers in the 20-year ecology test; that test passes again. Existing creature drawings without plans are pixel-identical to v1.38.0. The consolidation baseline was regenerated on purpose: family results over 60 days are unchanged except world deaths (22 to 21, 19 to 17, 20 to 23).

**v1.40.0: 32-pixel creatures, wider view.** James chose option B: a wider view with smaller, crisper creatures. A shared pixel-art helper draws creature and plant geometry on a 32-grid (half the 16-grid unit); the GenVo8 mantle is shaped at that resolution with a one-pixel outline, and feelers are one pixel. Gameplay zoom changed from 3 to 2. Terrain tiles are unchanged 16-pixel art. Simulation is unchanged.

**v1.41.0: 32-pixel world.** James asked for the ground and world art to match. Cached terrain tiles hold 32 art pixels per tile; the water mask is traced at 32 samples per edge and the habitat mask at 16; water is coloured per art pixel by its smoothed depth with reach tones blended between tiles; riverbank shading and the depth undercut follow the shoreline instead of tile edges; open ground has single-pixel grain; plants and seedlings are offset within their tiles. Presentation only.

**v1.42.0: wave 2 parts.** James asked to proceed with the recommended next step. Tails, backs, flanks and spurs now have eight parts each (24 new, 64 in all), each a small set of modifiers on existing effects plus three new hooks: hunters may recoil from a club tail or spine cluster, some parts make the active creature easier for Stalkers to spot, and gill slits improve swimming for bodies that can swim. Spur effects stack per leg up to four. Code-drawn 32-pixel art. The 20-year ecology test passes; the consolidation baseline was regenerated (one natural run: world deaths 23 to 21).

**v1.43.0: Phase G first slice, encounters and content.** James approved places to discover, a field guide and trials. Places are generated from the world seed on suitable habitat (none at water edges except still pools), one of each kind near the start; carcasses appear every 12 days near the active creature. Seen wild parts cost 1 MP less in the editor; trials and discoveries feed the existing capped earned bonus. The 20-year ecology test passes; the consolidation baseline was regenerated (one natural run: world deaths 17 to 19).

**v1.44.0: living wildlife step 1 and special creatures.** James approved modular, evolving wildlife and relic-dropping special creatures. Stalkers carry a four-slot body that adjusts their temperament profile, chase speed, stamina, sight, stealth, damage, toughness, spines, venom, knockback and upkeep; births inherit with a 25% chance of one slot changing. The Elder Stalker appears every 25 days without one and drops a relic on death that unlocks the horn crest and tusk jaw (relic parts never come from mutation). The 20-year ecology test passes; the consolidation baseline was regenerated (world deaths only). Hoppers and Diggers follow.

**v1.45.0: wildlife built from the player's parts.** James clarified the intent: Spore-like parts with multiple core bodies, with predators and prey built from the same parts the player uses. The v1.44.0 Stalker slot system was replaced: Stalkers, Hoppers and Diggers carry body plans from the shared registry (sleek, light and stout torsos), are drawn by the modular body drawer in their species colours and scale, and inherit and mutate with the GenVo8 mutation. Part effects for wild species are measured relative to their starting body, so starting bodies play like the old creatures; legacy-mapped parts (armor plates, spring legs, jaws, storage sacs, barbs, graspers) act directly on wild bodies. The 20-year ecology test passes; extra seeds stay healthy; the consolidation baseline was regenerated (world deaths only).

**v1.46.0: three more special creatures and six relic parts.** Following James's direction that special creatures drop parts that are otherwise unobtainable, the Golden Hopper, Crystal Digger and Ghost GenVo8 join the Elder Stalker. Each carries two exclusive parts (gliding membrane and luminous tail; shell back and armored hide; glow eye and echo crest), which act through the existing part effects, and drops a relic that unlocks them. The Ghost GenVo8 fades after 30 days, because the player cannot hunt a GenVo8. Special creatures' young do not inherit relic parts. The special-creature timer now uses the simulation's running day count, which never resets. Natural runs are unchanged apart from world deaths; the baseline was regenerated.

**v1.47.0: creature art redo, first pass.** After the species work, James chose the art redo. Creatures stay code-drawn (his earlier decision). `drawGenvoSprite` now draws to a scratch canvas and composites a one-art-pixel outline (the palette's shade, darkened) round the silhouette; contexts without `drawImage` (tests, exporters) get the plain drawing. Each body has a head at its front edge (size 0.62 of the body's smaller side, at least 3.4 units) in a body-to-light blend, and the face is moved onto it. Upper legs are 1.5 units thick, with a foot pad. Frame times in the browser probe are unchanged.

**v1.48.0: creature art redo, second pass.** James chose to keep going on code-drawn creatures. In `render/genvo.js`, designed-body leg angles are pulled towards the sides (`splayAngle`, factor 0.72, with straight front and rear slots unchanged), the base leg reach is 6.7 (was 7.15), the knee sits 0.9 units higher (more when lifted), a lifted foot folds 40% of the way to the knee, and a planted foot sits 0.35 lower. In `render/genvo-draw.js`, bodies have three tones and wild species have their own back markings. Drawing only; frame times unchanged.

**v1.49.0: parts at play size.** James chose part clarity and the wide-body leg fix. `backTop` moved from 0.34 to 0.46 of the body height, so back parts sit on the silhouette edge; sail fin, spine ridge, water hump, display frill, moss back, sensory quills, signal crest and echo crest were redrawn larger; armor plate on the back socket (previously drawn with no side and so invisible) now has a back plate; hunter, tracker and compound eyes and eyespots were enlarged; beak, nibbler and filter mouths were redrawn. In `genvoVisualPose`, a designed-body foot is pushed out to at least the body edge plus 3 units (scaled by limb size), with the knee following by 60%. Drawing only; frame times unchanged (interleaved A/B against v1.48.0).

**v1.50.0: world art pass, plants.** James chose the world art pass. `Renderer.vegetationLayer` draws a tile's vegetation once into a padded layer (9 units each side): full plants with a dark outline (rgba(16,28,18,.78)), seedlings and traces without. Terrain chunks draw ground tiles without plants, then the vegetation layers of the chunk and its surrounding ring, so plants overlap neighbouring tiles without clipping. In `flora.js`, plant offsets combine per-tile jitter with a 0.4 pull (0.2 for reeds) towards a clump centre shared by each 2x2 block. Cached per tile and plant state; frame times unchanged (interleaved A/B against v1.49.0).

**v1.51.0: world art pass, ground and places.** Following the v1.50.0 report (James: "proceed"). The scatter of specks on open ground was seedlings (one per tile wherever a seed-limited plant had seed bank or a small sprout). `drawSeedling` now shows a seedling only inside noise patches (smoothNoise2 cell 4.5 > 0.52, plus a 75% hash), unless it is at least 0.9 of its plant's render threshold. Faint moss traces are gated the same way. `sites.js` draws each place kind once per zoom into a cached sprite with a dark outline. Water was left as it is: its depth bands and bank highlights already read well. Frame times unchanged (interleaved A/B against v1.50.0).

**v1.52.0: seasons.** Following the v1.51.0 report (James: "proceed"), the world and creatures were checked in all four seasons. Summer barely differed from spring, and winter plants turned dark and murky against dull ground. Summer ground: hue -14, lightness +3 (was -5, +1). Winter ground: hue +16, saturation -15, lightness +5 (was +7, -10, -1). Winter plant base: lightness +4 (was -4), saturation -14 (was -18). Winter vegetation layers add a frost line: plant pixels with no plant pixel above them, in pale blue-white at 72%. Built at cache time; frame times unchanged (interleaved A/B against v1.51.0).

**v1.53.0: drag-and-attach editor and readable menus.** James asked for a Spore-like editor with parts dragged onto the creature, menus that do not look system-like, and menus that show all their text. Part tiles were then required to show isolated part art only (James, 2026-10-10).

- **Editor (`src/ui/creature-editor.js`):** rewritten on the unchanged draft rules (place, remove, cost, prerequisites, viability). `genvoAnchors` in `render/genvo-draw.js` gives each socket's drawn position for the current facing. `isolatedPart` cuts each part's art from a reference body drawn with and without the part.
- **Mouth line:** it now belongs to the mouth part. A designed body with no mouth part draws none.
- **Field guide:** rewritten with drawn creatures and places, on four pages.
- **Text sizes:** CSS sizes of 7 to 11 pixels were raised (7 and 8 to 11, 9 and 10 to 12, 11 to 13).
- **Info panels:** detail panels fit the viewport and scroll.
- **Housekeeping:** trial text now says "wild creatures".

The project's art-direction rules (no linear gradients, no rounded corners) still hold.

**v1.54.0: bodies own their sockets, parts own their art.** Following James's architecture rule (2026-10-10, "proceed"): the body owns attachment locations, and each part owns its shape, articulation, colours and animation. Sockets are editor indicators only; parts overlap the body without seams; sockets follow the rotating body. The coordinator's default on James's open question was used: sockets are fixed per body and players cannot move them.

- **Socket places:** `part-registry.js` lets a torso give each socket an `at` place (f along the facing, s across, u height). The round founder body (`small-torso`) uses `ROUND_LAYOUT`.
- **One resolver:** `render/socket-layout.js` turns places into drawing positions for any facing. The renderer (hips, face, back, sides, tail) and the editor's `genvoAnchors` both use it.
- **Legs:** each leg part draws its own limb (`drawLimb`, `LIMB_ART` overrides, the standard limb otherwise).
- **Notices:** field guide notices are batched per creature.
- **Tests:** `tests/socket-layout.mjs` covers authored places, rotation, editor sockets matching the body's places, parts swapping between compatible sockets, every leg drawing its limb, and the world renderer never drawing sockets.

**v1.55.0: performance and a leaner build.** James asked to optimize performance and streamline the build. A 30-second CPU profile of 4x AUTO play found where the time went:

| Cost | Share of CPU |
|---|---|
| `Simulation.player()` linear search and its callback | about 6% |
| `visualCompositionAt` building string cache keys | 3.2% |

The fixes:

- `player()` remembers the active creature until the controlled id changes or it dies.
- Composition keys are numbers.
- A per-frame tile bucket for foreground displacement was tried and reverted, because its allocations added garbage-collector pauses.
- The idle share of the profile rose from 23.5% to about 33%.
- The few remaining slow frames are browser and garbage-collector work; alternating 2-minute runs show the same count as v1.54.0, within noise.
- The consolidation baseline is unchanged.
- The itch build leaves out `assets/spritesheets`, which only the toolkit's export tool uses.

**v1.56.0: audio pass.** James asked to improve the audio before compressing it.

- **Generator:** `tools/generate_audio_assets.py` was rewritten. It still uses only numpy and stays deterministic.
  - Instruments: mallet and kalimba modal synthesis, Karplus-Strong string, detuned saw pads, breath flute, pitched drums.
  - Formant voice synthesis for the creatures.
  - Hand-written biquad and one-pole filters.
  - FFT convolution reverb, circular for loops.
  - Loop events wrap modulo the loop length.
  - The format is unchanged (mono, 22050 Hz, 16-bit PCM), with the same 32 files and the same level bounds.
- **QA:**
  - Loop seams are below the 99th-percentile sample step.
  - There is no DC offset.
  - The wetland bed was darkened after its high-band energy measured 12.6%.
- **Live music:**
  - `model.js` seasonal roots are now 110, 146.83, 82.41 and 73.42 Hz. All of them keep the motif diatonic to A minor, the key of the beds.
  - `audio.js` theme notes gain a short 3.93x overtone and a struck envelope.

**v1.57.0: the editor from the first litter, real bodies, big-screen speed.** James reported "it is still using the old methods, not going into the creature editor, its providing fixed creatures, and there is still a heavy fps issue".

- **Causes:**
  - The editor was gated to Generation 2+ (a 2026-10-09 decision).
  - Handoff, journal and successor portraits were drawn from genes with no body plan, which shows the legacy fixed body.
  - At large window sizes, `displacementForTile` scanned every visible animal for every foreground tile, and every creature redrew with its outline pass each frame.
- **Fixes:**
  - The gate was removed.
  - Lineage records store the serialized body plan, and all portraits draw it.
  - Handoff chips lead with part changes.
  - Animals are linked into a reused typed-array tile grid, with no per-frame allocation.
  - Finished non-player creature sprites are cached by look (plan, colour, facing, animation frame, action and state).
  - An FPS counter was added (backquote key).
- **Measured** (headless Chromium, 20 s AUTO play): 1280x720 59.6 FPS (unchanged), 1920x1080 45.8 to 57.7, 2560x1440 25.5 to 44.9.

**v1.57.1: the editor cannot be skipped.** James: "ensure the editor cant be skipped from auto mode".

- **Pregnancy path:** there is only one (`Simulation.tryMate`). It always calls `reproduction.onMated`, and so the editor offer, for manual and autonomous play alike.
- **Browser check:** an AUTO 4x session opened the editor on day 5 for the founder and paused the game.
- **Test:** `tests/evolution-editor.mjs` now asserts that an autonomous mating creates the offer.
- **Escape:** it no longer cancels the editor; cancelling takes the explicit button.

**v1.57.2: smoother in wide windows.** James measured 12 FPS with a 174 ms slowest frame at 1596x760, against 65 FPS at 795x760. The new per-part counter showed terrain chunk rebuilds averaging 11 ms per frame, with spikes of 190 ms or more.

- **Cause:** the habitat field refresh cleared the land, ground and chunk caches every simulated day, which is about 6 s at 1x and 1.5 s at 4x. Wide windows were therefore repainting all visible terrain almost continuously.
- **Refresh:** it now happens at most every 20 s or at a season change. Live tiles near the active creature are unchanged.
- **Sprite cache:** finished creature sprites are stored in up to three 2048 px atlas canvases per sprite size.
- **Performance mode:** skips the foreground fringe, scene foreground, depth foreground and weather overlay.

Headless measurements:

| Window | Before | After | Slowest frame | Builds per frame |
|---|---|---|---|---|
| 1596x760 | 55.7 FPS | 59.8 FPS | 190 ms to 32 ms | 11.2 ms to 2.5 ms |
| 1920x1080 | 45.9 FPS | 54.4 FPS | | |
| 2560x1440 | | 44 FPS | | creatures now the largest cost |

8x8 chunks were tried and reverted, because each rebuild got larger.

**v1.57.3: creatures draw fast on graphics cards.** James's counter at 1920x1080 read "24 FPS, slowest 157 ms, performance mode; creatures 35.4 ms". Chromium with SwiftShader GL and accelerated 2D canvas reproduced it: creatures took 34 to 44 ms, and `drawImage` was 56% of CPU time.

- **Cause:** creatures were drawn into small GPU-backed scratch canvases and then copied. Each copy of a freshly painted GPU canvas forces a pipeline flush, several times per redrawn creature. The v1.57.2 atlas added the same stall, because it wrote to a texture that was drawn from in the same frame.
- **Fixes:**
  - The scratch canvases use `willReadFrequently` (CPU canvases).
  - Finished sprites are cached as ImageBitmaps (falling back to a CPU canvas until the bitmap is ready).
  - `makeCanvas` prefers document canvases to OffscreenCanvas.
- **Measured:**
  - GPU emulation: creatures 2.6 ms per frame; `drawImage` 4.8% of CPU, down from 56%.
  - Software path: 1596x760 59.9 FPS (slowest 26 ms); 1920x1080 58.9 FPS.

**v1.58.0: compressed audio.** James approved the v1.56.0 audio, then compression.

- **Files:** WAV masters moved to `assets/audio-source/`. The generator encodes each master with ffmpeg: libopus 48 kbit/s in Ogg, and AAC 64 kbit/s in M4A. The shipped pack is 1,383,031 bytes, down from 4,145,040.
- **Assets:** `assets.js` lists `urls:[ogg, m4a]`, and loops carry `seconds`.
- **Loader:** `AudioDirector` tries the formats in order. When a decoded loop is longer than its length (AAC end padding of 616 to 820 samples measured), it sets `loopEnd`.
- **Measured:** decoded Opus loops match their masters sample for sample in length, with no lead offset and seams within normal sample steps.
- **Browser:** all 32 sounds decode from Opus, and all 32 from AAC with Opus blocked.
- **Build:** the itch build leaves out the masters.

**v1.59.0: animation pass.** James's review (2026-10-10) listed five findings. All were confirmed in the code:

1. Wild creatures used `Math.floor(phase)` (a sprite-cache trade-off made in v1.57.0).
2. The editor walk preview stepped every 90 ms.
3. `LIMB_ART` was empty.
4. Limbs were drawn before the body.
5. Only the round body had authored sockets (deferred, as asked).

Fixes:

- **Quarter-frame phases:** moving cached creatures use quarter-frame phases (`cachePhase`); the sprite cache holds 2,400 entries.
- **Gait per leg type:** `LEG_GAIT` (stride and lift) per leg type flows through the assembler into `genvoVisualPose`.
- **Limb art:** `LIMB_ART` gives runner, sturdy, spring, webbed, padded and digging limbs their own articulation; the old spring heel overlay was retired.
- **Leg layering:** near-side legs (lower on screen) are drawn after the torso.
- **Turning:** `Renderer.easedDir` turns a creature's drawn facing one 45-degree step every 70 ms, the short way round.
- **Editor preview:** it runs on requestAnimationFrame with fractional frames.

New test: `tests/animation.mjs`.

Frame cost: creatures went from 1.5 to 2.1 ms per frame on the software path, and from 2.6 to 5.3 ms under GPU emulation, at 1920x1080. FPS is unchanged (58.9).

**v1.60.0: editor pass.** This follows James's review of 2026-10-10 (pass 2). All three findings were confirmed in the code:

1. The big counter was clamped at zero (`Math.max(0,left)`).
2. The preview was a fixed 440x360 canvas with no zoom.
3. Part tiles were cut from a reference body drawn with and without the part (a pixel diff).

Fixes:

- **Counter:** it shows the signed balance. `CreatureEditor.costSteps()` walks the undo history from the base and gives each step its cost. A step is marked over budget once the running total passes the budget.
- **Stage:** the canvas is now 560x460 (scale 18). Zoom runs from 0.6 to 1.75 with buttons and the mouse wheel, and `stageGeom` centres it on the body.
- **Tiles:** `drawPartAlone` in part-sprites draws any attachable part on its own. The basic eye and grazing mouth moved into part-sprites `DRAW`. `isolatedPart` outlines and crops that drawing. Bodies are still drawn as a body with nothing attached.

New test: `tests/editor-pass.mjs`.

**v1.60.2:** These fixes follow up James's review notes (2026-10-10).

- **Turn state:** `Renderer.resetWorldCaches` now clears `turnState`. It runs on every world change. Creature ids are reused across worlds, so a stale facing could carry over before.
- **Editor between 761 and 1100 px:** the grid rows were `auto` and the stage wrapper had `min-height:0`, so the stage row collapsed and the tray drew over it. The rows are now `max-content`, and the stage is sticky and capped at 52vh.
- **Editor at 760 px and below:** the stage is sticky and capped at 40vh, tiles have a `scroll-margin-top`, and editor buttons have `user-select:none`.

Live touch checks, run at 360x640, 390x844, 768x1024 and 1024x768: tap-then-tap attach, drag attach, zoom, and Evolve all pass.

**v1.60.1:** What changes skipped parts whose text comes from the adaptation table (for example the armor plate and the tearing jaw). It now uses the same `partText` lookup as the part card.

## Test results for v1.32.2

- At v1.32.2 the full test suite passed except `tests/ecology-stability.mjs`, which failed the same way on an untouched copy of v1.27 (a Hopper count of 15 against a minimum of 16). Since v1.33.3 that test passes too.
- The Stage A baseline matches exactly after Stages B and D. Stage C changed only the three stacked rows, on purpose.
- In the real browser, the Stalker decision probe passes all five cases (flee, hide, fight and brace succeed; Shift+E dies), the 4x observer probe with 560 animals holds a 16.7 ms median frame with no frames over 50 ms, and there are no console errors.
- Headless simulation speed is unchanged (about 266 to 272 ms median against 279 ms for v1.27).

## Next step

Consolidation continues with Stage E (forms and proto-traits become anatomy readings) and Stage F (lifestyles and specialization become readings), then Stage G cleanup. After that, the continuation order is knowledge inheritance and loss, one evolved active ability (probably Pounce), ecological consequences, and more playtesting passes. Each stage still waits for James's go-ahead before the ZIPs are replaced.
