# Nursing visual-test precondition: zero maternal hydration

Rechecked canonical main48cd83e0 after the97-part capability integration2d25a8e0. tests/care-expression.mjs still fails at the unchanged positive nursing assertion, before the presentation checks. A diagnostic copy of that same fixture reports:

```json
{"mother":{"alive":true,"energyBefore":55.150000000000006,"waterBefore":0,"lactating":true},"child":{"age":0,"lactationParentId":109},"eligible":true,"reserves":{"energy":52.08,"water":43.32},"fedType":"care","fedAmount":0}
```

The child has the correct actual birth-parent identity, is unweaned, and milkEligible/canLactate both return true. The actual paid birth exhausts maternal water in this fixture. transferMilk correctly refuses transfer below the existing maternal water reserve; generic care with zero feeding is therefore expected at this point. The earlier tentative body/genome mismatch explanation is not supported by this observation.

Antigravity owns test precondition/resource integration: establish actual maternal hydration through a legitimate post-birth drink in the real gameplay journey before asserting nursing. For any explicitly staged unit fixture, declare its funding separately and preserve the negative zero-water case as well as the strict positive transfer, canonical-state parity, expiry, separation and precedence assertions. Do not lower reserve floors, add free milk, weaken the positive assertion, or fabricate milk receipts to make artwork pass. No gameplay source or existing test was modified for this diagnosis. Public uninterrupted nursing/maternal action observation remains separate work.

Reproduction: copy tests/care-expression.mjs into reports/ (its ../src imports remain valid), import canLactate/milkEligible/MAMMAL from src/ecology/mammalian-care.js, and print these read-only fields immediately after the existing tend call, before its unchanged assertion. Canonical diagnostic retained at reports/care-precondition-current.mjs. This is the original staged test setup, not a naturally occurring public game or a new visual acceptance claim.
