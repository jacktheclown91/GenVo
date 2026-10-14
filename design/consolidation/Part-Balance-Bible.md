# GenVo Part Balance Bible

Source-grounded design audit; proposals are not installed balance or creator approval.

Coverage: **79 parts and 106 trait records**. Current definitions and numerical probes are separated from proposals. Source hashes and complete values are in [part-balance-bible.json](part-balance-bible.json).

## Authority and interpretation

- Registry mass is declared design metadata; physical body mass currently uses founding physiological mass and developmental volume. Do not present it as an installed mass penalty.
- Upkeep contributes to a combined metabolism factor and existing clamps; it is not a standalone per-action energy debit.
- The current birth mutation probability is 0.25 for an optional bounded body variation, not the rarity of each part. Conditional options and relic discovery control availability.
- Ancestry depth describes prerequisite structure. Proposed progression tiers and qualitative classification do not create new locks.
- These are valid assembled-body component probes, not naturally evolved outcomes or human balance acceptance. They use a neutral adult GenVo physiological baseline; founding-relative effect paths remain a separate authority audit.
- No new costs, rarity rates, exclusions, biological rules or creature templates are installed by this document.

## Part overview

| Part | Role | Base / seen MP | Prerequisite depth | Proposed tier |
| --- | --- | --- | --- | --- |
| [head-base](#head-base) | Neutral face attachment; no ability granted | 0 / 0 | 0 | foundation |
| [small-torso](#small-torso) | The starting body: four leg slots, cheap to run | 0 / 0 | 0 | foundation |
| [soft-torso](#soft-torso) | Eight leg slots and two flank slots each side | 2 / 1 | 1 | early specialization |
| [reinforced-torso](#reinforced-torso) | Takes less damage | 4 / 3 | 2 | generational specialization |
| [sleek-torso](#sleek-torso) | Faster sprint | 3 / 2 | 2 | generational specialization |
| [light-torso](#light-torso) | Six leg slots, needs less food, sprints a little faster | 2 / 1 | 1 | early specialization |
| [stout-torso](#stout-torso) | Lasts longer without food · three flank slots each side | 3 / 2 | 2 | generational specialization |
| [barrel-torso](#barrel-torso) | Holds water, drinks less often · ten leg slots, four eyes, two back slots | 5 / 4 | 3 | generational specialization |
| [dome-torso](#dome-torso) | Shell halves hits from behind, less damage overall · two back slots | 6 / 5 | 3 | generational specialization |
| [long-torso](#long-torso) | Twelve leg slots, four eyes, three flank and two back slots · carries more | 6 / 5 | 3 | generational specialization |
| [walking-leg](#walking-leg) | Baseline supported land gait and dance support | 1 / 1 | 0 | early specialization |
| [spring-leg](#spring-leg) | Sprint/escape specialization through the existing spring anatomy axis | 2 / 1 | 1 | early specialization |
| [grasper](#grasper) | Food transport and anatomical gesture support | 2 / 1 | 1 | early specialization |
| [runner-leg](#runner-leg) | Faster on land | 2 / 1 | 1 | early specialization |
| [sturdy-leg](#sturdy-leg) | Stronger brace against charges | 2 / 1 | 1 | early specialization |
| [webbed-leg](#webbed-leg) | Swims across rivers and open water (brings Water Sacs with it) | 2 / 1 | 1 | early specialization |
| [padded-leg](#padded-leg) | Quiet steps: sprinting is not heard and Stalkers see you later (two or more) | 2 / 1 | 1 | early specialization |
| [digging-forelimb](#digging-forelimb) | Digs roots with E on open ground · hides in thinner cover | 2 / 1 | 1 | early specialization |
| [grazing-mouth](#grazing-mouth) | Plant-guild generalist with grazing and vocal-call support | 1 / 1 | 0 | early specialization |
| [tearing-jaw](#tearing-jaw) | Live-prey/carrion specialization and heavier jaw expression | 2 / 1 | 1 | early specialization |
| [crushing-jaw](#crushing-jaw) | Prey and destructive seed processing; stronger jaw expression | 3 / 2 | 2 | generational specialization |
| [beak-mouth](#beak-mouth) | Much better on seed pods | 2 / 1 | 1 | early specialization |
| [kernel-beak](#kernel-beak) | Cracks hard seed pods for food; crushed seeds cannot grow | 3 / 2 | 2 | generational specialization |
| [filter-mouth](#filter-mouth) | Feeds while drinking at the water's edge | 2 / 1 | 1 | early specialization |
| [reed-sieve-mouth](#reed-sieve-mouth) | Sifts algae, aquatic larvae and detritus from water | 3 / 2 | 2 | generational specialization |
| [nibbler-mouth](#nibbler-mouth) | Very cheap to run | 2 / 1 | 1 | early specialization |
| [sucker-mouth](#sucker-mouth) | Much better on carrion | 2 / 1 | 2 | generational specialization |
| [gape-mouth](#gape-mouth) | Hunts land more often, more food from prey | 3 / 2 | 2 | generational specialization |
| [simple-eye](#simple-eye) | Baseline visual observation | 1 / 1 | 0 | early specialization |
| [wide-field-eye](#wide-field-eye) | Spots threats farther away and from behind | 2 / 1 | 1 | early specialization |
| [hunter-eye](#hunter-eye) | Hunts and pounces land more often | 2 / 1 | 1 | early specialization |
| [stalk-eye](#stalk-eye) | Finds food farther away, through plant cover | 2 / 1 | 1 | early specialization |
| [compound-eye](#compound-eye) | Spots threats farther and from behind | 3 / 2 | 2 | generational specialization |
| [tracker-eye](#tracker-eye) | Food and water shown and found farther away | 2 / 1 | 1 | early specialization |
| [display-eye](#display-eye) | Courts and mates at lower energy | 2 / 1 | 1 | early specialization |
| [eyespot](#eyespot) | Almost no upkeep | 1 / 1 | 0 | early specialization |
| [armor-plate](#armor-plate) | Plating expression reduces predator damage | 2 / 1 | 0 | early specialization |
| [barb](#barb) | Limb retaliation and strike expression | 1 / 1 | 0 | early specialization |
| [claw](#claw) | Attacks land sooner | 1 / 1 | 0 | early specialization |
| [venom-gland](#venom-gland) | Bites poison: the target slows, weakens and breaks off · 3 doses a day | 3 / 2 | 2 | generational specialization |
| [storage-sac](#storage-sac) | Hydration retention through water-body expression | 2 / 1 | 0 | early specialization |
| [silt-fin](#silt-fin) | Swims faster and spends less energy swimming | 3 / 2 | 1 | early specialization |
| [signal-crest](#signal-crest) | Signal/flare display; alarm-pulse expression | 1 / 1 | 0 | early specialization |
| [paddle-tail](#paddle-tail) | Swims faster and cheaper, if the body can already swim | 2 / 1 | 0 | early specialization |
| [horn-crest](#horn-crest) | Relic part: attackers may recoil, and your bite is harder | 3 / 2 | 0 | discovery-gated specialist |
| [tusk-jaw](#tusk-jaw) | Relic part: much harder bites and better hunts | 3 / 2 | 0 | discovery-gated specialist |
| [gliding-membrane](#gliding-membrane) | Relic part: much faster sprint, a little faster on land | 3 / 2 | 0 | discovery-gated specialist |
| [luminous-tail](#luminous-tail) | Relic part: courts at lower energy, and its glow lures prey closer | 3 / 2 | 0 | discovery-gated specialist |
| [shell-back](#shell-back) | Relic part: hits from behind do about half damage | 3 / 2 | 0 | discovery-gated specialist |
| [armored-hide](#armored-hide) | Relic part: takes less damage, and attackers may recoil | 3 / 2 | 0 | discovery-gated specialist |
| [glow-eye](#glow-eye) | Relic part: finds food and water much farther away, and spots threats sooner | 3 / 2 | 0 | discovery-gated specialist |
| [echo-crest](#echo-crest) | Relic part: spots threats much farther away | 3 / 2 | 0 | discovery-gated specialist |
| [balance-tail](#balance-tail) | Faster sprint | 1 / 1 | 0 | early specialization |
| [club-tail](#club-tail) | A struck attacker may recoil and break off | 2 / 1 | 1 | early specialization |
| [spined-tail](#spined-tail) | Hits from behind do less damage | 3 / 2 | 2 | generational specialization |
| [whip-tail](#whip-tail) | Harder bites in a fight | 2 / 1 | 1 | early specialization |
| [prehensile-tail](#prehensile-tail) | Carries more | 2 / 1 | 1 | early specialization |
| [fat-tail](#fat-tail) | Lasts longer without food | 2 / 1 | 0 | early specialization |
| [flag-tail](#flag-tail) | Courts and mates at lower energy | 1 / 1 | 1 | early specialization |
| [sail-fin](#sail-fin) | Uses less water | 2 / 1 | 0 | early specialization |
| [spine-ridge](#spine-ridge) | Stronger brace | 2 / 1 | 0 | early specialization |
| [water-hump](#water-hump) | Uses much less water | 3 / 2 | 1 | early specialization |
| [display-frill](#display-frill) | Courts and mates at lower energy | 2 / 1 | 1 | early specialization |
| [moss-back](#moss-back) | Hides in thinner cover | 2 / 1 | 0 | early specialization |
| [thorn-carapace](#thorn-carapace) | Heavy dorsal armor reduces bites and can make predators back off; exposed spikes punish contact | 4 / 3 | 1 | early specialization |
| [sensory-quills](#sensory-quills) | Spots threats farther away | 2 / 1 | 1 | early specialization |
| [fat-pad](#fat-pad) | Lasts longer without food | 2 / 1 | 0 | early specialization |
| [gill-slits](#gill-slits) | Swims faster and cheaper, if the body can swim | 3 / 2 | 1 | early specialization |
| [scent-gland](#scent-gland) | Courts and mates at lower energy | 2 / 1 | 0 | early specialization |
| [spine-cluster](#spine-cluster) | A struck attacker may recoil and break off | 3 / 2 | 1 | early specialization |
| [brood-pouch](#brood-pouch) | Carries more | 2 / 1 | 1 | early specialization |
| [egg-chamber](#egg-chamber) | Egg-laying reproductive route | 5 / 4 | 0 | early specialization |
| [live-womb](#live-womb) | Live-bearing route and dual-route option when egg chamber is also mounted | 7 / 6 | 0 | early specialization |
| [hook-spur](#hook-spur) | Hunts land a little more often (per leg) | 1 / 1 | 1 | early specialization |
| [dew-claw](#dew-claw) | Slightly stronger brace (per leg) | 1 / 1 | 0 | early specialization |
| [heel-spike](#heel-spike) | Hits from behind do a little less damage (per leg) | 1 / 1 | 1 | early specialization |
| [sensory-bristle](#sensory-bristle) | Spots threats a little farther (per leg) | 1 / 1 | 0 | early specialization |
| [grip-pad](#grip-pad) | Slightly faster on land (per leg) | 1 / 1 | 0 | early specialization |
| [kick-spur](#kick-spur) | Slightly harder bites (per leg) | 1 / 1 | 1 | early specialization |

## Current parts and authored direction

### head-base

**Role / advantage:** Neutral face attachment; no ability granted. **Tradeoff:** Socket opportunity; no separate MP, mass or upkeep charge

**Costs:** 0 base MP / 0 if seen; declared mass 0, upkeep 0. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits head under existing socket capacities and viability rules.
**Classification / proposed tier:** beginner-friendly; foundation.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: unchanged from founder reference. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Rounded cranial mass, cheek transition and a clear neck collar. Current native asset: 32x32, 16 frames, rig head, states idle.
**Visible behavior:** breathing; show actual structural attachment/breathing only when the canonical controller permits it.
**Sources:** [src/lineage/head-plan.js](../../src/lineage/head-plan.js#L4), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L79), [src/render/head.js](../../src/render/head.js#L13), [src/render/part-sprites.js](../../src/render/part-sprites.js#L16), [src/ui/creature-identity.js](../../src/ui/creature-identity.js#L11).

### small-torso

**Role / advantage:** The starting body: four leg slots, cheap to run. **Tradeoff:** Few parts fit.

**Costs:** 0 base MP / 0 if seen; declared mass 3, upkeep 0.85. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** beginner-friendly; foundation.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: unchanged from founder reference. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Compact rounded trunk with low diagonal hips. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual structural attachment/breathing only when the canonical controller permits it.
**Sources:** [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L15), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L91), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L51), [src/render/part-sprites.js](../../src/render/part-sprites.js#L36).

### soft-torso

**Role / advantage:** Eight leg slots and two flank slots each side. **Tradeoff:** More food than the small body.

**Costs:** 2 base MP / 1 if seen; declared mass 4, upkeep 1. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites small-torso; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.018}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Pliable broad trunk, soft flank contour and distinct belly. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual structural attachment/breathing only when the canonical controller permits it.
**Sources:** [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L79), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L92), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L52), [src/render/creature-assembler.js](../../src/render/creature-assembler.js#L25), [src/render/genvo-draw.js](../../src/render/genvo-draw.js#L188), [src/render/part-sprites.js](../../src/render/part-sprites.js#L17).

### reinforced-torso

**Role / advantage:** Takes less damage. **Tradeoff:** Slower sprint and more food.

**Costs:** 4 base MP / 3 if seen; declared mass 5, upkeep 1.3. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites soft-torso; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist; generational specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.93}}. Feeding: unchanged from founder reference. Combat: {"damageTaken":{"baseline":1,"mounted":0.85}}. Social: {"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0.16,"ornament":-0.12,"display":-0.12,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.1383200000000002}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Thick structural mantle with plates integrated into the shoulder. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual structural attachment/breathing only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L38), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L35), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L53), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L18), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L17).

### sleek-torso

**Role / advantage:** Faster sprint. **Tradeoff:** Gets hungry sooner. One flank slot each side.

**Costs:** 3 base MP / 2 if seen; declared mass 3.5, upkeep 1.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites soft-torso; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist; generational specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":1.08}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0752000000000002}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Tapered long trunk, narrow waist and forward movement line. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual run only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L53), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L54), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L16), [src/render/part-sprites.js](../../src/render/part-sprites.js#L36).

### light-torso

**Role / advantage:** Six leg slots, needs less food, sprints a little faster. **Tradeoff:** Takes more damage. One flank slot.

**Costs:** 2 base MP / 1 if seen; declared mass 2.6, upkeep 0.8. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites small-torso; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":1.04}}. Feeding: unchanged from founder reference. Combat: {"damageTaken":{"baseline":1,"mounted":1.15}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":0.9}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Fine frame with open negative space beneath the body. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual structural attachment/breathing only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L54), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L55), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L18), [src/render/part-sprites.js](../../src/render/part-sprites.js#L36).

### stout-torso

**Role / advantage:** Lasts longer without food · three flank slots each side. **Tradeoff:** Slower on land.

**Costs:** 3 base MP / 2 if seen; declared mass 5, upkeep 1.1. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites soft-torso; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist; generational specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":0.95}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: {"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0.22,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":0.927}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Low broad trunk with visibly weight-bearing hips. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual store only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L55), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L56), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L24), [src/render/part-sprites.js](../../src/render/part-sprites.js#L36), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L23).

### barrel-torso

**Role / advantage:** Holds water, drinks less often · ten leg slots, four eyes, two back slots. **Tradeoff:** Slower sprint, heavy.

**Costs:** 5 base MP / 4 if seen; declared mass 6, upkeep 1.25. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites stout-torso; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist; generational specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.94}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: {"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0.22,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.048},"waterUse":{"baseline":1,"mounted":0.8}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Deep ribcage and rounded flanks; avoid a rectangular tank silhouette. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual store only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L56), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L57), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L36), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L23).

### dome-torso

**Role / advantage:** Shell halves hits from behind, less damage overall · two back slots. **Tradeoff:** Slow sprint, more food.

**Costs:** 6 base MP / 5 if seen; declared mass 6, upkeep 1.3. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites reinforced-torso; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, defensive; generational specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.9}}. Feeding: unchanged from founder reference. Combat: {"damageTaken":{"baseline":1,"mounted":0.9},"rearDamage":{"baseline":1,"mounted":0.6}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.11724}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Continuous domed shell with readable exposed underside. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual armor only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L38), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L57), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L58), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L26), [src/render/part-sprites.js](../../src/render/part-sprites.js#L36).

### long-torso

**Role / advantage:** Twelve leg slots, four eyes, three flank and two back slots · carries more. **Tradeoff:** More food.

**Costs:** 6 base MP / 5 if seen; declared mass 6, upkeep 1.35. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites sleek-torso; conditional ordinary mutation candidates; no independent part rarity rate. Fits body root under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.1236000000000002}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** derive from actual feeding/access/physiology; no named-species gate.
**Art direction:** Long trunk segmented by hip groups rather than a stretched oval. Current native asset: 32x32, 16 frames, rig torso, states idle.
**Visible behavior:** breathing; show actual structural attachment/breathing only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L58), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L59), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L36).

### walking-leg

**Role / advantage:** Baseline supported land gait and dance support. **Tradeoff:** Baseline limb upkeep and occupied mount

**Costs:** 1 base MP / 1 if seen; declared mass 0.4, upkeep 0.1. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits limb under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, ground, social/display; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: unchanged from founder reference. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** ground.
**Art direction:** Moderately bent upper/lower segments, ankle and planted toe contact. Current native asset: 32x32, 16 frames, rig two-bone, states idle.
**Visible behavior:** gait; show actual walk, sprint, dance only when the canonical controller permits it.
**Sources:** [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L16), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L83), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L98), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L18), [src/render/creature-assembler.js](../../src/render/creature-assembler.js#L21), [src/render/genvo-draw.js](../../src/render/genvo-draw.js#L126), [src/render/part-sprites.js](../../src/render/part-sprites.js#L19).

### spring-leg

**Role / advantage:** Sprint/escape specialization through the existing spring anatomy axis. **Tradeoff:** Higher sprint effort; no implemented jump-height access

**Costs:** 2 base MP / 1 if seen; declared mass 0.5, upkeep 0.18. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites walking-leg; conditional ordinary mutation candidates; no independent part rarity rate. Fits limb under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, ambush, escape, social/display; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":1.14},"sprintEnergy":{"baseline":1,"mounted":1.18}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0096}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** ambush, escape.
**Art direction:** Folded elastic rear joint, compressed stance and clear recoil. Current native asset: 32x32, 16 frames, rig two-bone, states idle.
**Visible behavior:** gait; show actual walk, sprint, pounce, dance only when the canonical controller permits it.
**Sources:** [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L70), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L83), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L221), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L99), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L18), [src/render/activity-detail.js](../../src/render/activity-detail.js#L7), [src/render/behavior.js](../../src/render/behavior.js#L68), [src/render/creature-assembler.js](../../src/render/creature-assembler.js#L21).

### grasper

**Role / advantage:** Food transport and anatomical gesture support. **Tradeoff:** Loaded travel and occupied locomotor mounts; climbing is not implemented

**Costs:** 2 base MP / 1 if seen; declared mass 0.45, upkeep 0.14. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites walking-leg; conditional ordinary mutation candidates; no independent part rarity rate. Fits limb under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, provisioning, social/display; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0048000000000001}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** provisioning.
**Art direction:** Opposing hooked fingers separated from the locomotor joint. Current native asset: 32x32, 16 frames, rig two-bone, states idle.
**Visible behavior:** gait; show actual walk, carry, dance, gesture only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L25), [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L71), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L83), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L222), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L100), [src/render/creature-assembler.js](../../src/render/creature-assembler.js#L21), [src/render/part-sprites.js](../../src/render/part-sprites.js#L21).

### runner-leg

**Role / advantage:** Faster on land. **Tradeoff:** Weaker brace.

**Costs:** 2 base MP / 1 if seen; declared mass 0.35, upkeep 0.12. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites walking-leg; conditional ordinary mutation candidates; no independent part rarity rate. Fits limb under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, open-ground, social/display; early specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":1.025}}. Feeding: unchanged from founder reference. Combat: {"brace":{"baseline":1,"mounted":1.04}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0024}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** open-ground.
**Art direction:** Slender elongated lever, narrow foot and extended forward reach. Current native asset: 32x32, 16 frames, rig two-bone, states idle.
**Visible behavior:** gait; show actual walk, sprint, run, dance only when the canonical controller permits it.
**Sources:** [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L28), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L65), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L101), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L16), [src/render/creature-assembler.js](../../src/render/creature-assembler.js#L21), [src/render/part-sprites.js](../../src/render/part-sprites.js#L37).

### sturdy-leg

**Role / advantage:** Stronger brace against charges. **Tradeoff:** A little slower.

**Costs:** 2 base MP / 1 if seen; declared mass 0.6, upkeep 0.14. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites walking-leg; conditional ordinary mutation candidates; no independent part rarity rate. Fits limb under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive, social/display; early specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":0.985}}. Feeding: unchanged from founder reference. Combat: {"brace":{"baseline":1,"mounted":0.94}}. Social: {"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0.16,"ornament":-0.12,"display":-0.12,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.0048000000000001}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Short thick load-bearing segments and broad planted foot. Current native asset: 32x32, 16 frames, rig two-bone, states idle.
**Visible behavior:** gait; show actual walk, brace, dance only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L65), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L102), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L26), [src/render/creature-assembler.js](../../src/render/creature-assembler.js#L21), [src/render/part-sprites.js](../../src/render/part-sprites.js#L37), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L17).

### webbed-leg

**Role / advantage:** Swims across rivers and open water (brings Water Sacs with it). **Tradeoff:** A little slower on land; swimming is slow and tiring.

**Costs:** 2 base MP / 1 if seen; declared mass 0.45, upkeep 0.14. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites walking-leg; conditional ordinary mutation candidates; no independent part rarity rate. Fits limb under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, wet-margin, social/display; early specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":0.995},"sprint":{"baseline":1,"mounted":0.97},"swimming":{"baseline":false,"mounted":true},"aquaticScore":{"baseline":0,"mounted":0.1}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0048000000000001},"waterUse":{"baseline":1,"mounted":0.72}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** wet-margin.
**Art direction:** Splayed digits with a visible membrane between toes. Current native asset: 32x32, 16 frames, rig two-bone, states idle.
**Visible behavior:** gait; show actual walk, swim, dance only when the canonical controller permits it.
**Sources:** [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L26), [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L72), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L85), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L65), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L103), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L22), [src/render/behavior.js](../../src/render/behavior.js#L70), [src/render/creature-assembler.js](../../src/render/creature-assembler.js#L21).

### padded-leg

**Role / advantage:** Quiet steps: sprinting is not heard and Stalkers see you later (two or more). **Tradeoff:** Slightly slower sprint.

**Costs:** 2 base MP / 1 if seen; declared mass 0.4, upkeep 0.12. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites walking-leg; conditional ordinary mutation candidates; no independent part rarity rate. Fits limb under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, stealth, social/display; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0024}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** stealth.
**Art direction:** Soft rounded pad and quiet low contact posture. Current native asset: 32x32, 16 frames, rig two-bone, states idle.
**Visible behavior:** gait; show actual walk, quiet, dance only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L101), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L104), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L24), [src/render/creature-assembler.js](../../src/render/creature-assembler.js#L21), [src/render/part-sprites.js](../../src/render/part-sprites.js#L37).

### digging-forelimb

**Role / advantage:** Digs roots with E on open ground · hides in thinner cover. **Tradeoff:** Sprint is a little slower.

**Costs:** 2 base MP / 1 if seen; declared mass 0.5, upkeep 0.15. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites walking-leg; conditional ordinary mutation candidates; no independent part rarity rate. Fits limb under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, burrow, roots, social/display; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.95}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.006}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** burrow, roots.
**Art direction:** Broad scoop end, digging edge and powerful proximal segment. Current native asset: 32x32, 16 frames, rig two-bone, states idle.
**Visible behavior:** gait; show actual walk, dig, dance only when the canonical controller permits it.
**Sources:** [src/ecology/breeding-sites.js](../../src/ecology/breeding-sites.js#L12), [src/ecology/engineer-breeding-habitat.js](../../src/ecology/engineer-breeding-habitat.js#L13), [src/ecology/engineer-life-history.js](../../src/ecology/engineer-life-history.js#L20), [src/ecology/engineer-water-access.js](../../src/ecology/engineer-water-access.js#L11), [src/ecology/regions.js](../../src/ecology/regions.js#L17), [src/ecology/wildlife-rhythm.js](../../src/ecology/wildlife-rhythm.js#L22), [src/lineage/engineer-recovery-foraging.js](../../src/lineage/engineer-recovery-foraging.js#L11), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L31).

### grazing-mouth

**Role / advantage:** Plant-guild generalist with grazing and vocal-call support. **Tradeoff:** Cannot hunt live prey; coat handling and habitat remain real constraints

**Costs:** 1 base MP / 1 if seen; declared mass 0.3, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, plants; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: unchanged from founder reference. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** plants.
**Art direction:** Broad soft grazing lip with a clear biting edge. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual graze, bite, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L74), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L12), [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L21), [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L17), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L89), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L106), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L18), [src/render/genvo-draw.js](../../src/render/genvo-draw.js#L202).

### tearing-jaw

**Role / advantage:** Live-prey/carrion specialization and heavier jaw expression. **Tradeoff:** Finite prey, risk of injury, jaw effort and hydration costs

**Costs:** 2 base MP / 1 if seen; declared mass 0.5, upkeep 0.2. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites grazing-mouth; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, carcass, prey; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"carrion":0.9}},"freshwater":{"baseline":{"algae":1,"duckweed":1,"waterweed":1},"mounted":{"fry":1,"detritus":0.8}},"hunter":{"baseline":false,"mounted":true}}. Combat: {"strike":{"baseline":1,"mounted":1.62}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.018},"waterUse":{"baseline":1,"mounted":1.08}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** carcass, prey.
**Art direction:** Hooked biting plates, exposed hinge and distinct open/closed outline. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual graze, bite, tear, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L76), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L19), [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L39), [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L69), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L89), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L222), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L107), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L16).

### crushing-jaw

**Role / advantage:** Prey and destructive seed processing; stronger jaw expression. **Tradeoff:** Seed destruction competes with dispersal; effort and hydration costs

**Costs:** 3 base MP / 2 if seen; declared mass 0.7, upkeep 0.3. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites tearing-jaw; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, hard-food, prey; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"bramble":0.3,"thistlepod":0.3,"carrion":0.9}},"freshwater":{"baseline":{"algae":1,"duckweed":1,"waterweed":1},"mounted":{"fry":1,"detritus":0.8}},"hunter":{"baseline":false,"mounted":true}}. Combat: {"strike":{"baseline":1,"mounted":2.754}}. Social: {"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0.16,"ornament":-0.12,"display":-0.12,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.03},"waterUse":{"baseline":1,"mounted":1.1556000000000002}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** hard-food, prey.
**Art direction:** Short thick opposing plates and blunt crushing edge. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual graze, bite, tear, crush, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L76), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L20), [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L39), [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L68), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L89), [src/lineage/evolution.js](../../src/lineage/evolution.js#L24), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L222), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L108).

### beak-mouth

**Role / advantage:** Much better on seed pods. **Tradeoff:** Slightly worse on other plants.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.06. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites grazing-mouth; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, seeds; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"sunmoss":0.35,"bramble":0.75,"marshroot":0.25,"rotcap":0.12,"thistlepod":1.2}},"mouthModifiers":{"baseline":{},"mounted":{"food":{"thistlepod":1.35},"plants":0.95}}}. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0012}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** seeds.
**Art direction:** Narrow pointed bill with a strong upper/lower seam. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual graze, bite, peck, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L74), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L14), [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L21), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L68), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L109), [src/render/part-sprites.js](../../src/render/part-sprites.js#L40).

### kernel-beak

**Role / advantage:** Cracks hard seed pods for food; crushed seeds cannot grow. **Tradeoff:** Poor at soft plants; extra energy upkeep.

**Costs:** 3 base MP / 2 if seen; declared mass 0.46, upkeep 0.12. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites beak-mouth; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, dry-ground, seeds; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"sunmoss":0.32,"bramble":1.38,"marshroot":0.12,"rotcap":0.02,"thistlepod":1.38}},"freshwater":{"baseline":{"algae":1,"duckweed":1,"waterweed":1},"mounted":{}},"mouthModifiers":{"baseline":{},"mounted":{"food":{"thistlepod":1.6},"plants":0.78,"metabolism":1.05}}}. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.05882}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** dry-ground, seeds.
**Art direction:** Deep blunt seed-cracking bill, visible hinge and kernel-grip pocket. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** feeding; show actual graze, peck, crush, bite, call only when the canonical controller permits it.
**Sources:** [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L15), [src/ecology/wildlife-rhythm.js](../../src/ecology/wildlife-rhythm.js#L25), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L69), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L110), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L26), [src/render/part-sprites.js](../../src/render/part-sprites.js#L38).

### filter-mouth

**Role / advantage:** Feeds while drinking at the water's edge. **Tradeoff:** Gets a little less from plants.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.06. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites grazing-mouth; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, wet-margin; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"sunmoss":0.16,"marshroot":0.62,"rotcap":0.08,"carrion":0.1}},"freshwater":{"baseline":{"algae":1,"duckweed":1,"waterweed":1},"mounted":{"algae":1,"larvae":0.8,"detritus":0.35}},"mouthModifiers":{"baseline":{},"mounted":{"drinkEnergy":6,"drinkEnergyTick":0.6,"plants":0.94}}}. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0012}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** wet-margin.
**Art direction:** Broad intake lip and readable fine sieve edge. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual graze, filter, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L73), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L17), [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L184), [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L21), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L73), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L111), [src/render/part-sprites.js](../../src/render/part-sprites.js#L40).

### reed-sieve-mouth

**Role / advantage:** Sifts algae, aquatic larvae and detritus from water. **Tradeoff:** Poorer land grazing; higher food upkeep.

**Costs:** 3 base MP / 2 if seen; declared mass 0.35, upkeep 0.09. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites filter-mouth; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, wet-margin, detritus, larvae; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"sunmoss":0.1,"marshroot":0.82,"rotcap":0.08,"carrion":0.12}},"freshwater":{"baseline":{"algae":1,"duckweed":1,"waterweed":1},"mounted":{"algae":0.8,"larvae":1.25,"detritus":0.75}},"mouthModifiers":{"baseline":{},"mounted":{"plants":0.82,"metabolism":1.035}}}. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.039968}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** wet-margin, detritus, larvae.
**Art direction:** Long shallow sieve mouth with a distinct comb edge. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** feeding; show actual filter, graze, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L72), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L18), [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L21), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L74), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L112), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L22), [src/render/part-sprites.js](../../src/render/part-sprites.js#L39).

### nibbler-mouth

**Role / advantage:** Very cheap to run. **Tradeoff:** Gets less from plants.

**Costs:** 2 base MP / 1 if seen; declared mass 0.2, upkeep 0.03. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites grazing-mouth; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, plants; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"sunmoss":0.72,"bramble":0.95,"marshroot":1,"rotcap":0.7,"thistlepod":0.65}},"mouthModifiers":{"baseline":{},"mounted":{"plants":0.9,"metabolism":0.95}}}. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":0.95}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** plants.
**Art direction:** Small flexible paired lips and rapid precise bite opening. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual graze, nibble, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L74), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L13), [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L21), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L70), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L113), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L29), [src/render/part-sprites.js](../../src/render/part-sprites.js#L40).

### sucker-mouth

**Role / advantage:** Much better on carrion. **Tradeoff:** Gets a little less from plants.

**Costs:** 2 base MP / 1 if seen; declared mass 0.35, upkeep 0.1. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites tearing-jaw; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, carcass; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"sunmoss":0.16,"bramble":0.22,"marshroot":0.42,"rotcap":1.18,"thistlepod":0.18,"carrion":1}},"freshwater":{"baseline":{"algae":1,"duckweed":1,"waterweed":1},"mounted":{"larvae":0.8,"detritus":1}},"mouthModifiers":{"baseline":{},"mounted":{"food":{"carrion":1.4},"plants":0.94}}}. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.006}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** carcass.
**Art direction:** Round muscular suction disc with a visible central opening. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual bite, suck, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L75), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L16), [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L39), [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L21), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L71), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L114), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L24), [src/render/behavior.js](../../src/render/behavior.js#L71).

### gape-mouth

**Role / advantage:** Hunts land more often, more food from prey. **Tradeoff:** More food upkeep.

**Costs:** 3 base MP / 2 if seen; declared mass 0.55, upkeep 0.2. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites tearing-jaw; conditional ordinary mutation candidates; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"carrion":0.65}},"freshwater":{"baseline":{"algae":1,"duckweed":1,"waterweed":1},"mounted":{"fry":1,"detritus":0.8}},"hunter":{"baseline":false,"mounted":true},"mouthModifiers":{"baseline":{},"mounted":{"prey":1.15,"huntBonus":0.08,"metabolism":1.03}}}. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.04854}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** prey.
**Art direction:** Deep expandable throat and wide hinge arc. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual bite, swallow, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L76), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L19), [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L39), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L72), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L115), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L28), [src/render/part-sprites.js](../../src/render/part-sprites.js#L40).

### simple-eye

**Role / advantage:** Baseline visual observation. **Tradeoff:** Ordinary sensory range rather than specialized tracking or wide-field detection

**Costs:** 1 base MP / 1 if seen; declared mass 0.05, upkeep 0.03. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, open-ground; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: unchanged from founder reference. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** open-ground.
**Art direction:** Bold dark pupil, readable light sclera and small highlight. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see only when the canonical controller permits it.
**Sources:** [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L18), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L90), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L116), [src/render/genvo-draw.js](../../src/render/genvo-draw.js#L257), [src/render/part-sprites.js](../../src/render/part-sprites.js#L26).

### wide-field-eye

**Role / advantage:** Spots threats farther away and from behind. **Tradeoff:** Needs a little more food and water.

**Costs:** 2 base MP / 1 if seen; declared mass 0.08, upkeep 0.07. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites simple-eye; conditional ordinary mutation candidates; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey-vigilance; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.034944},"waterUse":{"baseline":1,"mounted":1.04}}. Senses: {"threat":{"baseline":1,"mounted":1.4},"wideField":{"baseline":false,"mounted":true}}. Reproductive route: live.
**Ecological niche:** prey-vigilance.
**Art direction:** Outward-facing raised eyes with clear rearward exposure. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see, see-wide only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L34), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L117), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L18), [src/render/part-sprites.js](../../src/render/part-sprites.js#L27).

### hunter-eye

**Role / advantage:** Hunts and pounces land more often. **Tradeoff:** Narrower view: threats noticed a little later.

**Costs:** 2 base MP / 1 if seen; declared mass 0.06, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites simple-eye; conditional ordinary mutation candidates; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0024}}. Senses: {"threat":{"baseline":1,"mounted":0.92}}. Reproductive route: live.
**Ecological niche:** prey.
**Art direction:** Forward-facing focused eye and restrained upper lid. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see, aim only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L78), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L118), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L16), [src/render/activity-detail.js](../../src/render/activity-detail.js#L13), [src/render/behavior.js](../../src/render/behavior.js#L72), [src/render/part-sprites.js](../../src/render/part-sprites.js#L48).

### stalk-eye

**Role / advantage:** Finds food farther away, through plant cover. **Tradeoff:** More food upkeep.

**Costs:** 2 base MP / 1 if seen; declared mass 0.07, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites simple-eye; conditional ordinary mutation candidates; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, cover; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.042496}}. Senses: {"forage":{"baseline":1,"mounted":1.2}}. Reproductive route: live.
**Ecological niche:** cover.
**Art direction:** Low protected eye on a short searching projection. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see, spot only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L79), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L119), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-animation-catalog.js](../../src/render/part-animation-catalog.js#L13), [src/render/part-sprites.js](../../src/render/part-sprites.js#L48).

### compound-eye

**Role / advantage:** Spots threats farther and from behind. **Tradeoff:** More food upkeep.

**Costs:** 3 base MP / 2 if seen; declared mass 0.09, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites wide-field-eye; conditional ordinary mutation candidates; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey-vigilance; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.03618}}. Senses: {"threat":{"baseline":1,"mounted":1.15},"wideField":{"baseline":false,"mounted":true}}. Reproductive route: live.
**Ecological niche:** prey-vigilance.
**Art direction:** Raised faceted lens mass; retain a readable gaze cue. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see, glance only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L80), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L120), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L48).

