import {adultBodyMass,massPolicy,ANATOMICAL_MASS,REFERENCE_MASS} from '../organisms/body-mass.js';
import {projectMount,mountedChanges} from './workshop-projection.js';
import {workshopBounds} from './workshop-preview.js';
import {creaturePalette} from '../render/creature-palette.js';
import {CFG} from '../sim/config.js';
import {PARTS,partDef} from '../lineage/part-registry.js';
import {createDraft,place,remove,undo,redo,revert,draftCost,draftProblems,whyNot,mirrorSocket,replaceRoot as replaceDraftRoot,partCost} from '../lineage/evolution-draft.js';
import {PART_ABILITY_TEXT as PHASE_D_TEXT,WAVE1_TEXT,WAVE2_TEXT,partEffectFactors} from '../lineage/part-abilities.js';
const PART_ABILITY_TEXT={...PHASE_D_TEXT,...WAVE1_TEXT,...WAVE2_TEXT};
// What a part does, from the part table or, for older parts, the adaptation it carries.
const partText=id=>PART_ABILITY_TEXT[id]||(PARTS[id]?.legacy?{gain:ADAPTATIONS[PARTS[id].legacy.adaptation]?.summary,cost:ADAPTATIONS[PARTS[id].legacy.adaptation]?.tradeoff}:null);
import {applyLineageTarget} from '../lineage/reproduction-bridge.js';
import {makePlan} from '../lineage/body-plan.js';
import {ADAPTATIONS,adaptationEffects,bodyAbility} from '../lineage/evolution.js';
import {canSwim} from '../lineage/lifestyle.js';
import {phenotypeFor} from '../organisms/species.js';
import {drawGenvoSprite,genvoAnchors,outlineColor} from '../render/genvo-draw.js';
import {drawPartAlone} from '../render/part-sprites.js';

// The creature editor (Evolution Expansion Phase C; v1.53.0 redesign, creator direction 2026-10-09:
// "a Spore-like editor, visual parts drag and attach"). Opens when the active Generation 2+
// creature mates and edits a draft of the coming litter's body. Parts sit in a tray, drawn on your
// own creature; drag one onto a glowing socket to attach it (or click the part, then the socket),
// and drag an attached part off the body to remove it. The world is paused and untouched until
// Evolve; Cancel spends nothing. The draft rules (cost, prerequisites, viability) are unchanged.

export const PHASE_D_PARTS=Object.freeze([]);
const PART_NAMES=Object.fromEntries(Object.keys(PARTS).map(id=>[id,id.split('-').map((w,i)=>i?w:w[0].toUpperCase()+w.slice(1)).join(' ')]));
// Kept for older callers: body sites as socket groups.
export const SITES=Object.freeze([
  {id:'torso',label:'Torso',sockets:[[null,null]]},
  {id:'front-legs',label:'Front legs',sockets:[['root','limb.0'],['root','limb.7'],['root','limb.1']]},
  {id:'side-legs',label:'Side legs',sockets:[['root','limb.2'],['root','limb.6']]},
  {id:'rear-legs',label:'Rear legs',sockets:[['root','limb.4'],['root','limb.3'],['root','limb.5']]},
  {id:'mid-legs',label:'Middle legs',sockets:[['root','limb.9'],['root','limb.14'],['root','limb.10'],['root','limb.13']]},
  {id:'mouth',label:'Mouth',sockets:[['root','mouth']]},
  {id:'eyes',label:'Eyes',sockets:[['root','eye.left'],['root','eye.right']]},
  {id:'flanks',label:'Flanks',sockets:[['root','flank.left'],['root','flank.right']]},
  {id:'back',label:'Back',sockets:[['root','dorsal']]},
  {id:'tail',label:'Tail',sockets:[['root','tail']]}
]);
// The tray: one drawer per kind of socket.
const TRAY=Object.freeze([
  {id:'body',label:'Body',type:'torso',hint:'Drop a body onto your creature to swap it. Bigger bodies have more sockets.'},
  {id:'head',label:'Head',type:'head',hint:'The head carries your eyes and mouth. Removing it keeps compatible organs on the body.'},
  {id:'legs',label:'Legs',type:'limb',hint:'Drop legs on the glowing hip sockets. More legs run faster.'},
  {id:'mouth',label:'Mouth',type:'mouth',hint:'The mouth sets what feeds you best.'},
  {id:'eyes',label:'Eyes',type:'eye',hint:'Eyes decide how far you see food and danger.'},
  {id:'back',label:'Back',type:'dorsal',hint:'Fins, ridges, humps and crests along the back.'},
  {id:'sides',label:'Sides',type:'flank',hint:'Plates, sacs and glands on the flanks.'},
  {id:'tail',label:'Tail',type:'tail',hint:'Tails balance, store, strike or signal.'},
  {id:'knees',label:'Knees',type:'spur',hint:'Spurs and claws on the knee of each leg.'}
]);
const SOCKET_NAMES={head:'head mount',mouth:'mouth','eye.left':'left eye','eye.right':'right eye','eye.left.2':'left back eye','eye.right.2':'right back eye',dorsal:'back','flank.left':'left side','flank.right':'right side',tail:'tail',spur:'knee'};
const socketName=a=>a.type==='limb'?'hip':SOCKET_NAMES[a.socket]||a.socket;
const esc=v=>String(v??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const PALETTE=Object.freeze({body:'#7aa8e8',shade:'#3d5e9a',light:'#cfe3ff'});

// Hand-made 8x8 pixel icons for the stat rows ('#' dark, 'o' light).
const ICON_BITS={
  speed:['........','..##....','.####...','..##.##.','...####.','..##..#.','.##.....','##......'],
  sprint:['........','.####...','......##','..####..','.......#','.####...','.....##.','........'],
  bite:['........','#......#','##....##','#o#..#o#','#..##..#','#......#','.######.','........'],
  tough:['.######.','#oooooo#','#oo##oo#','#o####o#','#oo##oo#','.#oooo#.','..#oo#..','...##...'],
  sight:['........','..####..','.#oooo#.','#oo##oo#','#oo##oo#','.#oooo#.','..####..','........'],
  water:['...#....','...#....','..#o#...','..#o#...','.#ooo#..','.#ooo#..','..###...','........'],
  food:['.....##.','....#o#.','...#oo#.','..#oo#..','.#oo#...','.#o#....','#.#.....','........'],
  legs:['..####..','.#oooo#.','.#oooo#.','..####..','.#.##.#.','#..##..#','#..##..#','........']
};
const iconCache=new Map();
function iconURL(name,dark='#e8c878',light='#7a5a30'){
  const key=name+dark+light;if(iconCache.has(key))return iconCache.get(key);if(typeof document==='undefined')return'';
  const cv=document.createElement('canvas');cv.width=8;cv.height=8;const c=cv.getContext('2d');if(!c)return'';
  ICON_BITS[name].forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='.')return;c.fillStyle=ch==='#'?dark:light;c.fillRect(x,y,1,1)}));
  const url=cv.toDataURL();iconCache.set(key,url);return url;
}

