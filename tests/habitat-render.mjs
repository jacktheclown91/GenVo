import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildVisualHabitatMask,visualHabitatAt,HABITAT_RESOLUTION,HABITAT_ZONE} from '../src/render/habitat.js';

const sim=new Simulation('GENVO8-HABITAT-CONTOUR',{player:false}),w=sim.world,res=HABITAT_RESOLUTION;
let mixed=null,wet=null,dry=null,rich=null;
for(let y=2;y<w.n-2;y++)for(let x=2;x<w.n-2;x++){
  if(w.water[w.idx(x,y)])continue;
  const mask=buildVisualHabitatMask(w,x,y),center=visualHabitatAt(w,x+.5,y+.5);
  const nonzero=mask.counts.filter(v=>v>0).length;
  if(!mixed&&nonzero>1&&mask.transitions>0)mixed={x,y};
  if(!wet&&center.zone===HABITAT_ZONE.WET)wet={x,y};
  if(!dry&&center.zone===HABITAT_ZONE.DRY)dry={x,y};
  if(!rich&&center.zone===HABITAT_ZONE.RICH)rich={x,y};
  if(mixed&&wet&&dry&&rich)break;
}
assert.ok(mixed,'visual habitat reconstruction should produce a mixed contour tile somewhere');
const a=buildVisualHabitatMask(w,mixed.x,mixed.y),b=buildVisualHabitatMask(w,mixed.x,mixed.y);
assert.deepEqual([...a.zones],[...b.zones],'habitat contours must be deterministic');
assert.equal(a.zones.length,res*res);
assert.ok(a.transitions>0,'mixed habitat contour should contain sub-tile transitions');
for(const p of [wet,dry,rich])assert.ok(p,'test world should expose wet, dry and fertile visual habitat');
for(const p of [wet,dry,rich]){const v=visualHabitatAt(w,p.x+.5,p.y+.5);assert.ok(v.moisture>=0&&v.moisture<=1);assert.ok(v.fertility>=0&&v.fertility<=1)}
console.log('habitat contour checks: PASS');
