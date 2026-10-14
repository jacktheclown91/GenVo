import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../tools/sprite-sheet-export.html',import.meta.url),'utf8');
for(const source of ['genvo-draw.js','runtime-part-art.js','creature-palette.js','simulation.js','flora.js','behavior.js','species.js','config.js'])assert.ok(html.includes(source),`exporter must use ${source}`);
for(const draw of ['drawGenvoSprite','loadNativePartCatalog','creaturePalette','drawFloraPlant','behaviorVisualState','phenotypeFor'])assert.ok(html.includes(draw),`exporter must call ${draw}`);
assert.match(html,/DIRECTIONS=\['north','north-east','east','south-east','south','south-west','west','north-west'\]/);
assert.match(html,/FRAMES=\[0,1,2,3,4,5,6,7\]/);
assert.match(html,/SEASONS=\['SPRING','SUMMER','AUTUMN','WINTER'\]/);
console.log('sprite-sheet-export: canonical module wiring and 8x8/season grids verified');

assert.ok(!/drawFaunaSprite|SPECIES\[|hopper-walk|stalker-walk/.test(html),'export must use actual body plans rather than fixed creature sprites');
