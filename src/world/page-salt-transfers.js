// Reporting only: the World environment arrays own dissolved salt and fixed-depth water.
// Each entry aggregates actual cross-page salt movement during one physical update.
// This is NOT an offscreen region simulation or a new water/stock authority.
import {WORLD_PAGE_SIZE,pageCoordinates} from './pages.js';
export const PAGE_SALT_TRANSFER_SCHEMA=1;
function validWorldSize(n){if(!Number.isSafeInteger(n)||n<=0||!Number.isSafeInteger(n*n))throw Error('Invalid salt transfer world size.');}
export function recordPageSaltTransfer(ledger,n,i,j,signedSalt){
 validWorldSize(n);
 if(!(ledger instanceof Map)||![i,j].every(v=>Number.isSafeInteger(v)&&v>=0&&v<n*n)||!Number.isFinite(signedSalt))throw Error('Invalid page salt transfer.');
 const east=j===i+1&&Math.floor(i/n)===Math.floor(j/n),south=j===i+n;
 if(!east&&!south)throw Error('Page salt transfer must follow a cardinal edge.');
 if(signedSalt===0)return false;
 const from=pageCoordinates(i%n,Math.floor(i/n),WORLD_PAGE_SIZE),to=pageCoordinates(j%n,Math.floor(j/n),WORLD_PAGE_SIZE);
 if(from.key===to.key)return false;
 const key=from.key+'>'+to.key;
 let row=ledger.get(key);
 if(!row){row={from:from.key,to:to.key,forwardSalt:0,backwardSalt:0};ledger.set(key,row);}
 if(signedSalt>0)row.forwardSalt+=signedSalt;else row.backwardSalt-=signedSalt;
 return true;
}
export function finishPageSaltTransfers(ledger){
 if(!(ledger instanceof Map))throw Error('Invalid page salt transfer ledger.');
 return{schema:PAGE_SALT_TRANSFER_SCHEMA,flows:Array.from(ledger.values(),row=>({...row,netSalt:row.forwardSalt-row.backwardSalt})).sort((a,b)=>(a.from<b.from?-1:a.from>b.from?1:0)||(a.to<b.to?-1:a.to>b.to?1:0))};
}
export function validatePageSaltTransfers(w,receipt){
 validWorldSize(w?.n);
 if(receipt?.schema!==PAGE_SALT_TRANSFER_SCHEMA||!Array.isArray(receipt.flows))throw Error('Invalid page salt transfer receipt.');
 const pages=Math.ceil(w.n/WORLD_PAGE_SIZE),max=2*pages*(pages-1);
 if(receipt.flows.length>max)throw Error('Excess page salt transfers.');
 let previous='',seen=new Set();
 for(const f of receipt.flows){
  if(!f||typeof f.from!=='string'||typeof f.to!=='string')throw Error('Invalid page salt transfer edge.');
  const a=f.from.split(',').map(Number),b=f.to.split(',').map(Number);
  if(a.length!==2||b.length!==2||![...a,...b].every(v=>Number.isSafeInteger(v)&&v>=0&&v<pages)||
    !((a[0]+1===b[0]&&a[1]===b[1])||(a[0]===b[0]&&a[1]+1===b[1]))||
    f.from!==a.join(',')||f.to!==b.join(','))throw Error('Invalid page salt transfer edge.');
  const key=f.from+'>'+f.to;
  if(seen.has(key)||previous&&previous>=key)throw Error('Duplicate or unordered page salt transfer.');
  seen.add(key);previous=key;
  if(!Number.isFinite(f.forwardSalt)||f.forwardSalt<0||!Number.isFinite(f.backwardSalt)||f.backwardSalt<0||
     f.forwardSalt+f.backwardSalt<=0||!Number.isFinite(f.netSalt)||
     Math.abs((f.forwardSalt-f.backwardSalt)-f.netSalt)>1e-10*Math.max(1,f.forwardSalt,f.backwardSalt))throw Error('Invalid page salt transfer quantity.');
 }
}
export function pageSaltStorage(w){
 validWorldSize(w?.n);
 if(!(w.environment?.salt instanceof Float64Array)||w.environment.salt.length!==w.n*w.n)throw Error('Missing world salt stock.');
 const pages=new Map();
 for(let i=0;i<w.n*w.n;i++){
  const amount=w.environment.salt[i];if(!Number.isFinite(amount)||amount<0)throw Error('Invalid world salt stock.');
  const key=pageCoordinates(i%w.n,Math.floor(i/w.n),WORLD_PAGE_SIZE).key;
  pages.set(key,(pages.get(key)||0)+amount);
 }
 return pages;
}
