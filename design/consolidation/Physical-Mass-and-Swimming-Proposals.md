## Creator direction accepted - 2026-10-14

The creator selected **B: explicit per-part tissue volume and material density**, overriding the earlier temporary relative-weight recommendation. Structural implementation and tests are authorized; numerical coefficients require review before gameplay adoption. One authoritative mass gateway, sprite-independent volumes, net tissue ownership, inherited anatomy and developmental scaling must be preserved. No arbitrary heavier-body speed penalties.

The creator selected **two functional mounted webbed propulsors for current legged bodies**, with explicit bodyless legacy fallback. This is not a permanent universal swimming rule: future implemented fin, tail and legless propulsion can qualify through their own functional anatomy. Gills alone provide respiration, not propulsion. Existing affected swimmers must be identified before access changes; migration remains a separate review decision.

Current implementation and evidence: `docs/GenVo-Tissue-Foundation-Review.md`. The historical comparison below remains a proposal receipt; its numerical examples are not approved coefficients.

# Physical mass and swimming: creator review proposals

Status: proposals only. No numeric balance, mass, swimming, reproductive-organ, or mutation-cost changes were applied. The accepted consolidation review authorizes preparing these comparisons, not implementing their numbers.

## Physical mass

Current authority is `SPECIES.mass * development.growth^3`. Complete neutral GenVo adults still have mass 1.45 regardless of mounted torso/armor. Travel expenditure and prey-size eligibility consume that authority. Registry `PARTS.mass` is a declared relative weight, not yet calibrated physical tissue mass; screen pixels are not volume.

| Complete body (four walking legs, mouth, eyes) | Declared mounted weight | Current adult mass | Illustrative universal normalization |
| --- | ---: | ---: | ---: |
| Small torso | 5.0 | 1.45 | 1.45 |
| Light torso | 4.6 | 1.45 | 1.334 |
| Reinforced torso | 7.0 | 1.45 | 2.03 |
| Barrel / dome / long torso | 8.0 | 1.45 | 2.32 |

These illustrations use one reference: 1.45 / founder declared weight 5. They are NOT approved target masses. All illustrated bodies pass actual mount validation. No species-specific normalization is proposed for the future physical model.

A. Relative mounted-tissue model: sum declared mounted weights, convert through one universal reference, apply the existing developmental volume law. Cheap and measurable, but declared weights must be reviewed before they become physical authority. It cannot describe buoyancy without additional volume data. Existing travel energy and prey-ratio consequences must be tested without adding blanket speed penalties.

B. Tissue volume/density model: explicitly author physical volume and material density per registered part, derive mass as sum(volume * density), and use one agreed body-gene/development scaling law across mass, occupied volume and visible growth. Soft tissue, shell and stored resources can then have meaningful differences. More authoring work, but provides a defensible foundation for buoyancy and strength.

Recommendation: review A as a bounded first physical-mass slice, with B as the eventual physical contract. Do not silently interpret two-dimensional artwork dimensions as biological volumes. Do not double-count shared torso/head tissue. Zero-weight head-base is currently a structural mount; its eventual tissue accounting needs an explicit decision.

A coherent later locomotion contract would derive force from actual muscle/limb capacity and acceleration from force/mass; steady speed also depends on gait, support and drag. Buoyant force requires displaced volume and fluid density; net weight alone does not grant swimming or gill respiration. The current game applies movement speed immediately and has no acceleration/volume authority, so adopting mass alone must not claim to implement this full model. Keep processing costs, resting upkeep, reserve capacity, strength and movement expenditure separate. Better anatomy may be broadly beneficial without an invented equalizing penalty.

Required before adoption: old and new complete-body movement costs, juvenile growth, prey eligibility, knockback/strength callers, dry/wet traversal, finite resource survival, save migration, and normal reproductive opportunities. Existing mounted IDs, genealogies and reproductive loci survive. Legacy bodyless records need an explicit fallback; label metadata cannot become physical authority for designed bodies. Founder-to-evolved world outcomes must be observed, not forced.

## Swimming

Actual native complete-body trials, each 120 control steps (1.875 seconds), include the normal lineage-expression bridge:

| Anatomy | canSwim | swimsByBody | Real water distance | Travel energy |
| --- | --- | --- | ---: | ---: |
| One webbed leg + three walking legs | true | false | 2.6606 | 0.068516 |
| Two webbed legs + two walking legs | true | true | 2.8469 | 0.068914 |

The first row crosses because one mounted legacy-linked webbed leg raises waterBody and expresses Webbed Limbs. The aquatic body authority still requires two for its movement benefit. This is a real policy conflict, not just a tooltip mismatch.

A. One webbed propulsor is enough: change the body threshold to one and route crossing and aquatic movement through that single rule. Preserves current one-leg crossing, but broadens aquatic movement benefits and requires explicit functional approval.

B. Two mounted webbed propulsors are required for designed bodies: make the actual anatomy predicate authoritative for crossing and movement. Adaptation flags would remain a migration fallback only for bodyless legacy organisms. This matches the existing aquatic-body rule, but removes crossing from one-webbed-leg organisms which currently have it.

Recommendation: B for present legged anatomy, after reviewing affected saved individuals and natural founder/mutant populations. Paddle tails improve propulsion but should not independently grant support, respiration or buoyancy under the current contract. Gill slits alter respiratory habitat physiology, not foot support. Future limbless aquatic propulsion needs its own reviewed functional anatomy contract, not a species label or generic aquatic-lifestyle bypass.

Migration is a creator decision: no automatic limb additions, hidden permanent swim gifts, or silent record deletions. Count affected one-leg saved organisms before choosing immediate anatomy enforcement versus an explicitly versioned transition. Preserve gene/body records and explain changed reach in the existing authoritative action validator. Confirm radial, dock, E, family routes, feeding and AI all use the same predicate.

No threshold in either proposal was applied. Existing animal and botanical reproductive compatibility remains untouched.
