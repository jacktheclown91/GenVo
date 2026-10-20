# Historical movement continuation and original recovery

Connected implementation pass, October 20, 2026. Full Creature-stage completion and creator acceptance remain open.

## Player path

New World offers a checkpoint-only movement choice for saved-world forks, imported scenarios and bundled evolved worlds. **Keep recorded movement rules** is the default. **Enable new movement · save original backup** explicitly adopts jumping, gliding, tree climbing and ordinary future patagium mutation eligibility in the new continuation. The choice does not grant anatomy, invent terrain/trees, advance time or rewrite the source ecosystem's past. Creature selection remains independent: recorded lineage, living resident, guided founder or sandbox founder.

The original checkpoint is saved before any authored-founder introduction or resident selection is published to the new slot. Worlds identifies it as a **read-only original checkpoint**. It can be exported, renamed, deliberately deleted, or used through **New World from backup**. Recovery defaults to the recorded lineage and recorded movement rules and creates another independent slot. Ordinary Continue and Play do not adopt new policies or activate a backup for autosave.

Disabled seed/geography inputs are hidden for checkpoint starts so the real continuation options and Begin button remain visible. Their source values cannot rewrite recorded history.

## Storage and policy ownership

`src/lineage/movement-rule-migration.js` validates optional current movement profiles and append-only adoption records: previous/current versions, explicit source, simulation/global tick, backup slot and whether policies changed. It plans every active/archived record before publishing metadata. Adoption changes only future movement rules and provenance. No existing creature, genome, resource, RNG state, pregnancy, prior action or historical event is reconstructed.

Canonical archived biology must be synchronized at the same tick. Unfinished catchup, environment-only archive clocks, incompatible policy/history or a pending legacy pounce refuse adoption before partial publication. Existing worlds can continue under their recorded rules while those prerequisites are resolved. Actual regional adoption, save/restore, return travel, history propagation and unchanged archived organisms are covered by focused tests.

`SaveManager.storeMovementContinuation` requires an isolated candidate and detached, validated source checkpoint. One IndexedDB transaction adds both complete saves and their metadata under distinct new IDs. The source snapshot is stored unchanged; its read-only role lives in slot metadata. The new slot is activated only after commit and simulation installation. A failed serialization, quota or transaction abort publishes neither slot and rolls back the candidate policy metadata. Concurrent ordinary saves finish in order. If a later gameplay save fails, the initial committed continuation and original backup still exist and the interface reports that distinction.

Backups reject ordinary load, save and clear. The existing explicit Delete action remains available. Recovery uses the same canonical restore and independent-world creation paths; it does not turn the backup itself into a live writable ecosystem.

## Evidence

- `tests/movement-adoption.mjs`: exact whole-source/backup equality, full-state equality apart from policy/provenance/slot metadata, unchanged organisms/RNG/time, abort after backup data enqueue, metadata rollback and successful retry, no premature activation, read-only guards, malformed source/history rejection, already-current forks, real planetary archive adoption/return, and clock/pounce refusal.
- All 21 focused `tools/check-playable.mjs` checks pass. Existing concurrent-save, delayed-capture, storage, founder/resident start and ordinary gameplay gates remain intact. Canonical audit and public-export parity pass.
- The canonical source produces a 675-file derived web export. The automated browser harness uses that export, the actual New World menu, SHA-verified Established Valley checkpoint, explicit movement choice, sandbox import and founder confirmation. It stages only position/facing on unchanged terrain; authored anatomy is not presented as naturally evolved.
- The genuine original backup retains Day 31/tick 1440, RNG 1987768365, 215 live animals, absent jump/glide policies and no authored introductions. The adopted continuation has the marked new founder pair and future movement rules. Actual mouse/Enter jumps, landing and midair IndexedDB reload pass. A native IndexedDB abort after the backup write is queued leaves the previous two slots and active world intact. Backup write/load guards reject direct attempts. Creating another world from the backup restores its recorded player and original rules while preserving the backup at tick 1440.
- [Exported jump/adoption receipt](movement-adoption-review-2026-10-20/report.json), [explicit choice](movement-adoption-review-2026-10-20/continuation-menu.png), [read-only Worlds entry](movement-adoption-review-2026-10-20/backup-worlds.png), [adopted jump](movement-adoption-review-2026-10-20/adopted-jump.png), [recovered original](movement-adoption-review-2026-10-20/recovered-original.png). Gameplay and menu frames were inspected. These are automated inputs, not human playtesting.
- [Exported shoreline glide receipt](movement-adoption-review-2026-10-20/glide-report.json), [deployed membranes](movement-adoption-review-2026-10-20/adopted-glide.png), [finite forced landing](movement-adoption-review-2026-10-20/glide-landed.png). The same real Day 31 source supports a shoreline drop without editing height or vegetation. The glider's committed travel, steering, midair reload, eventual terrain/water landing, and original recovery pass separately. This run exposed missing automatic glide landing feedback: the actual impact/surface now reaches the player message queue and landing/splash/damage audio path. Physical movement costs and damage are unchanged.

## Limits and next work

Unsynchronized canonical regions and environmental-only archive clock conversion are not silently migrated. No other environmental or feeding policy is opted in by this movement choice. Physical launch/landing anatomy and height remain required. An earlier land-only glide capture could not find a qualifying dry drop in this flat valley; checking the actual shared authority found a valid shoreline route, which the exported browser run then verified. No geography, plant stock or acceptance threshold was changed to produce that proof. Mature-tree availability and natural evolved-life-cycle acceptance remain separate questions.

Full visual/listening review, broad ecological acceptance, depth diving, underground ecology/traversal, continuous climbing, and previous broad-suite/timing defects remain open in the completion matrix. This pass is not a release certificate.
