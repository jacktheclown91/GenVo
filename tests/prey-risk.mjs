import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PREY_RISK,biteBackChance,biteBackDamage,riskFactor,relationshipFactor,MATE_RESTRAINT} from '../src/ecology/prey-risk.js';

// Phase 3K Priority 4: cannibalism stays possible but is risky. One rule for every predator and prey:
// prey with real attack anatomy can bite back, and hunters weigh that risk by hunger, boldness and relationship.
assert.equal(PREY_RISK.enabled,true);
const sim=new Simulation('PREY-RISK',{player:false});
const adults=sp=>sim.animals.filter(a=>a.alive&&a.species===sp&&a.age>=SPECIES[sp].maturity);
const [nj,rival]=adults('needlejaw'),moss=adults('mosskip')[0];assert.ok(nj&&rival&&moss);
for(const a of [nj,rival,moss])Object.assign(a,{health:100,parentIds:[],lastMate:null,pregnant:null});
Object.assign(nj,{energy:SPECIES.needlejaw.maxEnergy*.6});
// Bite-back needs attack anatomy: a mosskip cannot, another Stalker can.
assert.equal(biteBackChance(nj,moss),0,'jawless prey never bites back');
assert.ok(biteBackChance(nj,rival)>.2&&biteBackDamage(nj,rival)>5,'a same-size Stalker can bite back hard');
rival.health=30;const weak=biteBackChance(nj,rival);rival.health=100;assert.ok(weak<biteBackChance(nj,rival),'a badly wounded rival is less able to');
// Appraisal: a conspecific of equal size is a riskier meal than jawless prey, but not forbidden.
assert.equal(riskFactor(nj,moss),1);const r=riskFactor(nj,rival);assert.ok(r<.9&&r>0,'a jawed rival is discounted, never excluded: '+r.toFixed(2));
const starving={...nj,energy:SPECIES.needlejaw.maxEnergy*.05},bold={...nj,genes:{...nj.genes,temperament:1.4}},timid={...nj,genes:{...nj.genes,temperament:.7}};
assert.ok(riskFactor(starving,rival)>r,'a starving hunter accepts more risk');
assert.ok(riskFactor(bold,rival)>r&&riskFactor(timid,rival)<r,'inherited boldness changes how much risk is accepted');
const hurt={...nj,health:40};assert.ok(riskFactor(hurt,rival)<r,'a wounded hunter weighs the same bite more heavily');
// Relationship: a recent mate is restrained, never protected outright; strangers are not.
assert.equal(relationshipFactor(nj,rival),1);rival.lastMate=nj.id;assert.equal(relationshipFactor(nj,rival),MATE_RESTRAINT);assert.ok(riskFactor(nj,rival)>0);rival.lastMate=null;
// Through the real contact: a Stalker attacking a Stalker is sometimes bitten back and wounded.
function contacts(prey,n=400){const s=new Simulation('PREY-RISK-CONTACT',{player:false});const [h,b]=s.animals.filter(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity);
  const target=prey==='stalker'?b:s.animals.find(a=>a.alive&&a.species==='mosskip'&&a.age>=SPECIES.mosskip.maturity);let wounds=0,bitten=0;
  for(let i=0;i<n;i++){Object.assign(h,{alive:true,health:100,energy:SPECIES.needlejaw.maxEnergy*.5,parentIds:[],x:target.x+.5,y:target.y});Object.assign(target,{alive:true,health:100,parentIds:[],lastMate:null});const before=h.health;s.tryKill(h,target);if(h.health<before){bitten++;wounds+=before-h.health}}
  return{bitten,wounds,stats:s.stats.preyRisk}}
const vsStalker=contacts('stalker'),vsMoss=contacts('moss');
assert.ok(vsStalker.bitten>40,'contacts with a Stalker draw bite-backs: '+vsStalker.bitten);assert.equal(vsStalker.stats.sameSpecies,vsStalker.bitten);
assert.equal(vsMoss.bitten,0,'contacts with a mosskip never do');
// A hand-steered player as prey is defended by the player, not automatically.
{const s=new Simulation('PREY-RISK-PLAYER',{player:true});s.endOpeningGrace?.('t');const p=s.player(),h=s.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity);
  if(biteBackChance(h,p)>0){let n=0;for(let i=0;i<200;i++){Object.assign(h,{health:100,x:p.x+.5,y:p.y});p.health=100;s.tryKill(h,p);if(h.health<100)n++}assert.equal(n,0,'no automatic bite-back by the player')}}
// Switch off: contact is free again.
PREY_RISK.enabled=false;assert.equal(contacts('stalker').bitten,0,'?preyRisk=0 restores free contact');PREY_RISK.enabled=true;
console.log(`prey risk: bite-back from jawed prey (${vsStalker.bitten}/400 Stalker contacts), risk weighed by hunger, boldness, health and relationship: PASS`);
