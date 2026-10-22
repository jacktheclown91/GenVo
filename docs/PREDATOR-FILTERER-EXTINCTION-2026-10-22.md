# Why bankjaw and rillsifter go extinct — October 22, 2026

**Correction (October 22):** rillsifter's effective breeding minimum was 2.9 (optimum 3.7), set by the provisional override in `src/ecology/breeding-calibration.js`, not the 4 recorded in `species.js`. Statements below that cite 4 overstate the gap. The creator subsequently directed that no species-specific threshold be retuned. New worlds now use [shared breeding support](BREEDING-SUPPORT-2026-10-22.md) instead.

Bankjaw (shore hunter) and rillsifter (gilled filter feeder) went extinct in all six 400-day observatory runs. This happened in both the vision and control arms, so anatomical vision is not the cause.

This investigation is read-only. Its sources:

- the [observatory datasets](test-runs/observatory-2026-10-22/);
- a new per-individual life tracer, `tools/trace-species-life.mjs`, summarised by `tools/analyze-species-life.mjs`;
- targeted probes of the decision, feeding and breeding paths.

The tracer recorded every animal of both species daily on two seeds: `PLANET-OBS-2` vision for 220 days and `PLANET-OBS-3` control for 260 days ([traces and summaries](test-runs/observatory-2026-10-22/species-life/)). **No biology was changed.**

## What the data shows

| | Bankjaw | Rillsifter |
|---|---|---|
| Founders | 3–4, sexes 2F/1M or 3F/1M | 18 |
| Births per run | 0–2 | 0–6, and only once the population had nearly gone |
| Deaths | starvation (one wildfire, one predation) | starvation, with a few predation, wildfire and age deaths |
| Energy trend | 0.59 → near 0, rising on 0–9% of days | 0.64 → 0.16, rising on 4–25% of days |
| Breeding check | allowed ~100%, resource score 1.12 | **refused ~100%, resource score 0.00** |
| Mates | available and 8–27 tiles away | available and 8–15 tiles away |
| Behaviour | **"feed" 54–99%, hunt 1–14%**, in water 94–100% when starving | "feed" 50–94% |

## Root causes

### 1. Uneatable underwater meals trap hungry swimmers (bankjaw)

In `src/sim/simulation.js:399`, a hungry animal (energy below 0.72) that is in water, or that forages amphibiously, is offered `bestFreshwaterFood` *before* the hunting branch is ever reached. That search uses **planning** access, which asks whether this body could reach the food, and a swimmer with webbed legs passes for underwater food. Eating (`harvestFreshwater`) uses **actual** access: under `depth-respiration/1`, underwater food requires the animal to be submerged at depth.

Wildlife almost never submerges: bankjaw spent 0.6% of ticks submerged and rillsifter 1.2%. Over 12 days of bankjaw decisions in water, every water meal offered was **fry, an underwater-only food. None was edible at the surface; all would have been edible submerged.** In 20 days bankjaw made no water meal at all. It re-chooses the same unreachable meal every decision, rarely reaches the hunting branch while prey stays within reach, and starves. Its energy never reaches the 0.74 needed to breed.

The planning search predates this handoff; the mismatch came in with diving on October 20.

### 2. Winter surface ice locks gilled water dwellers in place (rillsifter)

A swimmer can occupy water only where it is not iced over (`lifestyle.canOccupy`). Under ice, movement and feeding require being submerged, which wildlife doesn't do (cause 1). In the start region's winter (temperature 0.18–0.47), the river carried about 0.045 ice per cell by day 3. That is above the 0.02 cover threshold.

So a rillsifter can neither move to nor feed in the cells around it. Algae, its main surface food, is sealed off, and larvae, its best food, needs depth. Its own cell is grazed empty: algae there was 0 while neighbouring cells held about 0.29. Energy falls through winter and does not recover, and deaths follow from day 127 onward.

### 3. The breeding forage score can never reach rillsifter's minimum (rillsifter)

`carrying.surveyAt` scores forage as **total food ÷ every reachable cell in a 7×7 sample grid**. For a swimmer, that includes all land cells and the land plants a gilled water dweller cannot use.

- **Day 1:** the survey counted the river's algae and larvae (about 17–35 energy across 7–14 water cells), but the score was only **1.5–1.8** against the species minimum `minForage: 4`.
- **Under ice:** the score fell to 1.2–1.3, with **no water food counted at all**.
- **Even with ideal normalisation:** counting only accessible water cells, the river holds about 2.4 per cell (algae about 0.25 × 8 × 0.8, plus larvae about 0.025 × 26 × 1.25). That is still below 4.

The minimum appears calibrated for an older food scale, so **rillsifter can never qualify to breed in this habitat.** The founding cohort simply ages out; deaths cluster at ages 125–200 against a lifespan of 188. Only when two survivors were left did the per-animal food score rise enough to allow pregnancy, and by then no mate remained.

### 4. Founders too few for a breeding population (bankjaw)

Three or four solitary hunters with a skewed sex ratio are demographically fragile even when fed. This is a contributing factor, not the primary one.

### Shared consequence

Rillsifter is bankjaw's preferred prey (preference 1.0). Its collapse removes the best water prey, which compounds bankjaw's decline. Algae recovered after rillsifter disappeared (OBS-3: 25 → 47), which confirms grazing pressure plus winter production, not habitat absence.

## Proposed fixes, before any biology change

Each of these changes biology or behaviour, so each needs the creator's go-ahead. Each should be versioned so historical worlds keep current behaviour. The recommended order follows dependency.

1. **Wildlife foraging dives (fixes causes 1 and 2).** When the shared feeding decision selects underwater food for a body that can swim to it, carry the animal down through the **existing diving authority**, with finite held air, gill ventilation and paid descent and ascent, then harvest at depth. The player already does this. This closes the gap between the planner and the eater without granting free access.
   - **Minimal alternative:** have wildlife's food search use actual (non-planning) access, so uneatable underwater food is never chosen and hunters fall through to hunting. It is cheaper, but it removes the aquatic niche for wildlife, so I don't recommend it.
2. **Life under ice for gilled water dwellers (completes cause 2).** Let animals with gills occupy and move through ice-covered water submerged, with access to underwater food there. Surface food and air-breathers stay sealed off.
3. **Water-dweller forage score (fixes cause 3, part 1).** For water dwellers, compute the breeding forage score over **accessible water cells only**, and exclude land plants the body cannot use. Non-aquatic species are unchanged.
4. **Recalibrate rillsifter's breeding forage (fixes cause 3, part 2; creator decision).** The measured river density is about 2.4 per cell in summer, while `minForage` is 4 and `optimalForage` is 8. Choose new values, or a habitat-relative rule, from these measurements rather than by tuning toward survival.
5. **Hunter decision order (part of cause 1).** After fix 1, verify that a hungry hunter weighs available prey against reachable aquatic food, rather than always trying aquatic food first.
6. **Minimum viable founding (cause 4).** Seed the start region's solitary hunters with at least one sound breeding pair near each other, as regional founding already does for its groups.

## How to verify

Implement fixes 1–3 behind a versioned policy. Then run `tools/run-observatory.mjs` on matched seeds (OBS-1/2/3, 400 days) with the current behaviour as the control, and trace with `tools/trace-species-life.mjs`.

- **Success measures:** bankjaw water meals and hunts, rillsifter winter energy, breeding-check approval, and births and persistence for both species.
- **Side effects to watch:** prey and producer stocks, and population stability.

The fixes should be accepted for their mechanism, not because the populations survive.
