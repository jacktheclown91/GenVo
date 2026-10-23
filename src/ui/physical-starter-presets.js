// Four explicit, authored G1 starting bodies built through the canonical
// guided precursor editor. They are not evolved ancestors or free mutations.
import {FounderDesign} from '../lineage/founder-design.js';
import {place} from '../lineage/evolution-draft.js';
import {prepareAuthoredFounders,installAuthoredFounders} from '../persistence/authored-founders.js';
import {jumpAvailability} from '../lineage/jumping.js';
import {burrowingStatus} from '../lineage/burrowing.js';
import {divingAvailability,waterColumn,DIVING} from '../lineage/diving.js';
import {flightAvailability} from '../lineage/flight.js';
import {canOccupy} from '../lineage/lifestyle.js';

export const PHYSICAL_STARTERS=Object.freeze({
 jump:{label:'Spring jumper',part:'spring-leg',action:'Jump from dry ground using your paired spring legs.',hint:'Spring legs: press Enter (or Jump) on firm ground to leap. Leap clear when a hunter charges. Each jump costs breath.'},
 burrow:{label:'Ground burrower',part:'digging-forelimb',action:'Excavate suitable dry soil with both digging forelimbs.',hint:'Digging forelimbs: use Burrow on dry soil to dig a shelter, and go underground when hunters come close. Digging takes time and food.'},
 flight:{label:'Winged flier',part:'flight-wing',action:'Take off from solid ground with an inherited wing.',hint:'Wings: press 6 (or Take off) on firm ground to fly over water and slopes, then Land to rest. Flying burns food fast.'},
 dive:{label:'Shore swimmer',part:'webbed-leg',action:'Enter nearby deep enough water and submerge with paired webbed legs.',hint:'Webbed legs: walk into the nearby water, then press PgDn (or Dive) to swim under for food. Surface before your air runs out.'}
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
 if(id==='flight'){
  // The real feather -> proto-wing -> powered-wing ancestry is four authored
  // DESIGN steps, never four fabricated lived generations.
  for(const precursor of ['filament-tuft','feather-mantle','proto-wing']){
   const applied=place(design.draft,precursor,'root','dorsal');
   if(!applied.ok)throw Error('Invalid physical flight precursor '+precursor+': '+applied.reason);
   const witnessed=design.advance();
   if(!witnessed.ok)throw Error('Invalid documented flight ancestor '+precursor+': '+witnessed.problems.join(' '));
  }
  const wing=place(design.draft,'flight-wing','root','dorsal');
  if(!wing.ok)throw Error('Cannot mount inherited wing: '+wing.reason);
 }else mountedPair(design,preset.part);
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
 if(id==='flight')return !sim.world.water[sim.world.idx(x,y)]&&flightAvailability(actor,sim.world).enabled?{x,y,type:'flight'}:null;
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
