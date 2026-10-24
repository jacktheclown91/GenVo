import {thermalWeatherReading} from '../ecology/thermal-weather.js';
export function drawThermalWeather(renderer){
 const s=renderer.sim,p=s.player();if(!p||p.underground||(p.diveDepth||0)>.03)return;
 const reading=thermalWeatherReading(s,p.x,p.y);if(!reading?.active)return;
 const c=renderer.ctx,w=renderer.w,h=renderer.h,warm=reading.delta>0,intensity=Math.min(1,Math.abs(reading.delta)/.3),t=renderer.renderNow/1000;
 c.save();c.fillStyle=warm?`rgba(194,115,46,${intensity*.045})`:`rgba(107,159,193,${intensity*.065})`;c.fillRect(0,0,w,h);
 if(warm&&reading.temperature>=.78){c.strokeStyle=`rgba(243,205,138,${intensity*.12})`;c.lineWidth=1;for(let k=0;k<4;k++){const y=(k*173+t*9)%h;c.beginPath();for(let x=0;x<w;x+=16){const py=y+Math.sin(x/60+t+k)*3;if(x===0)c.moveTo(x,py);else c.lineTo(x,py)}c.stroke()}}
 c.restore();
}
