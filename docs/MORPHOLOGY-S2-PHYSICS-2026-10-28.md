# Morphological evolution S2 — physical consequences of body size

S2 of the creator's morphological-evolution brief (October 28) is about mass, metabolism, movement costs and structural support. It follows [S1](MORPHOLOGY-S1-BODY-SIZE-2026-10-28.md), which established inherited size, growth, mass, endurance and reserve accounting.

**Status.** Implemented under the existing `body-size/1` rule, which new games already record. No new save rule was added: S2 only changes how sized bodies pay costs and carry loads. Every conversion is the identity for a body without an inherited size, so recorded worlds replay bit-identically.

## What existed (inspected first)

Every locomotion module charged a cost proportional to absolute body mass straight to reserves:

- ground and swimming movement (player and wildlife);
- hunter chase moves, archived-region travel and planetary passage;
- climbing work, jump launch, flight, glide and dive costs;
- burrowing excavation and burrow movement, cave air;
- cold-water immersion.

With S1, absolute mass grows as s³ while reserves are capacity units, so a 2× body was paying 8× the reserve share for every one of these actions. That was the first thing S2 corrected.

Feasibility checks also used absolute mass:

- jump lift fell as 1/√mass, so a 2× body jumped 2.8× lower;
- flight and gliding limits compared absolute mass with a fixed maximum;
- glide sink grew linearly with absolute mass.

## The physics (`body-size.js`)

A mass-proportional cost becomes M^e in absolute units, then enters reserves (capacity ∝ M). `scaleMassCost` and `massCostToReserve` hold the exponents in `SIZE_PHYSICS`:

| Cost | Exponent | Basis | 2× body, reserve share |
| --- | --- | --- | --- |
| Ground travel, swimming, burrow travel, chase moves, passage | M^0.68 | Cost of transport per distance (Taylor et al. 1982) | ×0.51 per tile |
| Climbing, jump launch, dive descent and ascent, gliding | M^1 | Work against gravity or buoyancy | ×1 |
| Holding a dive, excavation, cave air demand | M^0.75 | Sustained muscular and respiratory power (Kleiber) | ×0.59 |
| Cold-water immersion | M^(2/3) | Heat loss through body surface | ×0.50 |
| Flapping flight | M^(7/6) | Power to stay aloft | ×1.41 |

Structure: peak tissue stress, meaning weight over supporting cross-section, grows as s for the same anatomy (`structuralScale`).

- **Falls** from a climb and **hard jump landings** injure s times as much.
- **Jumping** (Borelli's law). Muscle work and mass both grow as s³, so a scaled anatomy jumps as high and as far. Kinematics use the anatomy's own mass (`anatomicalAdultMass`). Whether the spring legs can launch the body at all uses limb loading (anatomy × s, `jumpLoad`). Launch food is mass × height work.
- **Flight.** Wing loading grows as s (mass s³ over area s²). The power margin shrinks as s^0.5, since available power ∝ M and needed power ∝ M^(7/6). Takeoff and staying aloft compare `flightLoading` = mass·s^−1.5 with the existing limit.
- **Gliding.** Surface loading grows as s, so the launch limit and sink rate use `glideLoading` = mass/s².

**What did not change.** Speed: size grants no movement speed, as the brief directs. Climbing speed already falls with √mass, and absolute load limits stay absolute: canopy branch load, ice bearing, burrow passage size.

## Evidence

`tests/body-size-physics.mjs` (new, gated) runs real sites for a reference body and a 2× body:

- every exponent in the conversions;
- the shared movement step: same distance, reserve share ×0.514 and absolute cost ×8^0.68 per tile;
- identical jump kinematics, limb loading ×s and landing injury ×s;
- flight loading ×s^1.5, glide loading ×s, and real flapping cost ×8^(1/6);
- a real unsupported climb that falls and injures ×s;
- unsized bodies unchanged.

`body-size.mjs` and `body-size-reserves.mjs` still pass. The frozen fixtures and the full playable gate pass unchanged.

A 60-day new-game soak (planetary, full opt-ins, seed SOAK-SIZE-1) ended day 61 with 124 alive and 18 births. With S1 alone it ended with 112 alive and 20 births. This is a stability observation, not a tuning target.

## Not in S2

- **Acceleration and turning.** Movement is kinematic: there is no velocity state to give inertia to. Adding one changes every chase and the player's controls. It needs its own design pass, with the presentation contract, before giants (S7).
- **Per-part structural capacity.** Whether a given set of legs, torso and skeleton can carry a given load, with explained invalid combinations, is S3 (anatomical compatibility). S2's stress term treats each anatomy as sound at its own reference size.
- **Thermal demand.** Surface-area heat exchange on land is left to S4.

## Next

S3, anatomical compatibility: support capacity per part (legs, torso, skeleton) against body load, with explained invalid combinations and inherited developmental pathways.
