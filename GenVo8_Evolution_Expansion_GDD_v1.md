> Historical checkpoint / branch-local proposal. See the repository README, design/CURRENT-DESIGN.md and docs/CURRENT-IMPLEMENTATION.md for current authorities. Original text below is preserved; its pending-work statements are not current instructions.

# GENVO8 — EVOLUTION EXPANSION
## Implementation-ready Game Design Document (GDD v1.0)
**Decision date:** 2026-10-08  
**Canonical implementation baseline:** GenVo8 toolkit v1.33.7 (`genvo8-toolkit(20261008-232706).zip`)  
**Status:** Design decisions locked; expansion not yet implemented.  
**Identity:** A 2D 16×16-pixel lineage-survival and ecosystem-evolution simulation in which player and wildlife bodies are built from functional heritable parts.

## 0. LOCKED CREATIVE DECISIONS
1. **Guided evolution:** New structures must follow biologically compatible ancestry, precursor anatomy, developmental constraints and environmental viability. Preserve expressive combinations, not absolute realism.
2. **Lineage-level editor:** At a valid reproductive handoff, the player edits the **inherited next-generation lineage phenotype** within a mutation budget. The editor does not freely rewrite a living creature midlife.
3. **Balanced game:** Real-time creature survival, an expressive functional editor, and an independently evolving ecosystem receive comparable attention. None becomes merely a menu for the other.
4. **Creature-first implementation:** Deepen the current terrestrial/amphibious Creature gameplay before delivering a playable Cell origin. Later Cell expansion uses the same genetics, body definitions and ecological contracts.
5. **Other retained constraints:** Rule of 8 as design language, not maximum content; eight-direction motion, eight-frame convention for authored animation, eight top-level genetic families, Generation 8 as first major milestone (not hard endpoint); browser-first pixel style; accessibility and usable UI; one canonical toolkit source; no unverified runtime screenshots.

## 1. PLAYER EXPERIENCE AND PILLARS
**Pitch:** Design the organism, inhabit its body, struggle for resources, form relationships, reproduce, and see which descendants survive in a world where every competing species can evolve too.

**Pillars:**
- **Build it, then live with it:** A feature must have observable effects in locomotion, perception, feeding, reproduction, combat, or survivability. No pure stat-overlay pretending to be anatomy.
- **The world is not about you:** Wildlife selection follows ecological outcomes, not player-specific counters. Extinction, predation, competition and migration remain systemic.
- **Life is interesting between editors:** The player finds food, hunts, escapes, socializes, explores, protects dependents, competes and exploits terrain. Reproduction is a reward and opportunity, not the entire game.
- **Consequences and tradeoffs:** Evolution has energy, mass, attachment, developmental and mutation costs; no universally optimal body.
- **Readable pixel organisms:** Every functional structure has a distinct authored sprite or procedural-pixel component, connected through consistent sockets and joints.
- **Legitimate heredity:** Genomes, expressed phenotypes, and individual learning are different concepts; knowledge does not become DNA.

**Target play rhythm (tuning targets, not shipped facts):** In the first 3–5 minutes the player encounters at least three distinct meaningful activities; an editor opportunity emerges after a viable reproductive cycle; every editor change can be tested immediately. The first generation should be viable even if the player never constructs a shelter. No mechanic should obligate repetitive fetch quests to unlock fundamental biological agency.

## 2. CURRENT BASELINE / WHAT NOT TO REBUILD
Verified by inspection of packaged v1.33.7 README and simulation specification:
- Continuous founder-line anatomy axes, expressed adaptations, heritable genes and proto-traits.
- Body-derived Pounce: spring-axis threshold 0.8, Shift+Space, shared attack pipeline and breath cost.
- Eight ordered simulation phases; eight-direction movement; 8 Hz simulation with 32 Hz live control substeps; 8-day seasons.
- Individual memories/learned fear, lineage progression, offspring/handoffs, wildlife inheritance, speciation, ecology, population centers and migration.
- Foraging, exertion, player combat, predators, shelters, weather/disease, AUTO behavior and screenshot/performance probes.
- Existing water rule: current founder-line GenVo cannot enter open water; certain aquatic **taxa** can use branch habitat. Do not silently grant the player aquatic travel until the locomotion/habitat authority genuinely supports it.
- Existing save migration, source tests, provenance tooling and release packaging.

