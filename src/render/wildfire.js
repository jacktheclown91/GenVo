import {CFG} from '../sim/config.js';
import {WILDFIRE} from '../ecology/wildfire.js';
import {visuallyObservable} from '../ecology/atmospheric-visibility.js';
export function drawWildfire(renderer){
 const sim=renderer.sim,p=sim.player();if(sim.fireRules!==WILDFIRE.policy||!p||p.underground)return;
 const c=renderer.ctx,tile=CFG.tileSize*renderer.zoom;c.save();
 for(const [i,fire] of sim.wildfire.cells){const source={x:i%sim.world.n+.5,y:(i/sim.world.n|0)+.5,underground:false};if(!visuallyObservable(sim,p,source))continue;const x=(source.x-renderer.camera.x)*tile+renderer.w/2,y=(source.y-renderer.camera.y)*tile+renderer.h/2;if(x<-tile||y<-tile||x>renderer.w+tile||y>renderer.h+tile)continue;
  const flicker=.8+.2*Math.sin(sim.tickCount*2.1+i),height=tile*(.25+.45*fire.intensity)*flicker;c.fillStyle='#d74e24bb';c.beginPath();c.ellipse(x,y,tile*.3,tile*.16,0,0,Math.PI*2);c.fill();
  for(let k=-1;k<=1;k++){const px=x+k*tile*.15;c.fillStyle=k?'#f68e2ce0':'#ffe59ae8';c.beginPath();c.moveTo(px-tile*.12,y);c.quadraticCurveTo(px-tile*.2,y-height*.45,px+Math.sin(i+k+sim.tickCount)*tile*.08,y-height*(k?.7:1));c.quadraticCurveTo(px+tile*.2,y-height*.3,px+tile*.12,y);c.fill();}
 }
 c.restore();
}
