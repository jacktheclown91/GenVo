import assert from 'node:assert/strict';
import {buildGenerationReveal} from '../src/ui/generation-reveal.js';

const base={body:1,motion:1,metabolism:1,digestion:1,senses:1,climate:1,immunity:1,temperament:1};
const child={body:1.08,motion:1.09,metabolism:1.04,digestion:1.06,senses:1.08,climate:1.03,immunity:1.05,temperament:1.02};
const handoff={generation:2,reason:'handoff',changes:[{phrase:'faster movement'}],founderChanges:[{phrase:'larger body'}],newlyEstablished:false};
const model=buildGenerationReveal({handoff,fromRecord:{generation:1,genes:base},toRecord:{generation:2,genes:child},pressureText:'dry weather'});
assert.equal(model.title,'Generation 2 begins');
assert.equal(model.fromLabel,'Generation 1');
assert.equal(model.toLabel,'Generation 2');
assert.ok(model.chips.some(x=>/longer legs|larger frame|larger eyes and feelers/.test(x)),'first glance contains visible inherited change');
assert.ok(model.details.some(([label])=>label==='Inherited'),'technical inheritance is retained behind details');
assert.ok(model.details.some(([label])=>label==='Last generation faced'),'lived pressure remains available');
const strategy=buildGenerationReveal({handoff,fromRecord:{generation:1,genes:base},toRecord:{generation:2,genes:child},pressureText:'predators',strategyText:'Stealth: fed under pressure'});
assert.ok(strategy.details.some(([label,value])=>label==='Lineage strategy'&&/fed under pressure/.test(value)),'completed branch play is carried into the handoff recap');
const cared=buildGenerationReveal({handoff,fromRecord:{generation:1,genes:base},toRecord:{generation:2,genes:child},pressureText:'predators',careText:'steady upbringing · tended 2× · 1 danger day'});
assert.ok(cared.details.some(([label,value])=>label==='Upbringing'&&/tended 2×/.test(value)),'offspring care history is visible at generational handoff');
const prepared=buildGenerationReveal({handoff:{...handoff,preparedness:{fieldReady:true,routes:2,lessons:4,independence:.84,label:'field-ready'}},fromRecord:{generation:1,genes:base},toRecord:{generation:2,genes:child},pressureText:'predators'});
assert.ok(prepared.details.some(([label,value])=>label==='Takeover readiness'&&/field-ready/.test(value)&&/2\/2 solo routes/.test(value)),'handoff reveal surfaces earned field readiness');

const diverged=buildGenerationReveal({handoff,fromRecord:{generation:1,genes:base,divergence:null},toRecord:{generation:2,genes:child,divergence:{kind:'forager',strength:.58,sourceGeneration:2}},pressureText:'wide ranging',divergenceText:'Forager form · +4% travel · +20% forage reach. Sustained forage and scouting shaped this descendant.',divergenceChip:'Forager form emerged'});
assert.equal(diverged.chips[0],'Forager form emerged','lineage form is visible at first glance');
assert.ok(diverged.details.some(([label,value])=>label==='Lineage form'&&/forage reach/.test(value)),'generation reveal explains the inherited form and its mechanical opportunity');
assert.equal(diverged.toDivergence.kind,'forager','portrait model receives inherited lineage form');
assert.match(diverged.lead,/family lived has begun shaping this body/);


const progressed=buildGenerationReveal({handoff,fromRecord:{generation:1,genes:base},toRecord:{generation:2,genes:child},pressureText:'wide ranging',progressionText:'Prove the inherited form by opening an outer feeding route. Trail Scout lowers the Scout threshold.',progressionChip:'New G2 challenge · break the old range'});
assert.ok(progressed.chips.some(v=>/New G2 challenge/.test(v)),'generation reveal announces the new generation-specific job');
assert.ok(progressed.details.some(([label,value])=>label==='New ecological test'&&/Trail Scout/.test(value)),'generation reveal explains what the new G2 work can unlock');


const g3Progressed=buildGenerationReveal({handoff:{...handoff,generation:3},fromRecord:{generation:2,genes:base},toRecord:{generation:3,genes:child},pressureText:'family expansion',progressionText:'Generation 3 can establish a second population center.',progressionChip:'New G3 challenge · found an outer ranging band'});
assert.ok(g3Progressed.chips.some(v=>/New G3 challenge/.test(v)),'generation reveal can announce the G3 population-scale job');
assert.ok(g3Progressed.details.some(([label,value])=>label==='New ecological test'&&/second population center/.test(value)),'G3 handoff explains the new population-scale purpose');

const populationRaised=buildGenerationReveal({handoff:{...handoff,generation:4},fromRecord:{generation:3,genes:base},toRecord:{generation:4,genes:child},pressureText:'mixed pressure',populationHistoryText:'Ranging Band · 6 recorded days · competition + food scarcity',populationHistoryChip:'RAISED · RANGING BAND'});
assert.equal(populationRaised.chips[0],'RAISED · RANGING BAND','population upbringing is visible at first glance once recorded');
assert.ok(populationRaised.details.some(([label,value])=>label==='Population upbringing'&&/competition \+ food scarcity/.test(value)),'handoff details preserve the descendant population pressure history');

const death=buildGenerationReveal({handoff:{...handoff,reason:'death'},fromRecord:{generation:2,genes:base},toRecord:{generation:3,genes:child},pressureText:'predators nearby',causeText:'predation'});
assert.equal(death.kicker,'THE FAMILY CONTINUES');
assert.match(death.lead,/died from predation/);
assert.equal(death.details[0][0],'Cause of death');
const eighth=buildGenerationReveal({handoff:{...handoff,generation:8,newlyEstablished:true},fromRecord:{generation:7,genes:base},toRecord:{generation:8,genes:child},pressureText:'no sustained pressure dominated'});
assert.equal(eighth.title,'Generation 8 reached');
assert.equal(eighth.button,'Keep going');
console.log('generation reveal checks: PASS');
