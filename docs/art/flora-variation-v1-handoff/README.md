# Flora variation heads-up

The flora-only signed-shift hash produces values below0.5, limiting four intended rotations to two and biasing anchors/colour. The source audit sampled16384 cells per shape; some full-plant target anchors fall outside their own resource cells. Correct only this paint hash with unsigned mixing and bound visual anchors to their owning cells; renderer target registration already consumes that same anchor. No plant stocks, genomes, reproduction, growth, RNG, canonical world coordinates or movement change. Exact before source retained for native A/B and regression.

The renderer's separate hash has the same signed-shift issue. Do not silently broaden this plant pass into terrain/water/weather changes; it needs its own native review and continuity checks.
