import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildSmoothedHabitatField} from '../src/render/habitat.js';
import {collectHabitatScenes,habitatSceneAt} from '../src/render/scene.js';
import {terrainMotifFor,drawTerrainMotifBackdrop,drawTerrainMotifForeground} from '../src/render/terrain-motifs.js';

function recorder(){const ops=[];return {ops,fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,save(){ops.push(['save'])},restore(){ops.push(['restore'])},translate(x,y){ops.push(['translate',x,y])},rotate(a){ops.push(['rotate',a])},fillRect(x,y,w,h){ops.push(['rect',this.fillStyle,x,y,w,h])},beginPath(){ops.push(['begin'])},arc(...a){ops.push(['arc',...a])},ellipse(...a){ops.push(['ellipse',...a])},stroke(){ops.push(['stroke',this.strokeStyle,this.lineWidth])}}}

const sim=new Simulation('GENVO8-TERRAIN-MOTIFS',{player:false}),field=buildSmoothedHabitatField(sim.world),before=sim.rng.state;
const scenes=collectHabitatScenes(sim,field,{startX:0,startY:0,cols:sim.world.n,rows:sim.world.n,block:8});
const motifs=scenes.map(s=>({scene:s,p:terrainMotifFor(sim,s)})).filter(x=>x.p.kind!=='none'&&x.p.strength>=.47);
assert.ok(motifs.length>=8,'world should expose a restrained set of large terrain motifs');
assert.equal(sim.rng.state,before,'terrain motif interpretation must not consume simulation RNG');
for(const {scene,p} of motifs){assert.ok(p.strength>=0&&p.strength<=1,'motif strength normalized');const a=recorder(),b=recorder();drawTerrainMotifBackdrop(a,{sim,scene,px:10,py:20,u:3});drawTerrainMotifBackdrop(b,{sim,scene,px:10,py:20,u:3});assert.deepEqual(a.ops,b.ops,`${p.kind} must draw deterministically`);assert.ok(a.ops.some(o=>o[0]==='rect'||o[0]==='ellipse'||o[0]==='arc'),`${p.kind} should visibly draw`)}

// Strengthen real traffic near a bank and verify the interpretation becomes a worn approach,
// without adding a bridge or changing canonical water state.
const bank=scenes.find(s=>s.kind==='watering-margin');assert.ok(bank,'expected watering margin');
for(let oy=-2;oy<=2;oy++)for(let ox=-3;ox<=3;ox++){const x=Math.max(1,Math.min(sim.world.n-2,bank.x+ox)),y=Math.max(1,Math.min(sim.world.n-2,bank.y+oy)),i=sim.world.idx(x,y);if(!sim.world.water[i])sim.history.traffic[i]=.72}
const trail=habitatSceneAt(sim,bank.x,bank.y,field,2);trail.kind='game-trail';trail.score=.8;
const tp=terrainMotifFor(sim,trail);assert.ok(['worn-water-approach','worn-lane'].includes(tp.kind));
const waterBefore=sim.world.water.reduce((a,b)=>a+b,0);const ctx=recorder();drawTerrainMotifBackdrop(ctx,{sim,scene:trail,px:0,py:0,u:3});assert.equal(sim.world.water.reduce((a,b)=>a+b,0),waterBefore,'drawing terrain motifs must not change hydrology');
const fg=recorder();drawTerrainMotifForeground(fg,{sim,scene:motifs[0].scene,px:0,py:0,u:3});
console.log('terrain motif checks: PASS',Object.fromEntries([...new Set(motifs.map(x=>x.p.kind))].map(k=>[k,motifs.filter(x=>x.p.kind===k).length])));
