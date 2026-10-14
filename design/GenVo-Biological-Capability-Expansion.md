# GenVo — Biological Capability Expansion Map

> Historical expansion proposal and October 13 source snapshot. Subsequent botanical genetics, sexual reproduction, seed-column saves, encounter presentation and shared demand are implemented. Use [the October 14 consolidation audit](consolidation/Consolidation-Implementation-Plan.md) and [current balance bible](consolidation/Part-Balance-Bible.md) for current-state decisions; retain this document as expansion context.




October 13, 2026. **Design proposal grounded in the current source; runtime implementation is unchanged.** The attached discussion supplies expansion ideas and questions. It does not constitute approval of every example organ, botanical reproductive mechanism, numerical coefficient or a compulsory 237-part quota. This document makes those choices reviewable before art production. Plant autonomy is the recommended direction; specific new biological policies remain proposals until selected.



## Decision and useful scope



Develop functional diversity in connected animal/flora waves. Treat 237 animal parts as a possible library size, with admission based on distinct consequences. Count playable ecological strategies separately from registry entries, capability tags and heritable parameters. Start with functional plant tissues and genotype-bearing propagules, then add an animal organ only when it opens a working interaction. New players encounter nearby organisms and understandable actions; the editor presents reachable adaptations, while Lab and advanced inspection expose the full library.



Animal reproductive compatibility remains a provisional model with a demonstrated within-population fertility calibration issue. The flora design can proceed independently, but plant sexual reproduction must receive its own compatibility design rather than copying that uncalibrated fertility curve. Existing World Trails, funded offspring, reciprocal courtship, mixed-body inheritance and matching-build editing remain preserved foundations.



## Verified current foundation



The adjacent source inventory is generated from current exports, not an older backlog.



| Current source | Verified role | Expansion constraint |

| --- | --- | --- |

| src/lineage/part-registry.js | 79 parts, 39 declared capability tags, eight socket types; mass, upkeep, precursors and mounted anatomy metadata | Tags are not proof of separate implemented mechanics; effectContributions remains empty, with numeric authority elsewhere |

| src/lineage/part-abilities.js | Cached part counts per body-plan object; anatomy effects, upkeep and specialized action owners | Extend structural derivation with safe invalidation, rather than scanning a growing catalog every tick |

| src/ecology/functional-diet.js | Mounted mouth controls terrestrial food/prey validity | Expand tissue-specific ingestion here and through shared resource validation; names remain descriptive |

| src/lineage/lifestyle.js, src/lineage/aquatic.js | Existing travel, swimming, occupancy and water physiology | Movement organs must change real movement/energy/terrain validity together |

| src/lineage/evolution-draft.js | Precursors, ancestry, sockets and budget gates | Current draftProblems also requires four legs, a mouth and an eye. Legless/blind alternative body strategies need a real locomotion/perception viability revision first |

| src/sim/config.js, src/world/world.js | Five land resource kinds, finite biomass arrays, environment indices and three seed-bank arrays | rotcap is fungal/decomposer food, not a botanical lineage; environment indices are not finite water/nutrient stores |

| src/ecology/dispersal.js | Seed-limited germination, local spread, animal gut cargo, decay, dung effects and disturbed-soil establishment | Banks/cargo hold kind and quantity, not inherited genotypes; existing seed release is not a complete reproductive allocation budget |

| src/sim/simulation.js | Single vegetation phase; moisture/temperature/fertility-dependent growth; grazing scars and decomposition | Move ownership deliberately; a second cohort engine must not grow the same biomass again |

| src/ecology/freshwater-food.js | Three producer categories: algae/biofilm, duckweed, waterweed; finite larvae/fry transfers and detritus | Larvae, fry and detritus are not plants. Algal producers need appropriate population/reproduction treatment |

| src/gameplay/foraging.js, interaction-command.js, discovery.js | Canonical feeding, patch memory, contextual actions and actual feeding evidence | Plant cohort/channel identity must survive selection, approach, consumption and learned knowledge |

| src/persistence/save-manager.js | Current world biomass, seed banks, animal cargo and controller snapshots | A flora migration must preserve quantities and RNG continuity; old biomass must not be replayed as extra founder stock |

| src/ecology/regions.js | Regional observation/history | It is not yet an authoritative distant genotype-cohort growth/reconciliation engine |



