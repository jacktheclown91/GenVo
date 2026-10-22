import {CFG} from '../sim/config.js';
import {WILDFIRE} from '../ecology/wildfire.js';
import {visuallyObservable} from '../ecology/atmospheric-visibility.js';
import {fireVisualProfile,paintNativeFire} from './wildfire-art.js';
export function drawWildfire(renderer){
 const sim=renderer.sim,p=sim.player();if(sim.fireRules!==WILDFIRE.policy||!p||p.underground)return;
 const c=renderer.ctx,tile=CFG.tileSize*renderer.zoom;c.save();
 for(const [i,fire] of sim.wildfire.cells){const source={x:i%sim.world.n+.5,y:(i/sim.world.n|0)+.5,underground:false};if(!visuallyObservable(sim,p,source))continue;const x=(source.x-renderer.camera.x)*tile+renderer.w/2,y=(source.y-renderer.camera.y)*tile+renderer.h/2;if(x<-tile||y<-tile||x>renderer.w+tile||y>renderer.h+tile)continue;
  paintNativeFire(c,{x,y,tile,profile:fireVisualProfile(fire,sim.tickCount,i)});
 }
 c.restore();
}