**Important:** The new part model must never duplicate the authoritative damage, adaptation, movement, disease, resource, or ecology calculations. At first, new representations should adapt existing authorities; later authority migrations require explicit tests and versioned save transforms.

## 3. CORE LOOP AND PLAYER GOALS
### 3.1 Live phase
1. Read immediate body state: health, energy/breath, hunger, hydration, injuries and available physical actions.
2. Choose a viable ecological activity: forage, scavenge, stalk, hunt, evade, explore, groom, court, signal, defend, build, migrate or rest.
3. Encounter visible feedback: prey behavior, resource response, hazards, rival displays, scent/signals, family cooperation, anatomy animation.
4. Accumulate lived environmental pressures and **observation knowledge**; no requirement to perform one particular task for a generation to count.
5. Reach reproductive eligibility through normal survival, maturity, accessible mate/viable breeding strategy and energy/health requirements.

### 3.2 Reproduce / editor phase
1. Select a reproductive partner where relevant and view inheritable features and likely offspring variation.
2. Construct **the next-generation lineage phenotype target** using inherited variation and mutations that pass viability constraints.
3. Preview body/energy/diet/ability differences, resolve mutation budget, commit once.
4. Spawn a real offspring candidate or cohort with inherited traits; lineage target influences descendants but does **not** overwrite every extant relative or unrelated wild creature.
5. On succession, control an eligible descendant; retain ancestral entries and branch history.

**No retroactive edits.** Existing adults, mates and previously born offspring retain individual phenotypes. Evolution can be expressed through offspring. A new lineage target is a reproducible breeding/design rule for the next generation, not magical direct modification of the current animal.

### 3.3 World reaction
Run native ecological selection at controlled intervals; species may vary, split, expand, contract and go extinct whether or not the player observes them. Wildlife can develop morphology only via the same viability and phenotype rules used by player organisms.

### 3.4 Generation milestone
Generation 8 is the first major legacy review, presenting morphology timeline, ancestors, survival, niches, species discovered, ecological effects and notable lineage divergence. Continue play afterwards.

## 4. TWO EXPERIENCE PATHS
**Launch default — Creature:** Current living family/creature game, with first body editing unlocked at succession; suitable initial organisms have functioning land anatomy. Prior saves continue with migrated body plans.

**Later expansion — Primordial/Cell:** Separate start scenario within the **same world model**, involving microscopic drifters/swimmers, feeding and propulsion, early structures and gradual adaptation toward shoreline or continued aquatic specialization. No compulsory evolution to land. **Not in initial vertical slice.**

**Later optional Sandbox:** Creator with relaxed mutation restrictions but the same collision/functional rules, for experimental species. Sandbox organisms are labeled separately from canonical survival-lineage achievements.

## 5. EDITOR SPECIFICATION
### 5.1 Entry and state
Open only through a valid reproduction/succession workflow (or designated sandbox mode). Snapshot live authoritative state before entry. The editor operates on a **draft**, never on the live world. On cancel, discard draft with no mutation budget consumed. On commit, validate, persist a transaction record, and allow game progression. Do not advance ecology while paused in the editor unless an explicit future policy changes this.

### 5.2 Layout
- **Center:** large, zoomable pixel canvas; directional body view; grid and attachment/socket overlays only when editing; visible active symmetry axis.
- **Left:** searchable part palette with tabs: Body, Locomotion, Feeding, Senses, Offense, Defense, Metabolism, Social/Reproduction. Locked parts reveal missing precursors rather than disappearing.
- **Right:** selected part and overall body stats, viability diagnostics, tradeoffs and available mutation budget; avoid endless scrollbars and clipped content.
- **Bottom:** Undo/Redo, Mirror, Rotate, Test, Revert, Compare to Parent, Commit; keyboard equivalents, large consistent hit targets, controller-friendly paths where feasible.
- **Responsive:** Collapse inspector into deliberate tabs on small screens; do not shrink click targets to fit more data.

### 5.3 Editing operations
Add, remove, move to valid socket, rotate (quantized for pixel assets), pair/mirror, adjust dimensions within bounds, replace an ancestral variant, adjust coloration/patterns, undo/redo. Reject orphan parts, cycles in limb attachment hierarchy, impossible mounting and budget violations. Distinguish cosmetic coloration (inheritable pattern gene) from physical adaptation cost.

