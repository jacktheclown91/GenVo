import assert from 'node:assert/strict';
import {CreatureContextTray} from '../src/ui/creature-context-tray.js';
import {QuickInteractionSelection} from '../src/ui/quick-interaction.js';

// Found in Phase 4 ordinary play: after one plain E meal, every later E stayed pinned to that first
// (now depleted) patch while the prompt showed the food actually underfoot, so the player starved.
// Plain E must act on the shown default; only an explicit choice (Q / radial) is remembered.
const actor={id:1},sim={player:()=>actor,paused:false};
let patches={here:{key:'eat:fruit:1',label:'Eat fruit',enabled:true,target:{kind:'plant',i:1}}};
const invoked=[],results=[];
const tray=Object.create(CreatureContextTray.prototype);
Object.assign(tray,{quickSelection:new QuickInteractionSelection(),radial:{close(){}},stageBlocked:()=>false,getSim:()=>sim,onResult:r=>results.push(r),
  commandTarget:()=>null,commandDescriptors:options=>options.map(o=>({...o,invoke:()=>invoked.push(o.key)})),quickChoices:null});
sim.interactionOptions=()=>[patches.here];

tray.interact();
assert.deepEqual(invoked,['eat:fruit:1']);
assert.ok(!tray.quickSelection.choice,'a plain E press does not pin a remembered target');

// The fruit patch is exhausted and the creature now stands on moss: plain E eats the moss.
patches.here={key:'eat:sunmoss:7',label:'Eat Moss',enabled:true,target:{kind:'plant',i:7}};
tray.interact();
assert.deepEqual(invoked,['eat:fruit:1','eat:sunmoss:7'],'plain E follows the shown default, not an old patch');
assert.equal(results.length,0);

// An explicit choice is still honoured and still reports when it becomes unavailable.
tray.quickSelection.remember(sim,patches.here);
patches.here={key:'drink',label:'Drink',enabled:true,target:{kind:'water',i:9}};
tray.interact();
assert.equal(invoked.length,2,'an explicitly selected, now-missing action is not silently redirected');
assert.match(results.at(-1).message,/no longer available/);
console.log('plain E acts on the shown default; explicit Q selection keeps its documented stickiness PASS');
