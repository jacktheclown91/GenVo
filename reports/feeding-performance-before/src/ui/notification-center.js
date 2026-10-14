export class NotificationQueue{
 constructor(){this.channels=new Map(['critical','progress','action'].map(k=>[k,[]]))}
 post(channel,notice){const queue=this.channels.get(channel)||this.channels.get('action');if(channel==='action')queue.length=0;if(queue.some(n=>n.text===notice.text))return;queue.push(notice);if(queue.length>8)queue.splice(1,1)}
 take(channel){return this.channels.get(channel)?.shift()}
}
export class NotificationCenter{
 constructor(actionElement){this.queue=new NotificationQueue();this.root=document.createElement('aside');this.root.id='notificationStack';this.root.setAttribute('aria-label','World feedback');document.querySelector('#app').append(this.root);this.lanes=new Map();for(const channel of ['critical','progress','action']){const el=channel==='action'?actionElement:document.createElement('div');el.hidden=true;el.classList.add('notice-lane');el.dataset.channel=channel;el.setAttribute('role',channel==='critical'?'alert':'status');this.root.append(el);this.lanes.set(channel,{el,active:false})}}
 post(text,ms,tone,channel='action'){if(channel==='action'){const lane=this.lanes.get(channel);clearTimeout(lane.timer);lane.active=false}if(this.lanes.get(channel)?.active&&this.lanes.get(channel).el.textContent===text)return;this.queue.post(channel,{text,ms,tone});this.advance(channel)}
 advance(channel){const lane=this.lanes.get(channel);if(lane.active)return;const notice=this.queue.take(channel);if(!notice){lane.el.hidden=true;return}lane.active=true;lane.el.textContent=notice.text;lane.el.dataset.tone=notice.tone;lane.el.hidden=false;this.layout(true);lane.timer=setTimeout(()=>{lane.active=false;lane.el.hidden=true;this.advance(channel);this.layout(true)},notice.ms)}
 clear(){for(const [channel,lane] of this.lanes){clearTimeout(lane.timer);lane.active=false;lane.el.hidden=true;this.queue.channels.get(channel).length=0}this.root.hidden=true}
 layout(force=false){const root=this.root;if(![...this.lanes.values()].some(l=>!l.el.hidden)){root.hidden=true;return}root.hidden=false;if(!force&&performance.now()-(this.lastLayout||0)<120)return;this.lastLayout=performance.now();
 const obstacles=[...document.querySelectorAll('.context-radial:not([hidden]) button,.context-radial:not([hidden]) .radial-explanation:not([hidden]),#stageUtilities>button,#stageUtilities #quickMenu:not([hidden]),#tutorial:not([hidden]),.knowledge-panel:not([hidden]),.journal-page,#interactionDock:not([hidden])')].map(e=>e.getBoundingClientRect());
 const w=Math.min(260,innerWidth-20),h=root.getBoundingClientRect().height,dock=document.querySelector('#interactionDock')?.getBoundingClientRect(),bottom=Math.max(10,(dock?.top||innerHeight)-h-10);
 const candidates=[[10,10],[innerWidth-w-10,110],[10,bottom],[innerWidth-w-10,bottom]];
 const score=([x,y])=>obstacles.reduce((n,r)=>n+Math.max(0,Math.min(x+w,r.right+6)-Math.max(x,r.left-6))*Math.max(0,Math.min(y+h,r.bottom+6)-Math.max(y,r.top-6)),0);
 const [x,y]=candidates.sort((a,b)=>score(a)-score(b))[0];root.style.left=x+'px';root.style.top=y+'px';
 }
}
