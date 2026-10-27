import {Simulation} from '../src/sim/simulation.js';
import assert from 'node:assert/strict';
import {matingTutorialState,MatingTutorialGuide} from '../src/ui/mating-tutorial-guide.js';
const actor={id:1,alive:true,x:0,y:0,sex:'F',genes:{senses:1}},mate={id:2,alive:true,x:1,y:0,sex:'M'};
let enabled=true,reason='';
const sim={animals:[actor,mate],starterMateId:2,player:()=>actor,reproduction:{
 ritualQueue:[],eligibleMates:()=>enabled?[mate]:[],
 courtshipAvailability:()=>({enabled,reason})}};
assert.equal(matingTutorialState(sim).step,'mate');
assert.equal(matingTutorialState(sim,{contextTargetId:2}).step,'court');
assert.equal(matingTutorialState(sim,{courtOpen:true,courtTargetId:2}).step,'approach');
sim.reproduction.ritualQueue=['call'];
assert.equal(matingTutorialState(sim,{courtOpen:true,courtTargetId:2}).step,'play','Already queued anatomical displays work without forcing Approach');
actor.intent='mate';actor.target=mate;
assert.equal(matingTutorialState(sim).step,'watch','An actual approach takes precedence over an empty tray');
actor.courtshipPerformance={partnerId:2};enabled=false;reason='Already performing';
assert.equal(matingTutorialState(sim).step,'watch','Do not label a current performance unavailable');
delete actor.courtshipPerformance;actor.intent='idle';delete actor.target;
reason='This partner is too young.';
const blocked=matingTutorialState(sim);
assert.equal(blocked.step,'unavailable');assert.equal(blocked.mate,undefined);assert.match(blocked.text,/too young/);
assert.equal(matingTutorialState(sim,{courtOpen:true,courtTargetId:2}).action,'back-off');
mate.alive=false;assert.match(matingTutorialState(sim).text,/Explore/);mate.alive=true;
sim.paused=true;assert.match(matingTutorialState(sim).text,/Resume/);sim.paused=false;
enabled=true;

// Real DOM lifecycle semantics: one visible control gets the cue, stale/hidden
// controls lose it, existing accessibility descriptions survive, no auto-click.
function button(action,id=2){
 const attributes=new Map([['aria-describedby','existing-help']]);
 return{dataset:{tutorialAction:action,targetId:String(id)},disabled:false,hidden:false,
  classList:{values:new Set(),add(v){this.values.add(v)},remove(v){this.values.delete(v)}},
  closest(selector){return selector==='[hidden]'?this.hidden?this:null:null},
  getAttribute:k=>attributes.get(k),setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};
}
const court=button('court'),approach=button('approach'),play=button('play');
const tray={hidden:true,dataset:{targetId:'2'},closest(){return this.hidden?this:null}};
const root={querySelectorAll(selector){if(selector==='.courtship-tray')return[tray];return[court,approach,play].filter(b=>selector.includes('"'+b.dataset.tutorialAction+'"'))}};
const coach=new MatingTutorialGuide(root);
assert.equal(coach.read(sim).step,'court');assert.equal(court.dataset.tutorialCue,'court');
assert.equal(court.getAttribute('aria-describedby'),'existing-help tutorial');
coach.read(sim);assert.equal(court.getAttribute('aria-describedby'),'existing-help tutorial');
tray.hidden=false;sim.reproduction.ritualQueue=[];
assert.equal(coach.read(sim).step,'approach');assert.equal(court.dataset.tutorialCue,undefined);
assert.equal(court.getAttribute('aria-describedby'),'existing-help');assert.equal(approach.dataset.tutorialCue,'approach');
sim.reproduction.ritualQueue=['approach'];assert.equal(coach.read(sim).step,'play');
assert.equal(approach.dataset.tutorialCue,undefined);assert.equal(play.dataset.tutorialCue,'play');
actor.intent='mate';actor.target=mate;coach.read(sim);
actor.intent='idle';actor.lastCourtshipRefusal={otherId:2,declinerId:2,count:1};
tray.hidden=true;
assert.match(coach.read(sim).text,/partner turned away/i,'Explain an actual refusal after the tray closes');
actor.intent='mate';coach.read(sim);actor.intent='idle';
actor.lastReproductiveAttempt={accepted:true,conceived:false};
actor.lastCourtshipFailure={partnerId:2,reason:'Both accepted; no pregnancy formed.'};
assert.match(coach.read(sim).text,/Both accepted; no pregnancy/);
actor.alive=false;assert.equal(coach.read(sim).step,'unavailable');assert.equal(court.dataset.tutorialCue,undefined);actor.alive=true;
coach.reset();assert.equal(court.dataset.tutorialCue,undefined);assert.equal(play.dataset.tutorialCue,undefined);
assert.equal(sim.reproduction.ritualQueue[0],'approach','Guidance does not consume or replace the player sequence');
court.getClientRects=()=>[];assert.equal(coach.read(sim).step,'mate','CSS-hidden controls do not receive cues');coach.reset();

const actual=new Simulation('MATING-COACH-AUTHORITY',{player:true});
const creature=actual.player();actual.reproduction.selectedMateId=null;
const before={energy:creature.energy,water:creature.hydration,rng:actual.rng.state};
const nativeCue=matingTutorialState(actual);
if(nativeCue.mate)assert.equal(actual.reproduction.courtshipAvailability({targetId:nativeCue.mate.id}).enabled,true);
assert.deepEqual({energy:creature.energy,water:creature.hydration,rng:actual.rng.state},before);
assert.equal(actual.reproduction.selectedMateId,null,'Reading the guide does not select a partner');
creature.health=1;
assert.equal(matingTutorialState(actual).step,'unavailable');
assert.equal(matingTutorialState(actual).mate,undefined,'No healthy-looking false marker when the actor is unwell');
console.log('Mating coach PASS: live Court/Approach/Play progression, consent outcomes, unavailable reasons, resumed sequences and accessible cue cleanup; no biological action');
