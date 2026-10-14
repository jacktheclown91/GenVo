import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIAL_KINDS,wildTraits,wildStartPlan} from '../src/organisms/wild-bodies.js';
import {partEffectFactors} from '../src/lineage/part-abilities.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';
import {bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {inheritBody,founderPlan} from '../src/lineage/body-inheritance.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Special creatures (creator direction 2026-10-09): besides the Elder Stalker, a Golden Hopper, a
// Crystal Digger and a Ghost GenVo8 appear in the world, each visibly carrying two relic parts no
// creature evolves. When one dies, hunted or not, it leaves a relic that unlocks its parts.

assert.deepEqual(Object.keys(SPECIAL_KINDS),['elder-stalker','golden-hopper','crystal-digger','ghost-genvo']);
for(const s of Object.values(SPECIAL_KINDS))for(const id of s.parts)assert.ok(PARTS[id]?.tags.includes('exclusive'),`${id} is a relic part`);

const g=new Simulation('GENVO8-SPECIALS',{player:true});g.update();const D=g.discovery;
// None before their first day; all four by day 44 (days count across years).
g.day=10;D.maybeElder();assert.equal(D.specials().length,0);
g.day=50;D.maybeElder();const byKind=Object.fromEntries(D.specials().map(a=>[a.elder.kind,a]));
for(const [kind,spec] of Object.entries(SPECIAL_KINDS)){const a=byKind[kind];assert.ok(a,`a ${spec.label} appears`);assert.equal(a.species,spec.species);
  const parts=a.bodyPlan.nodes.map(n=>n.partId);for(const id of spec.parts)assert.ok(parts.includes(id),`the ${spec.label} carries its ${id}`);assert.ok(!a.lineage&&!a.player,'never the player\'s family')}
// One of each kind at a time.
D.specialDays={};D.maybeElder();assert.equal(D.specials().length,4);

// Their relic parts change how they play, through the same part effects as everything else.
assert.ok(wildTraits(byKind['golden-hopper']).chaseSpeed>1,'the Golden Hopper is faster than a common Hopper');
assert.ok(wildTraits(byKind['crystal-digger']).toughness<1,'the Crystal Digger is harder to hurt');
assert.ok(partEffectFactors(byKind['crystal-digger']).rearDamage<1);
{const ghost=byKind['ghost-genvo'],fp=partEffectFactors({species:'genvo',bodyPlan:founderPlan()});assert.ok(partEffectFactors(ghost).threatSense>fp.threatSense&&partEffectFactors(ghost).forage>fp.forage,'the Ghost GenVo8 senses farther')}

// Their young do not inherit relic parts: each socket goes back to the species' own part.
for(const a of Object.values(byKind)){const child={species:a.species,alive:true,adaptations:[],genes:{...a.genes}};g.bodyVariationChance=0;inheritBody(g,child,a,null);
  assert.ok(!child.bodyPlan.nodes.some(n=>PARTS[n.partId].tags.includes('exclusive')),`${a.elder.label} young are ordinary`);
  if(a.species!=='genvo')for(const n of wildStartPlan(a.species).nodes.filter(n=>n.parent==='root'))assert.ok(child.bodyPlan.nodes.some(x=>x.socket===n.socket),`${a.species} keeps a part on ${n.socket}`)}
g.bodyVariationChance=undefined;

// The Ghost GenVo8 fades away after a while and leaves its relic where it was.
{const h=new Simulation('GENVO8-GHOST',{player:true});h.update();h.day=50;h.discovery.maybeElder();const ghost=h.discovery.specials().find(a=>a.elder.kind==='ghost-genvo');assert.ok(ghost);
 h.day=50+SPECIAL_KINDS['ghost-genvo'].fades;h.discovery.maybeElder();assert.equal(ghost.alive,false,'it fades');assert.ok(h.discovery.sites.some(s=>s.kind==='relic'&&s.from==='Ghost GenVo8'))}

// Saves keep special creatures and their timers.
{const r=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(g)));assert.equal(r.discovery.specials().length,4);assert.deepEqual(r.discovery.specialDays,D.specialDays)}

// Each one leaves a relic where it dies; taking it unlocks both parts in the editor.
const p=g.player(),draft=()=>createDraft({base:bodyPlanFromLegacy(p),ancestry:[],budget:99,unlocked:D.unlockedParts});
assert.equal(place(draft(),'glow-eye','root','eye.left').ok,false,'locked before its relic');
for(const [kind,a] of Object.entries(byKind)){g.kill(a,'predation');const relic=D.sites.find(s=>s.kind==='relic'&&!s.gone);assert.ok(relic,`the ${a.elder.label} leaves a relic`);assert.deepEqual(relic.parts,SPECIAL_KINDS[kind].parts);
  for(const o of g.animals)if(o.alive&&o!==p&&Math.hypot(o.x-relic.x,o.y-relic.y)<3)o.x+=6;p.x=relic.x;p.y=relic.y;const r=g.playerInteract();assert.equal(r.type,'relic',r.message);assert.match(r.message,new RegExp(SPECIAL_KINDS[kind].label))}
assert.deepEqual([...D.unlockedParts].sort(),Object.values(SPECIAL_KINDS).flatMap(s=>s.parts).sort());
for(const [id,socket] of [['glow-eye','eye.left'],['echo-crest','dorsal'],['shell-back','dorsal'],['armored-hide','flank.left'],['gliding-membrane','flank.left'],['luminous-tail','tail']])assert.equal(place(draft(),id,'root',socket).ok,true,`${id} can be evolved after its relic`);

// A new one of a kind can appear after the last one died, in a later year too.
g.day=140;D.maybeElder();assert.ok(D.specials().length>=1,'specials return in later years');
console.log('special creatures ok');
