# GenVo8 — Development Plan (Guided Survival Extension, Revision 2)

**Decision date:** 2026-10-10  
**Decision:** Guided Survival is the **default** new-game profile.  
**Status:** Approved design specification, revised from Alex's 2026-10-10 playtest feedback; **implementation and tests not yet performed**.  
**Reference inspected:** v1.60.1 toolkit. **Integration target:** Codex's latest working source, including Claude's recovered aquatic-gradient, predator-interference, and ongoing seasonal/underground changes.  
**Revision 2:** Section I below adds immediate predator tension, mate choice/refusal and mating competition. Where its rules differ, Section I supersedes earlier Guided Survival guidance.
**History:** The earlier depth plan (2026-10-08, against v1.33.7) is preserved below as historical context. Its "plan only" and older mechanical descriptions do not supersede implemented features or this 2026-10-10 extension.

## A. Product contract

**Guided Survival** is the standard player-start experience in a real, autonomous ecosystem. It prevents invalid or opaque opening states, not danger or eventual extinction.

Invariants:
1. Player has a *viable, connected opening opportunity*, not guaranteed future success.
2. Living creatures, food, climate, reproduction, migration, and predation use normal simulation rules after initialization. Never manufacture ongoing population recovery by invisibly respawning a depleted species.
3. Protect only the initial onboarding window and starter conditions. Safeguards **expire**; wild creatures must retain autonomy and can compete normally during onboarding.
4. No rigid species-wide behavioral templates: evolved Stalkers, Hoppers, Diggers, and GenVo8 variants can occupy terrestrial, aquatic, or underground niches if their actual traits support them.
5. Keep technical performance limits separate from gameplay protections. Rule-of-8 is a baseline, never a species/parts/animation/ability ceiling.
6. Selected world seed, spawn position, mode, and safety decisions must be deterministic, inspectable, and save/reload compatible.

## B. Starting-world validation (only before play)

Introduce a **start validator** that scores candidate spawn positions on the generated world instead of constantly manipulating wildlife once play starts. Validate these jointly, not as independent checkboxes:

- **Traversability:** Spawn on terrain reachable by the founder's *actual anatomy*; require a connected exploration region sufficient for movement, shelter, drink/food access, and the starter mate. Avoid stranded islands unless the founder has viable aquatic traversal. Do not assume every future founder is land-only.
- **Food:** At least one usable food source within accessible travel distance for the starting diet, with a credible regeneration path over the first onboarding period. Base checks on digestibility/feeding abilities, not only plant names.
- **Water & exposure:** A drinkable water source *or* a verified viable hydration alternative; no immediately lethal climate or immersion condition. Check water route with the same reachability rules the runtime uses.
- **Mate:** At least one living, mature, reproductively compatible, sufficiently unrelated first mate reachable using normal traversal. The first mate can be highlighted until discovered. Do not rely on Euclidean distance across impassable water/cliffs. Do not silently override genetic/kinship constraints.
- **Predator escape possibility:** Avoid a spawn that is immediately enclosed by unavoidable lethal predators. Allow nearby predators, audible danger, rival chases, carcasses and territorial disputes. No universal predator-exclusion radius that makes the beginning sterile.
- **Observability:** Prefer opening regions containing active, viewable wildlife and competing consumers, not a blank safe bubble. This is a **preference**, not permission to script fake fights or spawn adversaries on top of the player.

**Algorithm:** For a given seed, evaluate deterministic candidate start positions; select the highest-scoring *valid* one with stable tie-breaks. If none passes, clearly report the seed's incompatibility and offer a different seed or explicit non-guided mode. **Never silently replace a manually entered seed** or teleport the player after simulation starts. If a random seed is requested, bounded seed retries are allowed; record the actual chosen seed. Do not permit unbounded generation loops.

A validator can reject *unfair starts* without preventing ordinary late-game migration, isolation, scarcity, competition, or extinction.

## C. Opening onboarding safeguard

1. Retain the existing starter-mate/tutorial guidance as a starting point; inspect `Simulation.prepareStarterMate()` and `Simulation.isOpeningProtected()` before changing semantics.
2. Guided opening protection applies **only** to the player founder and the specifically selected starter mate; not to every allied offspring or entire wildlife species. Prevent early unavoidable lethal attacks, **not** environmental reactions, warnings, hostile positioning, retreat, energy costs, or perceived danger.
3. Use a configurable, persisted window with explicit exit conditions (for example the existing first-20-day grace, potentially ending after an early objective); tune against real playtests rather than claiming the number is final. Once ended it must never reactivate in the same lineage's later generations.
4. Show clear UI when the protected period is active and when it expires. Do not disguise immunity as ordinary combat behavior.
5. If the highlighted starter mate dies after protections expire, that is a real consequence. Provide normal mate-search clues, **not** emergency materialization of a replacement.
6. Starter mate setup should not conceal invalid starting-world generation; validator must establish actual route viability.

