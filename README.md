# GenVo

GenVo is a Living Planet survival game and open-ended evolutionary possibility engine. Players guide real lineages through habitat, behavior, reproduction and inherited development. Biological rules permit specialization, simplification, biodiversity, collapse and extinction.

## Start here

- [Current design](design/CURRENT-DESIGN.md): governing intent and constraints.
- [Current implementation](docs/CURRENT-IMPLEMENTATION.md): integrated source, evidence and unfinished work.
- [Implementation authorities](design/governance/implementation-authorities.json): ownership of shared mechanisms.
- [Natural caves](docs/NATURAL-CAVES-2026-10-20.md): connected shallow geology, shared entrances, conserved runoff erosion and remaining underground work.
- [Scenario checkpoints](docs/SCENARIO-CHECKPOINTS.md): immutable advanced-world testing fixtures, exports and playable save forks.
- [Cleanup manifest](docs/REPOSITORY-CLEANUP.md): integration provenance, retained evidence and archive policy.

The canonical development source is this existing local project, on `main`, with runtime code in `src/` and artwork/audio in `assets/`. GitHub `main` contains the consolidated history. Preserved feature and diagnostic branches are provenance, not competing active sources. Check Git before starting new work. The [full-game completion matrix](docs/FULL-GAME-COMPLETION-MATRIX.md) tracks current gaps and implementation priorities.

## Run

From the repository root:

```sh
python -m http.server 8000
```

Open http://localhost:8000/ . **New World > Starting point** can fork an existing saved ecosystem, import a recorded scenario, or start the bundled genuine established and mature valleys without rerunning their earlier history. Public web exports include the catalog and its integrity-checked checkpoint files. The optional Creature Lab is at http://localhost:8000/tools/creature-lab/index.html . Follow displayed contextual controls: E interacts, Q cycles choices, Shift+E drinks, Space attacks and J braces.

**Starting creature** independently keeps the recorded lineage, selects a living resident, or opens guided/sandbox founder design. Custom founders enter as an explicitly recorded new pair; their anatomy is not presented as naturally evolved in that world. The shared editor supports local body-design export/import. See [custom-founder evidence and limits](docs/AUTHORED-FOUNDERS-2026-10-20.md).

In newly generated worlds, paired gliding membranes can launch down real slopes or from a living canopy. Use the **Glide** button (0), steer while descending, and watch the remaining height beside **Fold**. Folding high above the ground causes injury. Two climbing legs enable **Climb** (7) at a mature supporting tree. Historical saves retain their recorded movement rules. See [gliding evidence and limits](docs/GLIDING-2026-10-20.md).

Two spring legs enable **Jump** (Enter) in newly generated worlds. Launch follows your facing and commits to an arc; food, breath, body load, terrain and landing recovery matter. Modern pounces use the same arc and bite after landing. See [jumping evidence and limits](docs/JUMPING-2026-10-20.md).

Two webbed legs enable **Dive / Surface** in water. Page Down selects a deeper target; Page Up surfaces. Held air is finite, gills support underwater respiration, and underwater food requires actual depth. Depth, air and geometry persist across saves. Historical worlds can explicitly adopt these rules in a backed-up continuation. See [diving evidence and limits](docs/DIVING-2026-10-20.md).

Climb/Descend (7) now moves gradually along a supporting living tree in new worlds. Food energy, body load, grips and the tree's remaining stock matter; mid-climb saves continue exactly. Historical worlds retain instant climbing unless explicitly adopted into a backed-up continuation. Natural canopy accessibility remains unproven; see [climbing evidence and limits](docs/CLIMBING-2026-10-20.md).

Two digging forelimbs enable **Burrow** on suitable dry ground in new worlds. Excavation pays food energy and moves real soil into surface mounds. Underground movement can extend connected passages; return to an entrance to exit. Passages and work persist across saves and regional visits. Natural caves and deeper underground ecology remain unfinished; see [burrowing evidence and limits](docs/BURROWING-2026-10-20.md).

For a saved, imported or bundled evolved world, **New World > Movement in this continuation > Enable new movement · save original backup** enables these rules in a separate continuation. The untouched checkpoint and the continuation commit together before play begins. **Worlds > New World from backup** recovers a playable copy with its original rules and recorded lineage. Ordinary Continue never opts a historical world in. See [movement adoption and recovery](docs/MOVEMENT-ADOPTION-2026-10-20.md).

## Verify

Node.js and Python are required for the development tools. Browser checks also require Playwright/Chromium.

```sh
node tools/export_sprite_sheets.cjs
node tools/canonical-source-audit.mjs
node tests/save-persistence.mjs
node tests/public-export.mjs
node tools/run-tests.mjs --json docs/test-runs/current-fast.json
python tools/source_package_inventory.py
```

The sprite exporter regenerates the ignored presentation-reference sheets required by the canonical audit; these are not runtime assets.

The fast runner reports deferred long suites and known failures separately. A passing automated gate does not establish human playability or creator visual approval. Run targeted checks while mechanisms are being built; reserve major integrated 100-day trials for the milestone.

## Repository boundaries

`tests/` and `tools/` contain functioning checks and authoring tools. `Original (human) arts/` preserves original artwork. Historical `reports/*-before/` source remains because comparison tests and capture tools import it. Never treat those fixtures as live implementation alternatives.

Local builds, snapshots and raw diagnostics are ignored. Source packages use the same Git inclusion boundary, with additional generated-file exclusions. Browser export follows actual runtime dependencies.

## Historical material

[Historical index](docs/history/README.md) and [the former README](docs/history/README-checkpoints-through-2026-10-18.md) retain earlier claims and decisions. Historical proposals, branch-local plans and their outstanding-work statements describe their original checkpoint; they do not override current design or source. A development checkpoint is not a stable release.
