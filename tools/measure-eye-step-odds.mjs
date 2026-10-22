// Per-birth odds of each advanced-eye step through the real inheritance path
// (recombination + the shared mutation chance + mutatePlan) of a new planetary
// world. Parents are actual founder bodies; for a later step the parents carry
// that step's precursor in place of their founding eyes. Read-only estimate.
// Usage: node tools/measure-eye-step-odds.mjs [births per step]
import {Simulation} from '../src/sim/simulation.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {inheritBody} from '../src/lineage/body-inheritance.js';
const births=Number(process.argv[2]||40000);
const sim=new Simulation('PLANET-B0-A',{player:false,worldGenerator:'planetary/1'});
const withEyes=(plan,eye,torso=null)=>makePlan(plan.nodes.map(n=>({partId:n.socket?.startsWith('eye')?eye:!n.parent&&torso?torso:n.partId,parent:n.parent,socket:n.socket})));
const founder=species=>sim.animals.find(a=>a.alive&&a.species===species&&a.bodyPlan);
const steps=[
 {step:'hunter -> telescopic',species:'needlejaw',from:'hunter-eye',to:'telescopic-eye'},
 {step:'telescopic -> raptor',species:'needlejaw',from:'telescopic-eye',to:'raptor-eye'},
 {step:'wide-field -> compound',species:'mosskip',from:'wide-field-eye',to:'compound-eye'},
 {step:'compound -> panoramic',species:'mosskip',from:'compound-eye',to:'panoramic-eye'},
 {step:'panoramic -> sentinel',species:'mosskip',from:'panoramic-eye',to:'sentinel-eye'},
 {step:'second pair (barrel torso)',species:'mosskip',from:'sentinel-eye',to:'second-pair',torso:'barrel-torso'}
];
const rows=[];
for(const s of steps){
 const base=founder(s.species);if(!base){rows.push({...s,error:'no founder'});continue}
 const plan=withEyes(base.bodyPlan,s.from,s.torso),mother={...base,id:-1,sex:'female',bodyPlan:plan},father={...base,id:-2,sex:'male',bodyPlan:plan};
 let hits=0;
 for(let k=0;k<births;k++){const child={id:-100-k,species:s.species,genes:{...base.genes},adaptations:[],sex:'female'};inheritBody(sim,child,mother,father);
  const nodes=child.bodyPlan?.nodes||[];if(s.to==='second-pair'?nodes.some(n=>n.socket==='eye.left.2'):nodes.some(n=>n.partId===s.to))hits++}
 const p=hits/births;rows.push({step:s.step,species:s.species,births,hits,perBirth:+p.toExponential(2),expectedBirths:p?Math.round(1/p):null});
}
console.log(JSON.stringify({policy:sim.visionRules,mutationChance:sim.bodyVariationChance??.25,rows},null,1));
