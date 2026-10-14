# GenVo tissue foundation and swimming migration review

Creator direction: October 14, 2026 reply approves the volume/density structural direction and present two-webbed-propulsor anatomical direction. Numerical calibration and a concrete legacy-access migration still require review. This pass does not activate either gameplay change.

## Source implementation

- `src/organisms/tissue-structure.js`: explicit catalog of all 79 existing parts, independent adult net-volume slots for muscle, support, organ and covering where applicable. Each part has independent calibration keys. Materials are named separately with SI densities; no default numbers, sprite dimensions, registry weights or founding labels supply tissue values. Support material is configurable rather than assuming every organism has bones. These are draft ownership partitions, not claims of fully calibrated biological tissue composition.
- `src/organisms/body-mass.js`: exposes structural assessment at the existing mass module boundary. Existing live mass and its callers remain unchanged until adoption review; the draft cannot install itself as a second gameplay mass authority.
- `src/lineage/swimming-review.js`: read-only mounted-body/bodyless eligibility and migration-impact audit, including invalid bodies and animals currently in water. Tails/fins/gills do not acquire unimplemented propulsion capabilities. Existing traversal, validators, movement and saves are unchanged.

Every mounted structure owns only its net tissue, excluding children and contents. The legacy rendered implicit head is counted once; mounting the equivalent explicit head never adds a second head. A deliberately torso-faced headless body has no implicit head. Host torso/head calibration must exclude separately mounted organs. This accounting rule prevents bookkeeping duplication; actual authored volume estimates will still need review for physical correctness. Reserve-meter contents, embryos, cargo and retained water are explicitly excluded pending conserved-volume contracts. Body-gene scaling is not invented; existing developmental growth cubed is supported and tested. Volume is not yet displaced-fluid volume; buoyancy, force and acceleration are not implemented.

Calibration fails visibly for missing slots, unknown materials, wrong units, negative volume, nonpositive/nonfinite density, invalid anatomy, invalid growth and overflow. Artificial test volumes/densities exist only inside tests and are not proposed balance values.

## Verification

Passed: tissue structure; swimming review; aquatic; prey biomass; save persistence; save storage. The conservation suite exposed a pre-existing failure on unchanged Git HEAD `8b1b2bf`: a grazing combat fixture expected flesh consumption. The fixture now mounts a real tearing jaw; all original assertions remain. Added grazing-kill coverage confirms zero flesh consumption and full remaining carcass deposition. No simulation behavior was changed to accommodate the test. Baseline failure receipt: `tissue-prey-baseline-failure.txt`.

Three ordinary initialized worlds contain 196 living animals each: 588 total, no invalid or bodyless bodies, no proposed access changes and no immediate stranding. These are founding samples, not evolved-population or personal-save coverage. Controlled valid mounted bodies with zero/one webbed legs and legacy webbing lose proposed access; two/four keep it. Bodyless fallback and invalid-body rejection are distinct.

Real headless Chromium at 800x600 ran an untouched new world for five seconds (39 simulation ticks, 196 living, zero births/deaths). Native part art was ready, no browser errors, and actual snapshot restoration preserved anatomy, genes, parent IDs, current mass and swimming eligibility exactly. Read-only assessments preserved records. Screenshot inspected: `tissue-foundation-runtime-800.png`. This verifies startup/runtime/save compatibility, not calibrated physics, natural reproduction, human comprehension or visual approval. The screenshot is the unchanged game presentation.

## Remaining adoption decisions

1. Author a reviewable calibration with per-part adult net volumes and material densities, including explicit host-organ exclusions and body-gene scaling. Compare juvenile/adult mass, movement expenditure, prey eligibility and finite-resource survival before activating it. Current label-based mass remains a known unresolved foundation issue.
2. Inventory actual supplied legacy saves and evolved populations. No personal IndexedDB save inventory was accessed. New worlds can adopt the two-propulsor authority only with the implementation/migration approval; old mounted genomes must never receive fabricated limbs.
3. Review a migration contract. Candidate A: explicit load-time adoption with a visible affected-body report and warning for organisms already in water. Candidate B: a visibly versioned legacy-world policy, preserved on save/load until the creator/player elects migration; new worlds use the anatomy rule. Neither has been applied. Shore escape, queued targets and unreachable care routes need focused trials before selecting a strategy.

Next meaningful milestone: reviewed physical calibration and shared swimming-authority adoption with explicit legacy migration, followed by real whole-body traversal/energy/prey/save comparisons. Broader creature presentation and first-ten-minute goals remain active. No new web ZIP was produced: live gameplay coefficients/access/presentation did not change, and the creator explicitly requested avoiding repeated essentially unchanged builds.
