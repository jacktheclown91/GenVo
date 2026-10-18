# Injury, defense and retreat readability — October 14, 2026

This pass covers the recommended milestone: making injury, defense and retreat readable during real encounters. It changes presentation only. Combat outcomes, damage, brace rules, pursuit decisions, aversion timing, RNG and saves are unchanged. All reactions come from state the combat authorities already wrote.

## What changes in play

| Situation | Authority read | What the body does |
| --- | --- | --- |
| Hit taken while bracing, frontal | `sim.lastPlayerBrace.kind='frontal'`, `absorbed` | Guard sparks flare toward the attacker. The body is pushed back but keeps its feet planted. More absorbed damage throws more chips. |
| Braced hit from the side | `kind='side'` | The body twists sideways and the head and feelers pin, with a half-arc on the struck side. |
| Braced hit from behind | `kind='rear'` | The body buckles low, footing breaks into a limp, and a scuff shows where the hit landed. There is no guard arc. |
| Anatomy contrast | `partEffectFactors(a).brace` (the factor canonical brace damage already uses) | A body with sturdy legs or a spine ridge holds the guard. A body with runner legs is rocked further back by the same hit. |
| Hunter charge stopped by a frontal brace | `playerHunt.lastOutcome='braced'` | Stagger: the hunter is thrown back with a decaying head shake, splayed legs and pinned feelers, and keeps watching its target. Dust kicks up from its planted feet. Before this pass it rendered as `idle`. |
| Charge lane ran out or contact missed | `'evaded'`, `'contact-miss'` | Overrun: the hunter skids forward with a wide stance, leaving marks along the spent lane. |
| Counter-bite or repel | `'countered'`, `'repelled'` | Flinch: the body recoils, the head drops and the feelers pin. |
| Wounds within an engagement | `playerHunt.wounds` | The hunter limps and carries its head lower, more so with a second wound, and keeps this between beats. |
| Driven off / repelled | `playerAversion.reason` (`'driven-off'`, or absent for repel, slime or mobbing) | Cowed retreat: low crouch, head down, tail tucked, feelers pinned. It glances back at the creature that beat it on a slow cadence and limps if wounded. |
| Outrun / lost / escaped | `reason` `'outrun'`, `'lost'` or `'escaped'` | Disengaging retreat: upright and alert. No tuck and no stare back. |
| Player wound severity | `injuryCare.level` | The limp is graded sore < wounded < severe. A badly wounded creature also hitches on each stride and carries its head low. |

Stagger, flinch and all brace receipts include a short whole-body shove away from the source. This reuses the renderer's existing impact-recoil offset. It is a sprite-pixel offset only; actual position is still owned by `PlayerCombatController.knockback()` and pursuit movement.

## Source changes

| File | Reason |
| --- | --- |
| `src/render/encounter-reactions.js` (new) | Reaction sampler, pose mapping onto existing shared channels, shove, attention and sparse ground/guard marks |
| `src/render/renderer.js` | Samples reactions per creature; head attention for NPCs; shove; disables the sprite cache during a reaction; draws marks |
| `src/render/behavior.js`, `src/render/life.js` | Graded wound limp from the authoritative injury level |
| `src/render/part-sprites.js` | `tailTuck` shortens procedural and native tails from a fixed root |
| `src/gameplay/predator-encounter.js` | `playerAversion` now also records `reason` and `wounds` in `giveUp`, breakaway and wary drive-off. These fields are presentation evidence only. Older saves without them render as a cowed retreat. |

## Evidence

- `tests/encounter-reactions.mjs` runs the real paths: `tryKill` brace response (frontal and rear), `resolveCharge` against a frontal brace, lane overrun through `decision()`, two `playerStrike` wounds leading to drive-off, `giveUp('outrun')`, and the injury levels. It checks that sampling consumes no RNG and writes no physiology, and that sturdy legs rock less than runner legs under the same braced hit.
- The related combat, encounter, save and locomotion suites pass. `strategy-encounters.mjs` and `creature-assembly.mjs` fail identically on untouched HEAD; this is pre-existing debt and was not caused by this pass.
- Browser checks used the 800×600 game at the default gameplay zoom (2×), with a temporary nearest-neighbour magnifier overlay comparing reactions on and off in the same paused frame. The braced charge clearly opens a gap, with the hunter thrown back and head dropped. At real screen size, cowed and disengaging retreats have distinct silhouettes. The two retreating hunters in that capture were different individuals, so body size and colour also differ.

## Defensive anatomy and prey (second pass)

A defending body now answers a hit with the organ that actually changed the outcome. The organ is read from the body plan and gated on the canonical receipt, so a part that did nothing shows nothing.

