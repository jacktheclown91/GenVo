# GENVO — MAJOR VISUAL & AUDIO EVOLUTION

## Comprehensive Art Direction, High-Resolution Pixel Art, Procedural Animation, Environmental Presentation, and Sound Design

**Project:** GenVo
**Repository:** `jacktheclown91/GenVo`
**Starting baseline:** Latest verified `main`
**Reference checkpoint:** `1ba0c3e1` — October 28, 2026
**Primary agent:** Codex
**Systems and integration agent:** Claude
**Project creator:** Final authority on artistic direction and releases

---

# 1. PRIMARY OBJECTIVE

Transform GenVo's presentation from a technically functional pixel-art evolutionary simulation into a visually distinctive, expressive, atmospheric, and cohesive living world.

This is a major implementation assignment.

The objective is not simply to correct existing rendering bugs, increase audio levels, adjust animation timings, or produce design documentation.

**The objective is substantial, observable improvement to the playable game's visual and auditory quality.**

Every major improvement must reinforce GenVo's defining identity:

> A living planet where creatures evolve, reproduce, survive, compete, migrate, and change over generations through actual simulated biology.

The game's appearance must express its simulation.

A creature's physical anatomy should influence how it looks and moves.

Its environment should influence how the surrounding world appears and sounds.

Inherited changes should be recognizable.

The player's interactions should feel responsive, intentional, and understandable.

The world should feel biologically inhabited rather than procedurally populated.

## Fundamental requirements

1. Preserve existing biological and environmental simulation authorities.
2. Build on the established modular creature renderer rather than replacing the game.
3. Preserve the eight-direction movement and animation conventions.
4. Maintain compatibility with existing saves and creature anatomy.
5. Use real simulated conditions to drive visual and auditory behavior.
6. Preserve existing human-origin artwork and development provenance.
7. Coordinate shared-file changes with Claude.
8. Prioritize complete, visible improvements over numerous insignificant patches.
9. Implement work directly in the repository.
10. Continue through the development packages rather than stopping after the initial audit.

**Reading this objective, inspecting files, or writing a report does not complete the assignment.**

This goal is complete only when its specified improvements have been implemented, integrated, and evaluated against the acceptance criteria.

---

# 2. RESEARCH AND ARTISTIC FOUNDATION

Use the following games and development research as technical inspiration.

Do not copy their protected artwork, audio, characters, or other expressive assets.

## Rain World

Study its approach to:

* Procedural creature animation.
* Ground contact and movement.
* Creature behavior expressed through posture.
* Environmental atmosphere.
* Layered positional audio.
* Predator presence and threat communication.
* Interaction between simulated movement and visual expression.

The important lesson is that creatures should not merely play animations while their positions change.

Their movement should visually emerge from their anatomy and behavior.

## Spore

Study Chris Hecker's work on procedural animation for unpredictable creature anatomies.

Relevant research:

*How to Animate a Character You've Never Seen Before.*

Apply the principles to GenVo's modular body plans.

GenVo must support widely varying creature configurations without requiring a separate handcrafted animation for every possible organism.

## Niche: A Genetics Survival Game

Study the visual readability of inherited characteristics.

A player should recognize meaningful anatomical differences between parents and offspring without needing to inspect genetic data.

## Caves of Qud

Study its visual identity, information hierarchy, readable interfaces, and ability to present complex systems without constantly overwhelming the player.

## Dwarf Fortress

Study how complex simulation states can be translated into observable world events and information displays.

## Additional research

Consult procedural locomotion research, inverse kinematics, gait coordination, contact-aware animation, pixel-art readability, dynamic game audio, and adaptive soundscape design.

Use research to guide concrete implementation.

Do not spend an entire development session gathering references without producing improvements.

---

# 3. WORK PACKAGE A — HIGH-RESOLUTION PIXEL ART EVALUATION

**Priority: CRITICAL**

GenVo currently uses native 32×32 artwork.

The creator has approved investigating a significant increase in artwork detail.

However, do not automatically convert the entire catalog to 128×128.

First establish whether higher-resolution artwork materially improves the appearance of creatures at normal gameplay scale.

## A1. Build a controlled resolution comparison

Create three genuinely authored visual representations of the same creature:

**Candidate A — Native 32×32**

Use the current artwork as the reference.

**Candidate B — Native 64×64**

Create a more detailed version with improved proportions, shading, silhouette, textures, and anatomical definition.

**Candidate C — Native 128×128**

