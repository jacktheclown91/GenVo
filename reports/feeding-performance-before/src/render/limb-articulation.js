// Presentation-only articulation. Each mounted limb bends behind its contact
// axis; paired legs mirror across the creature rather than curling by slot parity.
export function articulatedKnee({root,foot,forward,perp,side=0,liftAmount=0}){
 const bend=1.45*(1-liftAmount*.25),spread=Math.sign(side)*Math.min(1,Math.abs(side))*.35;
 return{x:root.x+(foot.x-root.x)*.52-forward.x*bend+perp.x*spread,
 y:root.y+(foot.y-root.y)*.52-forward.y*bend+perp.y*spread};
}
