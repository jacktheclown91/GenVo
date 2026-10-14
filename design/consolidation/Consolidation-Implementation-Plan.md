# GenVo consolidation implementation plan

October 14, 2026. This is the source-grounded consolidation direction requested in the attachment. It refines existing content rather than replacing the simulation with fixed creature classes or expanding toward a part-count quota. It serves the full active development goal; completed botanical, interaction, family, Lab and save work remains intact.

## Deliverables and evidence boundary

- [Part Balance Bible](Part-Balance-Bible.md): all 79 current parts, current roles/costs/precursors, seven effect categories, canonical valid-body probes, niche, classification and individual visual direction.
- [Trait Balance Cards](Trait-Balance-Cards.md): 106 current named/context records. Eight survival genes, 17 adaptations, 12 anatomical axes, two animal reproductive loci, 12 preference/ritual/choice parameters, five ordinary flora traits, eight botanical loci, eight proto traits, six lifestyles, two forms, two learned tendencies, five learned habits, one threshold body ability, and 18 physiological/catalog fields.
- [Machine-readable bible](part-balance-bible.json): full numerical values, neutral baseline, paired-leg probes, native asset metadata, source references and source hashes.
- [Audit validation](audit-validation.json): coverage, unique identities, valid representative assemblies and native asset presence. This is source/component verification, not ordinary unscripted gameplay or artistic approval.

The generator uses current canonical exports, anatomy expression, valid body construction, dietary authority and native assets. Rebuild with `node tools/build-part-balance-bible.mjs`. It does not modify game source, living actors, simulation RNG, numerical tuning or art. Current effects remain owned by gameplay modules; proposed roles, progression labels and art standards remain advisory design until applied and evaluated.

## Findings to resolve before numerical balance

| Finding | Current evidence | Consequence / next action |
| --- | --- | --- |
| Declared mass is not physical mass | Registry part mass differs by organ; `bodyMass()` uses founding physiological mass times developmental volume. Every neutral adult probe remains 1.45 despite different parts. Mounted masses currently also serve the separately approved missing-prey normalization contract. | A heavy-part description cannot claim an installed mass penalty. Define and review an actual physical mass/unit model before charging new movement, prey or reproductive costs; do not reinterpret the aquatic fallback as food. |
| Swimming has two eligibility paths | One webbed leg in a valid lineage body expresses water-sacs and webbed-limbs through the adapter, allowing `canSwim`. Direct `swimsByBody` requires two. The paired probe also changes aquatic score and travel factors. | Review one coherent mounted-anatomy rule and migration policy; do not silently disable old inherited traits/saves or assume the two-leg rule already governs everyone. |
| Kernel processing description conflates routes | Current part text says the kernel beak cracks seeds and carries viable seeds. Actual kernel receipts destroy propagules; permitted whole-fruit tissue can still carry intact ones. | Describe tissue/action outcomes separately. Preserve both legitimate meal channels and genotype-bearing cargo; do not change the biology to match the prose. |
| Reproductive organ value is uneven | Bodies without organs remain live-bearing; live-womb alone therefore keeps the same route while costing 7 base MP. Egg + womb provides dual routes with real ongoing/funding costs. | Review explicit fresh-body versus legacy/default reproduction and marginal organ value. No blanket infertility or new compulsory organ requirement without a deliberate transition design. |
| Names can imply unavailable capabilities | Spring legs improve existing sprint, gliding membrane is currently a sprint/land modifier, graspers and prehensile tails carry. There is no shared height/support, jump-access, climbing or aerial controller. | Show implemented benefits truthfully; future vertical ecology remains behind the existing height/support design gate. No invented climbing ability because a part looks capable. |
| Carry structures overlap | Grasper, prehensile tail, long torso, brood pouch and other stores alter existing capacity/costs, but not all have distinct object-handling roles. Brood pouch does not establish offspring carriage merely from its name. | Preserve all current parts first. Test opportunity cost, mount location and visible handling; propose distinct roles before adding mechanics or merging/removing saved identities. |
| Sensory and display roles overlap | Several organs share range/readiness modifiers, while mounts, upkeep, visibility, threat sense and ritual affordances differ. | Compare actual discovery, threat, tracking and funded courtship loops rather than equalizing raw numbers or treating every display as guaranteed attractiveness. |
| Strong traits can lack direct countercosts | Higher metabolism, digestion, senses and immunity genes do not each have an identified direct upkeep penalty. Part upkeep stacks through existing caps. | Classify actual tradeoffs and saturation before inventing generic penalties. Test opportunity costs and niche outcomes; favorable genetic directions are an audit finding, not permission to force symmetry. |
| Some effects still use founding baselines | Part factors normalize wild organisms against starting bodies; physical/density/maintenance defaults remain catalog context. The factor cache is keyed by plan while computation also reads species context. | Audit normalization and cache ownership with shared-body/cross-label controls. Preserve save/founding metadata and approved units; no duplicate phenotype authority. |
| Current regressions limit first-ten-minute confidence | Two learning/practice failures reproduce in prior/current source; shared finite demand costs roughly twice the prior update time in the short browser probe. | Repair real learning/feeding/independence workflows and reduce spikes before declaring balance ready. Retain assertions and finite stocks. |

