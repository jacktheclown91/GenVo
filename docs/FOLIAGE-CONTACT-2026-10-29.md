# Size-aware foreground foliage contact

Implemented existing foreground-fringe response for modern body-size/2 worlds using canonical current developmental size and contactReach. A3x adult reaches2.3 tiles at the reference1.15 contact base; a juvenile uses its actual smaller growth scale. This is cosmetic contact, not a new physical footprint or collision authority.

Only biologically visible, alive, surface-grounded animals contribute. Airborne, perched, climbing, underground and submerged bodies are excluded. Overlapping bodies select the strongest normalized contact. The field reuses up to32,768 cell references plus a Float32Array (128KiB at its bound), with the historical grid as oversized-view/old-policy fallback. No new images or per-frame asset generation. Flexible fringe paint alone changes; biomass, topology, movement, interaction events and saves remain canonical.

Two defects were found during native verification and fixed before commit:

- The renderer's signed tile hash folds into the lower half of the numeric range. Bramble/moss foreground branches above.67/.72 could never draw. A local unsigned deterministic hash restores these existing branches across worlds; other terrain hash consumers are unchanged. This is a visible legacy-world correction as well as modern contact support.
- Foreground paints before the actor batch, when screenPos is empty. VisualMotionTracker.positionAt now reads the same interpolated position without advancing motion, gait or travel state. Player prediction is read directly. Layer order stays intact.

Focused checks pass: canonical1/1.5/2/3 reach and growth; grounded/visible exclusions; strongest overlap; off-center contact; bounded reused storage; legacy reference release; complete saved graph parity; unsigned density range; side-effect-free pre-batch position parity. Existing motion-render, player-motion-presentation, hierarchy, depth-render, architecture, canonical-source, syntax and configured whitespace checks pass.

## Native evidence and limits

final-detail/ uses public New World and keyboard movement in AUDIO-RAIN-3. Four visible actors produced24 probes and16 contact cells. The full new-world and recorded mature-valley saved graphs remain exact. Browser errors are empty. Ordinary new-world capture starts at actual night in rain and is not a clear daylight acceptance frame.

The size sheet uses view-only1/1.5/2/3x adult clones over genuine unchanged mature-valley plant stocks. An explicitly isolated modern-policy view adapter enables comparison without migrating the recorded save. This is not four physical simulated size cohorts or naturally evolved giants. Fixed reach and Size-aware rows both use the corrected foreground hash: they isolate contact reach, not the entire pre-change renderer. The enlarged native detail has0/0/0/600 changed pixels across1/1.5/2/3x columns (5x nearest-neighbor enlargement,24 native pixels at3x). The visible response is subtle;2x has nonzero contact strength but rounds below a visible bend at this chosen cell.

Two short warmed native comparisons were noisy: final/ fixed/current medians8.2/6.1ms, final-detail/6.8/7.6ms,18 samples each. These are no general performance improvement or mature-world performance acceptance. The unchanged recorded terrain in the controlled study is not a full populated mature-world benchmark.

Earlier failure receipts/captures are retained. Initial field studies found no fringe; diagnostic instrumentation proved13,439 candidate tiles but zero paint calls, revealing the unreachable hash thresholds. A subsequent failing assertion exposed the pre-batch empty screen-position map. Both were implementation defects diagnosed by the focused native checks, not reasons to fabricate plants or weaken assertions.

C1-C8 remains active. Natural mixed-size fields, giant physical collision/layering, broader habitats, coherent whole-organism artwork and comprehensive/creator acceptance remain open and require continued work with Claude.
