> Canonical testing/variation update (2026-10-12): `EMERGENT_EVOLUTION_AND_TEST_POLICY.md` supersedes universal end-state expectations from older simulation experiments. Structural and causal rules remain binding; extinction, migration and unstable ecosystems may be valid results.

# GenVo8 Simulation Spec — v0.89.0

## Rule of 8 design constitution
Eight is a structural language, not a content ceiling.

Retained anchors:
- 8 responsive player/input updates per second.
- 8 ecology/lifecycle steps per simulated day, distributed across a slower 48-tick day for readable real-time pacing.
- 8 ordered simulation phases.
- 8 directional movement states.
- 8-frame authored animation convention for animations that exist.
- 8-day seasons.
- 8 top-level genetic families.
- Generation 8 is the first major lineage milestone, not an end-state.

Not capped at eight: species, organism families, plants, resources, diseases, behaviors/actions, memories, traits within a gene family, habitats, biomes or generations.

### Shoreline water teaching
GenVo8 cannot enter open-water tiles. Drinking and juvenile water teaching occur from canonical dry drinkable shoreline tiles. The teaching objective must describe reaching the bank and drinking, never traversing water.



### Marsh fever recovery and temporary immunity
The canonical disease authority remains responsible for infection, transmission, fever duration, contaminated ground, recovery, and the 24-day acquired-immunity window. Player/family controllers may react to those states but may not alter exposure rolls or create parallel disease state.

A recently recovered founder-line adult can be preferred for close care of a sick dependent because `DiseaseController.isImmune()` already prevents reinfection during the canonical immunity window. Susceptible relatives continue to keep space. A recovered immune adult may also remain near a sick adult while susceptible family distance. This is behavioral awareness of existing immunity, not a new resistance bonus. Close-care interactions can reassure/tend young but never remove the infection.

Fever-break presentation distinguishes short convalescence from longer temporary immunity. No immunity meter is added to simulation state beyond the existing `immuneUntilDay`, and all immunity-aware family decisions are deterministic and inactive in `player:false`.



### v1.32 evolution consolidation contract

This section supersedes earlier statements about where adaptations, forms, proto-traits and lifestyles are stored or how they are recognized.

- **Canonical inherited state.** A founder-line GenVo8 carries genes (eight values), anatomy (continuous body axes, 0 to 1) and habits (five learned values). Anatomy holds the twelve Stage D body parts plus the form axes (`reach`, `compact`) and one axis per proto-trait. Lived pressure uses one vocabulary (`lineage/pressure.js`): scarcity, competition, predation, crowding, dryness, wetness, heat, cold, disease, few mates.
- **Adaptations are expressions of anatomy.** An adaptation is expressed when its body part crosses a threshold; a tier 2 adaptation is the same part developed further. `animal.adaptations` is the cache of what anatomy expresses and is what ability checks read; it must always equal `expressedAdaptations(animal.anatomy)` for founder-line animals. Rendering cannot grant or remove one.
- **Forms and proto-traits are readings.** Their strength lives only on anatomy and their label is read from the most developed axis (`lineage/readings.js`). Non-anatomical history (generation, origin population, reinforcement depth, gene flow) lives on `formHistory` and `protoHistory`. There are no `lineageForm` or `populationTrait` fields on live animals; saves before schema 8 convert them.
- **One effect pipeline.** Travel, forage range, threat sense, shelter exposure, metabolism and water use from lineage biology combine once in `lineage/effects.js` under one limit per effect. Each system supplies its own factor.
- **Lifestyles are readings.** A lifestyle is recognized from the taxon's adult averages of anatomy, expressed adaptations and habits, plus lived population pressure and residence. It keeps no score of its own. Daily travel, meal and hunt counts only drive the play loop of a lifestyle that has formed, and a formed lifestyle stays. Recognition consumes no RNG.
- **Strategy branch** (stealth, offense, social, utility) is a reading of expressed adaptations.
- **Generation goals.** The G2 trials are any-order goals read from state (one lived event plus the habit the inherited form implies); G3 population goals use the same checklist presentation. Rewards are unchanged.
- **Wild populations** keep their own inheritance and behavior.
- **Saves.** Schema 8. Every older schema migrates in place with no creature gaining or losing an adaptation, form or proto-trait.

### v1.33 knowledge contract

- Known places belong to individual lineage creatures: water banks and shelters in cognition (`knownPlaces`), food in forage patches. Each has a sureness that falls linearly to zero over 16 days without a revisit; at zero it is forgotten.
- A place is learned by use, or taught during the existing caregiver lessons. Taught copies start at 0.6 sureness, may be offset deterministically by up to 1.4 tiles (water snaps to the nearest drinkable spot), and a taught food patch does not copy depletion, season or competition history. Teaching consumes no RNG.
- On death, places no living lineage relative knows are lost, with one field note per death.
- Player guidance outside the founder's opening points only to water the active creature knows, or water within its 6-tile sensing range. Autonomous navigation is unchanged.

### v1.33.1 body ability contract (Pounce)

- Body abilities are read from anatomy, not stored as adaptations. Pounce requires the `spring` axis at 0.8 or more (and Spring Tendons expressed for further growth). Reach is 2.5 tiles at 0.8 rising to 3.5 at 1.0.
- Pounce is the active creature's Shift+Space attack toward a hunter or edible creature in front (facing dot 0.5 or more, at least 1.7 tiles away). It shares the attack action: crouch 0.30 s with no movement, leap 0.22 s that stops at the first tile the creature cannot occupy, then the normal strike resolution (damage scale 1.35 on a Stalker, +0.25 kill chance on prey), then recovery 0.62 s, or 0.95 s after a miss. Cost 32 breath; winded or short of breath falls back to the ordinary bite.
- Autonomous creatures do not pounce. Heredity growth toward Pounce consumes no RNG.

### v1.33.2 learned fear contract

- A danger place is a known place of type `danger`, created when a hunter's hit lands on a lineage GenVo8: the surviving victim at sureness 1, lineage relatives within 8 tiles at 0.85 (witnessed), and young at 0.6 when their caregiver is within 6 tiles of a place it fears. Danger sureness falls to zero over 24 days.
- While sureness is 0.25 or more, autonomous lineage creatures with an elective intent (feed, explore, tendency roam or gather, stealth forage, migrate, aquatic range, group, graze) whose target lies within 4 tiles of the place are re-targeted to just outside it. Survival intents and the manually controlled creature are never steered. No RNG is consumed.
- Route suggestions omit feared patches. The active creature receives one note per place per day on re-entering within 3 tiles.

### v1.33.3 grazing scar contract

- `EnvironmentalHistoryController` is no longer read-only: `scarAt(i)` = min(1, (grazing - 0.6) / 1.0) x 0.4 for grazing wear above 0.6, else 0.
- During daily vegetation growth, a positive regrowth step on a scarred tile is multiplied by (1 - scar). Decline, dispersal and seed banks are unaffected, and a scar never removes standing biomass. Grazing wear still decays by 4.5% a day, so scars heal without further grazing.

### v1.54.0 socket contract

- A torso socket may carry `at:{f,s,u}`. Drawing position = body centre + forward x f x (body radius along the facing) + side x s x (body radius across it), raised by u x half the body height. Sockets are fixed per body. Bodies without `at` use the computed positions from v1.53.0. Socket positions affect drawing and the editor only; abilities come from parts as before.

### v1.53.0 editor contract

- The editor edits only the draft, through `place`, `remove`, `replaceRoot`, `undo`, `redo` and `revert`. With "both sides" on, a placement or removal also applies to the mirror socket (`mirrorSocket`; a spur mirrors to the mirrored leg), recorded as one undo step. Commit and cancel go through `evolutionEditor` as before.
- `genvoAnchors({animal, phenotype, pose})` returns `{key: 'parent|socket', parent, socket, type, x, y}` per socket in drawing units. Empty limb sockets get the point a leg there would reach.

### v1.52.0 season art contract

- Presentation only. Season colour shifts live in `terrainColor` (ground) and `seasonalBase` (plants); winter vegetation layers add a top-edge frost line. Seasons, climate and growth are unchanged.

### v1.51.0 world art contract

- Presentation only. Seedlings below 0.9 of their render threshold draw only where smoothNoise2(x, y, 4.5, 709) > 0.52 and hash2(x, y, 711) > 0.25; seed banks, growth and foraging are unchanged. Place sprites are cached per kind, zoom and found state.

### v1.50.0 world art contract

- Presentation only. Vegetation is drawn into a cached padded layer per tile (key: tile, plant visual signature, trace alpha, season) and composited in a second pass per terrain chunk, including the one-tile ring around it. Plant positions may move up to about half a tile from their tile; simulation positions, food and foraging are unchanged.

### v1.49.0 creature art contract

- Presentation only. Back parts anchor at `backTop` = body centre minus max(2, 0.46 x body height). Designed-body feet reach at least edge + 3 x max(0.8, limbScale) along the leg direction.

### v1.48.0 creature art contract

- Presentation only. `genvoVisualPose`: `splayAngle` maps a designed leg slot angle u (from the facing, per side) to pi/2 + (u - pi/2) * 0.72; reach base 6.7; knee raised 0.9 + 0.6 x lift; lifted feet fold 0.4 x lift towards the knee; planted feet +0.35. `drawGenvoBody`: body rows below 0.2 of the body height use a 45% body-to-shade mix; `drawSpeciesPattern` adds needlejaw bands, mosskip dapples and rootling saddle marks.

### v1.47.0 creature art contract

- Presentation only: `render/genvo-draw.js` `drawGenvoSprite` composites the creature drawing (`drawGenvoBody`) with a 4-neighbour outline one art pixel wide in `outlineColor(palette)` (shade x 0.34 + 6), using a 44-unit square scratch canvas; it falls back to direct drawing when the context has no `drawImage`. No simulation state, RNG or ability depends on drawing.
- The head is centred at 0.8 of the body's edge distance along the facing plus 0.36 of the head size; face offsets (eyes, mouth, mouth parts) move forward with it.

### v1.46.0 special creature contract

- `SPECIAL_KINDS` in `organisms/wild-bodies.js`: elder-stalker (needlejaw; horn-crest, tusk-jaw; first day 20, every 25), golden-hopper (mosskip; gliding-membrane, luminous-tail; 28, 30), crystal-digger (rootling; shell-back, armored-hide; 36, 30), ghost-genvo (genvo; glow-eye, echo-crest; 44, 35; fades after 30 days). Days are `sim.day`, which never resets.
- `DiscoveryController.maybeElder` (once a day): for each kind past its first day and its interval, if none of that kind is alive, the oldest adult of the species that is neither the player nor family becomes one (`animal.elder={kind,label,parts,since}`), and `withRelicParts` puts the parts on their sockets (eyes and flanks on both sides). Death through `kill` drops a relic site; `collectRelic` unlocks the parts.
- Relic part effects (wave 2 keys; damageTaken is now a wave 2 key): gliding membrane sprint 1.1, land 1.03, metabolism 1.04; luminous tail courtship 0.45, hunt +0.04, visibility 1.15; shell back rear damage 0.55, sprint 0.94, metabolism 1.03; armored hide damage taken 0.8, repel +0.12, sprint 0.97, metabolism 1.04; echo crest threat sense 1.3, metabolism 1.03; glow eye forage 1.3, cue 1.4, threat sense 1.1, metabolism 1.03.
- `inheritBody`: when the chosen parent is special, `withoutRelicParts` restores the species' (or founder's) part on each relic socket before mutation.

### v1.45.0 wildlife body contract

- `organisms/wild-bodies.js`: starting plans for needlejaw (sleek torso), mosskip (light torso) and rootling (stout torso), built from registry parts. Wild animals spawned without parents receive their species plan; newborns take one parent's plan and mutate with `mutatePlan` (probability 0.25), without changing anatomy.
- `partEffectFactors` for wild species applies legacy-mapped parts directly (armor plate 0.74 damage and 0.95 sprint, spring leg 1.14 sprint and 1.03 metabolism, tearing jaw 1.62 and crushing jaw 1.70 strike, storage sac 0.72 water, barb +0.25 recoil, grasper 1.5 carry), then divides by the species' starting-plan factors (additive values subtract; abilities the starting body has are not new). `wildTraits` derives chase speed (land speed), stamina, sight (threat sense), stealth (quiet, visibility), player-bite damage taken (damage taken), strike damage, knockback (brace) and spines (spiny parts beyond the start, 1.5 each) for Stalker pursuit and combat.
- Rendering: wild animals with a plan are drawn by `drawGenvoSprite` at species scale (Stalker 1.22, Hopper 0.86, Digger 0.96); the Elder Stalker in gold, carrying horn-crest and tusk-jaw on its plan.

### v1.44.0 wildlife and relic contract

- `organisms/wild-bodies.js`: Stalker body slots legs (base, sprinter, ambush, heavy), jaw (base, crushing, venom, gape), hide (base, armored, spined, mottled), eyes (base, keen, tracker). Traits fold into `stalkerProfileFor` (stalk and charge speed, wind-up, recovery, trigger and breakaway range, look), the chase speed, starting stamina, sight, prey threat detection (stealth), tryKill damage and hunt chance, player-bite toughness and spines (0.8 health per spine to the biter), venom (poison, 10-second cooldown), knockback and metabolism. A Stalker newborn takes one parent's body and with probability 0.25 changes one slot (simulation RNG). A missing body is the base body.
- Relics: every 25 days from day 20 with no living elder, the oldest adult Stalker becomes an Elder Stalker (gold accent, 1.15 body length, 0.8 player-bite damage). Any death of an elder leaves a relic site; E takes it and unlocks its parts (horn-crest, tusk-jaw). Parts tagged exclusive are excluded from mutation and need an unlock (or lineage ancestry) to be placed in the editor.

### v1.43.0 discovery contract

- `gameplay/discovery.js` (saved controller key `discovery`). Sites: root-mound 6, pod-grove 6, still-pool 6, hollow-log 8, thorn-brake 5, lookout 5, nest-ruin 6, placed by a seed hash (no simulation RNG) when the active creature exists; one of each within about 24 tiles of it. A carcass (2.2 carrion on its tile, 0.6 on neighbours) appears every 12 days from day 6, 10 to 22 tiles from the active creature, and lures the nearest idle Stalker within 18 tiles once when the active creature comes within 3 tiles (not during the opening grace).
- Effects: pod grove food x1.3 for seed pods; carcass carrion x1.3 for meat-eating mouths; still pool drinking +8 energy (+16 with a filter mouth); hollow log hiding without camouflage or cover, and concealed while hidden; thorn brake ends a Stalker pursuit and scratches unarmored family members 0.5 health a second; lookout reveals sites within 22 tiles (x threat sense) and all Stalkers for 20 seconds; nest ruin gives up to 3 units of carried material, used first by shelter building; root mound lets a digger dig without the patch timer for 3x energy, 5 digs then 10 days to recover.
- Field guide: wild GenVo8 parts within 8 tiles (x threat sense) are recorded every 2 seconds; editor cost of a recorded part is its cost minus 1 (minimum 1). Trials (outrun, eat4, lookout, discover3, raise, spot5) and discoveries add to the evolution budget ledger (trial 3, discovery 1 with a daily cap of 3).

### v1.42.0 wave 2 contract

