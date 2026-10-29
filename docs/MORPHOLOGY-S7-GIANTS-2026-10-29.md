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

## Visibility and spacing (follow-up, October 29)

- **Visibility.** A body is seen in proportion to its apparent size: its current linear scale, clamped to 0.5–3×.
  - It applies in `atmosphericSight`, the one authority for animal sighting. That covers threat detection, predators finding prey (`preyHiddenFrom`), the stratum view and the renderer's visible-animal filter.
  - Giants are seen and found from farther away. Small and young bodies hide better, the brief's small-body advantage; the floor reflects that motion and contrast still give them away.
  - Callers' own radius caps still apply.
  - Places and objects, and worlds without `body-size/2`, are unchanged.
- **Concealment in cover** already scaled with the prey's linear size (cube root of absolute mass), so a giant needs three times the cover to hide.
- **Spacing.** Social spacing keeps a separation of base × max(1, the pair's mean scale), the same contact-reach authority, and the step away grows by the same factor. It reuses the nearest-neighbour distance the social state already tracks, with no new scans. In `/1` worlds the logic and checks keep exactly the same order.
- **Presentation note (Codex).** Under `/2`, young and small animals become visible to the player at shorter range, because the renderer filters through the same sight check.

`tests/size-visibility-spacing.mjs` (gated) checks:
- effective sighting range ×2 at 2×, ×0.5 at half size, capped at 3×;
- a 2× body seen where a reference body is not, and a half-size body hidden where a reference body would be seen;
- a 3× prey found far beyond a reference prey's range;
- juveniles as smaller targets;
- spacing separation and a 5.4-tile step for two 3× bodies;
- `/1` unchanged.

60-day soaks under `body-size/2` with all rules, day 61 alive and births: 148/25, 132/14 and 156/2. Under `/1` they were 140/13, 131/10 and 157/0. That is within run-to-run spread; observation only.

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

- **Hard collision.** Bodies still pass through one another between social spacing moves. A full collision footprint would add per-body neighbour work and stays out, per the brief's performance rule.
- **Presentation (Codex).** `bodyDimensionsOf()` already gives `currentScale`; drawing giants at scale, and render bounds matching reach, are Codex's.
- **Natural evidence.** Founders start near 1×. Whether any lineage drifts toward giant size depends on real selection over many generations (S8); nothing pushes it.