Create a substantially more detailed representation suitable for larger creature previews and potentially high-detail gameplay.

The 64px and 128px candidates must be actual artwork improvements.

Simple nearest-neighbor enlargement of the existing sprites is not sufficient.

Preserve consistent anatomy, color identity, orientation, and proportions between versions.

## A2. Select representative organisms

Use multiple actual GenVo body configurations.

Include at least:

1. A small, relatively simple terrestrial creature.
2. A creature with distinctive fur or feathers.
3. A creature with clearly different anatomy, such as a shell, wings, specialized limbs, or an elongated body.

These organisms should test the limitations of the modular rendering system.

Do not create three unrelated demonstration characters that cannot be assembled using the game's actual anatomy.

## A3. Compare at actual gameplay scale

Display all three resolutions using the same world-camera scale.

Compare them at:

* Typical gameplay zoom.
* Closer gameplay zoom.
* The Creature Lab preview size.
* An enlarged inspection or evolution view.

Compare the following characteristics:

**Silhouette readability:** Can the player identify the creature's general body structure?

**Anatomical readability:** Can the player distinguish fur, feathers, eyes, claws, wings, shells, and limbs?

**Color readability:** Do pigmentation and pattern variations remain visible?

**Animation clarity:** Do movement frames remain coherent?

**Pixel consistency:** Does the result maintain an intentional pixel-art aesthetic?

**Visual density:** Does the creature become too detailed relative to surrounding terrain?

**Performance:** Does the increased artwork resolution introduce meaningful rendering or memory costs?

## A4. Evaluate modular compatibility

The comparison must use the real modular creature system.

Test representative torso, head, limb, eye, mouth, tail, covering, and dorsal attachments.

Check:

* Attachment positions.
* Layering.
* Pivot alignment.
* Eight-direction consistency.
* Animation transitions.
* Pigmentation.
* Variable proportions.
* Juvenile scaling.
* Different limb arrangements.
* Existing inherited body plans.

Avoid building a demonstration sprite that works only when assembled as one fixed image.

## A5. Resolution decision

Produce a comparison report with actual screenshots and measurements.

Evaluate whether GenVo should use:

**Option 1:** Improved 32×32 gameplay art with 128×128 inspection artwork.

**Option 2:** 64×64 gameplay art with 128×128 inspection artwork.

**Option 3:** A 128×128 gameplay-art pipeline, if it demonstrably improves normal-scale presentation and remains practical.

The preferred experimental direction is:

**64×64 for detailed world creatures and 128×128 for Creature Lab and close-up presentation.**

However, evidence must determine the final recommendation.

Do not discard 32×32 support.

Do not globally change the game's artistic resolution until the comparison is reviewed.

### Package A deliverables

* Native 32/64/128 comparison artwork.
* At least three representative creature configurations.
* Eight-direction visual comparisons.
* Representative locomotion examples.
* Normal-zoom screenshots.
* Creature Lab close-ups.
* Rendering and asset-memory measurements.
* Written evaluation of strengths and weaknesses.
* A functional higher-resolution rendering prototype.

**Completion criterion:** We can directly compare the same actual GenVo creatures across all three resolutions and identify meaningful differences in quality.

---

# 4. WORK PACKAGE B — MODULAR CREATURE ART PIPELINE

**Priority: CRITICAL**

After establishing the resolution comparison, improve the artwork pipeline so higher-detail creature assets can be developed without breaking existing anatomy.

## B1. Support multiple artwork resolutions

Extend the existing asset system to support versioned artwork resolutions where justified.

Review:

`assets/art/parts/`

`assets/art/catalog.json`

`src/render/indexed-part-renderer.js`

`src/render/creature-assembler.js`

`src/render/part-sprites.js`

`src/render/genvo-draw.js`

And the existing sprite authoring/export tools.

Preserve the current 32px assets.

Where appropriate, add optional higher-resolution assets and explicit metadata describing their dimensions, alignment, and attachment positions.

Do not create a completely separate creature renderer for each resolution.

## B2. Preserve anatomical consistency

The same body plan must produce the same recognizable creature across supported artwork resolutions.

A creature must not change physical proportions simply because a different art asset is selected.

Maintain consistent sockets, attachment order, and orientation.

## B3. Improve part-specific artistic detail

Prioritize visually defining anatomical structures.

### Torso

Improve body volume, contour, pigmentation, material shading, and anatomical connection points.

### Heads

