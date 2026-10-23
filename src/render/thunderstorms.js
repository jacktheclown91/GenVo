import {CFG} from '../sim/config.js';
import {THUNDERSTORMS,thunderstormAt} from '../ecology/thunderstorms.js';
import {visuallyObservable} from '../ecology/atmospheric-visibility.js';
import {drawLightningContact} from './lightning-contact-art.js';
export function drawThunderstorms(renderer){
 const sim=renderer.sim,p=sim.player();if(sim.thunderRules!==THUNDERSTORMS.policy||!p||p.underground||(p.diveDepth||0)>.03)return;
 const c=renderer.ctx,tile=CFG.tileSize*renderer.zoom; c.save();
 for(const e of sim.thunderstorms.events){const age=(sim.tickCount-e.tick)/CFG.simHz;if(age<0||age>.55)continue;
  const source={x:e.i%sim.world.n+.5,y:(e.i/sim.world.n|0)+.5,underground:false};if(!visuallyObservable(sim,p,source))continue;
  const x=(source.x-renderer.camera.x)*tile+renderer.w/2,y=(source.y-renderer.camera.y)*tile+renderer.h/2,alpha=(1-age/.55)*e.intensity;
  c.fillStyle=`rgba(209,225,241,${alpha*.16})`;c.fillRect(0,0,renderer.w,renderer.h);
  drawLightningContact(renderer,{x,y,event:e,age,alpha});
 }
 if(thunderstormAt(sim,sim.world.idx(p.x,p.y)).intensity>.4){const text='Thunderstorm - avoid exposed high ground';c.font='11px sans-serif';c.textAlign='center';const width=c.measureText(text).width+16,x=renderer.w/2,y=renderer.h/2+tile*.85;c.fillStyle='#14232ddd';c.fillRect(x-width/2,y-13,width,18);c.fillStyle='#c7d9e9';c.fillText(text,x,y)}
 c.restore();
}
