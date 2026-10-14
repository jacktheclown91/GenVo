> Tool-only authoring workflow. This does not replace the live procedural part-art renderer unless a draft is explicitly reviewed and installed. See ../../docs/CANONICAL_SOURCE_AND_ART.md.

# GenVo8 Creature Development Lab

Open `/tools/creature-lab/index.html` through the toolkit's local web server. This developer workshop imports the game's actual part registry and standalone procedural part drawing. It has no link from the public game and must be excluded from release packaging. Release-package exclusion has not yet been verified against a newly built ZIP.

Milestone 1 slice: searchable registered attachment parts, exact embedded 32×32 bitmaps from SoftBody/SmallBody/SleekBody Pix2D sources, pixel paint/eraser, stroke undo/redo, strict 32×32 PNG import, validated authored JSON import, browser-local drafts, downloadable raw RGBA JSON and transparent PNG. Saved drafts are separate assets; original Pix2D and procedural source are untouched. Browser storage is not a filesystem project save; use export for portable files. Reference extraction receipts preserve source and bitmap checksums. Embedded bitmaps are not flattened Pix2D scenes; original visibility/layer metadata stays in original files. Existing red painted anchor dots remain source pixels until explicitly edited.

Next milestone: color-coded labeled socket overlays and assembly through canonical body-plan validation. Then part-owned joints/animation and actual coordinator previews. Then palette-region/material authoring and renderer/game registration with shading and frame preservation. These systems are not yet implemented. GIF import, multi-frame editing, authored procedural torso export and full Pix2D scene import also remain incomplete.

Socket overlay foundation is now implemented: choose Socket markers, select a registry type, enter a name/orientation, and click the artwork. Select a listed marker to move/change it; New marker starts another. Remove, undo/redo and JSON import/export retain socket metadata. Markers use a separate SVG layer and never alter the pixel canvas or PNG export. Coordinates are integer source pixels (0–31), orientation is degrees (-180–180), and current connections accept the selected type with a single connection. Assembly through canonical validation remains pending; authoring a marker does not register biological anatomy.

Registered-part assembly is now available below the pixel editor. Choose a root body, select a provided connection and attach/replace a registered part. The canonical body-plan validator rejects incompatible connections and capacity violations; edits leave the previous valid design intact on failure. Removal, undo/redo, native body-plan JSON export/import and complete creature preview share game definitions and rendering. Developer assembly is unrestricted by lineage ancestry/budgets; the player's editor rules are unchanged. Custom artwork/socket drafts are not yet cataloged and cannot be connected here. Joint motion and authored appearance integration remain pending.

The assembled preview includes color-coded connection guides derived from canonical `genvoAnchors`. Click a guide or focus it and press Enter/Space to select the matching attachment connection. Type and socket names appear in accessible labels and the selected-connection text. This overlay is separate from the creature canvas and exported body plan. The pixel editor and assembled preview share the same type-color legend.

Action preview offers idle, walk, eat, drink, court, flee and hunt poses through the game renderer, eight facings, frame scrubbing and an eight-frame playback loop at eight frames per second. Pause freezes the loop. Static attachment guides appear only for paused idle preview; they are hidden during motion because they are editor anchors, not animated joint tracking. Preview poses do not change the saved anatomy, advance a game simulation or authorize biological capabilities. Joint-curve authoring and physical expression-signal testing remain pending.

Draft schema `genvo8.lab.authored-draft/1` stores 4096 exact RGBA bytes, source metadata and currently empty socket/palette fields. A draft is not automatically approved, anatomically registered or game-ready. Human input controls pixel edits; generated procedural starting pixels are identified as procedural.

### Multi-frame authored drafts
Artwork frame controls duplicate, select and delete up to 64 independent 32x32 RGBA frames. Undo/redo includes frame edits and socket metadata. Draft schema /2 exports every frame and the selected index; legacy /1 imports as one frame. PNG exports only the selected frame. Browser save remains browser-local. GIF decoding, frame timing/playback, palette region editing and game registration remain pending.

### Authored playback
Play artwork previews a snapshot of the current authored frames on a separate pixel canvas. Pause freezes that preview; editing remains independent. Uniform frame duration (16–5000 ms) is saved in /2 drafts, with 125 ms for older drafts. Playback never modifies source pixels, selected editing frame or socket metadata. Restart playback to include subsequent edits. GIF decoding, per-frame durations, authored anatomy registration and joint editing remain pending.

### Palette substitution preview
Explicit RGB tone membership uses the canonical indexed-art codec across all draft frames. Add source colors darkest to lightest; choose a replacement for every shade. Unselected colors and all alpha values stay protected. Tone pairs persist in draft paletteRegions with undo/redo. Preview is separate from source pixels; final palette asset export and production inherited-palette binding remain pending.

### Recolored motion and strip export
Use palette in playback applies the current explicit shading ramp to a snapshot of every animation frame. Export recolored PNG strip writes native 32x32 cells from left to right (one row), without guide overlays. Keep authored JSON alongside PNG for source frames, sockets and timing. Browser PNG is a presentation export; transparent hidden RGB identity remains authoritative in JSON. Named regions, GIF import and production appearance binding remain pending.

### Source color sampler
Select Sample color and click artwork to copy its exact visible RGB tone into the Paint picker. Status reports pixel coordinates and alpha. Sampling changes neither pixels nor undo history. Fully transparent pixels are ignored. Use Add paint color as source tone to include the sample in the explicit shade ramp.

