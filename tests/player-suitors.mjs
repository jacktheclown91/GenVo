import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {installPhysicalStarter} from '../src/ui/physical-starter-presets.js';

// Player report 2026-10-22: in a new game every creature followed the player
// until its first mating. A manually controlled player conceives only with the
// creature it chose to court, so wild suitors could never succeed and re-chose
// the player forever. Quick starts also left the starter mate pointing at the
// generated default mate (same sex, far away) instead of the real companion.
const sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1',regionalFrontier:true});
installPhysicalStarter(sim,'jump');const p=sim.player(),companion=sim.animals.find(a=>a.id===sim.starterMateId);
assert.ok(companion?.lineage&&companion.sex!==p.sex,'the starter mate is the introduced opposite-sex companion');
assert.ok(Math.hypot(companion.x-p.x,companion.y-p.y)<3,'the companion starts beside the player');
const suitors=new Set();
for(let t=0;t<CFG.dayTicks*3;t++){sim.update({up:false,down:false,left:false,right:false,sprint:false,...((t%40)<6?{right:true}:{})});
 for(const a of sim.animals)if(a.alive&&!a.player&&a.intent==='mate'&&a.target?.id===p.id)suitors.add(a.id)}
assert.ok([...suitors].every(id=>id===companion.id),'only the founding partner courts a manual player unasked: '+[...suitors]);
const wild=sim.animals.find(a=>a.alive&&!a.lineage&&a.species==='genvo'&&a.sex!==p.sex&&a.age>40);
assert.ok(wild,'a wild candidate exists');
const unchosen=sim.autonomousMateTarget(wild,{far:true});assert.notEqual(unchosen?.id,p.id,'an unchosen wild animal never targets the manual player');
// Under AUTO the player is an ordinary participant again.
sim.setPlayerAutonomy(true);assert.equal(sim.isManualPlayer(p),false);
console.log('Player suitors PASS: quick-start companion is the starter mate, unchosen wild suitors never pursue a manual player, AUTO unchanged.');
