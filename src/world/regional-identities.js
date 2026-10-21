// Durable scheduling/identity metadata, derived from the existing owner. This
// is neither an organism inventory nor an alternative ecological simulation.
export const REGIONAL_IDENTITIES='regional-identities/1';
const natural=n=>Number.isSafeInteger(n)&&n>=0;
export function validateRegionalIdentity(header){
 if(header?.schema!==1||!natural(header.tick)||!natural(header.day)||header.day<1||!natural(header.nextId)||header.nextId<1||!Array.isArray(header.ids)||!natural(header.living)||header.living>header.ids.length||!(header.mode===null||typeof header.mode==='string'))throw Error('Invalid regional identity header.');
 let last=0;for(const id of header.ids){if(!Number.isSafeInteger(id)||id<=last||id>=header.nextId)throw Error('Duplicate or invalid regional identity header ID.');last=id;}
 return header;
}
export function regionalIdentity(snapshot,{mode=null}={}){
 if(!Array.isArray(snapshot?.animals))throw Error('Regional identity requires an owned animal collection.');
 return validateRegionalIdentity({schema:1,tick:snapshot.core?.tickCount,day:snapshot.core?.day,nextId:snapshot.core?.nextId,mode,ids:snapshot.animals.map(a=>a.id).sort((a,b)=>a-b),living:snapshot.animals.filter(a=>a.alive).length});
}
export function verifyRegionalIdentity(header,snapshot,options){
 validateRegionalIdentity(header);const actual=regionalIdentity(snapshot,options);
 if(['tick','day','nextId','mode','living'].some(k=>actual[k]!==header[k])||actual.ids.length!==header.ids.length||actual.ids.some((id,i)=>id!==header.ids[i]))throw Error('Regional identity header does not match its owned payload.');
}
export function regionalIdentityWatermark(headers){
 const seen=new Set();let nextId=1;
 for(const header of headers){validateRegionalIdentity(header);nextId=Math.max(nextId,header.nextId);for(const id of header.ids){if(seen.has(id))throw Error('Duplicate planetary identity in regional directory.');seen.add(id);}}
 return nextId;
}
