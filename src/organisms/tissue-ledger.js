// Inactive physical-funding foundation. Simulation does not import this module.
// Quantities are integer quantum counts encoded as decimal strings. Unit scales
// are explicit exact rationals supplied by the caller, never inferred from genes,
// ancestry labels, body-plan weights, art, energy meters or an organism's age.
export const TISSUE_LEDGER_SCHEMA='genvo.tissue-ledger/1';
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const keys=(v,allowed)=>object(v)&&Object.keys(v).every(k=>allowed.includes(k));
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9:._/-]*$/.test(v)&&!['constructor','prototype'].includes(v);
const count=v=>typeof v==='string'&&/^(0|[1-9][0-9]*)$/.test(v);
const positive=v=>count(v)&&BigInt(v)>0n;
const clone=v=>structuredClone(v);
const stockCount=(v,k)=>Object.hasOwn(v,k)?v[k]:'0';
const sorted=v=>Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0));
const gcd=(a,b)=>{while(b){const r=a%b;a=b;b=r}return a};
function quantum(v,unit){return keys(v,['unit','numerator','denominator'])&&v.unit===unit&&positive(v.numerator)&&positive(v.denominator)&&gcd(BigInt(v.numerator),BigInt(v.denominator))===1n}
function normalizeIntent(tx){
 if(!keys(tx,['id','reason','context','createOwners','transfers'])||!id(tx.id)||typeof tx.reason!=='string'||!tx.reason.trim()||(Object.hasOwn(tx,'context')&&(typeof tx.context!=='string'||!tx.context)))return{ok:false,reason:'invalid-transaction'};
 const create=tx.createOwners??[],transfers=tx.transfers??[];
 if(!Array.isArray(create)||!Array.isArray(transfers)||create.some(v=>!id(v))||new Set(create).size!==create.length||!create.length&&!transfers.length)return{ok:false,reason:'invalid-transaction'};
 const edges=new Map();
 for(const t of transfers){if(!keys(t,['from','to','kind','material','amount'])||!id(t.from)||!id(t.to)||t.from===t.to||!positive(t.amount)||!['material','energy'].includes(t.kind)||(t.kind==='material'?!id(t.material):Object.hasOwn(t,'material')))return{ok:false,reason:'invalid-transaction'};
  const edge={from:t.from,to:t.to,kind:t.kind,...(t.kind==='material'?{material:t.material}:{})},key=JSON.stringify(edge),prior=edges.get(key);edges.set(key,{...edge,amount:(BigInt(prior?.amount||'0')+BigInt(t.amount)).toString()});
 }
 const canonical=[...edges].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,v])=>v);
 const intent={id:tx.id,reason:tx.reason,...(tx.context!==undefined?{context:tx.context}:{}),createOwners:[...create].sort(),transfers:canonical};return{ok:true,intent,signature:JSON.stringify(intent)};
}
export function validateTissueLedger(state){
 const errors=[];if(!keys(state,['schema','units','materials','owners','sequence','applied'])||state.schema!==TISSUE_LEDGER_SCHEMA)return{ok:false,errors:['Unsupported tissue ledger schema or fields']};
 if(!keys(state.units,['mass','energy'])||!quantum(state.units.mass,'kg')||!quantum(state.units.energy,'J'))errors.push('Explicit reduced rational kg and J quanta are required');
 if(!Array.isArray(state.materials)||!state.materials.length||state.materials.some(v=>!id(v))||new Set(state.materials).size!==state.materials.length)errors.push('Declared unique material IDs are required');
 const materials=new Set(Array.isArray(state.materials)?state.materials:[]);
 if(!object(state.owners))errors.push('Owner map is required');else for(const [owner,stock]of Object.entries(state.owners)){if(!id(owner)||!keys(stock,['materials','energy'])||!object(stock.materials)||!count(stock.energy)){errors.push('Invalid owner stock '+owner);continue}for(const [material,amount]of Object.entries(stock.materials))if(!materials.has(material)||!count(amount))errors.push('Invalid material stock '+owner+':'+material);}
 if(!count(state.sequence)||!object(state.applied))errors.push('Invalid transaction history');else{const sequences=new Set();for(const [event,receipt]of Object.entries(state.applied)){const n=normalizeIntent(receipt?.intent);if(!id(event)||!keys(receipt,['sequence','intent'])||!positive(receipt.sequence)||!n.ok||n.intent.id!==event||JSON.stringify(receipt.intent)!==n.signature||sequences.has(receipt.sequence)){errors.push('Invalid receipt '+event);continue}sequences.add(receipt.sequence);if(BigInt(receipt.sequence)>BigInt(state.sequence))errors.push('Receipt exceeds ledger sequence');for(const owner of n.intent.createOwners)if(!Object.hasOwn(state.owners||{},owner))errors.push('Receipt creates missing owner');for(const t of n.intent.transfers)if(!Object.hasOwn(state.owners||{},t.from)||!Object.hasOwn(state.owners||{},t.to)||t.kind==='material'&&!materials.has(t.material))errors.push('Receipt refers to unknown owner or material');}
  if(BigInt(state.sequence)!==BigInt(Object.keys(state.applied).length))errors.push('Incomplete transaction sequence');
 }
 return{ok:!errors.length,errors};
}
function canonicalState(state){const out=clone(state);out.materials.sort();out.owners=sorted(out.owners);for(const stock of Object.values(out.owners))stock.materials=sorted(stock.materials);out.applied=sorted(out.applied);return out}
export function createTissueLedger({units,materials,owners}={}){
 const state={schema:TISSUE_LEDGER_SCHEMA,units:clone(units),materials:clone(materials),owners:clone(owners),sequence:'0',applied:{}},validation=validateTissueLedger(state);if(!validation.ok)throw Error(validation.errors.join('; '));return canonicalState(state);
}
export function restoreTissueLedger(saved){const validation=validateTissueLedger(saved);if(!validation.ok)throw Error(validation.errors.join('; '));return canonicalState(saved)}
export function tissueLedgerTotals(state){const validation=validateTissueLedger(state);if(!validation.ok)throw Error(validation.errors.join('; '));const materials=Object.fromEntries(state.materials.map(m=>[m,0n]));let energy=0n;for(const stock of Object.values(state.owners)){energy+=BigInt(stock.energy);for(const m of state.materials)materials[m]+=BigInt(stockCount(stock.materials,m))}return{materials:sorted(Object.fromEntries(Object.entries(materials).map(([m,n])=>[m,n.toString()]))),energy:energy.toString()}}
// Functional commit: neither successful nor rejected calls mutate the input.
// A World can replace its ONE ledger reference only after ok=true. No live
// adoption is performed here. Empty owners are custody locations, not organs.
export function transferTissue(state,transaction){
 const fail=(reason,extra={})=>({ok:false,reason,state,...extra});const validation=validateTissueLedger(state);if(!validation.ok)return fail('invalid-ledger',{errors:validation.errors});
 const n=normalizeIntent(transaction);if(!n.ok)return fail(n.reason);const {intent,signature}=n,previous=Object.hasOwn(state.applied,intent.id)?state.applied[intent.id]:null;if(previous)return JSON.stringify(previous.intent)===signature?{ok:true,replayed:true,state,receipt:clone(previous)}:fail('event-conflict');
 const created=new Set(intent.createOwners);for(const owner of created)if(Object.hasOwn(state.owners,owner))return fail('owner-already-exists',{owner});
 const outgoing=new Map();for(const t of intent.transfers){if(!Object.hasOwn(state.owners,t.from)||!Object.hasOwn(state.owners,t.to)&&!created.has(t.to))return fail('unknown-owner');if(t.kind==='material'&&!state.materials.includes(t.material))return fail('unknown-material');const key=JSON.stringify([t.from,t.kind,t.material??null]),prior=outgoing.get(key);outgoing.set(key,{from:t.from,kind:t.kind,material:t.material,amount:(prior?.amount||0n)+BigInt(t.amount)});}
 // Gross opening-stock checks forbid borrowing an incoming credit during this
 // same transaction. Cycles cannot manufacture funding for empty owners.
 for(const debit of outgoing.values()){const stock=state.owners[debit.from],available=BigInt(debit.kind==='energy'?stock.energy:stockCount(stock.materials,debit.material));if(debit.amount>available)return fail('insufficient-stock',{owner:debit.from,kind:debit.kind,...(debit.material?{material:debit.material}:{}),required:debit.amount.toString(),available:available.toString()});}
 const next=canonicalState(state);for(const owner of intent.createOwners)next.owners[owner]={materials:{},energy:'0'};
 for(const t of intent.transfers){const from=next.owners[t.from],to=next.owners[t.to],amount=BigInt(t.amount);if(t.kind==='energy'){from.energy=(BigInt(from.energy)-amount).toString();to.energy=(BigInt(to.energy)+amount).toString()}else{from.materials[t.material]=(BigInt(stockCount(from.materials,t.material))-amount).toString();to.materials[t.material]=(BigInt(stockCount(to.materials,t.material))+amount).toString()}}
 next.sequence=(BigInt(next.sequence)+1n).toString();const receipt={sequence:next.sequence,intent};next.applied[intent.id]=clone(receipt);const committed=canonicalState(next);const before=tissueLedgerTotals(state),after=tissueLedgerTotals(committed);if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Internal tissue transfer conservation failure');return{ok:true,replayed:false,state:committed,receipt:clone(receipt)};
}
