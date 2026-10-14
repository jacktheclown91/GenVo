# Dorsal jaws and funded feeding articulation — October 14, 2026

This continues the creator-approved overhead direction. Four existing modular mouths now have dorsal source paintings prepared at native 32×32: tearing jaw, crushing jaw, gape mouth and tusk jaw. No creature templates, capabilities, genes, diets, costs, resource rules or physical coefficients changed.

## Player-visible changes and source

Tearing jaws have a muscular cutting end, crushing jaws a blunt grinding edge, gape mouths an elastic toothless rim, and tusk jaws paired forward tusks around a small working lip. Each has distinct resting/active paint and eight world-plane facings. The prior frontal tooth rows and hanging gape tongue are removed from these runtime sources, with originals preserved.

`src/render/indexed-part-art.js` validates and checksums optional `expressionScale: fixed` metadata. `indexed-part-renderer.js` exposes it; `part-sprites.js` respects it instead of enlarging the entire mouth during processing. Other art retains its existing pulse behavior. Prepared active frames retain rear cheek pixels and fixed ivory tusks; only generated working-end tissue changes.

A real animation gap was also fixed: grinding uses action `crack`, while native opening previously recognized `eat`. A cracking creature could move its head without showing its active mouth frame. `src/render/feeding-expression.js` now supplies an opening signal from the existing funded processing pose. `genvo-draw.js` dispatches it, closes through reach/settlement, and preserves call/attack priority. Invalid, expired or interrupted meals supply no signal. This presentation code performs no feeding itself.

The four `assets/art/parts/*.json`, indexed and preview packs plus `catalog.json` are updated. Masters and exact built-in imagegen prompts are preserved under `assets/art/production-review/overhead-jaws-v1/`. `tools/prepare-overhead-jaws.py` records crop bounds, hashes, native dimensions, alpha threshold 128, nearest sampling, palette mapping, fixed attachment and tusk handling. These are mechanically prepared paintings and planar rotations, not eight independently painted views. Original human art and exact comparison sources under `reports/overhead-jaws-before/` remain preserved.

## Actual browser evidence

All controlled trials use the real Chromium game at 800×600. Fixtures supply complete valid bodies, location/reserves and target placement. Actual controllers, costs, extraction and outcomes run afterward; this is not natural evolution or human testing.

- Four bodies, each with eight actual rendered headings before/after. The harness asserts actual actor identity/heading, fixed camera, body/genetics/tick continuity and subsequent keyboard movement. [Current proof](overhead-jaws-views-after-proof.json), [baseline](overhead-jaws-views-before-proof.json).
- Mouse Attack produced windup/recovery, charged exertion and held-key defense for all four bodies. Before: four hits. Current: three hits and one crushing-jaw miss. These wall-clock outcomes were not forced and are not a deterministic balance comparison. [Combat receipt](overhead-jaws-combat-proof.json), [recording](overhead-jaws-after-runtime.webm).
- E-driven crushing/tusk meals consumed finite natural pod stock and showed reach/process/settle. A read-only capture hook records actual native frame dispatch: baseline cracking remained `[0]`; current cracking renders `[0,1]`. [Feeding receipt](overhead-jaws-feeding-browser-proof.json), [recording](overhead-jaws-feeding-after-runtime.webm).
- Tearing/gape bodies reject those pods with “A compatible fruit or pod feeding mouth is required.” E leaves the stock unchanged. The first capture incorrectly expected a tearing jaw to eat pods; the baseline rejected it. The corrected check explicitly verifies rejection rather than altering diets or weakening a success check.
- A separate untouched 30-second normal-speed initial world had 196 living animals, including 12 tearing-jaw and eight gape-mouth organisms. None entered the player viewport. [Natural observation](overhead-jaws-natural-proof.json) says `NO_REVISED_JAWS_VISIBLE`; no favorable encounter or nearby animal was manufactured.

Actual game crops: [tearing before](overhead-jaws-views-before-tearing-jaw-eight-views.png), [tearing after](overhead-jaws-views-after-tearing-jaw-eight-views.png), [tusks after](overhead-jaws-views-after-tusk-jaw-eight-views.png). Full-size screenshots and recordings are retained alongside them.

## Verification and remaining work

All 18 focused checks in [the test receipt](overhead-jaws-focused-tests.json) pass: 96 fixed attachment/pulse/facing cases, funded opening/closure, codec/hash fallback and legacy defaults, exact native pixels, controller parity, feeding, Lab and saves. The catalog remains 79 parts / 1,264 frames. Line-ending cleanup retained every current code character and exact local safety copies; no working implementation was reset.

Large tusks and silhouettes are clearer than fine internal shading at ordinary zoom. Tearing/crushing details remain subtle, and two-state articulation is limited. This is not final art acceptance, human usability, natural encounter readability, dense-world performance or natural-generational verification. The previously documented fixed-bound fallback assembly failure remains unresolved and is not counted among passing checks.

Next visual milestone: dorsal courtship/display structures, then consistent overhead plant canopies and stems. Preserve source identity, anatomy and reciprocal courtship authority. The full development goal remains active.