### 5.4 Preview sandbox
Preview same authoritative action resolvers as game: Walk, Sprint, Flee, Jump/Pounce, Attack, Feed, Swim (if viable), Sense, Signal. Show real measured costs, not bespoke invented preview stats. Preview arena is isolated from canonical saves and must not alter world RNG or progression.

### 5.5 Acceptance
Edit workflow supports mouse and keyboard; a novice can attach a mouth and limb, understand incompatibilities, undo and commit without reading the full simulation spec; the generated creature renders in all eight facings with no detached limbs or missing sockets; saved drafts reload exactly.

## 6. PART LIBRARY AND BODY TOPOLOGY
### 6.1 Required part definition fields
`id`, `family`, `assetId`, `partVersion`, `tags`, `developmentalPrerequisites`, `compatibleSocketTypes`, `providedSockets`, `jointChain`, `mountingBounds`, `orientationRules`, `symmetryRules`, `dimensions`, `mass`, `upkeep`, `mutationCost`, `effectContributions`, `actionCapabilities`, `animationProfile`, `inheritanceProfile`, `ecologicalNicheTags`.

Parts may not execute arbitrary JavaScript behavior. Registry data configures finite approved capabilities handled by owning systems. Sprite visuals are not the authority for collision, hitboxes or capabilities.

### 6.2 Starter vertical slice: 18 functional parts
| Group | Part | Distinguishing observable effect |
|---|---|---|
| Core | Soft torso | Baseline health/energy storage/attachments |
| Core | Reinforced torso | Increased toughness, mass/upkeep |
| Limbs | Walking leg | Stable land movement |
| Limbs | Spring leg | Faster burst jump / Pounce progression |
| Limbs | Grasper | Carrying/handling/nest interaction |
| Limbs | Digging forelimb | Soil interaction / burrow suitability |
| Feeding | Grazing mouth | Plant feeding efficiency |
| Feeding | Tearing jaw | Flesh access and direct bite |
| Feeding | Crushing jaw | Hard-food processing and bite force, higher cost |
| Senses | Simple eye | Visual detection |
| Senses | Wide-field eye | Peripheral detection, upkeep tradeoff |
| Defense | Armor plate | Incoming damage reduction with mobility cost |
| Defense | Barb | Directional contact retaliation |
| Offense | Claw | Short-range striking / handling tradeoff |
| Offense | Venom gland | Conditional toxin delivery, limited reserves |
| Metabolism | Storage sac | Longer food endurance with added weight |
| Social | Signal crest | Courtship/alarm effectiveness |
| Locomotion | Paddle tail | Water propulsion only with compatible body/habitat support |

**Slice restriction:** Paddle tail can be constructed/previewed, but open-water player traversal remains gated until water physics, world collision and survival balancing are actually integrated. No fake swimming stat.

### 6.3 Later library families
Flagella, cilia, filtering mouths, proboscis, gills/lung-equivalents, fins, webbing, sensory antennae, vibration organs, stingers, secretion glands, venom spit apparatus, camouflage skin, shells, brood sacs, egg adaptations, grasping tails, complex leg chains. Long-run target **60–80 distinct functional part families**, not the first milestone.

### 6.4 Anatomical topology and mounting rules
Represent each phenotype as a rooted directed acyclic part graph. Core(s) are roots; limb chains include joints. Every installed part must have exactly one parent socket, except designated root nodes. Each socket has type, accepted family/tags, max attachment count, position, direction and articulation restrictions. Attachment must preserve grossly feasible support/locomotion. Symmetrical pairs are editor affordances but may be broken when valid. Directional mounts change attack/sense arcs.

### 6.5 Derived body metrics
Resolver computes effective mass, baseline metabolism, burst costs, locomotion modes/speeds, traction, sensory coverage, feeding types, attack geometry, mitigation, storage and breeding investment. Costs include mutation budget for new changes and ongoing energy/mass effects for owning the part. Never count the same inherited advantage once from the anatomy axis and again from the new part.

## 7. GENOME / INHERITANCE / EVOLUTION RULES
### 7.1 Data layers
- `Genome`: eight genetic families plus versioned heritable alleles/structural blueprint potential.
- `DevelopmentPlan`: viable part graph the next generation can express; defines ancestral structure and allowed variation.
- `Phenotype`: actual parts and proportions expressed by one born creature.
- `Physiology`: derived runtime capabilities, recomputed deterministically from phenotype + health/status.
- `Cognition`: learned personal memories, preferences and fears, **not inherited genetically**.
- `TaxonPopulation`: ecological aggregates, variation distributions, nesting/territory/range and divergence history.

