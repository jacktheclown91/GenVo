import {VISIBILITY,atmosphereAt} from '../ecology/atmospheric-visibility.js';
import {drawMistWisps} from './weather-art.js';
export function drawAtmosphere(renderer){
 const sim=renderer.sim;if(sim.visibilityRules!==VISIBILITY.policy)return false;
 const a=sim.player();if(!a||a.underground||(a.diveDepth||0)>.03)return true;
 const sample=atmosphereAt(sim,a.x,a.y),c=renderer.ctx,w=renderer.w,h=renderer.h,t=renderer.renderNow/1000;
 c.save();
 if(sample.fog>.01){
  const p=renderer.screenPos?.get(a.id)||{x:w/2,y:h/2},radius=Math.max(w,h)*.7;
  const veil=c.createRadialGradient(p.x,p.y,24*renderer.zoom,p.x,p.y,radius);
  veil.addColorStop(0,`rgba(183,198,187,${sample.fog*.06})`);veil.addColorStop(.4,`rgba(183,198,187,${sample.fog*.36})`);veil.addColorStop(1,`rgba(183,198,187,${sample.fog*.78})`);c.fillStyle=veil;c.fillRect(0,0,w,h);
  drawMistWisps(renderer,sample);
 }
 const quality=renderer.lowDetail?.35:1;
 for(const [snow,intensity] of [[false,sample.liquid],[true,sample.snow]]){
  if(intensity<.01)continue;c.strokeStyle=`rgba(181,208,220,${.18+intensity*.38})`;c.fillStyle='#e2eced';c.lineWidth=1;
  const count=Math.round((snow?110:100)*intensity*quality),fall=snow?26:200,drift=(sample.wind?.east??.3)*(snow?20:40);
  for(let k=0;k<count;k++){const x=((k*97+t*drift)%(w+80)+w+80)%(w+80)-40,y=(k*53+t*fall)%(h+60)-30;if(snow)c.fillRect(x+Math.sin(t+k)*5,y,1+k%2,1+k%2);else{c.beginPath();c.moveTo(x,y);c.lineTo(x-drift*.08,y+6+intensity*7);c.stroke()}}
 }
 const labels=[];if(sample.fog>.2)labels.push(sample.fog>.6?'Dense fog':'Mist');if(sample.snow>.2)labels.push('Snowfall');if(sample.liquid>.2)labels.push('Rain');
 if(labels.length){c.fillStyle='#152a23d9';c.fillRect(12,h-184,220,24);c.fillStyle='#dfe8de';c.font='12px sans-serif';c.textAlign='left';c.fillText(labels.join(' · ')+' · reduced sight',20,h-168)}
 c.restore();return true;
}
