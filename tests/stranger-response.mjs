import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {canHunt} from '../src/ecology/functional-diet.js';
import {STRANGER_RESPONSES,strangerResponse,strangerDisposition} from '../src/ecology/stranger-response.js';
import {reactionExpression} from '../src/render/reaction-expression.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Living Creature Pass, part 2: wildlife answers the player's creature from its own inherited
// temperament, condition, size, bite, young and experience. Bounded, deterministic, saved.
const make=(seed='PLANET-OBS-3',o={})=>{const s=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true,...o});s.setPlayerAutonomy(true);return s};
const hz=CFG.simHz,S=STRANGER_RESPONSES;
const placed=new WeakSet();
function dryField(sim){
 const w=sim.world;
 for(let y=14;y<CFG.worldSize-14;y++)for(let x=14;x<CFG.worldSize-14;x++){
  let ok=true;for(let oy=-7;oy<=7&&ok;oy++)for(let ox=-7;ox<=7;ox++)if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}
  if(ok)return{x:x+.5,y:y+.5};
 }
 return null;
}
// A healthy wild adult that is not a hunter, placed a few tiles in front of the player on dry ground.
function setup(sim,temperament,d=3){
 if(!placed.has(sim)){const f=dryField(sim);assert.ok(f);Object.assign(sim.player(),f);placed.add(sim)}
 const p=sim.player(),a=sim.animals.find(x=>x.alive&&!x.player&&!x.lineage&&!canHunt(x)&&x.age>=(SPECIES[x.species].maturity||0)&&!sim.isPredatorTo(p,x));
 Object.assign(a,{health:100,energy:SPECIES[a.species].maxEnergy,hydration:SPECIES[a.species].maxHydration,intent:'idle',target:null});delete a.vigilance;delete a.stranger;
 a.genes.temperament=temperament;a.x=p.x+d;a.y=p.y;a.dir=6;
 for(const c of sim.animals)if(c.parentIds?.includes(a.id))c.parentIds=[];
 sim.lastPlayerCombatImpact=null;assert.ok(sim.canReach(a,p.x+d-1,p.y),'test ground is reachable');return{p,a};
}
const decide=(sim,a)=>strangerResponse(sim,a,{energy:a.energy/SPECIES[a.species].maxEnergy,hydration:a.hydration/SPECIES[a.species].maxHydration});

// 1. Temperament decides: cautious keeps away, bold investigates, balanced carries on.
{
 const sim=make();let {p,a}=setup(sim,.88);
 assert.equal(sim.strangerRules,S.policy,'new worlds use the stranger rules');
 const shy=decide(sim,a);assert.equal(shy?.intent,'stranger-avoid','a cautious animal keeps its distance');assert.ok(Math.hypot(shy.target.x-p.x,shy.target.y-p.y)>3,'it moves away from the stranger');
 assert.equal(reactionExpression(sim,{...a,intent:'stranger-avoid'})?.stage,'avoid');
 ({a}=setup(sim,1.0));const mid=decide(sim,a);
 const view=(t)=>{const {a:x}=setup(sim,t);return strangerDisposition(sim,x,p).score};assert.ok(view(1.12)>view(1)&&view(1)>view(.88),'disposition rises with inherited boldness');
 ({a}=setup(sim,1.12));const bold=decide(sim,a);assert.equal(bold?.intent,'stranger-investigate','a bold, fed animal investigates');
 assert.ok(Math.abs(Math.hypot(bold.target.x-p.x,bold.target.y-p.y)-S.stop)<.01,'it approaches to a short distance, not into contact');
 console.log(`  balanced animal: ${mid?mid.intent:'carries on'}`);
 // Bounded curiosity: it stops and watches, then loses interest and does not follow.
 a.x=p.x+S.stop;a.y=p.y;assert.equal(decide(sim,a)?.intent,'stranger-watch','arrived, it stops and watches');
 assert.equal(reactionExpression(sim,{...a,intent:'stranger-watch'})?.stage,'curious');
 sim.tickCount=a.stranger.untilTick;assert.equal(decide(sim,a),null,'after a few seconds it loses interest');
 assert.equal(a.stranger.mode,'done');assert.ok(a.stranger.cooldownUntil>sim.tickCount);sim.tickCount+=hz;assert.equal(decide(sim,a),null,'and does not start again at once');
}

