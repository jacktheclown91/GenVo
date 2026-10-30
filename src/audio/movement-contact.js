import {bodyDimensions} from '../organisms/body-size.js';
import {developmentFor} from '../family/family.js';
import {planPartCounts} from '../lineage/part-abilities.js';
import {iceSupports,liquidContact} from '../lineage/ice-locomotion.js';
import {liquidVolume} from '../world/surface-ice.js';
import {snowCover} from '../world/snowpack.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function acousticDimensions(animal){
 const dimensions=bodyDimensions(animal,developmentFor(animal)),s=dimensions.currentScale;
 return{...dimensions,pitch:clamp(s**-.35,.72,1.38),weight:clamp(s**.45,.55,1.35),duration:clamp(s**.25,.75,1.3)};
}
// Actual contact only. Nearby water, season names and biome labels are not contact.
export function movementContact(world,animal){
 const d=acousticDimensions(animal),counts=planPartCounts(animal),quiet=(counts['padded-leg']||0)>=2;
 let surface='dry';
 if(animal?.underground)surface='earth';
 else if(world?.idx&&world.water){
  const i=world.idx(animal.x,animal.y),e=world.environment;
  if(world.water[i]&&iceSupports(world,animal))surface='ice';
  else if(world.water[i]&&liquidContact(world,animal)&&liquidVolume(e,i,e?.volume?.[i]??e?.depth?.[i]??1)>.01)surface='water';
  else if(snowCover(world,i)>.08)surface='snow';
  else if((world.moisture?.[i]||0)>.64)surface='mud';
  else if(Math.max(world.plants?.sunmoss?.[i]||0,world.plants?.bramble?.[i]||0,world.plants?.marshroot?.[i]||0)>.35)surface='vegetation';
 }
 return{surface,pitch:d.pitch,weight:d.weight*(quiet?.58:1),duration:d.duration,spacing:d.adultScale*(.72+.28*d.growth),quiet};
}
export function contactEnvelope(contact,sprint=false){
 const palette={dry:[1250,.055,.025,.008],vegetation:[2300,.075,.020,.003],mud:[460,.10,.029,.009],snow:[3100,.095,.024,.004],ice:[3900,.045,.019,.008],water:[1150,.13,.036,.006],earth:[650,.07,.023,.008]};
 const [frequency,seconds,peak,body]=palette[contact.surface]||palette.dry,gain=contact.weight*(sprint?1.45:1);
 return{frequency:frequency*contact.pitch,seconds:seconds*contact.duration,peak:Math.min(.075,peak*gain),body:Math.min(.025,body*gain),bodyHz:(contact.surface==='water'?190:95)*contact.pitch};
}
