# Physical geological chambers

Newly generated caves now record `world.subsurface.formation = fracture-chambers/2`. This changes actual saved open volume, rather than drawing wider artwork over narrow collision corridors. Existing cave policy and excavation material accounting remain authoritative.

`growGeologicalChamber` in `src/world/natural-caves.js` forms connected, variable-width cavities within a coherent local geological field. Moisture, fractures, playable bounds, surface water, floor elevation and available spoil capacity constrain growth. The domain has unequal axes and bent, irregular margins. Actual accepted passages are the sole runtime topology. Terrain with unfavorable slopes or material capacity can still produce narrow/incomplete cavities; no broad-cavern quota is enforced.

Each opened cell uses `excavatePassage`; its negative void volume funds an equal positive terrain deposit on a nearby exterior talus ring. Initial formation consumes no biological RNG, water or invented sediment inventory. Spoil is placed outside the candidate chamber so it does not artificially raise the next excavated floor into a disconnected step. There is no biological stock or population adjustment.

`batchExcavation` synchronously refreshes derived drainage/hydrology once after initial material transfers, including exception paths. Physical transfers and receipts remain immediate. Live creature excavation retains its immediate refresh. This avoids multiplying full-region derived work by the number of chamber cells; it is not evidence that late-session simulation stalls are solved.

## Compatibility and evidence

Ordinary save restore uses exact saved passages and formation provenance, and rejects unknown formation versions. Missing historical formation provenance remains missing; no saved cave layout is regenerated or silently expanded. Existing historical adoption does not replace visited geometry. Newly generated destination regions receive the current initial geology and persist it on return.

`tests/cave-chambers.mjs` verifies actual connected 2x2 cavities, shared traversability/optics/art adjacency, conserved material and unchanged water/RNG, deterministic generation, one derived hydrology refresh, exception refresh, exact new/historical saved geometry and unknown-version rejection. All 40 focused playable integration checks pass, including natural caves, burrowing and physical sensing. The canonical source audit and public-export parity pass.

On the normal local generator, `CAVES-GEOLOGY` produces 265 actual cells with 128 open 2x2 squares and ten entrances; `SENSORY-RECONCILIATION-2026` produces 246 cells with 120 squares and seven entrances. These are observations, not required population or geometry outcomes. The browser harness chooses an actual illuminated chamber interior for staged observation on the planetary generator. Evidence lives in `C:\Users\jackt\.codex\visualizations\2026\10\20\01a1583e-f787-7bb3-a369-b0b62a443366\geological-chambers-browser` and the sibling derived web export. The actual planetary browser region has 167 saved passage cells. Surface/cave rendering and exact native cave Save/Continue pass with no browser errors; the cave frame was inspected and shows a broader open floor, with cell-shaped boundaries still visible. Underwater browser observation remains unproven for this shallow region. This is not creator acceptance or a natural-lifetime entry trial.

## Still incomplete

This pass creates broader physically open cavities within the existing cell discretization. It does not yet add subcell curved collision boundaries, multiple vertical cave levels, span-dependent roof strength, coupled groundwater seepage/drainage, cave air transport or complete subterranean biological niches. Existing floor/roof checks, collapse, entrance traversal, finite air, cave daylight, hearing and material ledgers continue to apply. The full underground environment and full Creature-stage game remain incomplete.