// A stand-in for a newborn of this design, built from the parent: what the litter would be.
export function previewBody(parent,plan){
  const a={id:-1,species:parent?.species||'genvo',...(parent?.massPolicy!==undefined?{massPolicy:parent.massPolicy}:{}),alive:true,genes:{...(parent?.genes||{})},adaptations:[...(parent?.adaptations||[])],anatomy:{...(parent?.anatomy||{})},ecoLifestyle:parent?.ecoLifestyle||null};
  applyLineageTarget(a,plan);return a;
}
// Real measured values from the existing authorities, for the preview and the comparison.
export function measure(body){
  const fx=adaptationEffects(body),pf=partEffectFactors(body),pounce=bodyAbility(body,'pounce'),P=CFG.pounce,mass=adultBodyMass(body),load=massPolicy(body)===ANATOMICAL_MASS?mass/REFERENCE_MASS:1;
  return{mass,land:pf?.landSpeed??1,legs:pf?.legs??8,windup:pf?.strikeWindup??1,sight:pf?.threatSense??1,parts:[...new Set((body.bodyPlan?.nodes||[]).map(n=>n.partId))],sprint:fx.sprintSpeed,damage:fx.predatorDamage*(pf?.damageTaken??1),strike:fx.playerStrike,water:fx.waterUse*load,food:fx.foodGain,metabolism:fx.metabolism*load,carry:fx.carryCapacity,pounce:pounce?+(P.reach[0]+(pounce-.8)/.2*(P.reach[1]-P.reach[0])).toFixed(2):0,swim:canSwim(body),adaptations:[...body.adaptations]};
}

// v1.60.0 (creator review 2026-10-10: "a larger adjustable preview"): a bigger stage, zoomable with
// the - and + buttons or the mouse wheel.
const STAGE_SCALE=18,THUMB_SCALE=4,STAGE_W=560,STAGE_H=460,ZOOMS=Object.freeze([.6,.75,.9,1,1.15,1.3,1.5,1.75]);

