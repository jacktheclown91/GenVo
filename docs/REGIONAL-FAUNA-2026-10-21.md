# Resident wildlife across regional borders

Actual nearby canonical population snapshots now provide visible neighbouring bodies. `src/world/regional-fauna.js` is the read-side identity/visibility authority; `src/render/regional-fauna.js` draws each same body with its owner World's physical inputs through the existing terrain-only renderer. Bodies, genomes, food stocks and RNG remain owned by the canonical snapshot. No second biological Simulation is created, and no animal is added to the active population for display.

Only resident canonical regions at most one life stride behind the active clock are eligible. Future/stale clocks, parked/far population modes, unloaded owners, missing terrain views and duplicate active identities are excluded. Current surface anatomy, facing, sight range and physical atmosphere decide visibility. Cave and submerged targets are not revealed by this surface path. This does not create wildlife in unexplored regions; first discovery/materialization of those populations remains a required next capability.

Creature composition uses the actual inherited renderer, remote terrain/water and owner clock. It merges depth order with local creatures. Temporary render inputs are restored even when drawing fails, and hit positions are cleared each frame and on handoff. The UI re-resolves the current owner rather than trusting a stale rendered body.

Clicking a visible neighbouring creature offers Observe and Approach creature. Observe uses the existing discovery authority to record its actual body. Approach retains the actual ID, uses ordinary paid controls and canonical travel, replans when the visible target moves, and selects that same living local creature after reaching it. Lost/dead/unloaded or unseen targets interrupt. Manual movement and pause retain normal cancellation. Selection alone cannot authorize cross-owner combat or courtship, and attacks cannot fall back to a different local animal while a remote creature is selected.

Historical saves are observed under their existing rules. This feature adds no saved policy or migration and changes no biological time or founding behavior.

## Evidence and limits

`tests/regional-fauna.mjs` uses an untouched genuine initial border founder and actual travel archive. It checks body/owner reference identity, read-only snapshot/RNG parity, owner-world render inputs and restoration on exceptions, visibility/staleness/death guards, hit testing, canonical observed anatomy and save continuity, paid approach across a real owner transfer, unique identities and arrival cancellation for a dead target.

Direct physical combat/courtship across two owners, unvisited regional population ownership, seamless wildlife/family handoffs, broader marine/cave visibility and sustainable large-scale performance remain unfinished. A visible resident population is not complete planetary acceptance.