There are seven producer resource categories across land and freshwater, plus fungal and animal/detrital resources. They are not seven independently evolving plant species. 6–8 founding flora populations is a possible initial sampling target, not a new ecosystem cap or taxonomic rule.



Tripling 79 would add 158 parts. At eight directions × two frames this is at least 2,528 directional frames; rig sections and authored action cycles add work beyond that arithmetic. Two idle frames alone do not establish organic locomotion. Author artwork after each gameplay contract, mount and anatomical silhouette is settled.



## One expansion contract per functional capability



Every candidate requires: an actual player intention; mounted anatomical prerequisites; physiological costs; finite affected resources; one action validator and executor; corresponding wildlife decision use; inherited expression; visible reaction/animation; optional deeper explanation; save compatibility; and controller plus real-runtime proof. Costs have units and a single owner. A part enabling an existing action is an anatomical variant; an interaction with genuinely new consequences is a capability expansion. Neither is a new hardcoded creature class.



The following is the full functional map for planning. Named organs are candidates, not new registered IDs or approved final artwork. Each family begins with the smallest complete organ/resource pairing; additional variants earn admission through another ecological consequence.



### Wave A — perception, feeding and movement



| Functional family | Candidate anatomy / reuse | New loop or consequence | Owning authority / dependency | Tradeoff and readable feedback |

| --- | --- | --- | --- | --- |

| Surface vibration | Vibration pad, jaw-contact sensor; extend sensory-bristle | Detect actual nearby steps/strikes, investigate their evidence | Cognition/discovery consumes real movement/impact receipts; range and substrate transmission needed | Contact/quiet posture and sensory upkeep; directional disturbance, not a hidden-animal compass |

| Chemical evidence | Olfactory pit, sensory feeler | Read real scent/food deposits and lose old evidence | Discovery + bounded source-owned deposits; current display scent alone is insufficient | Sensor upkeep, wind/age limits; visible investigation and uncertain source |

| Water perception | Lateral sensor strip, low-light eye | Detect actual water disturbances and feed in lawful submerged reach | Freshwater + cognition + shared travel/access rules | Water advantage with land sensitivity/cost penalties; ripples and orienting pose |

| Selective grazing | Browsing lip, shear plate; existing grazing/nibbler mouth | Choose leaves, shoots or fruit from real tissue channels | Functional diet + foraging + flora tissue budget | Extraction efficiency versus resistant tissues; target-specific dynamic labels |

| Hard food processing | Shell-opening jaw, seed shear; existing kernel-beak/crushing-jaw | Open finite coats/shells before consuming edible material | Shared food validator; actual coat resistance and finite contents required | Handling time, exertion and narrower diet; visible opening, failed grip, exposed contents |

| Probing food | Probe mouth, retractile feeding tip | Reach finite food in narrow plant structures or substrate | Plant channels first; buried prey requires a separately funded prey/substrate system | Specialization limits broad grazing; clear reach/anatomy reason |

| Surface traction | Mud pad, hooked toe; existing grip-pad | Different route/energy outcomes on mud or rough ground | movementProfile/canOccupy + actual substrate properties | Specialized speed/mass/cost; foot contact and slipping outcome |

| Shallow-water travel | Paddle foot, flexible fin; existing webbed-leg/paddle-tail | Cross, escape and forage using actual water/land physiology | Existing aquatic/movement authorities | Propulsion versus land efficiency and respiration; grounded bank-entry animation |

| Burst versus endurance | Elastic limb, endurance tissue; existing spring/runner legs | Distinct chase/escape pacing without free movement | Exertion, activity and movement | Burst breath cost versus sustained upkeep; windup, fatigue and recovery |



Climbing, sustained flight and unrestricted legless movement remain infrastructure-dependent candidates. A decorative wing or torso cannot grant them before routes, collision, energy, body validity and runtime animation work.



### Wave B — social, reproductive and defensive anatomy



| Functional family | Candidate anatomy / reuse | New consequence | Authority / dependency | Tradeoff and feedback |

| --- | --- | --- | --- | --- |

| Display surface | Flexible fan, color surface; existing crests/tails | More inherited display variation, without universal attractiveness | Existing expressed traits, individual preferences and performance | Visibility/upkeep; actual mounted art and observable responses |

| Call production | Resonant sac, click plate; existing mouths/echo-crest | Distinct inherited communications and lawful audibility | Courtship/cognition/audio; real source/propagation records | Signal cost/range/exposure; source-linked call animation/audio |

