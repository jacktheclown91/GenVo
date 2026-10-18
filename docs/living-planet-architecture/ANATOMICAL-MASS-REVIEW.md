# Proposed next physiology pass: anatomy-dependent mass and growth

APPROVED by creator 2026-10-18: anatomy-based game-unit pass. Implemented with bounded verification; see anatomical-mass-implementation/REPORT.md. The proposal text below records the pre-implementation review state. The approved head pass did not authorize a new numerical tissue policy. This executable candidate is in anatomical-mass-proposal/model.mjs and candidate.json; no live mass authority has changed. Full A-H and all seven LP criteria remain OPEN. No population-persistence target, larger world, new anatomical route, commit, push or release is included.

## Concrete choice

Implement anatomy-dependent structural load in explicit game mass units now, rather than make every live mass improvement wait for all234 real-world tissue calibration slots. This is an intermediate functional mechanism toward the full physiology; it does not replace tissue construction, true material ownership, thermal/aerial/aquatic physics or the broader goal.

The alternative is to keep current live species-derived mass until reviewed compartment volumes/material quantities are ready. That is more physically detailed at first adoption, but leaves current organ loss and extra appendages unable to change live structural mass during the intervening work. This decision changes gameplay rules and numerical interpretation beyond the head-structure approval, so it is presented for creator review.

## Exact candidate numbers and semantics

Use the79 existing registry mass weights as declared relative structural loads. Their complete table is in candidate.json. They are not kilograms, tissue volumes, densities, edible composition or calibrated physical facts. The simple founder totals5 load units and keeps its existing1.45 game mass: one load unit maps to0.29 game mass. This is one global conversion, not a species-specific multiplier. Integer centiload summation keeps neutral head reparenting exactly invariant to node ordering.

Head-base remains the existing zero-load routing marker; explicit conversion adds no extra tissue in this model. Separate net head/torso tissue allocation remains unfinished. No hidden zero defaults are filled into the234-slot tissue-calibration review.

| Body used in the executable review | Candidate adult structural mass | Candidate growth cost at age10, metabolism gene1 |
| --- | --- | --- |
| Simple founder | 1.450 | 1.7640 |
| Same founder with explicit head | 1.450 | 1.7640 |
| Actual archived storage parent8 | 1.769 | 2.1521 |
| Same parent, diagnostic deletion of only its two sacs | 1.479 | 1.7993 |
| Actual archived reduced offspring1004 | 1.450 | 1.7640 |
| Constructed legal twelve-leg endpoint | 3.248 | 3.9514 |

The isolated two-sac difference is0.290. The actual parent/reduced-child difference also includes independently inherited leg changes; it cannot all be attributed to the sacs. Source organisms and their worlds were only read, not altered or transplanted. Current live adult mass remains1.45 for both until a reviewed policy is installed.

## Proposed implementation

1. One shared versioned mass authority supplies adult structural capacity and the existing paid developmental growth curve. Use the actual body, not species label, to derive capacity under the new policy. Keep age/maturity schedules and existing growth efficiency/energy-per-mass constants in this bounded pass. The same anatomical increment must drive both growth payment and mass gain; no second growth multiplier or free increase from an uncommitted target.
2. Distinguish structural capacity, developmental fraction and remaining edible stock. Preserve the existing shared predation/wound/carrion budget and charge healing/regrowth; never subtract consumed tissue twice or increase carcass yield without its construction being paid. This remains the existing game-mass/food model, not complete elemental conservation or organ-specific damage.
3. Connect actual mass consumers coherently: manual/background travel, juvenile growth, prey rewards and remaining stocks, shared basal resource demand, movement/death environmental traces and carcass pathogen quantities. Every direct species-mass read must be classified as legacy-only, an initial configuration reference or migrated to the new authority. Renderer shape metadata is not a second physical mass authority.
4. Shared basal candidate rates use the current simple founder as reference: energy0.052 per1.45 game mass per metabolism step, water0.044 per1.45, retaining inherited metabolism and existing thermal/action modifiers. Both player and wildlife use those same rules. Explicitly review this species-independent interpretation; it may change outcomes, which are not acceptance targets.
5. New ordinary worlds use the approved new policy. Historical saves lacking a mass version retain their exact legacy authority, including their future offspring, current stocks, pregnancies and completed ancestry. Do not infer a mass migration or refill reserves. A later explicit historical conversion remains separately reviewable. Unknown policies and unsupported bodies fail visibly rather than fabricating a fallback organism or a biological death.
6. Freeze the policy and actual body determinants at conception, preserve exact save/Continue, and keep computation capacity separate from biological selection. No mutation boost, pressure-directed useful variation or body endpoint is introduced by this physiology pass.

## Bounded acceptance

Verify the founder/head invariant, equal-body/equal-cost across control and species labels, the isolated sac-loss decrement, extra-limb growth/load costs, paid growth, wounded/dead body accounting, and old/new save behavior. Demonstrate actual action/resource consequences in the runtime. Use targeted development/reproduction fixtures with disclosed starting bodies, not a long survival or population-floor trial. Run focused checks and one fast gate at the boundary. Keep remaining tissue/material, geometry, muscle power, support, thermal/flight and marine work explicit; this pass does not close F or the full goal.