## D. Make the opening feel populated without forcing chaos

During the first 5–10 minutes, the player should *observe* ordinary ecological interactions whenever local populations support them: grazing competition, predators pursuing other prey, scavenging, rival avoidance/intimidation, cooperative family movement, or territorial conflict.

Rules:
- Activities must be consequences of actual creature states and valid ecological opportunities, not fake vignette spawns.
- Support predator-on-predator competition and intraguild predation when hunger, size, risk, diet and reachability permit. No blanket rule that a predator kills every outsider.
- Diagnose predator clustering by actual attraction gradients (shared prey, spawn centers, pathfinding, territoriality, available habitat) before imposing distance-based anti-clustering hacks.
- The starting region should be alive but not guaranteed to present any exact event on any exact day.

## E. Mate discovery: clear for first generation, meaningful thereafter

- **Generation one:** show the initial mate via a highlighted cue until located, plus an accessible explanation of mating criteria.
- **Later generations:** no omniscient permanent mate markers. Add trackable in-world clues (calls, tracks, scent, gathering areas) that work through current sensory traits and player actions. A clue must point to a real animal or a real recent activity location; if no mate is available, state that accurately.
- Distinguish unavailable mates by maturity, reproductive compatibility, kinship, unreachable habitat and death. Never guarantee that every branch can continue indefinitely.
- Preserve normal dispersal, mating choice, movement, and independent AI: do not force a viable mate to teleport into range.
- Provide feedback: why a nearby organism cannot mate, and how to search when no suitable mate has been detected.

## F. Config architecture and rollout

Suggested modules (names are **proposals**, not files verified to exist):

- `src/sim/world-modes.js`: typed profile registry, default=`guided_survival`; separate from species/trait definitions.
- `src/world/start-validator.js`: seed/spawn validation with real traversal and food/diet checks.
- `src/gameplay/opening-safeguards.js`: bounded, explicit onboarding protection; may wrap existing simulation methods without duplication.
- `src/ui/world-setup.js` (or integrate into the *actual* existing world setup view): mode explanation, seed selection, validation feedback.
- `src/ui/mate-clues.js`: sensory clue presentation; ecology owns mate availability, UI only displays actual observations.

Integration points **present in inspected v1.60.1**:
`src/sim/simulation.js` (`Simulation(seed,{player,bootstrap})`, `spawnInitial`, `prepareStarterMate`), `src/world/world.js`, `src/sim/config.js` (`CFG.initial`, `CFG.maxAnimals`), `src/ecology/carrying.js`, `src/ecology/recovery.js`, `src/organisms/species.js`, `src/persistence/save-manager.js`, `tests/onboarding.mjs`, `tests/ecology-stability.mjs`.

Codex must inspect the current worktree and use current APIs; do not add duplicate controller systems or overwrite newer evolution, aquatic, seasonal, or burrow logic. If mode selection is not yet available in UI, default new games to Guided Survival and defer custom modes.

**Mode state:** persist profile ID, world seed, actual spawn site, validator version and outcome summary, onboarding expiry state, and any explicit player override. On older saves lacking a profile, preserve their existing state; do **not** restart protection simply because a new default exists. Bump/migrate save schema intentionally if storage changes.

**Settings separation:**
- Technical: hard memory/animal cap, render/decision budgets, emergency anti-crash safeguards. These remain in all modes.
- Guided: pre-start validation, first-mate discoverability, limited founder grace, onboarding/tutorial cues.
- Ecology: feeding, birth, deaths, territory, habitat access, energy transfer, population dynamics. These continue operating for all wildlife and later generations.

## G. Automated verification plan

**Tests below are specifications, not claims of a completed test run.** Add tests under existing `tests/` conventions and wire into the project test runner only after inspecting it.

