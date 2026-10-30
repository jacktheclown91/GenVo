# Morphological evolution S9 — integration and validation

S9 of the creator's brief validates compatibility, ecological consequences, save persistence, performance and Codex's visual integration. This report maps the brief's acceptance scenarios and testing list to evidence. It records which items are automated evidence, which are field observation and which are open findings. Creator acceptance in the browser is separate.

## Acceptance scenarios

| Scenario | Evidence | Status |
| --- | --- | --- |
| **A** Inherited body size | `body-size.mjs`: offspring of 1.5× and 1.1× parents combine one allele from each. `size-evolution.mjs`: inherited size evidence. Two 200-day fields: heritability slope 0.79 and 0.83. | Met |
| **B** Structural limitations | `structural-support.mjs`: a 2× founder sprints slower and is strained; sturdy legs restore most of it. `giant-bodies.mjs`: tissue yield at 3×. | Met |
| **C** Desert survival | `arid-physiology.mjs`: on a hot, dry, waterless patch the ordinary body lasts 0.63 days, the adapted one 0.75, the dormant one 1.25; no water is created. | Met (controlled) |
| **D** Seasonal pond | `climate-water.mjs`: a funded rainfall-runoff pool evaporates (`/2`) or drains downstream with its river (`/3`), closes its ledger and recedes through recession. Year field under `/3`: 1,550 runoff-flooded cells, 520 receded naturally (356 of them after animals drank there), median pool life 66 days, about 35,000 drinks from runoff water. | Met: pools form, are used and dry away. Open water still grows over the year (finding 2) |
| **E** Autonomous morphology | `size-evolution.mjs`, the size-selection fields and species recognition enabled in new games. Variation is inherited and exposed; 200 days show near-zero selection. | Met (no outcome forced) |
| **F** Giant ecological consequences | `giant-bodies.mjs`: 11.8× food and 9× water at 3×; excluded from burrows, logs, flight and single trees by mass; reach and visibility grow. | Met (controlled) |

## Testing list (brief §18)

| Requirement | Evidence |
| --- | --- |
| Existing playable behaviour | Full playable gate, 164 checks, on Node 22 and 24 |
| Inherited morphology; parent-offspring size variation; gradual growth | `body-size`, `size-evolution` |
| Anatomical compatibility; structural viability | `structural-support`, `giant-bodies` |
| Energy and water accounting | `body-size-reserves`, `body-size-physics`, `climate-water`. Year fields: worst daily soil closure 1.2×10⁻⁵. |
| Physical movement; large-creature navigation | `body-size-physics`, `inertia`, `giant-bodies`, `size-visibility-spacing` |
| Reproductive compatibility | Unchanged suites pass; size enters mate preference through log body mass |
| Save and restore; regional replay; determinism | `morphology-integration.mjs` (new). All rules together cross a real border, the home region is archived and replayed off-screen, the same seed gives the same world, and save, restore and two-day continuation are exact by value. |
| Historical policy compatibility | Frozen `/1`–`/3` evolution fixtures, the founding `/1`–`/2` suites and every rule's own "unchanged without the rule" checks |
| Autonomous wildlife behaviour | Size-selection and year fields: 16–80 days of autonomous play per probe and two full years |
| Browser integration | Headless new games record every rule with no page errors |
| Performance | Below |

## Performance

- **Browser, headless, 40 s, while other work loaded the machine.** A new game with every rule ran at median frame 16.7 ms, p95 16.8 ms, p99 33.4 ms. The rules-off page ran at p95 33.3 ms, p99 50 ms. Both had a 150 ms worst frame.
- **Simulation.** Species recognition adds no measurable cost (40 sequential days). Inertia and the size physics reuse each creature's existing calculations.
- **Year fields.** About 2 s per simulated day while sharing the machine; the slowest single day took 3.5 s.

## Year-long fields (receipts in `docs/s9-validation-2026-10-29/`)

`tools/measure-year-validation.mjs` (new) runs a new-game world for a year and records population, births, deaths by cause, soil closure, runoff pools, drinking on them, recession and cost. `--baseline` runs the pre-morphology new-game rules.