### 7.2 Mutation budget (initial tuning proposal)
Base **8 MP** per evolutionary handoff to honor Rule of 8 as a design rhythm, with explicitly capped earned bonuses (proposed +0 to +4) from successfully lived/adaptive opportunity, never from trivial repetitive grinding. Actual numbers to tune after playtests. Existing parts have no repeated acquisition charge; adding/removing/upgrading/repositioning has defined costs. Structural reversions may return limited budget within the current uncommitted draft only. Cosmetic edits can have independent constraints so expression is not punished unnecessarily.

### 7.3 Compatibility/ancestry
A structural mutation must be reachable from parental allele/developmental prerequisites via an allowed change set; radical changes require intermediate precursor expression across generations. Candidate viability assesses connected anatomy, mounting, energy balance, locomotion support and habitat oxygen/water constraints. **Guided biology is plausible fictional evolution, not a literal real-world evolutionary model.**

### 7.4 Breeding semantics
A mate contributes actual inheritable variants. Player selects a **lineage target among available viable inherited outcomes and budgeted mutations**; offspring are individuals with variation, not perfect clones of the edited target. Deterministic RNG streams separate genetics, ecological selection and editor UI preview. Repeated preview/undo must not shift live world RNG.

### 7.5 Speciation
Divergence emerges from inherited morphological/genetic separation, sustained ecological niche differences and reduced gene flow under the existing lineage/speciation authority. Never create a new species solely because the player changes skin color, hits a generation number or crosses an arbitrary editor score.

## 8. PLAYER ABILITIES AND MOMENT-TO-MOMENT GAMEPLAY
**Locomotion:** Walk, sprint, stop/brace, controlled leap, climb/dig/swim when compatible. Authoritative exertion and habitat collision remain canonical.

**Combat:** Bite/strike/pounce plus part-enabled stinger, defensive barbs, toxin delivery and eventually spit. The same action envelope tracks windup, hit test, directional range, stamina/breath cost, cooldown, interruption and recovery; no infinite actions and no duplicate damage pipeline.

**Feeding:** Diet is constrained by mouth + gut/metabolism + actual available resources. Carnivore access is an anatomical/ecological possibility, not a one-click class switch. Carcass creation and decay require consistent resources and predator competition.

**Senses:** Camera may reveal basic nearby world, but creatures' actual detection and autonomously observed signals derive from organs, environment and stealth. UI must explain what the organism itself can sense.

**Social:** Call, warn, intimidate, court, rally and bond; outcome depends on species dispositions, signal organs, history and context. Relative cohorts can help hunt/defend where their bodies allow it.

**Young/family:** Offspring phenotype, vulnerability, care needs and teaching matter. Nest construction is strategic and optional for viable alternative lifestyles. Existing child-follow/flee training should be preserved and improved for different locomotion bodies.

**Exploration:** Edible niches, threats, crossings, den opportunities, changing weather/habitat, rare variants and landmarks; avoid reward gating that forces shelter repetition. Discovery unlocks knowledge of feasible pathways, **not instant genetic acquisition**.

## 9. WORLD / NPC EVOLUTION SPEC
### 9.1 Shared morphology
Every simulated species can reference a valid PartRegistry + DevelopmentPlan-compatible phenotype. Existing fixed fauna may use migration adapters and temporary legacy portraits, but long-term player and fauna should share one assembly and capability resolver. Unrelated species retain distinct visual identity distributions; procedural does not mean random piles of parts.

### 9.2 Two simulation scales
- **Near-field:** full agents with visible bodies, joints, actions, collision, hunger, stamina and local behavior.
- **Far-field:** population-cohort aggregates (genotype/phenotype frequency, food availability, births, deaths, competition, dispersal) without individual render/AI ticks.
- **Reconciliation:** spawning/retiring agents must conserve reasonable populations and not produce discontinuous mass mortality or duplicate individuals. Seeded results must be reproducible independent of camera location.

### 9.3 Selection
Variation affects real survival and reproduction; ecology tracks food webs, predation, crowding, disease, season and habitat. No invisible direct anti-player adaptations. Rare traits must be heritable and subjected to selection. Simulated species may shrink or disappear; maintain viable world-generation diversity and graceful recovery rules without protected immortal species.

