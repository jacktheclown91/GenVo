import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {buildYoungSummary,inheritedParts} from '../src/ui/young-summary.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// First-generation arc (creator direction 2026-10-23): the young card reports
// what each newborn actually inherited, read from the recorded inheritance.
const sim=new Simulation('PLANET-OBS-3',{player:true,worldGenerator:'planetary/1'});sim.setPlayerAutonomy(true);
const p=sim.player();let young=[];
for(let d=0;d<40&&!young.length;d++){for(let t=0;t<CFG.dayTicks;t++)sim.update(null);young=sim.animals.filter(a=>a.alive&&a.parentIds?.includes(p.id))}
assert.ok(young.length,'a natural litter');
const parts=a=>new Set((a.bodyPlan?.nodes||[]).map(n=>n.partId));
for(const c of young){
 const from=inheritedParts(c,p.id),mate=sim.animals.find(a=>a.id===c.parentIds.find(id=>id!==p.id)),all=[...from.you,...from.mate,...from.both,...from.new];
 assert.deepEqual(new Set(all),parts(c),'every part of the young is accounted for once');assert.equal(all.length,parts(c).size,'no part is listed twice');
 for(const x of from.you)assert.ok(parts(p).has(x),x+' from you is on the player');
 if(mate)for(const x of from.mate)assert.ok(parts(mate).has(x),x+' from the other parent is on the mate');
 for(const x of from.both)assert.ok(parts(p).has(x)||mate&&parts(mate).has(x));
}
const before=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'}));
const m=buildYoungSummary(sim,p,young,{first:true});
assert.equal(m.title,'Your First Young');assert.equal(m.young.length,young.length);assert.ok(m.young.every(y=>y.lines.length>0),'each young has inheritance lines');
assert.match(m.knowledge,/Knowledge is not/);assert.match(m.stakes,/press H/);assert.ok(m.notice.length>0);
assert.deepEqual(structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),before,'building the summary changes nothing');
sim.uiFirstYoungShown=true;const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'}));assert.equal(restoreSimulationSnapshot(snap).uiFirstYoungShown,true,'the first-young card is shown once per world, across saves');
console.log('Young summary PASS: natural litter, every inherited part attributed to you, the other parent, both or development, no state change, shown once per world.');
