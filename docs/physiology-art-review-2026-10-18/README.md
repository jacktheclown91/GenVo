# Expanded physiology artwork review

Status: runtime-integrated review candidates; creator visual acceptance remains open. These six organs already existed biologically. This pass supplies native artwork and connects wing deployment to actual rendered flight; it does not add biological powers or claim new evolutionary ancestry.

Parts: arid-pad, wax-plates, flight-wing, heat-frill, endothermic-core and mammary-gland. Catalog coverage is now 91/91 registered parts, with 1,456 exact native source/compiled RGBA frames. Source provenance identifies the new packs as AI-assisted procedural artwork pending review. Existing 85 native packs remain unchanged.

The arid pad uses the existing hip/knee/foot two-bone rig, so painted contacts follow real joints. The flight wing uses fixed-root dorsal panels: idle folds, actual fly action deploys and phase changes the stroke. Flank structures remain small skin-covered contours, rather than exposed internal-organ icons. Colors remain editable through the existing skin/protected-detail codec.

Reproduction: node tools/generate-e4-evolved-art.mjs --physiology (refuses existing catalog entries); node tools/verify-e4-browser-art.mjs --physiology (uses installed Playwright or the bundled desktop runtime). Existing E4/E5 capture tools now derive catalog count rather than waiting for the old 85-part milestone.

review.json records actual Chromium game startup, all 91 packs loaded, six legally mounted test bodies in eight facings, flight folding/stroke comparisons and zero page errors. all-evolved-parts-overhead-8-directions.png is a controlled in-game-renderer preview, not naturally evolved offspring. real-game-e4-world.png is the running world; it does not prove that these six organs evolved in that world.

Visual inspection: wings and frill have distinct silhouettes; the flank changes are intentionally subtle. Overall polish, readability at ordinary play scale, natural encounters and creator approval remain open. No claim of finished art quality or full player acceptance.

Focused tests passed: native-part-catalog, native-specialty-wave, E4 visual anatomy, E5 coat readability, E6 dryland biology, E8 powered flight, E10 cold/maternal physiology, behavior-readability and native-dorsal-display. Full integration receipt: docs/test-runs/expanded-physiology-integration-2026-10-18.json: 441 pass, four known failures, one observer timing failure (509 ms / 500 ms limit), 12 deferred, no timeouts/stale entries/input drift. The overall gate remains non-green.