// Part art for the tray: each part's own standalone drawing (part-sprites drawPartAlone), outlined
// the way creatures are, then cropped. Bodies are drawn on their own (a body with nothing attached).
const isoCache=new Map();
function drawRef(plan,dir){
  const n=40*THUMB_SCALE,cv=document.createElement('canvas');cv.width=n;cv.height=n;const c=cv.getContext('2d');if(!c)return null;c.imageSmoothingEnabled=false;
  const a={id:-3,species:'genvo',dir,bodyPlan:plan,adaptations:[],anatomy:{},genes:{}};c.translate(n/2,n/2);drawGenvoSprite(c,{animal:a,phenotype:phenotypeFor(a),scale:THUMB_SCALE,frame:2,moving:false,palette:PALETTE,pose:{dir}});return cv;
}
function drawAlone(partId,type){
  const n=40*THUMB_SCALE,art=document.createElement('canvas');art.width=n;art.height=n;const a=art.getContext('2d',{willReadFrequently:true});if(!a)return null;a.imageSmoothingEnabled=false;
  a.translate(n/2,n/2);drawPartAlone(a,partId,{type,s:THUMB_SCALE,p:PALETTE});a.setTransform(1,0,0,1,0,0);
  const cv=document.createElement('canvas');cv.width=n;cv.height=n;const c=cv.getContext('2d',{willReadFrequently:true});const o=THUMB_SCALE/2;
  for(const [dx,dy] of [[o,0],[-o,0],[0,o],[0,-o]])c.drawImage(art,dx,dy);c.globalCompositeOperation='source-in';c.fillStyle=outlineColor(PALETTE);c.fillRect(0,0,n,n);c.globalCompositeOperation='source-over';c.drawImage(art,0,0);return cv;
}
export function isolatedPart(partId){
  if(isoCache.has(partId))return isoCache.get(partId);if(typeof document==='undefined')return null;const def=partDef(partId);if(!def)return null;
  const full=def.tags.includes('root')?drawRef(makePlan([{partId,parent:null,socket:null}]),3):drawAlone(partId,def.compatibleSocketTypes[0]);
  if(!full)return null;const n=full.width,A=full.getContext('2d',{willReadFrequently:true}).getImageData(0,0,n,n).data;let x0=n,y0=n,x1=-1,y1=-1;
  for(let i=3;i<A.length;i+=4){if(A[i]<8)continue;const q=(i-3)/4,x=q%n,y=(q/n)|0;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y}
  if(x1<0){isoCache.set(partId,null);return null}
  const cv=document.createElement('canvas');cv.width=x1-x0+1;cv.height=y1-y0+1;cv.getContext('2d').drawImage(full,-x0,-y0);isoCache.set(partId,cv);return cv;
}
export class CreatureEditor{
  constructor({getSim,root=document.querySelector('#app'),onDone=()=>{},id='creatureEditor'}={}){
    this.getSim=getSim;this.onDone=onDone;this.open=false;this.draft=null;this.tray='legs';this.symmetry=true;this.facing=3;this.testing=false;this.compare=false;this.frame=0;this.zoom=3;this.selected=null;this.picked=null;this.hoverKey=null;this.hoverPart=null;this.drag=null;
    this.el=document.createElement('section');this.el.id=id;this.el.className='creature-editor';this.el.hidden=true;this.el.setAttribute('role','dialog');this.el.setAttribute('aria-label','Shape the coming generation');root?.appendChild(this.el);
    this.ghost=document.createElement('canvas');this.ghost.className='ed-ghost';this.ghost.width=84;this.ghost.height=70;this.ghost.hidden=true;root?.appendChild(this.ghost);
    this.el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.classList.contains('ed-tile'))return;
      if(b.dataset.tray){this.tray=b.dataset.tray;this.selected=null;this.confirming=false;this.render();return}
      if(b.dataset.mount){const a=this.anchors().find(a=>a.key===b.dataset.mount);if(a&&this.selected){const id=this.selected;this.selected=null;this.attach(id,a)}return}if(b.dataset.act)this.action(b.dataset.act)});
    this.el.addEventListener('pointerdown',e=>this.pointerDown(e));
    this.el.addEventListener('pointerover',e=>{const t=e.target.closest('.ed-tile');if(t&&t.dataset.part!==this.hoverPart){this.hoverPart=t.dataset.part;this.renderCard()}});
    this.el.addEventListener('pointerout',e=>{const t=e.target.closest('.ed-tile');if(t&&!t.contains(e.relatedTarget)){this.hoverPart=null;this.renderCard()}});
    this.onMove=e=>this.pointerMove(e);this.onUp=e=>this.pointerUp(e);
    this.el.addEventListener('pointermove',e=>{if(!this.drag)this.stageHover(e)});
    this.el.addEventListener('wheel',e=>{if(!e.target.closest('.ed-stage'))return;e.preventDefault();this.setZoom(this.zoom+(e.deltaY<0?1:-1))},{passive:false});
  }
  get sim(){return this.getSim()}
  request(){
    this.session=null;
    const sim=this.sim;if(this.open||!sim.evolutionEditor?.pending())return false;this.draft=sim.evolutionEditor.openDraft();if(!this.draft)return false;
    this.wasPaused=!!sim.paused;sim.paused=true;this.open=true;this.el.hidden=false;this.parent=sim.player();this.tray='legs';this.testing=false;this.compare=false;this.confirming=false;this.boundsKey=null;this.message='';this.selected=null;this.picked=null;
    this.render();this.startLoop();return true;
  }
  requestSession(session){
    if(this.open)return false;this.session=session;this.draft=session.draft;this.parent=session.parent;
    this.wasPaused=!!this.sim.paused;this.sim.paused=true;this.open=true;this.el.hidden=false;
    this.el.setAttribute('aria-label',session.title);this.tray='legs';this.testing=false;this.compare=false;this.confirming=false;this.boundsKey=null;this.message='';this.selected=null;this.picked=null;
    this.render();this.startLoop();return true;
  }
  close(){if(this.open&&this.sim)this.sim.paused=!!this.wasPaused;this.open=false;this.el.hidden=true;this.ghost.hidden=true;this.drag=null;this.stopLoop()}
  trayDef(){return TRAY.find(t=>t.id===this.tray)||TRAY[1]}

  // --- Bodies and sockets ---
  body(plan=this.draft.plan){const b=previewBody(this.parent,plan);b.bodyPlan=plan;b.dir=this.facing;return b}
  anchors(){
    const b=this.body(),{anchors}=genvoAnchors({animal:b,phenotype:phenotypeFor(b),pose:{dir:this.facing}});
    // Sockets that would draw on top of each other are nudged apart, so each can be picked.
    for(let i=0;i<anchors.length;i++)for(let j=0;j<i;j++){const a=anchors[i],o=anchors[j];if(Math.hypot(a.x-o.x,a.y-o.y)<1.2){a.x+=1.6;a.y+=.4}}
    for(const a of anchors)a.part=this.draft.plan.nodes.find(n=>n.parent===a.parent&&n.socket===a.socket)?.partId||null;
    return anchors;
  }
  // Zoom keeps the creature's middle (body plus legs) at the middle of the stage.
  stageGeom(){const cv=this.el.querySelector('.ed-stage');if(!cv||!this.draft)return null;const b=this.body(),key=this.draft.plan.id+'|'+this.facing+'|'+JSON.stringify(b.genes);if(this.boundsKey!==key){this.boundsKey=key;this.bounds=workshopBounds(b,this.facing)}const box=this.bounds,S=Math.min((cv.width-100)/box.w,(cv.height-90)/box.h)*ZOOMS[this.zoom];return{cv,cx:cv.width/2-box.x*S,cy:cv.height/2-box.y*S,S}}
  hitRadius(){const g=this.stageGeom(),r=g?.cv.getBoundingClientRect();return r?.width?22*g.cv.width/r.width/g.S:2.6}
  mountTargets(a){const targets=[{parent:a.parent,socket:a.socket}];if(this.symmetry){const m=this.mirrorOf(a);if(m)targets.push(m)}return targets}
  projection(partId,a){return projectMount(this.draft,partId,PARTS[partId]?.tags.includes('root')?[{parent:null,socket:null}]:a?this.mountTargets(a):[])}

  setZoom(z){const n=Math.max(0,Math.min(ZOOMS.length-1,z));if(n===this.zoom)return;this.zoom=n;const t=this.el.querySelector('.ed-zoom-n');if(t)t.textContent=`${Math.round(ZOOMS[n]*100)}%`;this.drawStage()}
  // Each change in the order it was made, what it cost, and whether it went over the budget
  // (creator review 2026-10-10: "a clearer indication of which changes pushed the design over budget").
  costSteps(){
    const d=this.draft,plans=[...d.history,d.plan];let i=plans.lastIndexOf(d.base);if(i<0)i=0;const steps=[];let spent=0;
    const at=p=>new Map(p.nodes.filter(n=>n.parent).map(n=>[`${n.parent}|${n.socket}`,n.partId]));
    for(let k=i+1;k<plans.length;k++){const prev=plans[k-1],next=plans[k],cost=draftCost({...d,plan:next})-draftCost({...d,plan:prev});const a=at(prev),b=at(next),added=new Map(),lost=new Map();
      for(const [key,id] of b)if(a.get(key)!==id)added.set(id,(added.get(id)||0)+1);for(const [key,id] of a)if(b.get(key)!==id)lost.set(id,(lost.get(id)||0)+1);
      const rootA=prev.nodes.find(n=>!n.parent)?.partId,rootB=next.nodes.find(n=>!n.parent)?.partId;if(rootA!==rootB&&rootB)added.set(rootB,1);
      const name=(id,n)=>`${PART_NAMES[id]||id}${n>1?` x${n}`:''}`,text=added.size?[...added].map(([id,n])=>name(id,n)).join(', '):lost.size?`Removed ${[...lost].map(([id,n])=>name(id,n).toLowerCase()).join(', ')}`:'Moved a part';
      spent+=cost;steps.push({text,cost,over:cost>0&&spent>d.budget})}
    return steps;
  }
  // Sockets a part can go on right now.
  validFor(partId,anchors=this.anchors()){
    const def=partDef(partId);if(!def||def.tags.includes('root'))return[];
    return anchors.filter(a=>def.compatibleSocketTypes.includes(a.type)&&!whyNot(this.draft,partId,a.parent,a.socket));
  }
  mirrorOf(a){
    if(a.socket==='spur'){const m=/^root\/limb\.(\d+)$/.exec(a.parent);if(!m)return null;const t=mirrorSocket(`limb.${m[1]}`),parent=`root/${t}`;return parent!==a.parent&&this.draft.plan.nodes.some(n=>n.id===parent)?{parent,socket:'spur'}:null}
    const t=mirrorSocket(a.socket);if(t===a.socket)return null;const host=partDef(this.draft.plan.nodes.find(n=>n.id===a.parent)?.partId);return host?.providedSockets.some(s=>s.id===t)?{parent:a.parent,socket:t}:null;
  }
  // Several draft edits made as one step, so Undo takes them back together.
  group(fn){const d=this.draft,h=d.history.length;const r=fn();if(d.history.length>h+1)d.history.length=h+1;return r}
  attach(partId,a){
    this.confirming=false;    const d=this.draft,targets=[{parent:a.parent,socket:a.socket}];if(this.symmetry){const m=this.mirrorOf(a);if(m)targets.push(m)}
    const r=this.group(()=>{let last={ok:true};for(const t of targets){last=place(d,partId,t.parent,t.socket);if(!last.ok)break}return last});
    this.message=r.ok?'':r.reason;this.picked=null;this.render();return r;
  }
  detach(a){
    this.confirming=false;    if(a.socket==='mouth'){this.message='Your creature needs a mouth: drop another mouth on it to swap.';this.render();return{ok:false}}
    const d=this.draft,targets=[{parent:a.parent,socket:a.socket}];if(this.symmetry){const m=this.mirrorOf(a);if(m)targets.push(m)}
    const r=this.group(()=>{let last={ok:true};for(const t of targets){const node=d.plan.nodes.find(n=>n.parent===t.parent&&n.socket===t.socket);if(node)last=remove(d,node.id);if(!last.ok)break}return last});
    this.message=r.ok?'':r.reason;this.picked=null;this.render();return r;
  }
  swapBody(partId){this.confirming=false;const r=replaceDraftRoot(this.draft,partId);this.message=r.ok?'':r.reason;this.render();return r}
  // Older callers: put a part on its first free socket (or, with null, remove the picked part).
  choose(partId){
    if(!partId){if(this.picked){const a=this.anchors().find(x=>x.key===this.picked);if(a)return this.detach(a)}return{ok:false}}
    if(PARTS[partId]?.tags.includes('root'))return this.swapBody(partId);
    const valid=this.validFor(partId),free=valid.find(a=>!a.part)||valid[0];if(!free){this.message=this.lockReason(partId)||'No socket for that part on this body.';this.render();return{ok:false}}
    return this.attach(partId,free);
  }
  lockReason(partId){
    const d=this.draft,def=partDef(partId);if(!def)return'Unknown part.';
    if(def.tags.includes('root')){for(const q of def.developmentalPrerequisites)if(!d.ancestry.has(q)&&!d.ancestry.has(partId))return`Needs a ${q.replace(/-/g,' ')} in the family first.`;return null}
    if(def.tags.includes('exclusive')&&!d.unlocked?.has(partId)&&!d.ancestry.has(partId))return'Relic part: find the relic of a special creature.';
    for(const q of def.developmentalPrerequisites)if(!d.ancestry.has(q)&&!d.ancestry.has(partId))return`Needs a ${q.replace(/-/g,' ')} in the family first.`;
    if(!this.validFor(partId).length)return'This body has no socket for it. A bigger body has more.';
    return null;
  }
  trayParts(){
    const t=this.trayDef(),d=this.draft,rootId=d.plan.nodes.find(n=>!n.parent)?.partId;
    return Object.values(PARTS).filter(p=>t.type==='torso'?p.tags.includes('root'):!p.tags.includes('root')&&p.compatibleSocketTypes[0]===t.type).map(p=>{
      const on=t.type==='torso'?p.id===rootId:d.plan.nodes.some(n=>n.partId===p.id);
      return{id:p.id,name:PART_NAMES[p.id],cost:partCost(d,p.id),seen:partCost(d,p.id)<p.mutationCost,relic:p.tags.includes('exclusive'),on,locked:on?null:this.lockReason(p.id),text:PART_ABILITY_TEXT[p.id]||(p.legacy?{gain:ADAPTATIONS[p.legacy.adaptation]?.summary,cost:ADAPTATIONS[p.legacy.adaptation]?.tradeoff}:null)};
    });
  }

  // --- Pointer: drag from the tray onto a socket, or from a socket off the body ---
  stagePoint(e){const g=this.stageGeom();if(!g)return null;const r=g.cv.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return{inside:false};const px=(e.clientX-r.left)*g.cv.width/r.width,py=(e.clientY-r.top)*g.cv.height/r.height;return{inside:true,x:(px-g.cx)/g.S,y:(py-g.cy)/g.S}}
  nearest(list,pt,max=3.4){let best=null,bd=max;for(const a of list){const dd=Math.hypot(a.x-pt.x,a.y-pt.y);if(dd<bd){bd=dd;best=a}}return best}
  onBody(pt){const b=this.body(),{body}=genvoAnchors({animal:b,phenotype:phenotypeFor(b),pose:{dir:this.facing}});return Math.hypot((pt.x-body.x)/(body.w/2+1.5),(pt.y-body.y)/(body.h/2+1.5))<=1}
  pointerDown(e){
    if(e.button!==0)return;const tile=e.target.closest('.ed-tile');
    if(tile){this.confirming=false;if(tile.classList.contains('locked')){this.message=tile.dataset.why||'';this.renderCard();return}this.drag={partId:tile.dataset.part,x0:e.clientX,y0:e.clientY,moved:false,thumb:tile.querySelector('canvas')};this.listen();return}
    const pt=this.stagePoint(e);if(!pt?.inside)return;this.confirming=false;const anchors=this.anchors();
    if(this.selected&&PARTS[this.selected]?.tags.includes('root')&&this.onBody(pt)){const id=this.selected;this.selected=null;this.swapBody(id);return}if(this.selected){const a=this.nearest(this.validFor(this.selected,anchors),pt,this.hitRadius());if(a){const id=this.selected;this.selected=null;this.attach(id,a);return}}
    const occ=this.nearest(anchors.filter(a=>a.part),pt,this.hitRadius());
    if(occ){this.picked=occ.key;this.drag={fromKey:occ.key,partId:occ.part,x0:e.clientX,y0:e.clientY,moved:false};this.listen();this.drawStage();this.renderCard();return}
    this.picked=null;this.selected=null;this.render();
  }
  listen(){addEventListener('pointermove',this.onMove);addEventListener('pointerup',this.onUp)}
  unlisten(){removeEventListener('pointermove',this.onMove);removeEventListener('pointerup',this.onUp)}
  pointerMove(e){
    const g=this.drag;if(!g)return;if(!g.moved&&Math.hypot(e.clientX-g.x0,e.clientY-g.y0)>6){g.moved=true;this.showGhost(g)}
    if(!g.moved)return;this.ghost.style.left=`${e.clientX-42}px`;this.ghost.style.top=`${e.clientY-84}px`;
    const pt=this.stagePoint(e),prev=this.hoverKey;this.hoverKey=null;this.dropOff=false;
    if(g.fromKey){this.dropOff=!pt?.inside||!this.onBody(pt)}
    else if(pt?.inside){if(PARTS[g.partId]?.tags.includes('root'))this.hoverKey=this.onBody(pt)?'body':null;else this.hoverKey=this.nearest(this.validFor(g.partId),pt,this.hitRadius())?.key||null}
    if(prev!==this.hoverKey||g.fromKey)this.drawStage();
  }
  pointerUp(e){
    const g=this.drag;this.unlisten();this.drag=null;this.ghost.hidden=true;const hover=this.hoverKey;this.hoverKey=null;
    if(!g)return;
    if(!g.moved){if(g.fromKey){this.renderCard();return}this.selected=this.selected===g.partId?null:g.partId;this.picked=null;this.render();return}
    if(g.fromKey){const a=this.anchors().find(x=>x.key===g.fromKey);if(this.dropOff&&a){this.detach(a);return}this.drawStage();return}
    if(hover==='body'){this.swapBody(g.partId);return}
    if(hover){const a=this.anchors().find(x=>x.key===hover);if(a){this.attach(g.partId,a);return}}
    this.drawStage();
  }
  showGhost(g){const c=this.ghost.getContext('2d');c.clearRect(0,0,84,70);if(g.thumb)c.drawImage(g.thumb,0,0,84,70);else this.drawThumb(c,g.partId,84,70,true);this.ghost.hidden=false}
  stageHover(e){const pt=this.stagePoint(e);let key=null;if(pt?.inside){const list=this.selected?this.validFor(this.selected):this.anchors().filter(a=>a.part);key=this.nearest(list,pt,this.hitRadius())?.key||null}if(key!==this.hoverKey){this.hoverKey=key;this.drawStage();this.renderCard()}}

  action(act){
    const d=this.draft;if(!d)return;if(act!=='commit')this.confirming=false;
    if(act==='undo')undo(d);else if(act==='redo')redo(d);else if(act==='revert')revert(d);else if(act==='symmetry')this.symmetry=!this.symmetry;
    else if(act==='rotate')this.facing=(this.facing+1)%8;else if(act==='rotate-back')this.facing=(this.facing+7)%8;else if(act==='test')this.testing=!this.testing;else if(act==='compare')this.compare=!this.compare;
    else if(act==='remove'){const a=this.anchors().find(x=>x.key===this.picked);if(a){this.detach(a);return}}
    else if(act==='fit'){this.zoom=3;this.drawStage();const n=this.el.querySelector('.ed-zoom-n');if(n)n.textContent='100%';return}
    else if(act==='zoom-in'||act==='zoom-out'){this.setZoom(this.zoom+(act==='zoom-in'?1:-1));return}
    else if(act==='export-design'&&this.session?.exportDesign){const r=this.session.exportDesign(d);this.message=r.ok?'Creature design exported.':r.problems.join(' ');this.render();return}
    else if(act==='import-design'&&this.session?.importDesign){this.session.importDesign().then(r=>{if(!r||!this.open)return;if(r.ok){this.draft=r.draft;this.message='Creature design restored.'}else this.message=r.problems.join(' ');this.confirming=false;this.selected=null;this.render()});return}
    else if(act==='design-step'&&this.session?.advance){const r=this.session.advance(d);if(!r.ok)this.message=r.problems.join(' ');else{this.draft=r.draft;this.message='Precursor step recorded. This is design history, not a simulated generation.'}this.picked=null;this.render();return}
    else if(act==='cancel'){if(!this.session)this.sim.evolutionEditor.cancel();this.close();this.onDone({ok:false,cancelled:true});return}
    else if(act==='commit'){if(!this.confirming){this.confirming=true;this.selected=null;this.picked=null;this.hoverPart=null;this.render();return}const r=this.session?this.session.commit(d):this.sim.evolutionEditor.commit(d);if(!r.ok){this.message=r.problems.join(' ');this.render();return}this.close();this.onDone({ok:true,record:r.record});return}
    this.message='';this.picked=null;this.render();
  }
  handleKey(e){
    if(!this.open)return false;const k=e.code;if(e.repeat)return true;
    // v1.57.1 (creator direction 2026-10-10: the editor must not be skippable): Escape only drops the
    // part in hand; leaving without changes takes the explicit 'Keep the old body' button.
    if(k==='Escape'){if(this.selected||this.picked){this.selected=null;this.picked=null;this.render()}}
    else if(k==='Enter')this.action('commit');else if(k==='KeyZ')this.action('undo');else if(k==='KeyY')this.action('redo');else if(k==='KeyR')this.action(e.shiftKey?'rotate-back':'rotate');
    else if(k==='KeyT')this.action('test');else if(k==='KeyC')this.action('compare');else if(k==='KeyM')this.action('symmetry');else if(k==='Delete'||k==='Backspace')this.action('remove');
    else if(k==='ArrowDown'||k==='ArrowUp'||k==='Tab'){const i=TRAY.findIndex(t=>t.id===this.tray),n=(i+(k==='ArrowUp'?TRAY.length-1:1))%TRAY.length;this.tray=TRAY[n].id;this.selected=null;this.render()}
    return true; // the world does not take input while the editor is open
  }

  // --- Drawing ---
  render(){
    const d=this.draft;if(!d)return;const sim=this.sim,cost=draftCost(d),problems=draftProblems(d),left=d.budget-cost,t=this.trayDef(),parts=this.trayParts();
    const pips=Array.from({length:Number.isFinite(d.budget)?d.budget:0},(_,i)=>`<i class="${i<cost?'spent':''}"></i>`).join('')+(cost>d.budget?`<i class="over"></i>`.repeat(cost-d.budget):'');
    const tiles=parts.map(p=>`<button type="button" class="ed-tile ${p.on?'on':''} ${p.locked?'locked':''} ${this.selected===p.id?'selected':''} ${p.relic?'relic':''}" data-part="${p.id}" ${p.locked?`data-why="${esc(p.locked)}" aria-disabled="true"`:''} aria-label="${esc(p.name)}"><canvas width="84" height="70"></canvas><b>${esc(p.name)}</b><span class="ed-cost">${p.on?'on body':`${p.cost}`}</span>${p.seen&&!p.on?'<span class="ed-seen" title="Seen in the wild: 1 point cheaper">seen</span>':''}</button>`).join('');
    this.el.innerHTML=`<header class="ed-head"><div><small class="knowledge-kicker">CREATURE LAB · COMING GENERATION</small><h2>Shape generation ${sim.evolutionEditor.pending()?.generation||''}</h2><p>${this.selected?`Now click a glowing socket to attach the ${esc(PART_NAMES[this.selected]).toLowerCase()}.`:'Drag a part onto your creature. Drag a part off the body to remove it.'}</p></div>
        <div class="ed-dna" title="Evolution points"><span class="ed-dna-n ${left<0?'over':''}">${left}</span><span class="ed-dna-l">${left<0?`points over<br><small>budget ${d.budget}: undo or remove a red change</small>`:`points left<br><small>of ${d.budget}</small>`}</span><div class="ed-pips">${pips}</div></div></header>
      <div class="ed-main">
        <nav class="ed-drawers" role="tablist">${TRAY.map(x=>`<button type="button" role="tab" data-tray="${x.id}" aria-selected="${x.id===t.id}" class="${x.id===t.id?'active':''}">${x.label}</button>`).join('')}</nav>
        <div class="ed-tray"><p class="ed-hint">${esc(t.hint)}</p><div class="ed-tiles">${tiles}</div></div>
        <div class="ed-stage-wrap"><div class="ed-specimen-heading"><strong title="Body-plan preview uses the active parent’s inherited genes and pigments; offspring genes still recombine from both parents.">Coming generation</strong><button type="button" data-act="compare" aria-pressed="${this.compare}">Compare parent · C</button></div><canvas class="ed-stage" width="${STAGE_W}" height="${STAGE_H}" aria-label="Your creature: drop parts on the glowing sockets"></canvas>
          <div class="ed-stage-tools"><span class="ed-zoom"><button type="button" data-act="zoom-out" aria-label="Zoom out">&minus;</button><button type="button" data-act="fit">Fit</button><b class="ed-zoom-n">${Math.round(ZOOMS[this.zoom]*100)}%</b><button type="button" data-act="zoom-in" aria-label="Zoom in">+</button></span><button type="button" data-act="rotate-back" aria-label="Turn left">&#9664;</button><button type="button" data-act="test" class="${this.testing?'on':''}">${this.testing?'Stop':'Walk'}</button><button type="button" data-act="rotate" aria-label="Turn right">&#9654;</button><button type="button" data-act="symmetry" class="${this.symmetry?'on':''}" title="M">${this.symmetry?'Both sides':'One side'}</button></div></div>
        <aside class="ed-side"><figure class="ed-parent" ${this.compare?'':'hidden'}><canvas width="140" height="96" aria-label="Parent body comparison"></canvas><figcaption>Parent · before your changes</figcaption></figure><div class="ed-card"></div>${problems.length?`<ul class="ed-problems">${problems.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}${this.message?`<p class="ed-message">${esc(this.message)}</p>`:''}<div class="ed-stats"></div></aside>
      </div>
      <footer class="ed-actions"><button type="button" data-act="undo">Undo</button><button type="button" data-act="redo">Redo</button><button type="button" data-act="revert">Start over</button><span class="ed-gap"></span>${this.confirming?'<button type="button" data-act="edit">Keep editing</button>':''}<button type="button" data-act="cancel">Keep the old body</button><button type="button" data-act="commit" class="commit" ${problems.length?'disabled':''}>${this.confirming?'Confirm evolution':'Evolve'}</button></footer>`;
    this.el.querySelectorAll('.ed-tile').forEach(b=>{const c=b.querySelector('canvas').getContext('2d');if(c)this.drawThumb(c,b.dataset.part,84,70,!b.classList.contains('locked'))});
    this.renderCard();this.renderStats();this.drawStage();const parentCanvas=this.el.querySelector('.ed-parent canvas'),pc=parentCanvas.getContext('2d');pc.imageSmoothingEnabled=false;pc.translate(70,48);const parentBody=this.body(d.base);drawGenvoSprite(pc,{animal:parentBody,phenotype:phenotypeFor(parentBody),scale:4,frame:2,palette:creaturePalette(phenotypeFor(parentBody)),pose:{dir:this.facing}});
    if(this.session){
      this.el.querySelector('.knowledge-kicker').textContent=this.session.kicker;
      this.el.querySelector('h2').textContent=this.session.title;
      this.el.querySelector('.ed-head p').textContent=this.selected?`Choose a glowing socket for ${PART_NAMES[this.selected]}.`:this.session.description;
      this.el.querySelector('.ed-specimen-heading strong').textContent='Authored founder body';
      this.el.querySelector('.ed-specimen-heading strong').title='An introduced founder, not an evolved descendant of this world.';
      this.el.querySelector('.ed-parent figcaption').textContent='Previous design step';
      this.el.querySelector('.ed-stats h3').textContent='Compared with the previous design';
      this.el.querySelector('.ed-stats small').textContent='Shared adult body load and basal needs in relative game units. These values describe the authored founder.';
      const summary=this.el.querySelector('.ed-change-summary');if(summary?.textContent==='Current parts match the parent.')summary.textContent='Current parts match the recorded design.';
      this.el.querySelector('[data-act="compare"]').textContent='Compare design';
      this.el.querySelector('[data-act="cancel"]').textContent='Cancel custom start';
      this.el.querySelector('[data-act="commit"]').textContent=this.confirming?'Confirm founder pair':'Begin with this body';
      if(!Number.isFinite(d.budget)){this.el.querySelector('.ed-dna-n').textContent='∞';this.el.querySelector('.ed-dna-l').textContent='Sandbox anatomy';}
      if(this.session.advance){const button=document.createElement('button');button.type='button';button.dataset.act='design-step';button.textContent='Record precursor step';this.el.querySelector('.ed-actions').prepend(button);}
      for(const [action,label] of [['export-design','Export design'],['import-design','Import design']]){const button=document.createElement('button');button.type='button';button.dataset.act=action;button.textContent=label;this.el.querySelector('.ed-actions').prepend(button);}
    }
    if(this.selected&&!PARTS[this.selected]?.tags.includes('root')){
      const choices=document.createElement('div');choices.className='ed-mount-choices';choices.setAttribute('aria-label','Available attachment sites');
      for(const a of this.validFor(this.selected)){const button=document.createElement('button');button.type='button';button.dataset.mount=a.key;button.textContent=`Attach to ${socketName(a)}`;choices.append(button)}
      this.el.querySelector('.ed-stage-wrap').append(choices);
    }
  }
  // The info card: the hovered or picked part, or what the new body changes.
  renderCard(){
    const card=this.el.querySelector('.ed-card');if(!card)return;
    const pickedA=this.picked?this.anchors().find(a=>a.key===this.picked):null,hoverA=!this.drag&&this.hoverKey&&this.hoverKey!=='body'?this.anchors().find(a=>a.key===this.hoverKey):null;
    const id=this.hoverPart||pickedA?.part||(hoverA&&!this.selected?hoverA.part:null)||this.selected;
    if(this.confirming){const changes=mountedChanges(this.draft.base,this.draft.plan);card.innerHTML=`<h3>${this.session?'Confirm the authored body':'Confirm the coming body'}</h3><p>${draftCost(this.draft)} / ${this.draft.budget} mutation points</p><p>${this.session?'Two new founders enter this ecosystem with this body. Their introduced mass and reserves are recorded. Existing inhabitants and world history are preserved. These are not naturally evolved descendants.':'The living parent stays unchanged. This design applies only to the pending litter. Genes and pigments still inherit from both parents.'}</p><ul>${changes.map(c=>`<li>${esc(c.location)}: ${esc(PART_NAMES[c.before]||'empty')} → ${esc(PART_NAMES[c.after]||'removed')}</li>`).join('')||'<li>Keep the inherited body.</li>'}</ul>`;return}
    if(id!==this.cardSubject){this.cardSubject=id;this.el.querySelector('.ed-side').scrollTop=0}if(id){const text=PART_ABILITY_TEXT[id]||(PARTS[id]?.legacy?{gain:ADAPTATIONS[PARTS[id].legacy.adaptation]?.summary,cost:ADAPTATIONS[PARTS[id].legacy.adaptation]?.tradeoff}:{}),why=this.draft.plan.nodes.some(n=>n.partId===id)&&!this.hoverPart?null:this.lockReason(id);
      card.innerHTML=`<h3>${esc(PART_NAMES[id])}</h3>${text.gain?`<p class="gain"><b>What it enables</b><br>${esc(text.gain)}</p>`:''}${text.cost?`<p class="cost"><b>Tradeoff</b><br>${esc(text.cost)}</p>`:''}<p class="price">${partCost(this.draft,id)} point${partCost(this.draft,id)===1?'':'s'}</p>${why?`<p class="why">${esc(why)}</p>`:''}${this.partProjectionHTML(id,pickedA)}<details class="ed-part-biology knowledge-fold"><summary>Biology &amp; evolution path</summary><p>Fits ${esc(PARTS[id]?.compatibleSocketTypes.join(', '))}</p><p>Abilities: ${esc(PARTS[id]?.actionCapabilities.join(', ')||'structural support')}</p><p>${esc(PARTS[id]?.developmentalPrerequisites.length?'Inherited prerequisites: '+PARTS[id].developmentalPrerequisites.map(q=>PART_NAMES[q]).join(', '):'No inherited prerequisite')}</p><p>Related developments: ${esc(Object.values(PARTS).filter(p=>p.developmentalPrerequisites.includes(id)).map(p=>PART_NAMES[p.id]).join(', ')||'No direct prerequisite branches registered')}</p></details>${pickedA?`<button type="button" data-act="remove" class="ed-remove">Remove from the ${esc(socketName(pickedA))}</button>`:''}`;if(this.selected===id){const mounts=card.querySelector('.ed-mounts'),projection=card.querySelector('.ed-projection');if(mounts&&projection)projection.before(mounts)}return}
    const before=measure(previewBody(this.parent,this.draft.base)),now=measure(this.body()),gain=now.parts.filter(p=>partText(p)?.gain&&!before.parts.includes(p)),loss=before.parts.filter(p=>partText(p)&&!now.parts.includes(p)&&!PARTS[p]?.tags.includes('torso'));
    const items=[...gain.map(p=>`<li class="gain"><b>${esc(PART_NAMES[p])}</b> ${esc(partText(p).gain)}<small>${esc(partText(p).cost||'')}</small></li>`),...loss.map(p=>`<li class="loss">Loses <b>${esc(PART_NAMES[p])}</b></li>`)];
    const steps=this.costSteps(),spend=steps.length?`<h4>Points spent</h4><ol class="ed-spend">${steps.map(s=>`<li class="${s.over?'over':''}"><span>${esc(s.text)}</span><b>${s.cost>0?'-':s.cost<0?'+':''}${Math.abs(s.cost)}</b>${s.over?'<small>over budget</small>':''}</li>`).join('')}</ol>`:'';
    card.innerHTML=`<h3>What changes</h3>${items.length?`<ul>${items.join('')}</ul>`:steps.length?'':`<p class="quiet">${this.session?'The current body matches the previous design step.':'Nothing yet. The young will look and act like their parent.'}</p>`}${spend}`;
  }
  partProjectionHTML(id,picked){const mounts=this.validFor(id),a=mounts.find(m=>m.key===this.hoverKey)||mounts[0],projected=this.projection(id,a);if(!projected.ok||(!a&&!PARTS[id]?.tags.includes('root')))return '<p class="why">'+esc(this.lockReason(id)||'No compatible mount.')+'</p>';const before=measure(this.body()),after=measure(this.body(projected.plan)),changes=[['Body mass',before.mass,after.mass],['Movement',before.land,after.land],['Sprint',before.sprint,after.sprint],['Food upkeep',before.metabolism,after.metabolism],['Pounce reach',before.pounce,after.pounce],['Carry capacity',before.carry,after.carry],['Bite',before.strike,after.strike],['Water need',before.water,after.water],['Food value',before.food,after.food]];const effects=changes.filter(([,b,n])=>Math.abs(n-b)>.001).map(([label,b,n])=>`<li>${label} ${n>b?'↑':'↓'} ${b?Math.round((n/b-1)*100)+'%':n.toFixed(2)}</li>`).join('');const replaced=mountedChanges(this.draft.plan,projected.plan).filter(c=>c.before).map(c=>PART_NAMES[c.before]).join(', ');return `<div class="ed-projection"><b>Placement preview${a?' · '+esc(socketName(a)+' '+(a.socket.startsWith('limb.')?Number(a.socket.split('.')[1])+1:'')):''}</b><p>${replaced?'Replaces '+esc(replaced):'Adds to an empty mount'}<br>Change ${projected.cost>0?'+':''}${projected.cost} pts · total ${projected.total} / ${this.draft.budget}</p>${effects?'<ul>'+effects+'</ul>':'<p>No change in these measured traits.</p>'}${projected.problems.length?'<p class="why">'+esc(projected.problems.join(' '))+'</p>':''}</div>${this.selected===id&&mounts.length?`<div class="ed-mounts"><b>Choose a compatible mount</b><div>${mounts.map(m=>`<button type="button" data-mount="${esc(m.key)}" title="${esc(m.part?'Replaces '+PART_NAMES[m.part]:'Empty mount')}">${esc(socketName(m))} ${esc(m.socket.startsWith('limb.')?Number(m.socket.split('.')[1])+1:'')}<small>${esc(m.part?PART_NAMES[m.part]:'empty')}</small></button>`).join('')}</div></div>`:''}`}
  renderStats(){
    const box=this.el.querySelector('.ed-stats');if(!box)return;const now=measure(this.body()),before=measure(previewBody(this.parent,this.draft.base));
    const rows=[['legs','Body mass',now.mass,before.mass,'inv'],['legs','Legs',now.legs,before.legs,'n'],['speed','Speed',now.land,before.land],['sprint','Sprint',now.sprint,before.sprint],['bite','Bite',now.strike,before.strike],['tough','Toughness',1/now.damage,1/before.damage],['sight','Sight',now.sight,before.sight],['bite','Pounce reach',now.pounce,before.pounce,'n'],['food','Food upkeep',now.metabolism,before.metabolism,'inv'],['legs','Carry',now.carry,before.carry],['water','Water need',now.water,before.water,'inv'],['food','Food value',now.food,before.food]];
    box.innerHTML=`<h3>Compared with the parent</h3><small>Adult body load and basal needs; relative game units. Actual travel, climate and inherited offspring genes also affect costs.</small><p class="ed-change-summary">${JSON.stringify(this.draft.plan.nodes)===JSON.stringify(this.draft.base.nodes)?'Current parts match the parent.':`${this.draft.base.nodes.filter(b=>this.draft.plan.nodes.some(n=>n.parent===b.parent&&n.socket===b.socket&&n.partId===b.partId)).length} mounted parts unchanged · ${mountedChanges(this.draft.base,this.draft.plan).length} proposed edits.`}</p><details class="knowledge-fold" ${this.statsOpen?'open':''}><summary>Measured biological changes</summary>${rows.map(([icon,label,v,b,kind])=>{const diff=kind==='n'?v-b:(v/b-1)*100,good=kind==='inv'?diff<0:diff>0,txt=kind==='n'?`${v}${diff?` (${diff>0?'+':''}${diff})`:''}`:Math.abs(diff)<.5?'same':`${diff>0?'+':''}${Math.round(diff)}%`,fill=kind==='n'?Math.min(10,v/1.2):Math.max(0,Math.min(10,5+(v-1)*12));
      return`<div class="ed-stat ${Math.abs(diff)<.5?'':good?'up':'down'}"><img src="${iconURL(icon)}" alt=""><span>${label}</span><i style="--fill:${(fill*10).toFixed(0)}%"></i><em>${txt}</em></div>`}).join('')}</details>`;box.querySelector('details').ontoggle=e=>{this.statsOpen=e.target.open};
  }
  // Part tiles show the part alone (creator rule 2026-10-10: "part selection panels must display
  // isolated part art only; only the main preview shows the assembled creature"). v1.60.0: the art
  // is each part's own standalone drawing (isolatedPart), cropped and enlarged on a neutral plate.
  drawThumb(c,partId,w,h,usable){
    c.imageSmoothingEnabled=false;c.clearRect(0,0,w,h);const art=isolatedPart(partId);if(!art)return;
    const fit=Math.min(4,(w-8)/art.width,(h-8)/art.height),k=fit>=1?Math.floor(fit):fit,dw=art.width*k,dh=art.height*k;
    c.save();if(!usable)c.globalAlpha=.45;c.drawImage(art,Math.round((w-dw)/2),Math.round((h-dh)/2),dw,dh);c.restore();
  }
  drawStage(){
    const g=this.stageGeom();if(!g?.cv.getContext||!this.draft)return;const {cv,cx,cy,S}=g,c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    // A small patch of ground under a soft light: the creature stands in its world, not on a grid.
    c.fillStyle='#1c1610';c.fillRect(0,0,cv.width,cv.height);
    for(let r=9;r>=1;r--){c.fillStyle=`rgba(${70+r*4},${92+r*5},${52+r*2},${.05+.03*(10-r)})`;c.beginPath();c.ellipse(cx,cy+20,r*24,r*11,0,0,Math.PI*2);c.fill()}
    let h=7;for(let i=0;i<70;i++){h=(h*1103515245+12345)&0x7fffffff;const x=h%cv.width;h=(h*1103515245+12345)&0x7fffffff;const y=cy-40+(h%150);if(Math.hypot((x-cx)/220,(y-cy-20)/100)>1)continue;c.fillStyle=i%3?'#5d7a3f':'#7d9a52';c.fillRect(x-x%3,y-y%3,3,6);c.fillRect(x-x%3+3,y-y%3-3,3,3)}
    c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(cx,cy+44,96,20,0,0,Math.PI*2);c.fill();
    const b=this.body(),moving=this.testing,frame=moving?this.frame%8:2;
    c.save();c.translate(cx,cy);drawGenvoSprite(c,{animal:b,phenotype:phenotypeFor(b),scale:S,frame,moving,palette:creaturePalette(phenotypeFor(b)),pose:{dir:this.facing,action:moving?'walk':'idle',life:{breath:.5}}});c.restore();
    if(moving&&!this.selected&&!this.drag)return;
    // Sockets: glowing where the carried or chosen part fits; faint rings on parts you can grab.
    const anchors=this.anchors(),carrying=this.drag&&!this.drag.fromKey?this.drag.partId:this.selected,pulse=.55+.45*Math.sin(performance.now()/180);
    const ratio=cv.width/(cv.getBoundingClientRect().width||cv.width);const ring=(a,col,r,fill)=>{r=Math.max(r,18*ratio);const x=cx+a.x*S,y=cy+a.y*S;c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();if(fill){c.fillStyle=fill;c.beginPath();c.arc(x,y,r-4,0,Math.PI*2);c.fill()}};
    if(carrying&&!PARTS[carrying]?.tags.includes('root')){for(const a of this.validFor(carrying,anchors)){const hot=a.key===this.hoverKey;ring(a,hot?'#fff1a8':`rgba(240,208,96,${pulse})`,hot?15:11,hot?'rgba(255,236,150,.35)':null)}}
    else if(carrying&&this.hoverKey==='body'){c.strokeStyle='#fff1a8';c.lineWidth=3;c.setLineDash([6,6]);c.beginPath();c.ellipse(cx,cy,90,70,0,0,Math.PI*2);c.stroke();c.setLineDash([])}
    else for(const a of anchors){if(!a.part)continue;const hot=a.key===this.hoverKey||a.key===this.picked;if(hot)ring(a,a.key===this.picked?'#9fe6a0':'rgba(255,241,168,.85)',12,null)}
    if(this.drag?.fromKey&&this.dropOff){c.fillStyle='rgba(200,80,60,.85)';c.font='bold 15px Georgia, serif';c.textAlign='center';c.fillText('Let go to remove',cx,26)}
  }
  // v1.59.0: the walk preview runs on the display's frame rate with fractional animation frames (one
  // stride every 0.9 s), so it moves as smoothly as the game instead of stepping every 90 ms.
  startLoop(){this.stopLoop();if(typeof requestAnimationFrame!=='function'){this.timer=setInterval(()=>{if(this.open&&(this.testing||this.selected||this.drag))this.drawStage()},90);return}
    let lastPulse=0;const tick=t=>{if(!this.open){this.raf=null;return}if(this.testing){this.frame=(t/112.5)%8;this.drawStage()}else if((this.selected||this.drag)&&t-lastPulse>90){lastPulse=t;this.drawStage()}this.raf=requestAnimationFrame(tick)};this.raf=requestAnimationFrame(tick)}
  stopLoop(){if(this.timer)clearInterval(this.timer);this.timer=null;if(this.raf&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.raf);this.raf=null}
}
