// E20: keyboard-driven continuation at a *real* planetary border.
// Only the explicit control intent is new. The canonical crossing authority
// still validates water, organism anatomy, dependents, energy and remote state.
// Never fabricate tiles or reinterpret a historical freshwater/1 world.
import {PLANET_REGION_SIZE} from './planet-regions.js';

// The margin is narrower than the existing contextual Cross Region action.
// A player must actually walk outward, near the last playable local tiles.
export const WALK_FRONTIER_MARGIN=1.65;
const directions=[
 {name:'west',distance:p=>p.x-1.5,pressed:c=>!!c.left},
 {name:'east',distance:p=>PLANET_REGION_SIZE-1.5-p.x,pressed:c=>!!c.right},
 {name:'north',distance:p=>p.y-1.5,pressed:c=>!!c.up},
 {name:'south',distance:p=>PLANET_REGION_SIZE-1.5-p.y,pressed:c=>!!c.down}
];
export function planetaryWalkIntent(sim,controls,{margin=WALK_FRONTIER_MARGIN}={}){
 if(!sim?.planetaryRegions||sim.world?.generator!=='planetary/1'||
    !sim.playerEnabled||sim.playerAutonomy||sim.paused||!controls)return null;
 const player=sim.player();
 if(!player?.alive||!Number.isFinite(player.x)||!Number.isFinite(player.y))return null;
 // Same nearest frontier tie-breaking as planetaryTravelAvailability. Avoid
 // diagonal corner requests selecting a different coast from the intent.
 let nearest=null,dist=Infinity;
 for(const edge of directions){const d=edge.distance(player);if(d<dist){nearest=edge;dist=d}}
 return nearest&&dist>=0&&dist<=margin&&nearest.pressed(controls)?nearest.name:null;
}

export function planetaryPosition(sim){
 if(!sim?.world?.planet||!sim.player()?.alive)return null;
 const origin=sim.world.regionOrigin||{x:0,y:0},p=sim.player();
 return{regionX:origin.x,regionY:origin.y,worldX:origin.x+p.x,worldY:origin.y+p.y};
}
export function planetaryPositionLabel(sim){
 const pos=planetaryPosition(sim);
 return pos?`Planet ${Math.floor(pos.worldX)}, ${Math.floor(pos.worldY)} · Region ${pos.regionX}, ${pos.regionY}`:null;
}
