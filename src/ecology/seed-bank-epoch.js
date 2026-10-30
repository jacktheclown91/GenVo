// Seed-bank change counter (mature-world performance, October 30). Every function
// that can create, alter or delete a seed cohort bumps its dispersal controller's
// count (flora-inheritance.js, seed-viability.js, dispersal.js). A warm regional
// publication may reuse the packed seed table from its previous pass only while
// the count is unchanged. Held outside the saved state; it never affects a save.
const epochs=new WeakMap();
export function touchSeedBank(d){epochs.set(d,(epochs.get(d)||0)+1)}
export const seedBankEpoch=d=>epochs.get(d)||0;