Improve the relationship between the head, neck, eyes, mouth, and other sensory structures.

### Eyes

Make specialized eye structures visibly different.

Support recognizable eyespots, compound eyes, stalk eyes, and other existing eye types.

### Limbs

Improve leg thickness, joints, claws, pads, and movement-related visual structure.

### Fur

Create recognizable layered coverings.

Support visual differences in apparent length, density, and silhouette where corresponding inherited traits exist.

Do not invent functional insulation characteristics that are absent from the simulation.

### Feathers

Improve feather layering, shape, and directional appearance.

Feathers should not simply resemble fur with a different color.

### Wings

Improve the visual distinction between wing precursors, gliding structures, and functional flight anatomy.

### Armor and shells

Create convincing rigid coverings with recognizable silhouettes.

### Tails

Improve anatomy-dependent shape, flexibility, and expressive motion.

## B4. Improve the authoring workflow

Create or extend tools that allow artists to inspect an assembled creature across:

* All eight facings.
* Idle and walking states.
* Relevant action states.
* Multiple body sizes.
* Different color variations.
* Different artwork resolutions.

Provide contact sheets for identifying:

* Clipping.
* Disconnected limbs.
* Incorrect draw order.
* Unreadable features.
* Unintended symmetry.
* Misaligned attachment points.

## B5. Production rollout

Do not immediately redraw every catalog entry.

First complete a coherent group of functional anatomy that can assemble several distinct creatures.

Prioritize the parts used by ordinary founding creatures and common inherited adaptations.

Expand coverage in coherent batches, retaining the 32px fallback for parts that have not yet received new artwork.

Do not label the full catalog upgraded until its coverage is demonstrably complete.

### Package B deliverables

A functioning, maintainable high-detail art pipeline, a completed first production batch, and visibly improved assembled creatures.

---

# 5. WORK PACKAGE C — ANATOMICAL LOCOMOTION OVERHAUL

**Priority: CRITICAL**

This is one of the most important packages.

GenVo's creatures need to feel physically alive.

Current animation already supports interpolation, eight directions, gait phases, limb articulation, and anatomy-dependent movement styles.

Build upon those systems.

Review:

`src/render/motion.js`

`src/render/genvo.js`

`src/render/fauna.js`

`src/render/locomotion-style.js`

`src/render/limb-articulation.js`

`src/render/behavior.js`

`src/render/renderer.js`

## C1. Persistent foot contact

Improve the visual handling of planted feet.

When an animal places a foot on the ground, that foot should remain reasonably stable during its support phase.

Avoid obvious sliding and skating.

Coordinate foot-contact positions with the existing movement interpolation.

Do not alter actual movement distances or biological movement rules.

## C2. Weight transfer

Introduce more convincing visible body support.

The creature's body should respond appropriately when supported by different limbs.

Examples:

* A heavy creature shifts weight deliberately.
* A lightweight runner moves with comparatively rapid foot recovery.
* A spring-legged creature compresses before launching.
* An injured creature compensates for a compromised limb.

These behaviors must reflect existing anatomy and observed condition.

## C3. Anatomy-specific gait coordination

Develop coherent visual gait patterns for different body configurations.

Support:

* Two-legged configurations.
* Four-legged configurations.
* Creatures with numerous legs.
* Uneven limb arrangements.
* Mixed limb types.
* Heavy bodies.
* Small lightweight bodies.
* Specialized spring limbs.

Do not assume every creature has four legs.

Do not make an eight-legged organism animate like a quadruped with four additional synchronized limbs.

## C4. Turning and orientation

Build on the existing eight-direction turning correction.

Improve transitions between direction changes.

Where appropriate:

* The head begins looking toward the new direction.
* The torso follows.
* Limbs reposition to support the turn.
* The tail or rear body follows naturally.

Preserve actual simulation direction and navigation.

Do not introduce delayed controls for the sake of animation.

## C5. Acceleration and deceleration

Use actual movement observations to improve how creatures visually start and stop.

Avoid having every creature immediately transition from complete stillness to a full-speed running pose.

Handle sudden stops, blocked movement, and direction reversals.

## C6. Swimming

Improve aquatic movement expression.

Relevant anatomy should influence visible propulsion.

Differentiate appropriate swimming structures from ordinary terrestrial leg movement.

Maintain the real water traversal rules.

## C7. Flying and gliding

Improve wing animation, body carriage, and landing presentation.

Differentiate active flight from passive gliding.