| Gesture/contact | Flexible feeler, grasping digit; existing grasper | Physical gesturing/handling with genuine reachable partners | Existing courtship and manipulation controllers | Slot/mass/handling costs; hand/feeler motion and withdrawal |

| Threat display | Expanding mantle, rattle surface | Real risk assessment and possible retreat, separate from guaranteed intimidation | Existing predator/social decisions; condition-aware response needed | Exposure/cost; observable opponent movement, no compulsory success |

| Directional protection | Overlapping plates, yielding pad; existing armor/shell | Different vulnerability by actual contact direction | Combat/injury/body mass | Mass, upkeep and flexibility; planted defense and impact response |

| Contact deterrence | Irritant surface, recoil spine; existing barbs/venom | Paid, finite deterrence or delivery on real contact | Combat/toxin owner; contact and dose validation | Finite secretion, self-upkeep and mounting limits; dose/exhaustion feedback |

| Egg/nest handling | Brood cradle, carrying digit; existing egg chamber/grasper | Carry or protect a real egg without duplicating it | Existing egg/nest controller; spatial transfer and transport costs | Capacity/encumbrance; carried egg identity, exposure and dropping |

| Dependent provisioning | Food pouch, care gland; existing storage/caregiver actions | Finite provisioning or care based on actual dependent needs | Existing family/resource transfer authorities | Paid reserves, carrying limits; real delivery and recipient response |



Reproductive organ mounting does not replace dedicated compatibility loci or voluntary acceptance. New gland functions require finite production/transfer designs; they must not award nutrition or health solely because an animation plays.



### Wave C — ecological specialization and engineering



| Functional family | Candidate anatomy / reuse | New loop | Authority / missing infrastructure | Tradeoff and feedback |

| --- | --- | --- | --- | --- |

| Nectar and pollen transport | Feeding tube, pollen brush | Finite nectar extraction and actual compatible pollen transfer | Floral reproductive channels, pollen provenance and plant compatibility first | Narrow diet/handling cost; visible blossom visit and pollen cargo |

| Fruit dispersal versus seed destruction | Gut chamber, seed grinder | Consume flesh, transport viable propagules or destroy embryos | Existing dispersal + genotype-bearing cargo + actual tissue extraction | Digestion/survival tradeoffs; deposited seeds and changed offspring establishment |

| Chemical food tolerance | Detoxifying tissue, selective gut | Eat defended tissues at actual physiological cost | Shared diet + bounded toxin/dose/metabolism model | Upkeep/capacity and alternative-food efficiency; dose, illness and failure explanation |

| Soil excavation | Spade limb, sensory probe; existing digging forelimb | Expose stored plant tissues or create usable space | Existing soil disturbance; connected tunnels require separate topology/oxygen/flooding work | Work/energy/soil limits; actual disturbed ground and finite food removed |

| Shelter fabrication | Cutting mouth, weaving digit; existing carrying/shelter | Transfer real material into different usable shelter properties | Existing shelter construction + material extraction/structural receipts | Time/reserves/transport; visible structure progress and condition |

| Bank/root disturbance | Excavating pad, anchoring limb | Alter actual rooting/substrate conditions through performed work | Disturbance now; sediment/hydrological change requires persistent material authority | Work and habitat risk; persistent affected patch |

| Thermal specialization | Insulating tissue, heat-exchange surface | Different survival/energy consequences in real local temperature | Existing exposure/physiology + future inherited life-history authority | Insulation versus heat dissipation/mass/upkeep; readable stress and recovery |

| Water/nutrient filtering | Mucus sieve, retention surface; existing filter mouths | Selectively transfer actual suspended food/material | Existing freshwater trophic stocks; filtration and deposition budgets | Throughput versus maintenance/oxygen/handling cost; finite source depletion |

| Food retention | Cache pouch, sealing tissue | Move/store actual food with decay and theft consequences | Existing carrying/shelter stores; persistent resource identity and spoilage needed | Encumbrance, upkeep and loss risk; inspectable deposits and actual withdrawals |



Hypothetical amphibious hunters, armored diggers and nectar specialists are outcomes of these capabilities and inherited bodies, never predefined species bundles.



## Plant-specific modular biology: 25 candidate adaptation axes



