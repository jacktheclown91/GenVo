import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CreatureContextTray} from '../src/ui/creature-context-tray.js';
import {HomeTutorialGuide} from '../src/ui/home-tutorial-guide.js';
import {SPECIES} from '../src/organisms/species.js';
import {homeInteractions,homeInteractionStatus} from '../src/gameplay/home-interactions.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Controlled construction contracts. Site/actor placement and learned territory
// are staged; food plants are genuine initial finite stock, never created here.
function fixture({settled=true,material=true}={}){
  const sim=new Simulation('HOME-GROUND-ACTIONS',{player:true}),a=sim.player(),w=sim.world;
  let site=null;
  for(let y=6;y<w.n-6&&!site;y++)for(let x=6;x<w.n-6;x++){
    if(w.water[w.idx(x,y)]||w.water[w.idx(x-1,y)]||!sim.canOccupy(a,x+.5,y+.5)||!sim.canOccupy(a,x-.5,y+.5))continue;
    const stock=sim.shelter.materialAvailable(x+.5,y+.5);
    if(stock>=1.15){site={kind:'ground',x:x+.5,y:y+.5,i:w.idx(x,y),label:'Ground'};break}
  }
  assert.ok(site,'Natural initial terrain must supply the declared material fixture');
  // Controlled depletion uses the real material-harvesting authority, never a grant.
  if(!material)sim.shelter.consumeMaterials(site.x,site.y,sim.shelter.materialAvailable(site.x,site.y)+1,2.2);
  a.x=site.x-1;a.y=site.y;a.dir=2;a.energy=SPECIES[a.species].maxEnergy*.9;
  const state=sim.territory.state(a);state.home=settled?{x:site.x,y:site.y}:null;
  state.established=settled;state.radius=8;state.totalFamiliarity=settled?3:0;
  return{sim,a,site,state};
}
const planned=fixture({settled:false});
const before={energy:planned.a.energy,x:planned.a.x,y:planned.a.y,rng:planned.sim.rng.state,
 material:planned.sim.shelter.materialAvailable(planned.site.x,planned.site.y)};
assert.equal(homeInteractions(planned.sim,planned.site).some(o=>o.id==='build-shelter'),false);
const marked=planned.sim.playerInteract(planned.site,'mark-home-site');assert.equal(marked.ok,true);
assert.equal(planned.state.established,false);assert.equal(planned.state.home,null);
assert.equal(planned.sim.shelter.activeShelters().length,0);
assert.deepEqual({energy:planned.a.energy,x:planned.a.x,y:planned.a.y,rng:planned.sim.rng.state,
 material:planned.sim.shelter.materialAvailable(planned.site.x,planned.site.y)},before);
assert.equal(planned.sim.territory.homeSiteFor(planned.a).x,planned.site.x);
const saved=structuredClone(createSimulationSnapshot(planned.sim,{savedAt:'fixed',reason:'planned-home'}));
const restored=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(restored.territory.homeSiteFor(restored.player()),planned.sim.territory.homeSiteFor(planned.a));
assert.equal(restored.territory.state(restored.player()).established,false);

