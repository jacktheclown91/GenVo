# Restored-checkpoint diagnostic ownership

`createSimulationSnapshot` includes live references to animal/controller data. `restoreSimulationSnapshot` transfers supplied animal objects into a simulation. Treat a supplied snapshot as owned by that restored world.

When comparing independent worlds, serialize and deserialize separately for each restoration. The binary observer uses `node:v8` to preserve typed arrays and native data; do not use JSON stringify/parse as a substitute. An extra save/restore must also cross a serialization boundary before continuing the second world.

Never restore two simultaneously advancing worlds from the same snapshot object. They can share animal state and produce an invalid divergence result. Preserve the original checkpoint bytes, normalize only receipt timestamps/reason for comparison, and compare full biological snapshots and RNG. A failed diagnostic must establish independence before being treated as a persistence defect.

The bounded current-world comparison is reports/pass-dl-checkpoint-parity.mjs. Results are unproven until its assertions complete and its JSON receipt is written. This diagnostic leaves the original long observer untouched.

Validated current mid-world example: sequential workers in reports/pass-dn-parity-worker.mjs load the preserved day441 checkpoint independently. The extra path crosses another serialized save/restore. Both advance240updates to day446; full resulting snapshots match, including RNG, after normalizing only receipt timestamps/reason (at both root and meta). Both pass ecological integrity. Receipt: reports/pass-dn-parity-result.json. This demonstrates parity for this checkpoint/horizon, not every save schema or all future ecological outcomes. Sequential worker processes avoid holding two evolving worlds plus diagnostic rendering of giant assertion objects in one process.
