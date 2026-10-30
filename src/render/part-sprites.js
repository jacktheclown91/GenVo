import {aridPartPigment} from './arid-presentation.js';
import {pixel,pixelLine,snap} from './pixel-art.js';
import {drawHead} from './head.js';
import {artForPart} from './runtime-part-art.js';
import {nativeCoveringFit} from './covering-fit.js';
import {partDef} from '../lineage/part-registry.js';
export {pixel,pixelLine} from './pixel-art.js';
// Evolution Expansion Phase B (GDD v1, section 10; backlog EV-006): pixel part components.
// Every part in the starter registry has a procedural pixel component drawn in the GenVo8 style
// at the 16x16 language, with its layer and the 8-facing / 8-frame convention. No external art:
// the creator chose code-drawn components (2026-10-09). Rendering never grants abilities.
//
// Parts that already existed in v1.33.7 reuse its exact pixels, so existing bodies keep their
// look; new parts (spring heel, digging spade, claw, venom gland, wide-field eye, reinforced
// torso ridge, paddle tail) are new components.

export const PART_SPRITES=Object.freeze({
  'head-base':{layer:'face',base:true},
  'soft-torso':{layer:'body',base:true},
  'reinforced-torso':{layer:'body'},
  'walking-leg':{layer:'rear',base:true},
  'spring-leg':{layer:'rear'},
  'grasper':{layer:'front'},
  'digging-forelimb':{layer:'front'},
  'climber-leg':{layer:'front'},'arid-pad':{layer:'rear'},
  'hook-pad':{layer:'front'},
  'filament-tuft':{layer:'body'},'fur-mantle':{layer:'body'},'feather-mantle':{layer:'body'},'proto-wing':{layer:'body'},'flight-wing':{layer:'body'},'heat-frill':{layer:'body'},'wax-plates':{layer:'body'},
  'grazing-mouth':{layer:'face',base:true},
  'tearing-jaw':{layer:'face'},
  'crushing-jaw':{layer:'face'},
  'simple-eye':{layer:'face',base:true},
  'wide-field-eye':{layer:'face'},
  'armor-plate':{layer:'body'},
  'barb':{layer:'rear'},
  'claw':{layer:'front'},
  'venom-gland':{layer:'body'},
  'storage-sac':{layer:'body'},
  'signal-crest':{layer:'body'},
  'paddle-tail':{layer:'rear'},
  // Wave 1 (creator decision 2026-10-09): code-drawn components in the same style.
  'small-torso':{layer:'body',base:true},'sleek-torso':{layer:'body'},'light-torso':{layer:'body'},'stout-torso':{layer:'body'},'barrel-torso':{layer:'body'},'dome-torso':{layer:'body'},'long-torso':{layer:'body'},
  'runner-leg':{layer:'rear'},'sturdy-leg':{layer:'rear'},'webbed-leg':{layer:'rear'},'padded-leg':{layer:'rear'},
  'kernel-beak':{layer:'face'},'thorn-carapace':{layer:'body'},
  'reed-sieve-mouth':{layer:'face'},'silt-fin':{layer:'body'},
  'beak-mouth':{layer:'face'},'filter-mouth':{layer:'face'},'nibbler-mouth':{layer:'face'},'sucker-mouth':{layer:'face'},'gape-mouth':{layer:'face'},
  // Wave 2 components.
  'balance-tail':{layer:'rear'},'club-tail':{layer:'rear'},'spined-tail':{layer:'rear'},'whip-tail':{layer:'rear'},'prehensile-tail':{layer:'rear'},'fat-tail':{layer:'rear'},'flag-tail':{layer:'rear'},
  'sail-fin':{layer:'body'},'spine-ridge':{layer:'body'},'water-hump':{layer:'body'},'display-frill':{layer:'body'},'moss-back':{layer:'body'},'sensory-quills':{layer:'body'},
  'fat-pad':{layer:'body'},'gill-slits':{layer:'body'},'salt-gland':{layer:'body'},'scent-gland':{layer:'body'},'spine-cluster':{layer:'body'},'brood-pouch':{layer:'body'},'egg-chamber':{layer:'body'},'live-womb':{layer:'body'},'endothermic-core':{layer:'body'},'mammary-gland':{layer:'body'},
  'hook-spur':{layer:'front'},'dew-claw':{layer:'front'},'heel-spike':{layer:'front'},'sensory-bristle':{layer:'front'},'grip-pad':{layer:'front'},'kick-spur':{layer:'front'},
  'horn-crest':{layer:'body'},'tusk-jaw':{layer:'face'},
  'patagium':{layer:'body'},'gliding-membrane':{layer:'body'},'luminous-tail':{layer:'rear'},'shell-back':{layer:'body'},'armored-hide':{layer:'body'},'glow-eye':{layer:'face'},'echo-crest':{layer:'body'},
  'hunter-eye':{layer:'face'},'stalk-eye':{layer:'face'},'compound-eye':{layer:'face'},'tracker-eye':{layer:'face'},'display-eye':{layer:'face'},'eyespot':{layer:'face'},
  'telescopic-eye':{layer:'face'},'raptor-eye':{layer:'face'},'panoramic-eye':{layer:'face'},'sentinel-eye':{layer:'face'}
});
// Eyes drawn entirely by their own component (the base eye is not drawn under them).
export const OWN_EYES=new Set(['stalk-eye','compound-eye','eyespot','glow-eye','panoramic-eye','sentinel-eye']);
// Shared metadata for every component (GDD 10): eight facings, eight-frame animation convention,
// procedural pixels, provenance.
export const PART_SPRITE_META=Object.freeze({facings:8,frames:8,procedural:true,provenance:'Procedural pixel components drawn in code in the GenVo8 style; AI-assisted implementation; no external art assets.'});
export const LAYER_ORDER=Object.freeze(['rear','body','front','face']);