| Test ID / proposed filename | Method | Passing criteria |
| --- | --- | --- |
| GS-01 `guided-start-seeds.mjs` | Evaluate **100 fixed seeds**, repeat twice | Every accepted Guided start has a viable founder, reachable suitable food/drink, a traversable region, and a compatible starter mate. Same seed produces exactly the same selected site; rejected seeds report reasons. |
| GS-02 `guided-start-islands.mjs` | Include isolated-island, disconnected shoreline, dry/no-edible-food, predator-encircled, and valid amphibious-founder fixtures | Invalid starts rejected; legitimate aquatic crossings accepted only with effective swimming; no Euclidean-distance false positives. |
| GS-03 `guided-mate-onboarding.mjs` | Follow first-mate selection, cues, and actual pairing | First mate alive, adult, biologically compatible, path-reachable; clear highlight until discovery. Failed checks are not fixed by post-start teleportation. |
| GS-04 `guided-grace-window.mjs` | Attack founder/mate during and after protected window, advance day and complete early goals | Protection only affects intended targets/time; visibly expires and never returns for successor; normal attack rules fully resume. |
| GS-05 `guided-generation-two.mjs` | Advance to offspring handoff and search in a sparse population | New generations get sensory clues only for actual evidence; there is **no guaranteed mate spawn** or involuntary teleportation. Kinship constraints retained. |
| GS-06 `guided-observable-ecology.mjs` | Run 30 fixed seeded 5–10 minute-equivalent simulated openings, record actual nearby wildlife interactions | Report fraction with **at least one** legible non-player interaction; target >=90%, tune world distribution/behavior based on data, never inject staged events to game an assertion. |
| GS-07 `guided-predator-clusters.mjs` | Inspect heatmaps and encounter events for 30 seeds; check multiple prey and predator classes | Log actual predator clustering, prey access and conflict reasons; flag abnormal clumping for review; do not require arbitrary equal spacing. |
| GS-08 `guided-survival-fairness.mjs` | Automated first 20 in-game days over 100 seeded starts, with a simple deterministic survival policy | No **structurally unwinnable** start; record survival, reproduction opportunity, starvation, predation, time-to-food and time-to-mate. Do not demand 100% survival against autonomous ecology. |
| GS-09 `guided-save-load.mjs` | Save/reload before and after grace expiry and generation transition | Seed, mode, spawn/validation provenance and protection expiry round-trip; no duplicate starter mate; no protection reset after load. |
| GS-10 `guided-ecology-regression.mjs` | Existing ecology stability, aquatic reachability, reproduction, seasonal and new burrow tests | No new population-collapse regressions, no improper aquatic exclusions, no invasive special cases in normal ecology. Track metrics by seed. |
| GS-11 `guided-performance.mjs` | Compare setup/generation time, normal 10-minute play, and several population load levels | Validator bounded, no unbounded loop; world render and ecology remain within current regression baselines, with explicitly reported budgets. |
| GS-12 `guided-ui-a11y.mjs` | Actual browser test at 1280x720 and 900x650; keyboard/controller as applicable | No overlapping controls, readable cues, actionable route guidance, accessible status text and clear expiration messaging. Record **real** screenshots. |

**Diagnostics required:** `seed`, `mode`, `site`, `rejectionReasons`, `pathReachability`, `foodAvailability`, `mateId`, `graceEnds`, `populationOverTime`, `observedInteractions`, `survivalOutcomes`. Use deterministic RNG; do not change RNG draw order without identifying seed-compatibility implications.

## H. Delivery and sequencing

1. **Do not interrupt** the active Codex aquatic/seasonal ecological stability work. Finish and verify the current pass first.
2. Audit newest code to identify which of the proposed Guided systems already exist. Carry forward behavior without duplicating it.
3. Implement mode contract, validator, first-mate discoverability and protection-state persistence (small isolated pass).
4. Add ecological visibility and mate-discovery improvements (separate pass; real creature activity only).
5. Run deterministic seed tests and real in-browser playtests; iterate on observed failure modes, especially empty openings and predator clustering.
6. Package **one canonical updated source toolkit and one matching public build**, with provenance evidence and verified screenshots. No third toolkit, no unrelated code rewrite.

**Definition of done:** Default Guided Survival new world starts in a viable but active ecosystem; first mate can be found and understood; opening protections are finite and transparent; later generations have genuine scarcity, rivalry, and extinction risk; all specified test categories pass with recorded seed-level evidence; a human playtest confirms the first 10–20 minutes feel neither empty nor unfair.


## I. Guided Survival revision 2 — immediate danger, mate choice, and rivalry (2026-10-10)

**Reason:** Alex's latest live feedback: the opening feels too empty; more roving predators and potential mates would increase playability; players should experience competition for food and mating partners, including dominance contests and partner choice. Guided Survival is **an active, risky opening**, not a predator-free tutorial.

