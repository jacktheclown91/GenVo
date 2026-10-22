# Anatomical vision — October 22, 2026

New planetary worlds record `anatomical-vision/1`. Under this policy, a creature's eyes decide how far and how widely it sees. Late-game creatures can evolve sight that covers the whole gameplay screen at normal zoom. Primitive creatures still see poorly.

Historical worlds keep the earlier rule unchanged:

- range: 8 tiles × the senses gene × the eye threat factor;
- a hard 24-tile cap;
- a single facing cone set by eye count.

## Range and field of view are separate (`src/lineage/vision.js`)

Each mounted eye covers its own arc, centred on its socket's direction. It sees out to its own physical range in world tiles, scaled by the inherited senses gene, which is clamped to 0.5–1.6. The whole view is the union of the eyes. Ranges are world distances, never screen measurements; the 48-tile ceiling is a physical bound.

Socket directions are ±35° for the front pair. On large torsos (barrel, long), a second pair sits at ±115°.

| Eye | Range (tiles) | Arc | Line |
|---|---|---|---|
| eyespot | 3 | 160° | primitive |
| simple | 8 | 150° | starting eye |
| display / tracker / glow | 8–11 | 140–150° | existing |
| stalk | 11 | 170° | raised 0.45 tiles |
| wide-field | 9 | 230° | panoramic line |
| compound | 11 | 250° | panoramic line |
| hunter | 13 | 100° | long-range line |
| **telescopic** (from hunter) | 24 | 64° | long-range |
| **raptor** (from telescopic) | 40 | 76° | long-range |
| **panoramic** (from compound) | 15 | 290° | panoramic |
| **sentinel** (from panoramic) | 34 | 240° | raised 0.2 tiles |

How the lines play out:

- **Long-range eyes:** a hunter with raptor eyes sees about 40 tiles ahead and nothing behind.
- **Panoramic eyes:** these see almost all the way around, but only about 15 tiles.
- **Full screen:** raptor eyes forward plus sentinel eyes on a large head give 360° and about 40 tiles ahead.
- **Starting creature:** two simple eyes give about 8 tiles and 221°.

The creature editor now shows **Sight range (tiles)** and **Field of view (°)** next to the existing Sight factor.

## Costs and evolution

The four new organs are heavier and cost more upkeep than earlier eyes:

| Eye | Mass | Upkeep | Food upkeep (metabolism) |
|---|---|---|---|
| telescopic | 0.10 | 0.09 | ×1.04 |
| raptor | 0.15 | 0.14 | ×1.06 |
| panoramic | 0.12 | 0.10 | ×1.05 |
| sentinel | 0.20 | 0.18 | ×1.08 |

- **Gains and losses:** the long-range eyes add a hunting bonus but notice threats a little later. The panoramic eyes notice threats sooner.
- **Stepwise only:** each organ evolves only from its precursor, so no step can be skipped.
- **Second eye pair:** a policy-gated mutation can grow a second eye pair on a large head that provides those sockets. In about 1.7% of mutations of a large-torso body, it copies an eye the lineage already has or can reach.
- **Historical worlds:** worlds without the policy never offer the new organs or the second-pair mutation, so their mutation lists are unchanged.
- **Founding:** founding templates do not use the new organs; they are beyond the founding developmental depth.

## Physical limits (`src/ecology/atmospheric-visibility.js`)

One authority, `creatureView` / `viewCanSee` / `visuallyObservable`, now drives all of these:

- player fog and sensory memory;
- wildlife threat detection;
- predators' prey search (`preyHiddenFrom`);
- click targeting;
- neighbouring-region views, both terrain and resident wildlife;
- mouse routes into neighbouring regions.

A point is seen only when all of these hold:

- **Eye coverage:** an eye covers its bearing, and its range after attenuation reaches it.
- **Atmosphere:** the observer's local air attenuates reach over distance (`reach × e^(−extinction × distance)`). Dense fog collapses even a 40-tile eye to a few tiles, and riverside mist roughly halves it. Actual targets are also checked with the existing per-ray atmospheric sample.
- **Terrain relief:** heights are elevation × 8 tiles, the same scale as the movement grade. A ray from the eye height (body 0.35 tiles plus any raised-eye height) to the target must clear the relief. Rays across a region line sample the neighbouring region's actual terrain.
- **Medium:** caves and water keep their own optics and limits. Range is at most 4 tiles underground and 3.5 tiles submerged, with stratum, ice and turbidity rules unchanged.

Surface lighting has no day/night model in the game, so it adds no limit here.

## Verification

- **`tests/anatomical-vision.mjs`** (in the [playable gate](test-runs/anatomical-vision-playable-2026-10-22.log), all 82 checks passing) checks:
  - historical worlds keep the cone and the 24-tile cap;
  - primitive sight is about 8 tiles and under 240°;
  - stepwise range gains along the long-range line, and wider views along the panoramic line;
  - raptor eyes see 36 tiles ahead but not 5 tiles behind, while panoramic eyes see behind but not 20 tiles ahead;
  - **Full screen:** the evolved combination sees all 2,074 cells of a 1920×1080 view at 2× zoom on level ground in clear air, while primitive eyes see 6%;
  - a 4-tile ridge, dense fog and the cave/water limits block or shorten sight;
  - a wildlife hunter perceives and searches for prey through the same eyes;
  - mass, upkeep and metabolism costs;
  - stepwise, policy-gated evolution, including the second eye pair;
  - save policy, historical restore and rejection of unknown rules.
- **Regressions:** atmospheric visibility, sensory perception, stratum senses, threat perception and appraisal, vibration, regional fauna, regional pointer, regional founding, the parts tests and the native catalog (97 parts) pass.
- **Chromium** (`tools/verify-anatomical-vision-browser.mjs`): the exported build, a native New World, 1920×1080 at normal zoom, game paused. Staged inputs: the observer is placed on legal ground, and the evolved eye anatomy is applied through the lineage authority rather than grown by natural evolution. Measured from the actual rendered fog layer:

  | Measure | Original eyes | Evolved eyes |
  |---|---|---|
  | Screen revealed near the east border | 6% | 93% |
  | Range / field of view | 7.7 tiles / 221° | 38.5 tiles / 360° |
  | Drawn neighbouring-region cells revealed | 0 of 684 | 656 of 684 |
  | Wild creatures seen 24+ tiles away, in clear air | 0 | 25, including the target 31.6 tiles away |
  | Screen revealed at that clear-air spot | 6% | 98% |

  The remaining dark cells are rear-arc range, atmospheric loss and relief. Frames: [border, original](vision-review-2026-10-22/primitive.png), [border, evolved](vision-review-2026-10-22/evolved.png), [distant, evolved](vision-review-2026-10-22/distant-evolved.png), [distant, original](vision-review-2026-10-22/distant-primitive.png), [receipt](vision-review-2026-10-22/receipt.json).

## Limits

- **Not observed through natural evolution:** this trial applied the late eye anatomy directly. A naturally evolved lineage reaching it has not been observed.
- **Resident wildlife only:** neighbouring-region wildlife is shown only for resident regions, as before.
- **Approximate relief:** occlusion samples the terrain surface at one-tile steps. It does not model vegetation height or solid cave roofs seen from above.
- **No surface lighting:** there is no surface day/night lighting.
- **Not accepted yet:** creator visual acceptance and long-run ecological effects of the new wildlife perception are open.