These are proposed heritable functions, not implemented genotypes or final numeric balance. Baseline trait values should reconstruct existing founders before variation is enabled. Allele domains must use the plant mechanism's units; animal survival or reproductive coefficients are not transplanted automatically.



| Group | Heritable axis | Actual benefit / required consequence | Cost or restriction |

| --- | --- | --- | --- |

| Roots | Root depth | Access a genuinely deeper moisture/nutrient pool | Root biomass/construction; depth has no benefit before that pool exists |

| Roots | Lateral spread | Compete within a larger actual root footprint | Construction/maintenance and local competition |

| Roots | Storage allocation | Maintain a finite edible/root reserve | Reduced immediate canopy/reproduction allocation |

| Roots | Air transport | Survive measured root-zone waterlogging | Tissue cost and narrower dry-site efficiency |

| Stems | Height | Compete for measured light | Construction/support and delayed reproduction |

| Stems | Woodiness | Durable support and persistent habitat/material | Slow costly construction; dead wood remains finite material |

| Stems | Flexibility | Different wind/contact damage response | Support/height tradeoff; real force model needed |

| Leaves | Surface allocation | Increase photosynthetic uptake under available light | Water demand, construction and herbivore exposure |

| Leaves | Protective wax | Reduce tissue water loss | Construction and uptake/growth tradeoff |

| Leaves | Floating support | Reach light at a water surface | Anatomy/position constraints and biomass investment |

| Defense | Tissue toughness | Slow lawful extraction | Construction and reduced fast growth |

| Defense | Mechanical defense | Deter/damage through actual reachable contact | Structural allocation; herbivores can have counter-capabilities |

| Defense | Chemical defense | Dose consumers from finite chemical stores | Paid production, depletion and actual digestive tolerance |

| Defense | Regrowth allocation | Restore lost tissue from real reserves | Reduced reproduction/storage elsewhere; no free biomass |

| Physiology | Thermal response | Shift optimum/tolerance in actual temperature | Efficiency outside the selected niche |

| Physiology | Water conservation | Survive scarcity using a measured water budget | Slower uptake/growth where water is plentiful |

| Physiology | Nutrient uptake | Change extraction from shared available substrate | Root/symbiont costs; no generated nutrients |

| Reproduction | Floral investment | Produce real sexual structures/pollen/reward | Finite tissue/reward allocation; flowering prerequisite |

| Reproduction | Self-compatibility | Permit a compatible selfing route when inherited | Consequences require a separate reviewed genetic design |

| Reproduction | Clonal runners | Establish descendants through paid connected growth | Spatial/biomass costs; clone ancestry retained |

| Reproduction | Dormancy response | Retain living propagules until actual cues fit | Decay, delayed establishment and finite storage |

| Dispersal | Aerodynamic structures | Move propagules through real bounded wind transport | Construction/seed mass and deposition uncertainty |

| Dispersal | Fruit and seed coat | Reward carriers and protect a real embryo in gut transit | Paid flesh/coat allocation and destruction risk |

| Dispersal | Attachment hooks | Transfer propagules through real animal contact/cargo | Construction and recipient contact limits |

| Dispersal | Buoyancy | Float viable propagules to reachable wet sites | Transport/viability tradeoffs and actual water routing |



Seed, spore and vegetative propagules are distinct reproduction routes, with appropriate structural prerequisites. Moss-like or algal producers are not automatically pollen-bearing flowering plants. Fungi remain a separate substrate/decomposition/symbiosis development track; preserve rotcap as a legacy resource alias during migration.



## Architecture and ownership



### Shared foundations, organism-specific authorities



Share deterministic randomness helpers, versioned genotype/provenance records, allele validation primitives, ancestry/history conventions, cached structural derivation, resource-transfer receipts and save tooling. Plants own their growth/allocation, reproduction, dormancy and environmental response; animals retain existing anatomy, voluntary courtship and action controllers. A plant registry uses root/stem/leaf/reproductive structures and appropriate sockets, not animal eye/leg validation.



Animal structural capability profiles derive only from mounted anatomy and registry revision. Cache structural counts/capability sets on an immutable plan or explicit revision; current per-object caches become stale if a plan is edited in place. Genotype-dependent derivations use their own revision. Physiology, distance, current doses, environment and resources are freshly validated by existing action owners. Declared graze/crush/track tags do not bypass diet or action validity.



### Representation



