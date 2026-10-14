## Finite nesting / egg predation contract (12 October 2026)

`tests/egg-nest-predation.mjs` exercises real plant-funded nests, parental energy debit, one care action per day, `brood-pouch` protection, nest persistence, wild-hunter AI egg targeting, egg consumption, and exposed nests when materials are insufficient. `tests/reproductive-anatomy-eggs.mjs` intentionally tests an egg clutch **without nesting materials**, so the legacy funded incubation and hatching path remains independently covered. `birth-hydration.mjs` is pre-existing test debt (same initial mating failure in untouched prior source). Do not require a particular egg-survival fraction or predator success across seeds.

## Reproductive anatomy correctness gate — 12 October 2026

`tests/reproductive-anatomy-eggs.mjs` is a focused mechanical contract: mode from anatomical parts, funded eggs, incubation/hatch, stable frozen inheritance, parent death, finite investment, and save migration. Do **not** convert seed-specific hatch counts, extinction rates, or population totals into universal success criteria. `tools/canonical-source-audit.mjs` verifies all procedural parts are covered.

# Test inventory and intended meaning

The previous research program contains deterministic *scenario* tests. Do not treat their fixed outcomes as universal requirements for all procedurally generated worlds.

| Examples | Class | Acceptance meaning |
| --- | --- | --- |
| `canonical-source.mjs`, `public-export.mjs`, `emergent-contracts.mjs`, `evolution-contract.mjs`, `creature-assembly.mjs` | **core invariant** | Pass on every source change relevant to the mechanism |
| `heritable-mate-choice.mjs`, `multi-partner-sexual-selection.mjs`, `courtship-performance.mjs`, `evolving-courtship-rituals.mjs` | **core reproductive selection** | Reciprocal inherited choice, different phenotypes favored by opposing taste profiles, distance tradeoffs, saved decisions, player alternatives, honest refusal, no shared RNG drift; does not require successful mating in every world |
| `physical-breeding.mjs`, `evolution-editor.mjs`, `founder-body.mjs` | **physical inheritance** | Matching physical plans unlock editor regardless of ritual or species-branch label; mismatched plans produce valid, parent-sourced anatomical mixtures; save/load and deterministic RNG remain valid; no forced convergence within a set number of generations |
| `source-rgba-part-art.mjs`, `indexed-part-art.mjs`, `editor-pass.mjs`, `save-manager.mjs` | **mechanism/authoring** | Approved structures and source fidelity; artist drafts not automatically game content |
| `autonomous-soil-engineering.mjs`, `engineer-natural-regional-observation.mjs`, `engineer-natural-colony-observation.mjs` | **legacy seeded scenario/research** | Historical seeds and hypotheses; not a requirement for identical outcomes in new seeds |
| `ecology-validation.mjs`, `tools/ecological-integrity.mjs` | **integrity/performance review** | Finite accounting, coherent records, traceable causes, responsiveness; no guaranteed survival outcomes |
| Real Chromium preview and manual playtest | **experience/release** | Actually runs/renders, interactions are readable, saves/restores, major game loops are compelling |

For any historical test that asserts a minimum number of digs, mates, births, or regional reoccupations, preserve the fixture and historical behavior as a *scenario regression*, document its seed, and do not generalize it to every world. Do not weaken anatomy gates, resources, or the save contract to improve that test's statistics.

Future long-run diversity studies should report distributions instead of imposing required percentages. Suggested observables: lineage persistence/extinction, trophic niches, trait spread, reproductive isolation, environment modification, regional populations, succession, and player decision footprints. Include empty-world outcomes and explain any technically induced death spiral before calling it evolutionary emergence.

**Inherited test debt:** Some older controlled-birth tests (`extended-kinship.mjs`, `gestation-inheritance.mjs`, `conception-parental-inheritance.mjs`, `birth-hydration.mjs`) fail identically in the untouched canonical baseline and the new development source. Treat them as existing defects or stale fixtures pending separate repair; do not mislabel them as newly passing or relax their expected biological contracts.

**Costed displays / rival competition:** Test that display energy is deducted exactly once; a display takes real simulated time; interruption prevents free reproduction; rival order can reverse under different inherited mate preferences; other mating gates and RNG stream remain authoritative; the saved display state survives restoration. Neither every seed producing a favored suitor nor long-term population viability is an acceptance requirement.

**Evolving rituals:** Part action capabilities and real body plans grant moves; no generic phantom flare/call. Personal and observed successful sequences can become learned but remain optional, compete with exploration, and require matching anatomy. Soft acceptance is independently variable and can yield both success and refusal without guaranteeing either; higher preference matters more under competition but cannot override hard biological restrictions. Test manual move queue, energy, pending performance save continuity and seeded reproducibility. Do **not** preserve older fixed-preference or winner-veto assertions where creator direction supersedes them; document the explicit change instead of faking tests.

**Selective breeding:** `selective-breeding-guidance.mjs` verifies read-only canonical physical match/difference, birth-time maternal/paternal/shared/other origins, later parental changes, old-save unknowns, save/restore and unchanged RNG. Do not require every seed to converge or invent a legal partner from a physical-match count.

## Dual reproductive-anatomy contract (2026-10-12)

`tests/dual-reproductive-anatomy.mjs` asserts physically valid, anatomically distinct live/egg/dual expression, actual paid dual switching costs outside offspring reserves, conception-frozen pathways, persistent chosen strategy, real laid eggs and born young via the unchanged authorities, and legacy save compatibility. A failing natural-world extinction or mating target is **not** automatically a regression. Existing inherited test failures remain explicit.
