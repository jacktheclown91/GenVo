export function hashString(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export class RNG{
  constructor(seed='GENVO8'){this.state=hashString(String(seed))||0x6d2b79f5}
  next(){this.state=(this.state+0x6D2B79F5)>>>0;let t=this.state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
  range(a,b){return a+(b-a)*this.next()}
  int(a,b){return Math.floor(this.range(a,b+1))}
  chance(p){return this.next()<p}
  pick(a){return a[Math.floor(this.next()*a.length)]}
}
export function coordNoise(seed,x,y){let h=(seed^Math.imul(x+374761393,668265263)^Math.imul(y+1274126177,2246822519))>>>0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295}
