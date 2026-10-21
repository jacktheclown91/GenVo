# Regional stage crash recovery — October 21, 2026

`RegionalCheckpointStage` now marks new capture keys `locked@<uuid>` when the browser provides Web Locks and holds an exclusive lock named `genvo-regional-stage|<database>|<slot>|<capture>` from its first staged write until `publish()` or `abort()`. The lock is owned by the browser context, so closing or crashing the owning tab releases it without running any GenVo cleanup.

`recoverRegionalStages(db)` runs once each time `SaveManager.db()` opens storage; the result is kept in `SaveManager.regionalRecovery` (`{deleted, live, unsupported}`). It:

1. Scans regional keys only (no payload reads) and groups `locked@` captures by slot.
2. Requests each group's lock with `ifAvailable`. A held lock means another live tab owns the stage; its records are counted as `live` and untouched.
3. Under the acquired lock, one readwrite transaction rereads that slot's root and deletes only grouped records the root does not reference. Published captures stay because the root references them.

Earlier captures without the `locked@` prefix (and fixed keys) have no lifetime protection and are never reclaimed; the readonly inventory still reports them. Without Web Locks, recovery reports `unsupported` and deletes nothing.

An exception inside any nested request handler aborts that slot's transaction and rethrows the real cause, so a failed cleanup deletes nothing. (The first browser run found the nested `getKey` handler escaping its guard and surfacing only a generic AbortError; that was corrected.)

## Verification

`tools/verify-regional-stage-recovery-browser.mjs <evidence dir> <exported build>`, native Chromium on an exported build: an actual authored start and indexed active record, a published capture, a live stage in an owner tab, a second tab that must not reclaim it (`live: 1`), owner tab closed without `abort()`, a controlled delete failure that must leave every record in place, startup recovery deleting exactly the abandoned record, legacy unprotected capture retained, an exact complete-checkpoint comparison, idempotent repeat and the no-lock fallback. Passed October 21 together with `verify-regional-storage-browser.mjs`, `verify-overlay-visibility-browser.mjs` and the focused playable gate.

## Limits

This closes orphaned staging records only. Live eviction of resident archive Worlds, scheduler ownership transfer and seamless seam presentation remain open; see [regional staging](REGIONAL-STAGING-2026-10-21.md) and [inventory](REGIONAL-INVENTORY-2026-10-21.md).
