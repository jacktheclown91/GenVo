import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {worldResourceAt} from '../src/ui/world-resource-target.js';
const s=new Simulation('VISIBLE-RESOURCE-SELECTION'),w=s.world;
// Sensory fog hides precise resources the player has not perceived, so use the
// plant patch nearest the player.
const pl=s.player();let cell,bestD=Infinity;for(let y=2;y<w.n-2;y++)for(let x=2;x<w.n-2;x++){const i=w.idx(x,y);if(w.water[i])continue;const food=Object.keys(w.plants).find(k=>w.plants[k][i]>.08),d=Math.hypot(x+.5-pl.x,y+.5-pl.y);if(food&&d<bestD){bestD=d;cell={i,food,x:x+.5,y:y+.5,hitX:x+.5,hitY:y+.5}}}
assert.ok(cell);s.nests=[];s.eggs=[];s.shelter.activeShelters=()=>[];
const r={screenToWorld:()=>({x:cell.hitX,y:cell.hitY}),plantTargetWorld:w,visiblePlantTargets:new Map()};
const rng=s.rng.state,amount=w.plants[cell.food][cell.i];
assert.equal(worldResourceAt(s,r,0,0).kind,'ground','invisible biomass is not a clicked plant');
r.visiblePlantTargets.set(cell.i+'|'+cell.food,cell);
assert.equal(worldResourceAt(s,r,0,0).food,cell.food,'visible anchor selects exact patch');
assert.equal(s.rng.state,rng);assert.equal(w.plants[cell.food][cell.i],amount,'picking is read-only');
r.plantTargetWorld={};assert.equal(worldResourceAt(s,r,0,0).kind,'ground','stale world artwork cannot select food');r.plantTargetWorld=w;
w.plants[cell.food][cell.i]=0;assert.equal(worldResourceAt(s,r,0,0).kind,'ground','depleted plant cannot remain selectable');
// Foreground flora remains selectable over water; depletion reveals the source below.
w.plants[cell.food][cell.i]=amount;w.water[cell.i]=1;
assert.equal(worldResourceAt(s,r,0,0).food,cell.food,'Visible shoreline flora takes precedence over background water');
assert.equal(w.plants[cell.food][cell.i],amount);assert.equal(s.rng.state,rng);
w.plants[cell.food][cell.i]=0;assert.equal(worldResourceAt(s,r,0,0).kind,'water','Depleted flora exposes actual background water');
console.log('Visible plant selection, bare ground, depletion, stale-world and read-only checks PASS');
