import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {UNDERGROUND_FEEDING} from '../src/ecology/underground-feeding.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function dryPoint(sim,x0,y0){
  for(let r=0;r<18;r++)for(let a=0;a<Math.PI*2;a+=Math.PI/12){const x=x0+Math.cos(a)*r,y=y0+Math.sin(a)*r;if(x<6||y<6||x>122||y>122)continue;const i=sim.world.idx(x,y);if(!sim.world.water[i]&&!sim.world.isDrinkable(x,y))return{x,y};}
  throw new Error('no dry point');
}

const sim=new Simulation('GENVO8-FORAGE-SEASON-COMPETE',{player:true}),p=sim.player(),w=sim.world,rng=sim.rng.state;
const home=dryPoint(sim,64,64);p.x=home.x;p.y=home.y;p.energy=SPECIES.genvo.maxEnergy*.22;p.hydration=SPECIES.genvo.maxHydration*.72;
for(const a of sim.animals){if(a.id===p.id)continue;a.x=110+(a.id%4);a.y=108+(a.id%5);a.intent='idle';}
const berry=dryPoint(sim,home.x+8,home.y),seed=dryPoint(sim,home.x-8,home.y);
for(const point of [berry,seed])for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const i=w.idx(point.x+ox,point.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0;}
w.plants.bramble[w.idx(berry.x,berry.y)]=.78;w.plants.thistlepod[w.idx(seed.x,seed.y)]=.56;

// Learn both places in summer. Thistlepod is season-favored and should win a roughly even choice.
sim.seasonIndex=1;
p.x=berry.x;p.y=berry.y;sim.foraging.rememberPatch(p,'bramble',berry.x,berry.y);
p.x=seed.x;p.y=seed.y;sim.foraging.rememberPatch(p,'thistlepod',seed.x,seed.y);
p.x=home.x;p.y=home.y;sim.tickCount+=CFG.dayTicks*.5;
let patches=sim.foraging.knownPatches(p),seedPatch=patches.find(x=>x.kind==='thistlepod'),berryPatch=patches.find(x=>x.kind==='bramble');
assert.equal(seedPatch.season,'SUMMER');assert.equal(seedPatch.seasonObserved,true);assert.match(seedPatch.seasonLabel,/strong this summer/);assert.match(berryPatch.seasonLabel,/steady this summer/);
let route=sim.foraging.routeSuggestion(p);assert.equal(route.kind,'thistlepod','summer-favored seed patch wins when pressure is otherwise similar');

// Observed feeding pressure can outweigh seasonal value. This is learned only while physically revisiting.
const competitors=sim.animals.filter(a=>a.alive&&a.id!==p.id&&(SPECIES[a.species]?.diets?.thistlepod||0)>0).slice(0,2);assert.equal(competitors.length,2);
for(const [n,a] of competitors.entries()){a.x=seed.x+1+n*.7;a.y=seed.y+.4;a.intent='feed';a.target={x:seed.x,y:seed.y,kind:'thistlepod'};}
p.x=seed.x;p.y=seed.y;sim.tickCount+=CFG.lifeStride;sim.foraging.rememberPatch(p,'thistlepod',seed.x,seed.y);
p.x=home.x;p.y=home.y;
seedPatch=sim.foraging.knownPatches(p).find(x=>x.kind==='thistlepod');assert.ok(seedPatch.competitionPressure>=.48);assert.equal(seedPatch.competitionLabel,'contested');assert.ok(seedPatch.wildlifeUse>=2);assert.match(sim.foraging.competitionNote(seedPatch),/wildlife/);
route=sim.foraging.routeSuggestion(p);assert.equal(route.kind,'bramble','remembered heavy feeding pressure can make a quieter patch preferable');
assert.ok(sim.cognition.state(p).history.some(h=>h.type==='forage-contested'),'first heavy competition observation enters ordinary field history');

// Moving competitors away off-screen does not magically refresh knowledge. Pressure fades only as memory ages.
for(const a of competitors){a.x=114;a.y=114;a.intent='idle';a.target=null;}
const rememberedPressure=sim.foraging.knownPatches(p).find(x=>x.kind==='thistlepod').competitionPressure;assert.ok(rememberedPressure>.4);
sim.tickCount+=CFG.dayTicks*8;
const aged=sim.foraging.knownPatches(p).find(x=>x.kind==='thistlepod');assert.ok(aged.competitionPressure<rememberedPressure,'old competition memory decays while away');assert.ok(aged.competitionPressure>0,'old competition memory does not instantly vanish');

// Returning refreshes the real local picture and can record that the patch became quiet again.
p.x=seed.x;p.y=seed.y;sim.tickCount+=CFG.lifeStride;sim.foraging.rememberPatch(p,'thistlepod',seed.x,seed.y);
const refreshed=sim.foraging.knownPatches(p).find(x=>x.kind==='thistlepod');assert.equal(refreshed.competitionLabel,'quiet');assert.ok(sim.cognition.state(p).history.some(h=>h.type==='forage-open'),'quieting is only learned after a real revisit');

// Founder-line relatives are remembered separately from unrelated grazers.
const relatives=sim.animals.filter(a=>a.alive&&a.id!==p.id&&a.species==='genvo').slice(0,2);assert.equal(relatives.length,2);for(const [n,a] of relatives.entries()){a.lineage=true;a.x=seed.x+.8+n*.8;a.y=seed.y-.5;a.intent='feed';a.target={x:seed.x,y:seed.y,kind:'thistlepod'};}
sim.tickCount+=CFG.lifeStride;sim.foraging.rememberPatch(p,'thistlepod',seed.x,seed.y);const familyUsed=sim.foraging.knownPatches(p).find(x=>x.kind==='thistlepod');assert.ok(familyUsed.familyUse>=2);assert.equal(familyUsed.competitionLabel,'family-used');assert.match(sim.foraging.competitionNote(familyUsed),/family/);
assert.equal(sim.rng.state,rng,'season and competition forage memory consumes no simulation RNG');

// Headless ecology must remain unaware of player forage memory.
// New games feed underground wildlife through the wild interaction (underground-feeding/1);
// worlds built without it keep their original underground eating.
const headless=new Simulation('GENVO8-FORAGE-SEASON-HEADLESS',{player:false,undergroundFeeding:UNDERGROUND_FEEDING.policy});headless.seasonIndex=2;for(let i=0;i<CFG.lifeStride*6;i++)headless.update(null);assert.equal(headless.foraging.states.size,0);

console.log('seasonal forage reliability + observed competition checks: PASS');