### 9.4 Wildlife roll-out
First convert one herbivore/prey archetype; second convert one predator; prove that inherited part differences produce visible body and gameplay changes across multiple generations. Only then generalize to all fauna and Cell species.

## 10. ART, ANIMATION, UI AND AUDIO
- Pixel component sheets at 16×16 base language; joints/sockets authored in asset metadata, not discovered from image pixels.
- Eight facings and eight-frame animation convention where authored, with deterministic procedural articulation between authored keys; feet should plant visibly instead of teleporting cells.
- Layers: rear appendages → body → front appendages → facial parts/effects; coherent occlusion, material shading and grounded shadow.
- Silhouette first: independent tester can identify leg, jaw, shell, tail and stinger at normal gameplay zoom.
- Editor sprites are actual runtime sprites, not separate glossy mockups.
- Natural concise labels, consistent hit areas, keyboard navigation, explicit scrollbar behavior; avoid large bottom-screen text dumps and tiny expansion toggles.
- Audio driven by actual contacts, footsteps, strikes, locomotion surface, feeding and calls; functional mutations may alter sound profile. No mandatory new audio until proposed cues are reviewed.
- Runtime screenshot pass for every visible milestone: editor, eight facings, varied bodies, near-field NPCs, action contact, and real gameplay composition.

## 11. ENGINEERING ARCHITECTURE / OWNERSHIP
Proposed discrete modules (names are design targets, not existing files):
- `lineage/part-registry`: declarative immutable versions of parts and socket rules.
- `lineage/body-plan`: normalized graph, mounting/validation and revision IDs.
- `lineage/phenotype-resolver`: pure derived effects/actions; sole bridge to existing lineage/effects and expressed adaptations.
- `lineage/genome-structural`: heritable developmental capability and compatible mutations.
- `lineage/evolution-budget`: legal editor change valuation.
- `lineage/reproduction-bridge`: mating, lineage target and offspring generation transactions.
- `render/creature-assembler`: graphical sprites, attachment graph, eight facings.
- `render/creature-motion`: gait and joint animation, using existing physical state.
- `ui/creature-editor`: draft session, history, palette, selection, inspector, test commands.
- `ecology/phenotype-populations`: phenotype distributions and cohort updates, hooked to existing population authority.
- `world/preview-habitat`: isolated deterministic creature test scenes.

**Invariants:** Rendering never grants abilities. Editor never mutates canonical living entities until commit. Reproduction is authoritative for lineage application. Simulation resumes deterministically. Source remains modular; no monolithic renderer or main script authority expansion.

## 12. SAVE / RNG / PROVENANCE / COMPATIBILITY
- Record `bodyPlanSchema`, versioned part IDs, part graph and per-creature phenotype; any population aggregate schema requires explicit migration.
- On upgrade, convert older continuous anatomy to viable initial body-plan defaults **without changing derived physical capabilities**, and preserve legacy anatomy for migration verification until adapter removal is proven.
- Unknown future part IDs fail visibly and safely rather than silently deleting body components.
- Save/load editor draft only if deliberately supported; canonical commit is atomic. Interrupted transactions must not half-apply a mutation.
- Replaying a save must reproduce part assembly, actions, genes and ecology evolution under identical input stream.
- Compare baseline behavior before and after no-op migration; preserve Pounce semantics, water restrictions, established diseases, cognition, autonomy and ecology performance.
- Log this pivot and later creator decisions in provenance decision map, ledger and authorship manifest truthfully; distinguish creator-led design from AI-assisted implementation.

## 13. ACCESSIBILITY AND TEACHING
- Adjustable game speed / pause where existing controls permit; editor independent from simulation clock.
- Large pointer targets, high contrast sockets, color+shape indicators, keyboard navigation and legible focus order.
- Context prompts: “Cannot add fin: requires aquatic body and tail socket”, “Armor increases protection but slows travel”, “This mutation takes two intermediate generations”.
- First evolution tutorial: replace one inherited limb, test it, compare to parent, cancel/retry, commit. No long modal exposition and no forced shelter chores.
- Plain-language view by default; advanced quantitative ecology/genetics inspector optional but complete and not clipped.

## 14. PRODUCTION ROADMAP WITH SHIP GATES
### Phase A — Contract foundation
Deliver `part-registry` schema, `body-plan` graph, pure phenotype resolver adapter, migration map and unit tests. Existing game looks/plays unchanged.
**Gate:** No-op migration reproduces existing anatomy effects/adaptations/Pounce/water results; same seed ecology checks preserved.