These findings do not prove that each affected part is overpowered or useless in natural play. They identify where source semantics, presentation and intended costs disagree.

## Milestone 1 — audit and role bible

The source-grounded catalog is produced. Creator role/standard review, proposed rarity and final numerical tuning remain open. Classification separates foundations/generalists from actual dietary, defensive, aquatic, sensory, display and reproductive specialists. Existing precursor depth is recorded; it is not silently converted into a universal technology tree.

Each role must answer: what can the organism do, what useful situation does that open, what finite resource or anatomical opportunity does it spend, what observable consequence demonstrates it, and why choose another part? A capability tag alone does not answer those questions.

## Milestone 2 — current-content balance

Start with locomotion and feeding as one integrated pass, then senses, physical combat/defense and social/reproductive structures. Preserve the current library and approved biological foundations.

1. Repair the two historical learning/practice workflows through valid inherited bodies and genuine food/water actions. Distinguish fixture incompleteness from product failure; never weaken assertions to make them pass.
2. Reduce shared-demand cost with valid bounded derivation/caching, keeping fresh food, exact genotype/tissues, individual affordability, access and finite live prey authoritative. Measure normal rendered player play and large ecosystems; synchronous component timings are insufficient for frame-time acceptance.
3. Resolve swimming and physical-mass normalization with concrete A/B unit/inheritance examples and creator review before changing these biological rules.
4. Compare supported walking, sustained running, spring sprint, heavy brace, quiet stepping, digging, grasping and aquatic travel. Use whole legal bodies, real expenditures and existing controls. No fixed named creature templates.
5. Compare plant tissue grazing, seed cracking, carrion, live prey and bank/submerged feeding. Verify chosen actions, finite debit, energy/handling, seed destruction/cargo and family food transfer.
6. Only then propose numerical mutation costs, rarity weights or new incompatibilities. Current base/seen prices, 8 MP + capped earned bonus and existing threshold/cap definitions stay visible during comparison. Reachable choices and ancestral constraints matter as much as raw price.

Acceptance: current validators/controllers agree; useful differences and costs can be observed in native 800x600 play; controlled paired comparisons are reported separately from naturally evolved populations; saved ancestry/compatibility and rare plant cohorts survive round-trips. Numeric creator decisions are recorded before implementation. No stable ecosystem or extinction outcome is forced.

## Milestone 3 — creature art and animation quality

Improve current parts rather than producing more variants. Start with leg/hip/foot attachment and face readability, then feeding structures and encounter expressions. Individual visual identities for every part are in the bible.

At gameplay zoom, the current natural screenshots show compact creatures with tiny faces and crowded limb detail. The dock is clearer than earlier versions, but a player cannot be assumed to distinguish a runner, spring, webbed or grasping limb from those screenshots. This is a critical visual assessment, not a measured human result. The existing detailed native sheets and valid rigs are foundations; adding more pixels is not itself an improvement.

Proposed art standards:

