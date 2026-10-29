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
// body-size/2 (morphology S7, new games): the same inheritance and physics with the
// upper bound raised to 3x, once S2-S3 made large bodies pay for their size
// (transport and flight costs, impacts, structural stress: a founder anatomy at
// 3x sits exactly at tissue yield) and S1 made every intake and transfer
// size-correct. Contact reach also grows with body size (contactReach).
// body-size/1 worlds keep their 2x bound exactly.
export const GIANT_SIZE=Object.freeze({policy:'body-size/2',maxScale:3});
const MAX_SCALE=Object.freeze({[BODY_SIZE.policy]:BODY_SIZE.maxScale,[GIANT_SIZE.policy]:GIANT_SIZE.maxScale});
export const bodySizePolicy=value=>Object.hasOwn(MAX_SCALE,value);
const LOG_MIN=Math.log(BODY_SIZE.minScale),LOG_MAX=Math.log(BODY_SIZE.maxScale);
const logMax=policy=>Math.log(MAX_SCALE[policy]??BODY_SIZE.maxScale);
const clampLog=(v,max=LOG_MAX)=>Math.max(LOG_MIN,Math.min(max,v));
export const bodySizeEnabled=sim=>bodySizePolicy(sim?.bodySizeRules);

export function founderBodySize(rng){
 const s=BODY_SIZE.founderSpread;return{schema:1,alleles:[rng.range(-s,s),rng.range(-s,s)]};
}
// Founders of a naturally evolved configuration: both alleles around the cohort's
// recorded mean log size, spread uniformly by its recorded standard deviation
// (+/- sd x sqrt 3), within the world's bounds.
export function evolvedFounderSize(rng,{mean,sd},policy=BODY_SIZE.policy){
 const w=Math.max(0,sd)*Math.sqrt(3),max=logMax(policy);
 return{schema:1,alleles:[clampLog(mean+rng.range(-w,w),max),clampLog(mean+rng.range(-w,w),max)]};
}
// One allele from each parent, each with a small symmetric mutation.
export function inheritBodySize(rng,mother,father,policy=BODY_SIZE.policy){
 const allele=parent=>parent.bodySize.alleles[rng.chance(.5)?0:1],m=BODY_SIZE.mutation,max=logMax(policy);
 return{schema:1,alleles:[clampLog(allele(mother)+rng.range(-m,m),max),clampLog(allele(father)+rng.range(-m,m),max)]};
}
export function validateBodySize(size,policy=BODY_SIZE.policy){
 const max=logMax(policy);
 if(size?.schema!==1||!Array.isArray(size.alleles)||size.alleles.length!==2||
  size.alleles.some(v=>!Number.isFinite(v)||v<LOG_MIN-1e-12||v>max+1e-12))throw Error('Invalid inherited body size.');
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
// S2 physical consequences. Mass-proportional costs are computed from absolute
// mass (anatomy x s^3); physics sets how each really grows with mass M:
// work against gravity M^1, cost of transport (running, swimming) M^0.68,
// sustained muscular and respiratory power M^0.75, heat loss through the body
// surface M^(2/3), flapping-flight power M^(7/6). scaleMassCost turns a cost
// proportional to M into one following its exponent (absolute units);
// massCostToReserve then enters it into the body's own reserves.
export const SIZE_PHYSICS=Object.freeze({work:1,transport:.68,power:.75,surface:2/3,flight:7/6});
export function scaleMassCost(animal,amount,exponent=SIZE_PHYSICS.work){
 if(!animal?.bodySize||exponent===1)return amount;return amount*reserveScale(animal)**(exponent-1);
}
export function massCostToReserve(animal,amount,exponent=SIZE_PHYSICS.work){
 return animal?.bodySize?scaleMassCost(animal,amount,exponent)/reserveScale(animal):amount;
}
// Peak tissue stress (weight over supporting cross-section) relative to the same
// anatomy at reference size: s. Impacts, falls and limb or wing loading follow it.
export const structuralScale=animal=>animal?.bodySize?adultSizeScale(animal):1;
// Resting-cost multipliers in capacity units: mass^-0.25 for energy, mass^-1/3 for water.
export function enduranceScale(animal){
 if(!animal?.bodySize)return{energy:1,water:1};
 const r=reserveScale(animal);return{energy:r**(BODY_SIZE.energyExponent-1),water:r**(BODY_SIZE.waterExponent-1)};
}
// Saved worlds keep their recorded rule; every organism and conception snapshot
// carries a valid size exactly when the world records body-size/1.
export function restoreBodySizeRules(sim,core){
 if(core.bodySizeRules===undefined)delete sim.bodySizeRules;
 else if(!bodySizePolicy(core.bodySizeRules))throw Error('Unknown saved body size rules.');
 const enabled=bodySizeEnabled(sim),check=a=>{if(!a)return;if(enabled){validateBodySize(a.bodySize,sim.bodySizeRules)}else if(a.bodySize!==undefined)throw Error('Saved body size without its recorded rule.')};
 for(const a of sim.animals){check(a);check(a.pregnant?.maternalInheritance);check(a.pregnant?.paternalInheritance)}
 for(const egg of sim.eggs||[]){check(egg.maternalInheritance);check(egg.paternalInheritance)}
}
// Contact reach under body-size/2: two bodies touch over the mean of their current
// linear scales (frame and limbs grow with the body). A reference pair keeps the
// base distance exactly, and only larger bodies reach further, so small bodies
// keep every existing interaction. Worlds without /2 use the base distance.
export function contactReach(sim,base,scaleA=1,scaleB=1){
 return sim?.bodySizeRules===GIANT_SIZE.policy?base*Math.max(1,(scaleA+scaleB)/2):base;
}
// Read-only presentation contract (Codex): current and inherited linear scale,
// growth and mass. Presentation may draw from these; it never writes them.
// `development` is the caller's developmentFor(animal); this module imports nothing.
export function bodyDimensions(animal,development,{adultMass=null,mass=null}={}){
 const adult=adultSizeScale(animal);
 return Object.freeze({adultScale:adult,currentScale:adult*development.growth,growth:development.growth,stage:development.stage,
  ...(adultMass===null?{}:{adultMass}),...(mass===null?{}:{mass})});
}