### Phase B — Visible assembly
Build authored pixel parts, sockets, eight facings, limb animation and representative runtime portraits for one GenVo. No editor yet.
**Gate:** Real browser screenshot and motion captures show connected body on motion/rotation/attack; perf stays within accepted v1.18.1 contract.

### Phase C — Editor vertical slice
18 functional parts, draft mutation budget, guided unlock/prerequisite validator, undo/redo, safe commit, basic preview habitat, good UI.
**Gate:** Edit → preview → commit → reproduce → save → reload, all deterministic; no clipped UI; large hit targets; old saves still open.

### Phase D — Creature gameplay authority
Body-derived feeding, movement, combat, sensing and social actions, with physical tradeoffs and visible feedback. Preserve survival and existing goal progression until new opportunities replace them.
**Gate:** Three clearly different body builds solve the same survival situation differently; actions cannot be triggered without parts; AI follows the same rules.

### Phase E — Genuine reproduction
Pairing, compatible inheritance, individual variation, lineage target selection and successor representation.
**Gate:** At least three offspring differ plausibly while inheriting ancestry; no edits to already alive adults; no preview RNG drift.

### Phase F — Wild evolution pilot
Convert one prey and one predator taxon and update near/far population traits through real fitness outcomes.
**Gate:** At least two seeds generate distinguishable valid body variants; predator/prey balances and 20-year ecology stress tests remain credible.

### Phase G — Content/encounter redesign
Rework discovery, hunting, signals, family, shelters and optional goals to create meaningful non-reproductive play; add journal/anatomy/species discovery UI.
**Gate:** Blind testers identify three meaningful self-directed activities before first reproduction and request another run for a mechanically specific reason.

### Phase H — Cell foundation and aquatic play (separate later scope)
Implement small aquatic body scales, flagella/cilia/feeding, oxygen/habitat interactions, open-water movement and maturation into Creature-compatible body plans.
**Gate:** Playable full aquatic lineage with credible survival; no mandatory land transition; world-scale simulation still stable.

## 15. TEST MATRIX
**Static/contracts:** Registry ID uniqueness, socket graph acyclicity, part metadata shape, budget math, tags/prerequisites and safe asset fallback.
**Functional:** Move/attack/eat/sense by part capability, orientation arcs, collision, environmental constraints, hunger/stamina costs and biological viability.
**Genome:** Parental inheritance, variation bounds, mutation adjacency, sibling diversity, non-retroactivity, species divergence.
**Determinism:** Seeds, editor undo/cancel, preview isolation, serialization, autosave/reopen, split/merge cohorts.
**Performance:** Worst-frame time on active 15/30/60-creature scenarios; day-turn ecology pressure; animation sprite batching/caching; old stable v1.18.1 frame pacing baseline.
**Visual/runtime:** Real screenshot and motion capture from browser for all facings and diverse bodies, safe UI sizes, landscape and hit contacts.
**Ecological:** Twenty-year test, predation/prey collapse/recovery, migration, part-frequency shifts and camera-independent far/near reconciliation.
**Playtest:** First 5 minutes, reason to explore, variety of activities, editor comprehension, noticeable functional differences, desire to continue past Generation 8.

## 16. RISKS / COUNTERMEASURES
1. **Editor outscales gameplay:** Implement real encounters and body-derived actions in parallel, not 80 decorative pieces up front.
2. **Random creatures look like nonsense:** Require body grammar, topology, physiological validity and silhouette checks for AI-generated species.
3. **Editor is biologically frustrating:** Make prereqs visible; provide clear evolution paths and useful starter variants; relax realism where it harms play.
4. **Heredity conflicts with creative control:** Distinguish lineage target from individual expression; preview range of outcomes.
5. **Double-applied stats:** One phenotype resolver adapter and regression-based authority checks.
6. **Too much work each generation:** 8-MP tuning, reusable blueprints, one-click parent comparison and optional cosmetic changes.
7. **Performance regression:** Near/far population separation, cached assembled sprites, no heavy builds on input frames, runtime probes.
8. **Regressed old saves:** Versioned migration + golden-baseline tests; never skip validation to force rollout.
9. **Spore imitation without identity:** GenVo8 identity is autonomous co-evolution, biological ancestry and persistent lineage consequences, in a compact pixel ecosystem—not copying Spore art, content or presentation.

