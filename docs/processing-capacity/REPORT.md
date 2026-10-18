# Computational capacity must not select offspring

October 17, 2026. Implements the creator's explicit requirement to remove silent reproductive suppression. This does not expand geography or authorize a new anatomical route.

## Change

The single funded-newborn authority now creates the full funded litter, including hatchlings, irrespective of CFG.maxAnimals. Egg laying similarly no longer truncates the paid litter at the historical global 128-egg limit. Neither threshold changes maternal payments, per-offspring budget division, genotype, compatibility, development or environmental egg survival. Both historical constants remain diagnostic references; they are not raised.

A visible HUD notice reports living organisms and eggs above either reference and explains that offspring are retained and simulation may run more slowly. The readout is derived, does not consume RNG and is not a new biological authority or persisted actor state. The existing simulation clock processes discrete updates; this patch does not certify high-population throughput or introduce a distant-world scheduler.

The observation harness now records processingCapacity separately. Its old population-ceiling assertion was removed because object capacity is not a biological invariant under the creator's explicit contract. Finite stocks, unique identity, census reconciliation with births/deaths, simulation advancement and corruption rejection remain enforced. This is a corrected contract, not a larger ceiling or an ecological success target. Long trials remain deferred.

## Focused verification

Nine suites passed: processing-capacity, reproductive-anatomy-eggs, maternal-birth-authority, brood-investment, validation-kinds, carrying, ecological-observation, save-persistence and physical-breeding.

The new regression uses a real accepted conception and compares independently restored copies with identical RNG, under high versus low diagnostic references. Full saved state is identical after delivery, including history, inherited bodies and maternal payments. A 12-update resumed branch also matches exactly. Another controlled case starts with 900 real actors and retains three additional funded offspring with bounded energy/water. Stored egg fixtures isolate capacity from environmental exposure: laying retains two eggs above 128, save roundtrip is exact, and all 130 viable funded eggs hatch above the actor reference. These are mechanism fixtures, not autonomous ecology evidence.

Headed Chromium in an empty isolated context: baseline 181 actors and no notice; controlled paused fixture 901 actors and visible notice; browser errors empty. The final screenshot was inspected and the notice sits above the survival controls. See runtime/evidence.json and runtime/capacity-warning.png. Fixture actors are explicitly spawned; this proves UI, not natural population growth, frame performance or evolutionary accessibility.

The prior 389-pass A0/A receipt predates these edits. It remains evidence of its recorded fingerprint, not a full-gate result for this patch. No commit, push, release or major 100-day run was performed.

## Remaining work

Transparent overload scheduling, mature-world throughput and memory remain unproven. There is no claim that arbitrarily large populations fit memory or retain realtime speed. A planet-scale geography contract and measured performance still precede expansion. Evolutionary accessibility and the authentic new inherited capability demonstration remain open, alongside the shared-rule autonomous/player-guided trial requirements.

## Ordered frame pacing follow-up

Runtime processing now yields between complete control steps after a 12-ms budget, retaining all admitted queued work and the ecology substep phase. Visible feedback reports lag; no newborn limit is reintroduced. Exact full-state parity and existing timing/movement/save checks pass. A fresh-world browser sample and a disclosed forced-backlog/recovery fixture were captured and inspected; see `docs/frame-pacing/REPORT.md` relative to repository root. Single-tick stalls, mature-world memory/throughput and planetary scale remain unproven.