Use existing flight, lift, and movement states.

Do not make flight-capable artwork imply actual flight when the biological rules prohibit it.

## C8. Climbing and burrowing

Create more convincing reaching, gripping, pulling, digging, and underground movement expressions.

Only display actions that are supported by actual gameplay events.

## C9. Autonomous wildlife parity

Apply appropriate animation quality to autonomous creatures, not just the controlled organism.

Use common rendering and anatomical principles wherever possible.

Test genuine autonomous creatures in ordinary worlds.

### Package C deliverables

Produce native gameplay recordings demonstrating:

1. Small and large creatures walking.
2. Different limb arrangements moving.
3. Eight-direction turning.
4. Running and stopping.
5. Swimming.
6. At least one anatomy-supported specialized movement.
7. Autonomous wildlife behaving naturally.

**Completion criterion:** Creature movement visibly differs according to anatomy, and autonomous wildlife no longer appears to move as disconnected tile-hopping sprites.

---

# 6. WORK PACKAGE D — BEHAVIORAL ANIMATION AND CREATURE EXPRESSION

**Priority: HIGH**

Make simulated behavior readable through posture and animation.

The player should often recognize what a creature is doing without opening a detailed inspector.

## D1. Feeding

Improve feeding animation according to anatomical capability.

Differentiate appropriately between:

* Grazing.
* Nibbling.
* Tearing.
* Pecking.
* Filtering.
* Suction feeding.

Use existing mouth and feeding capabilities.

## D2. Courtship

Develop expressive anatomy-supported courtship presentations.

Support existing behaviors such as:

* Displays.
* Calls.
* Gestures.
* Dances.
* Flares.
* Partner observation.
* Acceptance and rejection reactions.

Preserve the biological courtship authority.

Visual animation must not determine whether reproduction succeeds.

## D3. Predator and prey behavior

Improve:

* Stalking posture.
* Threat attention.
* Warning displays.
* Charging.
* Attacking.
* Fleeing.
* Defensive bracing.
* Recovery.

Do not add fictional encounters.

Use genuine simulated predator and prey behavior.

## D4. Physiological expression

Translate appropriate observed conditions into visual behavior.

Examples:

**Exhaustion:** Reduced movement energy and appropriate body posture.

**Injury:** Favoring damaged limbs or displaying pain.

**Cold exposure:** Suitable huddling or shivering presentation.

**Heat stress:** Suitable fatigue or heat-response expressions.

**Rest:** Relaxed posture and subtle idle movement.

**Fear:** Observable attention, defensive posture, or retreat.

These visual responses must follow actual animal conditions.

## D5. Reproduction and family care

Improve expressions for:

* Nesting.
* Egg laying.
* Live birth.
* Nursing.
* Brooding.
* Juvenile following.
* Family interactions.

Preserve existing anatomy and reproductive requirements.

### Package D deliverables

A coherent library of context-driven creature expressions demonstrated through genuine gameplay.

---

# 7. WORK PACKAGE E — ENVIRONMENTAL ART OVERHAUL

**Priority: HIGH**

GenVo has become a planetary ecological simulation.

Its environments must develop recognizable visual identities.

Maintain the top-down pixel-art style.

Use actual physical world conditions.

## E1. Establish a consistent environmental art language

Define consistent approaches to:

* Terrain color.
* Material shading.
* Ground texture.
* Vegetation.
* Water.
* Snow and ice.
* Rock.
* Weather.
* Lighting.
* Atmospheric depth.

Keep the artwork consistent across biomes.

Avoid making different environments look as if they belong to separate games.

## E2. Forests

Improve:

* Tree silhouettes.
* Canopy layers.
* Dense and sparse vegetation.
* Leaf and branch detail.
* Shaded ground.
* Forest-floor material variation.
* Visual depth.
* Appropriate movement of vegetation.

Avoid excessive visual noise.

Creatures must remain readable.

## E3. Grasslands and savannas

Improve:

* Ground-cover variation.
* Grass clusters.
* Open terrain readability.
* Soil exposure.
* Dry versus healthy vegetation.
* Wind-responsive foliage where justified.

## E4. Wetlands

Improve:

* Waterlogged terrain.
* Reeds.
* Shallow water.
* Mud.
* Marsh vegetation.
* Water boundaries.
* Environmental reflections or highlights appropriate to the pixel-art style.

## E5. Tundra and alpine environments

Improve:

