// Provisional coefficient review (Phase 3J Step 6, diagnostic). For each species, adult and juvenile bodies:
// hollow-log fit (mass <= LOG_INTERIOR_MASS), cover needed to be hidden (coverHide x cube root of mass/1.45)
// and which single plant at full stock provides it, days to heal a 60-health wound resting well fed and the
// repair energy as a share of maximum energy. Usage: node tools/compare-coefficients.mjs [seed]
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;
const {Simulation}=await import('../src/sim/simulation.js');const {SPECIES}=await import('../src/organisms/species.js');const {CFG,PLANTS}=await import('../src/sim/config.js');
const {LOG_INTERIOR_MASS,COVER_REFERENCE_MASS}=await import('../src/ecology/refuges.js');const {HEAL_BASE,ACTIVITY_FACTOR,REPAIR_SHARE,TISSUE_ENERGY,REPAIR_EFFICIENCY}=await import('../src/ecology/healing-review.js');const {preyBodyMass}=await import('../src/ecology/prey-biomass.js');const {adaptationEffects}=await import('../src/lineage/evolution.js');
const sim=new Simulation(process.argv[2]||'COEFF-A',{player:false}),P=CFG.stalkerPursuit,COVER={bramble:.82,marshroot:.72,sunmoss:.42,thistlepod:.45};
const rows=[];
for(const sp of Object.keys(SPECIES)){const S=SPECIES[sp];for(const stage of ['adult','juvenile']){const as=sim.animals.filter(a=>a.alive&&a.species===sp&&(stage==='adult'?a.age>=S.maturity:a.age<S.maturity));if(!as.length)continue;
  const mass=as.map(preyBodyMass).sort((a,b)=>a-b),m=mass[mass.length>>1],need=P.coverHide*Math.cbrt(m/COVER_REFERENCE_MASS),plants=Object.entries(COVER).filter(([k,w])=>Math.min(1,PLANTS[k].carry)*w>=need).map(([k])=>k);
  const a=as[0],imm=as.map(x=>x.genes.immunity).sort((x,y)=>x-y)[as.length>>1],fx=adaptationEffects(a),rate=HEAL_BASE*ACTIVITY_FACTOR.rest*(stage==='juvenile'?1.25:1)*imm*fx.healing,days=60/rate/(CFG.dayTicks/CFG.lifeStride),cost=.6*m*REPAIR_SHARE*TISSUE_ENERGY/REPAIR_EFFICIENCY;
  rows.push({species:sp,stage,medianMass:+m.toFixed(2),fitsLog:m<=LOG_INTERIOR_MASS,coverNeeded:+need.toFixed(2),hiddenByFullStockOf:plants.join('/')||'none',severeWoundDaysResting:+days.toFixed(1),repairEnergyPctMax:+(cost/S.maxEnergy*100).toFixed(1)})}}
console.table(rows);console.log(JSON.stringify(rows));