### I.1 Opening threat and wildlife activity

- Use a **habitat-conditioned roving predator population** with independent hunting, patrol, hunger, rest, fear, pursuit, and risk evaluation. Permit predator movement through the player's broad opening region; do **not** spawn predators specifically onto the player, create scripted ambushes, or force an encounter just to satisfy a metric.
- Start-site validation must ensure a *reasonable escape/avoidance route* (cover, shelter, movement and stamina margin appropriate to starting anatomy), not a complete safe-zone or predator-free radius. A predator may spot, chase, injure or interrupt the founder; any temporary fatality safeguard must be **short, visible and precise**, with normal threat physics preserved. Audit the old 20-day grace: if it suppresses all meaningful early challenge, narrow it. Do not claim a particular tuned duration until observed in playtests.
- Make danger legible: footsteps/rustling, threat calls, silhouettes, carcasses, tracks, fleeing prey, a visible warning response, and accessible UI cues where needed. A player should be able to react by fleeing, hiding, intimidating, fighting or moving to safer habitat according to anatomy.
- Reduce artificial clustering by examining prey/food attraction, pathfinding destinations, predator home ranges, solitary vs social behavior, local competition and territory. Solitary predators should often spread out, social hunters may gather legitimately. Do not impose uniform spacing or arbitrary group size independent of traits.
- During opening play, the ecosystem must be **visibly occupied**: competitors forage, predators interact with wild prey and rivals, potential mates wander/call, individuals rest and flee. These must be real agent behavior, not playback scenes.

### I.2 Multiple potential mates and discoverable courtship

- Prefer **several authentic potential partner opportunities in the reachable broader region**, each with individual preferences, history and movement, rather than a single highlighted guaranteed pairing. Do not instantiate replacement mates once play begins. World generation may score a starting region for *candidate diversity and dispersal*, but cannot assume every candidate is receptive or compatible. Validate **at least one plausible first-generation reproduction path** instead of an automatically guaranteed acceptance.
- A candidate is only viable if adult, reproductively compatible, sufficiently unrelated, physically reachable, alive and capable of accepting courtship under achievable conditions. Report none found vs detected but unavailable separately. Cues should arise from actual calls, signs and sensed animals.
- Introduce **courtship as an encounter**, with approach, display/communication, preference assessment, possible acceptance/refusal and cooldown. A refusal must include an observable cause (e.g., unfamiliarity, stress, unsuitable habitat, incompatible display, active bond, contested territory, poor condition) where the player's senses permit that knowledge. Avoid an unconditional random denial that can be bypassed by repeatedly clicking.
- Alex's suggestion of **two refusals out of three** is a *playtest hypothesis*, not a universal law. Benchmark a roughly 2/3 rejection rate among **unfamiliar/unfavorable courtship attempts**, if that proves enjoyable, but derive actual willingness from candidate preferences and context. Suitable courtship, history, health, compatibility and mating signals should materially improve odds. Do not bake a global `random() < 2/3` gate into every candidate or offspring lineage.
- Persist individual preferences and interaction state. A failed attempt should not become a fresh independent dice roll on the next frame. Use a meaningful cooldown and conditions the player can influence. Ensure the player can identify another candidate or alter approach after rejection.

### I.3 Mating competition and social dominance

- Add **same-niche and same-species** competition for food, attractive mating areas, shelter and partners; extend existing resource/territory conflicts rather than duplicate combat systems.
- Where a lineage's **evolved mating strategy** supports dominance contests, rivals may posture, display, threaten, chase, wrestle or fight. Opponents should weigh condition, size, existing injuries, territory, relationship and risk; contests often end with retreat or submission instead of death. Winning creates a temporary social/reproductive advantage, **not ownership of a mate** or automatic acceptance.
- The other prospective partner independently chooses or declines based on preferences, compatibility, condition, available rivals and observed displays. The player can reject approaches too; agency applies to AI and player animals. Contest success cannot bypass biological incompatibility or individual preference.
- Do **not hardcode universal sex roles** (e.g., all males must fight and all females passively choose). That could be a starting mating strategy for particular sexually reproducing lineages but should be data-driven and evolvable. Some species may use mutual displays, female-female contests, pair-bonding, resource gifts, mutual selection, or no dominance contest. Maintain clear reproductive compatibility rules in the existing simulation; do not arbitrarily change the game's present reproductive biology in this pass.
- Social ranking/dominance should be scoped to a local context and time window; no permanent invincibility, stat buff without cause, or global species-wide alpha flag. Rival preferences and injury costs can influence who reproduces, and thus actual natural selection.

