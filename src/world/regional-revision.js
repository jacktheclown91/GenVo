// Nonserialized publication generations. An in-place change to an inactive
// canonical owner must advance this before a save can retain its old record.
const revisions=new WeakMap();
export const regionalOwnerRevision=owner=>revisions.get(owner)||0;
export function markRegionalOwnerDirty(owner){
 const next=regionalOwnerRevision(owner)+1;if(!Number.isSafeInteger(next))throw Error('Regional publication generation exhausted.');
 revisions.set(owner,next);return next;
}
