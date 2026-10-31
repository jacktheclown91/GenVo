// Read-only survey of generated drinking water across a grid of planetary
// regions: open water, drinkable shore, how much land can reach drinking water
// on foot, moisture and generation time. Scores geography changes without
// targeting any number.
// Usage: node tools/survey-regional-water.mjs OUTPUT.json RADIUS SEED [SEED...] [--hydrology=VERSION]
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {World} from '../../src/world/world.js';
import {createPlanetDescriptor} from '../../src/world/planet-geography.js';

const args=process.argv.slice(2),hydrology=args.find(a=>a.startsWith('--hydrology='))?.slice(12)||null;
const [out,radiusArg,...seeds]=args.filter(a=>!a.startsWith('--')),radius=Number(radiusArg);
assert.ok(out&&!fs.existsSync(out)&&Number.isSafeInteger(radius)&&radius>=0&&radius<=8&&seeds.length,'Use fresh-OUTPUT.json RADIUS SEED...');
const SIZE=128,REACH=[12,32];
const report={schema:'genvo.regional-water-survey/1',hydrology,radius,seeds:[]};
for(const seed of seeds){
  const descriptor=createPlanetDescriptor(seed,hydrology?{hydrology}:{}),regions=[];
  for(let ry=-radius;ry<=radius;ry++)for(let rx=-radius;rx<=radius;rx++){
    const origin={x:rx*SIZE,y:ry*SIZE};let w,ms;
    try{const t=performance.now();w=new World(seed,{generator:'planetary/1',planetOrigin:origin,planetDescriptor:descriptor});ms=performance.now()-t}
    catch(error){if(/outside supported/.test(error.message))continue;throw error}
    let water=0,shore=0,land=0,moisture=0,unreachable=0,creeks=0;const within=REACH.map(()=>0),distances=[];
    for(let i=0;i<w.len;i++){
      if(w.water[i]){water++;continue}
      land++;moisture+=w.moisture[i];if(w.drinkable[i])shore++;if(w.creeks?.[i])creeks++;
      const d=w.waterDistance[i];if(d>=65535){unreachable++;continue}
      distances.push(d);REACH.forEach((r,k)=>{if(d<=r)within[k]++});
    }
    distances.sort((a,b)=>a-b);
    regions.push({origin,water,creekCells:creeks,landRegions:new Set(Array.from(w.landRegion).filter(Boolean)).size,drinkableShore:shore,land,meanMoisture:+(moisture/Math.max(1,land)).toFixed(3),
      landWithin12:+(within[0]/Math.max(1,land)).toFixed(3),landWithin32:+(within[1]/Math.max(1,land)).toFixed(3),
      landUnreachable:+(unreachable/Math.max(1,land)).toFixed(3),medianDistance:distances.length?distances[distances.length>>1]:null,generationMs:Math.round(ms)});
  }
  const share=f=>+(regions.filter(f).length/regions.length).toFixed(3),mean=k=>+(regions.reduce((s,r)=>s+r[k],0)/regions.length).toFixed(3);
  report.seeds.push({seed,regions:regions.length,withAnyWater:share(r=>r.water>0),withCreeks:share(r=>r.creekCells>0),meanCreekCells:mean('creekCells'),meanWaterCells:mean('water'),meanLandRegions:mean('landRegions'),withDrinkableShore:share(r=>r.drinkableShore>0),
    meanLandWithin12:mean('landWithin12'),meanLandWithin32:mean('landWithin32'),meanLandUnreachable:mean('landUnreachable'),
    meanGenerationMs:mean('generationMs'),maxGenerationMs:Math.max(...regions.map(r=>r.generationMs)),regionRows:regions});
}
fs.writeFileSync(out,JSON.stringify(report,null,1));
console.log(JSON.stringify(report.seeds.map(({regionRows,...s})=>s),null,1));