* Snow distribution.
* Exposed rock.
* Frost.
* Frozen vegetation.
* Mountain material layering.
* Ice edges.
* Snow transitions.
* Cold atmospheric presentation.

Preserve the existing snow-window performance correction.

## E6. Oceans and coastlines

Improve:

* Shallow-water color.
* Deeper-water appearance.
* Shoreline transitions.
* Waves and water motion.
* Underwater vegetation.
* Submerged terrain.
* Aquatic creature readability.

Do not paint physically absent marine structures as existing resources or habitats.

## E7. Underground environments

Coordinate with Claude's physical cave development.

Improve the visual interpretation of actual connected passages.

Focus on:

* Organic geological boundaries.
* Rock thickness.
* Floor variation.
* Sediment.
* Moisture.
* Roots.
* Cave openings.
* Natural darkness.
* Underground water.
* Burrow-versus-bedrock distinctions.

Avoid dungeon-like rectangular walls and artificial room layouts.

Do not display passable openings that are physically blocked.

## E8. Weather and atmosphere

Improve the visual presentation of:

* Rain.
* Snow.
* Wind.
* Fog.
* Storms.
* Lightning.
* Cloud shade.
* Seasonal conditions.

Effects should remain readable and performant.

Do not bury creatures beneath excessive particles or screen overlays.

## E9. Environmental coherence

Terrain should look physically connected.

Prioritize continuous riverbanks, coherent shorelines, geological transitions, vegetation placement, and readable material differences.

A forest should feel like a forest because of its vegetation, terrain, light, and inhabitants—not merely because of a green color filter.

### Package E deliverables

Create actual-world before/after screenshots demonstrating at least six contrasting environmental situations.

Retain the existing physical state.

Measure the rendering cost of major effects.

---

# 8. WORK PACKAGE F — EXPANDED ENVIRONMENTAL AUDIO

**Priority: HIGH**

GenVo's existing environmental audio system already supports layered ambience.

Extend it into a richer, physically responsive soundscape.

Review:

`src/audio/audio.js`

`src/audio/model.js`

`src/audio/assets.js`

`assets/audio/`

## F1. Expand habitat sound identities

Develop distinctive audio components for:

* Woodlands.
* Grasslands.
* Wetlands.
* Mountain environments.
* Tundra.
* Coastlines.
* Open water.
* Caves.
* Burrows.

Avoid simply assigning one permanent soundtrack to each biome.

Use actual observed environmental conditions to blend sounds.

## F2. Environmental transitions

Improve how ambience changes when the player:

* Approaches water.
* Enters dense vegetation.
* Moves into exposed terrain.
* Enters a cave.
* Leaves a cave.
* Encounters rain.
* Experiences stronger wind.
* Moves through snow or ice.

Transitions should be smooth and contextually appropriate.

## F3. Physical audio propagation

Coordinate with Claude to use existing environmental perception and passage information where available.

Walls, enclosed spaces, and underwater environments should influence audio presentation where supported.

Do not create a second authoritative sound-propagation model.

## F4. Environmental sound events

Use legitimate environmental events for sounds such as:

* Branch movement.
* Water contact.
* Rainfall.
* Thunder.
* Surface ice.
* Ground impacts.
* Rock movement.
* Nearby creature activity.

Do not produce geological or ecological events that did not occur.

## F5. Performance

Ensure audio loading and playback remain responsive.

Avoid expensive synchronous decoding during gameplay.

Preserve browser audio compatibility.

### Package F deliverables

Record multiple actual gameplay soundscapes.

Demonstrate audible differences between physical environments and smooth transitions between them.

---

# 9. WORK PACKAGE G — EVOLUTIONARY CREATURE VOICES

**Priority: HIGH**

Develop a more distinctive procedural voice system based on functional anatomy.

GenVo should not sound as though every member of a broad creature category uses an identical recording.

## G1. Extend the existing voice profile

Build upon:

`src/audio/creature-voice.js`

Use existing anatomical information to create stable acoustic variation.

Potential characteristics include:

* Pitch.
* Timbre.
* Resonance.
* Call duration.
* Attack and decay.
* Rhythmic pattern.
* Relative loudness.
* Articulation.

These are acoustic presentation parameters, not new biological capabilities.

## G2. Preserve relatedness

Related creatures may share recognizable vocal qualities.

Descendants with different functional anatomy may develop different acoustic characteristics.

Do not create hardcoded species-name sound rules.

## G3. Behavioral vocal expression

