# E5: Readable inherited cover at actual 32px gameplay scale

## Why this pass exists

The E4 Chromium review [run 39175653200](https://github.com/jacktheclown91/GenVo/actions/runs/39175653200) proved that all 85 native 32px parts load and that the six E3 body types mount and render through eight facings. It also showed the three cover states were difficult to distinguish on the real creature at normal gameplay scale. E5 changes the **art and mounting footprint only**; it is not an expansion of statistics or available abilities.

## Three different inherited silhouettes

- **Filament tuft** remains sparse and narrow, with nine visible hair filaments and minimal filled tissue. It visually represents an evolutionary precursor, not finished thick insulation.
- **Fur mantle** is a continuous broad shaggy perimeter beyond the torso, with 24 discontinuous guard-hair tips, underfur and warm light accents. Its silhouette is deliberately rounded and thick.
- **Feather mantle** has five separate tapered quill rows on each side, visible cross-barbs and bright distal tips. Its lateral tooth-like contour differs from the furry halo, and does **not** represent wings or lift surfaces.

Both the original native source and the separate procedural/editor fallback silhouettes are improved. For the **existing three cover parts only**, the overhead dorsal native footprint increases (filament 0.42, fur 0.51, feathers 0.48, versus earlier 0.31). Every other dorsal/body part keeps its original scale and appearance. No anatomy sockets, skeletons, physics, collision, energy, animation scheduler or RNG changes are introduced.

## Canonical art/provenance process

`tools/polish-e5-cover-art.mjs` accepts only a **complete unmodified E4 art state**: checks the source SHA256 recorded in the canonical catalog before re-authoring, refuses mixed versions and overwrites only those same three previously existing art parts. It creates original native **32×32 RGBA** source, sixteen eight-direction/two-frame animations per part, exact canonical indexed-codec output, actual PNG previews and updated SHA256 entries. If already installed, it is idempotent. Source files explicitly say *AI-assisted procedural art, creator review pending*.

The GitHub workflow installs the verified native assets only on the **E5 feature branch** after the E5 source silhouette tests, all previous native/editor/physiology/woodland contracts and real Chromium game startup/render captures pass. The normal art registry still has 85 parts. Browser captures are retained as review evidence, not an assertion of creator art acceptance.

`tests/e5-coat-readability.mjs` adds native mask area and difference checks, all 48 exact full-RGBA source frames, catalog SHA, genuine animation, fallback geometry, socket footprint boundaries, and unchanged three physical insulation factors. Existing E4 source tests and unchanged full fast suite (including original 500 ms observer-play ceiling) still run.

## What is and is not delivered

This is a **physical part-readability and native art-source milestone**, not more biodiversity rules, completed fur physics, AI-native 3D animal rendering or side views. No climbing elevation, flight, new genotype unlocks, forests beyond E2, continents or page transactions are added. The finished scene should be reviewed at normal zoom to determine whether the silhouettes are now adequately recognizable; even a passing automated browser pixel check is not automatic creator approval.

The original E4 browser boot and new E5 browser script both capture complete real GenVo world renderings and a mounted-anatomy sheet. E5 keeps all draft PRs stacked and does not merge `main`.
