// Presentation only: keep a finite region visible when its controlled
// resident lives near an edge. Never move creatures or alter world topology.
export function clampCameraToWorld(camera,n,width,height,tile){
 const axis=(value,pixels)=>{const half=pixels/(2*tile);return half*2>=n?n/2:Math.max(half,Math.min(n-half,value));};
 camera.x=axis(camera.x,width);camera.y=axis(camera.y,height);
 return camera;
}
