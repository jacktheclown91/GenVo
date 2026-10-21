import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {canHunt,preyPreference,plantPreference,groundDiet} from './functional-diet.js';
import {harvestFreshwater} from './freshwater-food.js';
import {adaptationEffects} from '../lineage/evolution.js';
import {canSwim,canOccupy} from '../lineage/lifestyle.js';
import {bodyMass} from '../organisms/body-mass.js';
import {isWaterDweller} from '../lineage/aquatic.js';
import {FOOD_PROFILES} from '../gameplay/foraging.js';

// Population-level behavior for distant regions (regional-demography/1).
// It replaces ONLY the per-individual perception, decision and movement
// phases. Every individual keeps its identity, genome, body, age and family;
// climate, soil, daily vegetation, metabolism, disease, lifecycle, gestation,
// eggs and births remain the canonical Simulation phases. Each life stride an
// animal takes at most one of the opportunities a canonical stride offers:
// a drink, one bite or meal, or one capture attempt (canonical bestPrey and
// tryKill), using the same stock debits and energy conversions as canonical
// wildlife meals. Pairing calls the
// canonical tryMate, so inherited compatibility, kinship, roles, cooldowns and
// mate choice decide conception. An animal moves to the food or prey it
// uses and pays the canonical per-cell locomotion energy for that distance
// (drinking trips are charged out and back). Exploratory wandering, chases,
// courtship displays and migration are not simulated.
export const REGIONAL_DEMOGRAPHY_BEHAVIOR=Object.freeze({forageRadius:6,huntRadius:8,mateRadius:10,drinkRadius:10,mateTries:2,
 hungry:.72,thirsty:.8,drink:5.2,carrionBite:.09,carrionEnergy:34,maxBite:.16,freshwaterMeal:5,
 // Canonical wildlife steps cost .009 x speed x mass / metabolism per step of
 // speed/simHz cells: .009 x simHz per cell travelled.
 moveEnergyPerCell:.009*CFG.simHz});
const B=REGIONAL_DEMOGRAPHY_BEHAVIOR;
const near=(sim,a,r,visit)=>{const w=sim.world,x0=Math.max(0,Math.floor(a.x-r)),x1=Math.min(w.n-1,Math.floor(a.x+r)),y0=Math.max(0,Math.floor(a.y-r)),y1=Math.min(w.n-1,Math.floor(a.y+r));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const px=x+.5,py=y+.5;if(Math.hypot(px-a.x,py-a.y)<=r)visit(px,py,w.idx(px,py))}};
const reachable=(sim,a,x,y)=>canSwim(a)||sim.world.sameLand(a.x,a.y,x,y);
function travel(sim,a,x,y,{move=true,trips=1}={}){
 const d=Math.hypot(x-a.x,y-a.y)*trips;if(!(d>0))return;
 a.energy-=B.moveEnergyPerCell*d*bodyMass(a)/a.genes.metabolism*(sim.speciesLifestyle?.movementEnergyMultiplier?.(a,{swimming:!!sim.world.water[sim.world.idx(x,y)]})||1);
 if(move&&canOccupy(a,sim.world,x,y)){const ox=a.x,oy=a.y;a.x=x;a.y=y;a.movedTick=sim.tickCount;sim.regionalEcology.notePageMove(a,ox,oy)}
}
// Animals inside a canonical transition keep it: their per-tick steps (digging,
// cave transit, climbing, ice, flight landing) continue in Simulation.update,
// and the population model neither relocates nor feeds them meanwhile.
// Underground walking needs the movement phase, so an animal underground stays
// there, still metabolizing, until its region returns to individual simulation.
export const inCanonicalTransition=a=>!!(a.underground||a.burrowWork||a.caveTransit||a.climb||a.perched||a.airborne||a.aerialMode||(a.diveDepth||0)>0||a.iceImmersion);
const scale=(sim,a,kind,live=false)=>a.genes.digestion*adaptationEffects(a).foodGain*(sim.speciesLifestyle?.foodEnergyMultiplier?.(a,live?{kind,livePrey:true}:{kind})||1);