| Situation | Authority read | What the body does |
| --- | --- | --- |
| Hardened mantle (expressed as paired flank plates), armoured torso | `lastDefenseReceipt.armor` (torso/mantle share of the reduction) | Plates glint on the struck side, with more glints the larger the share absorbed. The body stays planted, and the shove shrinks with the absorbed share. |
| Shell back / dome torso, bitten from behind | `lastDefenseReceipt.shell` (rear reduction only) | The body withdraws: head pulled in, legs tucked, body lowered, with a highlight across the back. The same shell bitten from the front shows nothing, because it reduced nothing. |
| Repel roll succeeds (club tail, horn crest, spine cluster, thorn carapace, armored hide, barbs) | `lastDefenseReceipt.repelled`, organ from the body plan | Club tail: the tail swings with a contact chip at its tip. Horn: the head tosses forward. Spines: quills flare toward the attacker. The attacker recoils off the organ: thrown back, head down, scuff. Its retreat now records `reason:'repelled'`. |
| Player bites wild prey | New `lastPlayerCombatImpact` for prey (`hit`/`kill`/`miss`) | Before this, prey had no impact record. Bitten prey is knocked away from the biter, flinches and shows a bite scuff; the existing hit pose and recoil now apply too. A missed prey sidesteps across the line of attack. |
| Player bites a spined hunter | `lastPlayerCombatImpact.spines` (from `wildTraits(target).spines`) | The hunter's quills flare toward the biter, and the biter flinches back, matching the real health cost spines already applied. An armoured hunter glints instead. |

Simulation changes are presentation evidence only; damage, chances and RNG draws are unchanged:
- `tryKill` writes `lastDefenseReceipt` for player-involved bites (armor/shell split, repel flag, hit/miss). It also notes a player-combat impact on prey, and the organ repel aversion carries `reason`.
- `notePlayerCombatImpact` accepts optional detail, and `playerStrike` passes `spines`/`armored`.

Tests: `tests/encounter-reactions.mjs` cases 6–8 build legal bodies with `makePlan`/`validatePlan`: plain, plated + hardened-mantle, shell, club tail, horn crest, and plate + spine cluster. They run the real `tryKill`/`playerStrike`.

The tests assert:
- Plates reduce real damage.
- A shell turns only rear bites.
- Each repel organ shows itself, and a plain body cannot repel.
- Prey are knocked away when bitten and sidestep when missed.
- A spined hunter both hurts the biter and flares, while a smooth hunter shows neither.
- Sampling consumes no RNG.

A GenVo player body gets plate protection through the `hardened-mantle` adaptation that the plates express. Plates mounted without the adaptation reduce nothing, so they correctly show nothing.

Browser checks used the 800×600 game at 2× zoom, with manually driven `renderer.render()` frames because the pane delivered no animation frames, and on/off comparison in the same frame. All five read clearly when magnified: club-tail repel, front vs. rear shell, prey bite vs. dodge, and spined-hunter bite. The dodge sidestep was widened after review. The capture seed and bodies were staged; outcomes were forced to land or miss by stubbing `rng.chance`, as the tests do.

## Native-resolution inspection (creator-review preparation)

These are 1:1 screen-pixel crops at the default 2× gameplay zoom, with no magnification. Each scenario shows a reactions-off frame, then +50, +150, +300 and +500 ms. All are paused frames driven by `renderer.render()`; real movement was not observed.

| Scenario | Reads at native size? | Notes |
| --- | --- | --- |
| Braced charge (stagger) | Yes | The gap opens and the guard flash is clear at +50–150 ms. |
| Club-tail repel | Partly | The hunter being thrown back reads. The tail swing and contact chip are only a few pixels and don't identify the organ by themselves. |
| Shell, bitten from behind | Weak | The body compacts slightly; the back highlight is barely visible. |
| Prey bitten | Yes | Knockback is visible. The bite scuff is faint. |
| Prey dodges | Weak | The sidestep is a few pixels; easy to miss. |
| Bite a spined hunter | Mostly | The quill speckles show at +50–150 ms. The biter's flinch is subtle. |

The player selection ring, predator tell triangle and lane dashes share the same space and compete with these marks.

Conclusion: knockback-scale reactions are readable at ordinary zoom. Organ-specific detail (shell, tail, horn) and the dodge are not yet reliable signals on their own. This needs tuning or creator art before it can be called established.

## Test status at this checkpoint

- `tests/encounter-reactions.mjs` passes.
- 122 related suites ran (render, combat, encounter, save and ecology suites that touch the changed authorities). 14 fail (a later 133-suite sweep for the plate readout found 4 more failures and 1 more timeout, all unchanged from HEAD; 19 total). Each was compared against an untouched copy of HEAD `d2f676c` and fails there at the same assertion, so they are pre-existing and unchanged:

