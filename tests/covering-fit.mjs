import assert from 'node:assert/strict';
import {nativeCoveringFit} from '../src/render/covering-fit.js';
import {drawPart} from '../src/render/part-sprites.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {starterPlan,attachPart} from '../tools/creature-lab/assembly-model.js';
import {BODY_SHAPES} from '../src/lineage/part-registry.js';
const multiply=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
function recorder(){let matrix=[1,0,0,1,0,0];const stack=[];return new Proxy({matrix:()=>[...matrix],save(){stack.push([...matrix])},restore(){matrix=stack.pop()},translate(x,y){matrix=multiply(matrix,[1,0,0,1,x,y])},scale(x,y){matrix=multiply(matrix,[x,0,0,y,0,0])},rotate(a){matrix=multiply(matrix,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])},getTransform(){return{a:matrix[0],b:matrix[1],c:matrix[2],d:matrix[3],e:matrix[4],f:matrix[5]}}},{get(t,key){return key in t?t[key]:()=>{}}});}
assert.equal(nativeCoveringFit('simple-eye',{nativeBodyScale:.4}),null);
assert.equal(nativeCoveringFit('flight-wing',{nativeBodyScale:2}),null);
assert.equal(nativeCoveringFit('shell-back',{}),null);
assert.equal(nativeCoveringFit('fur-mantle',{nativeBodyScale:NaN}),null);
let checks=0;
for(const id of ['filament-tuft','fur-mantle','feather-mantle','shell-back'])for(const growth of [.3,.55,1])for(const axes of [[1,1],[1.8,.7],[.8,1.5]])for(let dir=0;dir<8;dir++){
 const k={s:2,fx:Math.cos(dir*Math.PI/4),fy:Math.sin(dir*Math.PI/4),perp:{x:0,y:1},bx:2,by:3,bodyW:8,bodyH:7,nativeBodyScale:growth,nativeBodyWidthScale:axes[0],nativeBodyHeightScale:axes[1],authoredFacing:dir};
 let observed;const c=recorder(),before=JSON.stringify(k);k.authoredParts={[id]:{draw(ctx,args){observed={matrix:ctx.matrix(),args};return true;}}};drawPart(c,id,k);assert.ok(observed);
 assert.ok(Math.abs(observed.matrix[0]-growth*axes[0])<1e-12);assert.ok(Math.abs(observed.matrix[3]-growth*axes[1])<1e-12);
 const fit=nativeCoveringFit(id,k);if(fit){assert.equal(observed.args.x,0);assert.equal(observed.args.y,0);}
 delete k.authoredParts;assert.equal(JSON.stringify(k),before);checks++;
}
// Actual assembly must supply the same body/development axes to native paint.
for(const root of ['small-torso','soft-torso','long-torso','stout-torso'])for(const growth of [.35,.7,1])for(let dir=0;dir<8;dir++){
 const plan=attachPart(starterPlan(root),'root','dorsal','fur-mantle'),animal={id:12,species:'genvo',alive:true,age:30,dir,bodyPlan:plan,genes:{body:1,motion:1,senses:1,temperament:1},adaptations:[]},phenotype=phenotypeFor(animal);phenotype.bodyScale*=growth;
 const shape=BODY_SHAPES[root],angle=dir*Math.PI/4,ox=Math.abs(Math.sin(angle)),oy=Math.abs(Math.cos(angle)),total=ox+oy;
 const x=phenotype.bodyScale*(phenotype.bodyWidthScale||1)*(ox*shape.length+oy*shape.width)/total*shape.size,y=phenotype.bodyScale*(phenotype.bodyHeightScale||1)*(oy*shape.length+ox*shape.width)/total*shape.size;
 let observed;drawGenvoSprite(recorder(),{animal,phenotype,scale:2,authoredParts:{'fur-mantle':{draw(c,args){observed={matrix:c.matrix(),args};return true;}}},palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},pose:{dir,action:'idle',life:{growth}}});
 assert.ok(observed);assert.ok(Math.abs(observed.matrix[0]-x)<1e-10);assert.ok(Math.abs(observed.matrix[3]-y)<1e-10);checks++;
}
console.log('Covering fit PASS: '+checks+' actual native draw/assembly cases, four coverings, four torso shapes, juvenile/adult deformation, all headings, stable anchors/inputs and unaffected unrelated anatomy.');