Connect legitimate events to appropriate calls.

Examples include:

* Courtship.
* Alarm.
* Injury.
* Social signaling.
* Territorial displays.
* Parent-young interactions where supported.

Use existing gameplay authorities.

If a required event is unavailable, request an appropriate read-only event interface from Claude.

## G4. Avoid repetitive playback

Improve sample variation and procedural modulation.

Repeated wildlife calls should not sound mechanically identical.

Avoid excessive background calling in crowded ecosystems.

## G5. Preserve biological constraints

A creature without appropriate vocal capability must not acquire a functional call simply because a sound asset exists.

### Package G deliverables

Demonstrate several anatomically different creatures producing distinguishable sounds.

Include related creatures where possible.

Provide actual listening samples from the running game.

---

# 10. WORK PACKAGE H — INTERFACE AND CREATURE LAB OVERHAUL

**Priority: HIGH**

The interface should reflect GenVo's natural-history identity.

It should remain approachable, mouse-first, and progressively informative.

## H1. Gameplay HUD

Improve readability and visual integration.

Prioritize:

* Health and condition.
* Energy and hydration.
* Current environment.
* Nearby interactions.
* Active tasks.
* Important survival warnings.
* Relevant family information.

Avoid filling the screen with detailed statistics.

Keep the controlled creature visible.

## H2. Creature Lab

Develop a more visually impressive anatomical editor.

Recommended composition:

**Left:** Searchable anatomical catalog.

**Center:** Large animated creature preview.

**Right:** Functional consequences, inheritance constraints, and anatomical information.

Use higher-detail artwork where appropriate.

Support:

* Zoom.
* Rotation through eight facings.
* Idle and movement previews.
* Anatomical inspection.
* Pigmentation.
* Part comparison.
* Cost and tradeoff information.
* Clear unavailable-part explanations.

Preserve the established evolution and inheritance rules.

Do not turn the Lab into unrestricted midlife body editing.

## H3. Evolution presentation

Make inherited changes visually recognizable.

Compare parents and offspring through actual anatomy.

Clearly communicate:

* Added structures.
* Lost structures.
* Changed proportions.
* Inherited coverings.
* Meaningful functional differences.
* Tradeoffs.

Do not promise abilities that the offspring cannot perform.

## H4. Field Guide

Improve creature presentation and comparison.

Use consistent artwork and information hierarchy.

The Field Guide should resemble a naturalist's record of observed organisms.

Distinguish actual observations from undiscovered information.

## H5. Courtship interface

Improve the relationship between gameplay controls and creature animation.

Players should be able to recognize what their creature is doing and how the other creature responds.

Keep controls available and understandable.

## H6. Main menu and world creation

Develop a cohesive visual identity for the main menu.

World creation should be approachable and visually descriptive.

Avoid overwhelming new players with technical terminology.

## H7. Accessibility

Maintain useful contrast, legible text, responsive layouts, and accessible controls.

Test several real browser resolutions.

### Package H deliverables

A coherent interface design pass with native browser screenshots, functioning controls, and improved creature presentation.

---

# 11. WORK PACKAGE I — AUDIO SETTINGS AND MIX QUALITY

**Priority: MEDIUM**

Improve usability and listening quality.

Implement independent persistent controls for:

* Master volume.
* Music.
* Ambience.
* Sound effects.

Preserve existing mute behavior and user preferences.

Avoid clipping and excessive dynamic variation.

Ensure important gameplay sounds remain recognizable without making all sounds equally loud.

Verify behavior in an actual browser.

Do not claim subjective audio acceptance based solely on numerical loudness measurements.

---

# 12. SHARED DEVELOPMENT RESPONSIBILITIES

Codex and Claude are developing GenVo concurrently.

## Codex owns

* Visual identity.
* Creature artwork.
* Artwork authoring and rendering presentation.
* Creature animation.
* Environmental artwork.
* Interface styling and layout.
* Audio assets.
* Sound design.
* Presentation-focused verification.

## Claude owns

* Simulation.
* Biology.
* Genetics.
* Evolution.
* Wildlife AI.
* Gameplay systems.
* Movement authority.
* Environmental physics.
* Persistence.
* Performance engineering.
* Comprehensive regression testing.
* Release integration and validation.

## Shared interfaces

Coordinate before structurally editing:

`src/render/renderer.js`

`src/main.js`

`src/audio/audio.js`

`src/ui/front-end.js`

`src/ui/creature-editor.js`

