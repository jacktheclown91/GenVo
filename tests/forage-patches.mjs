import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG,PLANTS} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function setup(seed='GENVO8-FORAGE-PATCH'){
  const sim=new Simulation(seed,{player:true}),p=sim.player(),w=sim.world;
  let spot=null;
  outer:for(let y=10;y<118;y++)for(let x=10;x<118;x++){
    if(w.water[w.idx(x,y)]||w.isDrinkable(x+.5,y+.5))continue;
    for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++)if(w.water[w.idx(x+ox,y+oy)])continue outer;
    spot={x:x+.5,y:y+.5};break outer;
  }
  assert.ok(spot,'dry forage patch staging point exists');p.x=spot.x;p.y=spot.y;p.health=100;p.hydration=SPECIES.genvo.maxHydration*.8;
  for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(124,spot.x+24+(a.id%4));a.y=Math.min(124,spot.y+22+(a.id%5))}
  for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++){const i=w.idx(spot.x+ox,spot.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
  const i=w.idx(spot.x,spot.y);w.plants.bramble[i]=.8;sim.rebuildSpatial();return{sim,p,w,spot,i};
}

{
  const {sim,p,w,spot,i}=setup(),rng=sim.rng.state;
  let last=null;
  for(let n=0;n<5;n++){
    p.energy=SPECIES.genvo.maxEnergy*.35;
    sim.foraging.state(p).selectedKind='bramble';sim.foraging.state(p).manual=true;
    last=sim.playerInteract();assert.equal(last.ok,true);assert.equal(last.kind,'bramble');
  }
  const state=sim.foraging.state(p),patch=state.patches[0];
  assert.equal(state.patches.length,1,'repeated feeding in one place becomes one learned patch');
  assert.equal(patch.kind,'bramble');assert.equal(patch.status,'exhausted','repeated harvesting can pick a learned patch nearly clean');
  assert.equal(last.patch.status,'exhausted','depletion remains available to deeper UI without cluttering the action toast');assert.doesNotMatch(last.message,/patch exhausted/);assert.equal(sim.rng.state,rng,'patch learning and depletion consume no simulation RNG');
  assert.ok(sim.cognition.state(p).history.some(h=>h.type==='forage-depleted'),'patch depletion enters ordinary field history');

  // Move away and advance only memory time. The route estimate must not secretly inspect the still-empty world cell.
  let away=null;for(let d=9;d<=14&&!away;d++){const x=spot.x+d,y=spot.y;if(x<124&&!w.water[w.idx(x,y)])away={x,y}}
  assert.ok(away);p.x=away.x;p.y=away.y;p.energy=SPECIES.genvo.maxEnergy*.30;sim.tickCount+=CFG.dayTicks*8;sim.rebuildSpatial();
  assert.equal(w.plants.bramble[i],0,'the real patch is still empty before staged regrowth');
  const remembered=sim.foraging.knownPatches(p)[0];assert.ok(remembered.estimatedRatio>0,'away-from-patch recovery is only a learned estimate');assert.ok(remembered.ageDays>=7.9);
  const route=sim.foraging.routeSuggestion(p);assert.ok(route,'a hungry player can route toward a learned patch expected to be recovering');assert.equal(route.kind,'bramble');assert.ok(route.distance>8);

  // Actual state only refreshes after physically returning to the patch.
  w.plants.bramble[i]=.62;p.x=spot.x;p.y=spot.y;sim.foraging.observeNearby(p);
  const refreshed=sim.foraging.state(p).patches[0];assert.ok(['usable','abundant'].includes(refreshed.status),'returning to real regrowth refreshes patch knowledge');
  assert.equal(refreshed.lastEvent,'recovered');assert.ok(sim.cognition.state(p).history.some(h=>h.type==='forage-recovered'),'recovery is recorded only after observation');
}

{
  const sim=new Simulation('GENVO8-FORAGE-PATCH-HEADLESS',{player:false});
  for(let i=0;i<CFG.lifeStride*4;i++)sim.update(null);
  assert.equal(sim.foraging.states.size,0,'headless ecology does not create player forage-patch knowledge');
}

console.log('learned forage patch depletion + recovery checks: PASS');
