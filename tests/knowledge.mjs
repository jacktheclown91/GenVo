import {interactAs} from './helpers/interaction.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG,PLANTS} from '../src/sim/config.js';
import {PLACE} from '../src/cognition/cognition.js';
import {TutorialController} from '../src/ui/tutorial.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// v1.33 Knowledge inheritance and loss: places are known by particular creatures, taught
// imperfectly, forgotten, and lost at death. Built on cognition, foraging and family lessons.

const sim=new Simulation('GENVO8-KNOWLEDGE',{player:true}),p=sim.player(),w=sim.world,cog=sim.cognition;
const bank=w.nearestDrinkable(p.x,p.y,60);assert.ok(bank,'there is water to learn');

// A creature knows a bank by drinking at it.
{
  p.x=bank.x;p.y=bank.y;interactAs(sim,assert,'drink');
  const known=cog.knownWater(p);assert.ok(known,'drinking teaches a water place');assert.equal(known.source,'self');assert.ok(known.sureness>.99);
}

// A young beside its caregiver is shown the places the caregiver uses, imperfectly.
const young=sim.spawnAnimal('genvo',p.x+.6,p.y+.3,[p,sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id)]);
young.lineage=true;young.age=SPECIES.genvo.maturity*.4;young.caregiverId=p.id;
{
  const rngBefore=sim.rng.state;
  sim.lastPlayerAction={type:'drink',tick:sim.tickCount};sim.family.observeLearning(young,p);
  const taught=cog.knownWater(young);assert.ok(taught,'the young learned the water bank');assert.equal(taught.source,'taught');
  assert.ok(Math.abs(taught.sureness-PLACE.taughtSure)<1e-9,'a taught place starts less sure');
  assert.ok(Math.hypot(taught.x-p.x,taught.y-p.y)<=PLACE.jitter+2.2,'the copy is near the caregiver bank');assert.ok(w.isDrinkable(taught.x,taught.y),'but still on drinkable ground');
  // Food: the young learns the patch, but not how picked-over it was.
  const kind=Object.keys(PLANTS).find(k=>(SPECIES.genvo.diets?.[k]||0)>0);
  let spot=null;for(let r=1;r<30&&!spot;r++)for(let a=0;a<16&&!spot;a++){const x=Math.round(p.x+Math.cos(a)*r),y=Math.round(p.y+Math.sin(a)*r),i=w.idx(x,y);if(!w.water[i]&&(w.plants[kind]?.[i]||0)>.3)spot={x,y}}
  assert.ok(spot,'there is food to show');
  const own=sim.foraging.rememberPatch(p,kind,spot.x,spot.y,{meal:true});assert.ok(own);
  sim.foraging.state(p).patches.find(q=>q.kind===kind).lastRatio=.1;
  sim.lastPlayerAction={type:'eat',kind,tick:sim.tickCount+1};sim.tickCount++;young.x=p.x;young.y=p.y;sim.family.observeLearning(young,p);
  const patch=sim.foraging.knownPatches(young).find(q=>q.kind===kind);assert.ok(patch,'watching its caregiver eat teaches the patch');
  assert.equal(patch.taught,true);assert.equal(patch.status,'usable','the young does not know the patch was picked over');
  const mine=sim.foraging.knownPatches(p).find(q=>q.kind===kind);assert.ok(patch.confidence<mine.confidence,'a taught patch is less sure than one eaten from');
  assert.equal(sim.rng.state,rngBefore,'teaching consumes no RNG');
}

// Places fade and are forgotten when not revisited.
{
  const start=sim.tickCount;sim.tickCount=start+Math.round(CFG.dayTicks*PLACE.forgetDays*.5);
  assert.ok(cog.knownWater(young).sureness<PLACE.taughtSure*.6,'an unvisited place grows less sure');
  sim.tickCount=start+Math.round(CFG.dayTicks*(PLACE.forgetDays+1));
  assert.equal(cog.knownWater(young),null,'and is forgotten after enough days');
  assert.equal(sim.foraging.knownPatches(young).length,0,'unvisited food patches are forgotten too');
  sim.tickCount=start;
}

// What only one creature knew dies with it; shared knowledge survives.
{
  const s2=new Simulation('GENVO8-KNOWLEDGE-LOSS',{player:true}),pl=s2.player(),elder=s2.spawnAnimal('genvo',pl.x+2,pl.y);elder.lineage=true;elder.age=SPECIES.genvo.maturity+4;
  const b=s2.world.nearestDrinkable(pl.x,pl.y,80);s2.cognition.knowPlace(elder,'water',b.x,b.y);
  s2.kill(elder,'old age');const n=s2.cognition.takeKnowledgeNotice();
  assert.ok(n,'a unique place lost at death leaves a field note');assert.match(n.text,new RegExp(`Only #${elder.id} knew a water bank`));assert.match(n.text,/died with it/);
  const other=s2.spawnAnimal('genvo',pl.x+2,pl.y);other.lineage=true;other.age=SPECIES.genvo.maturity+4;s2.cognition.knowPlace(other,'water',b.x,b.y);s2.cognition.knowPlace(pl,'water',b.x+.5,b.y);
  s2.kill(other,'old age');assert.equal(s2.cognition.takeKnowledgeNotice(),null,'nothing is lost when a relative also knows the place');
}

// A successor knows only what it learned: the guide points to its own known water.
{
  const c=Object.create(TutorialController.prototype);c.sim=sim;c.renderer={guideTarget:null};c.render=(title,body,opts={})=>{c.shown={title,body,opts}};
  const stranger=sim.spawnAnimal('genvo',p.x,p.y);stranger.lineage=true;stranger.age=SPECIES.genvo.maturity+2;
  // Put both far from water, thirsty.
  let far=null;for(let i=0;i<w.len&&!far;i+=97){const x=i%w.n,y=Math.floor(i/w.n);if(!w.water[i]&&!w.nearestDrinkable(x,y,8))far={x:x+.5,y:y+.5}}
  assert.ok(far);for(const a of [young,stranger]){a.x=far.x;a.y=far.y;a.hydration=SPECIES.genvo.maxHydration*.2}
  young.age=SPECIES.genvo.maturity*.8;sim.lastPlayerAction={type:'drink',tick:sim.tickCount};young.x=p.x;young.y=p.y;sim.family.observeLearning(young,p);young.age=SPECIES.genvo.maturity+1;young.x=far.x;young.y=far.y;
  assert.equal(c.renderKnownWater(young),true);assert.equal(c.shown.title,'Known water');assert.equal(c.renderer.guideTarget.label,'Known water');
  assert.equal(c.renderKnownWater(stranger),true);assert.equal(c.shown.title,'Find water','a creature never shown water must search');assert.equal(c.renderer.guideTarget,null);
}

// Known places survive a save.
{
  const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  assert.ok(restored.cognition.knownWater(restored.animals.find(a=>a.id===p.id)),'known water survives save and load');
}
console.log('knowledge ok');
