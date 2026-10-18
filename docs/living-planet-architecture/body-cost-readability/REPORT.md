# Body costs in the player experience

October18 continuation. The previous goal turn made authoritative progress: approved anatomical mass was implemented and verified. This turn connects that existing physiology to player decisions; it introduces no anatomical route, mutation policy, physical coefficient or world expansion.

## Implemented

The family journal now reads current/adult mass and the next paid-growth cost from the same bodyMass/growth authorities used by Simulation. It explains whether current reserves can pay while retaining the existing growth reserve floor. A reserve change refreshes this reading within the same tick/day. Only available living animal state is read; missing or dead historical tissue is not reconstructed. Relative units and legacy-world rules are identified plainly.

The editor's preview previously omitted massPolicy and compared only adaptation modifiers. It therefore hid anatomical load while showing water savings. It now preserves the parent's actual policy and species, reads shared adult mass, and includes relative load in its food/water upkeep comparison. The preview remains at shared adult scale and does not commit a design or create tissue. Action, climate and offspring inheritance can still modify realized costs. Old worlds retain their original mass interpretation.

For the disclosed two-sac fixture, current body mass increases20%, food upkeep increases21.44% (display21%, including the existing sac upkeep modifier), and water need becomes86.4% of the parent's (display14% less, including the existing water saving). The added load no longer disappears from the comparison. These statements are compared against actual phaseMetabolism spending, not just another UI formula.

## Evidence

- tests/body-cost-readability.mjs checks old/new policy previews against actual mass/basal spending, growth-payment affordability just below/at/above the existing reserve floor, journal authority, pure reads and unavailable dead records.
- runtime-final/results.json records fresh-browser ordinary New World plus explicitly staged UI conditions. A juvenile fixture changes from funded to waiting without tick/day movement. The uncommitted two-sac editor fixture displays the actual load/upkeep tradeoff. The journal and editor gameplay frames were inspected, including editor-upkeep-costs.png with the full comparison scrolled into view. No browser errors.
- The first browser attempt raced the asynchronous world-start save and failed the same-tick guard. It is retained under runtime/failure.json. The corrected harness waits for the chosen seed, closed menu, completed scene and world-start save before pausing. No product validation was weakened.
- The single known-seed background experiment uses two disclosed simple adult founders in existing supported habitat and ordinary consent/compatibility/full gestation. It produced actual newborns3,4,5 on day17 under anatomical mass. None swims; no qualifying novelty or accessibility success is claimed, and the result was not rerolled. The separate initial manual-player attempt lacked a selected encounter and correctly stopped with encounter-ended. Its checkpoint is retained, not counted as a refusal, successful mating or birth.
- actual-newborn-readings.json reads the actual background newborn archive without changing complete saved state. Their actual current mass is0.24124375, adult capacity1.45, and growth cost is about1.17-1.24 depending on inherited metabolism. Their reserves correctly report waiting under the existing floor. Twelve normal updates after two independent restores match exactly. No genealogy was fabricated to put these non-player organisms in a family journal.

The final fast receipt is docs/test-runs/body-cost-readability-2026-10-18.json:407 pass,5 known failures,0 new failures/timeouts/stale entries,12 deferred of424 in136s. Start/end fingerprint928cd175ac0e59ec98e59c3665602d548bf89d496defa2f8338605326b053c92 matches without drift. The unchanged500ms observer budget passed at412ms. Known failures remain ai-disclosure, canonical-source, evolution-contract, player-copy-style and provenance.

## Remaining objective

All A-H scope and LP-1 through LP-7 remain open. This is observable access to the existing mass/growth mechanism, not complete material or embryonic construction, muscle/support/power, thermal/flight/marine physics, generalized viable evolutionary routes, larger worlds or a completed player life cycle. Major100-day integrated trials remain deferred; population declines after day100 are not acceptance failures. The October30 feature freeze stays visible. No commit, push or release occurred.