### GIF frame import
PNG/GIF/JSON importer now decodes every frame of native 32x32 GIFs through browser WebCodecs ImageDecoder. Limits: 8 MB and 64 frames; unsupported browsers report unavailable decoding. GIF composited pixels and per-frame native durations are retained in editable draft JSON. Frame duration editor applies to selected frame; playback respects individual durations. GIF source files remain untouched. Decode output represents browser composited frames, not original encoded palette/hidden transparent RGB bytes.

### Authored root pivot
Root pivot tool places a white crosshair at the clicked pixel center. rootAnchorPx persists independently from sockets and pixels, including undo/redo and JSON import/export. Older drafts default to (16,16). This is authored attachment metadata, not yet a registered biological joint or physical motion definition.

### Root joint preview
Authored rootJoint minDegrees/maxDegrees limits include neutral zero within ±180 degrees. Save joint limits stores metadata with undo/redo; preview angle rotates selected source frame around rootAnchorPx on a separate padded96x96 canvas. Refresh after editing artwork/pivot/frame. Angle is clamped to limits. Source pixels/exportPNG remain native. Coordinated joint curves and game rig binding remain pending.

### Creator reference colors
Attachment guides now match supplied reference: limb cyan, eye amber, mouth red, tail purple, dorsal yellow, flank pink, spur green. Text legend retains accessible type names/descriptions. Five example biological shading role swatches (Outline, Shadow, Base, Light, Highlight) match reference RGB and select paint color without modifying existing artwork. These are example ramps, not forced inherited hues.

### Animated joint inspection
Play artwork now advances both authored pixel playback and its joint preview. The preview snapshots pivot, limits, angle, palette and per-frame durations at playback start. Pause freezes both; restart to capture later edits. This combines frame animation with one fixed inspection angle, not joint keyframe authoring or coordinated organism motion.

Per-frame joint angles: drafts store `frameJointAngles` alongside pixel frames and durations. Duplicate/delete and undo/redo keep the arrays aligned. Enable “Play authored joint angles” to preview the sequence; playback clamps angles to the authored joint limits without changing source pixels. Older drafts default to neutral angles. This remains lab authoring metadata pending game binding.

Catalog compilation: explicitly choose a registered biological part, action and facing, then export indexed catalog artwork. Native RGBA, explicit pigment membership, durations, pivot and frame joint angles are compiled and checksummed by the shared renderer codec. This does not install or activate the asset in gameplay. Unselected RGB values remain protected.

Shared indexed renderer: `prepareIndexedPartRenderer` prepares palette-specific frame canvases once, selects authored frames by their durations, draws around the native pivot and clamps authored joint rotation. Missing action/facing returns false, allowing the integration caller to retain procedural fallback. Lab compilation now shows this renderer's first-frame preview. Whole-creature/game binding remains pending.

Whole-creature binding now accepts `authoredParts` (prepared renderers by registered part ID) and `authoredTimeMs` in `drawGenvoSprite`. Explicit eye/mouth anchors use native pixels at half the procedural logical scale. Missing action/facing keeps procedural art. Sprite caching is bypassed for supplied authored renderers until a complete asset/palette/time cache identity is implemented. Lab compilation installs the prepared renderer into the current assembly preview only; biological plans and exported source assets are unchanged. Other attachment kinds, game loading and final visual proportions remain pending.

Display scale is authored metadata (0.0625–4, default 1), persisted in drafts and compiled asset identity. It multiplies presentation size around the native pivot without editing or resampling source frames. Undo/redo and JSON import preserve it. Compile again to update the assembly preview.

Assembly preview artwork can be inspected by registered-part binding names and removed with Restore procedural artwork. This clears prepared art only; anatomy, plan history and exports stay unchanged. Connection guides can be hidden for unobstructed art review.

### v1.66 installed art and editing workflow

The native index catalog now feeds **14 eyes and mouths into actual gameplay**. Open the Lab via the toolkit server, select a `native review · 32 px` part, choose one of eight facings and edit the two native frames. Use **Preview edited artwork in assembly** without exporting or overwriting files. Save your draft to browser storage for temporary work, and **Export authored JSON** to preserve exact pixels and timing outside that browser.

To publish after review, run from the source root:

```sh
node tools/install-native-art-draft.mjs "/path/to/exported-draft.json" stalk-eye 2
node tests/native-part-catalog.mjs
```

`stalk-eye` is the existing registered part ID, and `2` is east facing (0=N, 1=NE, 2=E, etc.). The installer validates 32×32 pixels, edits only the selected facing in the existing source pack, builds the indexed runtime representation, and refreshes its native PNG and manifest. Do not manually merge arbitrary GIFs or resize art. Installation requires a developer-controlled source tree; browser drafts cannot rewrite packed ZIPs. `Original (human) arts/` is immutable reference material.

**Limitations:** Published native assets still cover just 14 eye/mouth parts; all torso, limb, tail, surface and most other attachments remain procedural and need properly anchored/riggered native art. Dynamic inherited in-game recoloring is not yet applied to installed native pixels. This art is for creator review, not approved release art.

### v1.67 native bodies and rigged limbs

Nine torso art candidates and eight jointed limb candidates are now selectable in the same Lab. For a limb sheet the left region is upper leg, the right region is lower leg; colored source-section boxes and endpoints are guides, not source pixels. The existing body-plan gait determines hip, knee, and foot; edit the two native regions independently, preview a full creature using Preview edited artwork in assembly, then export JSON for explicit reviewed installation. `tools/install-native-art-draft.mjs` validates color and pixel geometry and retains the rig. Editing or creating new rig section bounds through the Lab GUI is not yet supported. For tests and limitations see `docs/ART-REVIEW-v1.67.0.md`.
