import {AudioDirector} from '../src/audio/audio.js';
import {movementContact} from '../src/audio/movement-contact.js';
import assert from 'node:assert/strict';
import {WildlifeContactTracker} from '../src/audio/wildlife-contact.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const p={id:1,x:0,y:0},a={id:2,x:1,y:0,alive:true},b={id:3,x:2,y:0,alive:true},sim={world:{},animals:[p,a,b],player:()=>p,paused:false},tracker=new WildlifeContactTracker();
assert.deepEqual(tracker.sample(sim,.12),[],'new arrivals establish a silent baseline');
for(let i=0;i<10;i++)assert.deepEqual(tracker.sample(sim,.12),[],'stationary wildlife cannot create contact');
a.x+=.6;b.x+=.6;let cues=tracker.sample(sim,.12);assert.equal(cues.length,1);assert.equal(cues[0].animal,a,'nearest actual moving actor wins the bounded mix slot');assert.equal(tracker.sample(sim,.12).length,0,'dropped simultaneous contacts are not replayed');
a.x+=.6;assert.equal(tracker.sample(sim,.05).length,0);assert.equal(tracker.sample(sim,.07).length,1);
a.x+=100;assert.equal(tracker.sample(sim,.12).length,0,'teleport cannot create accumulated steps');
a.x=1;tracker.sample(sim,.12);for(const key of ['hidden','airborne','perched','climb','burrowWork','caveTransit','torpor','underground']){a[key]=true;a.x+=.6;assert.ok(!tracker.sample(sim,.12).some(c=>c.animal===a));delete a[key];tracker.sample(sim,.12)}
sim.paused=true;a.x+=.6;assert.deepEqual(tracker.sample(sim,.12),[]);sim.paused=false;assert.deepEqual(tracker.sample(sim,.12),[],'resume primes fresh positions');
sim.world={};assert.deepEqual(tracker.sample(sim,.12),[]);p.id=4;assert.deepEqual(tracker.sample(sim,.12),[]);
const herd=Array.from({length:100},(_,i)=>({id:100+i,alive:true,x:1+i*.01,y:0}));sim.animals=[p,...herd];tracker.sample(sim,.12);for(const a of herd)a.x+=.6;assert.equal(tracker.sample(sim,.12).length,1);assert.equal(tracker.states.size,12,'listening history remains bounded');
p.diveDepth=.2;assert.deepEqual(tracker.sample(sim,.12),[]);assert.equal(tracker.states.size,0);
const real=new Simulation('WILD-CONTACT-READS',{player:true}),snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(real,{savedAt:'wild-contact'}))),before=snap();for(let i=0;i<20;i++)tracker.sample(real,.12);assert.equal(snap(),before);

const director=new AudioDirector(null),destination={},routes=[];director.ctx={currentTime:1};director.unlocked=true;director.noise=(...args)=>routes.push(args.at(-1));director.tone=(...args)=>routes.push(args.at(-1));director.playContact(movementContact(null,a),false,null,destination);assert.ok(routes.length>=1&&routes.every(route=>route===destination),'every contact layer retains the spatial destination');
director.sim=real;director.wildlifeContacts.sample(real,.12);director.enabled=false;director.pollSimulationEvents=()=>{};director.update(.01);assert.equal(director.wildlifeContacts.states.size,0,'muting clears stale displacement history');director.wildlifeContacts.sample(real,.12);director.ctx=null;director.setSimulation(real);assert.equal(director.wildlifeContacts.states.size,0);
console.log('Wildlife contact PASS: displacement-only, spatial candidates, bounded nearest mix, no backlog, identity/teleport/pause/exclusion resets, 12-state ceiling and full biological parity.');
