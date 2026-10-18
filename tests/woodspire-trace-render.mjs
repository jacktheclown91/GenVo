import assert from 'node:assert/strict';
import {drawFloraPlant,drawFloraTrace} from '../src/render/flora.js';
// Real Woodspire stocks must remain renderable both as full trees and as small
// page/surface traces. A trace previously threw "shade is not defined" only
// when the actual game reached that detailed rendering branch in Chromium.
for(const season of ['SPRING','SUMMER','AUTUMN','WINTER']){
 const drawn=[],c={fillStyle:'#000',save(){},restore(){},translate(){},scale(){},fillRect(x,y,w,h){drawn.push({x,y,w,h,color:this.fillStyle})}};
 const input={shape:'tree',color:'#35654b',amount:.85,px:0,py:0,u:2,x:17,y:22,kind:'woodspire',season};
 drawFloraPlant(c,input);
 assert.ok(drawn.length>8,'live canopy draws in '+season);
 drawn.length=0;
 drawFloraTrace(c,input);
 assert.ok(drawn.length>=3,'miniature tree trace draws with defined shaded pigments in '+season);
 assert.ok(drawn.every(p=>typeof p.color==='string'&&p.color.length>0),'each tree-trace pigment resolves in '+season);
}
console.log('Woodspire full crown and distant ground traces in four seasons do not throw and use real colors PASS');
