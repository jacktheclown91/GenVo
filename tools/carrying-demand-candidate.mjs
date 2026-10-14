import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

// Diagnostic-only class variant. Canonical source is neither edited nor loaded
// from a second shipping toolkit. Preferences and access are constant during a
// single competitor survey, so reuse them without broadening their lifetime.
export async function loadCarryingDemandCandidate(sourceRoot){
  const file=path.join(sourceRoot,'ecology/carrying.js');
  let source=fs.readFileSync(file,'utf8');
  const before=`let shared=0;for(const row of supply.rows){
          if(row.wet?!canAccessFreshwater(this.sim,b,row.x,row.y,FRESHWATER_FOOD[row.kind]):!this.sim.canReach(b,row.x,row.y))continue;
          const preference=row.wet?freshwaterPreference(b,row.kind):(SPECIES[b.species].diets?.[row.kind]||0);
          shared+=row.energy*Math.min(row.preference,preference);
        }`;
  const after=`let shared=0;const preferences=new Map(),access=new Map();for(const row of supply.rows){
          let preference;if(row.wet){if(!preferences.has(row.kind))preferences.set(row.kind,freshwaterPreference(b,row.kind));preference=preferences.get(row.kind)}else preference=SPECIES[b.species].diets?.[row.kind]||0;
          if(preference<=0)continue;
          const accessKey=row.wet?row.x+':'+row.y+':'+!!FRESHWATER_FOOD[row.kind].surface:row.x+':'+row.y+':land';
          if(!access.has(accessKey))access.set(accessKey,row.wet?canAccessFreshwater(this.sim,b,row.x,row.y,FRESHWATER_FOOD[row.kind]):this.sim.canReach(b,row.x,row.y));
          if(!access.get(accessKey))continue;
          shared+=row.energy*Math.min(row.preference,preference);
        }`;
  source=source.replaceAll('\r\n','\n');
  assert.ok(source.includes(before),'candidate requires the exact validated survey loop');
  source=source.replace(before,after).replace(/from (['"])(\.{1,2}\/[^'"]+)\1/g,(_m,_q,relative)=>'from '+JSON.stringify(pathToFileURL(path.resolve(path.dirname(file),relative)).href));
  return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).CarryingPressureController;
}
