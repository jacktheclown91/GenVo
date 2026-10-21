// Presentation only: keep a finite region visible when its controlled
// resident lives near an edge. Never move creatures or alter world topology.
// `open` (planetary worlds) keeps the camera centred: neighbouring regions'
// real terrain is drawn beyond the border instead.
export function clampCameraToWorld(camera,n,width,height,tile,{open=false}={}){
 if(open)return camera;
 const axis=(value,pixels)=>{const half=pixels/(2*tile);return half*2>=n?n/2:Math.max(half,Math.min(n-half,value));};
 camera.x=axis(camera.x,width);camera.y=axis(camera.y,height);
 return camera;
}
