# GenVo

GenVo is a Living Planet survival game and open-ended evolutionary possibility engine. Players guide real lineages through habitat, behavior, reproduction and inherited development. Biological rules permit specialization, simplification, biodiversity, collapse and extinction.

## Start here

- [Current design](design/CURRENT-DESIGN.md): governing intent and constraints.
- [Current implementation](docs/CURRENT-IMPLEMENTATION.md): integrated source, evidence and unfinished work.
- [Implementation authorities](design/governance/implementation-authorities.json): ownership of shared mechanisms.
- [Cleanup manifest](docs/REPOSITORY-CLEANUP.md): integration provenance, retained evidence and archive policy.

The canonical source is `src/`, with runtime artwork/audio in `assets/`. There are multiple development branches. This cleanup integrates a pinned set of commits on `codex/repository-consolidation`; check Git before starting new work.

## Run

From the repository root:

```sh
python -m http.server 8000
```

Open http://localhost:8000/ . The optional Creature Lab is at http://localhost:8000/tools/creature-lab/index.html . Follow displayed contextual controls: E interacts, Q cycles choices, Shift+E drinks, Space attacks and J braces.

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