- Organic continuous trunk/head/limb silhouettes with believable joins and visible soft seams; no detached sticker intersections.
- Different leg levers and feet for sustained running, loaded stance, spring compression, quiet pads, webbing and grasping. Keep actual supporting contacts and mounted anatomy.
- Faces with readable pupil direction, contrast and posture at normal gameplay size. Do not enlarge biology to solve an artwork problem.
- Feeding shows actual peck/crush/pull/suction/filter receipts; cracking visibly differs from swallowing intact fruit. Gestation/egg care use real simulation states.
- Spring compression/recoil, aquatic paddling, heavy acceleration/brace and grasping motions reflect existing actions. Idle breathing stays grounded and pause-aware.
- Courtship shows funded selected sequences and observable partner reactions; combat shows windup, impact/brace, injury and withdrawal. Keep hidden preference calculations out of ordinary HUD feedback.
- Native all-facing full-creature screenshots and recordings at embedded resolution are required. Lab closeups supplement world evidence. Review clipping, socket alignment, silhouette, eye readability, action comprehension and nearby-creature distinction; creator approval remains separate from automated bounds checks.

## Milestone 4 — UI research and interaction polish

Keep the compact dock/radial architecture and authoritative shared command paths. Study contextual selection, layered inspection and creature identification using primary references during this milestone; Spore creature-stage materials, strategy/sim information layers and naturalist field-guide conventions are research targets, not completed comparative research.

Ordinary view: creature identity/needs, movement, contextual Interact, independent Drink/Attack/Defend/Rest, target options and observable outcomes. Advanced view: anatomy, genes, exact ecology, tissue viability, preferences, compatibility, comparisons and editor costs. Biological failure explanations remain accessible without demanding technical inspection.

Fullscreen can be preferred for inspection, but 800x600 remains an acceptance viewport. Fixed close/identity headers, a single scroll owner, readable click targets and preserved keyboard focus are retained. Do not permanently expand the dock or duplicate whole radial action lists. Test target selection → action understanding → valid approach/execution → visible outcome → optional Why/Inspect. Human first-time evidence remains required; automated operation is not a substitute.

## Milestone 5 — progression tuning

| Layer | Meaningful player change | Existing foundations | Required proof |
| --- | --- | --- | --- |
| Immediate survival | Recognize food/water, use anatomy, survive danger, read another organism's reaction | Contextual actions, trails, funded combat/courtship, needs, illness/injury | Unfamiliar players discover the loop; failures explain themselves; no hotkey lesson required |
| Generational | Choose a real biological opportunity, observe a different child, raise it and hand off control | Inherited bodies/loci, actual parent comparisons, MP handoff, care/practice, mixed-body offspring | Commit → funded birth → actual anatomy → visible behavior → independent survival/handoff, with save continuity |
| Long-term evolution | Specialized diets/habitats, hybrid outcomes, divergence, plant/animal feedback | Dedicated compatibility, botanical tissue/pollen/seeds, shared demand, genealogy and population history | Unstaged longitudinal ancestry and ecological observations; neither forced isolation nor guaranteed rescue |

A new organ or stronger stat is not automatically progression. Prioritize a new reachable activity, a visible consequence or a meaningful lineage choice. Existing matching-body editor opportunities remain distinct from biological compatibility; divergent anatomy must not become a universal mating barrier.

## Preserved open work and delivery policy

Resource-scaled founders, broad wild family care, full generation transitions, naturally selected botanical divergence, rare-cohort scalability, subjective audio listening, unfamiliar-human engagement and height/support surfaces remain open. The prior expansion map is historical context, not a list of still-unimplemented botanical features.

This milestone changes design artifacts and the audit generator only. The gameplay source, native assets and currently delivered itch ZIP remain unchanged. Create another source/web package only after a substantive integrated implementation pass has been verified. The full active goal is not marked complete by this catalog.

### Implementation status: learned outings

The initial learning/practice repair is now implemented and verified; see [the learned outings review](../../docs/GenVo-Learned-Outings-Review.md). Both historical suites pass after valid fixture repair, with additional actual-source regressions and native autonomous movement/food/water/return evidence. The earlier findings table records the audit state before this pass; its learning/practice failure is no longer an open assertion. Shared-demand timing, swimming/mass policy and broader balance remain open.


## 2026-10-14 consolidation foundation source checkpoint

Learning/practice remain green. Context-dependent phenotype caching is corrected; authoritative finite-food demand has an exact-parity optimization (12.68% lower short browser update time). 18 focused checks, native complete-body movement/meals/save proof and a normal ten-minute lifecycle run are recorded. See `docs/GenVo-Consolidation-Foundation-Review.md`. Mass/swimming proposals are ready for creator review, not implemented numeric balance. Overall development goal remains active.
