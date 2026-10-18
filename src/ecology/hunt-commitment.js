// Pursuit commitment (Phase 3J Step 3, investigation finding; behaviour, not outcome). Stalkers started over
// a thousand pursuits per 180 days yet reached contact in about 3%: each decision re-scored every prey in
// range and usually switched to a new "best" one after 1-2 seconds, so no chase could finish. A hungry hunter
// now keeps pursuing the prey it is already chasing while that prey stays perceptible (not hidden by cover,
// camouflage or refuge), edible, reachable on the same land, within its hunting range and not one it has
// just given up on. It still releases the target when sated, threatened or when the prey escapes from view.
// No food, kills or capture odds are added.
// Measured (docs/stalker-reproduction/): switching halved (abandoned pursuits 533 -> 175 on NJ-A) but contacts
// per Stalker-day did not rise (0.13 -> 0.11) and hunting income fell (0.78 -> 0.66), so it is OFF pending the
// pursuit/escape study. ?huntCommitment=1 enables.
export const HUNT_COMMITMENT={enabled:false};
