import {carcassRule,CARCASS_RULES} from './carcass-rules.js';
import {diggingRule,DIGGING_RULES} from '../lineage/digging-rules.js';
import {rememberSeedTrace,updateSeedObservations,visibleSeedPatches,seedPatchTarget,seedPatchDescription,seedPatchAvailability,readSeedPatch} from './seed-observations.js';
import {canHunt} from '../ecology/functional-diet.js';
import {wildBranch,isWildSpecies,wildStartPlan,withRelicParts,SPECIAL_KINDS} from '../organisms/wild-bodies.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES,phenotypeFor} from '../organisms/species.js';
import {partEffectFactors,hasPart} from '../lineage/part-abilities.js';
import {FOUNDER_PLACEMENTS,founderPlan} from '../lineage/body-inheritance.js';
import {PARTS} from '../lineage/part-registry.js';
import {FRESHWATER_FOOD} from '../ecology/freshwater-food.js';
import {REFUGE_PARITY,armoured} from '../ecology/refuges.js';
import {bodyMass} from '../organisms/body-mass.js';

// Phase G first slice (GDD v1 section 14, creator decision 2026-10-09): places to discover, a field
// guide and optional trials, so there is meaningful self-directed play before the first litter.
// Places are generated from the world seed (no simulation RNG), sit on suitable habitat, and each
// rewards a kind of body. Discovery teaches, it never grants genes: parts seen on wild GenVos cost
// 1 MP less in the editor. Trials add to the existing capped earned mutation bonus.

