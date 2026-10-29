# Morphological evolution S7 — giant organisms (`body-size/2`)

S7 of the creator's brief expands size toward 3× once the structural, environmental, navigation and performance constraints are validated. Giants must have real ecological opportunities and liabilities and must never be automatically dominant (§13), and their dimensions must shape world interactions (§14).

**Status.** Implemented and **on for new games**: `SURVIVAL_OPT_IN` records `bodySize: 'body-size/2'`. `body-size/1` worlds keep their 2× bound and base contact distances exactly.

## Constraints validated before raising the bound

| Constraint | Already enforced by | At 3× (founder anatomy) |
| --- | --- | --- |
| Food | S1 reserves and S2 Kleiber metabolism | 3^(9/4) = 11.8× absolute food |
| Water | Surface-scaled water loss | 9× absolute water |
| Endurance | S1 reserves (×27) | Lasts longer on its own reserves, but still drains |
| Movement | S2 cost of transport, flight and work exponents | Flight loading far over the limit |
| Structure | S3 stress, ∝ s | σ = 3, tissue yield: no sprint, walks at full speed only on sturdier legs (σ 2.3) |
| Shelter and passages | Absolute mass limits | Shut out of burrow passages (load 2.6), log interiors (1.6) and single-tree canopies (1.65) |
| Impacts | S2/S3 | Falls and hard landings ×σ |
| Momentum | Inertia and S3 | One sixth of the reference acceleration (1/3 from size, halved again by strain at σ 3); six times the turning radius |
| Heat | S4 surface-scaled evaporative cost | Applies unchanged |
| Founding | S6 | Founders still start at 0.95–1.05×; size changes only by inheritance |

Performance: none of this adds per-creature work. Every constraint is the same calculation each creature already makes, with its own numbers.

## Implemented

- **`body-size/2`.**
  - The same inheritance (one allele from each parent, ±0.03 mutation) with the upper bound at 3×.
  - Allele validation and save restore are per policy: a 2.5× body is invalid in a `/1` world.
  - Inheritance is gradual, so a lineage can only approach 3× over generations, and reversals and dwarfism remain possible.
- **Contact reach** (§14, "combat reach where justified"). Under `/2`, two bodies touch over base × max(1, mean of their current linear scales, including growth). A reference pair keeps the base distance exactly, and only larger bodies reach further, so small and young bodies keep every existing interaction. This applies to:
  - predation capture (0.85);
  - courtship staying in range and completing (0.9);
  - the player's strike range (1.65).

  `Simulation.reachBetween()` is the one authority; `/1` worlds return the base.

## Evidence

`tests/giant-bodies.mjs` (new, gated) covers:
- inheritance reaching 3× only under `/2` (2× under `/1`);
- per-policy save validation;
- a 3× founder shut out of burrows, logs, flight and single-tree canopies by mass;
- structural yield at 3× and the sprint sturdy legs restore;
- reach: exact base for reference pairs, 2× for a giant and a reference body, 3× for two giants, unchanged under `/1`;
- the real metabolism step: 11.8× absolute food and 9× absolute water, a smaller share of reserves per day, still draining.

A headless new game records `body-size/2` with every other new rule and runs with no page errors.

The full playable gate passes on Node 24 and Node 22 (161 checks). The earlier S1–S6 and inertia suites pass unchanged.

## Not yet

- **Visibility.** Larger bodies are not yet seen from farther away. Perception distance by target size is the next interaction.
- **Collision footprint.** Bodies are still points for spacing and grouping, and only contact reach scales. A size-scaled separation radius, coordinated with Codex's render bounds, is next.
- **Presentation (Codex).** `bodyDimensionsOf()` already gives `currentScale`; drawing giants at scale, and render bounds matching reach, are Codex's.
- **Natural evidence.** Founders start near 1×. Whether any lineage drifts toward giant size depends on real selection over many generations (S8); nothing pushes it.
