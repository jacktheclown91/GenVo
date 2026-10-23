# Inherited portrait color and shared bounds handoff

Creator-selected coordination: checked-in handoff and patch. Codex leaves shared renderer/UI files unchanged in canonical source. The proposed code is verified in an independent public export and an isolated regression copy.

## Integrate coherently

1. Check `git apply --check docs/art/portrait-v1-handoff/coordinated-source-integration.patch`, then review/apply it in a normal integration commit. It includes the pending journal and first-young layouts, their current capacity-notice handling, and the portrait renderer/data-forwarding fix. **Use it instead of applying the older journal/young shared-source patches separately.** It does not include menu, Lab or specimen activation.
2. Check/apply the narrow index link patch with `git apply --check --unidiff-zero docs/art/portrait-v1-handoff/index-integration.patch` and `git apply --unidiff-zero ...`. The flag is required because trailing context is omitted. Do not duplicate links already integrated through other work.
3. Run the nine focused checks in the evidence packet and public-export, then capture the integrated game. Consolidate superseded presentation styling through the shared owner. Do not overwrite newer shared-source work; regenerate/review the proposal if a check fails.

The renderer takes the already-retained pigment genome and uses canonical phenotypeFor plus creaturePalette RGB. The old HSL path could not supply a valid indexed skin ramp, leaving authored green in place. No color loci, genes, inheritance, physical capabilities, reproductive events, saves or migrations change.

Known retained pigment is forwarded for conception parents, offspring, family records, resident starts, successor choices and generation reveals. Missing pigment stays on the established legacy-gene expression path; no living parent's current genome is substituted for a missing conception field. Existing body-plan compatibility fallbacks remain unchanged and are not proof of unknown historical anatomy.

A bounded 128-entry cache shares the same reconstructed reading and full-gait bounds between comparison fitting and portrait drawing. Cache keys include every supplied visual input and the native-art revision, preventing stale pre-load extents. Returned bounds are frozen; private cache entries never expose source-state references. Read-only cache statistics support verification. The actual game/simulation is not cached or skipped.

## Reproduce

`node tools/stage-portrait-presentation.cjs <empty-output>` composes the exact proposed renderer, forwarding and pending journal/young layouts into a public export. `--baseline` keeps the old portrait path for before evidence. Shared source is never rewritten by staging. The renderer template is under tools/presentation for review only; once integrated the canonical src renderer remains the one runtime implementation.

`node tools/review-natural-history-young.cjs <new-evidence> --exported <build> --portrait` starts an ordinary PLANET-B0-A world, uses public AUTO/native speed and Keep old body, and waits for a genuine litter. It matches actual opaque skin pixels against the live newborn/retained conception genome palettes, checks full canonical snapshot parity, cached bounds reuse, native dismissal and the real Family Journal. Baseline review adds `--expect-old` and records the defect without pretending it passed the new color contract.

The selected review build is `C:\Users\jackt\AppData\Local\Temp\genvo-portrait-v1-web-20261023-candidate`. [Evidence and limits](../../art-refinement-portrait-v1-2026-10-23/README.md). Shared activation, all-body visual acceptance, complete performance review and full v1 completion remain pending. Review assets/templates and historical evidence belong in the original development archive until the clean-source owner classifies them.
