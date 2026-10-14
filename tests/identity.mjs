import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildSmoothedHabitatField} from '../src/render/habitat.js';
import {habitatIdentityAt,riverIdentityAt,seasonalGroundProfile,drawSeasonalGround} from '../src/render/identity.js';

function recorder(){const ops=[];return {ops,fillStyle:'',strokeStyle:'',lineWidth:1,save(){ops.push(['save'])},restore(){ops.push(['restore'])},fillRect(x,y,w,h){ops.push(['rect',this.fillStyle,x,y,w,h])}}}
const sim=new Simulation('GENVO8-HABITAT-IDENTITY',{player:false}),w=sim.world,field=buildSmoothedHabitatField(w),rng=sim.rng.state;
const samples=[];for(let y=8;y<w.n;y+=17)for(let x=8;x<w.n;x+=17)if(!w.water[w.idx(x,y)])samples.push(habitatIdentityAt(w,x,y,field));
assert.ok(samples.length>20);assert.ok(new Set(samples.map(s=>s.kind)).size>=3,'world should expose multiple visual habitat identities');
for(const s of samples){assert.ok(s.strength>=0&&s.strength<=1);assert.ok(Number.isFinite(s.palette.hue));}
const water=[];for(let y=0;y<w.n;y++)for(let x=0;x<w.n;x++)if(w.water[w.idx(x,y)]&&(x+y)%19===0)water.push(riverIdentityAt(w,x,y));
assert.ok(water.length>4);assert.ok(water.every(r=>['run','pool','bend','narrows'].includes(r.kind)));
assert.equal(sim.rng.state,rng,'visual identity must not consume simulation RNG');
const id=samples[0],profiles=['SPRING','SUMMER','AUTUMN','WINTER'].map(s=>seasonalGroundProfile(s,id));assert.equal(new Set(profiles.map(p=>JSON.stringify(p))).size,4,'seasons should present differently');
const before=[...w.moisture],a=recorder(),b=recorder();drawSeasonalGround(a,{world:w,habitatField:field,season:'AUTUMN',px:0,py:0,u:3,x:24,y:24});drawSeasonalGround(b,{world:w,habitatField:field,season:'AUTUMN',px:0,py:0,u:3,x:24,y:24});assert.deepEqual(a.ops,b.ops);assert.deepEqual([...w.moisture],before,'seasonal presentation must not mutate ecology');
console.log('habitat identity + seasonal presentation checks: PASS',Object.fromEntries([...new Set(samples.map(s=>s.kind))].map(k=>[k,samples.filter(s=>s.kind===k).length])));
