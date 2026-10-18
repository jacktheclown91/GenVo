import assert from 'node:assert/strict';
import {interactAs} from './helpers/interaction.js';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {stalkerProfileFor} from '../src/organisms/stalker-profile.js';
import {WILD_START,wildStartPlan,wildTraits,wildBranch,isWildSpecies} from '../src/organisms/wild-bodies.js';
import {partEffectFactors} from '../src/lineage/part-abilities.js';
import {createDraft,place,replaceRoot} from '../src/lineage/evolution-draft.js';
import {bodyPlanFromLegacy,makePlan} from '../src/lineage/body-plan.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {mutatePlan,founderPlan} from '../src/lineage/body-inheritance.js';

// Living wildlife (creator direction 2026-10-09): predators and prey are built from the same parts
// the player evolves, with different core bodies; they inherit and mutate, and branches appear.

// Each wild species starts from its own core body, built only from registry parts.
const torsos=Object.fromEntries(Object.keys(WILD_START).map(s=>[s,wildStartPlan(s).nodes.find(n=>!n.parent).partId]));
assert.ok(new Set(Object.values(torsos)).size>=4,'expansion includes multiple distinct core bodies');for(const s of Object.keys(WILD_START))for(const n of wildStartPlan(s).nodes)assert.ok(PARTS[n.partId],`${s}: ${n.partId}`);

const sim=new Simulation('GENVO8-WILD',{player:true});sim.endOpeningGrace?.('test');
// Starting bodies play like the original creatures.
for(const a of sim.animals.filter(a=>isWildSpecies(a.species))){assert.equal(a.bodyPlan.id,wildStartPlan(a.species).id);const t=wildTraits(a);assert.equal(t.chaseSpeed,1);assert.equal(t.damage,1);assert.equal(t.toughness,a.species==='podshell'?.81:1);assert.ok(wildBranch(a).label)}
const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw');assert.equal(stalkerProfileFor(stalker),stalkerProfileFor({...stalker,bodyPlan:undefined}));

// An evolved body changes how it plays, through the same part effects the player's creatures use.
const evolve=(a,edits)=>{const d=createDraft({base:a.bodyPlan,ancestry:Object.keys(PARTS),budget:99});for(const [part,parent,socket] of edits){const r=part.endsWith('torso')?replaceRoot(d,part):place(d,part,parent||'root',socket);assert.equal(r.ok,true,`${part}: ${r.reason}`)}a.bodyPlan=d.plan;return a};
{const s=evolve({...stalker,id:-1},[['runner-leg',null,'limb.0'],['runner-leg',null,'limb.4'],['runner-leg',null,'limb.2'],['runner-leg',null,'limb.6']]);assert.ok(wildTraits(s).chaseSpeed>1,'more legs chase faster');assert.ok(stalkerProfileFor(s).chargeSpeed>stalkerProfileFor(stalker).chargeSpeed)}
{const s=evolve({...stalker,id:-2},[['armor-plate',null,'flank.left'],['armor-plate',null,'flank.right']]);assert.ok(wildTraits(s).toughness<1,'armor makes the player\'s bite weaker');assert.equal(wildBranch(s).label,'Armored Stalker')}
{const s=evolve({...stalker,id:-3},[['venom-gland',null,'flank.left']]);assert.equal(wildBranch(s).label,'Venom Stalker');const prey=sim.animals.find(a=>a.alive&&a.species==='mosskip');prey.health=999;s.alive=true;assert.equal(sim.partAbilities.envenom(s,prey),true,'a venom gland poisons, as on GenVo8s')}
{const h=sim.animals.find(a=>a.alive&&a.species==='mosskip'),e=evolve({...h,id:-4},[['spine-cluster',null,'flank.left'],['spine-cluster',null,'flank.right']]);assert.ok(wildTraits(e).spines>0);assert.equal(wildBranch(e).label,'Spined Hopper')}
// Actual digging limbs supply their action even in a starting body; numeric baselines stay neutral.
{const d=sim.animals.find(a=>a.alive&&a.species==='rootling');assert.equal(partEffectFactors(d).dig,true);assert.equal(partEffectFactors(d).landSpeed,1);assert.equal(partEffectFactors(d).metabolism,1);assert.equal(sim.partAbilities.canDigAt(d),true)}

// The original 420-day natural scenario is retained in wild-evolution-observation.mjs.
// Its survival/evolved-survivor/branch counts are observations, not universal biological gates.

// Special creatures: the Elder Stalker carries its relic parts on its body, drops a relic when it
// dies, and the relic unlocks those parts; relic parts never come from mutation.
{const g=new Simulation('GENVO8-ELDER',{player:true});g.update();const D=g.discovery;g.day=40;D.elderDay=0;D.maybeElder();
 const elder=g.animals.find(a=>a.alive&&a.elder?.kind==='elder-stalker');assert.ok(elder,'an Elder Stalker appears');const parts=elder.bodyPlan.nodes.map(n=>n.partId);assert.ok(parts.includes('tusk-jaw')&&parts.includes('horn-crest'),'it visibly carries its relic parts');
 assert.equal(stalkerProfileFor(elder).visual.accent,'#f0c040');
 const p=g.player(),draft=()=>createDraft({base:bodyPlanFromLegacy(p),ancestry:[],budget:99,unlocked:D.unlockedParts});
 assert.equal(place(draft(),'tusk-jaw','root','mouth').ok,false,'relic parts are locked before the relic');
 g.kill(elder,'predation');const relic=D.sites.find(s=>s.kind==='relic');assert.ok(relic,'it leaves a relic');
 p.x=relic.x;p.y=relic.y;const r=interactAs(g,assert,'collect-relic');assert.equal(r.type,'relic',r.message);assert.deepEqual([...D.unlockedParts].sort(),['horn-crest','tusk-jaw']);
 assert.equal(place(draft(),'tusk-jaw','root','mouth').ok,true,'the relic unlocks the part');
 let plan=founderPlan();const rng={i:3,int(a,b){this.i=(this.i*1103515245+12345)&0x7fffffff;return a+this.i%(b-a+1)},chance:()=>true,next:()=>.5};for(let k=0;k<300;k++){plan=mutatePlan(rng,plan);assert.ok(!plan.nodes.some(n=>n.partId==='tusk-jaw'||n.partId==='horn-crest'),'mutation never produces relic parts')}}
console.log('wild evolution ok');
