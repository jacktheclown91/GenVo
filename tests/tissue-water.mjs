import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {TISSUE_WATER,waterFromPrey,depositCarcassWater,waterFromCarrion,dryCarrion} from '../src/ecology/tissue-water.js';
import {remainingPreyBiomass} from '../src/ecology/prey-biomass.js';
import {canHunt} from '../src/ecology/functional-diet.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Water from prey and carrion (creator decision 2026-10-23): tissue water comes only from the eaten
// animal's own body water, in proportion to the tissue eaten; carcasses keep it and it dries;
// nothing is created; player and wildlife share the rule; drinking is unchanged; recorded worlds
// keep dry meat.
const make=(tissueWater=true)=>new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,tissueWater,worldGenerator:'planetary/1'});
const total=sim=>sim.animals.filter(a=>a.alive).reduce((t,a)=>t+a.hydration,0)+(sim.world.carrionWater?.reduce((t,v)=>t+v,0)||0);

// 1. A bite carries the eaten share of the prey's water; the prey loses exactly that.
{
 const sim=make(),pred=sim.animals.find(a=>a.alive&&canHunt(a)),prey=sim.animals.find(a=>a.alive&&!canHunt(a)&&!a.player);
 const P=SPECIES[pred.species];pred.hydration=P.maxHydration*.3;prey.hydration=SPECIES[prey.species].maxHydration*.8;
 const tissue=remainingPreyBiomass(prey),preyWater=prey.hydration,predWater=pred.hydration;
 const gained=waterFromPrey(sim,pred,prey,tissue*.25,tissue);
 assert.ok(Math.abs(prey.hydration-preyWater*.75)<1e-9,'the prey loses a quarter of its water with a quarter of its tissue');
 assert.ok(Math.abs(gained-preyWater*.25)<1e-9&&Math.abs(pred.hydration-predWater-gained)<1e-9,'the predator gains exactly that water');
 // A full predator gains nothing: the excess is lost, never stored.
 pred.hydration=P.maxHydration;const before=total(sim);assert.equal(waterFromPrey(sim,pred,prey,tissue*.1,tissue*.75),0);assert.ok(total(sim)<=before+1e-9,'no water is created');
 assert.ok(sim.stats.tissueWater.overflowLost>0);
}
// 2. Carcasses keep the dead body's water; scavengers take their share; it dries and is capped.
{
 const sim=make(),a=sim.animals.find(x=>x.alive&&!x.player),i=sim.world.idx(a.x,a.y),bodyWater=a.hydration,before=total(sim);
 sim.kill(a,'test');assert.ok(Math.abs(sim.world.carrionWater[i]-bodyWater)<1e-6&&a.hydration===0,'the carcass keeps the body water');assert.ok(Math.abs(total(sim)-before)<1e-6,'death moves water, it does not create it');
 const scav=sim.animals.find(x=>x.alive&&!x.player&&x!==a);scav.hydration=0;const tissue=sim.world.carrion[i],cell=sim.world.carrionWater[i];
 sim.world.carrion[i]-=tissue/2;const got=waterFromCarrion(sim,scav,i,tissue/2,tissue);
 assert.ok(Math.abs(got-cell/2)<1e-6,'half the tissue carries half the water');
 for(let d=0;d<6;d++)dryCarrion(sim);assert.ok(sim.world.carrionWater[i]<cell/2*.2,'carrion dries within days');
 sim.world.carrion[i]=0;dryCarrion(sim);assert.equal(sim.world.carrionWater[i],0,'water never outlasts the tissue');
}
// 3. Same rule for player and wildlife: the player's kill bite uses the same function; drinking still happens.
{
 const sim=make();sim.setPlayerAutonomy(true);let hunterDrinks=0;
 for(let t=0;t<CFG.dayTicks*6;t++){sim.update(null);if(t%CFG.lifeStride===0)for(const a of sim.animals)if(a.alive&&canHunt(a)&&a.intent==='drink')hunterDrinks++}
 const st=sim.stats;assert.ok(!(st.byCause?.predation>0)||(st.tissueWater?.fromPrey||0)+(st.tissueWater?.fromCarrion||0)>0,'hunting returns water whenever there was predation');
 assert.ok(hunterDrinks>0,'hunters still seek and drink water: '+hunterDrinks);
 console.log(`  6 days: ${st.byCause?.predation||0} kills, water from prey ${(st.tissueWater?.fromPrey||0).toFixed(1)}, from carrion ${(st.tissueWater?.fromCarrion||0).toFixed(1)}, hunter drinking decisions ${hunterDrinks}`);
}
// 4. Saves keep the policy and carrion water; recorded worlds keep dry meat.
{
 const sim=make(),a=sim.animals.find(x=>x.alive&&!x.player);sim.kill(a,'test');
 const back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));
 assert.equal(back.tissueWaterRules,TISSUE_WATER.policy);assert.deepEqual([...back.world.carrionWater],[...sim.world.carrionWater]);
 const dry=make(false),p=dry.animals.find(x=>x.alive&&canHunt(x)),q=dry.animals.find(x=>x.alive&&!canHunt(x)&&!x.player);
 assert.equal(waterFromPrey(dry,p,q,1,1),0);dry.kill(q,'test');assert.equal(dry.world.carrionWater,undefined,'worlds without the rule keep dry meat');
 const old=new Simulation('GENVO8-TEST-A',{player:true,worldGenerator:'planetary/1'});assert.equal(restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(old,{savedAt:'t',reason:'t'}))).tissueWaterRules,undefined);
}
console.log('Tissue water PASS: water from the eaten share of body water only, carcass water kept and dried, nothing created, saved, recorded worlds dry.');
