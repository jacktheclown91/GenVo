import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {TutorialController} from '../src/ui/tutorial.js';

const sim=new Simulation('GENVO8-G2-BROOD-HOME',{player:true}),p=sim.player();
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);assert.ok(mate,'starter mate exists');
p.generation=2;p.age=SPECIES.genvo.maturity+4;p.lastMate=mate.id;p.energy=SPECIES.genvo.maxEnergy;mate.age=SPECIES.genvo.maturity+4;mate.lastMate=p.id;
let site=null;for(let y=18;y<110&&!site;y++)for(let x=18;x<110;x++){const i=sim.world.idx(x,y);if(!sim.world.water[i]){site={x:x+.5,y:y+.5};break}}assert.ok(site,'dry site exists');
p.x=site.x;p.y=site.y;mate.x=site.x+.5;mate.y=site.y+.2;
for(let yy=Math.floor(site.y)-2;yy<=Math.floor(site.y)+2;yy++)for(let xx=Math.floor(site.x)-2;xx<=Math.floor(site.x)+2;xx++){const i=sim.world.idx(xx,yy);if(!sim.world.water[i])sim.world.plants.sunmoss[i]=1;}
const old={id:1,ownerId:p.id,x:site.x-10,y:site.y,integrity:100,weatherSeal:.78,foodStore:4,capacity:28,kind:'family',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(old);sim.shelter.nextId=2;
assert.equal(sim.expansion.shelterCapacity(),2,'a paired G2 active lineage can sustain a second early shelter before satellite nesting');
const can=sim.shelter.canBuildHere(p);assert.equal(can.ok,true,can.reason);assert.equal(can.kind,'brood','second direct shelter is identified as a brood home');
const controller=Object.create(TutorialController.prototype);controller.sim=sim;controller.renderer={guideTarget:null};let shown=null;controller.render=(title,body,opts={})=>shown={title,body,opts};controller.renderStrategyGoal=()=>false;controller.renderPredatorAlert=controller.renderStalkerDenWarning=controller.renderTerritoryShift=controller.renderSuccession=controller.renderGenerationChallenge=()=>false;controller.renderIllness=controller.renderFamilyIllness=controller.renderExposure=controller.renderFamilyWeather=controller.renderStormAftermath=controller.renderInjury=controller.renderForagePatch=controller.renderSpeciesGoal=controller.renderLifestyleGoal=()=>false;
p.pregnant={fatherId:mate.id,days:5,totalDays:8,startedDay:sim.day,startedYear:sim.year};controller.renderDynamicGoal(p);assert.equal(shown.title,'Build the new brood shelter','G2 birth loop asks the distant pair to establish a second home');
const result=sim.shelter.constructOrRepair(p);assert.equal(result.ok,true);assert.equal(result.newHome,true);assert.equal(sim.shelter.activeShelters().length,2);assert.equal(result.shelter.kind,'brood');assert.equal(sim.shelter.broodShelterFor(p)?.id,result.shelter.id,'pair-specific brood shelter becomes the preferred new home');
controller.renderDynamicGoal(p);assert.equal(shown.title,'Stock the shelter','birth preparation continues at the newly founded brood shelter');
const again=sim.shelter.canBuildHere(p);assert.equal(again.ok,false,'the same pair cannot spam repeated direct brood shelters');
console.log('G2 brood-home progression checks: PASS');