### I.4 Player-facing clarity

- Add concise contextual states: `Available`, `Uninterested`, `Courting`, `Bonded`, `Contested`, `Recovering`, `Unavailable` (final names can follow existing UI). Explanations should be plain-language, not large permanent debug overlays.
- Clearly separate *finding*, *approaching*, *courting*, *competing* and *reproducing*. A detected mate does not mean guaranteed acceptance. An accepted courtship does not immediately alter adult anatomy; inheritance still applies to future offspring.
- In generation one, teach the first courtship via prompts and visible feedback, **not a guaranteed yes**; verify a realistic path to reproduction so failure teaches rather than softlocks. Later generations can genuinely fail to reproduce, and their branches may go extinct.
- Creature anatomy and behavior should drive dominance tactics: strength may aid contests, calls and appearance may aid displays, stealth/scent may help find partners, food stores or territory may improve suitability. Do not make combat the single optimal reproductive strategy.

### I.5 Implementation scope and migration

- Finish and validate Codex's active aquatic/seasonal/underground work before integrating these mechanics.
- Inspect the **latest** working source for existing courtship, competition, sensory cues, sex/reproductive compatibility, aggression and territory systems. Extend their existing data and event interfaces; do not introduce separate AI controllers or hardcode stalker/hopper-only mating rules.
- Keep all courtship probability/utility components parameterized per lineage trait/environment; log reasons in debug-only metrics; preserve seed determinism, save schema and provenance.
- Distinguish **world-start distribution** (candidate positions and initial population) from **live ecological rules** (normal mate choice, birth, death and migration). No hidden reinforcement spawning or permanent mating rescue.

### I.6 New acceptance tests (proposed; not yet run)

| Test | Procedure | Passing condition |
| --- | --- | --- |
| GS-13 `guided-early-threat.mjs` | 100 fixed seeds; instrument first 5–10 minutes with a baseline human-like survival policy and a no-input control | Real predator activity is visible in a substantial fraction of openings; threats are readable and avoidable in viable starts; log first-contact, pursuit, injury and death distribution; no forced ambush. Set acceptance bounds from an initial baseline, not invented numerical promises. |
| GS-14 `guided-roaming-ecology.mjs` | Record predator home ranges, clustered encounters, prey distribution, social/solitary traits over multi-day seeded runs | Clustering explained by food, territory, movement or social preferences; no unexplained spawn-center trapping; no erratic repeated same-tile convergence. |
| GS-15 `guided-mate-candidates.mjs` | 100 seeds across fragmented islands, surface/underground/aquatic accessibility and varied mate counts | Start-validator scores real accessible candidates; at least one plausible reproduction route for each accepted Guided start; cannot silently spawn mates after load or after a rejected courtship. |
| GS-16 `guided-courtship-choice.mjs` | Deterministic fixtures for compatible/poor/ideal candidates; repeat across RNG seeds | Context and preferences measurably change acceptance; rejection has stable reasons and cooldown; no random-roll spam exploit; acceptance never bypasses reproduction constraints. |
| GS-17 `guided-contests.mjs` | Same-species and related-branch mating rivalry tests with varied anatomy, conditions and sexes/strategies | Threat, display, retreat and fight decisions follow risk and social traits; victories confer bounded advantages but never guaranteed mating; losing doesn't always result in death. |
| GS-18 `guided-role-diversity.mjs` | Fixtures for multiple mating systems with mutual, one-sided and resource-based selection | No engine-level mandatory male-fights/female-chooses assumption; player and AI can refuse; compatible trait-driven alternatives work. |
| GS-19 `guided-first-gen-playtest.mjs` | Real-browser 10–20 minute guided openings; expert and first-time testers | Players perceive immediate risk, understand why courtship succeeds/fails, can locate alternate candidates or improve courtship strategy; record clips, seed IDs and explicit player feedback. |
| GS-20 `guided-social-regression.mjs` | Simulate multiple years with mating competition, predator interference, seasons and aquatic/burrow ecology | No unexamined population collapse, runaway lethal dominance loop, reproductive deadlock, stuck AI state or save/load inconsistency; compare to control seeds. |

**Success criterion:** The first minutes feel alive and dangerous while giving the player genuine, discoverable choices. Mating becomes a social and ecological interaction with agency and uncertainty, without relying on arbitrary rejection or scripted dominance outcomes. No promises of perfect survival or automatic continuation.

---

# Prior historical development plan (preserved unchanged)

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
