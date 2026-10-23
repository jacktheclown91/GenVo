import {jumpKinematics} from '../lineage/jumping.js';

// Escape jumps that land on ground (2026-10-23, first-month wildlife measurement). On recorded
// worlds a wild animal fleeing by jump launches straight away from the threat whatever lies there,
// and hoppers drinking at a bank leap across the river and drown (26 mosskips in 40 days on
// GENVO8-TEST-A). With this policy the animal looks where it would come down: of the directions
// leading away from the threat (within 90 degrees of straight away, nearest first), it takes the
// first whose landing point, at its own jump range, is ground it could stand on. If none is, it does
// not jump and runs instead. Every organism follows the same rule; swimmers may land in water.
export const ESCAPE_LANDING=Object.freeze({policy:'escape-landing/1'});
export function escapeLandingActive(sim){return sim?.escapeLandingRules===ESCAPE_LANDING.policy}
const DIRS=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]].map(([x,y])=>{const l=Math.hypot(x,y);return[x/l,y/l]});
// A unit direction for an escape jump away from `threat`, or null when no landing is safe.
export function escapeJumpDirection(sim,a,threat){
 const ax=a.x-threat.x,ay=a.y-threat.y,len=Math.hypot(ax,ay)||1,ux=ax/len,uy=ay/len,{range}=jumpKinematics(a);
 const options=[[ux,uy],...DIRS.filter(([x,y])=>x*ux+y*uy>0).sort((p,q)=>(q[0]*ux+q[1]*uy)-(p[0]*ux+p[1]*uy))];
 for(const [dx,dy] of options){const x=a.x+dx*range,y=a.y+dy*range;if(sim.world.isPlayable(x,y)&&sim.canOccupy({...a,airborne:false},x,y))return{dx,dy}}
 return null;
}
export function restoreEscapeLanding(sim,core){
 if(core.escapeLandingRules!==undefined&&core.escapeLandingRules!==ESCAPE_LANDING.policy)throw Error('Unknown saved escape-landing rules.');
 if(core.escapeLandingRules===undefined)delete sim.escapeLandingRules;
}
