import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {THUNDERSTORMS,thunderstormAt,lightningProposal,advanceThunderstorms,audibleThunder,stormRefugeDecision} from '../src/ecology/thunderstorms.js';
import {excavatePassage,excavationSite} from '../src/world/subsurface.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {AudioDirector} from '../src/audio/audio.js';
const s=new Simulation('CONTROLLED-THUNDER',{naturalCaves:false}),w=s.world,p=s.player();
// Controlled forcing isolates a genuine proposal/impact, not natural frequency.
s.climate={temp:.95,rain:2};const rng=s.rng.state;
let proposal;for(let tick=16;tick<=512;tick+=16){const q=lightningProposal(s,tick);if(q&&!w.water[q.i]&&excavationSite(w,q.i)){proposal=q;break}}
assert.ok(proposal);assert.equal(s.rng.state,rng,'proposal queries never draw biological randomness');
const location={x:proposal.i%w.n+.5,y:(proposal.i/w.n|0)+.5},wild=s.animals.find(a=>a.alive&&!a.player);
assert.ok(excavatePassage(w,proposal.i));Object.assign(p,location,{underground:true,burrowSince:0});Object.assign(wild,location);
const hp=p.health,wh=wild.health,water=w.water.slice(),terrain=w.terrain.elevation.slice(),beforeRng=s.rng.state;
s.tickCount=proposal.tick;const event=advanceThunderstorms(s);assert.equal(event.i,proposal.i);assert.equal(p.health,hp,'actual intact rock roof shields underground bodies');assert.ok(wild.health<wh);assert.equal(wild.injuryCare.damageCause,'a lightning strike');assert.equal(wild.injuryCare.attackerSpecies,null);
assert.deepEqual(w.water,water);assert.deepEqual(w.terrain.elevation,terrain);assert.equal(s.rng.state,beforeRng);assert.ok(s.thunderstorms.hits>0);
const serial=s.thunderstorms.serial;assert.equal(advanceThunderstorms(s),null);assert.equal(s.thunderstorms.serial,serial,'same tick cannot strike twice');
const struck=structuredClone(createSimulationSnapshot(s,{savedAt:'strike'}));assert.deepEqual(createSimulationSnapshot(restoreSimulationSnapshot(structuredClone(struck)),{savedAt:'strike'}),struck,'damage, injury cause and bounded strike history restore exactly');
const observer={...wild,x:location.x+3,y:location.y,underground:false};assert.equal(audibleThunder(s,observer,event),null,'sound has finite travel delay');
s.tickCount+=2;assert.ok(audibleThunder(s,observer,event));assert.equal(audibleThunder(s,{...observer,x:location.x+90},event),null,'audibility respects finite anatomy/range');
// Real procedural cue dispatch, without requiring an audio device in Node.
const audio=new AudioDirector(s);audio.unlocked=true;audio.enabled=true;let sounds=0;audio.playCue=name=>{if(name==='thunder')sounds++};const originalPlayer=s.player;s.player=()=>observer;audio.pollThunder();audio.pollThunder();assert.equal(sounds,1,'one audible wave is not replayed each frame');s.player=originalPlayer;
const normal=new Simulation('THUNDER-NORMAL');for(let k=0;k<48;k++)normal.update(null);
const captured=createSimulationSnapshot(normal,{savedAt:'capture'}),capturedStorms=structuredClone(captured.core.thunderstorms);normal.update(null);assert.deepEqual(captured.core.thunderstorms,capturedStorms,'later ticks cannot mutate an earlier captured storm record');
const snapshot=structuredClone(createSimulationSnapshot(normal,{savedAt:'fixed'})),restored=restoreSimulationSnapshot(structuredClone(snapshot));
assert.equal(restored.thunderRules,THUNDERSTORMS.policy);for(let k=0;k<16;k++){normal.update(null);restored.update(null)}assert.deepEqual(createSimulationSnapshot(restored,{savedAt:'fixed'}),createSimulationSnapshot(normal,{savedAt:'fixed'}),'ordinary exact next-event continuation');
const old=structuredClone(snapshot);delete old.core.thunderRules;delete old.core.thunderstorms;const historic=restoreSimulationSnapshot(old);assert.equal(Object.hasOwn(historic,'thunderRules'),false);assert.equal(Object.hasOwn(historic,'thunderstorms'),false);
const missing=structuredClone(snapshot);delete missing.core.thunderstorms;assert.throws(()=>restoreSimulationSnapshot(missing),/thunderstorm/);
const future=structuredClone(snapshot);future.core.thunderstorms.lastTick=future.core.tickCount+1;assert.throws(()=>restoreSimulationSnapshot(future),/thunderstorm/);
const disabled=new Simulation('THUNDER-OFF',{stormWeather:false});disabled.climate={temp:1,rain:3};assert.equal(thunderstormAt(disabled,10).intensity,0);assert.equal(lightningProposal(disabled,16),null);
// Mortality uses the existing carcass path, with the actual environmental cause.
let fatal;for(let tick=s.tickCount+1;tick<1024;tick++){const q=lightningProposal(s,tick);if(q&&!w.water[q.i]&&!s.animals.some(b=>b!==wild&&b.alive&&Math.hypot(b.x-(q.i%w.n+.5),b.y-((q.i/w.n|0)+.5))<1.5)){fatal=q;break}}
assert.ok(fatal);Object.assign(wild,{x:fatal.i%w.n+.5,y:(fatal.i/w.n|0)+.5,health:1});const carcass=w.carrion[fatal.i];s.tickCount=fatal.tick;advanceThunderstorms(s);assert.equal(wild.alive,false);assert.ok(s.stats.byCause.lightning>=1);assert.ok(w.carrion[fatal.i]>carcass,'real existing body biomass becomes carrion');
// Read-only local refuge choice uses actual reach and view, with a controlled
// protective-roof interface. It does not claim naturally constructed shelters.
const r=new Simulation('STORM-REFUGE'),a=r.animals.find(a=>a.alive&&!a.player);r.climate={temp:1,rain:3};
let spot;for(let y=10;y<110&&!spot;y++)for(let x=10;x<110&&!spot;x++)if(r.canOccupy(a,x+.5,y+.5)&&r.canOccupy(a,x+2.5,y+.5)&&r.canReach({...a,x:x+.5,y:y+.5},x+2.5,y+.5))spot={x:x+.5,y:y+.5};assert.ok(spot);Object.assign(a,spot,{dir:2});
const shelter=r.shelter;r.shelter={nearest:probe=>Math.hypot(probe.x-a.x-2,probe.y-a.y)<.5?{integrity:100}:null,weatherQuality:()=>1};const state=structuredClone(a),rrng=r.rng.state;const refuge=stormRefugeDecision(r,a);assert.ok(refuge?.target.stormRefuge);assert.deepEqual(a,state);assert.equal(r.rng.state,rrng);r.shelter=shelter;
console.log('Thunderstorms PASS: deterministic real weather, injury/roof shielding, bounded delayed audio, refuge read-only queries and exact historical/new persistence.');
