# GenVo8: answering the playtest feedback

Written 2026-10-08 against v1.33.7, after James's playtests. Plan only; nothing is built.

## What testers said

- There is not enough to do.
- Some want a more Spore-like creature editor and evolution.
- A new lineage alone is not enough incentive to keep going.
- The base game seems OK but lacks systems and deeper gameplay.

This overrides the assessment's advice to stop adding systems. Players have said what is missing. The task is to add depth through the systems that already exist, so each addition makes the old ones matter more.

## Facts that shape the plan

- **Time.** A day is 6 seconds at 1x. Pregnancy takes 16 days (about 1.6 minutes) and young grow up in 30 days (3 minutes). The first birth usually arrives 5 to 8 minutes in, and the first possible handoff about 12 minutes in. Anything tied to births and handoffs lands inside a first 20-minute session.
- **The body is already one record.** Twelve anatomy parts (plating, barbs, glands, rear-leg tendons, water-holding body, gut, tissue repair, signal crest, rally crest, skin pigment, jaw, forelimbs) plus form and proto-trait axes. Adaptations switch on at thresholds. Pounce shows that a part crossing a further threshold can unlock a verb.
- **Visuals do not follow the body yet.** Sprites react to expressed adaptations (on or off) and genes, not to how developed each part is. An editor needs gradual visual change, or shaping a body will not look like anything.
- **Earned events already exist** and could pay a currency: meals, drinks, hunts, young raised to maturity, Stalker encounters survived, homes built, pressure endured, knowledge taught.

## The three options

### A. Body shaping with earned evolution points (the "Spore-like" answer)

**What it is.** The lineage earns evolution points (EP) from what it does: raising young to adulthood, surviving a Stalker encounter, a successful hunt, enduring a dry or cold spell, building a home, teaching a place. EP buys body growth at two moments:
- **At birth:** nudge one newborn's body toward a part (about +0.1 per spend, capped per birth). This happens 5 to 8 minutes in.
- **At handoff:** shape the successor you chose, with larger spends but still capped.

**What keeps it from being free-form Spore.** You can only grow parts the lineage already carries (above zero in either parent) or parts that lived pressure favors. Costs rise as a part develops. Each part keeps its existing trade-offs (a big jaw raises water use, plating slows sprinting, and so on). Inheritance still blends both parents, so a shaped body has to be bred to stay.

**What it needs.**
- An EP ledger on the lineage.
- A shaping panel on the successor and birth screens (portraits already exist there).
- Gradual sprites for each part: jaw size, leg length, plating, crest height, skin pattern, forelimb hooks, body fullness. This is the biggest piece of work.

**Cost:** large. Two to three passes: the EP economy and rules, the gradual body visuals, then the shaping UI and balance.

**What changes in the first 20 minutes.** EP visibly ticks up from the first meals, the first home and the first mating. The first birth (minutes 5 to 8) opens a short "shape this newborn" choice, and the first handoff (around minute 12) a bigger one. The player always has something to save for and a visible body to build.

**Risk.** Without new verbs, shaping only shifts numbers. It needs option C to feel like Spore rather than a stat screen.

### B. Long-term goals beyond "next lineage"

**What it is.** A ladder of goals that spans generations and gives each lineage a reason to exist:
- **Territory:** claim and hold home ground. Population centers and territory already exist.
- **A rival:** a wild GenVo8 clan, or a recognized species branch, competing for the same ground. Species coexistence and speciation already exist.
- **A frontier:** reach and settle a new biome, such as wetland, dry upland or cold ground. Procedural habitats and lifestyles already exist.
- **Eras:** at milestones such as G4, a first species split or a first lifestyle, the world shifts (a new predator style, a harsher season), and the lineage carries a legacy (unlocked starting traits, a bigger EP bank).

**Cost:** large. A rival clan needs AI and balance. Territory holding and eras each need a pass.

**What changes in the first 20 minutes.** Little at first. Its value shows from generation 2 or 3 onward, which is exactly where testers lose interest. A visible goal ladder from the start ("This lineage: claim the river valley · rival clan to the east") gives the first 20 minutes a direction.

### C. More verbs, each unlocked by body parts (the Pounce pattern)

**What it is.** Three or four new active abilities, each switched on by a part crossing a higher threshold, with no new meters. Candidates, by how much play they open up:
1. **Dig** (forelimbs): dig out roots in dry spells, dig a quick hiding scrape, start a burrow home. This ties straight into drought and grazing scars.
2. **Ram** (mantle plating): shove a Stalker or prey off balance, break through dense brush.
3. **Swim-dash** (water-holding body with webbing): a burst across water to escape or reach new ground.
4. **Display** (signal or rally crest): scare a lone Stalker off, or call the family to you; a social verb.
5. **Spit** (mantle glands): a ranged deterrent built on Bitter Slime.

**Cost:** medium. About one pass each with tests and a browser check, as Pounce took.

**What changes in the first 20 minutes.** On its own, very little, because parts reach these thresholds over generations. With option A, the player can target a verb deliberately within the first few births.

## Ranking

1. **A + C together: shaping bodies that unlock verbs.** This answers the two loudest pieces of feedback ("more Spore-like", "not enough to do") at once, and each makes the other meaningful. Shaping gives a goal; verbs give the payoff.
2. **B: long-term goals.** This answers "a new lineage isn't enough incentive". It lands best once A and C give lineages something to differ in, but a light goal ladder can come early.
3. **More species and content.** Needed eventually, but it does not answer the feedback by itself.

## Recommended first pass

**"Shape and spring": a small, complete slice of A + C, playable inside 20 minutes.**

1. **Evolution points.** Earned from five existing events: young raised to adulthood, a Stalker encounter survived, a successful hunt, the first home built, and a lived pressure endured. Shown as one number on the lineage chip, not a new bar.
2. **Shaping at birth and handoff.** For four parts first: rear-leg tendons, jaw, mantle plating and forelimbs. Capped and pressure-limited as described above, with existing trade-offs kept.
3. **Gradual sprites for those four parts,** so shaping is visible immediately: longer rear legs, a bigger jaw, plating plates, hooked forelimbs.
4. **One new verb, Dig,** on forelimbs, joining Pounce on rear legs. A player can choose between a hunter line and a digger line within the first two births.
5. **A one-line lineage goal** on the goal panel ("Shape a line that can both hunt and dig" or "Claim this valley"), as the seed of option B.

**Cost:** about three passes. **Measure it** by playtesting the first 20 minutes again with the same testers, and ask whether there is enough to do and whether they want the next generation.

**After that:** add Ram, Swim-dash and Display; then the territory and rival goals (B); then content.

## What this does not change

The simulation stays the authority: shaping changes anatomy values, and everything downstream (adaptations, effects, lifestyles, heredity, visuals) reads them as it does now. Wild animals are unaffected. Existing saves load with zero EP.
