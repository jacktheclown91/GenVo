# 07 — Current Part Registry Inventory
**Source:** uploaded toolkit (README reports v1.59.0); *source snapshot only*, re-check newer builds.

- Registered part IDs: **72**
- Core/root torso IDs: **9**
- Registry families: **9**
- Existing socket types: **limb, mouth, eye, dorsal, flank, tail, spur**
- **IMPORTANT:** `animationProfile` and `jointChain` are code metadata, not proof of completed 32px sprites/independent animation rigs. Registered mass/upkeep are not necessarily active final gameplay balancing.

## Current count by family

| Family | Count |
|---|---:|
| `core` | 9 |
| `defense` | 10 |
| `feeding` | 9 |
| `limbs` | 9 |
| `locomotion` | 10 |
| `metabolism` | 5 |
| `offense` | 4 |
| `senses` | 12 |
| `social` | 4 |

## Current design IDs and recorded animation profiles

| Part ID | Family | Animation profile | Declared joints |
|---|---|---|---|
| `barrel-torso` | core | `breathing` | — |
| `dome-torso` | core | `breathing` | — |
| `light-torso` | core | `breathing` | — |
| `long-torso` | core | `breathing` | — |
| `reinforced-torso` | core | `breathing` | — |
| `sleek-torso` | core | `breathing` | — |
| `small-torso` | core | `breathing` | — |
| `soft-torso` | core | `breathing` | — |
| `stout-torso` | core | `breathing` | — |
| `armor-plate` | defense | `static` | — |
| `armored-hide` | defense | `static` | — |
| `barb` | defense | `static` | — |
| `dew-claw` | defense | `static` | — |
| `heel-spike` | defense | `static` | — |
| `horn-crest` | defense | `static` | — |
| `moss-back` | defense | `static` | — |
| `shell-back` | defense | `static` | — |
| `spine-cluster` | defense | `static` | — |
| `spine-ridge` | defense | `static` | — |
| `beak-mouth` | feeding | `static` | — |
| `crushing-jaw` | feeding | `static` | — |
| `filter-mouth` | feeding | `static` | — |
| `gape-mouth` | feeding | `static` | — |
| `grazing-mouth` | feeding | `static` | — |
| `nibbler-mouth` | feeding | `static` | — |
| `sucker-mouth` | feeding | `static` | — |
| `tearing-jaw` | feeding | `static` | — |
| `tusk-jaw` | feeding | `static` | — |
| `digging-forelimb` | limbs | `gait` | hip, knee, spade |
| `grasper` | limbs | `gait` | hip, knee, hook |
| `grip-pad` | limbs | `static` | — |
| `padded-leg` | limbs | `gait` | hip, knee, pad |
| `runner-leg` | limbs | `gait` | hip, knee, foot |
| `spring-leg` | limbs | `gait` | hip, knee, tendon, foot |
| `sturdy-leg` | limbs | `gait` | hip, knee, foot |
| `walking-leg` | limbs | `gait` | hip, knee, foot |
| `webbed-leg` | limbs | `gait` | hip, knee, web |
| `balance-tail` | locomotion | `sweep` | — |
| `club-tail` | locomotion | `sweep` | — |
| `fat-tail` | locomotion | `sweep` | — |
| `flag-tail` | locomotion | `sweep` | — |
| `gill-slits` | locomotion | `static` | — |
| `gliding-membrane` | locomotion | `static` | — |
| `paddle-tail` | locomotion | `sweep` | — |
| `prehensile-tail` | locomotion | `sweep` | — |
| `spined-tail` | locomotion | `sweep` | — |
| `whip-tail` | locomotion | `sweep` | — |
| `brood-pouch` | metabolism | `static` | — |
| `fat-pad` | metabolism | `static` | — |
| `sail-fin` | metabolism | `static` | — |
| `storage-sac` | metabolism | `static` | — |
| `water-hump` | metabolism | `static` | — |
| `claw` | offense | `static` | — |
| `hook-spur` | offense | `static` | — |
| `kick-spur` | offense | `static` | — |
| `venom-gland` | offense | `static` | — |
| `compound-eye` | senses | `static` | — |
| `display-eye` | senses | `static` | — |
| `echo-crest` | senses | `static` | — |
| `eyespot` | senses | `static` | — |
| `glow-eye` | senses | `static` | — |
| `hunter-eye` | senses | `static` | — |
| `sensory-bristle` | senses | `static` | — |
| `sensory-quills` | senses | `static` | — |
| `simple-eye` | senses | `static` | — |
| `stalk-eye` | senses | `static` | — |
| `tracker-eye` | senses | `static` | — |
| `wide-field-eye` | senses | `static` | — |
| `display-frill` | social | `static` | — |
| `luminous-tail` | social | `sweep` | — |
| `scent-gland` | social | `static` | — |
| `signal-crest` | social | `static` | — |

## Audit findings for migration
1. `src/lineage/part-registry.js` currently uses default animation-profile strings (`gait`, `breathing`, etc.). A full joint rig needs independent validated per-part art/constraint records.
2. `src/render/creature-assembler.js` already differentiates several leg gait ranges and assembles sockets; this is a **starting adapter**, not proof of a complete planted-foot solver.
3. `src/render/part-sprites.js` uses code-drawn pixel shapes and partial specialized limb art; it is a design source to be translated to authored native-resolution assets.
4. `src/render/fauna.js`, `src/render/behavior.js`, `src/render/genvo-draw.js` still carry species-conditioned branches that conflict with the final shared assembly ideal.
5. Several multi-occupancy flank/dorsal slots are logically stacked today; a production editor needs a real individual physical anchor per occupied position.
6. Reproduce the current capability/physics baselines before migrating any renderer; remove duplicate systems only after verified parity.

CSV snapshot: `design/art/current-part-registry-snapshot.csv`.
