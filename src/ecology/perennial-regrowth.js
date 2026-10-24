// Perennial regrowth from grazed ground (creator direction 2026-10-23, docs/REGROWTH-2026-10-23.md).
// Land producers fund growth from their own stored energy, and photosynthetic income scales with the
// standing tissue. On recorded worlds, removing tissue (grazing, fire, dieback) removes stored energy in
// the same proportion, so a tile grazed to nothing keeps no reserve and never regrows: under real needs
// the belt within reach of water was 64% bare by day 151. On worlds with this policy:
//  - root reserve: perennials hold most of their reserves below grazing height (roots, rhizomes,
//    crowns), so removing standing tissue takes only the above-ground share (1 - rootShare) of the
//    reserve; regrowth is funded from what remains, through the ordinary funded growth;
//  - seed and spore rain: a tile with neither plant nor reserve is recolonised from its neighbours,
//    a propagule of seedRain times their mean standing biomass each day, taken from the neighbours'
//    own biomass and reserve, so nothing is created. Seed-limited plants keep their seed banks.
// sim.correctionExperiment.rootReserve / .seedRain = false (development measurement only) switch either
// part off. Worlds recorded before this policy are unchanged.
export const PERENNIAL_REGROWTH=Object.freeze({policy:'perennial-regrowth/1',rootShare:.6,seedRain:.002,bare:.0005,noReserve:1e-4});
export function perennialRegrowthActive(sim){return sim?.perennialRegrowthRules===PERENNIAL_REGROWTH.policy}
// Share of a plant's stored reserve that stays with it when standing tissue is removed.
export function retainedReserveShare(sim){return perennialRegrowthActive(sim)&&sim.correctionExperiment?.rootReserve!==false?PERENNIAL_REGROWTH.rootShare:0}
const N8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
// Recolonise a bare tile of a non-seed-limited producer; returns the new standing biomass.
export function seedRain(sim,kind,i,current){
 const P=PERENNIAL_REGROWTH;if(!perennialRegrowthActive(sim)||sim.correctionExperiment?.seedRain===false||current>P.bare)return current;
 const w=sim.world,plants=w.plants[kind],energy=w.plantResources?.energy?.[kind];if(!plants||!energy||energy[i]>P.noReserve)return current;
 const x=i%w.n,y=i/w.n|0,donors=[];let sum=0;
 for(const [dx,dy] of N8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w.n||ny>=w.n)continue;const j=w.idx(nx,ny);if(w.water[j]||!(plants[j]>0))continue;donors.push(j);sum+=plants[j]}
 if(!donors.length)return current;const propagule=P.seedRain*sum/8;if(!(propagule>0))return current;
 // Each donor gives in proportion to its biomass: the same share of its tissue and of its reserve.
 let reserve=0;for(const j of donors){const share=propagule/sum;reserve+=energy[j]*share;energy[j]-=energy[j]*share;plants[j]-=plants[j]*share}
 energy[i]+=reserve;const r=w.plantResources;r.totals.seedRain=(r.totals.seedRain||0)+propagule;
 return current+propagule;
}
export function restorePerennialRegrowth(sim,core){
 if(core.perennialRegrowthRules!==undefined&&core.perennialRegrowthRules!==PERENNIAL_REGROWTH.policy)throw Error('Unknown saved perennial-regrowth rules.');
 if(core.perennialRegrowthRules===undefined)delete sim.perennialRegrowthRules;
}
