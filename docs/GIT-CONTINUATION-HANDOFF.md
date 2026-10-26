# Git continuation handoff — October 26, 2026

Repository: `jacktheclown91/GenVo`, canonical branch `main`. Last verified remote checkpoint before this foundation commit: `c9d8a77894d591d77831e3b26805472cfe4f227b`. Always inspect the live branch and Actions before editing; this document cannot contain its own commit hash. Creator authorized Codex as temporary engineering lead after Antigravity credits ran out. Preserve biological owners and historical contracts; the older visual-only division is historical for this work.

## Preserved release

Pass 1 complete, runtime source `36dd0e625bec20cdd730e3a9dda6f9b8f7e431df`. See [release evidence](HTML5-RELEASE-2026-10-26/README.md), including 114 checks and independently extracted Chromium proof. Local `GenVo-web.zip` SHA256 `37832ff5b16b668c7cc8bb9a439b94555c458859c4b5d085baf8d70c068a310d`, 55,513,740 bytes. Versioned copy and previous ZIP backup are outside source under `releases/GenVo-20261026-36dd0e62`. GitHub-only developers cannot assume access to these Windows files. Published itch submission was untouched. The ZIP predates subsequent architecture work and must not be described as containing it.

## Inspected architecture

`main.js` owns browser startup, selected simulation, input, frame admission, rendering and save UI. `FrameStepper` admits ordered work; `Simulation.updateSteps` owns canonical tick sequencing and yields. Existing domain controllers own biology, ecology, family, cognition and inheritance. `World` owns physical fields; planetary travel/residency/replay move and synchronize actual regions. `save-manager.js` constructs/restores snapshots and imports Simulation; Simulation's regional dependencies reach persistence again. Renderer and tutorial read authoritative state. The versioned [authority registry](../design/governance/implementation-authorities.json) remains the mechanism owner index.

Measured at c9d8a778: Simulation 150,026 bytes, 164 unique module dependencies, longest line 8,205 characters; renderer 123,695 bytes/77 dependencies; save manager 60,473/85; main 59,383/74. Import declaration counts differ from unique dependency counts. `node tools/architecture-check.mjs` regenerates the live report using the canonical export graph.

Three strongly connected components exist: canopy-site/gliding; a 38-module physiology/anatomy/environment component; a seven-module simulation/persistence/regional replay component. Exact membership is versioned in `design/governance/architecture-baseline.json`. There are currently zero biological-domain imports of UI/render modules. This is existing working coupling, not permission to add cycles. The static graph is conservative (literal imports only), not an AST unused-binding detector.

Global state: `CFG`, registry/policy review objects and class/module caches. `applyDayClock(sim)` mutates `CFG.dayTicks` and `bioStride`; interleaved worlds may have different policies. Do not freeze or clone these objects blindly. Controllers receive the actual Simulation and observe prior controller assignments. Construction order and deferred dispersal initialization are contracts. Tick order, yielded work, RNG draws, physical resource transfers and save policy restoration are dangerous extraction boundaries.

## Foundation and protected baseline

`tests/modernization-baseline.mjs` freezes complete structured snapshot graph signatures at ticks 0/6/48/96 in actual freshwater and planetary worlds, with AUTO decisions and exact save/restore plus six-step continuation at tick 48. Circular organism references, typed-array types and reference identity are encoded deterministically. Fixtures were captured BEFORE runtime refactoring, at c9d8a778. These finite samples supplement domain contracts; they do not prove every reproductive or regional event happened.

Use `tests/reproduction.mjs`, `tests/conception-parental-inheritance.mjs`, `tests/tissue-water.mjs`, `tests/tissue-energy.mjs`, `tests/regional-synchronized-replay.mjs`, `tests/regional-multi-hop-biology.mjs`, `tests/sliced-ticks.mjs` and persistence tests in addition to this baseline. No population targets, enabled-policy changes or relaxed budgets are permitted. Historical fixture modules imported by tests/tools, original artwork, migrations, scenario assets and hash manifests, retained source references and old receipts must remain. Audit imports before deletion. Public packaging uses the Git inventory and canonical exporter, never recursive docs copying.

## Commands and CI

- `node tests/architecture-check.mjs`: isolated adversarial fixtures verify cycle, missing-import and boundary rejection.
- `node tools/architecture-check.mjs`: reject missing imports, new/expanded cycles and biological presentation dependencies; size inventory is advisory.
- `node tests/modernization-baseline.mjs`: frozen pre-refactor state and continuation.
- `node tools/check-playable.mjs`: full 114-check baseline; no tests removed.
- `node tools/canonical-source-audit.mjs` and `node tests/public-export.mjs`.
- `node tests/sliced-ticks.mjs`, `node tests/world-restore-generation-parity.mjs`, `node tests/save-persistence.mjs` for simulation extraction.

Main's `playable-checkpoint.yml` runs the complete playable gate plus the new architecture/baseline checks on Node 22, Ubuntu. The separate browser workflow is manual or consolidation-branch-triggered, not automatic on main. Local Node used for foundation: 24.14.0; CI must verify Node 22. At last observation release checkpoint Actions run 40280305782 was still running; never infer green from a push. Query current Actions for the exact new head.

## Quality and remaining work

See [incremental quality policy](SOURCE-QUALITY.md) and [actionable backlog](REFACTOR-BACKLOG.md). Foundation adds no runtime dependencies or build system. Adversarial gate tests exposed missed side-effect and literal dynamic imports in the shared source graph; its parser now includes both, with existing source-audit/export checks passing. No simulation responsibility has yet been extracted. First task is constructor controller composition extraction, retaining exact assignment order and existing instances. Next is spatial index ownership if independently proven.

Known issues: long atomic mature-region work and browser frame gaps remain; no budget was raised. `tests/care-expression.mjs` has a diagnosed zero-hydration positive nursing fixture; do not grant free milk. See `docs/art/final-visual-integration-handoff/NURSING-PRECONDITION-DIAGNOSIS.md`. Dedicated fixture repair needs positive funded care plus negative zero-water checks. Historical documentation contains older gate counts and acceptance claims; current source and scoped evidence govern.

Deferred visual candidate `codex/ground-paint-candidate` at `a1d2f9b888f69abf3902f7106b792120740c3011` is pushed and excluded from main/ZIP. It has incomplete full integration/browser proof. Preserve it; do not silently merge it during engineering work.

GitHub edits and Actions can establish source contracts, deterministic parity and export checks. They do not establish Windows native/GPU behavior, unfamiliar-player usability or creator acceptance. Renderer/input changes need real extracted browser proof. Preserve all concurrent work and commit coherent tested changes with normal fast-forward history.
