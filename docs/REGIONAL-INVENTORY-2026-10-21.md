# Read-only regional storage inventory — October 21, 2026

`SaveManager.inspectRegionalStorage()` exposes the shared `regional-records.js` inventory. One readonly transaction scans saved roots, validates their directories and walks regional keys. It reports referenced records, unreferenced fixed/capture keys, unrecognized keys and missing committed references. It does not request regional record values or mutate storage. Invalid root directories reject the inventory instead of producing a reclamation plan from an untrusted root.

The result explicitly carries `reclamationAuthorized: false`. An unreferenced key can belong to an active unpublished stage in another tab; it is not proof of abandonment. The inventory itself never deletes. Lock-owned startup recovery of abandoned stages was added afterwards; see [stage recovery](REGIONAL-STAGE-RECOVERY-2026-10-21.md). This is not planetary paging.

Native exported Chromium evidence: eight stored records, seven committed references, one real unpublished stage detected, zero regional payload reads and unchanged complete saved state. The harness additionally rejects any attempted regional value cursor. Existing staged publication, abort/retry, selective reads, leased replay, legacy upgrade and native Save/Continue checks pass. Targeted regional codec, source audit, public export and all 60 focused integration checks pass.

Receipt: `C:\Users\jackt\.codex\visualizations\2026\10\20\01a1583e-f787-7bb3-a369-b0b62a443366\regional-inventory-browser\receipt.json`, `storage.storageInventory`. Inventory memory grows with directory/key metadata, not decoded indexed regional Worlds. Historical monolithic roots still contain their complete snapshots and must be decoded by the saved-root cursor; no bounded-memory claim is made for those legacy roots.

The read-only inventory is independently usable through the existing diagnostic API and adds no default developer statistics to gameplay.
