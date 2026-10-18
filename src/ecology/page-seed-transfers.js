// D2: Receipts for real seed cohorts deposited across canonical World pages.
// The real seed banks, genotype cohorts and plant tissue remain the only stores.
// This module neither deposits seeds nor changes germination, selection or RNG.
import {WORLD_PAGE_SIZE} from '../world/pages.js';
import {PLANTS} from '../sim/config.js';

export const PAGE_SEED_SCHEMA=1;
export const PAGE_SEED_HISTORY=64;
const natural=n=>Number.isSafeInteger(n)&&n>=0;
function pages(w){return natural(w?.n)&&w.n>0?Math.ceil(w.n/WORLD_PAGE_SIZE):null;}
function pageKey(w,i){
 if(!natural(i)||i>=w.len)return null;const x=i%w.n,y=Math.floor(i/w.n);
 return Math.floor(x/WORLD_PAGE_SIZE)+','+Math.floor(y/WORLD_PAGE_SIZE);
}
function validPage(k,n){
 if(typeof k!=='string'||!/^\d+,\d+$/.test(k))return false;
 const [x,y]=k.split(',').map(Number);
 return natural(x)&&natural(y)&&x<n&&y<n&&x+','+y===k;
}
export function createPageSeedTransfers(){
 return{schema:PAGE_SEED_SCHEMA,lastDepositId:0,transfers:0,total:0,byEdge:new Map(),recent:[]};
}
export function recordPageSeedDeposit(controller,{kind,i,added,payload=null,depositId,actorId=null}){
 const w=controller?.sim?.world,grid=pages(w);
 if(!grid||!natural(w.len)||w.len!==w.n*w.n||!Object.hasOwn(PLANTS,kind)||!natural(i)||i>=w.len||
    !Number.isFinite(added)||added<=0||!natural(depositId)||depositId===0)throw Error('Invalid seed page deposit.');
 const journal=controller.pageSeedTransfers??(controller.pageSeedTransfers=createPageSeedTransfers());
 if(journal.schema!==PAGE_SEED_SCHEMA||depositId<=journal.lastDepositId)throw Error('Duplicate or stale seed page deposit.');
 const destination=pageKey(w,i),parts=payload?.cohorts instanceof Map
   ? [...payload.cohorts.values()]
   : [{amount:added,originCell:payload?.originCell??i}];
 let sourceTotal=0;
 for(const c of parts){if(!Number.isFinite(c?.amount)||c.amount<0)throw Error('Invalid seed deposit cohort weight.');sourceTotal+=c.amount;}
 if(!(sourceTotal>0)||!Number.isFinite(sourceTotal))throw Error('Empty seed deposit cohort.');
 const groups=new Map();
 for(const c of parts){
  if(c.amount===0)continue;
  const origin=pageKey(w,c.originCell??payload?.originCell??i);
  // An unknown legacy source must never be manufactured as a migration.
  if(origin===null||origin===destination)continue;
  groups.set(origin,(groups.get(origin)||0)+added*c.amount/sourceTotal);
 }
 if(journal.transfers+groups.size>Number.MAX_SAFE_INTEGER)throw Error('Seed page receipt sequence exhausted.');
 const planned=[];
 for(const [from,mass] of groups){
  if(!(mass>0)||!Number.isFinite(mass))throw Error('Invalid seed page transfer mass.');
  const key=from+'>'+destination+'|'+kind,previous=journal.byEdge.get(key)||{mass:0,deposits:0};
  if(!Number.isFinite(previous.mass+mass)||!natural(previous.deposits+1))throw Error('Seed page totals overflow.');
  planned.push({key,mass,previous,from,to:destination});
 }
 // All validation completes before any audit state is committed. The canonical
 // deposit itself already succeeded and is never reversed by this observer.
 journal.lastDepositId=depositId;
 for(const entry of planned){
  journal.byEdge.set(entry.key,{mass:entry.previous.mass+entry.mass,deposits:entry.previous.deposits+1});
  journal.transfers++;journal.total+=entry.mass;
  journal.recent.push({depositId,day:controller.sim.day,tick:controller.sim.tickCount,
   kind,from:entry.from,to:entry.to,amount:entry.mass,actorId});
  if(journal.recent.length>PAGE_SEED_HISTORY)journal.recent.shift();
 }
 return planned.length;
}
export function validatePageSeedTransfers(journal,w){
 if(journal===undefined)return;
 const grid=pages(w);
 if(!grid||journal?.schema!==PAGE_SEED_SCHEMA||!natural(journal.lastDepositId)||
    !natural(journal.transfers)||!Number.isFinite(journal.total)||journal.total<0||
    !(journal.byEdge instanceof Map)||!Array.isArray(journal.recent)||
    journal.recent.length>PAGE_SEED_HISTORY)throw Error('Invalid saved page seed transfers.');
 let total=0,transfers=0;
 for(const [key,entry] of journal.byEdge){
  if(typeof key!=='string'||key.split('|').length!==2)throw Error('Invalid page seed edge.');
  const [path,kind]=key.split('|'),points=path.split('>');
  if(points.length!==2||!validPage(points[0],grid)||!validPage(points[1],grid)||
     points[0]===points[1]||!Object.hasOwn(PLANTS,kind)||
     !Number.isFinite(entry?.mass)||entry.mass<=0||!natural(entry.deposits)||entry.deposits===0)
    throw Error('Invalid page seed edge.');
  total+=entry.mass;transfers+=entry.deposits;
 }
 const tolerance=1e-8*Math.max(1,total);
 if(!Number.isFinite(total)||!Number.isSafeInteger(transfers)||transfers!==journal.transfers||
    Math.abs(total-journal.total)>tolerance)throw Error('Page seed transfer totals do not reconcile.');
 let prior=0;
 for(const e of journal.recent){
  if(!e||!natural(e.depositId)||!e.depositId||e.depositId<prior||e.depositId>journal.lastDepositId||
     !natural(e.day)||!natural(e.tick)||!Object.hasOwn(PLANTS,e.kind)||
     !validPage(e.from,grid)||!validPage(e.to,grid)||e.from===e.to||
     !Number.isFinite(e.amount)||e.amount<=0||
     !(e.actorId===null||natural(e.actorId)&&e.actorId>0)||
     !journal.byEdge.has(e.from+'>'+e.to+'|'+e.kind))
    throw Error('Invalid saved page seed receipt.');
  prior=e.depositId;
 }
 if(journal.recent.length>journal.transfers)throw Error('Invalid saved page seed history length.');
}