| Seed S9-YEAR-2, 365 days | Pre-morphology rules | New rules, `climate-water/2` | New rules, `climate-water/3` |
| --- | --- | --- | --- |
| Alive, day 1 → day 366 | 188 → 20 | 188 → 62 | 188 → 63 |
| Births | 39 | 83 | 104 |
| Deaths: wildfire, age, starvation, predation | 92, 24, 27, 34 | 0, 60, 57, 55 | 31, 57, 56, 44 |
| Drowning | — | 13 | 15 |
| Flooded cells; receded; still open | 347; 0; 347 | 1,454; 0; 1,454 | 1,550; 520; 1,030 |
| River discharge; pool evaporation (moisture units) | none | none; not recorded | 10,100; 2,718 |
| Worst daily soil closure | 5.8×10⁻⁶ | 1.2×10⁻⁵ | 9.9×10⁻⁶ |

S9-YEAR-1 (`climate-water/1`) went from 188 to 25, with 25 births and 40 wildfire deaths.

## Findings

1. **Year-long population decline (pre-existing).** Under both rule sets the founding generation ages out faster than it is replaced; births fall nearly to zero after about day 150. The new rules are better than the baseline (62 against 20 alive, 83 against 39 births), and the drier baseline loses 92 animals to wildfire. The cause is the existing breeding rate and lifespan balance, not the morphology work. It needs its own investigation of courtship, conception and juvenile survival over a year.
2. **Runoff accumulated without discharge (pre-existing, amplified); `climate-water/3` adds discharge.** Rainfall runoff floods new cells beside rivers and pools (`rainfall-runoff-inundation`), but no water leaves the region. Boundary exchange keeps equal volumes and rivers have no downstream discharge, so flooded area only grows.
   - It happens under the baseline too: 347 cells a year.
   - With credible runoff (`climate-water`: 18% of rain against 0.3%) it reaches about 1,450 cells a year, and drowning deaths rise (13–19 a year).
   - `climate-water/2` makes runoff pools evaporate (S9 fix: open water had no evaporation at all). That is correct, but in the humid start valley pools keep receiving runoff and join rivers that never drain, so none recede naturally.
   - `climate-water/3` (now the new-game rule, see the [S5 doc](MORPHOLOGY-S5-CLIMATE-WATER-2026-10-29.md)) adds river discharge and incised channels: water bodies with an open border outlet drain their net surplus downstream, and generated water stands level with its banks instead of a full depth above them.
   - Result: pools now dry and recede (520 in the year, against none). Open water still grows, from 124 cells at day 31 to 1,030 at day 366. Pools keep forming in the wet seasons faster than they drain: new cells flood beside other runoff cells and in closed basins, and pools fed by saturated catchments hold their water. Whether that net growth is a real wetland expansion or a missing loss (for example, seepage of standing water into the soil) is the next hydrology question.
   - Late in the year the drier `/3` valley burned (31 wildfire deaths, against none under `/2`); births rose (104 against 83). Neither was tuned.
3. **Restore key order (pre-existing, harmless).** A restored world's `core` lists its keys in a different order; the data is equal by value. Tests compare by value.
4. **`perceived-threat-escape.mjs` fails, as it did before this work** (`10e49daf`), and is outside the gate.

## Presentation (Codex)

`PRESENTATION-CONTRACT-MORPHOLOGY-2026-10-29.md` lists every read-only source for presentation:
- dimensions and growth (`bodyDimensionsOf`);
- structure (`structuralViability`);
- movement (`motionStateOf`);
- expression (`aridExpressionOf`);
- day phase and air temperature;
- reach and visibility.

No presentation files were changed. The only shared-file edits are one-line `SURVIVAL_OPT_IN` additions in `src/main.js`, each announced in its commit. Visual integration (drawing at `currentScale`, day–night lighting, gait and lean) is Codex's and remains to be accepted in the browser.

## Not yet

- Net growth of seasonal open water over a year (finding 2): seepage of standing water into the soil, or catchment-limited inundation.
- Population persistence over a year (finding 1).
- Deserts and the climate pass (S5).
- Codex's visual integration and creator browser acceptance.