function drink(sim,a){
 const s=SPECIES[a.species];if(a.hydration>=s.maxHydration*B.thirsty)return false;let spot=null,best=Infinity;
 near(sim,a,B.drinkRadius,(x,y)=>{const d=Math.hypot(x-a.x,y-a.y);if(d<best&&sim.world.isDrinkable(x,y)&&reachable(sim,a,x,y)){best=d;spot={x,y}}});
 if(!spot)return false;travel(sim,a,spot.x,spot.y,{move:false,trips:2});a.hydration=Math.min(s.maxHydration,a.hydration+B.drink);return true;
}
// Canonical prey choice and the shared capture/damage/bite-meal rule.
function hunt(sim,a){
 const prey=sim.bestPrey(a,26*a.genes.senses);
 if(!prey)return false;travel(sim,a,prey.x,prey.y);sim.tryKill(a,prey);return true;
}
function graze(sim,a){
 const s=SPECIES[a.species],w=sim.world,diet=Object.entries(groundDiet(a)).filter(([,e])=>e>0);if(!diet.length)return false;let best=null;
 near(sim,a,B.forageRadius,(x,y,i)=>{if(w.water[i]||!reachable(sim,a,x,y))return;
  for(const [kind,eff] of diet){const stock=kind==='carrion'?w.carrion[i]:w.plants[kind]?.[i]||0;if(stock<=0)continue;const v=stock*eff;if(!best||v>best.v)best={kind,eff,x,y,i,v}}});
 if(!best)return false;travel(sim,a,best.x,best.y);
 if(best.kind==='carrion'){const got=Math.min(B.carrionBite,w.carrion[best.i]);w.carrion[best.i]-=got;a.energy=Math.min(s.maxEnergy,a.energy+got*B.carrionEnergy*plantPreference(a,'carrion')*scale(sim,a,'carrion'));return got>0}
 const bite=Math.min(B.maxBite,FOOD_PROFILES[best.kind]?.bite??.18),got=w.consume(best.kind,best.x,best.y,bite);if(!(got>0))return false;
 sim.history.notePlantConsumption(best.kind,best.x,best.y,got);sim.dispersal.onFeed(a,best.kind,got);
 const nutrition=sim.dispersal.genomeAt(best.kind,best.i)?.traits.nutrition??PLANTS[best.kind].nutrition;
 a.energy=Math.min(s.maxEnergy,a.energy+got*nutrition*best.eff*a.genes.digestion*3.6*adaptationEffects(a).foodGain*(sim.speciesLifestyle?.foodEnergyMultiplier?.(a,{kind:best.kind})||1));return true;
}
function filterFeed(sim,a){
 const s=SPECIES[a.species];if(!sim.world.water[sim.world.idx(a.x,a.y)])return false;
 const meal=harvestFreshwater(sim,a,Math.min(B.freshwaterMeal,s.maxEnergy-a.energy));if(!meal)return false;a.energy+=meal.energyGain;return true;
}
function pair(sim,female,males){
 const s=SPECIES[female.species];
 if(inCanonicalTransition(female)||female.infected||female.pregnant||female.reproCooldown>0||female.age<s.maturity||female.energy<s.maxEnergy*(s.reproduction?.energy??.72))return false;
 if(s.reproduction?.minPrey){let prey=0;for(const b of sim.animals)if(b.alive&&Math.hypot(b.x-female.x,b.y-female.y)<=(s.reproduction.preyRadius||B.huntRadius)&&preyPreference(female,b)>0)prey++;if(prey<s.reproduction.minPrey)return false}
 const options=males.filter(m=>m.alive&&!inCanonicalTransition(m)&&!m.infected&&m.species===female.species&&m.reproCooldown<=0&&m.energy>=SPECIES[m.species].maxEnergy*(s.reproduction?.energy??.72)&&Math.hypot(m.x-female.x,m.y-female.y)<=B.mateRadius&&sim.conceptionAvailability(female,m).enabled)
  .sort((a,b)=>Math.hypot(a.x-female.x,a.y-female.y)-Math.hypot(b.x-female.x,b.y-female.y)||a.id-b.id);
 for(const m of options.slice(0,B.mateTries))if(sim.tryMate(female,m))return true;
 return false;
}
// One life stride of population-level behavior. Called by Simulation.update
// in place of perception, decision and movement when populationModel is set.
export function phaseRegionalDemography(sim){
 sim.rebuildSpatial();
 const living=sim.animals.filter(a=>a.alive&&!a.player),hunters=living.filter(canHunt);
 for(const a of living){
  if(!a.alive||inCanonicalTransition(a))continue;const s=SPECIES[a.species];a.intent='idle';a.target=null;
  if(drink(sim,a))continue;
  if(a.energy>=s.maxEnergy*B.hungry)continue;
  if(isWaterDweller(a)&&filterFeed(sim,a))continue;
  if(canHunt(a)&&hunt(sim,a))continue;
  graze(sim,a);
 }
 if(sim.tickCount%CFG.dayTicks===CFG.lifeStride){
  const males=living.filter(a=>a.alive&&a.sex==='M');
  for(const f of living)if(f.alive&&f.sex==='F')pair(sim,f,males);
 }
 return{animals:living.length,hunters:hunters.length};
}
