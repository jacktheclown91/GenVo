import {interactAs} from './helpers/interaction.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {createDraft,place,draftCost} from '../src/lineage/evolution-draft.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import {SITE_KINDS} from '../src/gameplay/discovery.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Phase G first slice (2026-10-09): places to discover, a field guide and trials.
// The player is updated with a controls object, as main.js does every frame: with none, the simulation's own
// decision rules would steer the player (and since Phase 3K it walks continuously, off the site it stands on).
const sim=new Simulation('GENVO8-DISCOVERY',{player:true}),p=sim.player(),D=sim.discovery;sim.endOpeningGrace?.('test');
for(let i=0;i<CFG.simHz;i++)sim.update({});
const ALL=Object.keys(PARTS);
const design=(a,edits)=>{const d=createDraft({base:bodyPlanFromLegacy(a),ancestry:ALL,budget:99});for(const [part,parent,socket] of edits)assert.equal(place(d,part,parent||'root',socket).ok,true,part);applyLineageTarget(a,d.plan);return a};
const goTo=(a,site)=>{a.x=site.x;a.y=site.y};

// Places: every kind exists, one of each lies near the start, and the layout is fixed by the seed.
for(const kind of Object.keys(SITE_KINDS))if(SITE_KINDS[kind].count){const sites=D.sites.filter(s=>s.kind===kind);assert.ok(sites.length>=3,`${kind} sites`);assert.ok(sites.some(s=>Math.hypot(s.x-p.x,s.y-p.y)<=40),`a ${kind} near the start`)}
{const again=new Simulation('GENVO8-DISCOVERY',{player:true});again.update();assert.deepEqual(again.discovery.sites.map(s=>[s.kind,s.x,s.y]),D.sites.map(s=>[s.kind,s.x,s.y]))}
const site=kind=>D.sites.find(s=>s.kind===kind);

// Walking near a place finds it; three places complete a trial and earn bonus points.
const before=sim.evolutionBudget.sinceHandoff;for(const kind of ['pod-grove','still-pool','hollow-log']){goTo(p,site(kind));for(let i=0;i<CFG.simHz;i++)sim.update({})}
assert.ok(D.found.length>=3);assert.ok(D.trials.discover3,'discover three places');assert.ok(sim.evolutionBudget.sinceHandoff>before,'discoveries and trials count toward the bonus');

// Lookout: reveals nearby places and Stalkers, and completes its trial.
goTo(p,site('lookout'));for(let i=0;i<CFG.simHz;i++)sim.update({});assert.ok(D.trials.lookout);assert.ok(D.revealUntil>sim.tickCount);

// Pod grove: food there is more filling.
goTo(p,site('pod-grove'));assert.equal(D.foodBonus(p,'thistlepod'),1.3);goTo(p,{x:p.x+30,y:p.y});

// Still pool: drinking there also feeds.
{const pool=site('still-pool');goTo(p,pool);assert.ok(D.poolBonus(p)>0)}

// Hollow log: anyone can hide there, and a hidden creature in a log is concealed.
{goTo(p,site('hollow-log'));p.hidden=false;const r=sim.playerHide();assert.equal(r.ok,true,r.message);const h=sim.animals.find(a=>a.alive&&SPECIES[a.species]?.hunter);h.x=p.x+5;h.y=p.y;assert.equal(sim.camouflageConceals(p,h),true);p.hidden=false}

// Thorn brake: a refuge from Stalkers that scratches soft bodies but not armored ones. The scratch is read as the
// lowest health over two seconds: a resting, nourished body heals it back on ecology steps (Phase 3K: with a
// controls object the player now stands still, and a scratch can land on the same tick as a heal).
{const brake=site('thorn-brake');goTo(p,brake);assert.equal(D.refugeFor(p),true);p.health=100;let low=100;for(let i=0;i<CFG.simHz*2;i++){sim.update({});low=Math.min(low,p.health)}assert.ok(low<100,'soft bodies are scratched');
 design(p,[['armor-plate',null,'flank.left']]);p.health=100;for(let i=0;i<CFG.simHz;i++)sim.update({});assert.equal(p.health>=99.9,true,'armored bodies pass freely')}

// Nest ruin: gathered material builds a home where there is no plant material.
{goTo(p,site('nest-ruin'));p.nestMaterial=0;const r=interactAs(sim,assert,'collect-material');assert.equal(r.type,'nest',r.message);assert.ok(p.nestMaterial>=1);
 const carried=p.nestMaterial;assert.ok(sim.shelter.materialAvailable(p.x,p.y)>=carried)}

// Root mound: a digger digs it for a much larger meal; others cannot.
{const mound=site('root-mound');goTo(p,mound);const plain=sim.partAbilities.canDigAt(p);design(p,[['digging-forelimb',null,'limb.0']]);assert.equal(plain,false);
 p.energy=20;const r=sim.partAbilities.dig(p);assert.equal(r.ok,true,r.message);assert.ok(r.energyGain>20,'three times a normal root meal');assert.equal(mound.stock,4)}

// Field guide: parts seen on wild GenVo8s cost 1 MP less in the editor.
{const d0=createDraft({base:bodyPlanFromLegacy(p),ancestry:ALL,budget:99}),d1=createDraft({base:bodyPlanFromLegacy(p),ancestry:ALL,budget:99,known:['tearing-jaw']});
 place(d0,'tearing-jaw','root','mouth');place(d1,'tearing-jaw','root','mouth');assert.equal(draftCost(d1),draftCost(d0)-1)}
{const wild=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.lineage);design(wild,[['club-tail',null,'tail']]);wild.x=p.x+2;wild.y=p.y;sim.tickCount=Math.ceil(sim.tickCount/(CFG.simHz*2))*CFG.simHz*2-1;sim.update({});assert.ok(D.seenParts.includes('club-tail'),'a wild part is noted')}

// Carcass: appears near the active creature and draws a Stalker when approached.
{sim.day+=13;D.lastCarcassDay=0;D.tick();const before=D.sites.filter(s=>s.kind==='carcass').length;D.spawnCarcass(p);const c=D.sites.filter(s=>s.kind==='carcass').at(-1);assert.ok(c&&D.sites.filter(s=>s.kind==='carcass').length>before);
 assert.ok(sim.world.carrion[sim.world.idx(c.x,c.y)]>1);for(const o of D.sites)if(o.kind==='carcass'&&o!==c)o.gone=true;goTo(p,c);{const h=sim.animals.find(a=>a.alive&&SPECIES[a.species]?.hunter);h.playerHunt=null;h.x=c.x+8;h.y=c.y}p.hidden=false;sim.tickCount=Math.ceil(sim.tickCount/CFG.simHz)*CFG.simHz-1;sim.update({});assert.equal(c.lured,true,'the carcass draws a Stalker')}

// Save and reload keep places, finds, trials and seen parts.
{const r=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim))),R=r.discovery;assert.deepEqual(R.sites.map(s=>s.id),D.sites.map(s=>s.id));assert.deepEqual(R.found,D.found);assert.deepEqual(R.trials,D.trials);assert.deepEqual(R.seenParts,D.seenParts)}
console.log('discovery ok');
