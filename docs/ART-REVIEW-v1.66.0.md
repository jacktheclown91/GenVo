# GenVo native-32 art review — v1.66.0 development

**Status: preview pass, not creator-approved replacement of the full library.**

The canonical authoring rule remains: one anatomical part, one registered ID, immutable inheritance/biology from the lineage registry. Original human Pix2D/GIF files are unchanged and are reference material.

## Added in this pass

- 14 **AI-assisted, hand-specified static source pixel designs** in `assets/art/parts/`, each with two native frames across eight discrete directions (224 validated frames in total). These are a first review wave of eye and mouth anatomy: `simple-eye`, `stalk-eye`, `compound-eye`, `hunter-eye`, `tracker-eye`, `glow-eye`, `wide-field-eye`, `grazing-mouth`, `tearing-jaw`, `crushing-jaw`, `kernel-beak`, `reed-sieve-mouth`, `filter-mouth`, `nibbler-mouth`.
- Static identity RGBA frames and a semantic five-shade skin ramp plus protected RGB details. No filtering, resampling, or runtime generation of source pixels. The compiled indexed renderer is now reached through the official runtime art catalog, not duplicated.
- Gameplay selects the native frames for those 14 IDs at eye/mouth attachment points. All other 64 registered parts retain their earlier procedural drawing, including **every torso and limb**, which require coordinated joint/attachment and size alignment before release.
- Authoring lab offers the native source images alongside the procedural fallback with source-type labels, facing selection, editable frames, compiled assembly preview and export. Exporting a draft or compiled JSON **does not** auto-write the game files: this requires explicit installation/review via project tooling; browser storage alone is not a build. Browser-local drafts are not release art.
- Menu pass: improved keyboard focus, native control arrow keys, and minimum 42px world-save actions.

## Remaining visual and technical acceptance

- Creator review of anatomy silhouettes and native 32px shading, human-origin stalk-eye and fang design reconciliation.
- Normal-camera inspection in the game's actual movement and courtship, plus screenshots of every facing and functional variant.
- Inherited pigment ramp binding: codec preserves details and alpha, but live installed assets currently use the source identity palette. Full per-individual color binding and authored material masks are NOT delivered by this pass.
- Independent torso geometry, legs with planted hip/knee/foot joints, tails, sockets, layer/mask occlusion, shared pose coordination and material/skin overlays.
- Validation of edited artwork's native positions and direction frames before install. Do not claim all 78 parts are authored.
