import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {FOUNDER_PLACEMENTS} from '../src/lineage/body-inheritance.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {inheritedMovementDifference,visibleDescendantGuide} from '../src/ui/lineage-stakes.js';
import {buildGenerationReveal} from '../src/ui/generation-reveal.js';
import {TutorialController} from '../src/ui/tutorial.js';

const sim=new Simulation('FIRST-GENERATION-INHERITANCE',{player:true,bootstrap:false});
const parent=sim.spawnAnimal('genvo',42.5,42.5),mate=sim.spawnAnimal('genvo',43.5,42.5);
sim.playerId=parent.id;parent.player=true;sim.lineage.establishFounder(parent);
const child=sim.spawnAnimal('genvo',44.5,42.5,[parent,mate]);
sim.lineage.registerBirth(child,[parent,mate]);sim.family.registerBirth(child,parent,mate);
assert.equal(child.lineage,true,'a real lineage descendant is registered');
const sprinter=makePlan(FOUNDER_PLACEMENTS.map(p=>p.socket==='limb.1'||p.socket==='limb.7'?{...p,partId:'spring-leg'}:p));
assert.ok(validatePlan(sprinter).ok,'demonstration uses a real validated mounted body');
// Controlled offspring fixture represents a naturally reachable inherited mutation,
// not a new editor privilege or a fabricated ability awarded by this feature.
child.bodyPlan=sprinter;
const before=sim.rng.state;
const difference=inheritedMovementDifference(sim,parent,child);
assert.ok(difference.gained.some(a=>a.id==='jump'),'G2 has both real spring legs and current jumping rules');
assert.equal(difference.lost.length,0,'a single new verb does not invent a loss');
assert.equal(inheritedMovementDifference(sim,parent,parent).gained.length,0,'matching bodies do not invent novelty');
const priorRules=sim.jumpingRules;delete sim.jumpingRules;
assert.ok(!inheritedMovementDifference(sim,parent,child).gained.some(a=>a.id==='jump'),'historical worlds do not advertise unavailable verbs');
sim.jumpingRules=priorRules;
const backwards=inheritedMovementDifference(sim,child,parent);
assert.ok(backwards.lost.some(a=>a.id==='jump'),'ancestral loss is honestly represented');

const unrelated=sim.spawnAnimal('genvo',44.5,42.5);
assert.equal(visibleDescendantGuide(sim,parent,unrelated),null,'unrelated actors are not given heir markers');
let seen=null;
for(let dir=0;dir<8&&!seen;dir++){parent.dir=dir;seen=visibleDescendantGuide(sim,parent,child);}
assert.ok(seen&&seen.x===child.x&&seen.y===child.y,'real observed descendant can receive a world-space marker');
const oldX=child.x,oldY=child.y;child.x+=32;child.y+=32;
assert.equal(visibleDescendantGuide(sim,parent,child),null,'distant unseen descendants never expose precise positions');
child.x=oldX;child.y=oldY;
child.underground=true;
assert.equal(visibleDescendantGuide(sim,parent,child),null,'separate cave layer cannot reveal heir');
child.underground=false;child.alive=false;
assert.equal(visibleDescendantGuide(sim,parent,child),null,'dead children are never marked as living successors');
child.alive=true;

const genes={body:1,motion:1,metabolism:1,digestion:1,senses:1,climate:1,immunity:1,temperament:1};
const model=buildGenerationReveal({handoff:{from:parent.id,to:child.id,generation:2,reason:'handoff',changes:[],founderChanges:[]},
 fromRecord:{generation:1,genes},toRecord:{generation:2,genes},inheritedMovement:difference});
assert.ok(model.chips.some(v=>v==='BODY CAN JUMP'),'functional inherited movement is visible before opening details');
assert.ok(model.details.some(([k,v])=>k==='Inherited movement'&&v.includes('when conditions allow')),
 'no promise that anatomy ignores costs, ecology, terrain or breath');

// Exercise the actual first-generation tutorial branch, not just its text formatter.
child.age=SPECIES.genvo.maturity+1;
const controller=Object.create(TutorialController.prototype);
controller.sim=sim;controller.renderer={guideTarget:null};controller.render=(title,body,opts={})=>{controller.shown={title,body,opts}};
for(const name of ['renderPredatorAlert','renderStalkerDenWarning','renderTerritoryShift','renderSuccession','renderGenerationChallenge','renderIllness','renderFamilyIllness','renderExposure','renderFamilyWeather','renderStormAftermath','renderInjury','renderKnownWater','renderForagePatch','renderSpeciesGoal','renderLifestyleGoal'])controller[name]=()=>false;
controller.renderDynamicGoal(parent);
assert.match(controller.shown.body,/living descendant/i,'first heir changes the early-game purpose');
assert.match(controller.shown.body,/jump/i,'the actual new inherited verb matters before handoff');
assert.match(controller.shown.body,/H compares living heirs/i,'player retains a voluntary handoff');
assert.equal(sim.rng.state,before,'read-only on-screen guidance does not consume ecological RNG');
console.log('First-generation heir: anatomical threshold, observed relative, inherited movement reveal and real guide PASS');
