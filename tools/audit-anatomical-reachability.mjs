// Natural anatomical reachability audit (replaces the hand-listed 71-entry audit).
//
// Question answered: starting from the real GenVo founder body, which registered
// parts can appear through the game's OWN natural heredity routes, and after how
// many mutation events at minimum?
//
// Method: breadth-first search that calls the shipping mutatePlan() with a scripted
// RNG which forces each branch (paired / one-sided) and each option index in turn.
// Every accepted plan therefore passed the real draft rules (sockets, prerequisites,
// support, feeding, sight). No part is placed by this tool directly.
//
// Routes classified:
//   natural-mutation   reachable by spontaneous body variation at birth (mutatePlan)
//   trait-expression   added when a heritable/pressure adaptation is expressed (reconcileTraits)
//   relic-only         tagged 'exclusive': only via a found relic + editor, never spontaneous
//   founder/start      present in the founder body or a wild species start body
//   NOT REACHED        none of the above within the search bound -> needs investigation
//
// Caveats printed with the result: "reachable" means a legal mutation path exists.
// It does NOT mean the path is likely, selected for, or fast under real play: each
// birth mutates with probability 0.25 and the option is drawn uniformly.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PARTS} from '../src/lineage/part-registry.js';
import {founderPlan,mutatePlan,reconcileTraits} from '../src/lineage/body-inheritance.js';
import {WILD_START,wildStartPlan} from '../src/organisms/wild-bodies.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MAX_PLANS=Number(process.argv.find(a=>a.startsWith('--max='))?.slice(6)||60000);
const MAX_DEPTH=Number(process.argv.find(a=>a.startsWith('--depth='))?.slice(8)||12);
// Beam: plans expanded per depth (novel compositions first). Bounded search: a part
// NOT reached here is "unproven", not "impossible"; reached parts are proven.
const BEAM=Number(process.argv.find(a=>a.startsWith('--beam='))?.slice(7)||1500);

function scripted(branch,index){return{chance:()=>branch,int:()=>index,next:()=>0,range:(a)=>a}}
function children(plan){
  const out=[];
  for(const branch of [false,true]){
    let count=0;mutatePlan(scripted(branch,0),plan,{onMutation:e=>{count=e.options}});
    for(let i=0;i<count;i++){let ev=null;const next=mutatePlan(scripted(branch,i),plan,{onMutation:e=>{ev=e}});if(ev?.accepted&&next.id!==plan.id)out.push(next)}
  }
  return out;
}

const start=founderPlan(),firstSeen=new Map();
// Dedupe by mounted part composition (multiset) rather than exact plan id so the
// search reaches deep pathways; every step still runs the real mutation rules.
const key=p=>p.nodes.map(n=>n.partId).sort().join('|');
const seen=new Set([key(start)]);
for(const n of start.nodes)firstSeen.set(n.partId,{depth:0,route:'founder'});
let frontier=[start],explored=0,depth=0;
while(frontier.length&&depth<MAX_DEPTH&&seen.size<MAX_PLANS){
  depth++;const next=[];
  // Novelty first: plans that carry a not-yet-seen part are expanded before others.
  for(const plan of frontier){
    explored++;
    for(const child of children(plan)){
      const k=key(child);if(seen.has(k))continue;seen.add(k);
      let novel=false;for(const n of child.nodes)if(!firstSeen.has(n.partId)){firstSeen.set(n.partId,{depth,route:'natural-mutation'});novel=true}
      if(novel)next.unshift(child);else next.push(child);
      if(seen.size>=MAX_PLANS)break;
    }
    if(seen.size>=MAX_PLANS)break;
  }
  frontier=next.slice(0,BEAM);
}

// Trait-expression route: each heritable adaptation that maps to a part.
const TRAITS=['crushing-jaw','heavy-jaw','spring-tendons','grasping-limbs','webbed-limbs','hardened-mantle','water-sacs','barbed-limbs','alarm-pulse'];
const traitParts=new Map();
for(const t of TRAITS){const p=reconcileTraits(founderPlan(),[t]);for(const n of p.nodes)if(!start.nodes.some(s=>s.partId===n.partId))traitParts.set(n.partId,t)}
// Wild start bodies (present in the world from day one, inheritable by hybrid recombination only within a species).
const wildParts=new Map();for(const sp of Object.keys(WILD_START||{})){try{for(const n of wildStartPlan(sp).nodes)if(!wildParts.has(n.partId))wildParts.set(n.partId,sp)}catch{}}

const rows=Object.values(PARTS).map(p=>{
  const nat=firstSeen.get(p.id),exclusive=p.tags.includes('exclusive');
  const routes=[];
  if(nat?.route==='founder')routes.push('founder');
  if(nat?.route==='natural-mutation')routes.push(`natural-mutation (min ${nat.depth} events)`);
  if(traitParts.has(p.id))routes.push(`trait-expression (${traitParts.get(p.id)})`);
  if(exclusive)routes.push('relic-only');
  if(wildParts.has(p.id))routes.push(`wild-start (${wildParts.get(p.id)})`);
  return{id:p.id,family:p.family,prereq:p.developmentalPrerequisites,exclusive,routes,reached:routes.some(r=>!r.startsWith('wild-start')),minEvents:nat?.depth??null};
});
const unreached=rows.filter(r=>!r.reached);
const summary={schema:'genvo.anatomy-reachability/1',registryParts:rows.length,
  founderParts:rows.filter(r=>r.routes.includes('founder')).length,
  naturalMutation:rows.filter(r=>r.routes.some(x=>x.startsWith('natural-mutation'))).length,
  traitExpressionOnly:rows.filter(r=>r.routes.length&&r.routes.every(x=>x.startsWith('trait-expression')||x.startsWith('wild-start'))&&r.reached).length,
  relicOnly:rows.filter(r=>r.exclusive).length,
  notReached:unreached.map(r=>({id:r.id,prereq:r.prereq,wild:wildParts.get(r.id)||null})),
  search:{plansDiscovered:seen.size,plansExpanded:explored,depthReached:depth,maxPlans:MAX_PLANS,maxDepth:MAX_DEPTH,
    bounded:seen.size>=MAX_PLANS||depth>=MAX_DEPTH},
  caveat:'Reachable = a legal path exists through the shipping mutation rules. It is not a likelihood: each birth mutates with p=0.25 and one option is drawn uniformly, so deep paths are rare without selection.'};
const out={summary,parts:rows};
fs.mkdirSync(path.join(root,'docs/test-runs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/test-runs/anatomy-reachability-2026-10-24.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(summary,null,2));
