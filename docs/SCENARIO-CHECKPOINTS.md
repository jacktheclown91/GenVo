# GenVo real-world scenario checkpoints

The New World screen and developer replay tooling share **one canonical save snapshot**. A scenario is not a random seed that claims to be evolved. It contains the actual creatures, family history, genomes, body plans, plants, resources, terrain, soil, archived planetary regions, controller state, clock, and RNG from a previously simulated world.

## Player quick starts

Open **New World > Starting point**:

- **New ecology, Day 1:** unchanged normal GenVo world creation.
- **Fork saved world:** pick any saved world. The game performs a canonical restore and creates a *new* save slot. The original recorded world stays intact. This works immediately, without any bundled advanced scenarios.
- **Import a real evolved-world checkpoint:** choose an exported `.json` scenario package. The package is decoded and validated before any new slot is allocated.
- **Evolved: ...:** appears only after verified catalog entries have been built into `assets/scenarios/catalog.json`. A bundled file's SHA-256 must match the manifest before it is restored.

Bundled curated worlds are stored as **.json.gz** files, keeping a ~118 MB complete Day 30 simulation graph to roughly 15 MB for transfer without removing any organism or environmental stock. The New World importer accepts either .json or .json.gz scenario packages.

The **Load World** screen has **Export Scenario** for each saved world. It produces a portable `recorded-*.json` with its real saved-day state. No free creature editor or ancestry rewrite is part of checkpoint loading. A source without a living controllable creature is still a legitimate **developer replay fixture**, but it will not appear as a player quick start. Use a saved world with an active lineage for the New World menu.

## Export a genuine advanced fixture once

From the repository root, with Node.js available:

```sh
node tools/create-world-scenario.mjs --id first-valley --label "Day 30 Valley" --seed GENVO-VALLEY-A --days 30 --generator planetary/1
node tools/create-world-scenario.mjs --id old-growth --label "Mature World" --input exports/my-recorded-world.json
```

The first command runs the actual canonical `Simulation.update` lifecycle for 30 days **once**, captures the state, restores it once for validation, and writes:

- `assets/scenarios/first-valley.json.gz`: gzip-compressed lossless typed-array/Map/Set/reference-preserving snapshot package. The browser decompresses it before using the canonical save restorer.
- `assets/scenarios/catalog.json`: label, *actual* saved day, generation, seed, living-creature count, path and SHA-256.

The second command accepts a file exported from the browser and registers it without replaying its entire past. The exporter records a factual `playable` flag: autonomous or extinct-player worlds remain available to developer replay even if they cannot currently be offered for direct player control. Only a real living player-lineage checkpoint appears as a bundled quick start. Regeneration of an existing id requires `--replace` so an accepted baseline is not overwritten silently. Commit both the scenario file and catalog together for a shareable browser quick start.

**The repository's curated catalog starts empty.** No purported Day 30/100/300 fixture is fabricated or shipped before it has been generated, restored and checked.

## Optional one-time cloud generation

`.github/workflows/generate-world-scenario.yml` adds a **manual** GitHub Actions workflow that runs the real ecological simulation once and uploads the resulting scenario package and SHA-256 catalog as a downloadable artifact. It is not triggered on every push. The workflow must be present on the repository's default branch before GitHub's Actions UI generally offers the manual Run workflow control; this development branch alone does not start it. The dedicated one-time Day 30 workflow commits its SHA-256 verified compressed fixture to `assets/scenarios/` **only after** canonical restoration, snow-topology checks, and two matching replay tests pass. The general manual generator keeps upload-only behavior for other scenarios.

For expensive ecosystem experiments, generate the checkpoint in this separate one-time job, then conduct rapid repeated tests against the resulting baseline.

## Short replay tests

```sh
node tools/run-scenario-test.mjs --id first-valley --days 2 --repeat 2
node tools/run-scenario-test.mjs --input exports/my-recorded-world.json --days 1
node tests/scenario-checkpoints.mjs
```

The runner reloads **a fresh graph from the same immutable original file for every pass**. It advances only the chosen new days, compares the resulting state for repeatability, and verifies the file checksum is unchanged. This is appropriate for expensive mature-stage features such as hybrid fertility, coat adaptation, predator ecology, cross-region water and creature behavior.

What checkpoints **do not** prove:

- A Day 100 fixture does not establish that the current code can evolve from Day 1 to Day 100.
- A verified Node restore does not prove browser playability, asset readability, or acceptable runtime performance.
- SHA-256 protects the package against unannounced changes after curation; it does **not** cryptographically prove that every prior day was actually simulated. Use reproducible seed-to-checkpoint generation logs and occasional independent full-history runs for that.
- A fixture validated against one save schema can become incompatible with later physics, ancestry or topology rules. Migration must be explicit and tested, not silently regenerated or labeled as an old world.

Keep a limited number of representative matured checkpoints; use occasional complete fresh-world long runs to independently verify evolutionary continuity. Always keep the original saved source separate from test outputs and player forks.
