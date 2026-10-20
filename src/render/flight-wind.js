import {flightWindReading} from '../lineage/flight-wind.js';

// A small in-world directional cue for the actual local wind. This remains
// visible in low-detail mode because it explains physical movement costs.
export function drawFlightWind(ctx,sim,position){
 const animal=sim.player();
 if(!animal?.airborne||!position)return;
 const wind=flightWindReading(animal,sim.world);
 if(!wind)return;
 const x=position.x+28,y=position.y-45,angle=Math.atan2(wind.south,wind.east);
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle='rgba(12,31,27,.88)';ctx.fillRect(-17,-16,106,34);
 ctx.strokeStyle='#bbdce0';ctx.lineWidth=2;ctx.save();ctx.rotate(angle);
 ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(10,0);ctx.lineTo(5,-4);ctx.moveTo(10,0);ctx.lineTo(5,4);ctx.stroke();ctx.restore();
 ctx.font='11px sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#e6f2e0';ctx.fillText('Wind '+wind.direction,18,0);
 ctx.restore();
}
