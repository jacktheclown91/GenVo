// Mouse navigation supplies ordinary control input; movement, energy, terrain,
// collisions and swimming remain owned by Simulation.playerControlStep.
export class PointerApproach{
 constructor({getSim,blocked}){this.getSim=getSim;this.blocked=blocked;this.cancel()}
 cancel(){this.onInterrupted=null;this.ready=null;this.onArrival=null;this.path=null;this.world=null;this.actor=null}
 route(goal){const sim=this.getSim(),a=sim.player();if(!a?.alive||!goal||!sim.world.isPlayable(goal.x,goal.y))return null;
 const n=sim.world.n,idx=(x,y)=>Math.floor(y)*n+Math.floor(x),start=idx(a.x,a.y),end=idx(goal.x,goal.y),prev=new Int32Array(n*n);prev.fill(-1);const queue=[start];prev[start]=start;
 for(let q=0;q<queue.length&&prev[end]<0;q++){const i=queue[q],x=i%n,y=Math.floor(i/n);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,j=ny*n+nx;if(nx<0||ny<0||nx>=n||ny>=n||prev[j]>=0||!sim.canOccupy(a,nx+.5,ny+.5))continue;prev[j]=i;queue.push(j)}}
 if(prev[end]<0)return null;const path=[];for(let i=end;i!==start;i=prev[i])path.push({x:i%n+.5,y:Math.floor(i/n)+.5});path.reverse();if(!path.length)path.push(goal);return path;
 }
 availability(goal){const sim=this.getSim();if(sim.paused||this.blocked())return{enabled:false,reason:'Resume gameplay first.'};return this.route(goal)?{enabled:true,reason:'Walk to this target.'}:{enabled:false,reason:'No walkable route to that target.'}}
 start(goal,onArrival=null,{ready=null,onInterrupted=null}={}){const sim=this.getSim(),a=sim.player();if(!a||sim.paused||this.blocked())return{ok:false,message:'Resume gameplay first.'};const path=this.route(goal);if(!path)return{ok:false,message:'No walkable route to that target.'};this.onArrival=onArrival;this.ready=ready;this.onInterrupted=onInterrupted;this.path=path;this.world=sim;this.actor=a;this.lastPosition={x:a.x,y:a.y};this.stuck=0;return{ok:true,type:'approach',message:'Approaching. Movement keys cancel the route.'};
 }

 interrupt(message){const notify=this.onInterrupted;this.cancel();notify?.(message)}
 read(manual={}){if(Object.values(manual).some(Boolean)){this.cancel();return manual}const sim=this.getSim(),a=sim.player();if(!this.path)return manual;if(this.world!==sim||this.actor!==a||!a?.alive||sim.paused||this.blocked()){this.interrupt('Approach interrupted.');return manual}
 if(this.ready?.()){const complete=this.onArrival;this.cancel();complete?.();return manual}
 while(this.path.length&&Math.hypot(a.x-this.path[0].x,a.y-this.path[0].y)<.22)this.path.shift();if(!this.path.length){const complete=this.onArrival;this.onArrival=null;this.cancel();complete?.();return manual}const next=this.path[0];if(!sim.canOccupy(a,next.x,next.y)){this.interrupt('The route is no longer walkable.');return manual}
 if(Math.hypot(a.x-this.lastPosition.x,a.y-this.lastPosition.y)<.0001)this.stuck++;else this.stuck=0;this.lastPosition={x:a.x,y:a.y};if(this.stuck>180){this.interrupt('The route is blocked.');return manual}return{...manual,up:next.y<a.y-.14,down:next.y>a.y+.14,left:next.x<a.x-.14,right:next.x>a.x+.14};
 }
}
