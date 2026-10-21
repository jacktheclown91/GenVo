import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {founderMatePreferences,inheritMatePreferences,LOCAL_ASSORTMENT,perceivedAppearance,appearanceDistance,individualMateChoice,mateOptionAssessment,reciprocalMateChoice} from '../src/reproduction/mate-preferences.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {FOUNDER_PLACEMENTS} from '../src/lineage/body-inheritance.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';

const seed='LOCAL-VISUAL-ASSORTMENT';
const sim=new Simulation(seed,{player:true,bootstrap:false});
assert.equal(sim.mateAssortmentRules,LOCAL_ASSORTMENT,'fresh worlds use local assortment');
const mean=assortment=>Array.from({length:256},(_,i)=>founderMatePreferences(seed,i,{assortment}).similarity).reduce((a,b)=>a+b,0)/256;
assert.ok(mean(true)>.15,'modern founders prefer resemblance more often than contrast');
assert.ok(Math.abs(mean(false))<.10,'historical founder distribution remains symmetric');

const a=sim.spawnAnimal('genvo',30,30),b=sim.spawnAnimal('genvo',35,30);
assert.deepEqual(a.matePreferences,founderMatePreferences(seed,a.id,{assortment:true}));
assert.notEqual(a.matePreferences.similarity,founderMatePreferences(seed,a.id).similarity);
const ecologyRng=sim.rng.state;
const childTaste=inheritMatePreferences(seed,999,a,b);
assert.ok(childTaste.similarity>=-1&&childTaste.similarity<=1);
assert.equal(sim.rng.state,ecologyRng,'inheritance uses deterministic independent random streams');

// Selection sees exactly the displayed inherited palette hue.
const same={...a,pigmentGenome:{...a.pigmentGenome,hue:1}};
const contrast={...a,id:800,pigmentGenome:{...a.pigmentGenome,hue:13}};
const hue=animal=>(145+phenotypeFor(animal).hueShift+360)%360;
assert.equal(perceivedAppearance(same,{assortment:true}).hue,hue(same));
assert.equal(perceivedAppearance(contrast,{assortment:true}).hue,hue(contrast));
assert.ok(appearanceDistance(same,contrast,{assortment:true})>.2);
assert.equal(appearanceDistance(same,contrast),0,'historical preference used non-pigment fallback');
const legVariation=makePlan(FOUNDER_PLACEMENTS.map(p=>p.socket==='limb.1'?{...p,partId:'runner-leg'}:p));
assert.equal(validatePlan(legVariation).ok,true,'test uses a physically valid body');
const differentBody={...same,id:810,bodyPlan:legVariation};
assert.ok(appearanceDistance(same,differentBody,{assortment:true})>appearanceDistance(same,same,{assortment:true}),
 'a real limb-layout change increases visible silhouette distance');

const neutral=Object.fromEntries(Object.keys(a.matePreferences.weights).map(k=>[k,0]));
const chooser={...same,matePreferences:{...a.matePreferences,weights:neutral,similarity:1}};
const sameCandidate={...b,id:900,pigmentGenome:same.pigmentGenome,bodyPlan:a.bodyPlan};
const otherCandidate={...sameCandidate,id:901,pigmentGenome:contrast.pigmentGenome};
const modern={assortment:true};
assert.ok(individualMateChoice(chooser,sameCandidate,seed,modern).score>individualMateChoice(chooser,otherCandidate,seed,modern).score);
chooser.matePreferences={...chooser.matePreferences,similarity:-1};
assert.ok(individualMateChoice(chooser,sameCandidate,seed,modern).score<individualMateChoice(chooser,otherCandidate,seed,modern).score,'contrast preferences remain heritable choices');
chooser.matePreferences={...chooser.matePreferences,similarity:.25};
const near=mateOptionAssessment(chooser,sameCandidate,seed,2,24,modern);
const distant=mateOptionAssessment(chooser,sameCandidate,seed,20,24,modern);
assert.ok(near.value>distant.value,'local distance affects ranking');
assert.equal(near.choice.accepted,distant.choice.accepted,'proximity is never a compatibility or consent gate');
assert.equal(typeof reciprocalMateChoice(chooser,otherCandidate,seed,modern).accepted,'boolean');

const saved=createSimulationSnapshot(sim,{savedAt:'fixed'});
assert.equal(restoreSimulationSnapshot(structuredClone(saved)).mateAssortmentRules,LOCAL_ASSORTMENT);
const previous=structuredClone(saved);delete previous.core.mateAssortmentRules;
assert.equal(Object.hasOwn(restoreSimulationSnapshot(previous),'mateAssortmentRules'),false,'ordinary historical Continue never silently changes mate policy');
const corrupt=structuredClone(saved);corrupt.core.mateAssortmentRules='invalid';
assert.throws(()=>restoreSimulationSnapshot(corrupt),/Unknown saved mate assortment policy/);
assert.equal(sim.rng.state,ecologyRng,'pure mate perception and save logic do not draw ecological RNG');
console.log('local-lineage-assortment: actual pigment, inherited form, locality, reciprocal consent, historical continuation PASS');