export const SITE_KINDS=Object.freeze({
  'root-mound':{label:'Root mound',count:6,blurb:'A deep root store. Digging forelimbs dig here for a large meal, several times.'},
  'pod-grove':{label:'Pod grove',count:6,blurb:'Rich seed pods: everything eaten here is more filling, and beaks do best.'},
  'still-pool':{label:'Still pool',count:6,blurb:'Calm water with food in it. Drinking here also feeds you; filter mouths feed twice as well.'},
  'hollow-log':{label:'Hollow log',count:8,blurb:'A ready den. Press V to hide inside, with no need for cover or camouflage.'},
  'thorn-brake':{label:'Thorn brake',count:5,blurb:'A thorny refuge Stalkers will not follow you into. Soft bodies get scratched; armored and spined bodies pass freely.'},
  'lookout':{label:'Lookout rock',count:5,blurb:'High ground. Standing here reveals nearby places and every Stalker in sight for a while; better eyes see farther.'},
  'nest-ruin':{label:'Nest ruin',count:6,blurb:'An old nest. Press E to gather material for building or repairing a home; graspers and prehensile tails carry more.'},
  'relic':{label:'Relic',count:0,blurb:'What a special creature left behind. Press E to take it: it unlocks a relic part in the editor.'},
  'carcass':{label:'Carcass',count:0,blurb:'A large carcass: a big meal for anyone, better for meat-eating mouths, but it draws Stalkers.'}
});
export const TRIALS=Object.freeze({
  outrun:{label:'Outrun a Stalker',text:'Escape a hunting Stalker without being caught.'},
  eat4:{label:'Eat four kinds of food',text:'Eat four different kinds of food.'},
  lookout:{label:'Reach a lookout',text:'Stand on a lookout rock.'},
  discover3:{label:'Discover three places',text:'Find three places in the world.'},
  raise:{label:'Raise a pup to adulthood',text:'See one of your young grow up.'},
  spot5:{label:'Spot five wild body parts',text:'See five body parts on wild creatures that your founder did not have.'}
});
const FOUNDER_PARTS=new Set(FOUNDER_PLACEMENTS.map(p=>p.partId));
const ARMORED=['armor-plate','spine-cluster','spined-tail','spine-ridge','reinforced-torso','dome-torso','shell-back','armored-hide'];
const MEAT_MOUTHS=new Set(['tearing-jaw','crushing-jaw','gape-mouth','sucker-mouth']);
const ESCAPES=new Set(['escaped','outrun','lost','evaded']);
const hash=(a,b,c)=>{let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(c|0,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};

export class DiscoveryController{
  constructor(sim){this.sim=sim;this.unlockedParts=[];this.elderDay=0;this.sites=[];this.found=[];this.seenParts=[];this.seenSpecies=[];this.foodKinds=[];this.trials={};this.notices=[];this.revealUntil=0;this.nextSiteId=1;this.generated=false;this.lastCarcassDay=0;this.lastOutcomeTick=-1;this.traces=[];this.nextTraceId=1;this.traceAnchors=new Map();this.traceStudies=[];this.following=null;this.nextFollowId=1;this.seedObservations=[]}

  visibleSeedPatches(a){return visibleSeedPatches(this,a)}
  seedPatchTarget(o){return seedPatchTarget(o)}
  seedPatchAvailability(a,id){return seedPatchAvailability(this,a,id)}
  readSeedPatch(a,id){return readSeedPatch(this,a,id)}
  pickSeedPatchAt(a,x,y){return this.visibleSeedPatches(a).find(o=>Math.hypot(o.x-x,o.y-y)<.25)||null}
  traceCapabilities(a){const caps=new Set((a?.bodyPlan?.nodes||[]).flatMap(n=>PARTS[n.partId]?.actionCapabilities||[]));return{read:caps.has('see')||caps.has('see-wide'),track:caps.has('track')}}
  traceLifetime(t){return CFG.dayTicks*((t.type==='feed'||t.type==='seed')?6:t.medium==='water'?1:4)}
  activeTraces(){return(this.traces||[]).filter(t=>this.sim.tickCount>=t.tick&&this.sim.tickCount-t.tick<this.traceLifetime(t))}
  visibleTraces(a=this.sim.player()){
    if(!a?.alive||!this.traceCapabilities(a).read)return[];const cap=this.traceCapabilities(a),range=(cap.track?8:4)*(partEffectFactors(a)?.threatSense||1)*(a.genes?.senses||1);
    return this.activeTraces().filter(t=>Math.hypot(t.x-a.x,t.y-a.y)<=range&&(cap.track||this.sim.tickCount-t.tick<this.traceLifetime(t)*.7)).sort((p,q)=>q.tick-p.tick||q.id-p.id).slice(0,96);
  }
  traceById(id){return this.activeTraces().find(t=>t.id===id)||null}
  traceTarget(t){return{kind:'trace',id:t.id,x:t.x,y:t.y,label:t.type==='seed'?'Deposited seeds · '+(PLANTS[t.food]?.label||t.food):t.type==='feed'?'Feeding marks · '+(PLANTS[t.food]?.label||FRESHWATER_FOOD[t.food]?.label||t.food):t.medium==='water'?'Disturbed water':'Animal tracks'}}
  addTrace(a,type,x,y,food=null){
    this.traces||=[];this.nextTraceId||=1;
    const medium=this.sim.world.water[this.sim.world.idx(x,y)]?'water':'land',limbs=(a.bodyPlan?.nodes||[]).filter(n=>PARTS[n.partId]?.compatibleSocketTypes.includes('limb'));
    const trace={id:this.nextTraceId++,ownerId:a.id,type,x,y,food,dir:a.dir&7,tick:this.sim.tickCount,medium,limbs:limbs.length,mass:bodyMass(a)};
    this.traces.push(trace);if(this.traces.length>2048)this.traces.splice(0,this.traces.length-2048);return trace;
  }
  noteMovementTrace(a){
    if(!a?.alive)return null;this.traceAnchors||=new Map();const old=this.traceAnchors.get(a.id);
    if(old&&Math.hypot(a.x-old.x,a.y-old.y)<.65)return null;
    this.traceAnchors.set(a.id,{x:a.x,y:a.y});return this.addTrace(a,'step',a.x,a.y);
  }
  noteFeedingTrace(a,food,{x=a?.x,y=a?.y}={}){
    if(!a?.alive||(!PLANTS[food]&&!FRESHWATER_FOOD[food]&&food!=='carrion'))return null;
    const recent=(this.traces||[]).find(t=>t.type==='feed'&&t.ownerId===a.id&&t.food===food&&Math.hypot(t.x-x,t.y-y)<.5&&this.sim.tickCount-t.tick<CFG.simHz*2);
    if(recent)return recent;return this.addTrace(a,'feed',x,y,food);
  }
  pruneTraces(){
    this.traces=this.activeTraces();if(this.sim.tickCount%CFG.dayTicks===0&&this.traceAnchors){const alive=new Set(this.sim.animals.filter(a=>a.alive).map(a=>a.id));for(const id of this.traceAnchors.keys())if(!alive.has(id))this.traceAnchors.delete(id)}
    if(this.following&&(!this.sim.player()?.alive||this.following.actorId!==this.sim.playerId||!this.traceCapabilities(this.sim.player()).track))this.cancelTraceFollow();
  }
  pickTraceAt(a,x,y){return this.visibleTraces(a).filter(t=>(t.ownerId!==a.id||t.type==='seed')&&Math.hypot(t.x-x,t.y-y)<.22).sort((p,q)=>(p.type==='feed'?-1:0)-(q.type==='feed'?-1:0)||(p.type==='feed'&&q.type==='feed'?q.id-p.id:0)||Math.hypot(p.x-x,p.y-y)-Math.hypot(q.x-x,q.y-y)||q.id-p.id)[0]||null}
  traceDescription(t,a=this.sim.player()){
    if(!t)return'The marks have faded.';const age=this.sim.tickCount-t.tick,fresh=age<CFG.dayTicks?'Fresh':'Fading';
    if(t.type==='seed'){const o=this.seedObservations?.find(o=>o.id===t.id);return o?seedPatchDescription(o):fresh+' deposited seeds · '+(PLANTS[t.food]?.label||t.food)+'. Read these marks to remember the patch. Growth needs suitable conditions.'}
    if(t.type==='feed')return fresh+' feeding marks · '+(PLANTS[t.food]?.label||FRESHWATER_FOOD[t.food]?.label||t.food)+'. Study them to investigate this patch.';
    return fresh+' '+(t.medium==='water'?'water disturbance':t.limbs?'paired impressions':'body drag')+' · heading '+['north','north-east','east','south-east','south','south-west','west','north-west'][t.dir]+'. The animal may already have left.';
  }
  nextTrace(a,t){return this.visibleTraces(a).filter(n=>n.ownerId===t.ownerId&&n.id>t.id&&Math.hypot(n.x-t.x,n.y-t.y)<=2.4).sort((p,q)=>p.id-q.id)[0]||null}
  traceAvailability(a,id,{follow=false}={}){
    const fail=reason=>({enabled:false,state:'unavailable',reason});if(!a?.alive)return fail('No living creature to investigate.');if(this.sim.paused)return fail('Resume the world first.');
    const t=this.traceById(id);if(!t)return fail('Those marks have faded.');const caps=this.traceCapabilities(a);if(!caps.read)return fail('A sensing organ capable of reading surface marks is required.');
    if(!this.visibleTraces(a).some(v=>v.id===id))return fail('These marks are too faint or beyond your sensory reach.');
    if(follow&&!caps.track)return fail('Tracking anatomy is required to follow a trail.');if(follow&&t.ownerId===a.id)return fail('These are your own marks.');
    if(follow&&!this.nextTrace(a,t))return fail('No newer visible marks continue this trail.');
    if(Math.hypot(t.x-a.x,t.y-a.y)>1.35)return{enabled:false,state:'approachable',reason:'Approach the marks to read them.'};
    return{enabled:true,state:'available',reason:follow?'Follow successive visible marks; movement still costs energy.':this.traceDescription(t,a)};
  }
  studyTrace(a,id){
    const status=this.traceAvailability(a,id);if(!status.enabled)return{ok:false,type:'trace-study',message:status.reason};const t=this.traceById(id);let learned=false;rememberSeedTrace(this,a,t);
    if(t.type==='feed'&&this.sim.foraging.foodPreference(a,t.food)>0&&t.food!=='carrion'){const patch=this.sim.foraging.rememberPatch(a,t.food,t.x,t.y,{meal:false});learned=!!patch}
    this.traceStudies||=[];const key=t.ownerId+':'+t.type+':'+(t.food||'')+':'+Math.floor(t.x)+':'+Math.floor(t.y);
    if(!this.traceStudies.some(v=>v.key===key)){this.traceStudies.push({key,tick:this.sim.tickCount,food:t.food,x:t.x,y:t.y});if(this.traceStudies.length>32)this.traceStudies.shift();this.sim.cognition.recordOnce(a,'trail-study:'+key,this.traceDescription(t,a),{x:t.x,y:t.y,food:t.food})}
    this.sim.lastPlayerAction={type:'trace-study',actorId:a.id,tick:this.sim.tickCount,x:t.x,y:t.y,traceId:t.id};
    return{ok:true,type:'trace-study',message:this.traceDescription(t,a)+(learned?' Compatible food patch remembered.':t.type==='feed'&&this.sim.foraging.foodPreference(a,t.food)<=0?' Your current mouth cannot use that food.':'')};
  }
  startTraceFollow(a,id){const status=this.traceAvailability(a,id,{follow:true});if(!status.enabled)return{ok:false,type:'trace-follow',message:status.reason};this.nextFollowId||=1;this.following={id:this.nextFollowId++,actorId:a.id,ownerId:this.traceById(id).ownerId,lastTraceId:id,legs:0};return this.advanceTraceFollow(a,this.following.id)}
  advanceTraceFollow(a,sessionId){
    const session=this.following;if(!session||session.id!==sessionId||session.actorId!==a?.id||this.sim.playerId!==a.id)return{ok:false,type:'trace-follow',message:'Trail following ended.'};
    const status=this.traceAvailability(a,session.lastTraceId);if(!status.enabled){this.cancelTraceFollow();return{ok:false,type:'trace-follow',message:status.reason}}
    if(!this.traceCapabilities(a).track){this.cancelTraceFollow();return{ok:false,type:'trace-follow',message:'Tracking anatomy is no longer available.'}}
    const next=this.nextTrace(a,this.traceById(session.lastTraceId));if(!next||!this.sim.canOccupy(a,next.x,next.y)){this.cancelTraceFollow();return{ok:true,type:'trace-end',message:next?'The trail crosses terrain this body cannot enter.':'The visible trail ends here. Look around for its source.'}}
    session.lastTraceId=next.id;return{ok:true,type:'trace-follow',quiet:session.legs++>0,sessionId,target:this.traceTarget(next),message:'Following the next visible marks.'};
  }
  cancelTraceFollow(){this.following=null}

  // --- Places ---
  ensureSites(){
    if(this.generated)return;const p=this.sim.player();if(!p&&this.sim.playerEnabled)return;this.generated=true;
    const w=this.sim.world,n=CFG.worldSize,seed=(w.seedHash>>>0)||1,taken=[];
    const land=(x,y)=>x>2&&y>2&&x<n-3&&y<n-3&&!w.water[w.idx(x,y)];
    const nearWater=(x,y)=>{for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(w.water[w.idx(x+dx,y+dy)])return true;return false};
    const score={
      'root-mound':(x,y,i)=>w.fertility[i]>.45&&!nearWater(x,y)?w.fertility[i]:-1,
      'pod-grove':(x,y,i)=>(w.plants.thistlepod?.[i]||0)+w.fertility[i]*.3,
      'still-pool':(x,y,i)=>nearWater(x,y)?.5+w.moisture[i]:-1,
      'hollow-log':(x,y,i)=>(w.plants.bramble?.[i]||0)+w.moisture[i]*.2,
      'thorn-brake':(x,y,i)=>(w.plants.bramble?.[i]||0)*1.2+(1-w.moisture[i])*.1,
      'lookout':(x,y,i)=>w.moisture[i]<.45&&!nearWater(x,y)?1-w.moisture[i]:-1,
      'nest-ruin':(x,y,i)=>.5+(w.fertility[i]-.5)*.2
    };
    // Each kind: one site near the start (so the first minutes have places to find), the rest spread out.
    for(const [kind,def] of Object.entries(SITE_KINDS)){if(!def.count)continue;
      const k=Object.keys(SITE_KINDS).indexOf(kind)+1;
      for(let s=0;s<def.count;s++){
        const near=s===0&&p,cx=near?p.x:n/2,cy=near?p.y:n/2,spread=near?24:n/2;let best=null,bestScore=-Infinity;
        for(let t=0;t<260;t++){const x=Math.floor(cx+(hash(seed,k*997+s,t)*2-1)*spread),y=Math.floor(cy+(hash(seed,k*991+s,t+7919)*2-1)*spread);if(!land(x,y))continue;
          if(near&&Math.hypot(x-p.x,y-p.y)<6)continue;if(taken.some(o=>Math.hypot(o.x-x,o.y-y)<(o.kind===kind?12:4)))continue;
          // Only still pools sit at the water's edge, so E and V do the place's action rather than drinking.
          if(kind!=='still-pool'&&(nearWater(x,y)||w.isDrinkable?.(x+.5,y+.5)))continue;
          const sc=score[kind](x,y,w.idx(x,y));if(sc>bestScore){bestScore=sc;best={x,y}}}
        if(best&&bestScore>=0){const site={id:this.nextSiteId++,kind,x:best.x+.5,y:best.y+.5,stock:kind==='root-mound'?5:kind==='nest-ruin'?3:0,restockDay:0};this.sites.push(site);taken.push(site)}
      }
    }
  }
  siteAt(animal,kind,radius=1.3){if(!animal)return null;for(const s of this.sites)if(s.kind===kind&&!s.gone&&Math.hypot(s.x-animal.x,s.y-animal.y)<=radius)return s;return null}
  isFound(site){return this.found.includes(site.id)}
  discover(site,how='found'){if(!site||this.isFound(site))return false;this.found.push(site.id);this.notice(`Discovered: ${SITE_KINDS[site.kind].label} · ${this.description(site.kind)}`,'success');this.sim.evolutionBudget?.note?.('discovery');return true}

  // --- Field guide ---
  noteCreatureAppearance(animal){
    if(!animal?.bodyPlan)return;
    this.observedBodies||=[];
    if(this.observedBodies.some(v=>v.bodyPlan.id===animal.bodyPlan.id))return;
    // Save the actual observed anatomy, inherited genes and visible proportions.
    // A later mutation cannot silently rewrite this journal entry.
    const name=this.sim.speciation?.identityFor?.(animal)?.label||animal.speciesBranch?.label||`Observed creature ${animal.id}`;
    this.observedBodies.push({id:animal.id,species:animal.species,name,bodyPlan:structuredClone(animal.bodyPlan),genes:{...animal.genes},adaptations:[...(animal.adaptations||[])],anatomy:{...animal.anatomy},phenotype:phenotypeFor(animal),day:this.sim.day});
    if(this.observedBodies.length>256)this.observedBodies.shift();
  }
  seeParts(animal){
    this.noteCreatureAppearance(animal);
    // One notice per creature, however many new parts it shows (v1.54.0).
    const plain=[],relics=[];for(const n of animal.bodyPlan?.nodes||[]){if(!this.seenParts.includes(n.partId)){this.seenParts.push(n.partId);if(!FOUNDER_PARTS.has(n.partId))(PARTS[n.partId]?.tags.includes('exclusive')?relics:plain).push(n.partId.replace(/-/g,' '))}}
    const list=w=>w.length<2?w[0]:w.slice(0,-1).join(', ')+' and '+w.at(-1),an=w=>/^[aeiou]/.test(w)?'an':'a',fresh=plain.length+relics.length;
    if(plain.length)this.notice(`Field guide: spotted ${an(plain[0])} ${list(plain)} on a wild creature · ${plain.length>1?'each now costs':'now costs'} 1 point less to evolve`,'safe');
    if(relics.length)this.notice(`Field guide: spotted ${an(relics[0])} ${list(relics)} · relic part${relics.length>1?'s':''}: find the relic to unlock`,'safe');
    return fresh;
  }
  wildPartsSeen(){return this.seenParts.filter(id=>!FOUNDER_PARTS.has(id)).length}
  known(){return new Set(this.seenParts)}

  // --- Trials ---
  complete(id){if(this.trials[id])return false;this.trials[id]={day:this.sim.day,year:this.sim.year};this.notice(`Trial complete: ${TRIALS[id].label} · counts toward bonus mutation points`,'success');this.sim.evolutionBudget?.note?.('trial');return true}

  notice(text,tone='safe'){this.notices.push({text,tone});if(this.notices.length>6)this.notices.shift()}
  takeNotice(){return this.notices.shift()||null}

  // --- Effects used by other systems ---
  description(kind){if(kind==='carcass'&&carcassRule(this.sim)===CARCASS_RULES.finite)return 'Remains of an organism. Meals use the food actually left here; nearby Stalkers may investigate.';return kind==='root-mound'&&diggingRule(this.sim)===DIGGING_RULES.finite?'Look for existing root or bulb food here. Depleted plants must grow before another meal.':SITE_KINDS[kind]?.blurb||''}
  foodBonus(animal,kind){
    if(!animal?.player&&!animal?.lineage)return 1;
    if(kind==='thistlepod'&&this.siteAt(animal,'pod-grove',2.2))return 1.3;
    if(kind==='carrion'&&this.siteAt(animal,'carcass',2.4)){const m=partEffectFactors(animal)?.mouth;return MEAT_MOUTHS.has(m)?1.3:1}
    return 1;
  }
  poolBonus(animal){if(!this.siteAt(animal,'still-pool',2.2))return 0;return partEffectFactors(animal)?.mouth==='filter-mouth'?16:8}
  mound(animal,{restock=true}={}){if(diggingRule(this.sim)===DIGGING_RULES.finite){const site=this.siteAt(animal,'root-mound',1.6);return site&&this.sim.partAbilities.rootMealAt(animal)?site:null;}const site=this.siteAt(animal,'root-mound',1.6);if(!site)return null;const due=site.stock<=0&&this.sim.day-(site.restockDay||0)>=10;if(due&&restock)site.stock=5;return site.stock>0||due?site:null}
  useMound(site){if(diggingRule(this.sim)===DIGGING_RULES.finite){const n=site.finiteHarvests??0;if(!Number.isSafeInteger(n)||n<0||n>=Number.MAX_SAFE_INTEGER)throw Error('Invalid finite mound visit count.');site.finiteHarvests=n+1;site.lastFiniteHarvestDay=this.sim.day;return;}site.stock--;if(site.stock<=0)site.restockDay=this.sim.day}
  logAt(animal){return !!this.siteAt(animal,'hollow-log',1.2)}
  refugeFor(animal){return !!(animal&&this.siteAt(animal,'thorn-brake',1.8))}
  armored(animal){return ARMORED.some(id=>hasPart(animal,id))||(animal?.adaptations||[]).includes('hardened-mantle')}
  collectionAvailability(animal,siteId){
    const site=this.sites.find(s=>s.id===siteId&&!s.gone);if(!animal?.alive||!site)return{enabled:false,state:'unavailable',reason:'That item is no longer here.'};
    if(!['relic','nest-ruin'].includes(site.kind))return{enabled:false,state:'unavailable',reason:'This object can be inspected, not collected.'};
    if(site.kind==='nest-ruin'&&site.stock<=0&&this.sim.day-(site.restockDay||0)<12)return{enabled:false,state:'unavailable',reason:'This nest ruin is picked clean for now.'};
    if(Math.hypot(site.x-animal.x,site.y-animal.y)>1.4)return{enabled:false,state:'approachable',reason:'Approach this item first.'};
    return{enabled:true,state:'available',reason:site.kind==='relic'?'Collect this relic.':'Collect nest material.'};
  }
  collectNest(animal,siteId=null){
    const s=siteId===null?this.siteAt(animal,'nest-ruin',1.4):this.collectionAvailability(animal,siteId).enabled?this.sites.find(s=>s.id===siteId&&s.kind==='nest-ruin'):null;if(!s)return null;if(s.stock<=0&&this.sim.day-(s.restockDay||0)>=12)s.stock=3;
    if(s.stock<=0)return{ok:false,type:'nest',message:'The nest ruin is picked clean for now.'};
    const carry=(hasPart(animal,'grasper')||hasPart(animal,'prehensile-tail'))?1.5:1;s.stock--;if(s.stock<=0)s.restockDay=this.sim.day;
    animal.nestMaterial=Math.min(3,(animal.nestMaterial||0)+carry);return{ok:true,type:'nest',message:`Gathered nest material · enough for ${animal.nestMaterial>=1.15?'a new home':'a repair'} (N to build)`};
  }
  // Carried nest material counts as building material at the carrier's position.
  carriedAt(x,y){const p=this.sim.player();return p&&p.nestMaterial>0&&Math.hypot(p.x-x,p.y-y)<=.6?p.nestMaterial:0}
  takeCarried(x,y,amount){const p=this.sim.player();if(!p||!(p.nestMaterial>0)||Math.hypot(p.x-x,p.y-y)>.6)return 0;const t=Math.min(amount,p.nestMaterial);p.nestMaterial-=t;return t}

  // --- Special creatures and relics ---
  // Each special kind (SPECIAL_KINDS) appears from its first day, checked every so many days: when
  // none of that kind is alive, the oldest adult of its species (never the player's family) becomes
  // one and visibly takes on its relic parts. A Ghost GenVo fades away after a while, leaving its relic.
  maybeElder(){
    const now=this.sim.day;this.specialDays||={};
    for(const a of this.specials()){const fades=SPECIAL_KINDS[a.elder.kind]?.fades;if(fades&&now-(a.elder.since??now)>=fades)this.sim.kill(a,'faded')}
    for(const [kind,spec] of Object.entries(SPECIAL_KINDS)){
      const last=this.specialDays[kind]??(kind==='elder-stalker'?this.elderDay:0);
      if(now<spec.first||(last&&now-last<spec.every))continue;this.specialDays[kind]=now;if(kind==='elder-stalker')this.elderDay=now;
      if(this.sim.animals.some(a=>a.alive&&a.elder?.kind===kind))continue;
      const s=this.sim.animals.filter(a=>a.alive&&a.species===spec.species&&!a.player&&!a.lineage&&!a.elder&&a.age>=(SPECIES[spec.species]?.maturity||0)).sort((a,b)=>b.age-a.age||a.id-b.id)[0];if(!s)continue;
      s.elder={kind,label:spec.label,parts:[...spec.parts],since:now};s.bodyPlan=withRelicParts(s.bodyPlan||wildStartPlan(spec.species)||founderPlan(),spec.parts);
      if(spec.health)s.health=Math.max(s.health,spec.health);this.notice(spec.arrival+this.compass(s),'warn');
    }
  }
  specials(){return this.sim.animals.filter(a=>a.alive&&a.elder)}
  // Where a creature is from the active creature, in words.
  compass(a){const p=this.sim.player();if(!p?.alive)return'';const dx=a.x-p.x,dy=a.y-p.y;if(Math.hypot(dx,dy)<6)return' It is close by.';const i=Math.round(Math.atan2(dy,dx)/(Math.PI/4)+8)%8;return` Last seen to the ${['east','south-east','south','south-west','west','north-west','north','north-east'][i]}.`}
  // Called when any animal dies: a special creature drops its relic where it fell.
  onDeath(a){if(!a?.elder)return;this.sites.push({id:this.nextSiteId++,kind:'relic',x:a.x,y:a.y,parts:[...a.elder.parts],from:a.elder.label,day:this.sim.day});this.notice(`The ${a.elder.label} has fallen and left a relic.`,'success')}
  collectRelic(animal,siteId=null){
    const s=siteId===null?this.siteAt(animal,'relic',1.4):this.collectionAvailability(animal,siteId).enabled?this.sites.find(s=>s.id===siteId&&s.kind==='relic'):null;if(!s)return null;s.gone=true;const fresh=s.parts.filter(id=>!this.unlockedParts.includes(id));this.unlockedParts.push(...fresh);this.discover(s);
    const names=s.parts.map(id=>id.replace(/-/g,' ')).join(' and ');return{ok:true,type:'relic',message:fresh.length?`Relic of the ${s.from} · you can now evolve a ${names} in the editor.`:`Relic of the ${s.from} · already known.`};
  }

  // --- Per tick ---
  tick(){
    this.pruneTraces();updateSeedObservations(this);
    if(!this.traceHintShown){const p=this.sim.player();if(p&&this.visibleTraces(p).some(t=>t.ownerId!==p.id&&Math.hypot(t.x-p.x,t.y-p.y)<2.2)){this.traceHintShown=true;this.notice('Marks nearby · click them to investigate. Tracking organs can follow a trail.','safe')}}
    if(!this.sim.playerEnabled)return;this.ensureSites();const t=this.sim.tickCount;
    // Outcomes are read every tick so a short escape is never missed.
    const out=this.sim.lastPlayerPredatorOutcome;if(out&&out.tick!==this.lastOutcomeTick){this.lastOutcomeTick=out.tick;if(ESCAPES.has(out.outcome))this.complete('outrun')}
    const act=this.sim.lastPlayerAction;if(act?.type==='eat'&&act.kind&&!this.foodKinds.includes(act.kind)){this.foodKinds.push(act.kind);if(this.foodKinds.length>=4)this.complete('eat4')}
    if(t%CFG.simHz!==0)return;
    if(t%(CFG.simHz*CFG.dayTicks)===0)this.maybeElder();
    const p=this.sim.player();if(!p?.alive)return;const pf=partEffectFactors(p),sight=pf?.threatSense??1;
    // Places within sight are found; the lookout reveals the area.
    for(const s of this.sites){if(s.gone)continue;const d=Math.hypot(s.x-p.x,s.y-p.y);if(d<=4*sight)this.discover(s)}
    const look=this.siteAt(p,'lookout',1.3);if(look){this.revealUntil=t+CFG.simHz*20;this.complete('lookout');for(const s of this.sites)if(!s.gone&&Math.hypot(s.x-p.x,s.y-p.y)<=22*sight)this.discover(s)}
    if(this.found.length>=3)this.complete('discover3');
    if((this.sim.evolutionBudget?.matured?.length||0)>0)this.complete('raise');
    // Field guide: species and wild GenVo bodies seen nearby.
    if(t%(CFG.simHz*2)===0){const r=8*sight;for(const a of this.sim.animals){if(!a.alive||a.id===p.id||Math.hypot(a.x-p.x,a.y-p.y)>r)continue;this.noteCreatureAppearance(a);if(!this.seenSpecies.includes(a.species))this.seenSpecies.push(a.species);if(isWildSpecies(a.species)&&a.bodyPlan){const br=wildBranch(a);this.seenBranches||=[];if(br.id!=='common'&&!this.seenBranches.includes(br.id)){this.seenBranches.push(br.id);this.notice(`Field guide: a ${br.label} · its body has evolved`,'warn')}}if((a.species==='genvo'&&!a.lineage)||isWildSpecies(a.species))this.seeParts(a)}if(this.wildPartsSeen()>=5)this.complete('spot5')}
    // Thorn brakes scratch any soft-bodied occupant (Phase 3I refuges; previously only family GenVo).
    for(const a of this.sim.animals){if(!a.alive||!REFUGE_PARITY.enabled&&(!a.lineage||a.species!=='genvo'))continue;if(this.siteAt(a,'thorn-brake',1.8)&&!(REFUGE_PARITY.enabled?armoured(this.sim,a):this.armored(a)))a.health=Math.max(1,a.health-.5)}
    // Discovery marks nearby carrion under current rules; historical saves retain their original event.
    const carcass=this.sites.find(s=>s.kind==='carcass'&&!s.gone);
    if(carcass){const i=this.sim.world.idx(carcass.x,carcass.y);if((this.sim.world.carrion[i]||0)<.1)carcass.gone=true;
      else if(!carcass.lured&&Math.hypot(carcass.x-p.x,carcass.y-p.y)<=3&&!this.sim.isOpeningProtected?.(p)){let best=null,bd=18;for(const h of this.sim.animals){if(!h.alive||!canHunt(h)||h.playerHunt)continue;const d=Math.hypot(h.x-p.x,h.y-p.y);if(d<bd){bd=d;best=h}}if(best){carcass.lured=true;this.sim.predator.beginStalk(best,p,bd);best.intent='stalk-player';best.target=p;this.notice('The carcass has drawn a Stalker.','warn')}}}
    else if(this.sim.day-this.lastCarcassDay>=12&&this.sim.day>=6){this.spawnCarcass(p)}
  }
 discoverExistingCarcass(p){
  const w=this.sim.world;this.lastCarcassDay=this.sim.day;
  let best=null;
  for(let y=Math.max(2,Math.floor(p.y-22));y<=Math.min(w.n-3,Math.floor(p.y+22));y++)for(let x=Math.max(2,Math.floor(p.x-22));x<=Math.min(w.n-3,Math.floor(p.x+22));x++){
   const i=w.idx(x,y),distance=Math.hypot(x+.5-p.x,y+.5-p.y);
   if(distance>22||w.water[i]||!(w.carrion[i]>=.1)||this.sites.some(s=>s.kind==='carcass'&&!s.gone&&Math.floor(s.x)===x&&Math.floor(s.y)===y))continue;
   if(!best||distance<best.distance)best={x,y,distance};
  }
  if(!best)return false;
  this.sites.push({id:this.nextSiteId++,kind:'carcass',x:best.x+.5,y:best.y+.5,stock:0,day:this.sim.day});return true;
 }
  spawnCarcass(p){
    if(carcassRule(this.sim)===CARCASS_RULES.finite)return this.discoverExistingCarcass(p);
    const w=this.sim.world,seed=(w.seedHash>>>0)||1;this.lastCarcassDay=this.sim.day;
    for(let t=0;t<80;t++){const a=hash(seed,this.sim.day*7+this.sim.year*331,t)*Math.PI*2,r=10+hash(seed,this.sim.day,t+5)*12,x=Math.floor(p.x+Math.cos(a)*r),y=Math.floor(p.y+Math.sin(a)*r);
      if(x<2||y<2||x>=CFG.worldSize-2||y>=CFG.worldSize-2||w.water[w.idx(x,y)])continue;
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const i=w.idx(x+ox,y+oy);if(!w.water[i])w.carrion[i]+=ox||oy?.6:2.2}
      this.sites.push({id:this.nextSiteId++,kind:'carcass',x:x+.5,y:y+.5,stock:0,day:this.sim.day});return true}
    return false;
  }
}
