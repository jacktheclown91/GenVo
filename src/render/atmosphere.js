import {VISIBILITY,atmosphereAt} from '../ecology/atmospheric-visibility.js';
import {drawMistWisps} from './weather-art.js';
import {drawPrecipitation} from './precipitation-art.js';
import {drawCloudShadows} from './cloud-shade-art.js';
export function drawAtmosphere(renderer){
 const sim=renderer.sim;if(sim.visibilityRules!==VISIBILITY.policy)return false;
 const a=sim.player();if(!a||a.underground||(a.diveDepth||0)>.03)return true;
 const sample=atmosphereAt(sim,a.x,a.y),c=renderer.ctx,w=renderer.w,h=renderer.h;
 c.save();
 drawCloudShadows(renderer,sample);
 if(sample.fog>.01){
  const p=renderer.screenPos?.get(a.id)||{x:w/2,y:h/2},radius=Math.max(w,h)*.7;
  const veil=c.createRadialGradient(p.x,p.y,24*renderer.zoom,p.x,p.y,radius);
  veil.addColorStop(0,`rgba(183,198,187,${sample.fog*.06})`);veil.addColorStop(.4,`rgba(183,198,187,${sample.fog*.36})`);veil.addColorStop(1,`rgba(183,198,187,${sample.fog*.78})`);c.fillStyle=veil;c.fillRect(0,0,w,h);
  drawMistWisps(renderer,sample);
 }
 drawPrecipitation(renderer,sample);
 const labels=[];if(sample.fog>.2)labels.push(sample.fog>.6?'Dense fog':'Mist');if(sample.snow>.2)labels.push('Snowfall');if(sample.liquid>.2)labels.push('Rain');
 if(labels.length){c.fillStyle='#152a23d9';c.fillRect(12,h-184,220,24);c.fillStyle='#dfe8de';c.font='12px sans-serif';c.textAlign='left';c.fillText(labels.join(' · ')+' · reduced sight',20,h-168)}
 c.restore();return true;
}