// 2. Experience and condition: witnessing a strike turns even a bold animal away; hunger ends curiosity.
{
 const sim=make();const {p,a}=setup(sim,1.12),victim=sim.animals.find(x=>x.alive&&x!==a&&!x.player);victim.x=a.x+1;victim.y=a.y;
 sim.lastPlayerCombatImpact={tick:sim.tickCount,targetId:victim.id,kind:'hit'};
 assert.equal(decide(sim,a)?.intent,'stranger-avoid','having seen the stranger strike nearby, it keeps away');
 sim.lastPlayerCombatImpact=null;assert.equal(decide(sim,a)?.intent,'stranger-avoid','and remembers it after the moment has passed');
 sim.tickCount=a.stranger.fearUntil;delete a.vigilance;assert.notEqual(decide(sim,a)?.intent,'stranger-avoid','the fear fades with time');
 sim.lastPlayerCombatImpact=null;delete a.stranger;a.energy=SPECIES[a.species].maxEnergy*.3;assert.equal(decide(sim,a),null,'a hungry animal has no time for strangers');
 // A parent with dependent young stands its ground and steps toward the stranger.
 a.energy=SPECIES[a.species].maxEnergy;a.genes.temperament=.88;const young=sim.animals.find(x=>x.alive&&x!==a&&x!==victim&&!x.player&&x.species===a.species)||victim;
 Object.assign(young,{x:a.x+.6,y:a.y,age:0,parentIds:[a.id]});
 const guard=decide(sim,a);assert.equal(guard?.intent,'stranger-posture','a cautious parent still stands its ground for its young');
 assert.ok(!guard.target||Math.hypot(guard.target.x-p.x,guard.target.y-p.y)<Math.hypot(a.x-p.x,a.y-p.y),'posture steps toward the stranger');
 assert.equal(reactionExpression(sim,{...a,intent:'stranger-posture'})?.stage,'posture');
 // Rule off (worlds recorded before it): no response.
 delete sim.strangerRules;delete a.stranger;assert.equal(decide(sim,a),null);
}

// 3. Saves keep the rule and each animal's state; recorded worlds without the rule keep it off.
{
 const sim=make();const {a}=setup(sim,1.12);decide(sim,a);const snap=createSimulationSnapshot(sim,{savedAt:'t',reason:'t'});
 const back=restoreSimulationSnapshot(structuredClone(snap));assert.equal(back.strangerRules,S.policy);assert.deepEqual(back.animals.find(x=>x.id===a.id).stranger,a.stranger);
 const old=structuredClone(snap);delete old.core.strangerRules;assert.equal(restoreSimulationSnapshot(old).strangerRules,undefined,'a recorded world keeps its recorded behaviour');
}

// 4. Natural play: responses happen, follow temperament, and leave populations in range of a rule-off twin.
{
 const on=make(),off=make('PLANET-OBS-3',{strangerResponses:false}),seen={investigate:[],avoid:[]},ids=new Set();
 for(let t=0;t<CFG.dayTicks*12;t++){on.update(null);off.update(null);for(const a of on.animals){const m=a.stranger?.mode;if(a.alive&&a.intent?.startsWith('stranger-')&&seen[m]&&!ids.has(a.id+m)){ids.add(a.id+m);seen[m].push(a.genes.temperament)}}}
 const avg=l=>l.reduce((x,y)=>x+y,0)/l.length;
 assert.ok(seen.investigate.length&&seen.avoid.length,'both curiosity and caution occur naturally: '+JSON.stringify({i:seen.investigate.length,a:seen.avoid.length}));
 assert.ok(avg(seen.investigate)>avg(seen.avoid),'investigators are bolder than avoiders');
 const alive=s=>s.animals.filter(a=>a.alive&&!a.player).length,aOn=alive(on),aOff=alive(off);
 assert.ok(Math.abs(aOn-aOff)/aOff<.1,`populations stay in range of the rule-off twin: ${aOn} vs ${aOff}`);
 console.log(`Stranger responses PASS: temperament decides (investigators ${avg(seen.investigate).toFixed(3)} vs avoiders ${avg(seen.avoid).toFixed(3)}; ${seen.investigate.length} investigated, ${seen.avoid.length} kept away in 12 days), bounded curiosity, witnessed strikes, hunger, parents posture, saves, populations ${aOn} vs ${aOff} without the rule.`);
}