- Ground cover/reeds/small producers: bounded spatial genotype cohorts with biomass and developmental composition, rather than an entity per blade.

- Important shrubs/trees/unusual specimens: individuals only where identity/structure/reproductive interaction requires it; a materialized individual is removed from aggregate accounting exactly once.

- Propagules: bounded genotype-referenced cohorts carrying quantity, viability, provenance and germination route/cues. Each genome record remains immutable and reference counted.

- Regional aggregates: later reconcile identical stocks/provenance when materializing near-field populations. Existing region observations are not that simulation yet.



Limits are technical benchmark choices. Aggregation must preserve biomass, viable propagule amounts, important genetic variation and provenance within documented error bounds; silently deleting rare genotypes or adding replacement stock changes biology. Establish a measured preservation/overflow policy before enabling large populations.



### Single biomass authority and migration



First audit every writer of world.plants and seedBank. Transfer growth/consumption/dispersal ownership one resource group at a time. A compatibility projection may expose old resource keys for rendering/search/saves, but consumes must debit the authoritative cohort/tissue stock. Typed-array projections cannot remain independently writable while another system owns the biomass. The old vegetation loop must stop updating adopted stock. Save migration partitions existing amounts into baseline cohorts; it does not add new biomass, seeds or nutrients. Historical world aliases remain readable during the transition.



The current moisture/fertility fields are condition indices. They can drive an explicitly approximate first growth model, but must not be reported as conserved water/nutrient stores. Tissue allocation and shared competition need genuine budgets. Solar input is an accounted external energy source; reserve transfer, seed construction, tissue consumption and decomposition are finite internal transfers.



### Shared interaction and evidence



Selected flora targets need stable cohort/individual identity, spatial cell and tissue channel, with a phenotype revision for stale-state checks. World selection, radial menus, dock, E, wildlife food search and carrying surveys consult the same resource/diet authority. Explicit selection does not substitute a different nearby cohort. Readiness retains Available / Approachable / Unavailable, with risk information where appropriate. Costs, mouth restrictions and depleted channels explain themselves.



Use dynamic labels such as Graze shoots, Eat fruit, Open pod or Inspect. Different evolved organs alter what those intentions accomplish. Feeding marks, patch memory and seed cargo carry actual producer/channel provenance; old kind-only fields remain compatibility aliases. Discovery teaches observed facts, not hidden genotype certainty or free mutation rewards.



### Living habitats



Derive habitat descriptions from climate, water/substrate, producer structure and recorded biological changes. Height/shade, rooting, litter and transpiration can affect those actual conditions as their underlying processes are implemented. Grassland/forest/wetland/dryland are readable descriptions of conditions, not hardcoded capability switches. Hydrology, erosion and geology retain their own material/time authorities; vegetation does not manufacture every biome.



## Integrated sequence and gates



| Pass | Deliverable | Proof required before expansion |

| --- | --- | --- |

| 0 — this design | Current-source inventory, complete functional family map, plant representation/ownership and staged scope | Trace every proposed loop to an existing owner or an explicit infrastructure gap |

| 1 — functional tissue/propagule bridge | One producer lineage exposes finite leaf/fruit/seed channels; current mouths have lawful distinct interactions; seed cargo/bank preserves source genotype; founding genotype fixed initially | Mouse select → understand → consume/handle → watch consequence; manual/wild parity, depletion, exact selection, mass accounting and old-save stock equality |

| 2 — heritable flora slice | Two or more compatible local genotypes reproduce/clone/disperse; one defense/allocation axis and one habitat-response axis mutate in actual offspring | Frozen adult genotype, causal parent receipts, inherited variation, genuine establishment/death and save round-trip; controlled proof separate from unstaged selection |

| 3 — first animal–plant adaptive loop | Soft versus resistant finite tissues interact with real mouth capability and plant reproductive success; a new organ only if existing organs cannot express a distinct role | Repeated real grazing changes survival/reproduction; costs can make specialization lose; no guaranteed arms race or rescue population |

| 4 — pollination/dispersal specialization | Paid floral rewards, compatible pollen/propagule transfers and lawful anatomy variants | Finite rewards/cargo, distinct destruction/transport outcomes, actual offspring, no clone disguised as hybrid |