const build=fixture();
const offer=homeInteractions(build.sim,build.site).find(o=>o.id==='build-shelter');
assert.equal(offer.state,'approachable');assert.equal(offer.enabled,false);
assert.equal(build.sim.playerInteract(offer.target,'build-shelter').ok,false,'No remote construction');
assert.equal(build.sim.shelter.constructAt(build.a,offer.target).ok,false);
assert.equal(build.sim.shelter.activeShelters().length,0);
build.a.x=build.site.x+.2;build.a.y=build.site.y;
const energy=build.a.energy,stock=build.sim.shelter.materialAvailable(build.site.x,build.site.y),actorX=build.a.x;
const built=build.sim.playerInteract(offer.target,'build-shelter');assert.equal(built.ok,true);
assert.equal(built.shelter.x,build.site.x);assert.equal(built.shelter.y,build.site.y);
assert.equal(build.a.x,actorX,'The participating body is not teleported to the site');
assert.equal(build.a.energy,energy-7.5);assert.ok(Math.abs(built.taken-1.15)<1e-9);
assert.ok(Math.abs(stock-build.sim.shelter.materialAvailable(build.site.x,build.site.y)-built.taken)<1e-5);
assert.equal(build.sim.shelter.activeShelters().length,1);
assert.equal(new HomeTutorialGuide({querySelectorAll:()=>[]}).read(build.sim).complete,true,'An actual existing family shelter completes home without repeating its construction');
assert.equal(homeInteractions(build.sim,build.site).some(a=>a.id==='establish-home-nest'),false,'Satellite nesting remains locked at the original expansion authority');

const hungry=fixture();hungry.a.energy=1;hungry.a.x=hungry.site.x;
const unavailable=homeInteractions(hungry.sim,hungry.site).find(o=>o.id==='build-shelter');
assert.equal(unavailable.enabled,false);assert.match(unavailable.reason,/energy/);
assert.equal(hungry.sim.playerInteract(hungry.site,'build-shelter').ok,false);assert.equal(hungry.a.energy,1);
const bare=fixture({material:false});bare.a.x=bare.site.x;
assert.match(homeInteractionStatus(bare.sim,bare.site,'build-shelter').reason,/plant material/);
assert.equal(bare.sim.playerInteract(bare.site,'build-shelter').ok,false);
assert.equal(bare.sim.shelter.activeShelters().length,0);
const changedRegion={...hungry.site,homeSeed:hungry.sim.seed,homeRegion:{x:128,y:0}};
assert.match(hungry.sim.territory.homeSiteAvailability(hungry.a,changedRegion).reason,/another region/);
for(const invalid of [{x:-1,y:10},{x:Infinity,y:10},{x:200,y:10}])
 assert.equal(hungry.sim.shelter.canBuildAt(hungry.a,invalid).ok,false);
assert.equal(homeInteractions(hungry.sim,{...hungry.site,ambient:true}).length,0,'Ambient E/dig queries do not become home commands');
console.log('Ground home contracts PASS: intent grants no territory/resources, persistent selected site, exact paid placement, physical participation, energy/material/region rejection and ambient interactions retained.');

// UI route integration uses the same live selected-site status at start and arrival.
const routed=fixture(),routeOffer=homeInteractions(routed.sim,routed.site).find(o=>o.id==='build-shelter');
let arrival,routeOptions,lastResult;
const tray=Object.create(CreatureContextTray.prototype);
Object.assign(tray,{getSim:()=>routed.sim,radial:{close(){}},close(){this.pendingHome=null},update(){},onResult:r=>lastResult=r,
 onApproach:(target,callback,options)=>{arrival=callback;routeOptions=options;return{ok:true}},onCancelApproach(){}});
tray.useHomeOption(routeOffer);assert.ok(tray.pendingHome);assert.equal(routed.sim.shelter.activeShelters().length,0);
routed.a.energy=1;assert.equal(routeOptions.validate().enabled,false);assert.match(routeOptions.validate().reason,/energy/);
arrival();assert.equal(lastResult.ok,false);assert.equal(routed.sim.shelter.activeShelters().length,0);assert.equal(tray.pendingHome,null);
const waterIndex=routed.sim.world.water.findIndex(v=>v>0);
assert.ok(waterIndex>=0);assert.equal(homeInteractions(routed.sim,{kind:'ground',x:waterIndex%routed.sim.world.n+.5,y:Math.floor(waterIndex/routed.sim.world.n)+.5}).length,0);

const snow=fixture({settled:false});assert.ok(homeInteractions(snow.sim,{...snow.site,kind:'snow'}).some(a=>a.id==='mark-home-site'),'Snow on dry ground must not hide a legitimate home action');