| Suite | Baseline assertion |
| --- | --- |
| `animation.mjs` | runner legs take the longest strides, sturdy legs the shortest |
| `context-guidance.mjs` | radial keeps the authored non-card UI language |
| `creature-assembly.mjs` | facing 6 frame 3: a part pixel at 46,-4 is detached from the body |
| `decisions-under-pressure.mjs` | Shift+E no longer fights |
| `developmental-hunt.mjs` | young hunters can still attempt and land bites |
| `flank-placement.mjs` | different real organ types receive separate runtime pivots |
| `gameplay-pressure.mjs` | `gameplay-pressure.mjs:35` actual `'attack'`, expected `'hunt'` |
| `knowledge.mjs` | drinking teaches a water place |
| `onboarding.mjs` | `onboarding.mjs:37` actual `'interaction-choice'`, expected `'drink'` |
| `player-presence.mjs` | controlled GenVo8 has a restrained ground locator |
| `public-export.mjs` | `src/render/authored-draft-compiler.js` is tool-only |
| `strategy-encounters.mjs` | strict-equality failure (false !== true) |
| `wildlife-rhythm.mjs` | needlejaw cycles through its complete species-specific ambient vocabulary |
| `discovery.mjs` | `discovery.mjs:45` actual `'interaction-choice'`, expected `'nest'` (found in the wider plate-readout sweep) |
| `evolution-editor.mjs` | No existing habitat supports this conception fixture (wider sweep) |
| `special-creatures.mjs` | `special-creatures.mjs:41` falsy assertion (wider sweep) |
| `species-leadership.mjs` | cross-taxon mate remains available (wider sweep) |
| `wild-evolution.mjs` | **Unresolved:** times out at 240 s on both HEAD and this source (wider sweep) |
| `probe-kills.mjs` | **Unresolved:** times out at 240 s on both HEAD and this source; never observed completing |


**Widest sweep (200 suites, pre-commit check).** It found 23 more failing suites. Each fails at the same assertion on a full HEAD copy; three differ only in stack-trace file paths. Grouped by cause:

- **Old-save refusal fixtures**, "This save predates GenVo's modular creature bodies": `anatomy-readings`, `anatomy-thresholds`, `founder-body`, `habits`, `pressure-vocabulary`, `succession-selection`.
- **Conception fixtures**, "No existing habitat supports this conception fixture": `birth-hydration`, `birth-reserves`, `conception-parental-inheritance`. Also `gestation-inheritance`, which is already listed as inherited debt in `TEST_INVENTORY_AND_POLICY.md`.
- **Interaction-choice expectation**, actual `'interaction-choice'`: `drink-goal`, `freshwater-access`.
- **Ecological-integrity reconcile**, "population must reconcile with actual births and deaths": `autonomous-soil-engineering`, `engineer-colony-natural`, `engineer-natural-regional-observation`.
- **Natural-observation or episode scenarios**: `engineer-breeding-habitat`, `engineer-family-settlement`, `engineer-loss-return` (its child run times out), `family-observer-resume`, `family-recruitment-observer`, `food-commitment`, `lineage-dispersal-resume`, `multi-partner-sexual-selection`.

Totals at this checkpoint: 40 failing suites and 2 timeouts (`probe-kills`, `wild-evolution`), all unchanged from HEAD `d2f676c`. None count as regressions from this work.

### Preliminary classification of the baseline debt (not yet repaired)

These are first-pass judgements from each suite's failing assertion only; they need confirmation suite by suite before any test is changed.

- **Likely outdated test assumptions.** The current game deliberately changed, and the test still expects the old behaviour:
  - Six old-save suites expect migration, but schemas before 9 are now refused by design ("This save predates GenVo's modular creature bodies"): `anatomy-readings`, `anatomy-thresholds`, `founder-body`, `habits`, `pressure-vocabulary`, `succession-selection`.
  - Three suites expect a direct `'drink'`/`'nest'`/`'hunt'` result, but the contextual interaction system now returns `'interaction-choice'`: `drink-goal`, `freshwater-access`, `discovery`. `gameplay-pressure` (`'attack'` vs `'hunt'`) and `decisions-under-pressure` are probably related.
  - Source-text pattern checks against code that was refactored: `animation` (`nearLegs.push(leg)`; its earlier stride contract now passes), `context-guidance`, `public-export`.
- **Likely genuine fixture or authority problems:**
  - Conception fixtures find no habitat: `birth-hydration`, `birth-reserves`, `conception-parental-inheritance`, `evolution-editor`.
  - Ecological integrity, "population must reconcile with actual births and deaths": `autonomous-soil-engineering`, `engineer-colony-natural`, `engineer-natural-regional-observation`. This one is worth investigating first, because it is an accounting invariant.
