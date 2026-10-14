# Shared finite demand, active families and legitimate mating opportunities

## Substantive gameplay changes

`src/ecology/dietary-demand.js` replaces the old same-label/full-demand versus other-label/discounted-demand split. Every nearby consumer contributes its actual accessible overlap with the focal creature's finite food pool. Mounted feeding anatomy, current plant tissue/handling affordability, aquatic access and finite remaining live-prey tissue are canonical. Same-label divergent diets no longer automatically compete identically; differently named identical diets compete equally. `local` is now an all-label shared-habitat headcount; `competitors` is weighted consumer demand and the existing crowding ratio uses one resident plus that demand.

`src/ecology/carrying.js` caches bounded sample coordinates, not food amounts or individual affordability. Actual harvesting, new stocks, energy depletion and topology changes affect support immediately. Existing density radii/soft caps, reproductive forage/prey thresholds, physiology/reserve gates, approved aquatic adult-prey normalization and recovery multipliers are retained. This is shared consumer-equivalent overlap, not a wholesale maintenance-energy or water-capacity recalibration. Catalog defaults and broader resource/physiological authorities remain to be reviewed.

`src/ecology/dispersal.js` reuses exact canonical tissue-derived meal recipes in a bounded 8,192-entry transient WeakMap cache, invalidated by exact tissue/genotype/bite changes. Individual handling affordability is evaluated every time. Harvest receipts and crop yield share the same calculation; no alternate feeding implementation exists. The cache is outside saved controller state.

`src/family/family.js` exposes active membership through actual care, partner bonds and nearby genealogy, separately from whole-lineage history and ecological competition. Dependent offspring keep their actual co-parents; grown relatives may disperse out of active membership while retaining ancestry. Existing caregiver practices are recorded at birth so a genuine hybrid does not lose care merely because its founding label has no care catalog entry. This is a caregiving relationship record, not new genetic care loci or a body-build requirement. Existing lineage-only behavioral activation remains; wild care eligibility is not universally expanded.

`src/cognition/social.js` allows actual relatives, caregivers and partners to associate across labels/builds and respects the actual join radius rather than every actor in intersecting spatial buckets. It preserves authored social profiles and existing local social group preferences; these temporary group sizes are not universal family caps. No family-size cap was introduced.

`src/gameplay/family-illness.js` uses the active care group rather than all lineage descendants, accepts actual hybrid family members, and uses their own maturity. `src/persistence/save-manager.js` reconstructs derived membership after load rather than persisting stale actor references. `src/ui/inspector.js` distinguishes active family from lineage guidance in the optional population window; `styles.css` keeps routine save feedback off that header.

`src/sim/simulation.js` checks real search distance/reach before expensive mate/support evaluation. Inherited reproductive compatibility, reciprocal preferences, existing first-cousin/close/direct restrictions, the pre-existing critical sibling policy and conception probabilities are unchanged. No rescue actors, fertility guarantee or new emergency multiplier was added.

## Founding audit

The actual native initial world contains 196 unrelated founders, one player-lineage founder and zero children. The current active family contains only that player. Initial generation does not fabricate one enormous genealogical family. The previous advanced card labeled FAMILY summarized lineage adults/range, which could mislead players. The corrected card identifies lineage guidance separately.

Founders still use configured cohort counts and suitable habitat centers. Fully resource-scaled founding counts, broader independent wild family behavior and population-default calibration remain future work; this pass does not claim the proposed founding model is complete.

## Evidence and limits

`shared-demand-family-tests.json`: 31 passing integrated checks, two open broad family-learning/practice failures independently reproduced in exact prior delivered source. The existing illness fixture's generic Interact assumption also failed in prior source; it now explicitly selects the existing illness-care action without bypassing its validators. The connectivity fixture retains all original barrier/swimming checks; its all-label habitat headcount correctly includes the differently named reachable neighbor. No biological assertions were removed.

New controlled checks cover same-label different diets, differently named identical diets, depleted stocks, aquatic-only overlap, inaccessible consumers, separate unrelated families, hybrid child care, maturation/dispersal, genealogy saves and small compatible second-cousin branches. Existing first-cousin restrictions remain. A deliberately genetically incompatible isolated pair has no search target or guaranteed rescue; checks consume no search RNG or reserves and create no animals.

`live-carrying-browser-proof.json`: actual prior/current native 800x600 worlds and screenshots; separate controlled canonical aquatic harvesting drains 0.5 biomass to zero. Prior carrying still reports four energy units after depletion; current carrying reports zero without manual invalidation. Original setup, same-day/RNG and native errors are recorded. Short synchronous full-lifecycle browser timing remains roughly 1.8-2.0 times prior total update cost with a higher p95; optimization reduced the initial implementation substantially, but this is a real remaining performance limitation, not large-ecosystem acceptance.

`shared-demand-natural-lifecycle.json`: 4,800 ordinary full updates / 600 simulation seconds / 100 days without actor, body, genotype, stock, terrain or player fixtures. It observed 91 births and six deaths (four predation, two starvation), ending with 281 living animals and exact botanical endpoint save parity. No extinction or botanical cross-fertilization occurred in this run. Prior unstaged crosses remain documented elsewhere. This proves observed natural birth/death and save behavior, not adaptive balance, extinction coverage, full generation handoff or human ten-minute engagement.

Real native screenshots were inspected. The optional panel now communicates one active member versus the wider population. No creator artistic approval or unfamiliar-player success is claimed. A request for an unfamiliar person's ten-minute playtest is pending.

Next: resolve the two historical learning/practice failures, reduce live-demand update spikes, then design resource-based founding populations without inventing stock or silently changing reproductive calibration. The full seven-priority goal remains active; vegetation/encounter art, adaptive ecology and height/support design are still unfinished.