`styles.css`

`index.html`

And any other files actively being modified by Claude.

Presentation must read authoritative state.

Do not introduce independent gameplay rules into graphics or audio code.

Do not overwrite concurrent work.

---

# 13. IMPLEMENTATION ORDER

This initiative is intended to produce substantial improvements across multiple implementation milestones.

Do not attempt an uncontrolled rewrite of the entire renderer.

Use the following dependency order.

## Milestone 1 — Artwork Resolution Prototype

Implement the 32/64/128 artwork comparison.

Create usable experimental assets and demonstrate them in the actual game.

Produce the initial visual comparison.

**This milestone must contain real artwork and working code.**

## Milestone 2 — High-Detail Modular Rendering

Extend the existing art pipeline to support the selected experimental artwork approach.

Implement correct modular assembly and retain existing compatibility.

Complete a useful initial set of high-detail parts.

## Milestone 3 — Anatomical Locomotion

Implement meaningful gait, weight-transfer, and movement-expression improvements.

Prioritize autonomous wildlife parity.

Demonstrate several body configurations.

## Milestone 4 — Behavior and Action Expression

Improve feeding, courtship, combat, survival reactions, and family interactions.

Use real simulation events.

## Milestone 5 — Environmental Visual Identity

Implement a coherent biome-art pass.

Prioritize visual variety and physical continuity.

## Milestone 6 — Environmental Soundscape

Implement richer environment-dependent audio.

Demonstrate differences between actual habitats.

## Milestone 7 — Creature Vocal Identity

Implement anatomy-dependent vocal variation and contextual behavior sounds.

## Milestone 8 — Interface and Creature Lab

Improve the player-facing interface and integrate detailed creature previews.

## Milestone 9 — Presentation Integration

Resolve visual inconsistencies, asset compatibility, and integration problems.

Prepare the work for Claude's comprehensive regression and release-candidate validation.

---

# 14. DEVELOPMENT AND TESTING RULES

The creator specifically wants feature implementation prioritized over excessive repeated testing.

Follow that direction.

## During implementation

Run focused checks relevant to the changed modules.

Examples:

* Animation contracts after animation changes.
* Asset loading checks after artwork changes.
* Audio checks after sound changes.
* Browser layout checks after interface changes.
* Source and architecture checks when applicable.

## At milestone boundaries

Provide native screenshots, recordings, or equivalent evidence demonstrating the actual improvement.

Coordinate with Claude for comprehensive integration testing.

Do not run lengthy ecological simulations simply because an artwork file changed.

## Preserve

* Existing simulation behavior.
* Save compatibility.
* Deterministic biological outcomes.
* Historical artwork.
* Existing creature identities.
* Eight-direction movement.
* Mouse-first controls.
* Canonical world state.
* Stable published builds.

Do not delete or rewrite original human artwork.

Do not regenerate historical evidence.

Do not weaken tests to conceal failures.

---

# 15. PERFORMANCE REQUIREMENTS

High-detail artwork must remain practical for a simulation containing many autonomous creatures.

Measure rendering costs before and after major visual changes.

Use representative scenarios containing multiple visible creatures, vegetation, and environmental effects.

Prioritize:

* Asset reuse.
* Appropriate caching.
* Controlled memory growth.
* Efficient sprite composition.
* Avoiding unnecessary per-frame allocations.
* Appropriate level-of-detail selection.
* Clear native-pixel scaling.
* Stable animation timing.

Do not increase the global creature footprint simply because sprite artwork resolution increases.

Distinguish artwork resolution from the creature's actual world size.

Do not silently lower simulation complexity to improve rendering performance.

When choosing between visual approaches, compare performance under the same world and camera conditions.

Preserve the October 28 snow-cache correction and other measured optimizations.

---

# 16. VISUAL ACCEPTANCE CRITERIA

The following questions should guide final evaluation.

## Creature readability

Can a player recognize different body structures at normal gameplay zoom?

Are fur, feathers, armor, wings, and specialized limbs distinguishable?

Do inherited anatomical differences remain visible?

## Creature movement

Do different bodies move in appropriately different ways?

Do planted feet avoid obvious sliding?

Do turns look coherent?

Do autonomous creatures appear as animated organisms rather than jumping sprites?

## Environmental presentation

Can players visually distinguish major habitats?

Do natural features appear physically connected?

Does the artwork reinforce environmental conditions?

Do creatures remain readable against backgrounds?

## Audio

