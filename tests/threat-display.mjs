import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {stalkerProfileFor} from '../src/organisms/stalker-profile.js';
import {actionCapabilities} from '../src/lineage/action-capabilities.js';
import {THREAT_DISPLAY,appraiseDisplay,displayActive,verdictText} from '../src/gameplay/threat-display.js';
import {bodyVerbs} from '../src/ui/body-verbs.js';

// Anatomy as verbs (creator direction 2026-10-23): the threat display exists only for bodies
// with display anatomy, costs breath and a standing pause, and is judged by each hunter from
// real state (apparent size, real bite, wounds, boldness, hunger). Never guaranteed.
function dryField(sim){
 const w=sim.world;
 for(let y=14;y<CFG.worldSize-14;y++)for(let x=14;x<CFG.worldSize-14;x++){
  let ok=true;for(let oy=-7;oy<=7&&ok;oy++)for(let ox=-7;ox<=7;ox++)if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}
  if(ok)return{x:x+.5,y:y+.5};
 }
 return null;
}
const withFrill=plan=>({...plan,id:plan.id+'-frill',nodes:[...plan.nodes,{id:'root/dorsal',partId:'display-frill',partVersion:1,parent:'root',socket:'dorsal'}]});
function setup(seed){
 const sim=new Simulation(seed,{player:true}),p=sim.player();sim.endOpeningGrace('test');const f=dryField(sim);assert.ok(f);p.x=f.x;p.y=f.y;
 for(const a of sim.animals)if(a!==p&&a.alive&&Math.hypot(a.x-p.x,a.y-p.y)<14){a.x=Math.min(CFG.worldSize-3,a.x+30)}
 return{sim,p};
}
function hunter(sim,p,{fed,temperament=1,dx=3}){
 const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw'&&!a.playerHunt)||sim.spawnAnimal('needlejaw');
 h.x=p.x+dx;h.y=p.y;h.dir=6;h.health=100;h.energy=SPECIES.needlejaw.maxEnergy*fed;h.genes.temperament=temperament;
 h.playerHunt={targetId:p.id,phase:'stalk',style:stalkerProfileFor(h).id,role:'stalk',startedTick:sim.tickCount,untilTick:sim.tickCount+99,lastOutcome:null,aimX:null,aimY:null,stamina:CFG.stalkerPursuit.stamina};
 return h;
}
const rngState=sim=>JSON.stringify(sim.rng);

// 1. No display anatomy: no verb, and trying it changes nothing.
{
 const {sim,p}=setup('GENVO8-DISPLAY-A');
 assert.equal(actionCapabilities(sim).display,false,'a body without display anatomy has no threat display');
 const before=[p.exertion,p.energy],r=sim.playerThreatDisplay();
 assert.equal(r.ok,false);assert.match(r.message,/display anatomy/);assert.deepEqual([p.exertion,p.energy],before);assert.equal(p.threatDisplay,undefined);
}

// 2. A frill grants the verb; displaying costs breath and energy, and moving ends it.
{
 const {sim,p}=setup('GENVO8-DISPLAY-B');p.bodyPlan=withFrill(p.bodyPlan);
 assert.equal(actionCapabilities(sim).display,true,'a display frill grants the threat display');
 sim.exertion.ensure(p);const breath=p.exertion,energy=p.energy,r=sim.playerThreatDisplay();
 assert.equal(r.ok,true,r.message);assert.equal(p.exertion,breath-THREAT_DISPLAY.breath);assert.ok(p.energy<energy);
 assert.ok(displayActive(sim,p));assert.equal(sim.threatDisplayStatus().enabled,false,'no second display while displaying');
 p.x+=1;assert.equal(displayActive(sim,p),false,'moving off the spot ends the display');
 p.x-=1;sim.tickCount=p.threatDisplay.untilTick+1;assert.equal(displayActive(sim,p),false,'the display ends after its time');
 assert.equal(sim.threatDisplayStatus().enabled,false,'the display has a recovery time');
}

