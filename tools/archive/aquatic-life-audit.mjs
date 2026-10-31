// Replay the existing aquatic-life fixture with read-only observations.
// Preserve its assertions; a failed assertion is diagnostic evidence, not a pass.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {FRESHWATER_FOOD,freshwaterPreference} from '../../src/ecology/freshwater-food.js';
let source=fs.readFileSync('tests/aquatic.mjs','utf8');
const end=source.indexOf('// An aquatic Stalker hunts');if(end<0)throw Error('fixture boundary missing');source=source.slice(0,end);
const needle="else if(reached)ashoreWhy[h.intent]=(ashoreWhy[h.intent]||0)+1";
if(source.split(needle).length!==2)throw Error('fixture expression changed');
source=source.replace(needle,`else if(reached){ashoreWhy[h.intent]=(ashoreWhy[h.intent]||0)+1;globalThis.__GENVO8_AQUATIC_AUDIT__.rows.push({day:s.day,tick:s.tickCount,x:h.x,y:h.y,intent:h.intent,target:h.target?{kind:h.target.kind,x:h.target.x,y:h.target.y,foodX:h.target.foodX,foodY:h.target.foodY}:null,energy:h.energy,hydration:h.hydration,meal:h.lastFreshwaterMeal,mouth:h.bodyPlan.nodes.find(n=>n.socket==='mouth')?.partId,nearbyWater:[[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]].some(([dx,dy])=>{const x=Math.floor(h.x)+dx+.5,y=Math.floor(h.y)+dy+.5;return s.world.water[s.world.idx(x,y)]&&Math.hypot(x-h.x,y-h.y)<=1.5})})}`);
source=source.replace(/from '(\.\.\/src\/[^']+)'/g,(_,p)=>`from '${pathToFileURL(path.resolve('tests',p)).href}'`);
const result={fixture:'tests/aquatic.mjs',observational:true,productionChanged:false,rows:[],assertionFailure:null};globalThis.__GENVO8_AQUATIC_AUDIT__=result;
try{await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))}catch(e){result.assertionFailure=e.message}finally{delete globalThis.__GENVO8_AQUATIC_AUDIT__}
fs.writeFileSync('reports/pass-x-aquatic-life-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify({failure:result.assertionFailure,ashoreSteps:result.rows.length,examples:result.rows.filter(r=>r.intent==='feed').slice(0,4)}));
const forbidden=result.rows.filter(r=>!['to-water','mate','swim','escape','flee'].includes(r.intent));
assert.ok(forbidden.length>0,'the original shore-action assertion must actually be contradicted');
for(const r of forbidden){assert.equal(r.intent,'feed');assert.ok(r.nearbyWater);assert.equal(r.meal?.tick,r.tick);assert.ok(r.meal.amount>0&&Number.isFinite(r.meal.amount));assert.ok(FRESHWATER_FOOD[r.meal.kind]?.surface);assert.ok(freshwaterPreference({bodyPlan:{nodes:[{parent:'root',socket:'mouth',partId:r.mouth}]}},r.meal.kind)>0)}
console.log('All rejected shore steps are compatible, immediate finite freshwater bank meals; original assertion failure retained.');
