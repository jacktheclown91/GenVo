// Canvas operation recorder (Phase 3L batched creature rendering). Stands in for the page's 2D context while
// the creatures are prepared: every drawing call and state change is recorded in order, and replay() issues
// them on the real context afterwards, in exactly the same order and with the same arguments. Creature
// sprites that are freshly drawn during preparation go into a staging atlas (genvo-draw.js), so by replay
// time every staged image is finished and the browser can upload each staging surface once instead of once
// per creature. Painter order, transparency, blending and every other drawing call are unchanged because the
// recorded sequence is the original one.
// Reads are answered without breaking order: context properties come from a shadow copy of the drawing state
// (kept through save/restore). Any other read (getTransform, getImageData, measureText, isPointInPath,
// getLineDash, ...) first replays everything pending and then asks the real context, so results are always
// exact; `stats.flushes` counts how often that happened (each one only costs batching, never correctness).
const RECORD_ONLY=new Set(['save','restore','translate','scale','rotate','transform','setTransform','resetTransform','beginPath','closePath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','arc','arcTo','ellipse','rect','roundRect','fill','stroke','clip','fillRect','strokeRect','clearRect','fillText','strokeText','drawImage','putImageData','setLineDash','drawFocusIfNeeded','reset']);
// Creating gradients and patterns neither draws nor depends on drawing state.
const PASS_THROUGH=new Set(['createLinearGradient','createRadialGradient','createConicGradient','createPattern','createImageData']);
export class CanvasRecorder{
  constructor(){this.ops=[];this.real=null;this.state=null;this.stack=[];this.stats={ops:0,flushes:0};this.fns=new Map();const self=this;
    this.proxy=new Proxy({},{
      get(_,p){if(p==='canvas')return self.real.canvas;if(p==='__recorder')return self;
        if(typeof self.real[p]==='function')return self.fn(p);
        return p in self.state?self.state[p]:self.real[p]},
      set(_,p,v){self.state[p]=v;self.ops.push(1,p,v);return true},
      has(_,p){return p in self.real}
    })}
  fn(p){let f=this.fns.get(p);if(f)return f;const self=this;
    if(RECORD_ONLY.has(p))f=function(...a){if(p==='save')self.stack.push({...self.state});else if(p==='restore'){if(self.stack.length)self.state=self.stack.pop()}else if(p==='reset'){self.state=Object.create(null);self.stack.length=0}
      if(p==='setLineDash')a=[Array.from(a[0]||[])];self.ops.push(0,p,a);return undefined};
    else if(PASS_THROUGH.has(p))f=(...a)=>self.real[p](...a);
    else f=(...a)=>{self.flush();self.stats.flushes++;return self.real[p](...a)};
    this.fns.set(p,f);return f}
  // Begin recording for `real`; returns the stand-in context.
  begin(real){this.real=real;this.ops.length=0;this.state=Object.create(null);this.stack.length=0;return this.proxy}
  // Issue everything recorded so far on the real context, in order.
  flush(){const c=this.real,o=this.ops;if(this.onFlush)this.onFlush();for(let i=0;i<o.length;i+=3){if(o[i]===1)c[o[i+1]]=o[i+2];else c[o[i+1]](...o[i+2])}this.stats.ops+=o.length/3;o.length=0;if(this.afterFlush)this.afterFlush()}
}
