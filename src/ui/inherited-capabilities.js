import {canSwim} from '../lineage/lifestyle.js';
import {JUMP,hasJumpingAnatomy} from '../lineage/jumping.js';
import {groundDiet} from '../ecology/functional-diet.js';
import {thermalCoverFactor} from '../lineage/terrain-cover-physiology.js';
import {visionEnabled,visionProfile} from '../lineage/vision.js';
import {partEffectFactors} from '../lineage/part-abilities.js';
import {reproductiveMode} from '../reproduction/reproductive-anatomy.js';
import {PLANTS} from '../sim/config.js';

// Presentation only: compare existing biological readers, never select traits or
// grant abilities. These are body potential; growth and execution gates still apply.
export function inheritedCapabilityChanges(sim,parent,child){
  if(!parent?.bodyPlan||!child?.bodyPlan)return [];
  const changes=[];
  if(canSwim(parent)!==canSwim(child))changes.push(canSwim(child)
    ?'Has swimming anatomy: water offers another route, at an energy cost.'
    :'Lacks your swimming ability: open water may block travel.');
  if(sim.jumpingRules===JUMP.policy&&hasJumpingAnatomy(parent)!==hasJumpingAnatomy(child))
    changes.push(hasJumpingAnatomy(child)
      ?'Has the paired legs for jumping. Growth, reserves and safe landings still matter.'
      :'Lacks the paired legs needed for your jump.');
  const mine=groundDiet(parent),theirs=groundDiet(child);
  const newFoods=Object.keys(theirs).filter(id=>theirs[id]>0&&!(mine[id]>0));
  const lostFoods=Object.keys(mine).filter(id=>mine[id]>0&&!(theirs[id]>0));
  const names=ids=>ids.slice(0,2).map(id=>PLANTS[id]?.label||id).join(' and ');
  if(newFoods.length)changes.push('Its mouth can use '+names(newFoods)+' when found.');
  if(lostFoods.length)changes.push('Its mouth cannot use '+names(lostFoods)+' as yours does.');
  // Identical dry conditions isolate the inherited cover tradeoff, rather than
  // confusing a newborn's current shelter or wet coat with inherited insulation.
  const cold=thermalCoverFactor(child,.2,.55)-thermalCoverFactor(parent,.2,.55);
  const heat=thermalCoverFactor(child,.8,.55)-thermalCoverFactor(parent,.8,.55);
  if(Math.abs(cold)>.05||Math.abs(heat)>.05){
    const lines=[];
    if(Math.abs(cold)>.05)lines.push(cold<0?'less heat loss in dry cold':'more heat loss in dry cold');
    if(Math.abs(heat)>.05)lines.push(heat<0?'less heat strain in dry heat':'more heat strain in dry heat');
    changes.push('Compared with your cover: '+lines.join('; ')+'.');
  }
  if(visionEnabled(sim)){
    const before=visionProfile(parent),after=visionProfile(child);
    if(Math.abs(after.range-before.range)>.5)changes.push(after.range>before.range
      ?'Its eyes can see farther in clear conditions. Fog and terrain still limit sight.'
      :'Its eyes have a shorter clear-weather reach than yours.');
    if(Math.abs(after.fieldOfView-before.fieldOfView)>15)changes.push(after.fieldOfView>before.fieldOfView
      ?'Its eyes cover more directions around the body.'
      :'Its eyes cover fewer directions: facing matters more.');
  }
  const defense=(partEffectFactors(child)?.damageTaken??1)-(partEffectFactors(parent)?.damageTaken??1);
  if(Math.abs(defense)>.05)changes.push(defense<0
    ?'Its body reduces more incoming bite damage. It can still be hurt.'
    :'Its body reduces less incoming bite damage than yours.');
  const before=reproductiveMode(parent),after=reproductiveMode(child);
  if(before!==after)changes.push(after==='egg'?'Its reproductive anatomy uses eggs; nest conditions matter.'
    :after==='dual'?'Its reproductive anatomy supports eggs or live birth, with upkeep for both.'
    :'Its reproductive anatomy uses live birth.');
  return changes;
}
