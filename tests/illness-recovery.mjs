import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('ILLNESS-RECOVERY',{player:true});
const p=sim.player();
sim.endOpeningGrace('test');
p.energy=SPECIES.genvo.maxEnergy*.9;p.hydration=SPECIES.genvo.maxHydration*.9;p.health=100;
// Use the canonical shelter object shape without consuming world material for this focused recovery test.
sim.shelter.shelters.length=0;sim.shelter.shelters.push({id:1,ownerId:p.id,x:p.x,y:p.y,integrity:100,weatherSeal:1,foodStore:6,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);assert(mate,'nearby susceptible family exists');mate.x=p.x+.8;mate.y=p.y+.2;mate.infected=false;mate.immune=false;mate.immuneUntilDay=0;
const rng0=sim.rng.state;assert(sim.disease.infect(p,{force:true,source:'test'}),'player can be infected for focused test');
assert.equal(sim.rng.state,rng0,'starting player illness does not consume simulation RNG');
p.intent='idle';p.target=null;
for(let i=0;i<6;i++)sim.illness.phase();
let snap=sim.illness.snapshot(p);assert.equal(snap.mode,'shelter-rest','idle infected player under family shelter is recuperating');assert(snap.restProgress>.7,'quiet sheltered rest builds meaningful same-day recovery support');assert(snap.familyAtRisk>=1,'shared family shelter exposes the existing close-contact tradeoff');assert.equal(sim.illness.effectMultiplier(p),.55,'sheltered rest strongly reduces illness physiological cost');
const e0=p.energy,h0=p.health,w0=p.hydration;sim.disease.phaseEffects();assert(p.energy<e0&&p.health<h0&&p.hydration<w0,'illness still has real cost while resting');assert(p.energy>e0-.16*p.infection.severity,'shelter rest reduces energy cost rather than removing disease');
const duration0=p.infection.duration;sim.illness.onDiseaseDay(p);assert.equal(p.illnessCare.supportedDays,1,'a well-fed hydrated rest day is retained');
for(let i=0;i<6;i++)sim.illness.phase();sim.illness.onDiseaseDay(p);assert.equal(p.illnessCare.supportedDays,2,'a second supported day is retained');assert.equal(p.infection.duration,Math.max(4,duration0-1),'two strong rest days can shorten a long fever by one day');
// Pushing hard while sick should be worse than ordinary disease strain.
p.intent='player';p.target={dx:1,dy:0,sprint:true};assert.equal(sim.illness.effectMultiplier(p),1.24,'sprinting while feverish increases disease strain');

// Resting alone in real dense vegetation is a slower isolation option.
const sh=sim.shelter.shelters[0];sh.x=p.x+10;sh.y=p.y;for(const other of sim.animals)if(other.id!==p.id&&other.species==='genvo'){other.x=p.x+9+(other.id%3);other.y=p.y+5+(other.id%2)}const i=sim.world.idx(p.x,p.y);sim.world.plants.bramble[i]=.72;p.intent='idle';p.target=null;
snap=sim.illness.snapshot(p);assert.equal(snap.mode,'isolation-rest','dense cover away from family is recognized as isolation rest');assert.equal(sim.illness.effectMultiplier(p),.72,'isolation rest reduces illness strain less than shelter rest');
// Recovery produces bounded convalescent history/immunity without stat bonuses.
sim.disease.recover(p);snap=sim.illness.snapshot(p);assert.equal(snap.infected,false);assert.equal(snap.recovering,true,'the fever break has a brief readable recovery state');assert(p.immuneUntilDay>sim.disease.absoluteDay(),'canonical acquired immunity remains intact');
assert.equal(sim.rng.state,rng0,'illness recovery decisions consume no simulation RNG');

const headless=new Simulation('ILLNESS-HEADLESS',{player:false});const a=headless.animals.find(x=>x.species==='genvo');headless.disease.infect(a,{force:true,source:'test'});headless.illness.phase();assert.equal(a.illnessCare,undefined,'player:false ecology creates no recuperation state');
console.log('illness recovery checks: PASS');
