# Overhead flora and reliable selection — October 14, 2026

This checkpoint continues the approved near-vertical visual direction. Five existing resource families use one native indexed-art path: retained moss, a dorsal berry canopy, radial reed crown, seed pods and mushroom cap tops. Small living seedlings use fruit-free cotyledons. This is presentation and interaction work on existing biology, not an ecology expansion. The full development goal remains active.

## Player-visible change

Reeds no longer use the resource sprite's upright stalk silhouette. Berries read as a canopy, fungi as cap tops and pods as capsules among leaves. Actual biomass controls size and visibility. Existing season, seed-allocation and coat-allocation predicates select color and paint states. Bare/fruiting shrub frames preserve the same registered canopy; the three pod states preserve foliage outside the capsule regions. Funded reproductive markers remain separate and follow actual botanical state. A seed bank alone displays seed marks, not an invented adult plant.

Painted centers and mouse targets now share the same deterministic anchor, including reeds' water-neighbor offset. Different resource families no longer receive identical individual jitter. Clicking visible shoreline vegetation takes precedence over its background water; empty water is still selectable. These changes preserve the canonical resource cell, reach checks and action execution. E consumes the selected valid resource through the existing gameplay controller and does not open a radial menu.

## Gameplay source

| File | Responsibility |
| --- | --- |
| `src/render/authored-flora.js` | Shared native projection, inherited visual states, bounded palette/frame caches; CSS colors normalize without GPU readback |
| `src/render/flora.js` | Shared visual anchors, current-state native plant/trace/seedling paint and existing reproductive markers |
| `src/render/renderer.js` | Use the painted anchor for selection and pass real stock, inherited traits and season to small traces |
| `src/ui/world-resource-target.js` | Pick visible vegetation before background water while preserving existing object priorities and validators |
| `assets/art/environment/overhead-flora.js` | Six indexed shapes, nine native 32×32 frames, semantic tissue/fruit/coat pigments |

Original moss and berry modules remain preserved. Pre-change source is retained in `reports/overhead-flora-before` for paired captures. No new feeding, inheritance, growth, compatibility, physiology or water-access controller was introduced.

## Art provenance and rejected work

Built-in image generation produced separate canopy, reed, pod, cap and seedling masters. See `assets/art/production-review/overhead-flora-v1/generation-prompts.json` and `preparation-receipt.json`. `tools/prepare-overhead-flora.py` mechanically crops, samples nearest pixels, registers states and maps pigments; it does not draw a replacement illustration from primitives. Production masters are included in source, excluded from the playable export.

The first reed master was rejected for an elevated silhouette and remains explicitly named rejected. A runtime comparison also rejected quarter-turning the retained narrow moss painting: it looked like upright leaf columns. Final moss keeps its established orientation. These are corrected candidates, not approved final-art claims.

## Current evidence

- `overhead-flora-world-proof.json`: exact natural saved checkpoint under baseline/current renderers at 800×600; the entire timestamp-normalized serialized simulation matches. Real movement uses the animal actually stored in the simulation. Normal and close views and curated recordings accompany the receipt.
- `overhead-flora-interaction-proof.json`: before/current real browser mouse selection, radial Inspect, inspector close and E feeding for all five resources. The exact selected stock decreases, positive food energy is recorded and the radial closes. Four foods use naturally present finite resources. Fungi use a documented finite `.6` stock and `.3` substrate fixture because fresh founding fungi are below ordinary visibility. Body, adult reserves and placement are controlled. This does not demonstrate natural fungal growth or adaptation.
- The same browser harness installs valid inherited thin/default/thick pod-coat fixtures through the canonical genotype registry, captures four season states, and verifies stock, genotype and body save/load parity. Those fixtures do not prove natural evolution or reproductive success.
- `overhead-flora-focused-tests.json`: 17 focused suites pass, covering art states/caching, visual selection, shared action states, water filtering, inherited coats, plant handling, finite tissue/propagules, seed codec, botanical genetics/reproduction/safety, saves and native catalog loading. The shoreline regression explicitly verifies foreground plant selection, depletion exposing water and read-only picking.
- `overhead-flora-render-profile.json`: four alternating unrecorded natural initial-world browser runs measure renderer CPU command time. Mean renderer CPU time averaged 9.040 ms before and 8.924 ms after; the small difference is not treated as a demonstrated speedup. These short observations do not establish dense-world performance, GPU latency or first-ten-minute engagement.

Selected, inspector, coat, season and natural-world screenshots were inspected as complete 800×600 game views. Automated workflows and the creator's positive direction feedback do not establish first-time human usability or blanket visual approval.

## Remaining work and next milestone

Large background habitat reed fans, thickets and some ground signatures still retain older procedural artwork. The new canonical resource sprites should not be mistaken for completion of every environment layer. Dense resource patches can still repeat conspicuously; broader environmental composition needs separate review. Natural courtship, generational handoff, large-world performance and human playtesting remain open. The historical fixed-bound fallback `creature-assembly` failure remains a separately reproduced baseline limitation; this pass does not alter it or weaken its assertion.

Next substantive visual milestone: replace the remaining elevated background vegetation signatures with grounded overhead structure using actual habitat/resource authority, then review creature visibility through those patches. Physical-mass calibration and swimming/save migration still require their separate creator review. No consequential biological changes are authorized by this art pass.
