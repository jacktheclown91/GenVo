// Controlled food fixture only: not ecological production or natural emergence evidence.
export function provideRootFood(sim,animal,amount=1){const i=sim.world.idx(animal.x,animal.y);sim.world.plants.marshroot[i]=amount;return i;}