- `WAVE2` in `lineage/part-abilities.js` lists each tail, back, flank and spur part's modifiers (sprint, land, metabolism, water use, rear damage, brace, threat sense, carry, strike, hunt bonus, courtship, visibility, cover, recoil, swim speed and energy). Tail, back and flank parts count once; spurs count per leg up to four. Recoil is capped at 0.45.
- tryKill: when a hunter's hit leaves a prey with recoil alive, the hunter breaks off for 3 seconds with that probability (simulation RNG, consumed only for bodies with recoil parts). Stalker sight on the active creature is multiplied by visibility; swim speed and energy by the gill-slit factors when the body can swim.

### v1.41.0 world presentation contract

- Terrain caches (static land, land base, water base and 4x4 chunks) are 32 art pixels per tile, painted on a 2x-scaled context. LANDFORM_RESOLUTION is 32 and HABITAT_RESOLUTION 16. The water mask stores the smoothed water score per sample (`mask.depth`, 0 to 255); water bands are deep (232 and above), base (176), shore (150) and shallow, with reach tones blended between tile centres. Riparian and depth-undercut shading use the stored score. Presentation only: world state, collision, drinkability and RNG are untouched.

### v1.40.0 presentation contract

- `render/pixel-art.js` (ART_DETAIL 2): creature and plant drawing snaps positions to half units and rasterises lines in half units; line weight is in units (1 classic, 0.5 one art pixel). Renderer zoom is 2 (32 screen pixels per tile). Presentation only: no simulation state or RNG is touched.

### v1.39.0 founder body and wave 1 contract

