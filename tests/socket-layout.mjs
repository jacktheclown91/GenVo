import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PARTS,ROUND_LAYOUT} from '../src/lineage/part-registry.js';
import {authoredSockets,socketPoints,bodyFrame} from '../src/render/socket-layout.js';
import {genvoAnchors,drawGenvoSprite} from '../src/render/genvo-draw.js';
import {drawLimb,LIMB_ART} from '../src/render/part-sprites.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';

// Creator rules (2026-10-10): the body owns its attachment locations; each part owns its art and
// animation. Sockets are editor indicators only. Sockets follow the rotating body. Proven first on
// the round founder body; bodies without authored places keep computed positions.

// The round founder body places every one of its sockets itself.
const round=PARTS['small-torso'];
for(const s of round.providedSockets)assert.ok(s.at,`the round body places its ${s.id}`);
assert.deepEqual(Object.keys(authoredSockets('small-torso')).sort(),Object.keys(ROUND_LAYOUT).sort());
assert.deepEqual(Object.keys(authoredSockets('soft-torso')),['head'],'other bodies own a head mount and keep computed limb/legacy face positions');

// Sockets follow the rotating body: facing down mirrors facing up, front and back swap.
const frame=dir=>{const v=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]][dir],m=Math.hypot(...v),fx=v[0]/m,fy=v[1]/m;return bodyFrame({fx,fy,perp:{x:-fy,y:fx},bx:0,by:0,bodyW:7,bodyH:6})};
const up=socketPoints('small-torso',frame(0)),down=socketPoints('small-torso',frame(4)),right=socketPoints('small-torso',frame(2));
assert.ok(up.mouth.y<0&&down.mouth.y>0&&right.mouth.x>0,'the mouth turns with the body');
assert.ok(Math.abs(up['eye.left'].x+down['eye.left'].x)<1e-9,'left and right turn with the body');
assert.ok(up.dorsal.y<0&&down.dorsal.y<0,'the back stays on top whichever way the body faces');

// The editor's sockets are the body's own places.
const plan=founderPlan(),a={id:-1,species:'genvo',dir:3,bodyPlan:plan,adaptations:[],anatomy:{},genes:{}};
const {anchors}=genvoAnchors({animal:a,phenotype:phenotypeFor(a),pose:{dir:3}});
for(const id of ['mouth','eye.left','eye.right','flank.left','flank.right','tail'])assert.ok(anchors.some(x=>x.socket===id),`the editor offers the ${id}`);
assert.equal(anchors.filter(x=>x.type==='limb').length,4,'four hips on the round body');

// Parts swap between compatible sockets on the same body without redrawing the body.
const all=Object.keys(PARTS),d=createDraft({base:plan,ancestry:all,budget:99,unlocked:all});
for(const [part,socket] of [['sail-fin','dorsal'],['moss-back','dorsal'],['spine-cluster','flank.left'],['storage-sac','flank.left'],['club-tail','tail'],['fat-tail','tail']])assert.equal(place(d,part,'root',socket).ok,true,`${part} on the ${socket}`);

// Each leg part draws its own limb (thigh, knee, shin and foot).
let rects=0;const ctx={set fillStyle(v){},fillRect(){rects++}};
const k={s:2,p:{body:'#7f9fd8',shade:'#4a6aa8',light:'#b9cff0'},leg:{liftAmount:0,front:0,side:1},root:{x:0,y:0},knee:{x:3,y:-1},foot:{x:5,y:2}};
for(const id of Object.keys(PARTS).filter(id=>PARTS[id].tags.includes('leg'))){rects=0;drawLimb(ctx,id,k);assert.ok(rects>4,`${id} draws its limb`)}
assert.equal(typeof LIMB_ART,'object');

// Sockets are editor indicators only: the game's renderer never draws them.
const renderer=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
assert.equal(/genvoAnchors|socketPoints/.test(renderer),false,'the world renderer has no socket markers');
// Gameplay drawing still works for the authored body in every facing.
for(let dir=0;dir<8;dir++){rects=0;drawGenvoSprite(ctx,{animal:{...a,dir},phenotype:phenotypeFor(a),scale:2,frame:dir,moving:true,palette:k.p,pose:{dir}});assert.ok(rects>40)}
console.log('socket layout ok');