## 17. INITIAL DEVELOPMENT BACKLOG (ORDERED)
- **EV-001:** Freeze v1.33.7 baseline tests, save fixture and representative real-game screenshots/perf output.
- **EV-002:** Define PartRegistry v0 and 18 starter parts; lock capability names and socket types.
- **EV-003:** Write BodyPlan graph validator, serialization and canonical IDs.
- **EV-004:** Implement legacy anatomy → BodyPlan read adapter and compare output for all existing ability checks.
- **EV-005:** Create `PhenotypeResolver` contract tests for mobility, action set, anatomy threshold and energy use.
- **EV-006:** Build pixel part atlas metadata + authored starter sprites (license/provenance tracked).
- **EV-007:** Add assembler for existing GenVo in 8 facings, then grounded limb gait.
- **EV-008:** Implement editor draft, palette, sockets, selection, mutation budget and validation.
- **EV-009:** Add preview habitat and pure isolated action playback.
- **EV-010:** Connect reproduction transaction and lineage-target persistence; regenerate canonical source/public packaging after acceptance.

## 18. THE FIRST DEMONSTRABLE SUCCESS
A tester opens an existing Creature run, survives using the normal game, reproduces, opens a usable pixel editor, changes its descendant lineage from a modest runner toward a spring-legged predator (within earned mutation and ancestral constraints), witnesses a visible eight-direction body change, feels a different stamina/jump/hunting loop, and discovers that at least one prey/predator population is also changing independently. Save/reload preserves everything. **This is the standard for calling the pivot a playable evolution expansion—not simply an editor prototype.**

---
**Locked decisions remain authoritative until the creator explicitly revises them.** Design/tuning values marked “proposed” require simulation tests and playtesting before they become balance constants.


## October 17, 2026: governing Living Planet direction

Creator direction: GenVo is an open-ended evolutionary life simulation. Players enter a living planet populated by organisms descended from comparatively simple ancestral forms. Rather than offering predefined creature classes or predetermined evolutionary paths, GenVo provides a modular biological system containing the developmental mechanisms, inherited traits, anatomical structures, physiological processes, and behavioral capabilities from which diverse organisms may evolve.

The planet supplies changing environmental conditions and ecological opportunities. Life responds through survival, reproduction, inheritance, variation, migration, competition, and natural selection. Complexity is possible, not guaranteed. Biodiversity is possible, not guaranteed. Extinction is possible, not prevented.

**The game defines what biology can do, not what evolution must produce.**

The ancestor is a viable evolvable developmental system, not a hidden blueprint for every animal. Anatomical gain, modification, duplication, specialization, reduction and loss arise through compatible inherited development with real costs. Environmental pressure changes realized survival/reproduction; it does not instruct useful mutations. Player guidance cannot bypass ancestry, viability or resource funding. No generation/birth counter, species label, discovery reward or biome bonus grants a physical capability.

This direction supersedes conflicting progression/class/pressure-inheritance assumptions in this historical GDD; it does not claim those runtime rules are already migrated. Preserve top-down presentation, modular art, canonical authorities and historical saves. No new feature implementation until the continental architecture plan is reviewed.

Review: [Continental Living Planet architecture](docs/living-planet-architecture/PROPOSAL.md) and [full 79-part gap matrix](docs/living-planet-architecture/PART-CATALOG-GAPS.md). The First 100 Days requires simple ordinary beginnings, authentic functional inherited branching, and a separate valid multi-generation ancestry fixture proving advanced possibilities. It does not require every advanced organism or dramatic diversification within 100 days.

## October 17 reviewed A0/A and player-guided validation update

Architecture review authorizes A0 then A on the current-sized world. Their verification is recorded in docs/living-planet-architecture/A0-VERIFICATION.md and docs/world-pages/REPORT.md (paths relative to repository root). Larger geography still requires reviewed scale mapping and measured performance. The full A-H roadmap remains active.

Separate Autonomous Ecosystem and Player-Guided Evolution trials must use identical physiology, inheritance, developmental costs, mate acceptance and environmental rules. Young versus established ancestry is a separate dimension. Skilled players may specialize faster through legitimate strategy and editor choices; do not impose arbitrary generation gates, fabricate precursors, boost mutation or guarantee outcomes. Strategic options must be discoverable. See docs/living-planet-architecture/PLAYER-GUIDED-VALIDATION.md. Major integrated 100-day trials remain deferred until mechanisms are ready.
