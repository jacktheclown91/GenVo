// Nonvocal material/air textures. Five sources share one cached noise buffer;
// slow modulation gives air movement without scheduling fictional world events.
const definitions=[['canopy',2350,.6,.27],['grit',1550,.45,.17],['exposed',340,.7,.085],['enclosed',220,1.2,.11],['rain-canopy',3200,.65,5.7]];
export class HabitatTextures{
 constructor(ctx,noise,bus){
  this.ctx=ctx;this.layers=new Map();
  for(const [id,frequency,q,rate] of definitions){
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),texture=ctx.createGain(),gain=ctx.createGain(),mod=ctx.createOscillator(),depth=ctx.createGain();
   source.buffer=noise;source.loop=true;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=q;texture.gain.value=.65;gain.gain.value=0;
   source.connect(filter);filter.connect(texture);texture.connect(gain);gain.connect(bus);
   mod.type='sine';mod.frequency.value=rate;depth.gain.value=.25;mod.connect(depth);depth.connect(texture.gain);
   source.start(0,(this.layers.size*.417)%(noise.duration||2.5));mod.start();this.layers.set(id,{source,filter,texture,gain,mod,depth});
  }
 }
 update(targets){
  const time=this.ctx.currentTime;
  for(const [id,layer] of this.layers)layer.gain.gain.setTargetAtTime(Math.max(0,Math.min(.5,targets[id]||0)),time,.85);
  this.layers.get('exposed').filter.frequency.setTargetAtTime(targets.exposedHz||340,time,.7);
  this.layers.get('enclosed').filter.frequency.setTargetAtTime(targets.enclosedHz||220,time,.5);
 }
}