### tracker-eye

**Role / advantage:** Food and water shown and found farther away. **Tradeoff:** More food upkeep.

**Costs:** 2 base MP / 1 if seen; declared mass 0.06, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites simple-eye; conditional ordinary mutation candidates; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, foraging; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.032472}}. Senses: {"forage":{"baseline":1,"mounted":1.15},"cue":{"baseline":1,"mounted":1.5}}. Reproductive route: live.
**Ecological niche:** foraging.
**Art direction:** Directed pupil and a distinct searching stalk. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see, track only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L81), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L121), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L24), [src/render/part-sprites.js](../../src/render/part-sprites.js#L48).

### display-eye

**Role / advantage:** Courts and mates at lower energy. **Tradeoff:** More food upkeep; threats noticed a little later.

**Costs:** 2 base MP / 1 if seen; declared mass 0.06, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites simple-eye; conditional ordinary mutation candidates; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, courtship, social/display; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: {"courtshipReadiness":{"baseline":null,"mounted":0.5},"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0,"ornament":0.21000000000000002,"display":0.22999999999999998,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.042496}}. Senses: {"threat":{"baseline":1,"mounted":0.92}}. Reproductive route: live.
**Ecological niche:** courtship.
**Art direction:** Large expressive eye and colored display rim. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see, display, flare only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L82), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L122), [src/render/part-sprites.js](../../src/render/part-sprites.js#L48), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L15).

### eyespot

**Role / advantage:** Almost no upkeep. **Tradeoff:** Threats noticed much later.

**Costs:** 1 base MP / 1 if seen; declared mass 0.02, upkeep 0.01. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, scarcity; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":0.97}}. Senses: {"threat":{"baseline":1,"mounted":0.8}}. Reproductive route: live.
**Ecological niche:** scarcity.
**Art direction:** Simple pigmented spot integrated into the skin. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L83), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L123), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L19), [src/render/part-sprites.js](../../src/render/part-sprites.js#L48).

### armor-plate

**Role / advantage:** Plating expression reduces predator damage. **Tradeoff:** Slower sprint; occupied external mount

**Costs:** 2 base MP / 1 if seen; declared mass 0.6, upkeep 0.12. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank, dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.95}}. Feeding: unchanged from founder reference. Combat: {"predatorDamage":{"baseline":1,"mounted":0.74}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0144}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Convex plate seated into the body with an exposed soft seam. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual armor only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L38), [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L73), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L93), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L221), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L124), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/genvo-draw.js](../../src/render/genvo-draw.js#L185), [src/render/part-sprites.js](../../src/render/part-sprites.js#L28).

### barb

**Role / advantage:** Limb retaliation and strike expression. **Tradeoff:** Sprint effort and occupied spur mount

**Costs:** 1 base MP / 1 if seen; declared mass 0.1, upkeep 0.04. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits spur under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; early specialization.
**Effects in a valid adult probe:** Movement: {"sprintEnergy":{"baseline":1,"mounted":1.08}}. Feeding: unchanged from founder reference. Combat: {"strike":{"baseline":1,"mounted":2.35}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0048000000000001}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Short backwards-hooked spur integrated into a joint. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual retaliate only when the canonical controller permits it.
**Sources:** [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L75), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L81), [src/lineage/evolution.js](../../src/lineage/evolution.js#L8), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L222), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L125), [src/lineage/species-lifestyle.js](../../src/lineage/species-lifestyle.js#L129), [src/organisms/species.js](../../src/organisms/species.js#L79), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L38).

### claw

**Role / advantage:** Attacks land sooner. **Tradeoff:** Hits a little weaker and carries less.

**Costs:** 1 base MP / 1 if seen; declared mass 0.12, upkeep 0.04. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits spur under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: {"strike":{"baseline":1,"mounted":0.9},"windup":{"baseline":1,"mounted":0.6}}. Social: {"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0.16,"ornament":-0.12,"display":-0.12,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.0048000000000001}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** prey.
**Art direction:** Curved paired gripping/striking tips with a visible base. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual strike only when the canonical controller permits it.
**Sources:** [src/ecology/wildlife-rhythm.js](../../src/ecology/wildlife-rhythm.js#L17), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L22), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L126), [src/render/fauna.js](../../src/render/fauna.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L12), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L17), [src/ui/creature-editor.js](../../src/ui/creature-editor.js#L51).

### venom-gland

**Role / advantage:** Bites poison: the target slows, weakens and breaks off · 3 doses a day. **Tradeoff:** Needs a little more food.

**Costs:** 3 base MP / 2 if seen; declared mass 0.2, upkeep 0.15. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites tearing-jaw; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.05872}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** prey.
**Art direction:** Small vascular sac and a duct seated near the bite structure. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual venom only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L33), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L127), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/genvo-draw.js](../../src/render/genvo-draw.js#L185), [src/render/part-sprites.js](../../src/render/part-sprites.js#L31).

### storage-sac

**Role / advantage:** Hydration retention through water-body expression. **Tradeoff:** Sprint tradeoff and occupied flank mount

**Costs:** 2 base MP / 1 if seen; declared mass 0.5, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, dry-ground, scarcity; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.97}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.006},"waterUse":{"baseline":1,"mounted":0.72}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** dry-ground, scarcity.
**Art direction:** Soft lobed sac integrated into a flank with a clear tension fold. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual store only when the canonical controller permits it.
**Sources:** [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L74), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L93), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L222), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L128), [src/render/genvo-draw.js](../../src/render/genvo-draw.js#L185), [src/render/part-sprites.js](../../src/render/part-sprites.js#L32).

### silt-fin

**Role / advantage:** Swims faster and spends less energy swimming. **Tradeoff:** Slower on land; more food upkeep.

**Costs:** 3 base MP / 2 if seen; declared mass 0.28, upkeep 0.09. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites paddle-tail; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, aquatic, wet-margin, social/display; early specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":0.91}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0411240000000002}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** aquatic, wet-margin.
**Art direction:** Low flexible ribbed fin with a broad swimming edge. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual swim-propel, flare only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L131), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L129), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L22), [src/render/part-sprites.js](../../src/render/part-sprites.js#L39).

### signal-crest

**Role / advantage:** Signal/flare display; alarm-pulse expression. **Tradeoff:** Funded signalling, cooldown and occupied dorsal mount

**Costs:** 1 base MP / 1 if seen; declared mass 0.1, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, family, social/display; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: {"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0,"ornament":0.21000000000000002,"display":-0.12,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.006}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** family.
**Art direction:** Raised paired crest and a readable expanding display outline. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual signal, flare only when the canonical controller permits it.
**Sources:** [src/lineage/body-inheritance.js](../../src/lineage/body-inheritance.js#L76), [src/lineage/body-plan.js](../../src/lineage/body-plan.js#L94), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L130), [src/render/part-sprites.js](../../src/render/part-sprites.js#L33), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L15).

### paddle-tail

**Role / advantage:** Swims faster and cheaper, if the body can already swim. **Tradeoff:** Slightly slower on land.

**Costs:** 2 base MP / 1 if seen; declared mass 0.4, upkeep 0.1. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, wet-margin; early specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":0.96},"aquaticScore":{"baseline":0,"mounted":0.25}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.012}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** wet-margin.
**Art direction:** Broad terminal paddle, muscular narrow root and flexible bend. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual swim-propel only when the canonical controller permits it.
**Sources:** [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L30), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L36), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L129), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L22), [src/render/part-sprites.js](../../src/render/part-sprites.js#L34).

### horn-crest

**Role / advantage:** Relic part: attackers may recoil, and your bite is harder. **Tradeoff:** More food.

**Costs:** 3 base MP / 2 if seen; declared mass 0.3, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; relic/discovery gate; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive, social/display; discovery-gated specialist.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: {"strike":{"baseline":1,"mounted":1.1},"repel":{"baseline":0,"mounted":0.25}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.049984}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Single heavy horn rising from a reinforced cranial/dorsal base. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual retaliate, display, flare only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L150), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L136), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L38), [src/render/part-sprites.js](../../src/render/part-sprites.js#L46).

### tusk-jaw

**Role / advantage:** Relic part: much harder bites and better hunts. **Tradeoff:** More food; plants give less.

**Costs:** 3 base MP / 2 if seen; declared mass 0.6, upkeep 0.2. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; relic/discovery gate; no independent part rarity rate. Fits mouth under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey; discovery-gated specialist.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: {"ground":{"baseline":{"sunmoss":1,"bramble":0.75,"marshroot":0.4,"rotcap":0.08,"thistlepod":0.6},"mounted":{"bramble":0.25,"thistlepod":0.25,"carrion":0.7}},"freshwater":{"baseline":{"algae":1,"duckweed":1,"waterweed":1},"mounted":{"fry":1,"detritus":0.8}},"hunter":{"baseline":false,"mounted":true},"mouthModifiers":{"baseline":{},"mounted":{"plants":0.9,"prey":1.15}}}. Combat: {"strike":{"baseline":1,"mounted":1.35}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0689}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** prey.
**Art direction:** Paired curved tusks framing the actual mouth opening. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual bite, tear, crush, call only when the canonical controller permits it.
**Sources:** [src/ecology/freshwater-food.js](../../src/ecology/freshwater-food.js#L76), [src/ecology/functional-diet.js](../../src/ecology/functional-diet.js#L20), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L75), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L137), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L46).

### gliding-membrane

**Role / advantage:** Relic part: much faster sprint, a little faster on land. **Tradeoff:** More food.

**Costs:** 3 base MP / 2 if seen; declared mass 0.25, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; relic/discovery gate; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, escape; discovery-gated specialist.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":1.03},"sprint":{"baseline":1,"mounted":1.1}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.049984}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** escape.
**Art direction:** Folded lateral skin membrane with visible supports; no flight pose claim. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual sprint only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L152), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L139), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L47).

