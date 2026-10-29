# Morphological evolution S3 — anatomical compatibility (`structural-support/1`)

S3 of the creator's morphological-evolution brief covers structural requirements that depend on the body, inherited developmental pathways and explained invalid combinations. It follows [S1](MORPHOLOGY-S1-BODY-SIZE-2026-10-28.md), [S2](MORPHOLOGY-S2-PHYSICS-2026-10-28.md) and [inertia](INERTIA-DESIGN-2026-10-28.md).

**Status.** Implemented and **on for new games** (`SURVIVAL_OPT_IN`). Saved worlds without `structuralSupportRules` are unchanged and bit-identical. In those worlds S2's inherited-scale impact rule still applies.

## What existed (inspected first)

- **Anatomy.** Anatomy is modular: a torso with limb, flank, dorsal, head, mouth and eye sockets. Every part has a reviewed load (`mass`).
- **Viability before S3.** `draftProblems`, shared by mutation and the editors, checked only graph validity, ancestry, at least four legs, a mouth, an eye, and budget.
- **Developmental pathways.** Already present as part prerequisites: sturdy legs need walking legs, a flight wing needs a proto-wing. Inherited size changes gradually through alleles (S1).
- **Survey of a new-game world.** Body load per unit of leg tissue ranges from 2.89 (mosskip) to 4.82 (mirelick). The genvo founder is 3.13. No anatomy is legless.

## Model (`organisms/structural-support.js`)

**Load and support.** Load-bearing legs carry the body. Each part's reviewed load stands for its tissue:
- *body load* = the sum over all parts;
- *support* = the sum over legs on the torso's limb sockets.

Heavier torsos, plates, sacs and wings raise the load. More legs, or stouter legs (sturdy 0.6, climber 0.58, against walking 0.4 and runner 0.35), raise the support. No class or species rule enters.

**Stress index.** σ = (body load / support) ÷ the founder's 3.125, × inherited scale s, × growth g. Weight grows as (s·g)³ and cross-section as (s·g)², so stress grows as s·g. The founder adult at reference size is σ = 1.

**Anchors.** Limbs normally work at a safety factor near 3; the founder sits there.

| σ | Safety factor | Consequence (continuous, never lethal) |
| --- | --- | --- |
| ≤ 1.5 | ≥ 2 | Sound: no change |
| 1.5–3 | 2 to 1 | Strained: acceleration and turning × 1.5/σ; sprint gain × (3 − σ)/1.5; movement cost × σ/1.5 |
| ≥ 3 | ≤ 1 | Overloaded: no sprint; walking × 3/σ |
| any | — | Falls from a climb and hard jump landings injure × σ (replaces S2's × s under this rule) |

Swimming bodies are carried by the water: no gait limits, but impacts still scale.

**Explained refusal.** An anatomy whose own reference-size σ reaches 3 cannot bear its own movement. Under the rule:
- inherited mutation refuses it;
- the player's evolution editor refuses it, with an explanation such as "Its legs would carry 9.6 load per unit of leg tissue, 3.1x a founder's: they could not bear its own movement. Add or strengthen load-bearing legs, or shed heavy parts.";
- anatomy is never silently rewritten.

The flag travels on the draft (`createDraft({structural})`), so Codex's `creature-editor.js` shows the reason without any change.

**Presentation and inspection (Codex, read-only).** `structuralViability(sim, animal)` returns:
- `state`: sound, strained or overloaded;
- `stress`, `comfort` and `yield`;
- `legs`, `bodyLoad` and `legLoad`;
- `limits`, and plain-language `reasons`.

## What this means today

- **Existing species at reference size** sit between 0.92σ and 1.54σ. All are sound, except the heaviest (mirelick, podshell), which sit at the comfort edge.
- **The heaviest anatomy the registry can build** (a barrel or long torso with four light legs and every socket loaded) reaches σ = 2.84. So refusal cannot trigger with today's parts. It guards future heavier parts.
- **Size is what makes structure bite:**
  - a founder at 2× is strained (σ = 2), keeping 2/3 of its sprint gain and 75% of its acceleration, and paying a third more to move;
  - a mirelick at 2× is past yield (3.08): it cannot sprint and walks a little slower;
  - the same 2× founder on sturdy legs drops to σ = 1.55, nearly sound. This is Scenario B: "Compatible support anatomy can improve the outcome".

## Evidence

`tests/structural-support.mjs` (new, gated) covers:
- the founder unit, and that leg tissue carries the load;
- existing anatomies in a new world staying within comfort;
- stress × size × growth;
- the exact limits at σ = 1.5, 2 and 3.5; water;
- Scenario B in the real movement step: the 2× founder sprints slower, and sturdy legs restore most of it;
- fall injury from a real failing climb ∝ σ;
- refusal with an explanation beyond yield;
- the heaviest reachable anatomy staying below yield;
- saves and rule checks, and worlds without the rule unchanged.

60-day new-game soaks with size, inertia and structural support on, at day 61:

| Seed | Alive | Births |
| --- | --- | --- |
| SOAK-SIZE-1 | 127 | 17 (19 without structural support) |
| SOAK-SIZE-2 | 143 | 14 |
| SOAK-SIZE-3 | 162 | 4 |

This is observation only. Today's anatomies at their own sizes are almost all sound, so the field is largely unchanged until size or heavier anatomy evolves.

## Not in S3

- **New large-body and small-body parts** (§6.2–6.3): reinforced support limbs, large-body musculature, compact armor, small-scale flight. Each new part needs a reviewed load and artwork. This is coordinated with Codex: the registry change is mine, the art is Codex's.
- **Per-joint or posture modelling.** Leg tissue mass is the cross-section proxy; leg length and posture are not modelled.
- **Founder design.** The founder designer (before a world exists) does not yet carry the structural flag. Founders it can build all stay below yield.

## Next

S4, extreme survival biology: water conservation, thermal adaptation, dormancy, alternative hydration. Inertia phase 2 (evasive jinks) remains available.