| 5 — larger flora structures/habitats | Height/light competition, retained litter/wood, aquatic/root effects and bounded regional cohorts | Conservation/reconciliation, native silhouettes, persistent affected routes/resources, crowded-scene performance and save fidelity |

| Subsequent A/B/C waves | Admit complete functional animal families from the map, incrementally author native parts | Each wave demonstrably changes ordinary gameplay; inspect whole 800×600 workflows and naturally occurring outcomes |



**Recommended first implementation:** pass 1, using existing feeding mouths and bramble/thistlepod resource aliases as migration fixtures. Separate edible flesh, coat and viable propagules and carry inherited producer identity through real consumption/deposition. Preserve fixed founder genotype until this bridge is verified; introducing 25 simultaneous mutations would obscure transfer bugs. Choose the first selective traits after the allocation model is concrete. This is a complete resource/discovery activity, not a new button grid or a claim that plant evolution is already implemented.



## Art, animation and discoverability gates



Each admitted organ uses actual mounted geometry, current native part editing and directional assets. Author readable root attachment, tissue volume, joint transitions, silhouette and movement-specific response; test real inherited/hybrid bodies, not a showcase species. Canopies/flowers use functional plant structures and real reproductive state. Distinguish a conceptual reference, installed asset, controlled runtime capture, natural observation and creator visual approval.



The evolution editor's primary list comes from current body, ancestry, real developmental precursors, budget and successful reproductive opportunity. Group by a biological intention and show only the next useful reachable developments; deeper catalog browsing stays one click away. Learned rituals or observations do not become compulsory mating gates. Survival restrictions remain immediately understandable.



## Performance and verification



Benchmark cost against mounted parts, active nearby resources and actual cohort count—not total catalog size. Structural derivation is revision driven; resource searches use spatial indices; slow growth/reproduction/dormancy updates use appropriate clocks. Rendering blades or leaves does not create simulated individuals. Record cache misses, action-query time, vegetation-step time, maximum seed/genome record counts, memory/save size and crowded-scene frame times on the same scenes before/after each wave. Establish budgets from measurements instead of inventing pass thresholds or prematurely balancing the current trail count.



Required matrix: multiple diets; valid and missing sensory/handling anatomy; incompatible mouth/tissue; selected versus ambiguous resources; approach and interruption; depleted reserves; seed destruction versus survival; inactive/dormant banks; parent death; clone and sexual offspring; mutation/selection without adult rewriting; old/current save migration; paused clocks; dense and sparse habitats. Native 800×600 screenshots/animations show the entire interaction loop. Controlled fixtures validate mechanics; unstaged observation validates occurrence; unfamiliar-player testing separately validates comprehension and interest.



## Approved architectural direction — subsequent creator instructions



The creator approved the following directions in the botanical and vertical ecology attachments. These supersede the earlier open architectural questions. Exact compatibility genetics, numerical balance and final artwork remain open.



- Plant-specific reproductive genetics support compatible pollen production/reception, inherited self-compatibility, actual wind/water/animal pollen transfers, appropriate clonal propagation and genuine two-parent hybrids with heritable viability/fertility. Sharing flowers or a resource label never proves compatibility. Do not reuse animal reproduction as plant biology.

- Establish resource accounting before coefficients or reproductive expansion. Sunlight is incoming energy flux; finite water, nutrients, reserves and biomass must debit/credit their real owners. Leaf/root/stem/defense/storage/reproductive allocations compete for available resources. Current fertility/moisture indices are not conserved nutrient/water inventories.

- Significant producers can be individuals; small producers can be genotype cohorts. Preserve actual inherited genotype distributions, counts and rare records in persistent seed banks. Never reconstruct erased variation afterward. Measure practical bounds before setting aggregation limits.

- Body validity is functional: viable propulsion rather than compulsory legs, alternative sensing rather than compulsory eyes, grip relative to mass, launch conditions for gliding, lift/power/respiration/energy for flight, and environment-appropriate aquatic capability. Loss without a replacement has consequences.

- Elevation is fundamental world state, not decorative sprite offset. Shared support surfaces and relative height precede climbing/gliding/flight. Vertical reach must gate all feeding, attack, courtship, shelter and nesting interactions, not merely navigation.

- Defer bulk art. First prove a complete inherited defense–feeding–survival–reproduction loop; then author a small functional root/foliage/reproductive/defense set through native art review.



### Revised next milestone and ownership



