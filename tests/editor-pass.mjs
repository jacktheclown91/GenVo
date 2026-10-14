import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import {createDraft,draftCost,place} from '../src/lineage/evolution-draft.js';
import {CreatureEditor} from '../src/ui/creature-editor.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {drawPartAlone} from '../src/render/part-sprites.js';

// v1.60.0 editor pass (creator review 2026-10-10): the counter shows the real balance, each change
// shows its cost and whether it went over, the preview is larger and zoomable, and part tiles use each
// part's own standalone art instead of a diff of two renders.

// Points: each change in order, with the ones that pushed the design over budget marked.
const d=createDraft({base:bodyPlanFromLegacy({adaptations:[]}),ancestry:[],budget:3});
place(d,'armor-plate','root','flank.left');place(d,'tearing-jaw','root','mouth');
assert.equal(draftCost(d)-d.budget,1,'the design is one point over');
const steps=CreatureEditor.prototype.costSteps.call({draft:d});
assert.equal(steps.length,2);
assert.deepEqual(steps.map(s=>[s.text,s.cost,s.over]),[['Armor plate',2,false],['Tearing jaw',2,true]],'only the change that went over is marked');

const src=fs.readFileSync(new URL('../src/ui/creature-editor.js',import.meta.url),'utf8');
assert.doesNotMatch(src,/Math\.max\(0,left\)/,'the big counter is not clamped at zero');
assert.match(src,/ed-dna-n[^>]*>\$\{left\}</,'the big counter shows the signed balance');
assert.match(src,/points over/);
assert.ok(src.includes('gain=now.parts.filter(p=>partText(p)?.gain'),'older parts (adaptation text) are listed in What changes too');

// Preview: larger, with zoom buttons and the mouse wheel.
assert.match(src,/STAGE_W=560,STAGE_H=460/);assert.match(src,/data-act="zoom-in"/);assert.match(src,/addEventListener\('wheel'/);

// Tiles: standalone part art, no with-and-without diff.
assert.doesNotMatch(src,/REF_BODY/,'no reference body is drawn to cut parts out');
assert.match(src,/drawPartAlone\(/);
const rects=[];const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,fillRect:(...a)=>rects.push(a),beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},ellipse(){},save(){},restore(){},translate(){},rotate(){},scale(){},closePath(){}};
const P={body:'#7aa8e8',shade:'#3d5e9a',light:'#cfe3ff'};let drawn=0,checked=0;
for(const [id,def] of Object.entries(PARTS)){const type=def.compatibleSocketTypes?.[0];if(def.tags.includes('root')||!type)continue;checked++;rects.length=0;drawPartAlone(ctx,id,{type,s:4,p:P});if(rects.length)drawn++;else console.log('no standalone art:',id)}
assert.equal(drawn,checked,'every attachable part has standalone art');
console.log(`editor pass ok (${drawn} parts with standalone art)`);