### luminous-tail

**Role / advantage:** Relic part: courts at lower energy, and its glow lures prey closer. **Tradeoff:** Stalkers spot you farther away.

**Costs:** 3 base MP / 2 if seen; declared mass 0.3, upkeep 0.06. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; relic/discovery gate; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, courtship, prey, social/display; discovery-gated specialist.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: {"courtshipReadiness":{"baseline":null,"mounted":0.45},"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0,"ornament":0.21000000000000002,"display":0.22999999999999998,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.0072},"visibility":{"baseline":1,"mounted":1.15}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** courtship, prey.
**Art direction:** Segmented tail ending in a controlled glowing organ. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual display, signal, flare only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L153), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L140), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L47), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L15).

### shell-back

**Role / advantage:** Relic part: hits from behind do about half damage. **Tradeoff:** Slower sprint, a little more food.

**Costs:** 3 base MP / 2 if seen; declared mass 0.7, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; relic/discovery gate; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; discovery-gated specialist.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.94}}. Feeding: unchanged from founder reference. Combat: {"rearDamage":{"baseline":1,"mounted":0.55}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0398880000000001}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Overlapping shell contour seated into the back. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual armor only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L38), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L154), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L141), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L47).

### armored-hide

**Role / advantage:** Relic part: takes less damage, and attackers may recoil. **Tradeoff:** Slightly slower sprint, more food.