// k: {s, p (palette), fx, fy, perp, bx, by, bodyW, bodyH, face, frameInt, sign, leg, knee, foot, size}
const DRAW={
  // v1.60.0: the basic eye and the resting grazing mouth are part art too (they were drawn by the body).
  'simple-eye'(c,k){const {eye,s,p}=k,ex=eye.x,ey=eye.y,wide=!!k.wide;pixel(c,ex-1,ey-1,wide?3:2,wide?3:2,s,p.light);pixel(c,ex-1,ey-1,2,wide?2:1,s,'#eef7ff');const pupilX=ex+(k.fx>.25?0:k.fx<-.25?-1:0),pupilY=ey+(k.fy>.25?0:k.fy<-.25?-1:0);pixel(c,pupilX,pupilY,1,1,s,k.alert?'#5c3040':'#223751');if(wide)pixel(c,ex,ey-1,1,1,s,'#ffffff')},
  'grazing-mouth'(c,k){const {mouth:m,perp,s}=k,r=k.rest||1;pixelLine(c,m.x-perp.x*r,m.y-perp.y*r,m.x+perp.x*r,m.y+perp.y*r,s,'rgba(38,54,76,.72)')},
  'grasper'(c,k){const sign=Math.sign(k.leg.side)||1,f=k.foot;pixel(c,snap(f.x+sign),snap(f.y),1,1,k.s,k.p.light);pixel(c,snap(f.x),snap(f.y+1),1,1,k.s,k.p.shade)},
  // Digging forelimb: a broad spade foot (3 pixels) with a pale cutting edge.
  'digging-forelimb'(c,k){const sign=Math.sign(k.leg.side)||1,f=k.foot;pixel(c,snap(f.x-1),snap(f.y+1),3,1,k.s,'#8c6a46');pixel(c,snap(f.x-1),snap(f.y+2),3,1,k.s,'#e2cf9f');pixel(c,snap(f.x+sign),snap(f.y),1,1,k.s,'#8c6a46')},
  'barb'(c,k){const sign=Math.sign(k.leg.side)||1;pixel(c,snap(k.knee.x+sign),snap(k.knee.y-1),1,2,k.s,k.p.light)},
  // Claw: a hooked two-segment talon past the foot.
  'claw'(c,k){const f=k.foot,sign=Math.sign(k.leg.side)||1,tx=f.x+k.fx*2,ty=f.y+k.fy*2;pixelLine(c,f.x,f.y,tx,ty,k.s,'#f1e8cf');pixel(c,snap(tx+k.perp.x*sign),snap(ty+k.perp.y*sign),1,1,k.s,'#f1e8cf')},
  'armor-plate'(c,k){if(k.sign==null){const b=backTop(k);pixel(c,b.x-2,b.y-.5,4,1.5,k.s,k.p.shade);pixel(c,b.x-1.5,b.y-1,3,.5,k.s,k.p.light);pixel(c,b.x-.5,b.y,.5,.5,k.s,k.p.light);return}const ax=k.bx+k.perp.x*k.sign*(k.bodyW*.34)-k.fx*.6,ay=k.by+k.perp.y*k.sign*(k.bodyH*.34)-k.fy*.6;pixel(c,snap(ax),snap(ay),2,2,k.s,k.p.shade);pixel(c,snap(ax),snap(ay-1),1,1,k.s,k.p.light)},
  'storage-sac'(c,k){const sx=k.bx+k.perp.x*k.sign*(k.bodyW*.48)-k.fx*.5,sy=k.by+k.perp.y*k.sign*(k.bodyH*.38)-k.fy*.5;pixel(c,snap(sx),snap(sy),2,2,k.s,k.p.body);pixel(c,snap(sx),snap(sy),1,1,k.s,k.p.light)},
  // Venom gland: a swollen 2x2 sac with a dark duct toward the jaw.
  'venom-gland'(c,k){const gx=k.bx+k.perp.x*k.sign*(k.bodyW*.40)+k.fx*.8,gy=k.by+k.perp.y*k.sign*(k.bodyH*.40)+k.fy*.8;pixel(c,snap(gx),snap(gy),2,2,k.s,'#9fd14f');pixel(c,snap(gx),snap(gy),1,1,k.s,'#e2f5a8');pixelLine(c,gx+k.fx,gy+k.fy,gx+k.fx*2-k.perp.x*k.sign,gy+k.fy*2-k.perp.y*k.sign,k.s,'#4e6d2a')},
  // Small flank-mounted thermal sac, visible from the usual top-down angle.
  'endothermic-core'(c,k){const f=flankAt(k);pixel(c,snap(f.x-1),snap(f.y-1),3,3,k.s,'#6e3d36');pixel(c,snap(f.x),snap(f.y),2,2,k.s,'#d78958');pixel(c,snap(f.x+1),snap(f.y),1,1,k.s,'#f5c285')},
  'mammary-gland'(c,k){const f=flankAt(k),x=f.x+k.fx*.8,y=f.y+k.fy*.8;pixel(c,snap(x-1),snap(y),3,2,k.s,'#986b76');pixel(c,snap(x),snap(y),2,1,k.s,'#dfb6b2');pixel(c,snap(x+1),snap(y+1),1,1,k.s,'#f0ded2')},
  // Overhead E3 insulation stages. Mounted to the upper body, NOT to the face.
  'filament-tuft'(c,k){const b=backTop(k);for(let n=-4;n<=4;n++){
    const x=b.x+k.perp.x*n*.47,y=b.y+k.perp.y*n*.47;
    pixelLine(c,x,y,x-k.fx*(1.4+Math.abs(n)*.14),y-k.fy*(1.4+Math.abs(n)*.14)+k.perp.y*n*.28,k.s,n%3===0?'#f0e2ba':'#d8c6a2',.46)}},
  'fur-mantle'(c,k){const b=backTop(k);
    // Jagged perimeter and a broad warm mantle, unlike the narrow sparse tuft.
    for(let n=-5;n<=5;n++){
      const side=n<0?-1:1,x=b.x+k.perp.x*n*.82,y=b.y+k.perp.y*n*.82;
      pixelLine(c,x-k.fx*.8,y-k.fy*.8,x-k.fx*(2.8+Math.abs(n%3)*.32)+k.perp.x*side*.35,
        y-k.fy*(2.8+Math.abs(n%3)*.32)+k.perp.y*side*.35,k.s,n%3===0?'#e6c798':'#aa8063',1.1);
      pixel(c,snap(x),snap(y),1,1,k.s,n%2?'#705747':'#d8b688');
    }},
  'feather-mantle'(c,k){const b=backTop(k);
    // Separate lateral vanes and pale tapered quills preserve top-down readability.
    for(const side of [-1,1])for(let n=0;n<5;n++){
      const a={x:b.x-k.fx*n*.43+k.perp.x*side*.2,y:b.y-k.fy*n*.43+k.perp.y*side*.2};
      const t={x:a.x-k.fx*(2.2+n*.12)+k.perp.x*side*(2.0+n*.52),
        y:a.y-k.fy*(2.2+n*.12)+k.perp.y*side*(2.0+n*.52)};
      pixelLine(c,a.x,a.y,t.x,t.y,k.s,'#476477',1.15);
      pixelLine(c,a.x,a.y,t.x,t.y,k.s,n%2?'#a2c6ce':'#e5eee8',.6);
      pixel(c,snap(t.x),snap(t.y),.8,.8,k.s,n%2?'#d4dcb5':'#eff5ec');
    }},
  // Wing precursor is DISPLAY ONLY: six tapered vanes anchored to the back.
  'proto-wing'(c,k){const b=backTop(k),fold=k.behavior?.crestSpread>0?.8:.55;
    for(const sign of [-1,1])for(let n=0;n<3;n++){
      const x=b.x-k.fx*(.2+n*.75)+k.perp.x*sign*.55,y=b.y-k.fy*(.2+n*.75)+k.perp.y*sign*.55;
      const ex=x-k.fx*(2.5+n*.35)+k.perp.x*sign*(1.0+n*.5)*fold,ey=y-k.fy*(2.5+n*.35)+k.perp.y*sign*(1.0+n*.5)*fold-.35;
      pixelLine(c,x,y,ex,ey,k.s,'#354f66',1.1);
      pixelLine(c,x,y,ex,ey,k.s,n&1?'#b6cbd2':'#e0dfc8',.6);
      pixel(c,snap(ex),snap(ey),.6,.6,k.s,'#eef3ef')}},
  // E6: radial heat frill, distinct from the ornamental signal crest.
  'heat-frill'(c,k){const b=backTop(k);for(let n=-3;n<=3;n++){
    const sx=b.x+k.perp.x*n*.65,sy=b.y+k.perp.y*n*.65;
    const ex=sx-k.fx*(2.5-Math.abs(n)*.22)+k.perp.x*n*.55,
          ey=sy-k.fy*(2.5-Math.abs(n)*.22)+k.perp.y*n*.55-1.1;
    pixelLine(c,sx,sy,ex,ey,k.s,k.arid?.frillFlushed?(n%2?'#b9503c':'#ee8d65'):(n%2?'#c86b3e':'#f2a45e'),.8);
    pixel(c,snap(ex-.4),snap(ey-.4),.85,.85,k.s,'#ffe4a5');}},
  'wax-plates'(c,k){const f=flankAt(k);for(const n of [-1,0,1]){
    const x=f.x-k.fx*n*1.1,y=f.y-k.fy*n*1.1;
    pixel(c,snap(x-.6),snap(y-.5),1.35,1.1,k.s,k.arid?.waxSealed?'#a39770':'#817456');
    pixel(c,snap(x-.55),snap(y-.55),1.25,.36,k.s,'#e6d7a3');}},
  // E8: two swept load-bearing wings, overhead only, flapping from the actual dorsal
  // mount. The stroke depends on existing gait/pose time, not simulation RNG.
  'flight-wing'(c,k){const b=backTop(k),phase=k.frameInt??0,spread=k.behavior?.flightSpread??(k.behavior?.crestSpread>0?.95:.75),lift=((phase%8+8)%8)/8,beat=.8+.2*Math.cos(lift*Math.PI*2);
    for(const side of [-1,1]){
      const root={x:b.x+k.perp.x*side*.9,y:b.y+k.perp.y*side*.9};
      const elbow={x:root.x+k.perp.x*side*3.6*spread,y:root.y+k.perp.y*side*3.6*spread-k.fy*1.8};
      const tip={x:elbow.x+k.perp.x*side*(3.5+beat*1.8),y:elbow.y+k.perp.y*side*(3.5+beat*1.8)-k.fx*(1.6+beat)};
      pixelLine(c,root.x,root.y,elbow.x,elbow.y,k.s,'#435e71',1.3);
      pixelLine(c,elbow.x,elbow.y,tip.x,tip.y,k.s,'#b7cccb',1.15);
      for(let n=0;n<5;n++){const t=(n+.4)/5,x=elbow.x+(tip.x-elbow.x)*t,y=elbow.y+(tip.y-elbow.y)*t;
        pixelLine(c,x,y,x-k.fx*(2.2-n*.28)+k.perp.x*side*.65,y-k.fy*(2.2-n*.28)+k.perp.y*side*.65,k.s,n%2?'#d6d6b2':'#7e9cac',.9)}
      pixel(c,snap(tip.x),snap(tip.y),.9,.9,k.s,'#f1e9cb');
    }},
  'signal-crest'(c,k){for(const sign of [-1,1]){const cx=k.bx-k.fx*(k.bodyW*.28)+k.perp.x*sign*1.4,cy=k.by-k.fy*(k.bodyH*.28)+k.perp.y*sign*1.4-1;pixelLine(c,cx,cy,cx-k.fx*2.4+k.perp.x*sign,cy-k.fy*2.4+k.perp.y*sign-1.2,k.s,'#f0e0a0');pixel(c,cx-k.fx*2.4+k.perp.x*sign,cy-k.fy*2.4+k.perp.y*sign-1.2,1,1,k.s,'#e07050')}},
  // Tearing jaw: two forward mandibles with pale hooked tips either side of the mouth.
  'tearing-jaw'(c,k){const base=k.face.mouthForward+.8;for(const sign of [-1,1]){const x0=k.bx+k.fx*base+k.perp.x*sign*1.5,y0=k.by+k.fy*base+k.perp.y*sign*1.5,x1=x0+k.fx*2-k.perp.x*sign*.6,y1=y0+k.fy*2-k.perp.y*sign*.6;pixelLine(c,x0,y0,x1,y1,k.s,'#2b3f66');pixel(c,snap(x1),snap(y1),1,1,k.s,'#f1e8cf')}},
  // Crushing jaw: heavy square jaw plates around the mouth with a row of pale teeth.
  'crushing-jaw'(c,k){const base=k.face.mouthForward+1.4,jx=k.bx+k.fx*base,jy=k.by+k.fy*base;for(const sign of [-1,1]){pixel(c,snap(jx+k.perp.x*sign*1.9-.5),snap(jy+k.perp.y*sign*1.9-.5),2,2,k.s,'#2b3f66');pixel(c,snap(jx+k.perp.x*sign*1.2+k.fx*.8),snap(jy+k.perp.y*sign*1.2+k.fy*.8),1,1,k.s,'#f1e8cf')}pixelLine(c,jx-k.perp.x*.8+k.fx*1.2,jy-k.perp.y*.8+k.fy*1.2,jx+k.perp.x*.8+k.fx*1.2,jy+k.perp.y*.8+k.fy*1.2,k.s,'#f1e8cf')},
  // Wide-field eye: an outer rim set further round the head (drawn beside the base eye).
  'wide-field-eye'(c,k){const ox=k.eye.x+k.perp.x*k.sign*1.4,oy=k.eye.y+k.perp.y*k.sign*1.4;pixel(c,snap(ox-.5),snap(oy-.5),2,2,k.s,'#eef7ff');pixel(c,snap(ox),snap(oy),1,1,k.s,'#223751');pixel(c,snap(ox-k.fx),snap(oy-k.fy),1,1,k.s,k.p.light)},
  // Reinforced torso: a ridge of three dark scutes along the back with pale edges.
  'reinforced-torso'(c,k){for(let i=0;i<3;i++){const rx=k.bx-k.fx*(i*1.6-.6)-1,ry=k.by-k.fy*(i*1.6-.6)-Math.max(2,k.bodyH*.32);pixel(c,snap(rx),snap(ry),3,1,k.s,'#2b3f66');pixel(c,snap(rx),snap(ry-1),2,1,k.s,k.p.light)}},
  // Paddle tail: a broad blade behind the body that sweeps with the gait frame.
  // Paddle tail: a dark-outlined stalk ending in a wide teal blade with pale edges, sweeping with the gait.
  'paddle-tail'(c,k){const sweep=k.authoredState==='swim'?(Number(k.behavior?.tailSweep)||0):((k.frameInt%4)-1.5)*.45,rx=k.bx-k.fx*(k.bodyW*.46),ry=k.by-k.fy*(k.bodyH*.46)+1,tx=rx-k.fx*3.6+k.perp.x*sweep,ty=ry-k.fy*3.6+k.perp.y*sweep;pixelLine(c,rx,ry,tx,ty,k.s,'#2b3f66');for(let w=-2;w<=2;w++){const bx=tx-k.fx*.8+k.perp.x*w,by=ty-k.fy*.8+k.perp.y*w;pixel(c,snap(bx),snap(by),1,1,k.s,Math.abs(w)===2?'#cfeef0':'#3f9aa6');pixel(c,snap(bx-k.fx),snap(by-k.fy),1,1,k.s,Math.abs(w)===2?'#cfeef0':'#2f7f8c')}}
};
// Wave 1 components. Shapes read at gameplay zoom: each body class has its own outline cue.
const along=(k,t)=>({x:k.bx+k.fx*t,y:k.by+k.fy*t});
Object.assign(DRAW,{
  // Sleek: a pale streamline along the back and a tapered dark tail end.
  'sleek-torso'(c,k){const a=along(k,-k.bodyW*.42),b=along(k,k.bodyW*.28),lift=Math.max(1,k.bodyH*.28);pixelLine(c,a.x,a.y-lift,b.x,b.y-lift,k.s,k.p.light);const t=along(k,-k.bodyW*.5);pixel(c,snap(t.x),snap(t.y),1,1,k.s,k.p.shade)},
  // Light: a thin pale rim on both sides.
  'light-torso'(c,k){for(const sign of [-1,1])pixel(c,snap(k.bx+k.perp.x*sign*(k.bodyW*.45)),snap(k.by+k.perp.y*sign*(k.bodyH*.45)),1,1,k.s,k.p.light)},
  // Stout: a broad belly band.
  'stout-torso'(c,k){const y=k.by+Math.max(1,k.bodyH*.28);pixelLine(c,k.bx-k.perp.x*2.5,y-k.perp.y*2.5,k.bx+k.perp.x*2.5,y+k.perp.y*2.5,k.s,k.p.shade);pixel(c,snap(k.bx-1),snap(y+1),2,1,k.s,k.p.light)},
  // Barrel: two hoop bands across the body.
  'barrel-torso'(c,k){for(const t of [-1.8,1.4]){const m=along(k,t);pixelLine(c,m.x-k.perp.x*3,m.y-k.perp.y*3,m.x+k.perp.x*3,m.y+k.perp.y*3,k.s,k.p.shade)}},
  // Dome: a raised shell of dark plates with a pale crest line.
  'dome-torso'(c,k){const top=k.by-Math.max(2,k.bodyH*.34);for(let i=-3;i<=3;i++){const x=k.bx+k.perp.x*i,y=top+Math.abs(i)*.45+k.perp.y*i;pixel(c,snap(x),snap(y),1,2,k.s,'#33476b')}pixelLine(c,k.bx-k.perp.x*2,top-1-k.perp.y*2,k.bx+k.perp.x*2,top-1+k.perp.y*2,k.s,'#cfd8e6')},
  // Long: segment lines across the body.
  'long-torso'(c,k){for(const t of [-k.bodyW*.3,0,k.bodyW*.24]){const m=along(k,t);pixelLine(c,m.x-k.perp.x*2,m.y-k.perp.y*2,m.x+k.perp.x*2,m.y+k.perp.y*2,k.s,k.p.shade)}},
  // Runner: a long pale shin and an extended toe.
  'runner-leg'(c,k){const dx=k.foot.x-k.knee.x,dy=k.foot.y-k.knee.y,l=Math.hypot(dx,dy)||1;pixel(c,snap(k.knee.x+dx*.5),snap(k.knee.y+dy*.5),1,1,k.s,k.p.light);pixel(c,snap(k.foot.x+dx/l),snap(k.foot.y+dy/l),1,1,k.s,k.p.light)},
  // Sturdy: a doubled, thick shin and a broad dark foot.
  'sturdy-leg'(c,k){const sign=Math.sign(k.leg.side)||1;pixelLine(c,k.knee.x+sign,k.knee.y,k.foot.x+sign,k.foot.y,k.s,k.p.shade);pixel(c,snap(k.foot.x-1),snap(k.foot.y+1),3,1,k.s,'#2b3f66')},
  // Webbed: pale webbing between the toes (designed bodies; the legacy look comes from Webbed Limbs).
  'webbed-leg'(c,k){if(!k.explicit)return;const sign=Math.sign(k.leg.side)||1;pixel(c,snap(k.foot.x)+sign,snap(k.foot.y),2,1,k.s,'#bfe3e8');pixel(c,snap(k.foot.x),snap(k.foot.y+1),1,1,k.s,'#8cc4cc')},
  // Padded: a soft pale pad under the foot.
  'padded-leg'(c,k){pixel(c,snap(k.foot.x-1),snap(k.foot.y+1),2,1,k.s,'#e9d8c4')},
  // Beak: an orange point past the mouth.
  'reed-sieve-mouth'(c,k){const m=along(k,k.face.mouthForward+1.25),v=k.perp;pixel(c,snap(m.x-1.4),snap(m.y-.7),3,1.7,k.s,'#20586c');for(let j=-2;j<=2;j++){const x=m.x+v.x*j*.7+k.fx*.8,y=m.y+v.y*j*.7+k.fy*.8;pixel(c,snap(x),snap(y),.5,1,k.s,j%2?'#d4e6bd':'#85c8b6')}pixel(c,snap(m.x+k.fx*1.4),snap(m.y+k.fy*1.4),.5,.5,k.s,'#e5f9e4')},
  'kernel-beak'(c,k){const m=along(k,k.face.mouthForward+1.05),tip=along(k,k.face.mouthForward+2.8);pixel(c,snap(m.x-1.2),snap(m.y-1),2.6,2.6,k.s,'#8d5d36');pixelLine(c,m.x,m.y,tip.x,tip.y,k.s,'#edc27a',1.5);pixel(c,snap(tip.x),snap(tip.y),1,1,k.s,'#503a22');pixel(c,snap(m.x+k.perp.x),snap(m.y+k.perp.y),.5,.5,k.s,'#ffdf9a')},
  'beak-mouth'(c,k){const m=along(k,k.face.mouthForward+.6),t=along(k,k.face.mouthForward+2.2);pixel(c,snap(m.x-1),snap(m.y-1),2.5,2.5,k.s,'#e0a040');pixelLine(c,m.x,m.y,t.x,t.y,k.s,'#c87a24',1);pixel(c,snap(t.x),snap(t.y),.5,.5,k.s,'#6a3a10')},
  // Filter: a comb of pale bristles across the mouth.
  'filter-mouth'(c,k){const m=along(k,k.face.mouthForward+1);pixelLine(c,m.x-k.perp.x*2,m.y-k.perp.y*2,m.x+k.perp.x*2,m.y+k.perp.y*2,k.s,'#2b3f66',.5);for(const w of [-1.5,0,1.5])pixel(c,snap(m.x+k.perp.x*w),snap(m.y+k.perp.y*w),1,2,k.s,'#e8efe0')},
  // Nibbler: a small pink mouth.
  'nibbler-mouth'(c,k){const m=along(k,k.face.mouthForward+.5);pixel(c,m.x-.5,m.y-.5,1.5,1,k.s,'#c78a8a');for(const sg of [-.5,.5])pixel(c,m.x+k.perp.x*sg,m.y+k.perp.y*sg+.5,.5,1,k.s,'#f4efe0')},
  // Sucker: a round dark disc with a pink centre.
  'sucker-mouth'(c,k){const m=along(k,k.face.mouthForward+1.2);pixel(c,snap(m.x-1),snap(m.y-1),3,3,k.s,'#5b2f3f');pixel(c,snap(m.x),snap(m.y),1,1,k.s,'#d78a9a')},
  // Gape: a wide dark mouth with a pink lining.
  'gape-mouth'(c,k){const m=along(k,k.face.mouthForward+.4);pixelLine(c,m.x-k.perp.x*2.6,m.y-k.perp.y*2.6,m.x+k.perp.x*2.6,m.y+k.perp.y*2.6,k.s,'#17233a');pixelLine(c,m.x-k.perp.x*1.4,m.y-k.perp.y*1.4+1,m.x+k.perp.x*1.4,m.y+k.perp.y*1.4+1,k.s,'#a0505a')},
  // Hunter eye: a red pupil under a dark brow.
  'hunter-eye'(c,k){pixel(c,k.eye.x-.5,k.eye.y,1.5,1,k.s,'#c03030');pixel(c,k.eye.x,k.eye.y,.5,.5,k.s,'#ffd0c0');pixel(c,k.eye.x-1.5,k.eye.y-1,3,.5,k.s,'#2b1a24')},
  // Tracker eye: an amber iris.
  'tracker-eye'(c,k){pixel(c,k.eye.x-1,k.eye.y-.5,1.5,1.5,k.s,'#e0b040');pixel(c,k.eye.x-.5,k.eye.y,.5,.5,k.s,'#2b2410')},
  // Display eye: a bright gold and rose ring.
  'display-eye'(c,k){pixel(c,k.eye.x+1,k.eye.y-1,1,1,k.s,'#f0c040');pixel(c,k.eye.x-2,k.eye.y,1,1,k.s,'#d06090');pixel(c,k.eye.x,k.eye.y+1,1,1,k.s,'#f0c040')},
  // Stalk eye: an eye raised on a stalk above the head.
  'stalk-eye'(c,k){const top=k.eye.y-3*expressionExtent(k,'stalk-eye');pixelLine(c,k.eye.x,k.eye.y,k.eye.x,top+1,k.s,k.p.shade);pixel(c,k.eye.x-1,top-1,2,2,k.s,'#eef7ff');pixel(c,k.eye.x,top,1,1,k.s,'#223751')},
  // Compound eye: a faceted green dome.
  'compound-eye'(c,k){pixel(c,k.eye.x-1.5,k.eye.y-1.5,3,3,k.s,'#3f7f4f');pixel(c,k.eye.x-1.5,k.eye.y-1.5,1,1,k.s,'#b7e3a0');pixel(c,k.eye.x,k.eye.y-.5,.5,.5,k.s,'#b7e3a0');pixel(c,k.eye.x-.5,k.eye.y+.5,1,.5,k.s,'#1f4a2a')},
  // Eyespot: a tiny dark light-sensing spot.
  'eyespot'(c,k){pixel(c,k.eye.x-.5,k.eye.y-.5,1.5,1.5,k.s,'#1b2433');pixel(c,k.eye.x-.5,k.eye.y-.5,.5,.5,k.s,'#8aa0c0')},
  // Telescopic eye: a deep tubular lens with a gold iris under a heavy brow.
  'telescopic-eye'(c,k){pixel(c,k.eye.x-1,k.eye.y-.5,2,1.5,k.s,'#d9a43a');pixel(c,k.eye.x-.5,k.eye.y,.75,.75,k.s,'#1a1410');pixel(c,k.eye.x-1.5,k.eye.y-1.25,3,.5,k.s,'#2b1a24')},
  // Raptor eye: a large gold eye with a black pupil and a sharp brow ridge.
  'raptor-eye'(c,k){pixel(c,k.eye.x-1.5,k.eye.y-1,2.5,2,k.s,'#f0b832');pixel(c,k.eye.x-.75,k.eye.y-.25,1,1,k.s,'#0f0a08');pixel(c,k.eye.x-2,k.eye.y-1.75,3.5,.5,k.s,'#2b1a24');pixel(c,k.eye.x-1.25,k.eye.y-.75,.5,.5,k.s,'#fff3c8')},
  // Panoramic eye: a broad faceted band wrapping the side of the head.
  'panoramic-eye'(c,k){pixel(c,k.eye.x-2,k.eye.y-1,4,2,k.s,'#2f6b6a');for(const dx of [-1.5,-.5,.5,1.5])pixel(c,k.eye.x+dx-.25,k.eye.y-.75,.5,.5,k.s,'#a8e6d8');pixel(c,k.eye.x-2,k.eye.y+.75,4,.5,k.s,'#1c3e3c')},
  // Sentinel eye: a raised faceted dome on a short stalk.
  'sentinel-eye'(c,k){const top=k.eye.y-2;pixelLine(c,k.eye.x,k.eye.y,k.eye.x,top+1,k.s,k.p.shade);pixel(c,k.eye.x-1.5,top-1.5,3,2.5,k.s,'#2f6b6a');pixel(c,k.eye.x-1,top-1,.75,.75,k.s,'#c6f0e2');pixel(c,k.eye.x+.25,top-.5,.75,.75,k.s,'#a8e6d8');pixel(c,k.eye.x-.5,top+.5,1,.5,k.s,'#1c3e3c')},
});

