// Four explicit, authored G1 starting bodies built through the canonical
// guided precursor editor. They are not evolved ancestors or free mutations.
import {FounderDesign} from '../lineage/founder-design.js';
import {place} from '../lineage/evolution-draft.js';
import {prepareAuthoredFounders,installAuthoredFounders} from '../persistence/authored-founders.js';
import {jumpAvailability} from '../lineage/jumping.js';
import {burrowingStatus} from '../lineage/burrowing.js';
import {roostAvailability} from '../ecology/canopy-site.js';
import {divingAvailability,waterColumn,DIVING} from '../lineage/diving.js';
import {canOccupy} from '../lineage/lifestyle.js';

export const PHYSICAL_STARTERS=Object.freeze({
 jump:{label:'Spring jumper',part:'spring-leg',action:'Jump from dry ground using your paired spring legs.',hint:'Your spring legs can launch a real jump. Use Jump on firm ground; the arc consumes breath and food energy.'},
 burrow:{label:'Ground burrower',part:'digging-forelimb',action:'Excavate suitable dry soil with both digging forelimbs.',hint:'Your digging forelimbs can excavate on this suitable ground. Burrowing uses real work and moves real soil.'},
 climb:{label:'Tree climber',part:'climber-leg',action:'Climb a load-bearing living Woodspire with two climbing legs.',hint:'A living Woodspire here supports this body. Use Climb by the trunk; height and energy are real.'},
 dive:{label:'Shore swimmer',part:'webbed-leg',action:'Enter nearby deep enough water and submerge with paired webbed legs.',hint:'Your webbed legs let you swim. Enter the nearby real water, then Dive. Held air is finite.'}
});
export const physicalStarterIds=Object.freeze(Object.keys(PHYSICAL_STARTERS));

function mountedPair(design,part){
 for(const socket of ['limb.1','limb.7']){
  const result=place(design.draft,part,'root',socket);
  if(!result.ok)throw Error(`Guided starter ${part} on ${socket}: ${result.reason}`);
 }
}
export function physicalStarterDesign(id){
 const preset=PHYSICAL_STARTERS[id];
 if(!preset)throw Error('Unknown physical starter: '+id);
 const design=new FounderDesign('guided');
 if(id==='climb'){
  // Climber legs require expressed grasper ancestors, not a forged unlocked flag.
  mountedPair(design,'grasper');
  const ancestor=design.advance();
  if(!ancestor.ok)throw Error('Invalid real grasper precursor: '+ancestor.problems.join(' '));
 }
 mountedPair(design,preset.part);
 const result=design.finish();
 if(!result.ok)throw Error('Invalid physical starter anatomy: '+result.problems.join(' '));
 return result.record;
}

// Evaluate actual usable body and geology, rather than adding scenery or
// inferring permissions from a sprite/label. A failed seed remains a failed seed.
export function physicalStarterOpportunity(sim,body,id,x,y){
 if(!PHYSICAL_STARTERS[id]||!canOccupy(body,sim.world,x,y))return null;
 const actor={...body,x,y};
 if(id==='jump')return !sim.world.water[sim.world.idx(x,y)]&&jumpAvailability(sim,actor).enabled?{x,y,type:'jump'}:null;
 if(id==='burrow')return burrowingStatus(sim,actor).enabled?{x,y,type:'burrow'}:null;
 if(id==='climb')return roostAvailability(actor,sim.world,{climbing:true}).enabled?{x,y,type:'climb'}:null;
 if(id==='dive'){
  if(sim.world.water[sim.world.idx(x,y)])return null; // Start safely on the bank.
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const wx=Math.floor(x)+dx+.5,wy=Math.floor(y)+dy+.5;
   if(!sim.world.isPlayable(wx,wy)||waterColumn(sim.world,wx,wy)<DIVING.minDepth+DIVING.clearance)continue;
   const submergedActor={...actor,x:wx,y:wy};
   if(canOccupy(submergedActor,sim.world,wx,wy)&&divingAvailability(sim,submergedActor).enabled)
    return{x,y,type:'dive',water:{x:wx,y:wy}};
  }
 }
 return null;
}

export function installPhysicalStarter(sim,id){
 if(!PHYSICAL_STARTERS[id])throw Error('Unknown physical starter: '+id);
 if(sim.tickCount!==0||sim.day!==1)throw Error('Physical starters are for fresh Day 1 worlds only.');
 const record=physicalStarterDesign(id);
 const members=prepareAuthoredFounders(sim);
 const introduced=installAuthoredFounders(sim,members,record,{
  starterFocus:id,
  sitePreference:(actor,x,y)=>!!physicalStarterOpportunity(sim,actor,id,x,y)
 });
 const opportunity=physicalStarterOpportunity(sim,sim.player(),id,sim.player().x,sim.player().y);
 if(!opportunity)throw Error('Physical starter site was not retained after installation.');
 return{...introduced,opportunity,preset:PHYSICAL_STARTERS[id]};
}
