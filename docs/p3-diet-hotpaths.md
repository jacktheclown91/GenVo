# P3: Batched mouth-derived finite-food lookup

This is a strict semantic-equivalence optimization stacked **on P2 draft PR #15**, not on main.

## Change
Each `CarryingPressureController.surveyAt` obtains a `groundDiet` from live inherited anatomy before testing actual finite crop cells. Previously `groundDiet` called `plantPreference` separately for every named plant, and each call traversed the same mounted nodes twice for the mouth. It then traversed those nodes again for carrion.

The new `groundDiet` reads the mounted mouth **once per survey** and applies the **same per-guild, seed-crushing, carrion and legacy formula** to each entry in the unchanged `PLANTS` registry. It preserves a new result object on every call. The original single-kind `plantPreference` remains authoritative, unchanged and independently tested. **No long-lived cache** is introduced: edited sockets/parts, missing mouths and legacy species immediately produce the correct diet.

No mutation, genetic policy, digestion genes, biomass stock, player control, climate, save or reproduction rule changes. This is a hotpath reduction, **not a promised recovery of the 500ms observer target**.

## Acceptance
- `tests/p3-diet-capability-parity.mjs` independently compares every plant and carrion result against `plantPreference` for all legacy founders and mouth/jaw/beak part IDs, unknown mouths, multi-mounted mouths, and changes in a plan in-place.
- Original physical supply, demand, physiology, inheritance, regional water and saves are tested.
- Compare unmodified P2 parent `ab0535bce5e523b6c8198a75d232e136e8e51672` to P3 under the existing **complete mutation-RNG and world-save fingerprints**, including the full **560-creature 4× world and RNG state**. No fields or actors exempted.
- Run original 120-second aquatic test, original 500ms observer-play ABBA diagnostic and full unchanged fast tier. Never relax or skip a gate, nor call a relative gain absolute acceptance.

Latest P2 run [39184609453](https://github.com/jacktheclown91/GenVo/actions/runs/39184609453): exact parity, standalone aquatic and ABBA job passed, but full fast suite failed solely on original observer-play at **653ms vs 500ms** (424 pass, 5 historical known, 1 new observer failure). The ABBA separately showed P1 815/825ms and P2 890/820ms on its host. This performance gate is still **unmet**.

Status: draft experiment awaiting P3 GitHub CI; all stacked PRs and main remain untouched.