// Wave 2 components (tails, backs, flanks, spurs), drawn on the 32-pixel grid.
const tailRoot=k=>k.L?.tail?{x:k.L.tail.x,y:k.L.tail.y+1}:({x:k.bx-k.fx*(k.bodyW*.46),y:k.by-k.fy*(k.bodyH*.46)+1});
const tailSweep=k=>k.authoredState==='swim'?(Number(k.behavior?.tailSweep)||0):((k.frameInt%4)-1.5)*.4+(Number(k.behavior?.tailSweep)||0);
// A cowed retreat tucks the tail in toward the body; the root stays anatomically fixed.
const tailTuck=k=>Math.max(0,Math.min(1,Number(k.behavior?.tailTuck)||0));
const tailEnd=(k,len)=>{const r=tailRoot(k),w=tailSweep(k);len*=1-.5*tailTuck(k);return{r,x:r.x-k.fx*len+k.perp.x*w,y:r.y-k.fy*len+k.perp.y*w}};
const backTop=k=>k.L?.dorsal?{x:k.L.dorsal.x,y:k.L.dorsal.y}:({x:k.bx-k.fx*1,y:k.by-k.fy*1});
const flankAt=k=>{const a=k.L?.[k.sign<0?'flank.left':'flank.right'];return a?{x:a.x,y:a.y}:{x:k.bx+k.perp.x*k.sign*(k.bodyW*.44),y:k.by+k.perp.y*k.sign*(k.bodyH*.40)}};
Object.assign(DRAW,{
  'balance-tail'(c,k){const t=tailEnd(k,6.5);pixelLine(c,t.r.x,t.r.y,t.x,t.y,k.s,k.p.shade,.5);pixel(c,t.x,t.y,.5,.5,k.s,k.p.light)},
  'club-tail'(c,k){const t=tailEnd(k,4.6);pixelLine(c,t.r.x,t.r.y,t.x,t.y,k.s,k.p.shade);pixel(c,t.x-1,t.y-1,2,2,k.s,'#2b3f66');pixel(c,t.x-1,t.y-1,.5,.5,k.s,k.p.light)},
  'spined-tail'(c,k){const t=tailEnd(k,5.4);pixelLine(c,t.r.x,t.r.y,t.x,t.y,k.s,k.p.shade);for(const f of [.4,.75])for(const sg of [-1,1]){const mx=t.r.x+(t.x-t.r.x)*f,my=t.r.y+(t.y-t.r.y)*f;pixelLine(c,mx,my,mx+k.perp.x*sg*1.5,my+k.perp.y*sg*1.5,k.s,'#f1e8cf',.5)}},
  'whip-tail'(c,k){const r=tailRoot(k),w=tailSweep(k)*2,m={x:r.x-k.fx*4+k.perp.x*w,y:r.y-k.fy*4+k.perp.y*w},e={x:r.x-k.fx*8-k.perp.x*w,y:r.y-k.fy*8-k.perp.y*w};pixelLine(c,r.x,r.y,m.x,m.y,k.s,k.p.shade,.5);pixelLine(c,m.x,m.y,e.x,e.y,k.s,'#2b3f66',.5)},
  'prehensile-tail'(c,k){const r=tailRoot(k),a={x:r.x-k.fx*4.4,y:r.y-k.fy*4.4},b={x:a.x+k.perp.x*1.6,y:a.y+k.perp.y*1.6},e={x:b.x+k.fx*1.2,y:b.y+k.fy*1.2};pixelLine(c,r.x,r.y,a.x,a.y,k.s,k.p.shade);pixelLine(c,a.x,a.y,b.x,b.y,k.s,k.p.shade,.5);pixelLine(c,b.x,b.y,e.x,e.y,k.s,k.p.light,.5)},
  'fat-tail'(c,k){const t=tailEnd(k,4);pixelLine(c,t.r.x,t.r.y,t.x,t.y,k.s,k.p.body,2);pixelLine(c,t.r.x+k.perp.x,t.r.y+k.perp.y,t.x,t.y,k.s,k.p.shade,.5);pixel(c,t.x,t.y,1,1,k.s,k.p.light)},
  'flag-tail'(c,k){const t=tailEnd(k,4.8);pixelLine(c,t.r.x,t.r.y,t.x,t.y,k.s,k.p.shade,.5);pixel(c,t.x-.5,t.y-1.5,2,1.5,k.s,'#e8804a');pixel(c,t.x,t.y-1.5,.5,.5,k.s,'#f6c27a')},
  'thorn-carapace'(c,k){const b=backTop(k),s=k.s;pixel(c,snap(b.x-3),snap(b.y-1.6),6.5,2,s,'#564d3b');pixel(c,snap(b.x-2.5),snap(b.y-2.1),5.5,1,s,'#d0b879');for(const j of [-2,-1,0,1,2]){const x=b.x+j*1.15,y=b.y-2.1-Math.abs(j)*.14;pixelLine(c,x,y,x+j*.23,y-(j%2?2.3:3.5),s,'#efdb9e',.7)}pixel(c,snap(b.x),snap(b.y-1.6),1,1,s,'#fff0c0')},
  'silt-fin'(c,k){const b=backTop(k),pulse=Math.sin((k.frameInt||0)*Math.PI/4)*.6;for(let j=-2;j<=2;j++){const x=b.x+k.perp.x*j*.55-k.fx*j*.45,y=b.y+k.perp.y*j*.55-k.fy*j*.45;pixelLine(c,x,y,x+k.perp.x*(j*.27+pulse)-k.fx*.2,y-2.5-Math.max(0,2-Math.abs(j))*.6,k.s,j%2?'#a7e9e4':'#327d93',.5)}pixel(c,b.x-.5,b.y-3.2,1,1,k.s,'#def6ee')},
  'sail-fin'(c,k){const b=backTop(k);for(let i=-2;i<=2;i++){const h=4-Math.abs(i)*.8,x=b.x-k.fx*i*.8;pixelLine(c,x,b.y,x,b.y-h,k.s,i%2?'#9fc7d8':'#5f8fb0',1)}},
  'spine-ridge'(c,k){const b=backTop(k);for(let i=-1;i<=1;i++){const x=b.x-k.fx*i*1.6,y=b.y+k.fy*i*.6;pixelLine(c,x,y,x,y-2.5,k.s,'#f1e8cf',1);pixel(c,x,y-2.5,.5,.5,k.s,'#ffffff')}},
  'water-hump'(c,k){const b=backTop(k);pixel(c,b.x-2,b.y-1.5,4,2,k.s,k.p.body);pixel(c,b.x-1.5,b.y-2,3,.5,k.s,k.p.body);pixel(c,b.x-1,b.y-1.5,2,.5,k.s,k.p.light);pixel(c,b.x-.5,b.y-1,1,.5,k.s,'#cfeef0')},
  'display-frill'(c,k){const h={x:k.bx+k.fx*1.4,y:k.by-Math.max(2,k.bodyH*.42)},extent=expressionExtent(k,'display-frill');for(let i=-2;i<=2;i++){const x=h.x+k.perp.x*i*1.1*extent,y=h.y+(-1.6+Math.abs(i)*.5+k.perp.y*i*1.1)*extent;pixelLine(c,h.x,h.y,x,y,k.s,i%2?'#f0c040':'#d06090',.5);pixel(c,x-.5,y-.5,1,1,k.s,i%2?'#f0c040':'#d06090')}},
  'moss-back'(c,k){const b=backTop(k);pixel(c,b.x-2,b.y-.5,2,1.5,k.s,'#5f8a4a');pixel(c,b.x,b.y-1,1.5,1.5,k.s,'#7aa05a');pixel(c,b.x-.5,b.y+.5,1.5,1,k.s,'#4a7038');pixel(c,b.x+1,b.y,1,1,k.s,'#8fbf62')},
  'sensory-quills'(c,k){const b=backTop(k);for(const i of [-1,0,1]){const x=b.x-k.fx*i*1.4,y=b.y,ex=x-k.fx*1.6+i*.5,ey=y-3.4;pixelLine(c,x,y,ex,ey,k.s,'#e6e2c8',.5);pixel(c,ex-.25,ey-.25,1,1,k.s,'#2b3f66')}},
  'fat-pad'(c,k){const f=flankAt(k);pixel(c,f.x-1,f.y-.5,2,1.5,k.s,k.p.light);pixel(c,f.x-.5,f.y,.5,.5,k.s,'#eef7ff')},
  'salt-gland'(c,k){const f=flankAt(k);pixel(c,f.x-.5,f.y-.5,1.5,1.5,k.s,'#4f8a86');pixel(c,f.x+k.fx*.9,f.y+.6,.5,.5,k.s,'#eef3ee')},
  'gill-slits'(c,k){const f=flankAt(k);for(const i of [-1,0,1])pixel(c,f.x+k.fx*i*.8,f.y-.5,.5,1.5,k.s,'#1f3550')},
  'scent-gland'(c,k){const f=flankAt(k);pixel(c,f.x-.5,f.y-.5,1.5,1.5,k.s,'#c79a3a');pixel(c,f.x,f.y,.5,.5,k.s,'#f2d68a')},
  'spine-cluster'(c,k){const f=flankAt(k);for(const i of [-1,0,1]){const x=f.x+k.fx*i*.9,y=f.y;pixelLine(c,x,y,x+k.perp.x*k.sign*1.6,y+k.perp.y*k.sign*1.6,k.s,'#f1e8cf',.5)}},
  'egg-chamber'(c,k){const f=flankAt(k);pixel(c,f.x-1.6,f.y-1,3,2.5,k.s,'#7d6747');pixel(c,f.x-1.2,f.y-1.2,2.2,2,k.s,'#ddca92');pixel(c,f.x-.5,f.y-1.1,.8,.6,k.s,'#fff0c9');pixel(c,f.x+.7,f.y+.2,.6,.6,k.s,'#aa8b5a')},
  'live-womb'(c,k){const f=flankAt(k);pixel(c,f.x-1.8,f.y-1.1,3.6,2.8,k.s,'#6e6689');pixel(c,f.x-1.2,f.y-.8,2.6,1.8,k.s,'#a4a0c0');pixel(c,f.x-.6,f.y-.45,1.4,.9,k.s,'#ded7ea');pixel(c,f.x+.35,f.y+.55,.65,.55,k.s,'#5a516c')},
  'brood-pouch'(c,k){const f=flankAt(k);pixel(c,f.x-1.2,f.y-.5,2.5,2,k.s,k.p.shade);pixel(c,f.x-1.2,f.y-.5,2.5,.5,k.s,k.p.light)},
  'hook-spur'(c,k){const sg=Math.sign(k.leg.side)||1,a={x:k.knee.x+sg*1.2,y:k.knee.y-.5};pixelLine(c,k.knee.x,k.knee.y,a.x,a.y,k.s,'#f1e8cf',.5);pixel(c,a.x,a.y+.5,.5,.5,k.s,'#f1e8cf')},
  'dew-claw'(c,k){const m={x:k.knee.x+(k.foot.x-k.knee.x)*.55,y:k.knee.y+(k.foot.y-k.knee.y)*.55};pixel(c,m.x+(Math.sign(k.leg.side)||1)*.5,m.y,.5,.5,k.s,'#f1e8cf')},
  'heel-spike'(c,k){pixelLine(c,k.foot.x,k.foot.y,k.foot.x-k.fx*1.4,k.foot.y-k.fy*1.4-.5,k.s,'#2b3f66',.5)},
  'sensory-bristle'(c,k){const sg=Math.sign(k.leg.side)||1;for(const d of [-.6,.6])pixelLine(c,k.knee.x,k.knee.y,k.knee.x+sg*1.4,k.knee.y-1+d,k.s,'#e6e2c8',.5)},
  'grip-pad'(c,k){pixel(c,k.foot.x-.5,k.foot.y+.5,1.5,.5,k.s,'#1f3550')},
  // E4 curved hook pads visibly fasten to the creature's own moving foot.
  'hook-pad'(c,k){const f=k.foot,side=Math.sign(k.leg?.side)||1,xx=f.x+k.fx*.7,yy=f.y+k.fy*.7;
    pixel(c,snap(f.x-.7),snap(f.y-.4),1.5,1,k.s,'#435b55');
    pixelLine(c,xx,yy,xx+k.fx*.9+k.perp.x*side*.75,yy+k.fy*.9+k.perp.y*side*.75,k.s,'#ead8a8',.8);
    pixel(c,snap(xx+k.fx*.9),snap(yy+k.fy*.9),.7,.7,k.s,'#faf0d0')},
  // Relic parts: a curved pale horn and two long tusks.
  'horn-crest'(c,k){const b=backTop(k),h={x:b.x+k.fx*1.6,y:b.y};pixelLine(c,h.x,h.y,h.x+k.fx*.6,h.y-3,k.s,'#f1e8cf');pixelLine(c,h.x+k.fx*.6,h.y-3,h.x+k.fx*1.6,h.y-3.8,k.s,'#f1e8cf',.5);pixel(c,h.x,h.y-.5,1,1,k.s,'#c9a86a')},
  'tusk-jaw'(c,k){const m=along(k,k.face.mouthForward+.6);for(const sg of [-1,1]){const r={x:m.x+k.perp.x*sg*1.2,y:m.y+k.perp.y*sg*1.2},e={x:r.x+k.fx*2.4+k.perp.x*sg*.6,y:r.y+k.fy*2.4+k.perp.y*sg*.6-.8};pixelLine(c,r.x,r.y,e.x,e.y,k.s,'#f6eeda');pixel(c,e.x,e.y,.5,.5,k.s,'#ffffff')}},
  // Gliding membrane: a thin golden skin flap stretched out from the flank.
  'patagium'(c,k){const f=flankAt(k),spread=1.5+3.5*Math.max(0,Math.min(1,Number(k.behavior?.glideSpread)||0));pixelLine(c,f.x+k.fx*3,f.y+k.fy*3,f.x+k.perp.x*k.sign*spread,f.y+k.perp.y*k.sign*spread,k.s,'#a3c1ba',2);pixelLine(c,f.x+k.perp.x*k.sign*spread,f.y+k.perp.y*k.sign*spread,f.x-k.fx*3,f.y-k.fy*3,k.s,'#476e73',1)},
  'gliding-membrane'(c,k){const f=flankAt(k),spread=1+1.2*Math.max(0,Math.min(1,Number(k.behavior?.glideSpread)||0)),o={x:f.x+k.perp.x*k.sign*spread,y:f.y+k.perp.y*k.sign*spread},a={x:f.x+k.fx*1.6,y:f.y+k.fy*1.6},b={x:f.x-k.fx*2,y:f.y-k.fy*2};pixel(c,(f.x+o.x)/2-.5,(f.y+o.y)/2-.5,1.5,1.5,k.s,'rgba(246,220,138,.55)');pixelLine(c,a.x,a.y,o.x,o.y,k.s,'#f6dc8a',.5);pixelLine(c,o.x,o.y,b.x,b.y,k.s,'#c9a24a',.5)},
  // Luminous tail: a slim tail ending in a glowing bulb with a soft halo.
  'luminous-tail'(c,k){const t=tailEnd(k,6);pixelLine(c,t.r.x,t.r.y,t.x,t.y,k.s,k.p.shade,.5);pixel(c,t.x-1,t.y-1,2.5,2.5,k.s,'rgba(255,240,150,.35)');pixel(c,t.x-.5,t.y-.5,1.5,1.5,k.s,'#fff3a0');pixel(c,t.x-.5,t.y-.5,.5,.5,k.s,'#ffffff')},
  // Shell back: a ridge of pale crystal shards with white tips.
  'shell-back'(c,k){const b=backTop(k);pixel(c,b.x-2,b.y-.5,4,1,k.s,'#4a8ea2');for(const i of [-1,0,1]){const x=b.x-k.fx*i*1.4,h=i?1.8:2.6;pixelLine(c,x,b.y-.5,x+i*.3,b.y-.5-h,k.s,'#9fe6f0');pixel(c,x+i*.3,b.y-.5-h,.5,.5,k.s,'#ffffff')}},
  // Armored hide: overlapping dark-teal plates with bright edges along the flank.
  'armored-hide'(c,k){const f=flankAt(k);for(const i of [-1,0,1]){const x=f.x-k.fx*i*1.3,y=f.y-k.fy*i*1.3;pixel(c,x-.5,y-.5,1.5,1.5,k.s,'#3d6f7d');pixel(c,x-.5,y-.5,1.5,.5,k.s,'#a8e4ef')}},
  // Glow eye: a pale, bright eye with a soft halo.
  'glow-eye'(c,k){const e=k.eye;pixel(c,e.x-.5,e.y-.5,2,2,k.s,'rgba(170,255,230,.40)');pixel(c,e.x,e.y,1,1,k.s,'#d8fff4')},
  // Echo crest: a fan of fine ridges on the back, like a listening ear.
  'echo-crest'(c,k){const b=backTop(k),h={x:b.x+k.fx*.8,y:b.y};for(let i=-2;i<=2;i++){const x=h.x+k.perp.x*i*1.1,y=h.y-3+Math.abs(i)*.6+k.perp.y*i*1.1;pixelLine(c,h.x,h.y-.5,x,y,k.s,i%2?'#8a96d8':'#c9d2ff',i?.5:1);pixel(c,x-.25,y-.25,1,1,k.s,'#e8ecff')}pixel(c,h.x-.5,h.y-.5,1,1,k.s,'#5a64a0')},
  'kick-spur'(c,k){pixelLine(c,k.knee.x,k.knee.y,k.knee.x+k.fx*1.5,k.knee.y+k.fy*1.5,k.s,'#f1e8cf',.5)}
});
// v1.54.0 (creator rule 2026-10-10: each part owns its shape, articulation, colors and animation):
// a leg draws its own thigh, knee, shin and foot from the hip the body gives it. A leg part may
// replace the whole limb in LIMB_ART; otherwise it uses the standard limb and adds its details.
function standardLimb(c,k){
  const {leg,root,knee,foot,s,p}=k,lifted=Number(leg.liftAmount)||0,distal=leg.front<-.25?p.shade:(lifted>.62?p.light:p.body);
  pixelLine(c,root.x,root.y,knee.x,knee.y,s,p.shade,1.5);
  // The lower leg stays visible while the foot is raised, so a coarse gait never flickers.
  pixelLine(c,knee.x,knee.y,foot.x,foot.y,s,distal);
  pixel(c,snap(knee.x),snap(knee.y),1,1,s,leg.front>.15?p.light:p.body);
  forwardToe(c,k,.8,1,lifted>.62?p.light:p.shade);pixel(c,snap(foot.x),snap(foot.y),.5,.5,s,p.light);
  if(lifted<.42&&Math.abs(leg.side)>.55){const side=Math.sign(leg.side),axis=k.leg?.footForward,perp=axis?{x:-axis.y,y:axis.x}:k.perp||{x:0,y:1};pixel(c,snap(foot.x+perp.x*side),snap(foot.y+perp.y*side),1,1,s,p.shade)}
}
// v1.59.0: each leg type has its own articulation (its gait, stride and lift, lives in
// creature-assembler LEG_GAIT; the shapes are here).
const toe=(c,k,x,y,w,h,col)=>pixel(c,snap(x),snap(y),w,h,k.s,col);
// Fallback foot tissue follows body forward; contact geometry stays fixed.
function forwardToe(c,k,length,width,color){
  const {foot,s}=k,axis=k.leg?.footForward,fx=axis?.x??k.fx??1,fy=axis?.y??k.fy??0;
  pixelLine(c,foot.x-fx*.25,foot.y-fy*.25,foot.x+fx*length,foot.y+fy*length,s,color,width);
}
export const LIMB_ART={
  // Climber: jointed weight-bearing limb, thick forearm and paired recurved digits.
  'climber-leg'(c,k){const {root,knee,foot,s,p,leg}=k,sg=Math.sign(leg?.side)||1,axis=k.leg?.footForward,fx=axis?.x??k.fx??1,fy=axis?.y??k.fy??0,perp={x:-fy,y:fx};
    pixelLine(c,root.x,root.y,knee.x,knee.y,s,p.shade,1.8);
    pixelLine(c,knee.x,knee.y,foot.x,foot.y,s,p.body,1.3);
    pixel(c,snap(knee.x-.5),snap(knee.y-.5),1.4,1.2,s,p.light);
    for(const n of [-1,1]){const ax=foot.x+perp.x*n*.5,ay=foot.y+perp.y*n*.5;
      const tx=ax+fx*1.2+perp.x*n*.7,ty=ay+fy*1.2+perp.y*n*.7;
      pixelLine(c,ax,ay,tx,ty,s,'#d7b889',.75);
      pixel(c,snap(tx-fx*.5+sg*perp.x*.3),snap(ty-fy*.5+sg*perp.y*.3),.65,.65,s,'#f5e4bf')}},
  // Runner: a slender limb, a light springy shin and a long forward-reaching toe.
  'runner-leg'(c,k){const {root,knee,foot,s,p,leg}=k,axis=leg?.footForward,fx=axis?.x??k.fx,fy=axis?.y??k.fy,lifted=Number(leg.liftAmount)||0;pixelLine(c,root.x,root.y,knee.x,knee.y,s,p.shade,1);pixelLine(c,knee.x,knee.y,foot.x,foot.y,s,lifted>.62?p.light:p.body,.5);
    pixel(c,snap(knee.x),snap(knee.y),.5,.5,s,p.light);pixelLine(c,foot.x,foot.y,foot.x+fx*1.4,foot.y+fy*1.4,s,p.shade,.5);toe(c,k,foot.x+fx*1.4,foot.y+fy*1.4,.5,.5,p.light)},
  // Sturdy: a thick column with a low knee and a broad flat foot.
  'sturdy-leg'(c,k){const {root,knee,foot,s,p}=k,mid={x:(root.x+foot.x)/2,y:(root.y+foot.y)/2},kn={x:(knee.x+mid.x)/2,y:(knee.y+mid.y)/2};
    pixelLine(c,root.x,root.y,kn.x,kn.y,s,p.shade,2);pixelLine(c,kn.x,kn.y,foot.x,foot.y,s,p.body,1.5);pixel(c,snap(kn.x-.5),snap(kn.y-.5),1.5,1,s,p.light);forwardToe(c,k,.65,2.5,p.shade);forwardToe(c,k,.65,1.5,p.light)},
  // Spring: a digitigrade leg with a raised hock, so it folds and kicks like a hopping animal.
  'spring-leg'(c,k){const {root,knee,foot,s,p,leg}=k,lifted=Number(leg.liftAmount)||0,v=Math.max(.5,Math.min(1,k.size??.65)),hock={x:knee.x+(foot.x-knee.x)*.55-k.fx*(1+v),y:knee.y+(foot.y-knee.y)*.55-k.fy*(1+v)-.5};
    pixelLine(c,root.x,root.y,knee.x,knee.y,s,p.shade,1.5);pixelLine(c,knee.x,knee.y,hock.x,hock.y,s,p.body,.5);pixelLine(c,hock.x,hock.y,foot.x,foot.y,s,lifted>.62?p.light:p.body,1);
    pixel(c,snap(hock.x),snap(hock.y),.5,.5,s,p.light);forwardToe(c,k,1,.5,p.shade)},
  // Webbed: the standard limb ending in a spread paddle of three webbed toes.
  'webbed-leg'(c,k){standardLimb(c,k);const {foot,s}=k,axis=k.leg?.footForward,fx=axis?.x??k.fx??1,fy=axis?.y??k.fy??0,perp={x:-fy,y:fx};for(const d of [-1,0,1]){const x=foot.x+perp.x*d*.8,y=foot.y+perp.y*d*.8;pixelLine(c,x,y,x+fx,y+fy,s,'#2f6f86',.7)}pixelLine(c,foot.x-perp.x,foot.y-perp.y,foot.x+perp.x,foot.y+perp.y,s,'#7fc8c8',.5)},
  // Padded: the standard limb on a round soft pad that lifts only a little.
  'padded-leg'(c,k){standardLimb(c,k);const {foot,s,p}=k;toe(c,k,foot.x-1,foot.y,2,1,p.shade);toe(c,k,foot.x-.5,foot.y,1,.5,p.light)},
  // Broad, joint-following arid contact pad; not a free-floating terrain sprite.
  'arid-pad'(c,k){standardLimb(c,k);const f=k.foot,p=k.p;
    pixel(c,snap(f.x-1.6),snap(f.y-.25),3.2,1.25,k.s,'#856a49');
    pixel(c,snap(f.x-1.2),snap(f.y-.25),2.4,.4,k.s,'#e7ca85');
    for(const n of [-1,0,1])pixel(c,snap(f.x+n*1.05),snap(f.y+.55),.7,.7,k.s,p.light)},
  // Digging forelimb: a heavy forearm (the spade is drawn by its part detail).
  'digging-forelimb'(c,k){const {root,knee,foot,s,p}=k;pixelLine(c,root.x,root.y,knee.x,knee.y,s,p.shade,1.5);pixelLine(c,knee.x,knee.y,foot.x,foot.y,s,p.body,1.5);pixel(c,snap(knee.x),snap(knee.y),1,1,s,p.light)}
};
export function drawLimb(c,partId,k){
  const art=k.authoredParts?.[partId]||artForPart(partId);
  // Independent limb-art sheets contain jointed upper/lower pixel clusters. The assembly's
  // actual hip, knee and foot continue to govern every frame, size, pose and inheritance.
  if(art?.drawLimb&&typeof c.drawImage==='function'&&art.drawLimb(c,{
    root:{x:k.root.x*k.s,y:k.root.y*k.s},knee:{x:k.knee.x*k.s,y:k.knee.y*k.s},
    foot:{x:k.foot.x*k.s,y:k.foot.y*k.s},scale:k.s,
    // The geometry is paired across the body; its asymmetric tissue must be too.
    mirrorTransverse:(k.leg?.side||0)<0,
    footForward:!k.leg?.aboveBody&&!k.behavior?.aerialTuck&&!Number.isFinite(k.behavior?.climbHeight)&&!['swim','climb','dig','fly','glide','jump'].includes(k.authoredState)?(k.leg?.footForward||{x:k.fx??1,y:k.fy??0}):null,
    facing:k.authoredFacing??0,state:k.authoredState||'idle',timeMs:k.authoredTimeMs??0,pigment:k.nativePigment,
    // Ground contact and water feathering select each mounted foot independently.
    frameIndex:k.leg?.swimFeather!=null?(k.leg.swimFeather>.25?1:0):k.leg?.planted==null?(k.leg?.liftAmount>=.34?1:0):(k.leg.planted?0:1)
  }))return true;
  (LIMB_ART[partId]||standardLimb)(c,k);return false
}
// Native appendages are mounted on real body sockets. Never put a tail or crest at
// the face's mouth anchor: the old face fallback is ONLY for faces.
export function artMount(partId,k){
 const sockets=partDef(partId)?.compatibleSocketTypes||[];
 const side=k.sign||1;
 const x0=k.bx||0,y0=k.by||0;
 // The ellipse radius follows the *current facing*, not only the width of a
 // right-facing creature. Lengthened torsos keep appendages joined while turning.
 const ellipseRadius=(dx,dy)=>1/Math.hypot(dx/Math.max(1,k.bodyW*.5),dy/Math.max(1,k.bodyH*.5));
 const authored=id=>{
   const at=k.L?.[id];return at?{x:at.x+x0-(k.originX??x0),y:at.y+y0-(k.originY??y0)}:null;
 };
 if(sockets.includes('spur')&&k.foot&&k.knee){
   // Spurs belong to the articulated appendage, not the face/body centroid.
   const dx=k.foot.x-k.knee.x,dy=k.foot.y-k.knee.y,length=Math.hypot(dx,dy)||1;
   // A spur's own anatomical type determines its joint: tactile barbs and hooks
   // grow from the knee; dew-claws from the shin; talons and heel spikes from
   // the foot. This is shared with the old procedural shapes, not a new gait.
   const fraction=({barb:0,'hook-spur':0,'sensory-bristle':0,'kick-spur':0,
     'dew-claw':.55,claw:1,'heel-spike':1,'grip-pad':1})[partId]??1;
   return {x:k.knee.x+dx*fraction-dx/length*.25,y:k.knee.y+dy*fraction-dy/length*.25,
     scale:.22,mirrorX:(k.leg?.side||0)<0,
     // Only foot-mounted tissue follows a planted sole; knee/shin spurs keep their joint.
     rotation:fraction===1&&k.leg?.footForward?Math.atan2(k.leg.footForward.y,k.leg.footForward.x)-Math.atan2(k.fy??0,k.fx??1):0};
 }
 if(sockets.includes('tail')){
   const at=authored('tail'),radius=ellipseRadius(k.fx,k.fy);
   return {x:at?.x??x0-k.fx*radius*.96,y:at?.y??y0-k.fy*radius*.96,
     scale:.40*(1-.35*tailTuck(k)),rotation:(Number(k.behavior?.tailSweep)||0)*.12,mirrorX:false};
 }
 if(sockets.includes('flank')&&(!sockets.includes('dorsal')||k.sign)){
   const at=authored(side<0?'flank.left':'flank.right');
   const radius=ellipseRadius(k.perp.x,k.perp.y);
   return {x:at?.x??x0+k.perp.x*side*radius*.86,y:at?.y??y0+k.perp.y*side*radius*.86,
     scale:['patagium','gliding-membrane'].includes(partId)?(.23+.32*Math.max(0,Math.min(1,Number(k.behavior?.glideSpread)||0))):.25,mirrorX:side<0};
 }
 if(sockets.includes('dorsal')){
   const at=authored('dorsal');
   // E5 readability: coat tissue extends visibly past the body edge, whereas
   // a filament precursor stays a small, sparse tuft. Original dorsal gadgets
   // and display anatomy retain their established native footprint.
   const coatScale=partId==='filament-tuft'?.42:partId==='fur-mantle'?.51:partId==='feather-mantle'?.48:.31;
   // Live seasonal fullness changes ONLY authored coat overlay dimensions.
   // Quantizing matches the shared sprite-cache key and prevents costly
   // per-life-step re-rasterization. Default is one for older worlds.
   const mantle=(partId==='filament-tuft'||partId==='fur-mantle'||partId==='feather-mantle')
      &&Number.isFinite(k.coatDensity)?(.78+.30*Math.max(0,Math.min(1,k.coatDensity))):1;
   return {x:at?.x??x0-k.fx*Math.min(k.bodyW,k.bodyH)*.10,
     y:at?.y??y0-k.fy*Math.min(k.bodyW,k.bodyH)*.10,
     scale:coatScale*mantle*(1+(partDef(partId)?.actionCapabilities.includes('flare')?(Number(k.behavior?.crestSpread)||0):0)),mirrorX:false};
 }
 return null;
}
export function drawPart(c,partId,k){
 const authored=k.authoredParts?.[partId]||artForPart(partId);
 if(authored?.rig?.kind==='dorsal-display'&&typeof c.drawImage==='function'){
  const at=artMount(partId,k);if(at&&authored.drawDorsal(c,{x:at.x*k.s,y:at.y*k.s,scale:k.s*(partId==='flight-wing'?.64:.31)*(k.nativeBodyScale??1),headingRadians:Math.atan2(k.fy,k.fx),sweepRadians:partId==='flight-wing'?(Number(k.behavior?.wingSweep)||0):0,deployment:partId==='flight-wing'?(Number(k.behavior?.flightSpread??k.behavior?.crestSpread)||0):partDef(partId)?.actionCapabilities.includes('flare')?(Number(k.behavior?.crestSpread)||0):0,extent:expressionExtent(k,partId),pigment:k.nativePigment,state:k.authoredState||'idle',facing:k.authoredFacing??2,timeMs:k.authoredTimeMs??0,frameIndex:partId==='flight-wing'&&Number.isInteger(k.behavior?.wingFrame)?k.behavior.wingFrame:(k.authoredFrameIndex??null)}))return true;
 }
 if(authored&&!authored.rig&&typeof c.drawImage==='function'){
  const mount=artMount(partId,k),anchor=mount?{x:mount.x,y:mount.y}:(k.eye||k.mouth||(PART_SPRITES[partId]?.layer==='face'&&k.face?{x:k.bx+k.fx*k.face.mouthForward,y:k.by+k.fy*k.face.mouthForward}:null));
  if(anchor){
   const faceFactor=k.eye?.x!==undefined?.55:k.mouth?.x!==undefined?.72:PART_SPRITES[partId]?.layer==='face'?.7:1;
   const scale=k.s*(mount?.scale??(faceFactor/2));
   const args={x:anchor.x*k.s,y:anchor.y*k.s,scale,pigment:aridPartPigment(partId,k.nativePigment,k.arid),
    rotation:mount?.rotation||0,mirrorX:false,state:k.authoredState||'idle',facing:k.authoredFacing??0,timeMs:k.authoredTimeMs??0,frameIndex:['patagium','gliding-membrane'].includes(partId)&&Number.isFinite(k.behavior?.glideSpread)?0:(k.authoredFrameIndex??null)};
   const fit=nativeCoveringFit(partId,k),rotation=(mount?.rotation||0)+(Number(k.faceTurn)||0),paired=!!mount?.mirrorX,oral=k.mouth&&authored.expressionScale!=='fixed'?k.behavior?.feedingMouthShape:null;let painted=false;c.save();try{if(rotation||paired||oral||fit){c.translate(args.x,args.y);if(fit)c.scale(fit.x,fit.y);if(rotation)c.rotate(rotation);if(paired){const axis=Math.atan2(k.fy||0,k.fx||0);c.rotate(axis);c.scale(1,-1);c.rotate(-axis)}if(oral){const axis=Math.atan2(k.fy||0,k.fx||0);c.rotate(axis);c.scale(Math.max(.8,Math.min(1.15,oral.forward||1)),Math.max(.8,Math.min(1.15,oral.width||1)));c.rotate(-axis)}args.x=0;args.y=0}if(!oral&&k.mouth&&k.behavior?.mouthPulse&&authored.expressionScale!=='fixed')args.scale*=1+Math.max(0,k.behavior.mouthPulse)*.12;painted=authored.draw(c,args)||(args.state!=='idle'&&authored.draw(c,{...args,state:'idle'}));}finally{c.restore()}if(painted)return true;
  }
 }
 const fn=DRAW[partId];if(fn)fn(c,k);return !!fn;
}
export function hasComponent(partId){return !!(DRAW[partId]||LIMB_ART[partId]||PART_SPRITES[partId]?.base)}

