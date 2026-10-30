// Lightweight projection regression. The actual Chromium renderer still needs
// native on-screen proof with large/young animals, screenshots and frame timings.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adultSizeScale,bodyDimensions} from '../src/organisms/body-size.js';
import {inheritedVisualScale,inheritedGaitLength} from '../src/render/inherited-size-presentation.js';
const body=scale=>({bodySize:{schema:1,alleles:[Math.log(scale),Math.log(scale)]}});
for(const s of [0.5,0.75,1,1.5,2,3]){
 const a=body(s),before=JSON.stringify(a);
 assert.ok(Math.abs(inheritedVisualScale(a)-s)<1e-12,'visual size matches inherited physical size '+s);
 assert.ok(Math.abs(inheritedGaitLength(4,a)-4*s)<1e-12,'gait stride follows inherited body size '+s);
 for(const growth of [0.2,0.55,1]){
  const dim=bodyDimensions(a,{growth,stage:'juvenile'});
  assert.ok(Math.abs(inheritedVisualScale(a)*growth-dim.currentScale)<1e-12,'growth applied exactly once '+s+' at '+growth);
 }
 assert.equal(JSON.stringify(a),before,'presentation does not mutate stored anatomy or alleles');
}
assert.equal(inheritedVisualScale({}),1,'legacy animal must render unchanged');
assert.equal(inheritedVisualScale(null),1,'nonexistent animal has reference scale');
assert.equal(inheritedGaitLength(4,{}),4,'legacy gait cadence unchanged');
const renderer=readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
assert.match(renderer,/const inheritedScale=inheritedVisualScale\(a\),scale=this\.zoom\*inheritedScale/);
assert.match(renderer,/gaitTravelFor\(inheritedGaitLength\(/);
assert.match(renderer,/ph\.bodyScale\*=visualGrowth/,'preserve existing developmental growth');
assert.match(renderer,/Math\.ceil\(44\*scale\/2\)/,'screen bounds expand with inherited scale');
assert.match(renderer,/drawGenvoSprite\(c,\{animal:a,phenotype:ph,scale,/,'actual sprite uses inherited scale');
assert.match(renderer,/r\.drawAnimal\(actor,tile\)/,'regional renderer delegates to same drawAnimal');
console.log('inherited body-size presentation projection: PASS');
