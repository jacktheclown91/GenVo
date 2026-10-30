# Actual organism studies in Creature Lab

The Field Journal's Inherited biology & record section now offers **Export for Creature Lab** when the selected recorded animal still has its modular anatomy. Import the resulting JSON through the Lab's existing **Import body plan or organism study** input.

The presentation-only `genvo.organism-study/1` file carries a cloned whitelist of the actual animal's body plan, genes, pigment genome, inherited size, species, age, mass policy and existing appearance readings, plus source seed/day. It is not a save or a route for changing Simulation. The importer uses canonical plan/size/mass validation and never creates missing inheritance. Historical records whose organism anatomy is unavailable do not acquire invented bodies or conception sizes.

Lab previews now retain actual inherited pigmentation, scale the complete rig by the authoritative adult length, and retain canonical developmental proportions. Age controls remain the existing 0-100% of maturity study: an imported adult or elder starts at the adult endpoint; the original chronological age remains in the study data. No new growth curve exists. Default body-plan-only imports retain reference size and the existing workflow.

Pinned references preserve their own organism reading and age, instead of borrowing the current body's size or colors. Shared framing uses the larger adult bounds for both specimens. Guides use the same local-to-screen size transform as the painted rig. Adult-length labels remain visible above each specimen. Short-window previews now keep useful canvas space and allow page scrolling. Local assembly edits and body-plan exports remain isolated workshop operations and do not unlock game mutation.

## Verification

- `tests/organism-study.mjs`: actual sized Simulation animal roundtrip, matching full phenotype and physical dimensions, cloned data, canonical growth, unsized fallback, invalid formats/genes/ages/plans/sizes/mass-policy rejection and exact full saved graph.
- Existing journal, lineage comparison, integrated portrait pigmentation and Lab developmental tests pass. Architecture and canonical-source gates pass.
- `tools/review-organism-study.cjs`: public New World/onboarding/Journal disclosure/download, import into an isolated Lab browser, retained actual inherited data when pinned, all eight directions at32/64/128, newborn development and1440/1024/800 layouts. The second 2x study is explicitly controlled offline to expose shared-scale differences; no 2x evolved lineage is claimed.
- Final receipt/screenshots: `organism-study-2026-10-28/final/`. Native comparisons at128 and compact800 layout were inspected. The compact specimen canvas remains over150px. The first native failure was the review harness attempting a second page in Playwright's convenience-owned context; it is retained under `native`. Corrected runs use separate contexts. `verified` contains the earlier layout; `final` includes usable compact previews and visible size captions.

## Scope still open

This is a real game-to-Lab handoff and C7 preparation, not C7 or overall initiative completion. Recorded parent conception sizes are currently absent from lineage witnesses; do not borrow a parent's later living size to fill that gap. Coordinate new historical witnesses with Claude. Further evolution-panel size highlights, physically supported large populations/navigation, conditional structural requirements and mature-world integration remain open. Native32 remains the default/fallback; optional64/128 remain review candidates.