// v1.60.0 (creator review 2026-10-10: part tiles should come from standalone part art): draws one
// part on its own, through its own art function, at a neutral reference place around (0,0) and
// facing right. No body is drawn. Bodies (torsos) are drawn by the body drawer, which is their art.
export function drawPartAlone(c,partId,{type,s=4,p}){
  if(type==='head'||partDef(partId)?.tags.includes('head')){drawHead(c,{partId,x:0,y:0,width:6,height:5.4},{scale:s,palette:p,facing:2});return}
  const K={s,p,fx:1,fy:0,perp:{x:0,y:1},bx:0,by:0,bodyW:8,bodyH:7,frameInt:0,face:{mouthForward:3,eyeForward:2.5,eyeSpread:1.85,feelerReach:1.7,mouthOpen:0},explicit:true,L:null,sign:1};
  if(type==='limb'||type==='spur'){
    const k={...K,leg:{liftAmount:0,front:.5,side:1,slot:2},root:{x:-.5,y:-3.5},knee:{x:2,y:-1},foot:{x:1,y:3.5},size:.8};
    if(type==='limb'){const native=drawLimb(c,partId,k);if(!native&&partId!=='walking-leg')drawPart(c,partId,k)}else drawPart(c,partId,k);return;
  }
  if(type==='mouth'){const k={...K,bx:-3,mouth:{x:0,y:0}};drawPart(c,partId,k);return}
  if(type==='eye'){const k={...K,eye:{x:0,y:0}};if(!OWN_EYES.has(partId))drawPart(c,'simple-eye',k);if(partId!=='simple-eye')drawPart(c,partId,k);return}
  if(type==='dorsal'){drawPart(c,partId,{...K,bx:1,by:K.bodyH*.46});return}
  if(type==='flank'){drawPart(c,partId,{...K,by:-K.bodyH*.4});return}
  if(type==='tail'){drawPart(c,partId,{...K,bx:K.bodyW*.46,by:-1});return}
}

// Optional renderer-owned normalized extent; neutral preserves original pixels.
function expressionExtent(k,part){const value=(k.partExpression?.[k.expressionNodeId]??k.partExpression?.[part])?.extent;if(value===undefined)return 1;if(!Number.isFinite(value))throw Error('Invalid part expression extent');return Math.max(.25,Math.min(1,value));}
