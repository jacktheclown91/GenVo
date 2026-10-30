import {articulatedKnee} from './limb-articulation.js';
const DIRECTIONS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const GROUNDED_ACTIONS=new Set(['idle','move','rest','forage','seek-water','prowl','flee','listen','scan']);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const angleDelta=(from,to)=>((to-from+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;

// Ephemeral artwork contacts, never physical collision or organism state. Units
// are the existing sprite-art units per tile. A stationary actor keeps its normal
// cached sprite; only real travel, turns and brief recovery need limb overrides.
export class GroundContactTracker{
  constructor({unitsPerTile=16,maxStates=512,maxAgeMs=2500}={}){
    this.units=unitsPerTile;this.maxStates=maxStates;this.maxAgeMs=maxAgeMs;
    this.states=new Map();this.world=null;this.serial=0;
    this.stats={held:0,replanted:0,recovered:0,maxHoldDrift:0,resets:0};
  }
  begin({id,world,anatomy='',x,y,dir,now,moving=false,paused=false,eligible=true,action='move',sizeScale=1}={}){
    if(this.world!==world){this.clear();this.world=world;}
    if(!eligible||!GROUNDED_ACTIONS.has(action)||![x,y,now].every(Number.isFinite)){this.states.delete(id);return null;}
    const units=this.units/sizeScale;
    if(!Number.isFinite(units)||units<=0){this.states.delete(id);return null;}
    let state=this.states.get(id);
    if(state&&(state.anatomy!==anatomy||state.units!==units||Math.hypot(x-state.x,y-state.y)>2||now<state.lastSeen||(!paused&&now-state.lastSeen>350&&Math.hypot(x-state.x,y-state.y)>.25))){
      this.states.delete(id);state=null;this.stats.resets++;
    }
    if(!state){
      if(this.states.size>=this.maxStates)this.states.delete(this.states.keys().next().value);
      state={id,units,serial:++this.serial,anatomy,x,y,dir,lastSeen:now,time:0,mode:'idle',modeStart:0,startVersion:0,settleVersion:0,legs:null};
      state.frame=new ContactFrame(this,state);this.states.set(id,state);
    }
    const oldDir=state.dir,changed=dir!==oldDir;
    state.time+=paused?0:Math.max(0,Math.min(100,now-state.lastSeen));
    state.x=x;state.y=y;state.lastSeen=now;state.dir=dir;
    this.states.delete(id);this.states.set(id,state);
    if(paused){return state.legs?.size?state.frame.configure('freeze',oldDir):null;}
    if(moving){
      if(state.mode!=='walk'){if(state.mode==='idle')state.lastBody=null;state.mode='walk';state.modeStart=state.time;state.startVersion++;}
    }else if(state.mode==='walk'||changed){
      if(state.mode==='idle')state.lastBody=null;state.mode='settle';state.modeStart=state.time;state.settleVersion++;
    }else if(state.mode==='settle'&&state.time-state.modeStart>=280){
      state.mode='idle';state.legs=null;
    }
    if(state.mode==='idle'){if(state.frame.memo.size)state.frame.memo.clear();state.lastBody=null;return null;}
    return state.frame.configure(state.mode,oldDir);
  }
  prune(now){for(const [id,state] of this.states)if(now-state.lastSeen>this.maxAgeMs)this.states.delete(id);}
  clear(){this.states.clear();}
}

class ContactFrame{
  constructor(owner,state){this.owner=owner;this.state=state;this.memo=new Map();this.forward={x:0,y:-1};this.perp={x:1,y:0};}
  configure(mode,seedDir){
    this.mode=mode;this.seedDir=seedDir;
    this.cacheToken=mode==='freeze'?this.state.serial+':'+this.state.time+':'+this.state.x+':'+this.state.y:null;
    this.needsRestPose=!this.state.legs?.size;
    const vector=DIRECTIONS[this.state.dir&7],length=Math.hypot(...vector);
    this.forward.x=vector[0]/length;this.forward.y=vector[1]/length;this.perp.x=-this.forward.y;this.perp.y=this.forward.x;this.heading=Math.atan2(this.forward.y,this.forward.x);
    this.memo.clear();this.bodyResult=null;return this;
  }
  carriage(candidate,neutral=candidate){
    if(this.bodyResult)return this.bodyResult;
    const s=this.state;
    if(this.mode==='freeze')return this.bodyResult=s.lastBody||candidate;
    const version=this.mode==='walk'?s.startVersion:s.settleVersion;
    if(s.bodyMode!==this.mode||s.bodyVersion!==version){
      s.bodyMode=this.mode;s.bodyVersion=version;s.bodyFrom=s.lastBody||neutral;
    }
    const duration=this.mode==='walk'?120:150;
    this.bodyResult=mix(s.bodyFrom,candidate,smooth((s.time-s.modeStart)/duration));
    s.lastBody=this.bodyResult;return this.bodyResult;
  }
  resolve(leg,{root,knee,foot,restFoot=foot}){
    const key=leg.slot??leg.index,cached=this.memo.get(key);if(cached)return cached;
    const s=this.state,u=s.units;
    const world=point=>({x:s.x+point.x/u,y:s.y+point.y/u});
    const local=point=>({x:(point.x-s.x)*u,y:(point.y-s.y)*u});
    const candidate=world(foot);
    s.legs??=new Map();let entry=s.legs.get(key);
    if(!entry){
      const neutral=world(restFoot);
      const seed=DIRECTIONS[this.seedDir&7],heading=Math.atan2(seed[1],seed[0]);
      entry={anchor:neutral,last:neutral,planted:true,startVersion:-1,settleVersion:-1,heading,headingTime:s.time,footForward:{x:Math.cos(heading),y:Math.sin(heading)}};s.legs.set(key,entry);
    }
    let displayed=candidate,planted=!!leg.planted,lift=leg.liftAmount||0,heading=entry.heading;
    if(this.mode==='freeze'){
      displayed=entry.last;planted=entry.planted;lift=entry.lastLift||0;
    }else if(this.mode==='settle'){
      if(entry.settleVersion!==s.settleVersion){
        entry.settleVersion=s.settleVersion;entry.from=entry.last;entry.stopPlanted=entry.planted;entry.fromHeading=entry.heading;
        entry.recoverAt=s.modeStart+((Math.floor(key/2)%2)*55);
      }
      const t=Math.max(0,Math.min(1,(s.time-entry.recoverAt)/180));
      displayed=mix(entry.from,candidate,smooth(t));
      const distance=Math.hypot(entry.from.x-candidate.x,entry.from.y-candidate.y)*u;
      const turn=angleDelta(entry.fromHeading,this.heading);
      heading=entry.fromHeading+turn*smooth(t);
      if((distance>.06||Math.abs(turn)>.05)&&t>0&&t<1){displayed.y-=Math.sin(Math.PI*t)*.65/u;planted=false;lift=Math.max(lift,Math.sin(Math.PI*t)*.35);}
      else{planted=t===0?entry.stopPlanted:!!leg.planted;if(t===0)lift=entry.lastLift||0;}
      if(t===1){entry.anchor=candidate;if(entry.completedVersion!==s.settleVersion){entry.completedVersion=s.settleVersion;this.owner.stats.recovered++;}}
    }else if(entry.forced){
      const t=Math.max(0,Math.min(1,(s.time-entry.forced.time)/110));
      displayed=mix(entry.forced.from,candidate,smooth(t));
      displayed.y-=Math.sin(Math.PI*t)*.75/u;
      planted=t===1&&!!leg.planted;lift=Math.max(lift,Math.sin(Math.PI*t)*.4);
      if(t===1){entry.forced=null;entry.anchor=candidate;}
    }else if(planted){
      if(!entry.planted)entry.anchor=candidate;
      const anchor=local(entry.anchor),reach=Math.hypot(foot.x-root.x,foot.y-root.y);
      // A foot cannot remain on the far side of a body after a sharp reversal.
      // Release only its artwork contact; navigation and movement continue.
      if(Math.hypot(anchor.x-root.x,anchor.y-root.y)>Math.max(8,reach*1.65)){
        entry.forced={from:entry.last,time:s.time};displayed=entry.last;planted=false;this.owner.stats.replanted++;
      }
      if(planted){displayed=entry.anchor;this.owner.stats.held++;}
    }else{
      if(entry.startVersion!==s.startVersion){entry.startVersion=s.startVersion;entry.startFrom=entry.last;}
      const t=smooth((s.time-s.modeStart)/120);displayed=mix(entry.startFrom,candidate,t);
    }
    // A planted sole keeps its world heading while the body turns above it.
    // Swing/recovery rotates the tissue, without changing the contact authority.
    if(this.mode==='walk'){
      if(!planted){
        const elapsed=Math.max(0,s.time-entry.headingTime);
        heading+=angleDelta(heading,this.heading)*(1-Math.exp(-elapsed/55));
      }else if(!entry.planted)heading=this.heading;
    }
    if(heading!==entry.heading){entry.heading=heading;entry.footForward={x:Math.cos(heading),y:Math.sin(heading)};}
    entry.headingTime=s.time;
    const finalFoot=local(displayed);
    if(this.mode==='walk'&&planted){
      const check=world(finalFoot);this.owner.stats.maxHoldDrift=Math.max(this.owner.stats.maxHoldDrift,Math.hypot(check.x-entry.anchor.x,check.y-entry.anchor.y));
    }
    entry.last=displayed;entry.planted=planted;entry.lastLift=lift;
    const joint=articulatedKnee({root,foot:finalFoot,forward:this.forward,perp:this.perp,side:leg.side,liftAmount:lift});joint.y-=.9+lift*.6;
    const result={root,knee:joint,foot:finalFoot,leg:{...leg,planted,liftAmount:lift,footForward:entry.footForward}};
    this.memo.set(key,result);return result;
  }
}