**Costs:** 3 base MP / 2 if seen; declared mass 0.6, upkeep 0.1. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; relic/discovery gate; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; discovery-gated specialist.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.97}}. Feeding: unchanged from founder reference. Combat: {"damageTaken":{"baseline":1,"mounted":0.8},"repel":{"baseline":0,"mounted":0.12}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.05248}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Thick patterned skin rather than detached sticker plates. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual armor, retaliate only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L38), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L155), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L142), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L47).

### glow-eye

**Role / advantage:** Relic part: finds food and water much farther away, and spots threats sooner. **Tradeoff:** More food.

**Costs:** 3 base MP / 2 if seen; declared mass 0.06, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; relic/discovery gate; no independent part rarity rate. Fits eye under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, foraging, cover; discovery-gated specialist.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.032472}}. Senses: {"threat":{"baseline":1,"mounted":1.1},"forage":{"baseline":1,"mounted":1.3},"cue":{"baseline":1,"mounted":1.4}}. Reproductive route: live.
**Ecological niche:** foraging, cover.
**Art direction:** Bright emissive core with controlled halo and a readable pupil. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see, track only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L85), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L143), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L47).

### echo-crest

**Role / advantage:** Relic part: spots threats much farther away. **Tradeoff:** A little more food.

**Costs:** 3 base MP / 2 if seen; declared mass 0.2, upkeep 0.06. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; relic/discovery gate; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey-vigilance; discovery-gated specialist.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0374160000000001}}. Senses: {"threat":{"baseline":1,"mounted":1.3}}. Reproductive route: live.
**Ecological niche:** prey-vigilance.
**Art direction:** Paired resonant hollow crest with visibly open chamber shape. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual see-wide, spot, call only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L156), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L144), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L47).