// 3. Real appraisal: a fed hunter of similar size backs off; a starving one keeps coming.
{
 const {sim,p}=setup('GENVO8-DISPLAY-C');p.bodyPlan=withFrill(p.bodyPlan);
 const fed=hunter(sim,p,{fed:1}),starving=hunter(sim,p,{fed:.05,dx:-3});starving.dir=2;
 const fedView=appraiseDisplay(fed,{...p,threatDisplay:{spread:.25}}),starvingView=appraiseDisplay(starving,{...p,threatDisplay:{spread:.25}});
 assert.ok(fedView.deterred&&!starvingView.deterred,`fed ${fedView.score.toFixed(2)}>=${fedView.resolve.toFixed(2)}, starving ${starvingView.score.toFixed(2)}<${starvingView.resolve.toFixed(2)}`);
 assert.ok(sim.playerThreatDisplay().ok);const rng=rngState(sim);
 const a=sim.predator.decision(fed,p);
 assert.equal(fed.playerAversion?.reason,'deterred','the fed hunter breaks off');assert.ok(['escape','return-den'].includes(a.intent));
 assert.deepEqual([sim.lastPlayerPredatorOutcome.outcome,sim.lastPlayerPredatorOutcome.hunterId],['deterred',fed.id]);
 assert.equal(sim.lastThreatDisplayVerdict.deterred,true);assert.match(verdictText(sim.lastThreatDisplayVerdict),/backs off/);
 const b=sim.predator.decision(starving,p);
 console.log(`  fed hunter: display ${fedView.score.toFixed(2)} vs resolve ${fedView.resolve.toFixed(2)}; starving: ${starvingView.score.toFixed(2)} vs ${starvingView.resolve.toFixed(2)}`);
 assert.equal(starving.playerHunt?.targetId,p.id,'the starving hunter keeps hunting');assert.ok(b);
 const judged=sim.lastThreatDisplayVerdict;assert.equal(judged.hunterId,starving.id);assert.equal(judged.deterred,false);assert.match(verdictText(judged),/keeps coming/);
 sim.predator.decision(starving,p);assert.equal(sim.lastThreatDisplayVerdict,judged,'each hunter judges a display once');
 assert.equal(rngState(sim),rng,'judging a display consumes no RNG');
 assert.deepEqual(fed.displayHabit,{targetId:p.id,count:1},'the hunter remembers being turned away');
}

// 4. Boldness and hunger raise resolve; a bigger display and real bite raise the threat.
{
 const {sim,p}=setup('GENVO8-DISPLAY-D');p.bodyPlan=withFrill(p.bodyPlan);const h=hunter(sim,p,{fed:.6});
 const at=(o={},spread=.25)=>appraiseDisplay({...h,...o,genes:{...h.genes,...(o.genes||{})}},{...p,threatDisplay:{spread}});
 assert.ok(at({genes:{temperament:1.4}}).resolve>at().resolve,'bold hunters hold their nerve');
 assert.ok(at({energy:h.energy*.3}).resolve>at().resolve,'hungry hunters hold their nerve');
 assert.ok(at({},.5).score>at({},.1).score,'a larger display looks larger');
 assert.ok(appraiseDisplay(h,{...p,threatDisplay:{spread:.25}},{wounds:2}).score>at().score,'wounds already taken count');
 const once=appraiseDisplay(h,{...p,threatDisplay:{spread:.25}},{habituated:1});assert.ok(once.resolve>at().resolve,'a hunter gets used to a display that already turned it away');
}

// 5. A committed charge is past judging.
{
 const {sim,p}=setup('GENVO8-DISPLAY-E');p.bodyPlan=withFrill(p.bodyPlan);const h=hunter(sim,p,{fed:1});
 Object.assign(h.playerHunt,{phase:'charge',aimX:p.x,aimY:p.y,untilTick:sim.tickCount+20,laneLength:4,laneTravel:0});
 assert.ok(sim.playerThreatDisplay().ok);sim.predator.decision(h,p);
 assert.equal(sim.lastThreatDisplayVerdict,undefined,'a charging hunter does not stop to judge');assert.equal(h.playerHunt?.phase,'charge');
}

// 6. The Creature Lab names verbs gained and lost from the same authorities.
{
 const {sim,p}=setup('GENVO8-DISPLAY-F'),frilled={...p,bodyPlan:withFrill(p.bodyPlan)};
 assert.deepEqual(bodyVerbs(sim,frilled,p).find(v=>v.key==='display'),{key:'display',label:'Threat display',change:'new'});
 assert.deepEqual(bodyVerbs(sim,p,frilled).find(v=>v.key==='display'),{key:'display',label:'Threat display',change:'lost'});
 assert.equal(bodyVerbs(sim,p,p).some(v=>v.change!=='kept'),false);
}
console.log('Threat display PASS: anatomy-gated, paid, judged once per hunter from real state, no RNG, charge is final, Lab verbs from authorities.');