Can players recognize different environmental soundscapes?

Do creature voices vary meaningfully?

Do sounds respond to actual behavior and environmental conditions?

Can users adjust the audio mix comfortably?

## Interface

Can players understand common interactions without opening complicated panels?

Does the Creature Lab provide an attractive and useful anatomical view?

Are evolution and inheritance visually understandable?

Does the interface preserve gameplay visibility?

## Technical quality

Do existing creatures and saves still load?

Does the artwork render correctly in all supported directions?

Are performance costs measured?

Are changed systems appropriately tested?

---

# 17. REQUIRED MILESTONE REPORTING

After each meaningful implementation milestone, provide a concise development report containing:

**Implementation:** What actually changed in the game.

**Files:** Which runtime modules and assets were modified.

**Visual or auditory evidence:** Before/after comparisons from the actual game.

**Verification:** Focused checks performed and their results.

**Integration:** Any shared changes requiring Claude's attention.

**Remaining work:** What is still incomplete.

Distinguish completed functionality from experiments and creator acceptance.

A technically passing test does not automatically establish artistic quality.

Avoid producing extensive duplicate documentation for trivial changes.

---

# 18. GIT WORKFLOW

Start by inspecting:

* Current local branch.
* Working-tree status.
* Latest remote main.
* Uncommitted local work.
* Existing Codex development branches.
* Claude's most recent changes.

Preserve concurrent work.

Use a dedicated presentation development branch, with reviewable milestone commits.

Do not force-push.

Do not overwrite Claude's systems changes.

Do not silently merge unreviewed experimental artwork into stable main.

Completed, reviewed milestones may be integrated through the existing project workflow.

Do not automatically publish or replace the itch.io release.

---

# 19. IMPORTANT — AVOID PREMATURE GOAL COMPLETION

Previous Codex sessions completed small corrections and then reported the larger visual/audio objective as achieved.

That is not sufficient for this assignment.

The goal is not achieved by:

* Reading planning documents.
* Inspecting current source files.
* Writing a research summary.
* Correcting one small animation-timing issue.
* Adjusting a few audio gain values.
* Adding tests without corresponding feature improvements.
* Producing screenshots of unchanged gameplay.
* Committing a documentation-only update.

Those activities may support development, but they do not complete the initiative.

**Milestone completion requires tangible implementation.**

If a particular improvement is blocked, document the blocker and continue with an independent package where possible.

Do not declare the entire initiative complete while major packages remain unfinished.

If development must stop before completion, provide an accurate continuation handoff identifying the exact next implementation task.

Do not claim unperformed work.

---

# 20. IMMEDIATE EXECUTION DIRECTIVE

Begin actual implementation.

### First task

Build the high-resolution creature artwork comparison.

Use the existing GenVo creature assembly and rendering systems.

Produce genuine 32×32, 64×64, and 128×128 representations of representative organisms.

Integrate the candidates into a working comparison view using the actual game renderer.

Render the same creatures at ordinary gameplay zoom and Creature Lab scale.

Assess silhouette, anatomical detail, modular compatibility, eight-direction consistency, and performance.

**Do not stop at the evaluation plan. Create the artwork and working prototype.**

### Second task

Use the results to implement a coherent first batch of improved modular creature artwork.

Prioritize recognizable anatomical differences.

### Third task

Begin the anatomical locomotion overhaul using the improved art and existing procedural movement systems.

Focus on visible improvement to autonomous wildlife.

### Subsequent tasks

Continue through the remaining development packages in dependency order.

Maintain regular implementation checkpoints and coordinate with Claude.

---

# FINAL DEVELOPMENT VISION

GenVo should communicate biological evolution through the experience of watching and interacting with its creatures.

An armored organism should appear physically different from a lightly built runner.

A feathered creature should have a distinct silhouette and appropriate movement expression.

An aquatic creature should move differently through water.

A predator should visually communicate attention, stalking, and attack behavior.

Young creatures should resemble their parents while displaying actual inherited differences.

Habitats should look and sound environmentally distinct.

The Creature Lab should allow players to appreciate the anatomy they have developed over generations.

Every visual and auditory improvement should reinforce the fact that GenVo is a persistent, simulated living world.

**The final objective is not simply higher-resolution pixel art.**

It is a cohesive visual and auditory identity in which creature anatomy, movement, inherited variation, behavior, and environment are expressed through the game's presentation.

Build that experience directly into GenVo.

**Proceed with implementation.**
