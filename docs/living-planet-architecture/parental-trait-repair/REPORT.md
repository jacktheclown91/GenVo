# Neutral parental population traits and family forms

October 17, 2026. Continues the creator-approved neutral-inheritance repair. The full repair remains incomplete until anatomy projection and migration explanations are finished.

## Active biology

Population traits no longer originate from a pressure differential or gain/lose inherited strength because local pressure supports them. Family forms no longer originate from learned family behavior or gain strength with generation number. Both authorities choose uniformly among present parental determinants when more than one parent contributes, retaining the chosen determinant's strength and source provenance. With no determinant there is no inherited proto-trait/form. A single contributing parent retains its determinant; this is the bounded existing-trait policy approved for this repair, not a complete genetics model or proof of new organ origin.

The same birth registration calls these physiological authorities for player and background offspring. Frozen conception-time snapshots govern inheritance, including after live parents change or die; live parent IDs still govern care and genealogy. Location may update observed population membership, but cannot select or strengthen the inherited determinant. Candidate inspection is read-only; actual parental choice consumes the shared deterministic RNG only at birth. Existing trait mechanics and phenotype consumers remain; inherited physiology does not itself declare a new species. Family notifications remain limited to the known lineage as a presentation choice, not a biological rule.

An additional audit found the family-form path using learned behavior as a germline instruction. Removing it follows the same approved neutral inheritance principle; no new anatomical route was added. These legacy functions lack new developmental origin routes until those routes are reviewed/implemented. This is an explicit remaining mechanism gap, not permanent reduction of E-G scope.

## Versioned continuity and save defect

Birth rules now identify populationTraits and familyForms as neutral-parental/1, inheritedVariation as neutral-core/1, and anatomyProjection as legacy-axis/1. Earlier unversioned and neutral-core-only saves migrate future births with a deterministic receipt. Existing organisms, trait strength, ancestry, history and RNG are retained. Unknown rules reject. New-policy save continuation is exact; historical useful-directed future births are intentionally different.

A strict roundtrip assertion exposed serialization of Simulation._player, an incidental lookup cache. Snapshot metadata can create that cache after the core iteration, causing snapshot shape differences and carrying a redundant actor pointer. New snapshots omit the cache; restore discards any old cache and rebuilds it from canonical playerId/animals. The assertion was retained and now passes. This cache removal does not remove the player organism or alter biological state.

## Verification and corrected expectations

Fifteen focused suites pass: neutral-parental-traits, neutral-birth-core, proto-speciation, proto-gene-flow, lineage-divergence, save-persistence, reproductive-anatomy-eggs, conception-parental-inheritance, gestation-inheritance, speciation-threshold, tendency-forage-learning, behavioral-specialization, processing-capacity, frame-stepper and world-pages. Validation categorization and whitespace checks also pass.

The new regression compares actual funded newborn genes, anatomy, body and final RNG across pressure/location contexts, generation1/8 and player-lineage=false/true. It verifies that frozen parental traits survive live-parent changes/death and save/load, exact12-update resume, read-only candidate inspection, unchanged existing organisms/RNG in partial-policy migration, and idempotent migration.

The unchanged proto-speciation, proto-gene-flow and lineage-divergence tests initially failed because they explicitly expected pressure-created traits, pressure-reinforced/weakening inheritance or behavior-created forms. Their full pre-contract sources and failure summaries are retained in this folder. The creator-approved contract supersedes those expectations; none was hidden as a skip or assigned a larger ceiling. Revised suites use explicit legacy parental determinant fixtures, not claims of evolutionary origin. They retain actual effects/visual phenotype, genealogy record, species non-creation, origin-preserving migration, shelter protection and food-deposit checks. New assertions reject need-based creation/strengthening, verify both parental sources are reachable without stacking effects, preserve inherited strength through migration and allow inherited determinants before generation4.

The prior391-pass full fast receipt predates this repair; only the listed focused checks certify the changed code. No new mature-world or integrated100-day trial was run. No new runtime screenshot acceptance is claimed for this slice; phenotype comparisons are mechanism evidence.

## Remaining approved scope

Webbing/storage axis coupling and legacy adaptation-to-part reconciliation remain next. Existing physiological traits and organs must not be stripped; new offspring cannot receive unrelated storage organs merely through a webbing axis. Full tissue/material/maintenance accounting, anatomical simplification and the broader route catalog remain open. Current-size opt-in planetary geography is also approved but unimplemented. The world remains128 x128. No map expansion, commit, push or release occurred.
