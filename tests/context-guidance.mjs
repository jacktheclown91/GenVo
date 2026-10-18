import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('LOCAL-GUIDANCE-TEST',{player:true}),p=sim.player();
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
assert.ok(mate,'starter family member exists');
const adult=sim.spawnAnimal('genvo',p.x+2,p.y+1,[p,mate]);
adult.age=SPECIES.genvo.maturity+5;adult.energy=SPECIES.genvo.maxEnergy*.9;adult.hydration=SPECIES.genvo.maxHydration*.9;adult.health=100;
sim.lineage.registerBirth(adult,[p,mate]);sim.rebuildSpatial();
assert.equal(sim.familyDirectives.status().available,true,'grown relative unlocks local guidance');

let target=null;for(let r=2;r<7&&!target;r++)for(let k=0;k<8&&!target;k++){const a=k*Math.PI/4,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;if(x>2&&y>2&&x<126&&y<126&&!sim.world.water[sim.world.idx(x,y)]&&sim.world.sameLand(p.x,p.y,x,y))target={x,y}}
assert.ok(target,'dry local guidance target exists');

assert.equal(sim.familyDirectives.setAreaOrder('gather',target),true);
let d=sim.familyDirectives.decision(adult);assert.equal(d.intent,'family-area-gather');assert.equal(d.target.areaGuidance,true,'gather mark produces local autonomous target');

assert.equal(sim.familyDirectives.setAreaOrder('forage',target),true);
for(let y=Math.floor(target.y)-1;y<=Math.floor(target.y)+1;y++)for(let x=Math.floor(target.x)-1;x<=Math.floor(target.x)+1;x++)if(!sim.world.water[sim.world.idx(x,y)])sim.world.plants.bramble[sim.world.idx(x,y)]=.82;
d=sim.familyDirectives.decision(adult);assert.ok(['feed','family-area-forage'].includes(d.intent),'forage mark drives local feeding/search behavior');

adult.hydration=SPECIES.genvo.maxHydration*.2;
assert.equal(sim.familyDirectives.decision(adult),null,'urgent survival still overrides local guidance');
adult.hydration=SPECIES.genvo.maxHydration*.9;

assert.equal(sim.familyDirectives.setAreaOrder('scout',target),false,'local Scout respects the same population unlock');
const family=[p,adult];
for(let i=0;i<6;i++){const a=family[i%family.length],state=sim.territory.ensure(a),cx=8+i,cy=8+(i%2),key=`${cx},${cy}`;state.cells.set(key,{key,cx,cy,x:(cx+.5)*sim.territory.cellSize,y:(cy+.5)*sim.territory.cellSize,visits:2.5,lastTick:sim.tickCount})}
const adult2=sim.spawnAnimal('genvo',p.x+3,p.y+1,[p,mate]);adult2.age=SPECIES.genvo.maturity+4;adult2.energy=SPECIES.genvo.maxEnergy*.9;adult2.hydration=SPECIES.genvo.maxHydration*.9;sim.lineage.registerBirth(adult2,[p,mate]);
assert.equal(sim.expansion.scoutUnlocked(),true,'test family reaches Scout unlock');
assert.equal(sim.familyDirectives.setAreaOrder('scout',target),true);
d=sim.familyDirectives.decision(adult);assert.equal(d.intent,'family-area-scout');assert.equal(d.target.frontier,true,'local Scout sends adults toward the marked frontier');

sim.familyDirectives.clearLocalGuidance();adult.x=target.x+.3;adult.y=target.y+.2;
assert.equal(sim.familyDirectives.setAreaOrder('avoid',target),true);
d=sim.familyDirectives.decision(adult);assert.equal(d.intent,'family-area-avoid');assert.equal(d.target.areaGuidance,true,'avoid mark pushes family out of the marked zone');
assert.equal(sim.familyDirectives.areaStatus().avoid.length,1,'avoid mark persists as local guidance');
assert.equal(sim.familyDirectives.clearLocalGuidance(),true);assert.equal(sim.familyDirectives.areaStatus().avoid.length,0);assert.equal(sim.familyDirectives.areaStatus().order,null,'clear removes point orders and avoid zones');

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8'),wheel=fs.readFileSync(new URL('../src/ui/leadership-wheel.js',import.meta.url),'utf8'),renderer=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
assert.match(html,/id="commandWheel"/,'radial quick-access UI is present');
for(const action of ['gather','forage','scout','avoid','nest']){assert.match(html,new RegExp(`data-action="${action}"[^>]*>[\\s\\S]*?<svg`),`${action} is represented by an icon button`)}
assert.match(wheel,/contextmenu/,'desktop right-click remains a local-guidance shortcut');
assert.match(wheel,/this\.canvas\.addEventListener\('click'/,'armed command mode supports ordinary left-click or trackpad click placement');
assert.match(wheel,/pointerType!==\'touch\'/,'touch long-press path exists');
assert.match(renderer,/screenToWorld\(/,'radial placement converts screen position into simulation space');
assert.match(css,/\.command-wheel\{[^}]*pointer-events:none/s,'radial wheel is transient world UI rather than a permanent panel');
// Same boundary as ui-art-direction.mjs: the authored v1.65 title menu is exempt.
assert.doesNotMatch(css.split('/* GenVo v1.65')[0],/border-radius|linear-gradient/,'radial keeps the authored non-card UI language');
console.log('contextual icon guidance checks: PASS');
