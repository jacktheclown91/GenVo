// Persistent weather (water input for the soil-water cycle, roadmap stage W). The previous climate drew rain as the
// season's base times (0.75 + 0.5*rng) afresh on every ecology step: white noise with no spells, droughts or
// storms. Here each day's rain is the same seasonal base times a weather factor from two seeded autocorrelated
// anomalies, a fast one (spells of a few days) and a slow one (wet and dry runs lasting seasons):
//   factor = exp(fastSpread*fast + slowSpread*slow - (fastSpread^2 + slowSpread^2)/2)
// The anomalies are stationary unit-variance AR(1) processes, so the long-run mean factor is 1: the expected
// seasonal rain is unchanged and nothing is added to rescue plants. Wet spells, storms, dry spells and droughts are
// runs of the process, not scripted events.
// Weather keeps its own random stream (state saved with the simulation core), seeded from the world seed, so it
// never consumes sim.rng and a resumed world continues exactly the weather it would have had. Temperature keeps the
// previous seasonal formula. ?weatherPatterns=0 restores the previous per-step rain.
import {hashString} from '../core/rng.js';
export const WEATHER_PATTERNS={enabled:true,fastPersistence:.7,fastSpread:.25,slowPersistence:.97,slowSpread:.3};
function next(st){st.rngState=(st.rngState+0x6D2B79F5)>>>0;let t=st.rngState;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
function gauss(st){const u=1-next(st),v=next(st);return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
export function createWeatherState(seed){const st={schema:1,rngState:hashString(String(seed)+':weather')||0x9e3779b9,day:0,fast:0,slow:0,factor:1};st.fast=gauss(st);st.slow=gauss(st);st.factor=weatherFactor(st);return st}
export function weatherFactor(st,P=WEATHER_PATTERNS){const a=P.fastSpread,b=P.slowSpread;return Math.exp(a*st.fast+b*st.slow-(a*a+b*b)/2)}
// Advance the weather to absolute day index `day` (0 = the first day of the world), one day at a time.
export function advanceWeatherTo(st,day,P=WEATHER_PATTERNS){
  while(st.day<day){const pf=P.fastPersistence,ps=P.slowPersistence;
    st.fast=pf*st.fast+Math.sqrt(1-pf*pf)*gauss(st);st.slow=ps*st.slow+Math.sqrt(1-ps*ps)*gauss(st);st.day++}
  st.factor=weatherFactor(st,P);return st;
}
export function validWeatherState(st){return !!st&&st.schema===1&&Number.isInteger(st.day)&&st.day>=0&&[st.rngState,st.fast,st.slow,st.factor].every(Number.isFinite)}
