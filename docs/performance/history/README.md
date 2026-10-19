# Diagnostic history

The two seed-codec mismatch receipts in this folder are invalid as product-regression evidence. They used repeated V8 deserialization of the same byte Buffer. In this Node runtime and checkpoint, the resulting worlds shared the groundwater backing buffer; stepping one contaminated the other. The same-decoder control produced the identical mismatch. Other arrays did not necessarily share that storage.

The initial large assertion diagnostic was interrupted after excessive resource use. Bounded comparisons isolated the issue. Independent Buffer copies eliminate the shared state: ../mature-restore-independence-2026-10-19.json passes, and ../seed-codec-mature-benchmark-2026-10-19.json establishes exact old/new complete-world and full-day continuation parity. These historical receipts are retained, not rewritten into passing results. New benchmark transports assert groundwater-buffer independence.
