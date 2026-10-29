// body-size/1: an inherited, continuous adult body size. Two alleles in natural
// log units (one from each parent, as segregation) set the adult linear scale
// relative to the body's anatomy: scale = exp(mean of the alleles). Growth
// toward it follows the existing developmental curve, and the existing funded
// growth pays for every unit of added tissue.
//
// Physical consequences use the mass authority (body-mass.js): adult mass is
// the anatomical mass times scale^3 at equal density. Reserves are kept in each
// species' capacity units, so a larger body's capacity grows with its mass:
// absolute food and water enter and leave reserves divided by reserveScale
// (scale^3). Resting energy follows Kleiber's mass^0.75 and evaporative water
// loss body surface (mass^2/3), so fasting endurance grows as mass^0.25 and
// water endurance as mass^(1/3). A reference-size body (scale 1) keeps every
// existing value exactly.
//
// Founders carry small standing variation; inheritance only segregates and
// mutates alleles. Nothing selects toward any size. /1 is bounded to 0.5-2x;
// larger bodies wait for structural support (later milestones).
export const BODY_SIZE=Object.freeze({policy:'body-size/1',minScale:.5,maxScale:2,founderSpread:.05,mutation:.03,
 energyExponent:.75,waterExponent:2/3});
const LOG_MIN=Math.log(BODY_SIZE.minScale),LOG_MAX=Math.log(BODY_SIZE.maxScale);
const clampLog=v=>Math.max(LOG_MIN,Math.min(LOG_MAX,v));
export const bodySizeEnabled=sim=>sim?.bodySizeRules===BODY_SIZE.policy;

export function founderBodySize(rng){
 const s=BODY_SIZE.founderSpread;return{schema:1,alleles:[rng.range(-s,s),rng.range(-s,s)]};
}
// One allele from each parent, each with a small symmetric mutation.
export function inheritBodySize(rng,mother,father){
 const allele=parent=>parent.bodySize.alleles[rng.chance(.5)?0:1],m=BODY_SIZE.mutation;
 return{schema:1,alleles:[clampLog(allele(mother)+rng.range(-m,m)),clampLog(allele(father)+rng.range(-m,m))]};
}
export function validateBodySize(size){
 if(size?.schema!==1||!Array.isArray(size.alleles)||size.alleles.length!==2||
  size.alleles.some(v=>!Number.isFinite(v)||v<LOG_MIN-1e-12||v>LOG_MAX+1e-12))throw Error('Invalid inherited body size.');
}
// Adult linear scale this body's inheritance supports (1 without body-size/1).
export function adultSizeScale(animal){
 const a=animal?.bodySize?.alleles;return a?Math.exp((a[0]+a[1])/2):1;
}
export const reserveScale=animal=>animal?.bodySize?adultSizeScale(animal)**3:1;
// Reserve accounting. Food and water stay absolute in the world, prey, stores and
// other bodies; they enter or leave reserves through these. A body without
// body-size/1 converts nothing (the identity, so recorded worlds are exact).
export const toReserve=(animal,amount)=>animal?.bodySize?amount/reserveScale(animal):amount;
export const toAbsolute=(animal,amount)=>animal?.bodySize?amount*reserveScale(animal):amount;
// Bites and sips follow mouth area: linear scale squared.
export const mouthScale=animal=>animal?.bodySize?adultSizeScale(animal)**2:1;
// Resting-cost multipliers in capacity units: mass^-0.25 for energy, mass^-1/3 for water.
export function enduranceScale(animal){
 if(!animal?.bodySize)return{energy:1,water:1};
 const r=reserveScale(animal);return{energy:r**(BODY_SIZE.energyExponent-1),water:r**(BODY_SIZE.waterExponent-1)};
}
// Saved worlds keep their recorded rule; every organism and conception snapshot
// carries a valid size exactly when the world records body-size/1.
export function restoreBodySizeRules(sim,core){
 if(core.bodySizeRules===undefined)delete sim.bodySizeRules;
 else if(core.bodySizeRules!==BODY_SIZE.policy)throw Error('Unknown saved body size rules.');
 const enabled=bodySizeEnabled(sim),check=a=>{if(!a)return;if(enabled){validateBodySize(a.bodySize)}else if(a.bodySize!==undefined)throw Error('Saved body size without its recorded rule.')};
 for(const a of sim.animals){check(a);check(a.pregnant?.maternalInheritance);check(a.pregnant?.paternalInheritance)}
 for(const egg of sim.eggs||[]){check(egg.maternalInheritance);check(egg.paternalInheritance)}
}
// Read-only presentation contract (Codex): current and inherited linear scale,
// growth and mass. Presentation may draw from these; it never writes them.
// `development` is the caller's developmentFor(animal); this module imports nothing.
export function bodyDimensions(animal,development,{adultMass=null,mass=null}={}){
 const adult=adultSizeScale(animal);
 return Object.freeze({adultScale:adult,currentScale:adult*development.growth,growth:development.growth,stage:development.stage,
  ...(adultMass===null?{}:{adultMass}),...(mass===null?{}:{mass})});
}
