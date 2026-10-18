import assert from 'node:assert/strict';
import {terrainTravel,elevationAt} from '../src/world/topography.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {planLandDetour} from '../src/world/land-route.js';
const n=7,w={n,len:n*n,water:new Uint8Array(n*n),terrain:{elevation:new Float32Array(n*n)},idx(x,y){return Math.max(0,Math.min(n-1,y|0))*n+Math.max(0,Math.min(n-1,x|0))}};
for(let y=0;y<n;y++)for(let x=0;x<n;x++)w.terrain.elevation[y*n+x]=x*.1;
const up=terrainTravel(w,2.5,2.5,3.5,2.5),down=terrainTravel(w,3.5,2.5,2.5,2.5),flat=terrainTravel(w,2.5,2.5,2.5,3.5);
assert.ok(up.energy>down.energy&&down.energy>=flat.energy,'climbing pays work; descending cannot create energy');assert.ok(up.speed<down.speed&&down.speed<=flat.speed);
assert.ok(Math.abs(elevationAt(w,2.75,2.5)-.225)<1e-7);
const short=terrainTravel(w,2.5,2.5,2.51,2.5);assert.ok(Math.abs(short.energy-up.energy)<1e-5,'short control steps see the same grade');
const body={alive:true,genes:{motion:1},adaptations:[]};const profile=movementProfile(body,w,{fromX:2.5,fromY:2.5,toX:3.5,toY:2.5});assert.ok(profile.energy>1);
const legacy={...w,terrain:null};assert.deepEqual(terrainTravel(legacy,2.5,2.5,3.5,2.5),{grade:0,speed:1,energy:1,routeCost:1});
// Two corridors: a direct high ridge, or a longer low route. The shared route cost sees the ridge.
w.terrain.elevation.fill(0);w.terrain.elevation[w.idx(3,3)]=1;
const a={x:1.5,y:3.5},sim={world:w,canSwim:()=>false,canReach:()=>true,canOccupy:(_,x,y)=>x>=.5&&y>=.5&&x<n&&y<n};planLandDetour(sim,a,{x:5.5,y:3.5});assert.ok(a.navigationRoute.points.every(p=>w.idx(p.x,p.y)!==w.idx(3,3)),'route avoids expensive ridge');
console.log('Terrain travel: uphill work, continuous grade, shared movement costs, low-effort detour and legacy fallback PASS');
