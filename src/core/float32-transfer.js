// Exact debit from an existing nonnegative Float32 stock. Rounding must never
// exceed the requested budget; sub-quantum transfers may correctly do no work.
const bits=new DataView(new ArrayBuffer(4));
export function boundedFloat32Debit(before,requested){
 if(!Number.isFinite(before)||before<0||Math.fround(before)!==before||!Number.isFinite(requested)||requested<0)throw Error('Invalid finite Float32 debit.');
 const wanted=Math.min(before,requested);let remaining=Math.fround(before-wanted);
 if(before-remaining>wanted){bits.setFloat32(0,remaining);bits.setUint32(0,bits.getUint32(0)+1);remaining=bits.getFloat32(0)}
 return{remaining,amount:before-remaining};
}