- **Needs investigation:**
  - Natural-observation scenarios: `engineer-breeding-habitat`, `engineer-family-settlement`, `family-observer-resume`, `family-recruitment-observer`, `lineage-dispersal-resume`, `food-commitment`, `multi-partner-sexual-selection`, `special-creatures`, `species-leadership`, `developmental-hunt`, `knowledge`, `onboarding`, `wildlife-rhythm`, `strategy-encounters`, `gestation-inheritance`.
  - Rendering or presentation contracts: `creature-assembly` (a detached part pixel), `flank-placement`, `player-presence`.
  - Timeouts: `probe-kills`, `wild-evolution`, and `engineer-loss-return`'s child run.

## Pre-commit checks for the plate readout

Three checks were required before committing:

1. **Save/load.** `tests/plate-protection-reading.mjs` case 7 saves three creatures through the structured-clone boundary and restores them: a historical bare-plates creature (not protective), an evolved plated creature (protective) and a plain one. It also saves an old Field Guide observation that has no species. Trait lists and readouts come back identical, and the old observation stays "not recorded". The restored world then runs 240 updates (30 simulated seconds) and no mantle is granted or removed. Restore passes creatures through unchanged; the only migration step fills a *missing* anatomy from existing adaptations.
2. **Lab preview vs. real offspring.** Case 8 runs real births through `Simulation.spawnFundedOffspring`, the same path conception uses (recombined parent plans, inherited anatomy, emergent adaptation, `reconcileTraits`, `applyLineageTarget`). It covers mixed plated × unplated parents, both parents plated, and a historical-mismatch parent. For every newborn, plates are present exactly when the mantle is expressed, and the Lab's `planProtectionInPlay(child.bodyPlan)` matches the newborn's own readout. Observed: mixed parents gave 33 protected / 7 unprotected; both plated gave 40 / 0.
3. **Not hover-only.**
   - Card and dock labels now carry the reason ("Plates don't protect · no Hardened Mantle", "Plates protect · tougher than its species").
   - The Field Guide shows a visible **Plate protection** list with the full explanation for each listed creature.
   - The dock heading swaps the trait slot for the protection label on plated creatures and gives the full reason through `aria-label`.
   - The Lab text was already fully visible.

   Checked in the browser at 800×600.

### Finding for the inherited-biology concern

A parent with plate *shapes* but no armor biology (armor axis 0, i.e. a historical mismatch), paired with an unplated mate, passed plates to 21 of 40 offspring. **Each of those offspring expressed Hardened Mantle.** At birth, `applyLineageTarget` derives the armor axis from the inherited parts. So today the mantle follows the inherited part shape, not an inherited hardness or density value.

The interface reports this truthfully, and ordinary evolution never creates the mismatched parent. But it is the "permission flag" pattern the review warned about. The planned physical volume/density work should replace part-derived expression with inherited protective-tissue properties. That work is not redesigned here.

## Open design issues raised in review

- **Plates without protection (addressed).** A correction to the review's framing: in ordinary play, mounting plates through the evolution editor runs `applyLineageTarget`, which raises the armor axis and expresses Hardened Mantle. Plates and the mantle normally arrive together. A mismatch only occurs for bodies built outside that path: Creature Lab assemblies, staged or test bodies, and possibly older saves. Wild species are also read relative to their founding body.

  `src/lineage/protection-reading.js` now restates the authorities (`adaptationEffects().predatorDamage` for lineages, `partEffectFactors().damageTaken` relative to the founding body for wild species). It is shown in three places:
  - **Creature Lab:** the part card shows the trait's effect and that mounting without the trait still costs upkeep but not the effect. A plan-level "In play:" line reports what the plan gives through the canonical lineage path.
  - **Field Guide:** creature cards show "Plates: protective · Hardened Mantle" / "Plates: not protective" / "Plates: offset" / "Plates: founding body", with the reason on hover. New observations now record species; older ones say protection was not recorded.
  - **Creature context dock:** the heading appends the short label for plated creatures only, with the reason in the tooltip.

  `tests/plate-protection-reading.mjs` checks the readout against the real `tryKill` result: an evolved mantle reduces the bite, bare plates do not and the same bite hurts more, and the wild, Lab-projection and old-observation cases read correctly. The check found that every trait-linked part still changes metabolism when mounted (webbed legs and jaws have their own effects too), so the Lab text says the upkeep applies rather than "gains nothing".
- **Wildlife combat.** Defense receipts are written only for player-involved bites. Visible wildlife encounters should eventually use a bounded, visibility-aware version.

## Not established

- Comprehension by unfamiliar players. That still needs the human ten-minute playtest.
- Final amplitudes. The values are first-pass tuning, judged on a throttled browser pane with a pinned presentation clock rather than at full frame rate.
- Wild-vs-wild defensive reactions. Receipts are written only for player-involved bites, to keep ordinary ecology ticks cheap.
- Whether players connect a glint or a quill flare to the organ that caused it without any explanation. That needs playtesting.
