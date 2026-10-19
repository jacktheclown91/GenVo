# Regional replay timing contract

Implementation contract, October 19, 2026. Governing intent remains design/CURRENT-DESIGN.md. This is a current-map scheduling repair, not approval for larger worlds, new anatomical routes or fabricated biodiversity.

## Policies and historical continuity

- New planetary worlds record regionalReplayPolicy = synchronized-strides/1 in saved core state.
- Historical saves with a missing field retain the existing bounded-strides/1 behavior. Explicit legacy policy is also supported. No implicit upgrade, inferred missing ledger, or retrospective repair of lost history occurs.
- Null and unknown policy values are rejected. Travel transfers the world's policy, including preserving historical absence. Save schema 10 and biological coefficients remain unchanged.
- New and historical worlds can therefore produce different outcomes. Timing affects global identity allocation and inheritance; this is deliberately versioned rather than presented as a behavior-preserving performance optimization.

## Deterministic synchronized schedule

At each completed local life stride, a barrier holds subsequent local time/control steps until every canonical biological archive reaches that same local tick. The barrier is derived from saved clocks and policy, not wall time or a hidden runtime cursor. A remote transaction executes the existing canonical update ticks, validates conservation and identity ownership, then publishes atomically.

Choose the oldest archived clock, breaking ties by the existing region-key ordering. Each admitted job consumes at most one life stride. Recompute that order after every publish. Global nextId remains above every active/archived organism; no birth is clipped. Identical jobs and inputs produce identical state whether the caller executes synchronously or yields between jobs. An archive without biological authority retains its historical physical-only path; this contract never invents its missing biology.

The browser FrameStepper runs one remote transaction before a queued control step, yields the frame after that transaction, and retains queued admitted time. During these jobs local tickCount, player movement and local reserves do not advance. Pause admits no control or remote jobs. Direct simulation callers finish the same ordered barrier before the next local update. Capacity errors stop/report processing; they do not select survivors. No multi-region all-or-nothing transaction is claimed: each completed regional job is a valid independently saved state.

Each archive can be at most one life stride behind at a completed local stride boundary in a normally generated synchronized world. The next local tick waits until debt is zero. Snapshot/IndexedDB save and resume may occur between jobs without replaying completed work or losing remaining work. The final stride of a bounded headless observation may still be pending; observers must report this rather than claiming fully synchronized end clocks.

## Player feedback and limitations

The runtime reports regional catchup and held local time. Normal processing-load feedback retains queued steps; all offspring remain retained. Yielding between region transactions cannot interrupt a single expensive restoration or biological stride. Smooth frames, mature day-100 multi-region performance and browser save size require further evidence. Active-time synchronization trades wall-clock speed for correct continued biology; no real-time speed guarantee is implied.

Explicit user migration of historical schedules is not implemented. Their original return/debt limits still apply. A future migration must record that identity/temporal ordering changes, preserve all ancestry/resources and define any existing backlog before switching policies.

The existing main-loop frame-delta admission cap remains in place. Retaining admitted steps does not promise a one-to-one relationship between elapsed real time and simulated time during long stalls.
