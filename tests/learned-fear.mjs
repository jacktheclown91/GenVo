import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG,PLANTS} from '../src/sim/config.js';
import {FEAR,PLACE} from '../src/cognition/cognition.js';

// v1.33.2 Learned fear: where a Stalker attacked or killed a relative becomes a place the
// family fears. Witnesses learn it, young are taught it, it steers autonomous family away
// while strong, fades over FEAR.days and dies with those who hold it.

function setup(seed){
  const sim=new Simulation(seed,{player:true}),p=sim.player();sim.endOpeningGrace?.('test');sim.openingGraceEnded=true;
  const stalker=sim.animals.find(a=>a.alive&&SPECIES[a.species]?.hunter)||sim.spawnAnimal('needlejaw',p.x+1,p.y);stalker.x=p.x+1;stalker.y=p.y;
  const near=sim.spawnAnimal('genvo',p.x+3,p.y+1);near.lineage=true;near.age=SPECIES.genvo.maturity+3;
  const far=sim.spawnAnimal('genvo',Math.min(120,p.x+20),p.y);far.lineage=true;far.age=SPECIES.genvo.maturity+3;
  return{sim,p,stalker,near,far,cog:sim.cognition};
}
const hit=(sim,pred,prey)=>{const c=sim.rng.chance;sim.rng.chance=()=>true;const r=sim.tryKill(pred,prey);sim.rng.chance=c;return r};

// A Stalker hit teaches the victim and the relatives who saw it, not those far away.
{
  const {sim,p,stalker,near,far,cog}=setup('GENVO8-FEAR-HIT');p.health=100;hit(sim,stalker,p);
  const mine=cog.knownPlaces(p,'danger');assert.equal(mine.length,1,'the victim fears where it was attacked');assert.equal(mine[0].cause.killed,false);
  const seen=cog.knownPlaces(near,'danger');assert.equal(seen.length,1,'a relative who saw it fears it too');assert.equal(seen[0].source,'witnessed');assert.ok(seen[0].sureness<1);
  assert.equal(cog.knownPlaces(far,'danger').length,0,'a relative too far away to see learns nothing');
}

// A kill: the dead creature holds nothing, the witnesses remember a Stalker taking it.
{
  const {sim,stalker,near,cog}=setup('GENVO8-FEAR-KILL');const victim=sim.spawnAnimal('genvo',near.x-1.5,near.y);victim.lineage=true;victim.age=SPECIES.genvo.maturity+2;victim.health=1;
  stalker.x=victim.x+.8;stalker.y=victim.y;hit(sim,stalker,victim);assert.equal(victim.alive,false);
  const f=cog.knownPlaces(near,'danger')[0];assert.ok(f);assert.equal(f.cause.killed,true);assert.equal(f.cause.victimId,victim.id);
}

// Fear steers optional trips away; survival needs and the player's own control are not overridden.
{
  const {sim,p,stalker,near,cog}=setup('GENVO8-FEAR-STEER');hit(sim,stalker,p);const fear=cog.knownPlaces(near,'danger')[0],rng=sim.rng.state;
  near.intent='feed';near.target={x:fear.x+.5,y:fear.y,kind:'sunmoss'};assert.equal(cog.steerFromFear(near),true);
  assert.equal(near.intent,'explore');assert.ok(Math.hypot(near.target.x-fear.x,near.target.y-fear.y)>FEAR.radius,'the trip is moved outside the feared zone');
  near.intent='drink';near.target={x:fear.x,y:fear.y};assert.equal(cog.steerFromFear(near),false,'thirst still wins');
  near.intent='escape';assert.equal(cog.steerFromFear(near),false);
  p.intent='feed';p.target={x:fear.x,y:fear.y};assert.equal(cog.steerFromFear(p),false,'the creature you control goes where you take it');
  assert.equal(sim.rng.state,rng,'fear consumes no RNG');
  // Real decisions run the same steering.
  near.intent='explore';near.target={x:fear.x,y:fear.y};sim.phaseDecision(null);assert.ok(!near.target||Math.hypot(near.target.x-fear.x,near.target.y-fear.y)>FEAR.radius-1e-9||!FEAR.elective.includes(near.intent),'decisions keep optional trips out of the feared zone');
}

// Fear fades: it stops steering once weak and is forgotten after FEAR.days.
{
  const {sim,p,stalker,near,cog}=setup('GENVO8-FEAR-FADE');hit(sim,stalker,p);const fear=cog.knownPlaces(near,'danger')[0],start=sim.tickCount;
  assert.ok(FEAR.days>PLACE.forgetDays,'fear outlasts ordinary places');
  sim.tickCount=start+Math.round(CFG.dayTicks*FEAR.days*.8);near.intent='feed';near.target={x:fear.x,y:fear.y};
  assert.equal(cog.steerFromFear(near),false,'an old, faded fear no longer turns the family away');
  sim.tickCount=start+Math.round(CFG.dayTicks*(FEAR.days+1));assert.equal(cog.knownPlaces(near,'danger').length,0,'and is forgotten in time');
}

// Young learn fear from a wary caregiver, imperfectly; known food there drops out of route suggestions.
{
  const {sim,p,stalker,cog}=setup('GENVO8-FEAR-TEACH');hit(sim,stalker,p);const fear=cog.knownPlaces(p,'danger')[0];
  const young=sim.spawnAnimal('genvo',p.x+.5,p.y,[p,sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id)]);young.lineage=true;young.age=SPECIES.genvo.maturity*.4;young.caregiverId=p.id;
  sim.family.observeLearning(young,p);const taught=cog.knownPlaces(young,'danger')[0];assert.ok(taught,'the young learns to fear it');assert.equal(taught.source,'taught');assert.ok(Math.abs(taught.sureness-PLACE.taughtSure)<1e-9);
  const kind=Object.keys(PLANTS).find(k=>(SPECIES.genvo.diets?.[k]||0)>0),s=sim.foraging.state(p);
  s.patches=[{id:'t',kind,x:fear.x+1,y:fear.y,firstSeenTick:sim.tickCount,lastSeenTick:sim.tickCount,bestSeen:1,lastAmount:1,lastRatio:1,status:'abundant',visits:2,meals:2,seasonSamples:{},competition:{family:0,wildlife:0,pressure:0,tick:sim.tickCount}}];
  p.x=fear.x+10;p.y=fear.y;p.energy=SPECIES.genvo.maxEnergy*.3;assert.equal(sim.foraging.routeSuggestion(p),null,'a feared feeding ground is not suggested');
}

// Walking back into a feared place: the creature's memory speaks up.
{
  const {sim,p,stalker,cog}=setup('GENVO8-FEAR-NOTE');hit(sim,stalker,p);const fear=cog.knownPlaces(p,'danger')[0];p.x=fear.x+.5;p.y=fear.y;
  for(let i=0;i<8&&!cog.fearNotice;i++){sim.tickCount++;cog.observePlaces(p)}
  const n=cog.takeFearNotice();assert.ok(n);assert.match(n.text,/remembers a Stalker attacking itself here/);
}

// What only one creature feared dies with it.
{
  const {sim,stalker,near,cog}=setup('GENVO8-FEAR-LOST');const loner=sim.spawnAnimal('genvo',100,100);loner.lineage=true;loner.age=SPECIES.genvo.maturity+2;
  cog.knowPlace(loner,'danger',100,100,{cause:{victimId:loner.id,killed:false}});sim.kill(loner,'old age');
  assert.match(cog.takeKnowledgeNotice().text,new RegExp(`Only #${loner.id} knew a place to fear`));
}
console.log('learned fear ok');
