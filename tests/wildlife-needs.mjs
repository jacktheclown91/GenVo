import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {ESCAPE_LANDING,escapeJumpDirection} from '../src/ecology/escape-landing.js';
import {jumpKinematics,hasJumpingAnatomy} from '../src/lineage/jumping.js';
import {ambientSpent,ambientAllowance,noteAmbientMove} from '../src/ecology/ambient-allowance.js';
import {waterSeekShare} from '../src/ecology/metabolism-policy.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// First-month wildlife corrections (2026-10-23): escape jumps land on ground, hungry animals are never
// held by the rest allowance, and a badly dehydrated animal with a route to water drinks instead of
// nibbling juicy plants. Measured in docs/WILDLIFE-NEEDS-2026-10-23.md.
const make=(o={})=>new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,worldGenerator:'planetary/1',...o});

// 1. Escape jumps: never straight into water a non-swimmer cannot leave; no safe landing means no jump.
{
 const sim=make({escapeLanding:true}),w=sim.world,a=sim.animals.find(x=>x.alive&&!x.player&&hasJumpingAnatomy(x));assert.ok(a,'a jumping animal exists');
 const {range}=jumpKinematics(a);let spot=null;
 for(let y=4;y<w.n-4&&!spot;y++)for(let x=4;x<w.n-4&&!spot;x++){const px=x+.5,py=y+.5;if(w.water[w.idx(px,py)]||!w.isPlayable(px,py)||!w.isPlayable(px-2,py))continue;if(w.water[w.idx(px+range,py)]&&!w.water[w.idx(px-2,py)])spot={x:px,y:py}}
 assert.ok(spot,'a bank where straight away is water');a.x=spot.x;a.y=spot.y;const threat={x:spot.x-2,y:spot.y};
 const leap=escapeJumpDirection(sim,a,threat);
 assert.ok(leap,'a bank with land to the side offers a safe leap');const lx=a.x+leap.dx*range,ly=a.y+leap.dy*range;assert.ok(!w.water[w.idx(lx,ly)],'the leap lands on ground');assert.ok(leap.dx*(a.x-threat.x)+leap.dy*(a.y-threat.y)>0,'and still leads away from the threat');
 // Water all round: no jump at all.
 const boxed={...a,x:spot.x,y:spot.y};const flooded=new Simulation('GENVO8-TEST-A',{player:true,escapeLanding:true,worldGenerator:'planetary/1'});flooded.canOccupy=()=>false;assert.equal(escapeJumpDirection(flooded,boxed,threat),null,'no safe landing, no jump');
 const back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));assert.equal(back.escapeLandingRules,ESCAPE_LANDING.policy);
 const old=new Simulation('GENVO8-TEST-A',{player:true,worldGenerator:'planetary/1'});assert.equal(old.escapeLandingRules,undefined,'recorded worlds keep the old jump');
}
// 2. The rest allowance never holds a hungry animal in place.
{
 const sim=make(),a=sim.animals.find(x=>x.alive&&!x.player),s=SPECIES[a.species];a.ambientWalk={day:sim.day,tiles:ambientAllowance(a)+1};
 a.energy=s.maxEnergy*.9;assert.equal(ambientSpent(sim,a),true,'a sated animal rests once its allowance is spent');
 a.energy=s.maxEnergy*.5;assert.equal(ambientSpent(sim,a),false,'a hungry animal keeps searching');
}
// 3. Below one day of water, a route to drinkable water beats juicy food.
{
 const sim=make(),w=sim.world;let a=null,juicy=null;
 for(const x of sim.animals){if(!x.alive||x.player)continue;x.hydration=SPECIES[x.species].maxHydration*.5;const step=w.nextDrinkStep(x.x,x.y);if(!step||w.isDrinkable(x.x,x.y))continue;const j=sim.juicyFood(x);if(j&&Math.hypot(j.x-x.x,j.y-x.y)<(w.waterDistance[w.idx(x.x,x.y)]??Infinity)){a=x;juicy=j;break}}
 assert.ok(a,'an animal with juicy food nearer than water');const s=SPECIES[a.species];
 a.hydration=s.maxHydration*Math.min(.85,waterSeekShare(sim,a)*.9);assert.ok(sim.waterRoute(a).kind,'with water to spare it takes the juicy food');
 a.hydration=s.maxHydration*waterSeekShare(sim,a)*.3;const route=sim.waterRoute(a);assert.ok(!route.kind,'badly dehydrated, it heads for the water');
 sim.correctionExperiment={urgentWater:false};assert.ok(sim.waterRoute(a).kind,'the measurement switch restores the previous choice');
}
// 4. Herd cohesion and spacing count against the rest allowance; a sated animal that has spent it stays put.
{
 const sim=make(),a=sim.animals.find(x=>x.alive&&!x.player),s=SPECIES[a.species];a.energy=s.maxEnergy*.9;a.hydration=s.maxHydration*.9;delete a.ambientWalk;
 a.intent='group';noteAmbientMove(sim,a,1.5);assert.equal(a.ambientWalk?.tiles,1.5,'herd moves are counted');
 a.ambientWalk={day:sim.day,tiles:ambientAllowance(a)+1};sim.social.spacingTarget=()=>({x:a.x+1,y:a.y});sim.social.cohesionTarget=()=>({x:a.x+2,y:a.y});
 a.intent='idle';a.target=null;const seen=new Set();for(let t=0;t<20;t++){sim.update(null);a.ambientWalk={day:sim.day,tiles:ambientAllowance(a)+1};seen.add(a.intent)}
 assert.ok(!seen.has('group')&&!seen.has('group-space'),'a sated animal that has spent its allowance does not keep re-forming the herd: '+[...seen]);
 sim.correctionExperiment={socialAllowance:false};for(let t=0;t<20;t++){sim.update(null);seen.add(a.intent)}assert.ok(seen.has('group')||seen.has('group-space'),'with the correction off it does');
 const old=new Simulation('GENVO8-TEST-A',{player:true,worldGenerator:'planetary/1'}),b=old.animals.find(x=>x.alive&&!x.player);b.intent='group';noteAmbientMove(old,b,2);assert.equal(b.ambientWalk,undefined,'recorded worlds keep no allowance');
}
console.log('Wildlife needs PASS: escape jumps land on ground, hungry animals keep searching, dehydrated animals drink, herd moves count against the rest allowance.');
