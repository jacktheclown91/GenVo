# Natural-history menu candidate and shared-file handoff

**Current integration:** the prepared changes are applied in runtime source. The instructions and patches below preserve the pre-integration proposal; do not reapply them to active source. Build the current game with `node tools/export-public.mjs <new-empty-directory-outside-source>`. Proposal staging tools intentionally reject already-integrated source. See [integrated evidence and remaining limits](../../art-refinement-interface-v1-2026-10-23/README.md).


## Original proposal (historical)

Codex owns the visual assets and styling in this pass. Shared source `index.html`, `styles.css` and `src/ui/front-end.js` is unchanged. The creator selected checked-in handoffs and patches as the coordination channel.

## For Claude

1. Review this candidate, then check both patches against your current shared source:
   - `git apply --check docs/art/menu-v1-handoff/index-integration.patch`
   - `git apply --check docs/art/menu-v1-handoff/front-end-labels.patch`
2. The first adds one stylesheet link after the existing styles. The second changes presentation text only: the recorded-world choice shows Recorded lineage, and checkpoint titles show the actual catalog day (31/101). It changes no selection values, control events, founder creation, inherited bodies, saves or simulation policy. Please integrate through normal commits when shared-file ownership is clear.
3. The CSS is scoped under `#frontEnd`. New icons and portraits sit under `assets/ui`, included by the existing public exporter. No exporter changes or external dependencies are required.
4. Run the browser review and stage a real candidate build with the tools below. After canonical integration, inspect the actual game again. Candidate evidence is not a claim of canonical activation or creator approval.

## Implementation

The home menu uses restrained cream/gold typography and original botanical line icons over the real living-world background. The New World sheet separates creature selection and recorded starts, with clear selected/focus states. At desktop/laptop sizes Begin World is visible without scrolling; smaller windows scroll normally. Advanced choices and legacy/movement policies remain available. Reduced-motion preferences are respected.

Five transparent 112px selection illustrations are generated from the current canonical native creature assembly and exact guided starter plans, not fixed whole-creature replacements. The manifest records a deterministic representative founder's genes and exact body plan; these are authored-start illustrations, not a claim about the future world's actual pigment or natural evolution. Existing sprite provenance remains authoritative. Recorded-world selection uses a conceptual lineage icon instead of inventing a creature from that checkpoint.

SVG icons and the botanical emblem are original Codex-assisted vector work; CSS and authoring tooling are Codex-assisted. Existing creator artwork remains present and unchanged. No external art, font, license or paid dependency was added.

## Reproduce

- `node tools/prepare-menu-portraits.cjs` regenerates the five illustrations from real native bodies.
- `node tools/check-menu-presentation-assets.mjs` checks exact current starter-plan equality, distinct PNG hashes and local CSS dependencies.
- `node tools/review-natural-history-menu.cjs <new-report-directory>` uses the actual app and inspection-only CSS/text patch injection across 1920x1080, 1366x768, 1024x768, 800x600 and 390x844. It checks public creature/start selection, labels, target bounds, scrolling and requested assets. Screenshots still require visual inspection.
- `node tools/stage-menu-presentation.cjs <empty-directory-outside-source>` exports the actual game and applies the two prepared changes only inside that review build. It never edits canonical shared files or overwrites an existing nonempty build.
- `node tools/verify-menu-presentation.cjs <review-build-directory> <new-report-directory>` starts an actual world, selects via Space, waits for the native scene-readiness promise, completes public Enter onboarding and holds WASD. It does not freeze RAF or rewrite actor/world/action state.

The original repository remains the maintained source until Claude proves and performs the GenVo-v1 migration. That destination is not populated by this pass. Broad v1 completion, Creature Lab/journal/HUD styling, audio and creator acceptance remain open.

## Coordination update

Claude integrated the earlier terrain renderer patch in `d9c2e97`, demonstrating pickup of this checked-in handoff channel. This menu pass follows the same ownership arrangement.