Finish the tissue bridge, then implement the **environmental resource contract** before plant reproductive genetics, genotype distributions, generalized locomotion and functional art. Keep existing feeding/dispersal/vegetation owners; add explicit environmental stores and one accountable growth transfer path. `src/world/world.js` owns environmental arrays, `phaseVegetation` schedules growth, `PlantDispersalController` owns funded propagules, and the persistence codec migrates them. Resource aliases remain migration labels, not reproductive classes.



Proposed ledger entries must identify owner, resource, quantity before/after, source/sink and tick. Constrain transfers by the minimum available input; withdraw once, partition output once, reconcile consumption/death/litter/germination and preserve non-negative finite stores. Photosynthetic flux may replenish chemical reserves but cannot create soil nutrients or water. Do not infer nutrient mass from the existing 0–1 fertility index without an explicit migration contract. Legacy worlds need deterministic stock initialization and reported baseline differences; do not rewrite their existing plant biomass or RNG stream.



Vertical foundation follows through the existing `Simulation.canOccupy`, `canReach`, movement profiles and route planner. Current World has no physical heightfield. Add a compact terrain elevation field and surface-relative organism height/support identity with zero-height legacy behavior. Validate actual slope traversal, fall consequences and drainage before elevated plant habitats. Climbing/perching follows; gliding/powered flight follows that; aerial food webs/migration follow working transitions. One anatomy assembly renderer adds vertical placement, shadows and depth ordering. No flying/climbing species classes, universal flight toggle or full-world 3D collision simulation.



These are architectural contracts and staged ownership, not implemented resource-ledger, plant hybridization or vertical locomotion claims.



## Creator decisions still open



- Exact plant compatibility loci, selfing/hybrid consequences and first working inheritance model.

- Environmental stock units and legacy migration, followed by measured growth/allocation coefficients and the first selective tradeoff.

- Measured cohort limits and concrete preservation policy for rare inherited variants.

- Quantitative grip/lift/power/launch contracts and elevated support geometry after the foundation works.

- Final functional art direction and native asset approval.



The 237-part aspiration and 6–8/20–30 flora targets remain optional planning scales. Successful expansion is measured by distinct inherited strategies and observable consequences in an evolving world.



## Clonal inheritance decision and delivered slice — 2026-10-13

The creator chose clonal inheritance first rather than immediate pollen-based sexual reproduction. The implemented first heritable axis is reproductive allocation versus edible tissue. Adults remain immutable and seed/cargo cohorts retain genotype quantities. See `docs/GenVo-Clonal-Flora-Inheritance-Review.md`. This approves the clonal sequence; exact plant sexual compatibility/selfing/hybrid consequences remain open. Quantities are continuous biomass, not integer demographic counts, and no natural adaptive equilibrium or mature multi-generation ecology is established.


## Inherited protective-coat checkpoint — October 13, 2026

The clonal protective-coat allocation slice is now implemented over the existing finite tissue/handling controllers, preserving old adults and saves. Native runtime selection, Inspect, direct E feeding and seed/cargo inheritance are verified; inspector clicks preserve the selected target. See `docs/GenVo-Inherited-Coats-Review.md`. Next priority is longer ordinary plant–consumer gameplay and lineage observation. Natural adaptive balance, coat-dependent gut survival, sexual flora compatibility and vertical locomotion remain open; this checkpoint does not imply approval or completion of those proposed rules.


## Seed journeys and feeding expression checkpoint — October 13, 2026

Persistent sensory-gated seed observations, journal-driven actual revisit movement, exact deposit contribution attribution and mounted-mouth handling expression are now implemented. This closes the integrated discovery/handling slice without adding biological rules or duplicate controllers. See `docs/GenVo-Seed-Journeys-Review.md`. Next priority is ordinary early-survival readability and spontaneous encounter frequency; natural ecological balance and human comprehension remain unproven.


## Active-goal immediate interface priority — October 13, 2026

Lab fit/placement/reference visibility, expanded fixed-chrome information windows, and actual conception-parent/offspring anatomy visualization are integrated and verified in controlled native runtime. Conception phenotype observations preserve wild-parent comparisons without changing biological rules. See `docs/GenVo-Lab-Lineage-Windows-Review.md` and the full seven-priority evidence audit in `docs/GenVo-Development-Goal-Status.md`. The overall goal remains active; plant sexual compatibility/selfing selection and natural/human validation are still open.
