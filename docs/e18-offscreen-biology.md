# E18: Canonical Offscreen Living Ecology

E17 kept distant weather/soil alive, but fauna and producers frozen. E18 establishes **true independent biological time** for newly departed planetary regions.

## Source of truth

No new population formula, invented food stock, artificial births, or rescue equilibrium. Offscreen updates restore the archived `Simulation` and call its *normal* `Simulation.update()` tick, including the same soil/hydrology, producers, foraging, breeding, heredity, predation, metabolic costs, death/carrion, eggs, maturation and native creature behavior as when the region is currently in view. This is not an estimate of "likely population": each individual and every producer store remain their exact same mutable canonical data.

On each active ecology life stride, the scheduler executes at most **one archived region by one life stride (6 canonical ticks)**. Each 48-tick day includes eight strides and one real vegetation/hydrology/lifecycle day. A region that cannot get scheduled accumulates biological clock debt and is processed oldest-first. On direct return, at most 48 outstanding ticks are reconciled synchronously; more outstanding ticks prevent the crossing until background work catches up. Work is transactional: the staged region snapshot is validated before its new state is published.

The existing E17 archive remains supported as an **explicit physical-only mode**. New planetary departures use `biologicalMode:'canonical-ticks/1'`. This prevents simultaneously replaying E17 physical weather and E18 biology (which already calls actual soil/water), and prevents doubles or missing water receipts. Existing E17 historical environmental cursors are respected when migrating out of that mode. The new per-region `biologicalLedger` records exact initial/latest tick, work, elapsed biological days, actual births/deaths, and latest stored population. Each real completed day also adds canonical environmental water/salt receipts to E17's existing daily ledger.

Real births require globally unique creature identifiers: the scheduler raises the remote session's `nextId` above every visible and archived animal/next-id high watermark, and advances the active global next-id on successful publication. The save loader validates the biological ledger and organism ID uniqueness. The active fauna or resource arrays cannot be affected by a failed or partial offscreen step.

## Limits and next work

This is deliberately bounded, not unlimited 1000x time acceleration or an instantaneous planet simulator. At most one remote region receives a life stride per active life stride, so multiple archived regions **do not all run at realtime speed**. The game retains the explicit return-catchup limitation and 128×128 region chunks, with no true seamless continuous movement. Remote fauna can die, breed and reproduce naturally *within* a region, but wildlife cannot independently cross between regions or exchange food/water/seed across region boundaries yet.

E19 should build an explicit multi-region work budget/prioritization and global cross-border resource exchanges, with detailed profiling to protect the stable responsive-gameplay baseline.

`tests/e18-offscreen-biology.mjs` runs 48 normal ticks on an independent foreground reference simulation from the exact same archived state, then proves the offscreen simulation has **byte-identical fauna, producer tissue/seed banks, organic resources, carrion, inherited state, birth/death receipts and dispersal controller state**, along with returning/saving and reinserting the same living/dead individuals.
