# Continuous native knee tissue

The native limb renderer transformed thigh and shin as separate strips. Matching transverse width prevented wires but still exposed sharp fitting seams at flexed knees. Existing authored insertion pixels now bridge those projections at the actual animated knee.

## Integrated changes

`src/render/indexed-part-renderer.js` samples a shaded insertion after the two bones, with shared isotropic tissue width and the exact facing/phase/inherited pigment canvas. There is no new gait, creature template, physics rule or anatomical capability. Supplied root/knee/foot positions stay unchanged. Eight existing limb source packs declare an optional native `jointSurface` rectangle/anchor, propagated into compiled runtime assets and catalog hashes. Original RGBA frame pixels, feet, claws and webbing are unchanged. This improves assembly of existing native tissue; it does not claim 128 newly painted frames.

`src/render/indexed-part-art.js` validates the sampled surface inside its owning upper section and requires a valid anchor. Older packs without the field retain the original two-bone draw. Original human artwork, saved genomes and gameplay physiology are preserved.

Tests preserve both bone transformations and explicitly require the third knee draw. New 384-case coverage spans eight limb types, eight facings, two support/recovery frames and three flex/projection shapes. Exact native frames, immutable contacts, matching frame/pigment canvas, allocation-free prepared drawing, compiler boundaries and legacy pack fallback are checked. Existing 256 whole-body ground-support cases still pass. `reports/joint-surface-before` retains exact comparison fixtures, not another branch or source authority.

## Real runtime and observed cost

Paired real Chromium 800x600 game runs contain ordinary initial-world observations plus seven controlled valid whole bodies: walking, runner, sturdy, spring, webbed, mixed eight-limb and juvenile. Actual keyboard movement, displacement/energy and snapshot continuity are verified. Both natural observations contain 196 living animals, 75 ticks, zero births/deaths, no browser errors and exact anatomy/genetics/freshwater save parity. These short observations do not prove natural reproduction, long-run ecology or human comprehension.

Before/after game screenshots and recordings use the `joint-surface-` prefix. Fixed whole-body pose boards at ordinary and enlarged scale supplement game proof; they are rendering fixtures. Inspected spring and mixed-body game frames and both boards. Flexed insertions look more connected at enlarged scale; ordinary-zoom improvement is modest. Some silhouettes still look like segmented fittings. Broad visual quality remains unfinished and creator approval remains open.

Four alternating unrecorded normal-world profiles show mean CPU command time 7.644 ms before versus 8.018 ms after: approximately +0.374 ms / 4.9 percent. Roughly 25.6 visible creatures are drawn per frame with the existing cache. This is observed extra drawing overhead, not a speed gain, GPU-latency measurement or dense-world performance acceptance. Video-encoding measurements are separate and noisier.

## Remaining work

No calibration coefficients, migration decisions, birth rules or aquatic access changes were activated. The tissue foundation remains draft-only pending numerical/migration review. The broader goal stays active. Next creature milestone: expressive eyes/head attention and anatomy-specific encounter reactions readable at ordinary zoom. Matching source/web releases follow integrated tests and exported HTTP game/Lab verification; screenshots are not human visual approval.