### balance-tail

**Role / advantage:** Faster sprint. **Tradeoff:** A little more food.

**Costs:** 1 base MP / 1 if seen; declared mass 0.35, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, open-ground; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":1.05}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.02612}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** open-ground.
**Art direction:** Long tapering tail with a flexible counterbalancing base. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual run only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L123), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L145), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L18), [src/render/part-sprites.js](../../src/render/part-sprites.js#L42).

### club-tail

**Role / advantage:** A struck attacker may recoil and break off. **Tradeoff:** Slower sprint.

**Costs:** 2 base MP / 1 if seen; declared mass 0.35, upkeep 0.1. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites balance-tail; conditional ordinary mutation candidates; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.96}}. Feeding: unchanged from founder reference. Combat: {"repel":{"baseline":0,"mounted":0.25}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.012}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Heavy rounded terminal mass and thick proximal support. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual retaliate only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L124), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L146), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L26), [src/render/part-sprites.js](../../src/render/part-sprites.js#L42).

### spined-tail

**Role / advantage:** Hits from behind do less damage. **Tradeoff:** A little more food.

**Costs:** 3 base MP / 2 if seen; declared mass 0.35, upkeep 0.12. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites club-tail; conditional ordinary mutation candidates; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; generational specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: {"rearDamage":{"baseline":1,"mounted":0.82}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.034688}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Tapered tail with coherent rearward spine direction. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual armor only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L38), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L125), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L147), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L38), [src/render/part-sprites.js](../../src/render/part-sprites.js#L42).

### whip-tail

**Role / advantage:** Harder bites in a fight. **Tradeoff:** More food.

**Costs:** 2 base MP / 1 if seen; declared mass 0.35, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites balance-tail; conditional ordinary mutation candidates; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: {"strike":{"baseline":1,"mounted":1.1}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0398880000000001}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** prey.
**Art direction:** Fine long terminal segment and a readable flexible bend. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual strike only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L126), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L148), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L16), [src/render/part-sprites.js](../../src/render/part-sprites.js#L42).

### prehensile-tail

**Role / advantage:** Carries more. **Tradeoff:** Slightly slower sprint.

**Costs:** 2 base MP / 1 if seen; declared mass 0.35, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites balance-tail; conditional ordinary mutation candidates; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, provisioning; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.98}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0096}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** provisioning.
**Art direction:** Curling muscular tail tip with an opposing grip surface. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual carry only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L200), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L127), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L149), [src/render/part-sprites.js](../../src/render/part-sprites.js#L42).

### fat-tail

**Role / advantage:** Lasts longer without food. **Tradeoff:** Slower sprint.

**Costs:** 2 base MP / 1 if seen; declared mass 0.35, upkeep 0.04. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, scarcity; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.96}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":0.9344640000000002}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** scarcity.
**Art direction:** Thick soft energy-storage lobes tapering toward the tip. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual store only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L128), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L150), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L24), [src/render/part-sprites.js](../../src/render/part-sprites.js#L42).

### flag-tail

**Role / advantage:** Courts and mates at lower energy. **Tradeoff:** Stalkers spot you a little farther away.

**Costs:** 1 base MP / 1 if seen; declared mass 0.35, upkeep 0.04. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites balance-tail; conditional ordinary mutation candidates; no independent part rarity rate. Fits tail under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, courtship, social/display; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: {"courtshipReadiness":{"baseline":null,"mounted":0.55},"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0,"ornament":0.21000000000000002,"display":0.22999999999999998,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.0048000000000001},"visibility":{"baseline":1,"mounted":1.1}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** courtship.
**Art direction:** Broad contrasting display fan held on a readable flexible stalk. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** sweep; show actual display, flare only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L129), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L151), [src/render/part-sprites.js](../../src/render/part-sprites.js#L42), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L15).

### sail-fin

**Role / advantage:** Uses less water. **Tradeoff:** Slightly slower sprint.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.06. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, dry-ground; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.97}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0072},"waterUse":{"baseline":1,"mounted":0.92}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** dry-ground.
**Art direction:** Thin high fin with strong support ribs. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual store only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L132), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L152), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L49), [src/render/part-sprites.js](../../src/render/part-sprites.js#L43).

### spine-ridge

**Role / advantage:** Stronger brace. **Tradeoff:** A little more food.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: {"brace":{"baseline":1,"mounted":0.92}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.029792}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Short repeated dorsal spines aligned with the trunk. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual brace only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L38), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L133), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L153), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L16), [src/render/part-sprites.js](../../src/render/part-sprites.js#L43).

### water-hump

**Role / advantage:** Uses much less water. **Tradeoff:** A little slower on land.

**Costs:** 3 base MP / 2 if seen; declared mass 0.3, upkeep 0.06. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites sail-fin; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, dry-ground, scarcity; early specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":0.97}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0072},"waterUse":{"baseline":1,"mounted":0.85}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** dry-ground, scarcity.
**Art direction:** Smooth filled hump with integrated shoulder transition. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual store only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L134), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L154), [src/render/part-sprites.js](../../src/render/part-sprites.js#L43).

### display-frill

**Role / advantage:** Courts and mates at lower energy. **Tradeoff:** Threats noticed a little later.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.06. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites signal-crest; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, courtship, social/display; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: {"courtshipReadiness":{"baseline":null,"mounted":0.55},"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0,"ornament":0.21000000000000002,"display":0.22999999999999998,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.0072}}. Senses: {"threat":{"baseline":1,"mounted":0.95}}. Reproductive route: live.
**Ecological niche:** courtship.
**Art direction:** Radial folding display fan attached by a visible soft hinge. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual display, flare only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L135), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L155), [src/render/part-animation-catalog.js](../../src/render/part-animation-catalog.js#L14), [src/render/part-sprites.js](../../src/render/part-sprites.js#L43), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L15).

### moss-back

**Role / advantage:** Hides in thinner cover. **Tradeoff:** A little more food.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.06. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, cover; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.027344}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** cover.
**Art direction:** Broken low mottled mantle that remains animal tissue, not pasted foliage. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual quiet only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L136), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L156), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L24), [src/render/part-sprites.js](../../src/render/part-sprites.js#L43).

### thorn-carapace

**Role / advantage:** Heavy dorsal armor reduces bites and can make predators back off; exposed spikes punish contact. **Tradeoff:** Slower movement and higher food upkeep.

**Costs:** 4 base MP / 3 if seen; declared mass 0.84, upkeep 0.17. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites armor-plate; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, dry-ground, defensive; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.89}}. Feeding: unchanged from founder reference. Combat: {"damageTaken":{"baseline":1,"mounted":0.81},"repel":{"baseline":0,"mounted":0.22}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.09693}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure, dry-ground.
**Art direction:** Heavy convex shell with spaced integrated thorns. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** breathing; show actual armor, retaliate only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L130), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L157), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L26), [src/render/part-sprites.js](../../src/render/part-sprites.js#L38).

### sensory-quills

**Role / advantage:** Spots threats farther away. **Tradeoff:** More food.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.07. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites spine-ridge; conditional ordinary mutation candidates; no independent part rarity rate. Fits dorsal under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey-vigilance; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.038652}}. Senses: {"threat":{"baseline":1,"mounted":1.12}}. Reproductive route: live.
**Ecological niche:** prey-vigilance.
**Art direction:** Sparse directed flexible quills with distinct attachment roots. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual glance only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L137), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L158), [src/render/part-sprites.js](../../src/render/part-sprites.js#L43).

### fat-pad

**Role / advantage:** Lasts longer without food. **Tradeoff:** Slightly slower sprint.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.03. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, scarcity; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.97}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":0.943384}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** scarcity.
**Art direction:** Soft ventral/flank cushion with a compressed lower edge. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual store only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L138), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L159), [src/render/part-sprites.js](../../src/render/part-sprites.js#L44).

### gill-slits

**Role / advantage:** Swims faster and cheaper, if the body can swim. **Tradeoff:** Uses a little more water.

**Costs:** 3 base MP / 2 if seen; declared mass 0.3, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites storage-sac; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, wet-margin; early specialization.
**Effects in a valid adult probe:** Movement: {"aquaticScore":{"baseline":0,"mounted":0.35}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0096},"waterUse":{"baseline":1,"mounted":1.03}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** wet-margin.
**Art direction:** Repeated recessed moist slits with a readable protective lip. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual swim only when the canonical controller permits it.
**Sources:** [src/lineage/aquatic.js](../../src/lineage/aquatic.js#L30), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L139), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L160), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L22), [src/render/part-sprites.js](../../src/render/part-sprites.js#L44).

### scent-gland

**Role / advantage:** Courts and mates at lower energy. **Tradeoff:** Stalkers spot you a little farther away.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, courtship, social/display; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: {"courtshipReadiness":{"baseline":null,"mounted":0.55},"displayTraits":{"baseline":{"size":0,"strength":0,"ornament":-0.12,"display":-0.12,"behavior":0},"mounted":{"size":0,"strength":0,"ornament":0.21000000000000002,"display":0.22999999999999998,"behavior":0}}}. Survival: {"metabolism":{"baseline":1,"mounted":1.006},"visibility":{"baseline":1,"mounted":1.08}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** courtship.
**Art direction:** Small exposed gland opening integrated into a skin fold. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual display, scent only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L140), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L161), [src/render/part-sprites.js](../../src/render/part-sprites.js#L44), [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js#L15).

### spine-cluster

**Role / advantage:** A struck attacker may recoil and break off. **Tradeoff:** Carries less.

**Costs:** 3 base MP / 2 if seen; declared mass 0.3, upkeep 0.08. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites armor-plate; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: {"repel":{"baseline":0,"mounted":0.2}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0096}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Compact concentrated thorn group with one coherent base. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual retaliate only when the canonical controller permits it.
**Sources:** [src/gameplay/discovery.js](../../src/gameplay/discovery.js#L38), [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L141), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L162), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L38), [src/render/part-sprites.js](../../src/render/part-sprites.js#L44).

### brood-pouch

**Role / advantage:** Carries more. **Tradeoff:** Slightly slower sprint.

**Costs:** 2 base MP / 1 if seen; declared mass 0.3, upkeep 0.05. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites storage-sac; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, family; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.97}}. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.006}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** family.
**Art direction:** Soft expandable pouch opening and visible carrying fold. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual carry only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L142), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L163), [src/render/part-sprites.js](../../src/render/part-sprites.js#L44), [src/reproduction/egg-ecology.js](../../src/reproduction/egg-ecology.js#L29).

### egg-chamber

**Role / advantage:** Egg-laying reproductive route. **Tradeoff:** Funded clutch, viable site and incubation; no guaranteed fertility

**Costs:** 5 base MP / 4 if seen; declared mass 0.8, upkeep 0.22. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, reproduction, dry-ground, reproductive; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0264}}. Senses: unchanged from founder reference. Reproductive route: egg.
**Ecological niche:** reproduction, dry-ground.
**Art direction:** Protected ventral reproductive bulge with a subtle outlet. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual lay-eggs only when the canonical controller permits it.
**Sources:** [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L166), [src/render/part-sprites.js](../../src/render/part-sprites.js#L44), [src/reproduction/reproductive-anatomy.js](../../src/reproduction/reproductive-anatomy.js#L4).

### live-womb

**Role / advantage:** Live-bearing route and dual-route option when egg chamber is also mounted. **Tradeoff:** Gestation/funding; default old-save live birth makes marginal standalone benefit a review item

**Costs:** 7 base MP / 6 if seen; declared mass 1.1, upkeep 0.36. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits flank under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, reproduction, family, reproductive; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0432000000000001}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** reproduction, family.
**Art direction:** Integrated ventral organ silhouette, with pregnancy growth tied to real state. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual live-birth only when the canonical controller permits it.
**Sources:** [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L169), [src/render/part-sprites.js](../../src/render/part-sprites.js#L44), [src/reproduction/reproductive-anatomy.js](../../src/reproduction/reproductive-anatomy.js#L5).

### hook-spur

**Role / advantage:** Hunts land a little more often (per leg). **Tradeoff:** A little more food.

**Costs:** 1 base MP / 1 if seen; declared mass 0.08, upkeep 0.03. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites claw; conditional ordinary mutation candidates; no independent part rarity rate. Fits spur under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.008618}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** prey.
**Art direction:** Curved short hook pointing away from the walking surface. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual strike only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L143), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L170), [src/render/part-sprites.js](../../src/render/part-sprites.js#L45).

### dew-claw

**Role / advantage:** Slightly stronger brace (per leg). **Tradeoff:** Very slightly slower sprint.

**Costs:** 1 base MP / 1 if seen; declared mass 0.08, upkeep 0.02. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits spur under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; early specialization.
**Effects in a valid adult probe:** Movement: {"sprint":{"baseline":1,"mounted":0.997}}. Feeding: unchanged from founder reference. Combat: {"brace":{"baseline":1,"mounted":0.985}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0024}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Small elevated auxiliary digit separate from planted toes. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual brace only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L144), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L171), [src/render/part-sprites.js](../../src/render/part-sprites.js#L45).

### heel-spike

**Role / advantage:** Hits from behind do a little less damage (per leg). **Tradeoff:** Very slightly slower on land.

**Costs:** 1 base MP / 1 if seen; declared mass 0.08, upkeep 0.03. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites barb; conditional ordinary mutation candidates; no independent part rarity rate. Fits spur under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, predator-pressure, defensive; early specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":0.997}}. Feeding: unchanged from founder reference. Combat: {"rearDamage":{"baseline":1,"mounted":0.97}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0036}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** predator-pressure.
**Art direction:** Backward-directed heel spur with a thick load-bearing root. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual armor only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L145), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L172), [src/organisms/wild-bodies.js](../../src/organisms/wild-bodies.js#L38), [src/render/part-sprites.js](../../src/render/part-sprites.js#L45).

### sensory-bristle

**Role / advantage:** Spots threats a little farther (per leg). **Tradeoff:** A little more food.

**Costs:** 1 base MP / 1 if seen; declared mass 0.08, upkeep 0.02. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits spur under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey-vigilance; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: unchanged from founder reference. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0074119999999998}}. Senses: {"threat":{"baseline":1,"mounted":1.02}}. Reproductive route: live.
**Ecological niche:** prey-vigilance.
**Art direction:** Single flexible antenna-like bristle with a fine tip. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual glance only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L146), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L173), [src/render/part-sprites.js](../../src/render/part-sprites.js#L45).

### grip-pad

**Role / advantage:** Slightly faster on land (per leg). **Tradeoff:** Very slightly weaker brace.

**Costs:** 1 base MP / 1 if seen; declared mass 0.08, upkeep 0.02. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites none; conditional ordinary mutation candidates; no independent part rarity rate. Fits spur under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, open-ground; early specialization.
**Effects in a valid adult probe:** Movement: {"land":{"baseline":1,"mounted":1.006}}. Feeding: unchanged from founder reference. Combat: {"brace":{"baseline":1,"mounted":1.005}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.0024}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** open-ground.
**Art direction:** Broad textured contact patch aligned with the actual grasp/contact surface. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual run only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L147), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L174), [src/render/part-sprites.js](../../src/render/part-sprites.js#L45).

### kick-spur

**Role / advantage:** Slightly harder bites (per leg). **Tradeoff:** A little more food.

**Costs:** 1 base MP / 1 if seen; declared mass 0.08, upkeep 0.03. Adult physical-mass probe 1.45 versus founder 1.45; no installed part-mass penalty inferred.
**Availability:** prerequisites claw; conditional ordinary mutation candidates; no independent part rarity rate. Fits spur under existing socket capacities and viability rules.
**Classification / proposed tier:** specialist, prey; early specialization.
**Effects in a valid adult probe:** Movement: unchanged from founder reference. Feeding: unchanged from founder reference. Combat: {"strike":{"baseline":1,"mounted":1.025}}. Social: unchanged from founder reference. Survival: {"metabolism":{"baseline":1,"mounted":1.008618}}. Senses: unchanged from founder reference. Reproductive route: live.
**Ecological niche:** prey.
**Art direction:** Forward/rearward impact spur aligned with the leg's strike arc. Current native asset: 32x32, 16 frames, rig unrigged, states idle.
**Visible behavior:** static; show actual strike only when the canonical controller permits it.
**Sources:** [src/lineage/part-abilities.js](../../src/lineage/part-abilities.js#L148), [src/lineage/part-registry.js](../../src/lineage/part-registry.js#L175), [src/render/part-sprites.js](../../src/render/part-sprites.js#L45).

## Trait inventory

Traits are not all hereditary unlocks. Learned habits/tendencies, inherited preferences, molecular loci and expressed anatomy retain distinct authorities. Numbers and source references for each record are in the JSON companion.

| Kind | Trait | Current role | Proposal / balance status |
| --- | --- | --- | --- |
| survival gene | body | Visible size and strike expression; physical mass remains founding physiology plus development | Existing authority preserved; independent MP/rarity unassigned |
| survival gene | motion | Movement speed and chase/escape efficacy | Existing authority preserved; independent MP/rarity unassigned |
| survival gene | metabolism | Efficiency of ongoing and movement energy costs | Existing authority preserved; independent MP/rarity unassigned |
| survival gene | digestion | Food assimilation and anatomy-dependent hunting efficacy | Existing authority preserved; independent MP/rarity unassigned |
| survival gene | senses | Sensory/search range and target discovery | Existing authority preserved; independent MP/rarity unassigned |
| survival gene | climate | Thermal comfort and exposure response | Existing authority preserved; independent MP/rarity unassigned |
| survival gene | immunity | Disease susceptibility and well-fed recovery | Existing authority preserved; independent MP/rarity unassigned |
| survival gene | temperament | Inherited behavior/courtship interpretation | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | hardened-mantle | Stalker bites hurt less. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | barbed-limbs | Your bite-and-limb strike can drive a Stalker back. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | bitter-slime | A Stalker that bites you recoils and avoids you briefly. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | spring-tendons | Sprint faster when escape matters. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | water-sacs | Lose water more slowly. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | efficient-gut | Food restores more energy. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | fast-healing | Recover health much faster while well fed. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | alarm-pulse | Press X to warn nearby family when a Stalker is close. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | camouflage-mantle | Hide in dense cover and feed quietly without revealing yourself. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | heavy-jaw | Your bite hits much harder; fit descendants may challenge Stalkers near home. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | mobbing-instinct | Rally adult family against Stalkers; mature relatives also defend threatened young. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | grasping-limbs | Press Z to carry food back to shelter from farther away. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | adaptive-chromatophores | Stay hidden while moving and foraging cautiously through dense cover. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | crushing-jaw | Bites can stagger Stalkers; healthy descendants patrol a wider home core. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | coordinated-defense | Rallied adults brace together and defend young across a wider family area. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | provisioning-pouches | Carry a double food load; stocked shelter supports longer family excursions. | Existing authority preserved; independent MP/rarity unassigned |
| expressed adaptation | webbed-limbs | Cross rivers and open water instead of stopping at the bank. | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | armor | mantle plating | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | barbs | limb barbs | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | glands | mantle glands | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | spring | rear-leg tendons | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | waterBody | water-holding body | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | gut | gut | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | repair | tissue repair | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | signal | signal crest | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | rally | rally crest | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | skin | skin pigment | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | jaw | jaw | Existing authority preserved; independent MP/rarity unassigned |
| continuous anatomy axis | forelimb | forelimbs | Existing authority preserved; independent MP/rarity unassigned |
| animal reproductive locus | gamete | Inherited gamete recognition independent of survival genes/builds | Existing authority preserved; independent MP/rarity unassigned |
| animal reproductive locus | development | Inherited embryo-development fertility | Existing authority preserved; independent MP/rarity unassigned |
| inherited preference axis | size | Individual chooser weighting of observable size; no universal desirable direction | Existing authority preserved; independent MP/rarity unassigned |
| inherited preference axis | strength | Individual chooser weighting of observable strength; no universal desirable direction | Existing authority preserved; independent MP/rarity unassigned |
| inherited preference axis | ornament | Individual chooser weighting of observable ornament; no universal desirable direction | Existing authority preserved; independent MP/rarity unassigned |
| inherited preference axis | display | Individual chooser weighting of observable display; no universal desirable direction | Existing authority preserved; independent MP/rarity unassigned |
| inherited preference axis | behavior | Individual chooser weighting of observable behavior; no universal desirable direction | Existing authority preserved; independent MP/rarity unassigned |
| inherited ritual taste | dance | Individual response to actual funded dance displays | Existing authority preserved; independent MP/rarity unassigned |
| inherited ritual taste | call | Individual response to actual funded call displays | Existing authority preserved; independent MP/rarity unassigned |
| inherited ritual taste | flare | Individual response to actual funded flare displays | Existing authority preserved; independent MP/rarity unassigned |
| inherited ritual taste | scent | Individual response to actual funded scent displays | Existing authority preserved; independent MP/rarity unassigned |
| inherited ritual taste | gesture | Individual response to actual funded gesture displays | Existing authority preserved; independent MP/rarity unassigned |
| inherited choice parameter | selectivity | Individual selectivity in reciprocal assessment | Existing authority preserved; independent MP/rarity unassigned |
| inherited choice parameter | tempo | Individual tempo in reciprocal assessment | Existing authority preserved; independent MP/rarity unassigned |
| botanical growth/tissue trait | growth | Inherited plant growth; affects actual finite growth, consumption or seed investment | Existing authority preserved; independent MP/rarity unassigned |
| botanical growth/tissue trait | waterNeed | Inherited plant waterNeed; affects actual finite growth, consumption or seed investment | Existing authority preserved; independent MP/rarity unassigned |
| botanical growth/tissue trait | nutrition | Inherited plant nutrition; affects actual finite growth, consumption or seed investment | Existing authority preserved; independent MP/rarity unassigned |
| botanical growth/tissue trait | seedAllocation | Inherited plant seedAllocation; affects actual finite growth, consumption or seed investment | Existing authority preserved; independent MP/rarity unassigned |
| botanical growth/tissue trait | coatAllocation | Inherited plant coatAllocation; affects actual finite growth, consumption or seed investment | Existing authority preserved; independent MP/rarity unassigned |
| botanical reproductive locus | cue | Dedicated inherited cue stage; delivery, recognition, fertilization, seed viability and germination remain separate | Existing authority preserved; independent MP/rarity unassigned |
| botanical reproductive locus | receptor | Dedicated inherited receptor stage; delivery, recognition, fertilization, seed viability and germination remain separate | Existing authority preserved; independent MP/rarity unassigned |
| botanical reproductive locus | selfMarker | Dedicated inherited selfMarker stage; delivery, recognition, fertilization, seed viability and germination remain separate | Existing authority preserved; independent MP/rarity unassigned |
| botanical reproductive locus | selfCompatible | Dedicated inherited selfCompatible stage; delivery, recognition, fertilization, seed viability and germination remain separate | Existing authority preserved; independent MP/rarity unassigned |
| botanical reproductive locus | anther | Dedicated inherited anther stage; delivery, recognition, fertilization, seed viability and germination remain separate | Existing authority preserved; independent MP/rarity unassigned |
| botanical reproductive locus | stigma | Dedicated inherited stigma stage; delivery, recognition, fertilization, seed viability and germination remain separate | Existing authority preserved; independent MP/rarity unassigned |
| botanical reproductive locus | ovule | Dedicated inherited ovule stage; delivery, recognition, fertilization, seed viability and germination remain separate | Existing authority preserved; independent MP/rarity unassigned |
| botanical reproductive locus | embryo | Dedicated inherited embryo stage; delivery, recognition, fertilization, seed viability and germination remain separate | Existing authority preserved; independent MP/rarity unassigned |
| proto trait | frugal-frame | A slightly thriftier body shaped by generations of thin forage. | Existing authority preserved; independent MP/rarity unassigned |
| proto trait | range-sense | A slightly more searching sensory profile shaped by crowded feeding grounds. | Existing authority preserved; independent MP/rarity unassigned |
| proto trait | watch-crest | A more vigilant sensory crest shaped by persistent predator pressure. | Existing authority preserved; independent MP/rarity unassigned |
| proto trait | close-brood | A compact social build shaped by dense family living. | Existing authority preserved; independent MP/rarity unassigned |
| proto trait | dryland-skin | A drier, tighter mantle shaped by repeated life away from reliable moisture. | Existing authority preserved; independent MP/rarity unassigned |
| proto trait | splayfoot | Broader footing shaped by generations living on saturated ground. | Existing authority preserved; independent MP/rarity unassigned |
| proto trait | heat-shed-mantle | A slightly leaner mantle shaped by persistent heat. | Existing authority preserved; independent MP/rarity unassigned |
| proto trait | cold-mantle | A fuller mantle shaped by persistent cold. | Existing authority preserved; independent MP/rarity unassigned |
| taxon lifestyle | aquatic | This taxon is becoming a water-crossing, wet-habitat lineage. | Existing authority preserved; independent MP/rarity unassigned |
| taxon lifestyle | nomadic | This taxon is becoming a wide-ranging lineage that does not depend on one center. | Existing authority preserved; independent MP/rarity unassigned |
| taxon lifestyle | guardian | This taxon is becoming a defensive lineage built around holding kin and shelter together. | Existing authority preserved; independent MP/rarity unassigned |
| taxon lifestyle | burrower | This taxon is becoming a den-focused lineage that invests heavily in protected homes. | Existing authority preserved; independent MP/rarity unassigned |
| taxon lifestyle | hunter | This taxon is becoming an active hunting lineage that treats live prey as ordinary food. | Existing authority preserved; independent MP/rarity unassigned |
| taxon lifestyle | grazer | This taxon is becoming a plant-focused lineage built around sustained feeding grounds. | Existing authority preserved; independent MP/rarity unassigned |
| lineage form | forager | A leaner, longer-limbed descendant built to range farther and find food at distance. | Existing authority preserved; independent MP/rarity unassigned |
| lineage form | colony | A compact, shelter-oriented descendant built around food sharing and group protection. | Existing authority preserved; independent MP/rarity unassigned |
| learned family tendency | forager | Adults range farther, search wider, and spend more time feeding away from the family core. | Existing authority preserved; independent MP/rarity unassigned |
| learned family tendency | colony | Adults stay closer to shelters and one another, regrouping around established family homes. | Existing authority preserved; independent MP/rarity unassigned |
| learned habit | range | ranges far to feed; observed/caregiver learning, not genetic inheritance | Existing authority preserved; independent MP/rarity unassigned |
| learned habit | home | stays near home; observed/caregiver learning, not genetic inheritance | Existing authority preserved; independent MP/rarity unassigned |
| learned habit | caution | wary of Stalkers; observed/caregiver learning, not genetic inheritance | Existing authority preserved; independent MP/rarity unassigned |
| learned habit | boldness | stands its ground; observed/caregiver learning, not genetic inheritance | Existing authority preserved; independent MP/rarity unassigned |
| learned habit | hunting | hunts small prey; observed/caregiver learning, not genetic inheritance | Existing authority preserved; independent MP/rarity unassigned |
| threshold body ability | pounce | Existing pounce capability expressed by an anatomy threshold | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | speed | Existing speed defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | mass | Existing mass defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | predationVulnerability | Existing predationVulnerability defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | diseaseSusceptibility | Existing diseaseSusceptibility defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | maxEnergy | Existing maxEnergy defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | maxHydration | Existing maxHydration defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | maturity | Existing maturity defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | lifespan | Existing lifespan defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | litter | Existing litter defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | gestation | Existing gestation defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | reproCost | Existing reproCost defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | postpartum | Existing postpartum defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | baseMetabolism | Existing baseMetabolism defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | waterUse | Existing waterUse defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | social | Existing social defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | density | Existing density defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | reproduction | Existing reproduction defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |
| founding physiological context | familyCare | Existing familyCare defaults; context retained by physiology, not independent inherited loci | Existing authority preserved; independent MP/rarity unassigned |

Each trait record includes current metadata and source references plus separate proposed pros/cons, mutation cost, rarity, progression tier, art and observable behavior notes. Traits without a documented countercost are review gaps, not invented penalties.