- Every GenVo8 spawned without parents receives the founder plan: small-torso (limb sockets 1, 3, 5, 7; one flank part a side), four walking legs, grazing mouth, two simple eyes. Other species have no body plan.
- `lineage/body-inheritance.js`: each GenVo8 newborn takes one parent's plan (RNG pick when both have one), then with probability 0.25 one reachable mutation (a leg on an empty slot with its mirror, a leg pair to a reachable variant, the next torso, mouth or eye pair, a flank pair, back, tail or spur part), then expressed mapped adaptations add their parts (reconcile), then the plan is applied. A committed editor design replaces the inherited body for its litter.
- Torsos provide different sockets. Limb sockets limb.8 to limb.15 sit between the radial sockets (limb.(8+i) between i and i+1); eye.left.2 and eye.right.2 exist on four-eyed bodies; flank and dorsal capacity vary. Replacing a torso drops parts on sockets the new torso lacks.
- Land speed (movementProfile) = leg-count factor (4: 1.00, 5: 1.03, 6: 1.06, 7: 1.09, 8: 1.12, 9: 1.135, 10: 1.15, 11: 1.16, 12: 1.17) + 0.025 per runner leg - 0.015 per sturdy leg - 0.005 per webbed leg, times the body's land factor and the paddle tail's. Metabolism includes 1 + 0.12 x (total registry upkeep - 1.36).
- Body, mouth and eye factors are listed in `WAVE1` in `lineage/part-abilities.js` and fold into the existing authorities (adaptationEffects, threat sense, forage range, food energy, brace, Stalker sight, courtship readiness, drinking, tryKill damage including the dome's rear protection).
- Save schema 9. Schemas below 9 are refused with a message to start a new lineage.

### v1.38.0 Evolution Expansion Phase D contract

- `lineage/part-abilities.js` reads only an animal's explicit `bodyPlan` (a designed lineage). With no plan, or none of the six parts, every factor is 1 and no state is touched. No RNG is consumed.
- `adaptationEffects()` multiplies in: sprint (digging forelimb 0.95, reinforced torso 0.93), metabolism (venom gland 1.04, wide-field eye 1.03, reinforced torso 1.08), water use (wide-field eye 1.04), strike damage (claw 0.9) and carrying (claw 0.8). Its keys are unchanged.
- Digging: E (and an autonomous creature that is hungry with no plant or carrion target) digs roots on a land tile: energy 12 x (0.6 to 1.0 by moisture and fertility) and 2 water, then the tile cannot be dug for 6 days; one dig per second. Hiding and camouflage need 0.24 plant cover instead of 0.36.
- Claw: the attack wind-up is 0.6 of normal; hunts by tryKill get +0.06 chance.
- Venom: a landed bite on a surviving target (player strike or tryKill) spends one of 3 daily doses: the target moves at 0.7 speed and loses 0.28 health a tick for 4 seconds, and a hunter breaks off the biter for 3 seconds.
- Wide-field eye: threat sense x1.4 (inside the shared limit), the threat marker and inspector ranges x1.4, and a braced hit from behind resolves as a side hit.
- Reinforced torso: damage from any tryKill attacker x0.85, after armor.
- Paddle tail: swimming speed x1.25 and swimming energy x0.85 when the body can already swim; land speed x0.96. It never makes a body able to swim.
- Saved controller key `partAbilities` holds dug tiles and poisoned animals; animals keep `poison`, `venom` and `digUntilTick`.

### v1.37.0 Evolution Expansion Phase C contract

- `lineage/evolution-draft.js` edits a draft body plan from a base plan, an ancestry set and a budget. Cost is the difference from the base: an added part costs its `mutationCost`, removing or repositioning a part costs 1, and replacing the part on one socket is charged once. A draft is committable when the plan validates with ancestry, has at least 4 legs, a mouth and an eye, and costs no more than the budget. Undo, redo and revert are exact. Drafting consumes no RNG.
- `lineage/evolution-editor.js` (saved controller key `evolutionEditor`) offers a design when the active lineage GenVo8 of generation 2 or more mates and the mother becomes pregnant with no design attached. The offer lapses when the pregnancy ends. Commit sets `mother.lineageTarget = {plan, from, spent, day}` and consumes the budget's earned bonus; cancel changes nothing.
- `lineage/reproduction-bridge.js` applies a target to each GenVo8 newborn before it is registered: the child receives a copy of the plan, and each legacy anatomy axis is raised to at least its part's seed (0.65, or 0.9 for a 0.8 threshold) when the part is present and below the next tier when that tier's part is absent, or lowered below the lowest threshold when every mapped part is absent. Adaptations are then re-expressed. No RNG is consumed, so a reloaded save reproduces the same litter. The target is removed after the litter.
- Parts with no capability yet (digging forelimb, claw, venom gland, wide-field eye, reinforced torso, paddle tail) cannot be placed until Phase D.
- Lineage records keep `bodyPlanParts`, which joins the ancestry used for prerequisites. Saves stay schema 8; a save without the new fields opens with no offer and no targets.

### v1.36.0 Evolution Expansion Phase B contract

- `render/part-sprites.js` holds one procedural pixel component per registry part, with layer (rear, body, front, face) and shared 8-facing / 8-frame metadata. Parts present in v1.33.7 reuse its pixels exactly.
- `render/creature-assembler.js` maps a valid body plan (explicit `animal.bodyPlan`, else the legacy adapter over expressed adaptations) to a cached per-socket layout; legs are indexed relative to facing (0 = front, clockwise). An invalid explicit plan falls back to the creature's own body.
- The GenVo8 sprite draws parts from the layout. Rendering never grants abilities; capabilities still come from the phenotype resolver and the existing authorities.

### v1.35.0 Evolution Expansion Phase A contract

- `lineage/part-registry.js` holds PartRegistry v0: 18 frozen part definitions with every GDD 6.1 field, seven socket types and eighteen capability names (locked for v0). Parts carry no numeric effects in Phase A.
- `lineage/body-plan.js` defines BodyPlan `genvo8.bodyplan/0`: nodes named by socket path, one root, one compatible parent socket per part within capacity, no cycles, optional ancestry prerequisites, canonical id over the node list. Unknown parts and schemas fail visibly. `bodyPlanFromLegacy` derives a plan from anatomy without changing the animal and keeps the legacy anatomy with it.
- `lineage/phenotype-resolver.js` is pure and, in Phase A, takes adaptations, adaptation effects, Pounce reach and the water rule from the existing authorities via the plan's legacy anatomy; parts only decide which actions exist, gated by the same thresholds. A paddle tail never grants open-water travel.
- `lineage/evolution-budget.js` values a handoff's mutation budget as 8 MP plus a capped earned bonus (0 to 4, one per 6 adaptive-opportunity points since the last handoff, with daily caps). It edits nothing and nothing spends it yet.
- No saved state changes; body plans are not persisted until an authority moves onto them.

### v1.33.7 AUTO first-home contract

- While player autonomy is on, once per second the active creature attempts the family's first shelter through `shelter.canBuildHere` and `constructOrRepair` (the N path). Only a first family shelter (kind `family`) is built automatically; brood and satellite homes are not.
- A successful automatic build ends the opening grace with reason `first shelter built`, the same as a manual build.

### v1.20.0 readability and danger-teaching contract

Population and Home Range remain deep diagnostic surfaces, but their first view must summarize the highest-value state before exposing full ecology/history detail. Long optional panels must provide internal scrolling and preserve their open sections and scroll position across live HUD refresh. Help must be topic-grouped rather than one continuous text wall, while all established keyboard/mouse-free guidance remains available.

The juvenile Danger lesson teaches survival behavior rather than a precise proximity puzzle. A learning young can observe a nearby engaged Stalker from beyond bite-danger range. While Danger is the next missing lesson, the young temporarily follows the caregiver more tightly. A real player retreat counts when movement is directed away from the Stalker and either sprinting or active pursuit confirms the encounter; canonical defensive responses remain valid. These teaching accommodations do not change Stalker damage, pursuit authority, global child-follow rules, or adult family AI outside the lesson window.

### v1.19.0 lifestyle play-loop contract

Established species lifestyles must change ordinary behavior or habitat use, not only percentages. Aquatic taxa treat water as traversable branch habitat; Nomadic taxa use the canonical migration authority more readily; Guardian adults may hold threatened shelter/young through canonical guard/mob behavior; Burrower taxa deepen branch shelter into den-style cover and return to it earlier under strain. These behaviors remain deterministic, reuse existing ecology/combat/shelter authorities, and must preserve the v1.18.1 frame-time stability contract.

### v1.18.1 frame-time stability contract
The live browser performance target is governed by worst-frame responsiveness as well as mean render cost. Daily visual habitat refresh must use stale-while-refresh terrain chunks instead of synchronously invalidating the visible terrain cache. Renderer refresh work is paced outside the day-transition frame, while canonical simulation ecology remains deterministic. Render-time player prediction must include the same divergence, proto-trait, and species-lifestyle movement multipliers used by authoritative manual movement. Audio asset decode work must not be launched as a bulk task from movement keydown.

## Onboarding and pacing authority
The interaction layer deliberately separates **responsive player motion** from **biological/ecological time**. Ecology remains fixed at `CFG.simHz = 8`, while the live browser control path advances manual player movement on the fixed `CFG.controlHz = 32` substep. Four live control substeps preserve the travel distance, movement energy cost, gait progress, and environmental-history weight of one legacy 8 Hz manual step. Full ecology/lifecycle phases still execute once every six ecology update ticks, so biological time and background balance do not accelerate with input responsiveness.

### v0.83 live-control responsiveness
The main browser loop uses a fixed 32 Hz control accumulator and advances the 8 Hz ecology clock once per four control substeps. `Simulation.update(...,{externalPlayerControl:true})` must skip duplicate player translation while retaining the same ecology/perception/decision authority. Direct/headless callers that use `Simulation.update(input)` retain the legacy one-step movement contract for deterministic tests and tooling. This control path consumes no simulation RNG and must remain inert while paused.

Current first-run rules:
- the simulation begins paused behind a concise welcome composition;
- the player is told the actual Generation-8 lineage objective before time begins;
- the founder is normalized to a healthy adult start near a reachable shoreline and useful food;
- one compatible initial mate is prepared within the local search area rather than leaving the first reproductive step entirely to random spawn readiness;
- founder and starter mate receive temporary opening protection while the player learns move, drink, eat, and courtship; protection ends immediately on the first successful pairing or tutorial skip, with a long fail-safe day cap only to prevent permanent immunity;
- the actively controlled animal does not fall back to autonomous survival AI while idle. Food, water, evasion, hunting, home choice, shelter preparation, and other survival actions are the player's responsibility;
- after opening protection ends, the active animal uses a player-session needs cadence for hunger/thirst while autonomous organisms retain the established ecosystem metabolism;
- nearby Stalkers may commit to the active player at close sensory range even if a different prey family is globally more abundant. This player-facing pressure does not alter headless predator selection;
- `E` owns immediate drink/eat interactions and can also attempt a bite on nearby edible animal prey; attacked prey receives a short direct threat memory and flees;
- post-courtship guidance surfaces the existing home-range, shelter, food-cache, child-care, and lineage-handoff systems instead of reverting to passive waiting;
- advanced ecology counts and diagnostic inspectors are opt-in rather than permanent HUD content;
- active-line death/handoff is surfaced as a readable event with cause and successor generation.

Opening protection is an accessibility rule, not permanent immunity. Once the basics are complete, survival pressure is live and the player must actively respond.

## Active-player challenge authority
The autonomous ecosystem and the controlled survival game intentionally share state but do not need identical pacing. `CFG.playerChallenge` only scales the active player's base hunger/thirst cost after opening protection ends. It does not change gene values, autonomous metabolism, carrying capacity, reproduction, plant growth, or headless ecology.

The active player is also excluded from fallback decision AI whenever a real input object is present and no commanded courtship target exists. This prevents the controlled organism from quietly solving its own needs while the player is idle.

Predator challenge follows the same isolation rule: normal Stalker prey switching remains governed by abundance/recovery logic. In a player-enabled run only, a Stalker already within close sensory range may commit to the active GenVo8 if opening protection has ended. Player-involved attacks use a lower per-hit damage scale than autonomous predator kills so an encounter normally creates time to sprint away rather than becoming an unseen one-hit failure.

Manual animal hunting uses the existing diet table instead of a new combat inventory. `E` can attempt a bite only on species already listed as edible for GenVo8; the attempt consumes the same deterministic attack authority, and the target gains a short flee response to the active player.

## Player-facing Stalker encounter authority
In player-enabled runs, a Stalker that commits to the controlled GenVo8 does not immediately reuse ordinary background contact behavior. `PredatorEncounterController` overlays four readable phases on that pursuit: stalk, wind-up, charge, and recovery. This authority only structures the encounter; canonical predator damage remains owned by `Simulation.tryKill()`.

Rules:
- stalking closes at reduced speed so the predator can be noticed and terrain/ability choices matter;
- wind-up pauses movement before commitment and may be broken by successful evolved concealment or a successful counterbite;
- charge movement is faster but time-limited; a contact attempt resolves once through canonical predation;
- every charge attempt enters a short recovery window before another player hunt can begin;
- background/headless predation never uses these phases;
- audio and objective warnings may read this state but cannot advance it or alter simulation RNG.

### Real-time pursuit, breath and stance (v1.28)
- Engaged Stalkers (a `playerHunt` targeting the active creature, found with the local spatial query) decide every ecology tick and move every control step at their real speed. Ambient wildlife keeps the life-stride cadence.
- Pursuit layer inside the stalk phase: lost sight leads to a search of the last seen point, distance beyond the trigger range leads to a full-speed chase (`CFG.stalkerPursuit.chaseSpeed`), and close range uses the existing stalk, wind-up and charge language.
- Each engagement carries pursuit stamina. Chase time, charges, braced contact and wounds spend it. Two clean wounds or empty stamina end the hunt with an aversion window.
- A committed charge runs its locked lane at charge speed until contact, lane end or timeout. Lane end without contact is an evade and begins recovery. Breaking away during recovery requires the player to have actually opened distance.
- Sight: camouflage concealment first, then dense cover hides a quiet creature beyond about three tiles (less than two when still), light cover at longer range. Sprinting and attacking are noisy.
- `ExertionController` owns breath on the active creature. `PlayerCombatController` owns the attack wind-up and recovery, the held brace, knockback and the brace angle response. Damage stays on `Simulation.playerStrike()` and `tryKill()`.
- E (`Simulation.playerInteract()`) never attacks. Space starts the attack.

## Cognition authority
`CognitionController` owns individual remembered locations, relationship recognition, temperament-derived behavior modifiers and personal life-history events for founder-connected GenVo8 individuals.

Cognition is deliberately local and imperfect:
- organisms do not query the entire map for known resources;
- local deterministic perception can remember water, edible vegetation/carrion and predators inside sensory range;
- memories store observed position and observation tick;
- memory persistence scales with inherited senses and old information becomes unusable after it ages out;
- remembered resources can be depleted or changed before the organism returns, so memory is not guaranteed truth;
- the memory system consumes no random numbers during perception, preserving deterministic simulation ordering.

Current cognition-driven behavioral effects are founder-line-only. This isolates the gameplay pass from autonomous ecology balance until cognition is deliberately expanded species-wide.

## Temperament expression
The existing inherited `temperament` gene now produces behavioral differences rather than remaining mainly a phenotype/color influence.

Derived values:
- **boldness** changes threat-flight radius and exploration range;
- **sociality** changes preferred family spacing and family-regrouping tendency;
- lower values read as cautious/solitary;
- middle values read as balanced;
- higher values read as bold/social.

Temperament remains a continuous inherited value. The text labels are readability bands, not discrete classes.

## Social identity
Relationships are derived from real simulation genealogy and mating state. Current recognized relations include parent, child, sibling, mate, ancestor and descendant.

Repeated nearby observation builds familiarity records for known relatives. Non-player founder-line individuals may regroup toward close family when no higher-priority survival, care, feeding, drinking or reproduction behavior is active.

Family care remains owned by `FamilyController`; cognition does not duplicate caregiver authority.

## Life history
Each founder-line organism can retain a bounded personal history of meaningful events. Current event sources include:
- first remembered water location;
- first observed edible resource of a type;
- first drink and first meal of a food type;
- first predator encounter by predator species;
- first successful kill by prey species;
- first mate;
- offspring births;
- development-stage transitions;
- control handoff into the active lineage;
- death and cause.

History is attached to the individual cognitive state rather than global quest scripting.

## Memory inspector and overlay
`I` toggles the Individual Memory inspector. It exposes the active individual's temperament, remembered places, nearby recognized relationships and recent personal history.

When the inspector is open the renderer can show diagnostic world-space memory markers:
- cyan — remembered water;
- green — remembered food;
- red X — remembered predator location;
- dashed relationship lines — currently sensed family/mate relationships.

These are diagnostic/readability visuals, not final art.


## Learned home-range / territory authority
`TerritoryController` owns founder-line habitat familiarity and learned range behavior. It does not assign permanent ownership tiles.

Current model:
- the world is sampled into 8×8-tile familiarity cells for this subsystem;
- presence increases familiarity in the occupied cell;
- effective familiarity weakens with long absence;
- the most familiar cells form a weighted learned center and a bounded home-range radius;
- a smaller core marks the most defensible/familiar part of the range;
- non-controlled lineage individuals can return home when far outside the range and bias ordinary roaming toward familiar cells;
- mature lineage members can identify an unrelated same-species intruder inside the familiar core;
- bold individuals may ward an intruder using temporary non-lethal displacement pressure, while cautious individuals avoid it;
- mates, parents, children, siblings, ancestors and descendants are excluded from intrusion logic through the existing social identity authority.

Territory perception consumes no random numbers. Randomness is used only when an enabled lineage individual chooses a roaming target, so player-off deterministic ecology remains unchanged.

## Home-range inspector and overlay
`T` toggles the Home Range inspector. It reports establishment state, accumulated familiarity, distance from learned center, range/core radii, strongest familiar cells and any currently recognized core intruder.

The diagnostic overlay renders:
- familiar cells as a low-opacity habitat layer;
- the learned home-range boundary;
- the smaller familiar core;
- the learned center;
- the current core intruder marker.

These are simulation/debug readability aids, not final terrain or territorial art.


## Family shelter / habitat modification authority
`ShelterController` owns founder-line physical shelter structures and their environmental effects. Shelter is deliberately downstream of learned home range rather than a free-placement building system.

Current rules:
- a founder-line adult can build only after its learned home range is established and it is physically inside the familiar core;
- one active founder-line family shelter is supported in v0.8.0;
- construction and repair consume nearby Sunmoss, Bramblefruit, Thistlepod and Marshroot biomass above a small residual floor, so habitat modification is visible in the underlying ecology;
- construction costs organism energy and weather slowly reduces structure integrity;
- nearby edible vegetation/carrion can be gathered into a bounded food cache;
- low-energy family members can consume cached food only while physically near the shelter;
- thermal stress is reduced while a family member is inside shelter space, proportional to structure integrity;
- dependent offspring inside shelter space receive lower predator kill probability, proportional to integrity, but never immunity;
- threatened dependents can choose the shelter as a safe target, and low-energy lineage members can seek a shelter with stored food;
- unrelated GenVo8 near the structure can be reported as shelter intruders, while displacement/ward behavior remains owned by `TerritoryController`.

`B` toggles the Family Shelter inspector/overlay. `N` constructs or repairs. `F` gathers nearby edible biomass into the cache. The rendered protection circle and shelter-intruder marker are diagnostic readability aids, not final art.

## Seasonal habitat-pressure / migration authority
`MigrationController` owns founder-line seasonal movement decisions. It does not create global migration events or add a ninth simulation phase. Evaluation runs downstream of Phase-4 perception after spatial indexing, cognition and learned-home data are available.

Current model:
- home habitat is evaluated from real nearby plant/carrion food biomass, moisture/water access, temperature fit, predator pressure, learned familiarity and family-shelter resilience;
- deterministic coarse refuge sampling searches reachable habitat around the learned home range;
- a migration recommendation requires both a weak enough home and a materially better refuge, avoiding constant optimization travel;
- the active player must explicitly commit with `G`; direct movement can still override the route at any moment;
- mature non-player founder-line individuals can depart automatically under the same scarcity threshold, while dependent young continue to follow caregivers;
- arrival creates a temporary refuge state and remembers the location by season;
- a season change plus recovered home quality can produce a return journey; no organism teleports between home and refuge;
- shelter integrity and stored food contribute to home resilience, connecting habitat investment to migration pressure.

`K` toggles Migration Sense and its diagnostic route overlay. It exposes current/home/refuge quality, the major home pressures, route distance, status and remembered seasonal refuges.



## Persistent environmental-history authority
`EnvironmentalHistoryController` is a sparse, read-only consequence ledger used by rendering. It records state that the existing ecology already caused and therefore does not add a ninth simulation phase, consume RNG, change plant growth, alter carrying pressure, or modify survival/reproduction.

Current trace families:
- **traffic:** successful animal movement accumulates local ground use; repeated routes become visible as faint compacted paths and slowly fade after abandonment;
- **grazing/harvest:** consumed producer biomass, including shelter material gathering, leaves temporary disturbance/stubble history;
- **recovery:** regrowth on a previously disturbed cell creates a short-lived fresh-growth trace, making ecological recovery visible rather than instantaneous-looking;
- **nutrient legacy:** animal death and subsequent carrion decomposition create a longer-lived rich-soil/fungal trace after the corpse itself is gone.

Current vegetation arrays remain the source of truth for plant distribution. History does not paint fake vegetation or force succession; it only lets the renderer show how current terrain was used. The controller maintains only cells that have accumulated a meaningful trace and removes them from its active set after all traces decay.

## Selection-pressure readability authority
`SelectionPressureController` is a read-only interpretation layer attached to the existing Phase-4 perception pass. It does not add a ninth phase and does not consume RNG. It evaluates the currently controlled founder-line organism against real simulation state and records sustained exposure once per in-game day.

Current readable pressure families:
- **temperature:** local temperature versus the organism's inherited climate comfort, with metabolism acknowledged only where it actually reduces energy cost;
- **predation:** nearby valid hunters, with movement, senses and cautious temperament tied to the same escape/hunt rules already used by simulation;
- **food scarcity:** local forage/resource pressure plus current energy reserve, interpreted through digestion and metabolic efficiency;
- **water stress:** hydration and reachable-bank distance; the UI explicitly avoids inventing a water-conservation gene that does not exist in the current model;
- **disease:** only appears during a real active infection and reads existing immunity effects;
- **mate scarcity:** low conspecific count interpreted through the existing senses-scaled mate-search rules.

Only the strongest meaningful current pressure is surfaced in the normal HUD. Sustained exposure follows the actively controlled lineage member and can be summarized at handoff so the next generation's inherited changes are shown alongside the conditions the previous generation actually experienced. This layer is descriptive/tracking only and must not modify survival, mutation, reproduction, or ecological balance.

## Lineage authority
`LineageTracker` owns founder-line identity and ancestry state. Parent/child records persist independently of currently living entities. Manual handoff requires a mature descendant; death handoff stays within the actual founder lineage. Generation 8 establishes the lineage only after control reaches a Generation-8-or-later descendant.

## Reproduction authority
`ReproductionController` owns player-facing mate sensing and deliberate courtship. Player mating requires readiness, maturity, sufficient health/energy and non-close-kin identity. NPC ecological reproduction intentionally retains the established behavior.

## Family and development authority
`FamilyController` owns offspring development, caregiver relationships, family-care energy transfer, pregnancy progress and recent family events. Founder-line dependent young regroup with caregivers and caregivers can protect threatened dependents.

## Registry-driven ecology
The current ecology contains five plant/decomposer families and four animal families (nine organism families total). Rule of 8 does not impose registry-size limits.

## Deterministic phase order
1. Climate
2. Water & soil
3. Vegetation & decomposition
4. Perception
5. Decision
6. Movement & interaction
7. Metabolism & disease state
8. Reproduction, death & statistics

Cognition, territory familiarity and migration habitat evaluation observe during Phase 4 and influence founder-line decisions during Phase 5 without adding a ninth top-level phase. Shelter support modifies existing movement/interaction and metabolism/lifecycle work inside those same eight phases.

## Current validation state
The core, onboarding/pacing, readability, cognition, territory, shelter, migration, lineage, reproduction, family, hydrology, carrying-pressure, selection-pressure, and environmental-history suites pass. Five deterministic 10-year player-off ecosystem seeds retain all four animal families. The strengthened three-seed Year-21 suite requires every starter animal family to remain extant, systemic dehydration to stay below threshold, and peak population to remain below the 560-animal performance target.

The current browser-injected verification scene uses the actual v0.18 source and reports zero runtime/console exceptions. It confirms the compact selection-pressure HUD readout and pressure-history text on a real lineage handoff card.

## Visual state
v0.13.0 adds deterministic terrain/shore variation, distinct plant silhouettes, directional eight-frame creature presentation, and less diagnostic HUD styling. These are presentation-only changes and do not constitute visual-art approval.


## v0.14.0 long-run ecology corrections
- Persistent shoreline seepage contributes to soil moisture instead of being diagnostic-only.
- A multi-source land-only water-distance field gives all animals reachable drinking routes around water barriers.
- Terrestrial targeting respects connected land regions; prey, mates, and sampled food cells across an uncrossable river are rejected.
- Local movement can steer around shoreline obstacles instead of repeatedly cancelling a target.
- Needlejaw prey selection combines energetic value with local/global prey frequency, creating prey switching away from rare families.
- Predation vulnerability is species data; Rootlings receive burrower protection instead of sharing generic prey exposure.
- Needlejaws are intentionally lower-density/slower-reproducing than prey populations and depend on local prey abundance to breed.
- Death statistics now distinguish dehydration from generic health failure.
- Canonical 20-year stability checks require every starter animal family to remain extant without population floors.


## v0.15.0 carrying-pressure authority
`CarryingPressureController` is an ecology helper used inside the existing perception/decision phases; it does not add a ninth phase. It separates three concerns:
- **local carrying pressure:** conspecific density progressively slows reproductive-drive accumulation rather than switching fertility on/off at one global count;
- **resource pressure:** plant eaters sample deterministic local forage while hunters use local prey availability; severe depletion can stall reproduction before starvation;
- **runtime decision LOD:** in player-enabled sessions only, unrelated animals far from the active player may reuse an existing decision for two or four life steps. Movement, metabolism, lifecycle and urgent survival decisions continue normally.

Reproductive readiness is a persistent deterministic `reproDrive` on each animal. Healthy mature animals accumulate drive according to local pressure; mating resets both parents. This avoids additional per-tick random draws that would otherwise shift the deterministic ecology sequence.

`CFG.maxAnimals=900` is an emergency safety ceiling, not intended carrying capacity. `CFG.performanceTarget=560` is enforced by the canonical Year-21 regression. The current three canonical long seeds peak at roughly 274–311 animals after v0.15 regulation.

Needlejaw prey choice applies abundance-driven prey switching: when a globally abundant edible family is also locally available, that abundant pool is preferred before rarer prey are considered. Rare prey are not immune; they can still be hunted when common prey is absent locally. Sparse populations also extend compatible-mate search range, reducing accidental reproductive isolation without spawning replacement animals or enforcing population floors.


## v0.16.0 low-density recovery authority
`RecoveryController` is consulted from the existing decision/carrying logic and does not add a ninth simulation phase. It provides negative-density feedback only; it never spawns replacement organisms or enforces a population floor. As a population becomes sparse, compatible-mate search expands and reproductive-drive accumulation receives a bounded boost because local competition is reduced. Predator prey switching also establishes a low-density refuge: when adequately fed predators have a common edible alternative, prey families below their configured rarity threshold are skipped. Starving predators can still break that refuge.

Kin avoidance is hierarchical. Parent/child mating remains forbidden. Unrelated mates are always searched first. Only below a configured critical population ratio, and only when no unrelated compatible mate can be found, autonomous animals may mate with a sibling. Children from a sibling pairing carry an `inbreeding` load, lower starting health, and small inherited immunity/metabolic penalties. This allows a bottleneck to recover at a cost instead of turning strict sibling avoidance into an automatic extinction rule.


## v0.17.0 adaptation/readability layer

The adaptation layer is descriptive only. It derives human-readable labels and inter-generational comparisons from existing `genes` values and lineage records. It does not modify genes, selection, mutation rates, reproduction, mortality, behavior probabilities, or RNG consumption. Handoff records may store derived trait-delta summaries for presentation. Generation 8 remains the first milestone rather than a simulation stop condition.

## v0.18.0 visible selection-pressure layer

The v0.18 layer makes natural selection readable without changing the ecology. It evaluates current conditions from existing simulation state, exposes only the strongest meaningful pressure during ordinary play, and records daily exposure for the actively controlled lineage member. Generation handoff cards can therefore connect inherited changes to lived conditions such as predators, thermal stress, food scarcity, water stress, disease or mate scarcity. A dedicated regression verifies that pressure tracking consumes no RNG and does not alter population outcomes.


## v0.19.0 persistent environmental-history layer

The v0.19 layer makes ecological change legible over time without feeding new values back into the simulation. It records repeated travel, biomass removal, regrowth after disturbance, death and decomposition in sparse world-cell fields. Rendering can therefore show worn routes, overgrazed ground, recovering shoots and old nutrient hotspots while deterministic population/RNG outcomes remain identical with the history tracker disabled.

## v0.23.0 — propagules, seed banks, and animal dispersal

Plant reproduction now has explicit spatial state for seed-limited producers. `World.seedBank[kind]` stores viable propagules independently from standing biomass. Bramblefruit and Thistlepod can enter an animal seed cargo when eaten; deterministic gut-transit timing delays deposition until the carrier has moved, so plant range movement depends on actual animal movement. Death deposits remaining carried seeds locally. Deposits make a small fertility contribution representing dung/carcass material.

Mature seed-limited plants can also release sparse short-range propagules. Germination requires a non-trivial seed bank plus suitable moisture, temperature, and fertility. When seed-limited standing biomass reaches zero, ordinary growth cannot recreate it without a seed. Sunmoss remains a broadly established ground producer and Rotcap remains decomposition-driven.

`PlantDispersalController` is executed inside canonical phase 3 (Vegetation & decomposition in human numbering / phase index 2) and does not add another top-level simulation phase. Its deterministic hashing does not consume the main RNG stream.


## Disease authority (v0.23.0)
Disease remains part of phase 7 / `Metabolism & disease`; it is not a ninth phase. Mirefever exposure can originate from close contact, mating, shared shelter occupancy, contaminated ground or carrion. Infected animals shed local contamination and infected corpses create stronger contamination hotspots. The existing immunity gene modifies susceptibility, severity and recovery duration. Survivors gain temporary acquired immunity. Disease exposure rolls are deterministic from seed/day/animal/source and do not advance the main simulation RNG stream.


### Social/group behavior (v0.23.0)
Social grouping is evaluated during Perception and influences Decision without adding a ninth phase. Species data defines herd/colony/band/solitary behavior. Groups are temporary spatial clusters, not persistent factions. Shared alarms can extend predator awareness through nearby conspecifics; cohesion and spacing are low-priority movement intents below survival, feeding, reproduction, family care, and territory responses. Social calculations are deterministic and consume no main RNG. Full social steering is a local-detail simulation around the active lineage; distant background populations remain on the lower-cost ecological behavior model. This is simulation LOD, not a population floor or scripted outcome.


### Social presentation (v0.23)
Renderer-only social poses may derive from SocialController state. They must not mutate animal direction, intent, target, group membership, ecology RNG, or simulation scheduling. Nearby groups can visually synchronize/offset 8-frame motion, face companions while idle, and express shared alarm poses.


## Presentation interpretation — v0.25.0
Silhouette identity is also presentation-only: renderer anatomy may exaggerate ears, haunches, claws, jaws, tails, eye placement, and radial limbs so species remain distinguishable at 16×16. Vegetation macro-region and clearing/thicket composition may change draw density but must never mutate standing biomass or seed-bank state.

The renderer may derive action poses from existing `animal.intent`, target distance, social visual state and development stage. This interpretation is strictly read-only: it must not change intent, target, direction, RNG state, metabolism, ecology, disease, reproduction or lineage state. Feeding, drinking, courtship, hunting/stalking, flee and social/alarm poses therefore communicate already-authoritative simulation state rather than creating new mechanics. Ground-composition clustering is deterministic presentation only and does not alter world moisture, fertility, plants, seed banks or history fields.

## Presentation interpretation — v0.27.0
Large habitat landmarks are renderer-only interpretations of existing ecological state. Each visible 4×4 region samples nearby real plant biomass, moisture, fertility and nutrient-history values and may draw one dominant multi-tile silhouette (Bramblefruit hedge, Marshroot reed bed, Rotcap fungal ring, Thistlepod stand, or Sunmoss hummock). These landmarks never create biomass, shelter, collision, food, seeds, or simulation effects. Habitat-edge marks likewise derive from neighboring moisture/fertility zones and are presentation-only.

## Presentation interpretation — v0.27.0
Large habitat landmarks are renderer-only interpretations of existing ecological state. Each visible 4×4 region samples nearby real plant biomass, moisture, fertility and nutrient-history values and may draw one dominant multi-tile silhouette (Bramblefruit hedge, Marshroot reed bed, Rotcap fungal ring, Thistlepod stand, or Sunmoss hummock). These landmarks never create biomass, shelter, collision, food, seeds, or simulation effects. Habitat-edge marks likewise derive from neighboring moisture/fertility zones and are presentation-only.


## Presentation interpretation — v0.27.0
Habitat relief, riparian bank-foot shading, and foreground plant fringe are deterministic renderer interpretations of existing moisture, fertility, shoreline, and plant biomass. They do not participate in the eight simulation phases and must not mutate ecological state or consume simulation RNG.


## Presentation interpretation — v0.28.0

Macro landform smoothing is explicitly **non-authoritative**. `World.water`, `landRegion`, `drinkable`, `waterDistance`, moisture, plant state, and movement collision remain canonical simulation data. `render/landform.js` may interpolate that water grid into sub-tile visual contours and add deterministic bank/floodplain accents, but those pixels never alter pathfinding, drinking, habitat, reproduction, or save state.


## Presentation interpretation — v0.29.0

Habitat-shape reconstruction is **non-authoritative**. `render/habitat.js` may create a blurred copy of canonical `World.moisture` and `World.fertility`, add bounded deterministic low-frequency visual warping, and reconstruct meadow/wet/dry/rich boundaries at sub-tile resolution. This visual field may control base terrain color, ecotone flecks, and renderer-only vegetation density presentation. It must never write back to moisture, fertility, plants, seed banks, movement, pathfinding, disease, reproduction, RNG, save data, or any of the eight simulation phases.

The renderer refreshes the smoothed visual habitat field at most once per in-game day. This is a presentation cache, not simulation LOD: ecology continues to update from the canonical world arrays on its normal schedule.

## Presentation interpretation — v0.30.0

`render/composition.js` adds a **non-authoritative world-scale composition field** above the habitat contour. Smooth seeded fields may organize renderer-only open glades, loose habitat corridors, wet/dry pockets, and landmark-rich thickets. Composition may alter decorative vegetation draw thresholds, foreground fringe density, subtle ground breakup, and landmark placement cadence, but it must never create/remove biomass, seeds, shelter, food, collision, disease, pathing, or animal state.

High real structural-plant biomass must remain visually represented even inside an open composition region. Composition is therefore a readability/layout layer over ecological truth, not a biome generator. It is deterministic and must not consume the main ecology RNG stream.


## Presentation interpretation — v0.31.0

`render/life.js` is strictly **non-authoritative**. It may derive breathing, blinking, apparent fatigue/thirst/injury, gaze, lean and eight-frame limb rhythm from already-existing animal vitals, intent, social visual state, development stage and `Simulation.tickCount`. It must never consume the simulation RNG, alter targets or direction, change metabolism/reproduction/disease state, or write back to an animal.

The renderer may use that visual state to articulate GenVo8's eight limbs, open/close its visible mouth seam during existing feed/drink actions, alter eye shape during blinks or alarms, and emit bounded cosmetic contact effects. These effects communicate simulation state only; they cannot create food, water, courtship, damage, fear or any other mechanic.

The normal HUD may prioritize lineage progress and immediate survival vitals while moving lower-priority trait/social/pressure detail behind contextual text and optional inspectors. This is a player-facing readability decision and does not remove or change the underlying simulation data.

## Presentation interpretation — v0.32.0

`render/genvo.js` is a **non-authoritative morphology renderer**. It may derive a GenVo8 mantle shape, body wobble, facial geometry and eight articulated limb coordinates from phenotype, existing direction/action state, the current eight-frame presentation frame, and `render/life.js` output. The module must not mutate animal coordinates, velocity, direction, intent, targets, genes, vitals, reproduction, ecology, save state, or RNG.

Visual foot planting and body deformation are intentionally decoupled: a renderer frame may shift the soft mantle while keeping cosmetic foot endpoints fixed. This creates readable weight transfer without creating collision, traction, movement distance or any other simulation effect. Genetic markings may be reinterpreted for organic readability as long as their presence still derives from the same phenotype flags.



## Presentation interpretation — v0.33.0

`render/fauna.js` is a **non-authoritative species pose layer**. It may exaggerate Mosskip spring compression/leap, Rootling digging/low-body motion, and Needlejaw stalking/jaw/tail posture from already-existing render frame, direction, intent, development and life-state data. It must not mutate movement, intent, targets, genes, vitals, social state, reproduction, ecology, save data or RNG.

Riparian depth bands and local habitat clusters are likewise renderer-only. They may derive from canonical water adjacency, moisture, standing plant biomass and `render/composition.js`, but cannot create drinkable water, collision, resources, shelter, plant biomass, seeds or habitat suitability.


## Presentation interpretation — v0.34.0

`render/motion.js` is a **non-authoritative presentation bridge** between authoritative coordinate updates. Background ecology remains fixed at `CFG.simHz`; the controlled player can additionally receive canonical movement positions from the 32 Hz live-control substep. The renderer may retain the previously observed authoritative position/frame and ease toward the newest target using the appropriate cadence, including same-ecology-tick player targets. It must never write interpolated values back to an animal or use them for simulation decisions. Camera follow is presentation-only and frame-rate independent.

Eight-frame pose phase may be fractional in presentation modules and, for live manual control, canonical gait progress may also advance fractionally so four 32 Hz substeps equal one former 8 Hz frame step. Wrapped interpolation across frame 7 → 0 must follow the short cyclic path. `render/activity-detail.js` may draw bounded ground-contact cues from species, action, movement and visual phase, but those pixels are not environmental-history authority and cannot create trails, disturbance state, resources, collision, noise, scent or detection effects.


## Presentation interpretation — v0.35.0
The field interface is a read-only presentation layer. Eight-segment need and lineage indicators summarize canonical health, energy, hydration, development, and lineage state. Context prompts are intentionally sparse and may hide non-urgent advisory text; hiding presentation text never suppresses simulation state or world cues. The UI presentation helper consumes no RNG and writes no animal, ecology, lineage, or save state.


## Presentation interpretation — v0.36.0
`render/scene.js` may interpret canonical moisture, fertility, standing plant biomass, water adjacency, and `EnvironmentalHistoryController` traffic/grazing/nutrient/recovery fields into a bounded set of recognizable habitat scenes such as watering margins, feeding grounds, worn routes, fungal hollows, recovery patches, dense pockets, and open clearings. `render/scene-detail.js` may stage multi-tile backdrop/foreground art from those scores. Scene interpretation is strictly renderer-only: it cannot create food, water, plants, shelter, collision, pathing, traffic, grazing, nutrients, recovery, or animal state, and it must not consume the simulation RNG.

Environmental-history trail presentation may derive segment orientation from neighboring canonical traffic values so repeated movement visually connects across cells. The renderer may only read those values; `EnvironmentalHistoryController` remains the sole authority that records and decays traffic. Open-clearing scene marks are deliberately sparse so negative space remains part of world composition rather than becoming another decoration layer.

## Presentation interpretation — v0.37.0
Player-facing vocabulary is presentation data, not simulation identity. Internal keys such as `bramble`, `mosskip`, `rootling`, `needlejaw`, and `mirefever` remain canonical for ecology, saves, tests, and deterministic behavior, while UI/render labels may use plainer common names such as **Berries, Hopper, Digger, Stalker, and Marsh fever**. Changing a display label must never migrate or reinterpret simulation state.

Visible inheritance is likewise **non-authoritative**. `phenotypeFor()` and `render/genvo.js` may exaggerate the visual expression of already-inherited body, motion, metabolism, digestion, senses, climate, immunity, and temperament genes so relatives visibly resemble one another and descendants visibly diverge. Presentation may alter mantle scale, leg reach, eye/feeler scale, color/brightness, marking count/polarity, and stance, but must not change the underlying gene values, fitness, movement speed, sensing radius, metabolism, disease resistance, temperament decisions, reproduction, save data, or RNG. Generation-transition copy may summarize those differences in plain language; it is descriptive only.



## Presentation interpretation — v0.38.0
Generation handoff presentation may render recorded parent and descendant genes side-by-side and summarize visible differences before exposing detailed inherited shifts. `render/genvo-draw.js` is the shared authority for GenVo8 body drawing in gameplay and lineage portraits; portrait rendering may read recorded genes but cannot mutate animals, lineage records, ecology, saves, or RNG. The optional details disclosure may summarize inherited trait changes, founder drift, lived selection pressure, and death cause, but those summaries are descriptive only and never feed back into simulation decisions.


## Presentation interpretation — v0.40.0
The primary interface is a renderer-adjacent presentation surface, not simulation authority. Normal-play needs and lineage progress use authored pixel UI assets, while objectives and interactions are placed directly over the running world. Generation handoff is presented as a full-screen visual scene with transparent recorded-gene portraits. UI assets, layout, and visibility never change animal state, inheritance, ecology, RNG, or save data.


## Family journal presentation — v0.40.0

The L-key family journal is a read-only presentation layer over existing lineage, cognition, territory, migration, and family records. It may summarize those records and draw recorded genes, but it must not create relatives, memories, habitat state, mutations, or handoff eligibility. Q/E browsing is UI state only. H delegates to canonical lineage handoff validation.


## Presentation interpretation — v0.42.0

Habitat depth is renderer-owned. `render/depth.js` may read canonical moisture, fertility, plant biomass, visual composition and water adjacency to derive local canopy shade, open-ground light, bank undercuts, foreground thicket overlap and creature ground shadows. These values are never written back to world arrays, collision, hydrology, AI, saves, genetics or ecology. The renderer must not consume simulation RNG.

The lighting model is deliberately local rather than a global screen filter: open areas remain visually open, while dense vegetation and water margins produce depth only where existing habitat structure supports it.


## Presentation interpretation — v0.43.0

- Canonical plant biomass remains the only authority for food/resource availability. `render/flora.js` only changes how existing biomass and seedlings are drawn.
- `render/landmarks.js` may summarize an already-identified habitat scene with a sparse signature visual. Reed, mushroom, berry and pod signatures require corresponding real biomass and are never interaction targets by themselves.
- Clearing stones and trail-root crossings are inert terrain decoration only and carry no resource/collision/pathing state.
- Flora/landmark presentation is deterministic and cannot consume ecology RNG or write simulation arrays.


## Presentation interpretation — v0.44.0

`render/terrain-motifs.js` may combine an already-qualified habitat scene with read-only local hydrology and environmental-history values to draw larger terrain identity cues such as earth shelves, worn approaches, root-lined thicket pockets, dry rises, drainage hollows, and recovery hollows. These motifs are descriptive art only. They cannot add or remove water, drinkability, collision, bridges, caves, shelters, food, plant biomass, traffic, pathing, or any other simulation authority.

Macro terrain motifs must remain sparse. Renderer-side water/traffic orientation may only read canonical arrays and must not consume simulation RNG. Per-tile depth/relief art should avoid repeated edge-aligned bars that expose the tile grid; local shade and ground relief are presentation cues, not terrain height or cover mechanics.


## Presentation interpretation — v0.48.0

`render/hierarchy.js` is a read-only visual-priority layer. It may reduce opacity of low-information ground micro-detail and low-biomass flora traces according to player proximity and existing habitat openness, and may increase presentation-only foreground clearance around the controlled creature. It must not hide or alter canonical resource biomass, environmental-history values, hydrology, collision, navigation, animal state, lineage state, save data, or RNG. Full resource silhouettes and simulation-significant terrain/history remain independently rendered.


## Presentation interpretation — v0.49.0

`render/behavior.js` is a **non-authoritative body-language interpreter**. It may translate an animal's already-authoritative intent/action, movement phase, social alarm state and life-state flags into renderer parameters such as body lean/height, stance width, sensory appendage sweep, eye posture, search posture, guarding brace, flight stretch, and injury limp/recoil. It must not write intent, targets, coordinates, movement, health, needs, social state, territory, resources, ecology, saves, or RNG.

Territorial intents may be mapped to an equivalent visual action (`ward` → guard, `avoid-intruder` → flee) solely so existing behavior reads correctly on screen. The mapping cannot alter AI decisions. GenVo8 and other fauna may exaggerate these body-language cues by species, but presentation remains deterministic and simulation outcomes must remain unchanged.


## v0.50.1 hotfix invariants

- Shelter objective progression must inspect the actual current shelter state even while the controlled parent is pregnant.
- Presentation caches may reuse values only across authority-stable windows: water topology is static, habitat fields/masks are daily, and habitat scene summaries refresh at least once per simulation second or when the visible tile window changes.
- Renderer caching is presentation-only and must not alter simulation RNG, ecology arrays, player input, lineage, or save state.


## Evolutionary agency — v0.51.0

- Continuous genes and major adaptations are distinct authorities. `genes` continue to model graded inherited variation; `adaptations` are discrete lineage capabilities owned by `lineage/evolution.js`.
- A child inherits the union of major adaptations already present on its parents at birth. A newly chosen handoff adaptation applies to the descendant taking control and therefore only passes to offspring born after that adaptation emerged.
- Adaptation candidates may read the previous active animal's recorded selection-pressure exposure and death cause. Candidate ranking may not mutate pressure history, gene values, ecology, or RNG state.
- Handoff selection is canonical progression state. When an adaptation offer exists, play remains paused until one offered adaptation is chosen. The chosen ID is stored on both the live animal and its lineage record.
- Basic player defense against a nearby Stalker is always available. Major combat adaptations modify that existing action rather than creating a separate RPG combat mode.
- `Hardened Mantle` may reduce player-facing predator damage and slightly reduce sprint performance. `Barbed Limbs` may strengthen the defensive strike and create brief predator recoil. `Bitter Slime` may create short predator aversion after a successful bite at an energy cost.
- `Spring Tendons`, `Water Sacs`, `Efficient Gut`, and `Fast Healing` may modify the controlled lineage's movement/needs/recovery coefficients, including inherited autonomous descendants, but must not change unrelated species balance. `Alarm Pulse` is an active player action that may set a temporary predator-flight cue on nearby living lineage relatives only.
- Visible adaptation anatomy is presentation derived from canonical `animal.adaptations`. Rendering cannot grant or remove an adaptation.
- The initial set contains eight major adaptations as a thematic starting set. The registry is extensible; eight is not a permanent adaptation-content ceiling.


## Evolutionary strategies — v0.52.0

Major adaptations now span distinct strategy branches. Camouflage Mantle provides active hiding in sufficiently dense canonical vegetation; moving, attacking or interacting breaks concealment, and very close Stalkers can still detect the animal. Heavy Jaw increases player strike power at a water-cost tradeoff. Mobbing Instinct lets the active animal rally nearby mature founder-line relatives against a close Stalker; relatives physically approach and harass the predator, risking retaliation. Grasping Limbs allows one food load to be picked up, carried, deposited into a nearby family shelter, or dropped back into the world. These states are lineage/player-facing and do not alter autonomous ecology unless the player invokes them. Mutation offers prefer different strategy branches when possible.


## Evolutionary branch depth — v0.53.0

Major adaptations may now declare a prerequisite and tier. A second-stage adaptation is eligible at a generation handoff only when its prerequisite is already inherited by the descendant; this turns repeated survival pressures into lineage-specific evolutionary histories rather than a flat perk pool. The first second-stage branches are: Camouflage Mantle → Adaptive Chromatophores, Heavy Jaw → Crushing Jaw, Mobbing Instinct → Coordinated Defense, and Grasping Limbs → Provisioning Pouches.

Adaptive Chromatophores preserve camouflage during non-sprinting movement while adequate canonical plant cover remains beneath the player; sprinting or leaving cover still exposes the animal. Crushing Jaw amplifies direct bite damage and can briefly stagger a Stalker. Coordinated Defense marks rallied adult family as a braced group, improving mob strikes and reducing incoming predator damage while the rally lasts. Provisioning Pouches raise carrying capacity to two base food loads and increase shelter provisioning efficiency at the cost of stronger carrying slowdown. These capabilities are player-lineage mechanics and do not alter autonomous ecology unless invoked by the player.


## Lineage specialization behavior — v0.54.0

`lineage/specialization.js` owns autonomous expression of discrete adaptation branches for living founder-line GenVo8. It does not own mutation eligibility, adaptation inheritance, continuous genes, general predator AI, or shelter storage authority. The controller may only translate already-inherited adaptations into bounded decisions/actions.

- Camouflage Mantle descendants may choose stationary concealment when a Stalker is perceived and canonical local plant cover is dense enough. Adaptive Chromatophores descendants may retreat between sufficiently covered cells while remaining concealed; ordinary movement, sparse cover, and unrelated intents clear concealment. Existing predator targeting must use the same `camouflageConceals` rule for player and autonomous lineage prey.
- Mature Heavy Jaw descendants with adequate health/energy may choose a short-range counterattack instead of generic flight. Crushing Jaw descendants may accept a slightly wider counter range, hit harder, and briefly stagger a Stalker. Counterattacks consume real energy, obey cooldowns, and can redirect predator aggression onto the defender.
- Mature Mobbing Instinct descendants may initiate an autonomous family rally when threatened and at least one other mature founder-line adult is nearby. Coordinated Defense propagates the coordinated rally state only to relatives that actually inherited it. Autonomous rallying consumes energy and has a multi-second cooldown so it cannot fire every decision tick.
- Mature Grasping Limbs descendants that are well fed/hydrated may provision an intact, understocked family shelter. They must travel to real edible biomass, remove that biomass from the canonical world arrays, carry a bounded load, travel back to the shelter, and deposit only the nutritional value represented by that load. Provisioning Pouches raise load capacity/efficiency through existing adaptation effects. No autonomous provisioning path may create food ex nihilo or bypass shelter capacity.
- Survival priorities remain authoritative: critical thirst, direct danger responses, low-energy shelter feeding, dependent following, and guarding are evaluated before optional provisioning. These behaviors apply only to non-player founder-line GenVo8; the active animal remains under direct player control.
- Family specialization may change founder-line survival outcomes, which is intentional selection feedback. It must not change unrelated species capabilities, global resource growth coefficients, predator diet tables, or non-lineage GenVo8 behavior.


## Evolutionary strategy consequences — v0.55.0

v0.55 extends `lineage/specialization.js` from reactive family expression into bounded strategic opportunity. This section supersedes the earlier v0.52/v0.53 player-only limitation for these four branches: inherited strategy may influence autonomous founder-line GenVo8, but it still may not grant capabilities to unrelated animals, alter global growth coefficients, replace general predator AI, or create parallel resource/territory state.

- **Stealth feeding:** a Camouflage Mantle descendant that is hungry, already standing in sufficient canonical plant cover, and far enough beyond the Stalker's close-detection distance may choose edible plant/carrion biomass at its current location instead of abandoning the patch. Adaptive Chromatophores may select a nearby covered edible cell and remain concealed while moving through cells that continue to satisfy the canonical cover threshold. Feeding must consume the same plant/carrion arrays used by ordinary feeding and may not create nutrition. The active player may eat plant/carrion with `E` while concealed without automatically emerging; drinking, prey hunting, anti-Stalker combat, sprinting, ordinary non-adaptive movement, sparse cover, and close predator detection still break or defeat concealment.
- **Home-core defense:** a mature Heavy Jaw founder-line adult with adequate health and energy may proactively target a Stalker that enters its established learned home core even when that Stalker has not yet committed to attacking the adult. Crushing Jaw permits a modestly wider patrol envelope and uses the existing counter-strike/cooldown/energy authority. This is not a new territorial ownership layer and does not cause global predator extermination behavior.
- **Nursery defense:** a mature Mobbing Instinct adult may respond to a Stalker threatening a living dependent founder-line relative within the family area even when that juvenile is not the adult's own child. The response uses the existing autonomous rally authority, energy cost, cooldown, and physical mob-strike behavior. Coordinated Defense increases the defended family radius and threat-detection radius but does not make juveniles invulnerable or remove retaliation risk.
- **Provisioned operating range:** Grasping Limbs/Provisioning Pouches may expand an autonomous descendant's learned-home roaming/return envelope only while an intact usable family shelter contains a meaningful real food store. Provisioning Pouches provide the larger multiplier and cached-food return radius. The multiplier must return to 1 when stored food is depleted; shelter capacity, food decay, biomass collection and ordinary energy/hydration needs remain authoritative.
- Strategic decisions occur after critical hydration, direct threat response, low-energy cached-food return, and dependent following. They occur before ordinary parent guarding/provisioning/wandering so a specialized adult can act on a branch-specific opportunity without overriding emergency survival authority.
- `tests/lineage-strategy.mjs` is the focused regression contract for these consequences. It must prove canonical resource consumption, home-core targeting, non-parent family defense, food-backed range expansion, and player concealment retention during quiet feeding.

## Generation-scale strategy encounters — v0.56.0

The specialization controller may surface one player-facing field encounter for the active generation when its most recently inherited strategic branch has a legitimate opportunity in existing simulation state. This is an interpretation/readability layer over canonical ecology, family, territory, shelter and predator data; it is not a quest-spawn authority.

Rules:
- no strategy encounter may create food biomass, predators, offspring, shelters, territory cells, lineage records, or adaptation unlocks;
- branch selection scans the active animal's inherited adaptation list from newest to oldest and uses the newest stealth, offense, social or utility branch present;
- encounter scanning is cached for a short bounded interval so UI refreshes do not perform a full local search every render frame;
- core family progression remains authoritative. Home establishment and shelter construction take priority over optional branch play. A provisioning encounter may replace generic shelter-stocking guidance because carrying real food to the shelter satisfies the same canonical need;
- completion is action-based and must pass through existing player mechanics. A field marker alone cannot complete an encounter;
- completion is stored in the generation-specific specialization state, the existing cognition-history event, and that animal's canonical lineage record so descendants can read ancestry practice. It does not grant hidden stats or permanent bonuses beyond the adaptation mechanics already inherited;
- a completed encounter may be summarized in the next handoff reveal so the descendant inherits a readable account of the previous generation's lived strategy, not an extra genetic modifier.

Branch contracts:
- **Stealth:** detect real edible biomass in canonical cover with a real Stalker inside the risk envelope but outside close-detection distance. Completion requires a successful `E` feed while camouflage still defeats a nearby Stalker.
- **Offense:** detect a real Stalker inside an established learned family range. Completion requires killing it, forcing a recoil, or landing two successful strikes while the Stalker remains inside the bounded defense envelope.
- **Social:** detect a real Stalker close to living dependent founder-line kin. Completion requires an `X` family rally/alarm that actually rallies at least one mature lineage adult while young remain threatened.
- **Utility:** detect real edible biomass beyond a minimum shelter/home-core distance. Completion requires `Z` pickup of real biomass and `Z` deposit of that same carried load into the family shelter. The carried load records its origin solely so the existing shelter deposit can verify the trip distance; it does not create a second food ledger.

`tests/strategy-encounters.mjs` is the focused regression contract for these rules.


## Adaptive sound + music — v0.58.0

- Audio is a presentation authority under `src/audio/`; it may observe simulation state and interaction results but must not mutate ecology, lineage, reproduction, shelter, cognition, world state, or simulation RNG.
- Web Audio must be created lazily after a user gesture. Headless simulation/tests must remain valid when `AudioContext` does not exist.
- The mixer separates master, music, SFX, and ambience buses. `U` toggles master output without pausing or altering simulation.
- Immediate SFX cover player survival/action feedback (movement, food/water, combat/damage, camouflage, family signals, carrying/storage, shelter work, courtship) plus founder-line births and lineage handoffs.
- Birth audio is founder-line scoped through canonical lineage records; global ecosystem births do not trigger player-facing birth cues.
- Music state is derived from canonical local conditions: calm exploration, family shelter proximity, camouflage concealment, and nearby active Stalker pressure outside opening protection.
- The score uses eight compositional positions as Rule-of-8 language. Seasons may shift tonal center and generation may shift register, but music has no gameplay authority.
- Handoff stingers distinguish normal succession, death succession, and first Generation-8 establishment.
- Procedural synthesis in v0.58 is replaceable. Future authored WAV/OGG stems/cues must plug into the audio authority rather than adding direct audio ownership to gameplay controllers.


## Authored soundscape + spatial creature identity — v0.59.0

- The v0.58 audio authority remains presentation-only. Authored audio may observe canonical player/world/animal state but may not mutate simulation state or consume simulation RNG.
- `assets/audio/` is a source-owned authored pack. `tools/generate_audio_assets.py` deterministically regenerates the current PCM WAVs without third-party samples. Runtime load failure must degrade to the procedural v0.58 sound layer rather than block play.
- Mixer ownership remains centralized: authored ambience loops connect only to the ambience bus; authored music texture loops connect only to the music bus; fauna/vocal one-shots connect only to the SFX bus. Gameplay controllers do not own media elements or Web Audio nodes.
- Field and wetland beds may crossfade using canonical local moisture/seepage. Shelter and danger music textures may crossfade using the same canonical shelter/threat state used by `musicSceneFor`. These are perceptual layers only.
- The procedural eight-position score remains authoritative for adaptive phrasing. The newest inherited strategic branch may select a branch-specific phrase variant, but this musical fingerprint does not alter adaptation, challenge, lineage, ecology, or combat state.
- Nearby fauna calls must originate from actual living animal positions. Audio-only call timing uses the AudioDirector PRNG, never `sim.rng`; no call may move, alert, spawn, target, or otherwise affect an animal.
- Stalker warning audio is telegraphing, not gameplay authority. The proximity rattle may sound only for a real nearby Stalker after opening protection; cadence may scale with derived danger. A real player-damage event may trigger a distinct lunge cue from the canonical attacker position. Audio cannot create a threat or predict a hit that simulation has not produced.
- Positional cues use stereo panning and distance attenuation when supported, with a centered/mono fallback when `StereoPannerNode` is unavailable.
- `tests/audio-assets.mjs` validates authored-file integrity/payload and `tests/audio-runtime.mjs` validates decode, loop routing/startup, cue scheduling and spatial panning.

## Event-specific sound design + transition mix — v0.60.0

- v0.60 remains presentation-only. Food/material/vocal/threat differentiation may read canonical result/state fields but may not write simulation state or consume `sim.rng`.
- Successful player food interactions select a cue from the canonical `result.kind`: `sunmoss`, `bramble`, `marshroot`, `rotcap`, `thistlepod`, and `carrion` may each have a distinct authored one-shot. Unknown food kinds must fall back to the generic procedural eat cue.
- Successful/missed manual prey hunts use the existing combat hit/miss vocabulary; audio routing must not alter kill chance, prey fleeing, energy, or target state.
- Shelter build, repair, and store/cache actions may use distinct authored material cues. Family alarm, rally, courtship, and founder-line birth may use distinct GenVo8 vocal cues. Missing/failed authored assets must retain procedural fallbacks.
- Water-edge ambience is derived only from canonical local seepage and `waterDistance`/drink proximity. It is a third ambience layer distinct from generic wetland moisture and may not create drinkable cells or navigation information.
- Stalker warning has derived perceptual stages only: band 1 proximity/rattle, band 2 stalking escalation, band 3 charge escalation. Bands require the same real nearby threat used by `musicSceneFor`, respect opening protection and concealment-derived danger, and may not create, move, retarget, damage, or predict a Stalker. The lunge cue remains tied to an actual `lastPlayerDamage` event.
- Threat-stage timing and fauna variation use AudioDirector's private deterministic audio PRNG only.
- Authored danger gain must crossfade rather than hard-switch; release may be slower than attack. Generation handoff stingers may temporarily duck music/ambience but must not pause or modify simulation.
- The original v0.59 WAVs remain valid canonical assets. v0.60 adds deterministic source-owned WAVs through the same generator and loader.
- `tests/audio.mjs` covers food/water/threat derivation; `tests/audio-assets.mjs` covers all 27 WAVs and payload limits; `tests/audio-runtime.mjs` covers decode/loop startup, food playback, positional threat escalation, handoff ducking, and mute behavior.

## Multi-generation strategy arcs — v0.57.0

Repeated strategic play may deepen a branch across consecutive controlled generations, but the arc is ancestry-derived rather than a separate campaign authority.

Rules:
- completing a strategy encounter writes `{branch, complete, generation, day, detail, streak}` into the completing animal's existing lineage record;
- a descendant's branch streak is computed by walking its canonical ancestry path backward from its parent and counting only consecutive completed records for the same strategic branch, capped at three prior generations for encounter scaling;
- a different strategic branch, an incomplete generation, or a missing completed strategy record breaks the streak immediately;
- arc depth may alter only the player-facing branch encounter envelope/requirements described below. It must not create food, predators, kin, shelters, territory, adaptations, free damage, free nutrition, hidden gene changes, or permanent stat multipliers;
- existing family progression keeps priority over the strategy encounter, and encounter scans remain short-interval cached;
- handoff summaries may state the number of consecutive generations that actually practiced the completed branch.

Escalation contracts:
- **Stealth:** stage 0 requires one successful concealed feed in a bounded Stalker risk envelope. Later stages require repeated concealed feeds and tighten the maximum predator distance, while the search radius may expand so a legitimate opportunity can still be found. Close-detection rules and canonical cover remain authoritative.
- **Offense:** later stages widen the defended learned-range envelope and raise the number of successful home-range strikes needed to hold it. A kill always completes the defense; first-stage recoil retains the v0.56 completion behavior. The encounter never spawns or relocates a Stalker.
- **Social:** later stages may recognize threats across a broader nursery area, but the encounter is only offered when enough mature founder-line adults are physically close enough to satisfy the required rally. The existing `X` rally mechanics, costs, cooldowns, retaliation, and juvenile vulnerability remain authoritative.
- **Utility:** later stages increase the minimum real source-to-shelter distance and bounded search radius for the supply run. Completion still requires pickup of canonical biomass and deposit of that same carried load into the family shelter.

`tests/strategy-arcs.mjs` is the focused regression contract for ancestry-derived streaks and branch escalation.


## v0.63.0 — Stalker temperament variation

The player-facing predator encounter authority keeps the v0.62 stalk → wind-up → charge → recovery language, but individual Needlejaws now express one of three hunt styles from their **existing inherited temperament gene**. This does not add a parallel personality stat, consume simulation RNG, or alter background predator/prey ecology.

- **Ambusher:** slower approach, lateral/flanking stalk target, later/closer commitment, strong short charge.
- **Rusher:** faster approach, wider commitment range, shorter wind-up, fastest charge, shorter recovery.
- **Wary:** measured approach, longer wind-up/counter window, slower charge, longer recovery; a successful player wound can send it through the existing player-aversion/escape path for a short retreat.
- All hit probability and damage still resolve through canonical `tryKill()`; profiles change encounter timing/approach behavior, not a second damage model.
- Player-facing objective copy may interpret the current profile so the hunt reads through behavior rather than exposing raw gene values.
- `tests/predator-variation.mjs` proves profile derivation, ambush flanking, early rusher commitment, longer wary telegraph, and wound-driven wary retreat.

## v0.89.0 — committed Stalker charges and combat footwork

The v0.62 player-facing stalk → wind-up → charge → recovery authority remains canonical, but the charge itself is now a committed path rather than a live homing target. This change is scoped to Stalkers actively hunting the controlled GenVo8 and does not alter autonomous predator/prey ecology.

- Entering wind-up snapshots a deterministic charge aim from the Stalker through the controlled animal's current position, extended a bounded distance onto valid same-land terrain.
- Once charge begins, movement targets the stored aim coordinate. Player movement after the tell must not update that coordinate. Lateral movement can therefore evade by leaving the committed lane.
- A charge that expires without contact records an evade outcome and enters the existing recovery phase. Canonical `tryKill()` remains the only authority for contact hit chance and predator damage.
- Player strikes during wind-up/recovery may receive bounded encounter-window accuracy/damage/energy modifiers through the existing `playerStrike()` path. Adaptation multipliers remain multiplicative and authoritative; no parallel health or damage state is permitted.
- During recovery, making profile-specific real distance may terminate the player hunt and create a brief existing `playerAversion` retreat. It may not teleport either animal or grant immunity.
- Renderer charge-lane marks must derive only from the stored committed aim. UI copy may explain sidestep/counter/retreat choices but may not predict RNG contact outcomes.
- `tests/combat-footwork.mjs` is the focused regression contract.

### Runtime screenshot verification workflow

`tools/runtime_screenshot.py` is the canonical actual-browser capture path for restricted environments. It does not navigate to localhost or `file://`. Instead it injects canonical `index.html`/`styles.css` into an about:blank Chromium page and fulfills a synthetic HTTPS origin directly from the project tree, allowing the real ES-module graph, renderer, UI, images, and authored-audio fetch paths to execute. The runner supports ordinary gameplay plus staged real-runtime predator phases for visible regression screenshots. Static/mock renders are not accepted as gameplay proof.


## v0.64.0 — Stalker dens and defended home ground

`StalkerTerritoryController` is a player-run-only predator-place authority. It must remain inert when `player:false` so established headless ecosystem balance is unchanged. A mature Stalker may acquire one persistent den site from its existing position and inherited hunt style; den creation may not consume simulation RNG, spawn prey/resources, alter genes, or create a second damage model.

- Active dens are ground sites, not inventories or shelters. They carry owner, center, bounded radius/core radius, presentation-only feeding trace count, and abandonment timing.
- A well-fed adult outside its normal home envelope may return toward its den. Very well-fed adults may pause/rest only when already close to the den. Hunger, hydration, mating, active player encounter phases, and canonical prey hunting retain priority.
- A controlled GenVo8 physically entering an active den may raise the owner's player-facing commitment envelope. Inside the inner core, a satiated owner may defend home ground even when ordinary hunger pressure would not start a hunt. Concealment/opening protection/same-land/canonical prey eligibility still apply.
- Existing player-aversion may use the den as a retreat destination when the player is not already occupying the deepest core. This does not cancel canonical aversion timing.
- Successful predation may increment a bounded presentation trace on the den so the scrape can show sparse remains. The trace has no nutrition or ecology authority.
- Dead-owner dens become abandoned and fade from presentation after a short simulation window; they exert no territorial pressure.
- The renderer may show a restrained ground scrape and the objective UI may warn while the player is inside the active inner core. Neither surface creates or predicts a Stalker.

`tests/stalker-territory.mjs` is the focused regression contract.

## v0.65.0 — Stalker den literacy and field sign

Persistent Stalker sites can be inspected by the controlled lineage without adding a map-reveal or raw genetics UI. At an unread active or abandoned scrape, `E` may inspect the physical sign after higher-priority combat, drinking, and prey-hunting interactions. Reading preserves camouflage, consumes no simulation RNG, and records the observation through the existing cognition history.

- Deep straight gouges communicate early/fast commitment, broken stop-start tracks communicate a hesitant hunter that may retreat when wounded, and side-scuffed drag marks communicate a circling/close-commit style.
- Learned status belongs to the persistent den site, not the current GenVo8 body, so it survives lineage handoff while that physical site remains.
- Abandoned sites remain readable until normal den fade removes them.
- The renderer may reveal tiny style-specific track details only after the site has been read; it may not add a territory radius, floating icon, or raw style label.
- Headless/player-disabled runs must expose no den-reading state or behavior.

`tests/stalker-den-reading.mjs` is the focused regression contract.

## v0.66.0 — Stalker territorial competition and den takeover

Active Stalker dens are persistent places that may change ownership. Territorial competition is a player-run-only extension of `StalkerTerritoryController`; it remains inert when `player:false` and may not consume simulation RNG, create resources, change genes, or alter canonical predator damage.

- Substantially overlapping active dens may create a rivalry between their mature living owners. Dominance is derived deterministically from existing inherited body/motion plus current health, energy, and prime-age condition. No new personality, rank, or random contest stat is permitted.
- Near-even rivals avoid the overlap boundary instead of entering endless combat. A clearly stronger rival may approach the weaker owner's scrape while the weaker resident yields as pressure reaches its core. Player-facing hunts/aversion retain priority.
- A successful takeover transfers the persistent site's `ownerId` to the challenger rather than deleting/recreating the site. The challenger's former den becomes abandoned; the displaced former owner must move clear and wait through a bounded displacement interval before establishing a new scrape.
- Existing feeding traces/site history remain bounded physical history. A takeover may reduce old feeding remains for presentation but may not create nutrition.
- If the captured site had ever been read, current tactical knowledge becomes stale: `known` clears and the site advertises changed sign until reread. The player must physically inspect the scrape again to learn the new owner's hunt tendency.
- Changed sign is communicated with restrained ground scuffs and contextual copy only; there is no ownership icon, map territory ring, or raw dominance/style label.
- All damage remains owned by canonical `tryKill()`; territorial contests themselves displace/claim rather than creating a second Stalker-vs-Stalker combat model.

`tests/stalker-territory-competition.mjs` is the focused regression contract. The canonical real-browser screenshot runner includes `den-takeover` for visible verification.



## v0.69.0 — juvenile learning and independence

Founder-line young may acquire family-taught survival knowledge before maturity. This is an extension of the existing `FamilyController` and `CognitionController`, not a new campaign/progression authority.

- Four lesson domains are tracked on each lineage child: water, food, shelter, and danger. A lesson may only be gained while the young animal is physically near a living caregiver demonstrating the relevant behavior or sharing the relevant shelter/threat context.
- Water/food/danger lessons are copied into the child's existing cognition memory with normal last-seen timing. Shelter lessons reference the canonical family shelter site. No lesson may create food, water, shelters, threats, genes, health, or other world state.
- Lessons and independence consume no simulation RNG. Repeated observation may deepen practice, bounded to three observations per domain, with at most one increment per domain per simulation day.
- Independence is derived from age, lesson coverage/practice, and current care stress. It is not inherited, does not modify genes, and does not provide hidden stat multipliers.
- Growing independence expands the distance at which a young animal tolerates caregiver separation and gradually reduces baseline nursing. Learned older juveniles/adolescents may route themselves to remembered water, food, or shelter rather than always shadowing the caregiver.
- Direct dependency/tending keeps the established family-care cutoff. Learning observation remains active until maturity so post-dependency adolescents can finish missing lessons before a lineage handoff.
- Threat response, critical thirst, and existing survival authorities keep priority over learning behavior. Family teaching must never override active predator escape, player combat, or canonical damage.
- Player-facing UI may describe learning stage, domain coverage, independence, and the next missing lesson. Generation handoff may summarize these facts as upbringing history only; they are not genetic bonuses.
- `tests/family-learning.mjs` is the focused regression contract. The canonical runtime screenshot tool includes `family-learning` for real-browser verification.


## v0.70.0 — solo practice and field readiness

- Founder-line adolescents continue from observed family lessons into self-directed practice once they are at least 55% of maturity, have learned all four family domains, have adequate energy/hydration, low care stress and no immediate predator nearby.
- Practice is deterministic and consumes no simulation RNG. The controller prioritizes the less-practiced of the learned water and food routes, provided the memory is fresh, the real resource still exists and learned Stalker landscape risk is not already excessive.
- Outbound success requires the ordinary canonical interaction: a water route only counts after real drinking; a food route only counts after consuming real plant/carrion biomass. Reaching a coordinate alone is insufficient.
- After the outbound task, the juvenile enters a return phase and must physically reach the current family shelter, or a surviving caregiver when no shelter exists. Only then does the excursion count as completed.
- Depleted remembered food, unusable water, newly unsafe learned territory or an excessively long outing aborts the route and sends the juvenile home without success credit.
- A real nearby predator interrupts an outbound practice trip. Surviving and returning home records a threat recovery, but does not award food/water route completion. Existing predator escape, shelter and survival authorities retain priority.
- Field readiness is descriptive only: both one completed water route and one completed food route plus two safe returns are required for the `field-ready` label. It does not alter genes, health, movement, metabolism or hidden combat values and does not block canonical maturity handoff.
- Upbringing/handoff history may summarize completed solo routes, threat recoveries and readiness so the next generation's preparation remains part of the lineage story.


## v0.71.0 — playable succession and takeover bearings

- Canonical lineage handoff snapshots heir readiness from existing family learning/practice state.
- The generation reveal surfaces readiness but applies no hidden stat bonus.
- Post-handoff play begins with one deterministic bearing derived only from the new heir's learned memory.
- Field-ready heirs confirm a remembered food/water route through the ordinary interaction authority.
- Underpracticed heirs reconnect with the family shelter/anchor first.
- The transition is non-blocking, bounded, consumes no simulation RNG, and writes only normal cognition/handoff history.
- Manual handoff still leaves the prior generation alive.


## Player forage physiology (v0.72)
The controlled GenVo8 distinguishes immediate food physiology without changing autonomous ecology. Nearby edible kinds can be cycled with Q when they overlap. Plant/carrion biomass remains authoritative. Reeds and fruit can restore some hydration, dense seed/carrion meals trade on energy density, carrion retains existing disease exposure, and recent food-group breadth provides only a small positive assimilation bonus. Repetition is not penalized. This layer consumes no simulation RNG and is inactive in player:false benchmarks.


## Learned forage patches (v0.73)
The controlled GenVo8 can learn plant patches as places through direct feeding. A patch record contains only locally observed information: plant kind, place, best-seen local biomass, last observed biomass, visit timing and depletion/recovery history. Harvesting does not create a separate resource pool; canonical world plant arrays remain the sole biomass authority.

Away from a learned patch, the player receives only a conservative recovery estimate derived from the plant registry's growth tendency and elapsed simulation days. The estimate never samples current off-screen plant biomass. Returning within the patch observation radius refreshes the memory from the real world state, allowing an exhausted patch to be confirmed as recovered or still thin.

When the active animal is hungry and no immediate food interaction exists, a sufficiently recent learned patch may become a route suggestion. Unknown patches never enter this decision. Patch memory consumes no simulation RNG, adds no hidden nutrition bonus, does not modify plant growth/dispersal, and is inactive in player:false ecology runs.


## Player weather exposure (v0.75)

`gameplay/weather-exposure.js` may interpret the simulation's already-authoritative `climate.temp` and `climate.rain` values for the currently controlled GenVo8 only. It must not roll weather, advance the climate RNG, mutate world moisture/temperature, or affect `player:false` ecology.

- Rain can accumulate bounded wetness while the active animal is outside. Canonical vegetation cover may reduce rain loading; a usable family shelter provides the stronger protection.
- Cold stress is derived from canonical air temperature and current wetness. Hot stress is derived from canonical air temperature. Outside opening protection, cold stress may add a modest energy cost and hot stress a modest hydration cost. The controller must not directly modify genes, adaptation eligibility, disease rolls, reproduction, wildlife metabolism, plant growth, or predator damage.
- Shelter proximity may rapidly reduce accumulated wetness/strain. The existing shelter integrity remains authoritative for the strength of that protection.
- Exposure state is qualitative in normal HUD/objective presentation. No permanent numeric exposure meter is required. Significant exposure may temporarily guide the active animal toward a real family shelter after higher-priority predator/offspring/succession needs.
- Optional learned-forage route scoring may include a bounded current-weather travel penalty so severe exposure discourages long discretionary trips. The patch memory itself remains non-omniscient and unchanged.
- Renderer rain is presentation-only and deterministic from current climate/time; it cannot create weather state or consume simulation RNG.


## Shelter weatherproofing and storm maintenance (v0.76)
- Family shelters retain structural `integrity` and add a lightweight `weatherSeal` state inside the same shelter authority. No separate construction inventory or RNG is introduced.
- New shelters begin substantially weather-tight. Heavy rain and temperature extremes gradually wear the seal; ordinary structural weather wear remains canonical.
- The existing **N** action repairs structural damage first when the shelter is badly damaged, otherwise reinforces a weathered roof with real nearby plant biomass. Reinforcement costs animal energy and records an ordinary cognition/history event.
- Shelter rain/thermal protection reads combined structure + weatherproofing quality. A weak/weathered shelter may visibly leak and no longer suppress player weather exposure as strongly as a maintained refuge.
- The player-facing condition is qualitative (`Reinforced`, `Holding`, `Weathered`, `Leaking`). No permanent weatherproofing HUD meter is added.
- Background/player-off ecology remains unaffected because founder shelters are never created in `player:false` benchmark runs.


## Family storm refuge behavior (v0.77)
- `gameplay/family-weather.js` may interpret the already-authoritative climate + family shelter state for founder-line behavior in live player runs only. It must not roll weather, consume simulation RNG, or create per-animal exposure state for background ecology.
- Severe rain/cold/heat may interrupt low-priority activities for nearby founder-line dependents, learning adolescents, parents with dependent young, and nearby adult descendants, routing them toward a real family shelter they are allowed to use.
- Immediate predator response and critical hydration remain higher priority than refuge behavior. Rough weather may abort an outbound juvenile solo-practice run, but it cannot grant practice success.
- Family refuge completion is spatial: members count as under cover only while physically within the shelter radius. Refuge moments may be recorded in ordinary family/cognition history but grant no hidden stat, gene, or permanent buff.
- The player presentation stays qualitative: dynamic objective copy and the existing Shelter panel may show family/young under cover. No permanent storm/refuge meter or new construction inventory is authorized.
- The authority must be inert in `player:false` runs and must not alter population ecology, plant growth, migration scoring, reproduction, or weather generation.


## Post-storm regroup and recovery window (v0.78)
- `FamilyWeatherController` may retain a bounded aftermath record after an actual live-run refuge episode ends. It may remember founder-line low-priority interruptions and juvenile solo-practice routes, but must not create new ecology state or consume simulation RNG.
- A storm-aborted juvenile practice route may be restored only as an outbound attempt using the same learned destination. The normal family practice authority remains responsible for real food/water interaction, return-home proof, success, failure, and predator interruption.
- Dependent direct young that sheltered with the family may be checked/reassured through the ordinary **E** interaction after higher-priority combat, drinking, hunting, and urgent care. The check may modestly reduce existing care stress and record normal history; it grants no genes, readiness, health, or hidden stat bonus.
- A recent heavy-rain aftermath may temporarily increase the *estimated* recovery rate of already-learned moisture-loving forage patches. This is memory inference only: no off-screen plant arrays may be read to confirm recovery until the player physically revisits the patch.
- The aftermath must expire automatically, remain inert when `player:false`, and never alter global climate, plant growth, wildlife metabolism, reproduction, or background family behavior outside the founder-connected live run.


## Player Marsh fever recuperation (v0.79)

`gameplay/illness-recovery.js` interprets the already-authoritative disease state for the currently controlled founder-line GenVo8 only. It must not create infections, change exposure rolls, consume simulation RNG, or modify background disease behavior.

- Ordinary `DiseaseController` remains the sole infection/transmission/course/immunity authority. Contact, mating, shared shelter, environmental and carrion exposure remain unchanged.
- Recuperation uses existing movement, shelter, vegetation cover, food/water condition and family proximity. No rest key, treatment inventory or medical resource is introduced.
- Quiet rest under a family shelter gives the strongest reduction to the existing infection energy/hydration/health cost. Quiet isolation in dense vegetation away from nearby GenVo8 gives a smaller reduction. Ordinary cover/exposed rest is weaker; sprinting while infected raises the existing physiological cost.
- A supported recovery day requires sufficient accumulated rest plus adequate energy and hydration. Every two supported days may shorten a long infection course by one day, capped at two shortened days and never below the canonical minimum duration of four days. This alters only the active player's current infection duration; disease genetics and future susceptibility are unchanged.
- Shared shelter transmission remains active while the player rests there. Presentation may therefore warn that strong shelter recuperation also keeps susceptible family members in the existing close-contact exposure route. Isolation does not create immunity or a transmission shield; it merely reduces proximity.
- On recovery, canonical temporary acquired immunity remains unchanged. The recuperation controller may record a descriptive cognition/history event and expose a brief convalescent label, but it grants no health, gene, adaptation or lineage bonus.
- The controller must remain inert in `player:false` runs and must not create `illnessCare` state for background/headless animals.


## v0.82 player injury / recuperation overlay
- Canonical predator damage remains owned by `Simulation.tryKill()`. The player-only injury controller only reacts after real damage has already been applied.
- Surviving hits can create `sore`, `wounded`, or `severe` recovery states based on damage and remaining health.
- Wounds modestly reduce manual movement and raise movement cost; sprint stays available for emergency escape but adds recovery strain.
- Quiet family-shelter rest speeds daily wound recovery most, dense-cover rest helps, and remaining active heals more slowly.
- Injury state drives existing limp/body-language presentation plus compact HUD/objective guidance. It creates no item inventory, medical crafting, genetic modifier, combat roll, or background-ecology state.
- The controller consumes no simulation RNG and is inert when `player:false`.


## Population-center ecology (v1.09)

Generation 3 population centers are persistent activity anchors, not owned resource nodes. `PopulationCenterEcologyController` evaluates the 3x3 territory-cell neighborhood around each center using real GenVo8-edible plant biomass, grazing/recovery history, overlapping non-predator feeders, nearby predators, and grown family load. The resulting local score maps to STRONG, VIABLE, CONTESTED, or CRITICAL status and a dynamic carrying-capacity estimate.

Center ecology is read-only with respect to world resources. It does not create food, remove competitors, or alter plant growth. Its behavioral consequence is routing pressure: when an assigned center is overloaded or locally stressed, deterministic members of that center cohort can use a stronger neighboring cell as temporary relief ground while the physical center remains persistent. New G3 ranging sites and satellite nests also consult this viability layer so expansion location matters before a center is established.

The system intentionally stops short of speciation. It records the ecological differences that can later become lineage-specific selection pressures while keeping current population centers part of one ancestral lineage.


## v1.11.0 population-specific pressure memory

`PopulationPressureMemoryController` is a prospective, read-only bridge from the G3 population split toward later speciation. It records separate lived histories for the original Home Range and each persistent population center. It must not mutate ecology, genes, adaptations, reproduction, species identity, AI intent, or RNG.

The pressure profile uses eight descriptive axes: food scarcity, competition, predation, crowding, dryness, wetness, heat, and cold. Values come from existing population-center ecology plus canonical world moisture and temperature around each population. Each population accumulates daily exposure, recent pressure, and peak pressure. Individual lineage members separately accumulate residence days by population, allowing a future divergence pass to distinguish where a descendant was actually raised.

Secondary adults use their canonical G3 population assignment when available. Younger lineage members can acquire secondary-population residence by physically living near that center, so population upbringing is not restricted to adult command assignments. The Population and Home Range inspectors may expose recorded days, dominant pressures, and a descriptive separation score. Generation handoff presentation may report a descendant's dominant population upbringing. None of these summaries changes survival or inheritance in v1.11.

A pressure-history difference may produce a concise contextual notice after both Home and a secondary population have at least three recorded days and a meaningful separation has emerged. The notice is informational only. Proto-speciation remains deferred to a later prospective record.


## v1.12.0 first proto-speciation

`ProtoSpeciationController` is the first consumer of the prospective v1.11 population-pressure and residence records. It is deterministic, consumes no simulation RNG, and remains separate from `EvolutionController`, `LineageDivergenceController`, and species identity.

A descendant can first receive a proto-trait at Generation 4 or later. The physical population around the birth location must have at least five recorded pressure days, there must be at least one other population with five comparable days, and the average absolute pressure-history separation between the two must be at least 0.12. A candidate pressure must be at least 0.28 in the birth population and at least 0.18 stronger than the comparison population. At least one parent must have three recorded residence days in the same birth population with a residence share of 0.55 or greater. These gates prevent a newly created center, transient visit, or UI selection from fabricating inherited divergence.

The first pressure-to-trait mappings are: scarcity -> Frugal Frame, competition -> Range Sense, predation -> Watch Crest, crowding -> Close-Brood Frame, dryness -> Dryland Skin, wetness -> Splayfoot, heat -> Heat-Shed Mantle, and cold -> Cold Mantle. A descendant receives at most one proto-trait in v1.12. Same-population parental inheritance may modestly deepen the trait only while the corresponding population pressure remains qualified.

Mechanical effects are intentionally smaller than discrete adaptations: roughly 4-8% changes to resting energy use, food-search reach, threat sensing, shelter protection, water use, wet-ground travel, or heat/cold strain. Proto-traits are stored separately on `animal.populationTrait` and `LineageTracker` records. They do not add adaptation IDs, change mating rules, rename species, or create a species-selection menu.

Presentation may exaggerate the small inherited physical difference slightly so a player can notice it at pixel scale. Generation handoff, Population, and Home Range views may explain the population of origin, recorded cause, and modest effect. Player-facing text must continue to call this proto-divergence and state that GenVo8 remains one species until a later, stricter speciation authority is explicitly introduced.

## v1.13.0 proto-trait persistence and gene flow

Proto-divergence is now multi-generational rather than a one-birth marker. A pressure-derived trait remains one expressed population trait per animal, but its strength and inheritance state can change deterministically across descendants.

When a descendant is born in the same population under the same still-qualified pressure and a parent expresses the matching trait, the local trait may reinforce. Reinforcement increases expression gradually, records lineage depth, and never stacks a second proto-trait or consumes simulation RNG.

When a descendant is born where the originating pressure is no longer qualified, a parental proto-trait may persist at reduced strength. Continued unsupported inheritance can therefore weaken the expression instead of erasing it immediately. The trait retains its origin population separately from the descendant's current birth population so migration does not rewrite evolutionary history.

If parents carry different proto-traits, the birth population's locally supported trait remains the only mechanically active expression. The other parental trait is recorded as mixed ancestry, reduces the local expression modestly, and may add a restrained secondary visual mark. Gene flow never grants both proto-trait mechanical bonuses to one animal.

Population and generation presentation may identify reinforced, persisting, mixed, and weakening expressions. These states remain proto-divergence only. Every descendant continues to use species id `genvo`; no reproductive barrier, taxonomic split, or separate-species authority exists in v1.13.

## v1.14.0 reversible species threshold

`SpeciationController` is a separate population-level authority that consumes the prospective records already produced by population pressure memory and proto-trait inheritance. It must not invent ecological history, roll random speciation events, or duplicate GenVo8 into a second engine species implementation. Recognized descendant species continue to use base registry id `genvo` for diets, predation, locomotion, family systems, disease, and rendering. Player-facing taxonomy is stored separately on `animal.speciesBranch` and lineage records.

Only established secondary populations may cross the threshold in v1.14. A candidate needs at least ten recorded local pressure days, pressure-history separation of at least 0.18, physical separation of at least sixteen world tiles from Home Range, three or more resident grown lineage members, and a dominant local proto-trait carried by at least two members and at least 58% of the resident cohort. The dominant trait must average at least 0.36 expression, have reached lineage depth three, and still be supported by a local pressure at least 0.16 stronger than its comparison population.

Reproductive evidence is required independently from ecology and morphology. The population must have at least four recent local births, at least four recent measured births total, and recent cross-population gene flow no higher than 25%. Qualification must persist across two daily evaluations before recognition. This prevents one unusual litter, a newly founded center, or an isolated trait carrier from instantly creating a species.

Recognition assigns a deterministic descendant-species identity based on the established population and its dominant proto-trait. Examples include Range GenVo for Range Sense and Dryland GenVo for Dryland Skin. The existing proto-trait remains the only population-derived mechanical modifier; species identity itself adds no hidden stat bonus. Current resident carriers and later locally adapted descendants may receive the branch identity, and generation presentation can explain the exact evidence that crossed the threshold.

The first species boundary is intentionally reversible. Recent births involving ancestral or other population parents count as gene flow for every involved population. If cross-population reproduction rises to roughly half of recent measured births for sustained evaluations, or if population histories strongly converge, the young species boundary can collapse. Current animals then stop being presented as a separate species, while historical lineage records remain evidence that a split had previously occurred. Reproductive compatibility is therefore preserved in v1.14 so continued interbreeding can test and reverse the boundary instead of speciation becoming a one-way scripted unlock.


## v1.15.0 living evolutionary tree

`EvolutionaryTreeController` preserves the taxonomic history produced by `SpeciationController` without becoming a second speciation authority. The threshold controller remains responsible for deciding whether a population is currently recognized. The tree records what branches have actually formed, their parent branch, their founding population, current living membership, and historical outcome.

The root taxon is GenVo8. A recognized descendant branch may coexist with living ancestral GenVo8, and each living taxon is counted independently from engine-level `SPECIES.genvo`. Current taxonomic identity is still stored on `animal.speciesBranch`; lineage records additionally retain `speciesBranchHistory` so a later rejoin does not erase the fact that an ancestor belonged to a recognized species while that boundary existed.

A collapsed young boundary becomes a REJOINED historical branch. A recognized branch with no remaining living members becomes EXTINCT. Both nodes remain in the tree and retain known historical member counts. Neither state grants or removes adaptations, changes the organism registry, or rewrites ecological history.

When a new threshold is crossed, the tree inspects the founding cohort before assigning the new identity. If a recognized descendant species is the cohort's dominant current taxon, the new branch records that descendant species as its parent; otherwise it branches from GenVo8. Physical separation for the threshold is measured from the parent branch's origin population when available. This supports later second-order divergence on either side of an existing split rather than forcing every future species into a flat star centered on Home Range.

The Population inspector may render this hierarchy with LIVING, ANCESTRAL, REJOINED, or EXTINCT states plus living-member and occupied-population counts. The default HUD is unchanged. The tree is deterministic, consumes no simulation RNG, and provides taxonomy/history only; inherited proto-traits remain the mechanical population adaptations.

## v1.16.0 species-level leadership

Living taxonomic branches now constrain ordinary family guidance when more than one recognized taxon coexists. `FamilyDirectiveController` keeps an explicit guidance scope. In a one-taxon lineage the effective scope remains the whole lineage for backward-compatible founder play. Once multiple taxa are alive, the default effective scope is the active creature's taxon. The player may explicitly switch to whole-lineage scope through the existing radial family-guidance control.

Broad directives and radial area orders are filtered by taxon only after immediate survival needs. Every local order stores the scope and taxon that existed when it was placed, so a later leadership handoff or scope toggle cannot silently retarget an existing order. Re-marking an Avoid area updates its stored scope as well as its location. No order changes species identity or suppresses autonomous survival behavior.

`ReproductionController` continues to use base-species compatibility and existing kin/readiness rules. When several living taxa exist, eligible mates from the active taxon sort ahead of compatible cross-taxon mates. Cross-taxon pairs remain selectable and fertile so gene flow can continue to maintain or collapse a young species boundary. The mate inspector must identify such a pairing as gene flow before courtship begins.

`LineageTracker` prefers same-taxon descendants when selecting a successor but does not prohibit a deliberate cross-taxon handoff. A handoff between living branches records source and destination taxa for generation presentation and resets family guidance to taxon scope. This preserves direct creature possession while making branch leadership an explicit choice rather than an invisible side effect.

`EvolutionaryTreeController` supplies taxon identity, labels, same-taxon comparison, and leadership summaries. It remains a taxonomy/history authority only. v1.16 introduces no new evolutionary threshold, species bonus, reproductive barrier, or RNG consumption.



## v1.17.0 species coexistence and branch territory

`SpeciesCoexistenceController` is a consequence layer over living taxonomic identity. It must not create food, rewrite pressure history, grant species bonuses, or decide whether speciation occurs. It reads `EvolutionaryTreeController`, `PopulationPressureMemoryController`, `PopulationCenterEcologyController`, ordinary lineage positions, and existing biomass/competitor data.

Every living taxon has an origin population inherited from its evolutionary-tree node. While multiple taxa coexist, population-center carrying assessment distinguishes members of the origin taxon from other living GenVo taxa physically using the same area. Other taxa count as cross-taxon competitors in addition to ordinary wildlife competitors. The same forage, grazing, predator, and capacity authorities therefore determine whether coexistence is sustainable.

A taxon's dynamic population priority is derived from its origin population. Cross-taxon overlap may call for range separation; low carrying quality may call for relief; low resident share may call for consolidation; otherwise nearby stronger habitat may be suggested as optional expansion. These are contextual goals only. They create no reward currency and do not override urgent survival, family care, weather, illness, injury, or explicit player commands. A deterministic subset of autonomous adults may follow a relief target when branch pressure is substantial.

Autonomous reproduction prefers same-taxon compatible unrelated mates when multiple taxa are alive, then falls back to ordinary compatible cross-taxon mates if no same-taxon option is available. This preserves gene flow without making constant boundary-crossing the default autonomous behavior. Player courtship remains explicitly selectable as in v1.16.

Taxon-scoped Nest orders carry their scope into `ShelterController`. Only matching adults contribute construction work. While multiple taxa coexist, a taxon-scoped finished shelter is usable by that taxon rather than automatically by every descendant in the lineage. Completion registers a `species-settlement` population center tagged with the taxon identity. Population memory can therefore begin recording a distinct lived history there without any retroactive assignment.

Settlement preference is advisory except at the extreme poor-fit boundary. It combines actual cell ecology, cross-taxon overlap, predator danger, and the habitat direction implied by the branch's established proto-trait (for example dry-ground, wet-ground, thermal, low-competition, or low-predator preference). This does not alter inherited trait mechanics; it only makes branch settlement choices react to the ecological history that created the branch.

The system is deterministic and consumes no simulation RNG. Engine species remains `genvo`; taxonomy and speciation remain owned by the v1.14-v1.16 authorities.


## v1.18.0 emergent species lifestyles

- `SpeciesLifestyleController` records species-scale behavior and environment without consuming RNG.
- Lifestyle establishment is gated to G4+ taxa with at least two adults, three recorded pressure-memory days, and three consecutive days of qualifying evidence.
- Initial lifestyles are Aquatic, Nomadic, Guardian, and Burrower. They emerge from lived water travel, ranging/residence patterns, predator defense, shelter use, inherited lineage form, and already-earned adaptations.
- One established lifestyle is expressed per living taxon in this pass. It is stored on the evolutionary-tree node and copied to current taxon members for rendering, generation presentation, and mechanical queries.
- Aquatic modifies swimming/land movement and swimming energy use. Nomadic modifies land movement, travel energy, forage range, and habitat preference. Guardian modifies threat sensing and shelter defense. Burrower modifies nest material cost, shelter protection/thermal insulation, open movement, and denning-site preference.
- Lifestyle effects route through existing movement, foraging, shelter, coexistence, UI, and rendering authorities. They do not create a second adaptation registry or taxonomic threshold.
- The default HUD remains unchanged. Forming/established lifestyle state is exposed through Task Guide, event feedback, generation reveal, and optional Population diagnostics.
- Hunter and grazer/diet specializations are deferred to a later pass.

## v1.21.0 G2 brood homes and autonomous locomotion presentation

A paired G2+ descendant may establish one direct brood shelter before the population-scale satellite-nesting thresholds are satisfied. This route is intentionally limited to a second household, not unlimited early settlement. The active descendant must have a recorded mate, the pair must not already own a brood shelter from this route, the new site must be dry and supplied, and it must be at least 7.5 world tiles from an existing usable family shelter. Eligible paired G2+ play therefore has an early shelter capacity of two; further population-scale expansion remains governed by the existing satellite-nesting authority.

The brood home is a normal `ShelterController` structure. It consumes the canonical build materials/energy, participates in family shelter use, and records the founding pair and generation. The G2 pregnancy/birth-preparation task prefers the pair's new brood home for return, stocking, and birth preparation so finding a distant mate can naturally lead to founding a new household instead of forcing the lineage back to the founder shelter.

Autonomous creature movement remains authoritative at the existing ecology cadence. Presentation between those authoritative poses now uses constant linear interpolation rather than an ease-in/ease-out curve that visibly stopped and restarted on every simulation beat. `VisualMotionTracker` reports whether a segment is still in transit so the renderer keeps the walking gait active for the complete visual crossing. This is presentation-only: AI decisions, movement speed, pathing, simulation timing, and RNG are unchanged.

The v1.18.1 responsiveness contract remains release-critical. Long movement probes must not reintroduce main-thread hitching merely to improve autonomous locomotion presentation.


## v1.22.0 autonomous gait articulation

- Autonomous render gait phase is presentation-only and accumulates from actual interpolated travel distance. Canonical `animal.anim`, movement cadence, targets, and positions remain simulation-owned.
- A short recently-moving presentation seam keeps adjacent ecology segments from visually dropping to idle between 8 Hz updates, but does not move an animal beyond its authoritative interpolated segment.
- While moving, autonomous facing may use the current visual travel heading so limb/body orientation matches the path being rendered.
- GenVo high-step legs remain fully articulated: lifted feet fold inward and use a lighter raised-foot treatment instead of dropping the distal leg/toe.
- All visible autonomous fauna receive the distance-driven gait phase; species-specific renderers still own whether that phase appears as walking, hopping, digging locomotion, or predatory prowl.
- No simulation RNG, AI decision, speed, pathing, collision, metabolism, ecology timing, or save-state authority is changed. The v1.18.1 worst-frame latency baseline remains a release gate.

## v1.23.0 species body-language animation

The v1.22 presentation gait remains the only locomotion presentation authority. v1.23 does not increase AI cadence or alter authoritative movement. Instead, the existing non-GenVo fauna renderer consumes the continuous fractional gait phase to express species anatomy continuously.

- **Hopper:** the hop arc now has explicit launch, airborne tuck, and landing/replant states. Both fore and hind leg pairs remain articulated, and ears trail during airborne travel.
- **Digger:** rear, middle, and front body masses counter-wave during travel. Left and right mole claws alternate strokes and a low belly-traction mark helps the body read as pulling through ground rather than translating rigidly.
- **Stalker:** the four legs use diagonal support pairs with explicit plant/recovery values. Shoulder roll, counter-moving head motion, and a balancing tail sweep produce a low prowl instead of a rigid body glide.

These are deterministic renderer-only poses. AI intent, pathfinding, collisions, combat, movement speed, ecology timing, RNG, and saves remain unchanged. The v1.18.1 worst-frame performance contract is still a release gate.



## v1.24.0 persistent lineage saves

Persistence is a browser-side presentation/runtime service over canonical simulation authorities. It does not create a parallel simplified game state. Save schema 1 captures the current RNG state, mutable world fields, all animal records and object references, and the own state of each simulation controller while omitting derived spatial buckets and direct controller-to-simulation backreferences. Loading constructs the normal controller graph without bootstrap spawning, restores the structured-clone state, rebinds controller `sim` references, restores mutable world arrays into the seed-generated world, and rebuilds spatial buckets.

IndexedDB is the canonical storage backend. Metadata is kept in a separate small IndexedDB store so the welcome screen can discover a save without loading the full simulation payload. Autosaves are debounced and scheduled through browser idle time during ordinary play, with a real-time periodic save plus event-signature saves for major lineage changes. Manual Save now and Load last save controls are available in Help. A saved lineage is local to the current browser/device.

Schema/version mismatch is fail-closed: an unsupported save is not partially applied. The persistence layer does not run inside the 64 Hz control path or 8 Hz ecology authority.

## v1.25.0 Hunter and Grazer diet divergence

The species-lifestyle authority now recognizes two additional taxon-scale ways of life from prospective food-web behavior. Hunter and Grazer use the same sustained-evidence rule as the existing Aquatic, Nomadic, Guardian, and Burrower lifestyles. They are not adaptation choices and do not create a second skill tree.

- Hunter evidence combines real live-prey attempts and kills with adult offensive anatomy. Qualification requires at least one successful kill and cannot be produced by carrion alone. Established Hunter adults may autonomously target edible wildlife when hungry, receive a bounded live-prey energy and hunting-success advantage, and receive less value from plants.
- Grazer evidence combines repeated plant meals with Efficient Gut and inherited Forager-form representation. Established Grazer adults begin plant foraging before generic deep hunger, search productive vegetation somewhat farther, and receive more energy from plants while animal foods become inefficient fallbacks.
- Food evidence is recorded per taxon per day and cleared after the normal lifestyle daily evaluation. Missing v1.24 diet fields normalize to zero so restored saves remain valid under save schema 1.
- CarryingPressureController consults an established Hunter feeding mode. Hunter branch reproduction therefore depends on nearby edible prey, while all non-Hunter GenVo8 branches continue using local plant forage. Engine safety ceilings remain emergency limits only.
- `phenotypeFor()` and the shared GenVo renderer add restrained Hunter and Grazer silhouette/mark differences. These are presentation-only and do not modify collision radius, authoritative position, pathing, or ecology cadence.
- The feature consumes no RNG for lifestyle scoring or establishment. All search work is bounded to existing local spatial queries or small local plant samples, preserving the v1.18.1 responsiveness contract.



## v1.27.0 family agency and readable-data authority

Family switching is a control-layer operation, not a lineage succession event. Once more than one living founder-line GenVo8 exists, `Tab` may move the player flag and `playerId` between those living lineage members. `LineageTracker.activeId` remains unchanged until the explicit handoff authority commits succession. `Shift+Tab` cycles in reverse.

The selected creature may also enter player automation from the quick menu. In automation, the selected creature is allowed through the same autonomous decision authorities used by relatives instead of being forced into the manual-player idle branch. Any direct movement or world interaction disables automation immediately and restores manual control.

Death handling must preserve the distinction between temporary control and lineage leadership. Death of the active lineage lead resolves canonical succession even when another relative is selected. Death of a temporarily selected non-lead relative restores control to a surviving lineage member without changing the lineage lead. Exactly one living animal may carry the player flag after either transition.

The Population, Home Range, and related readable inspectors must not depend on tiny disclosure markers. Expandable rows use the full summary row as the pointer target with a minimum 36 px row height and a visibly bounded 22 px expand/collapse marker. Keyboard focus must receive the same visible affordance.

This pass introduces no new save schema and must preserve the v1.18.1 frame-time stability contract.

## v1.26.0 food-web feedback

Established diet lifestyles now alter ecological behavior around the lineage instead of remaining one-sided feeding modifiers.

- `Simulation.isPredatorTo(pred, prey)` is the shared authority for ordinary prey recognition. Native Hunter species still use their species diet. An established Hunter GenVo8 is additionally treated as a predator only for wildlife species that the GenVo8 diet can consume. Non-Hunter GenVo8 does not create predator pressure merely by being nearby.
- Autonomous prey threat decisions and the existing social alarm system both consult the shared predator query. Hoppers and Diggers can therefore flee from a Hunter GenVo8 and relay that danger through their existing social behavior without adding a second alarm system.
- Stalker-specific den ownership, player hunt choreography, territory rivalry, and opening-grace rules remain tied to native Stalkers. The shared predator query is not permission to route Hunter GenVo8 through Stalker-only authorities.
- Grazer forage ranking consults existing environmental-history grazing and recovery values. Repeatedly worked cells receive a bounded freshness penalty while recovered cells receive a small preference. This changes target selection only; plant biomass and regrowth remain owned by the world/history systems.
- `grazingGroundState()` summarizes local plant value plus grazing/recovery history. When current ground is genuinely depleted, an established Grazer adult may rotate toward fresh forage before reaching the normal deep-hunger threshold. Search remains local and bounded.
- The Grazer lifestyle task can surface `Move to fresh grazing`, while Hunter task text explains that prey now recognize the branch as a predator. No new permanent HUD panel is added.
- Save schema 1 remains valid. No new independent persistence authority or RNG consumption is introduced. The v1.18.1 responsiveness contract remains a release gate.
