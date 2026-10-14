// A multi-organ flank socket is a mounting region, not a pile of identical pivots.
// Share its available body span among actual mounted instances of any part type.
export function flankInstanceOffset(index,count,bodyW,bodyH){
 if(count<2)return 0;
 const spacing=Math.min(1.8,Math.min(bodyW,bodyH)*.70/(count-1));
 return(index-(count-1)/2)*spacing;
}
