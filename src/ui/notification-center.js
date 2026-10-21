import {chooseOverlayPlacement,gameplayProtectedRects,overlapArea} from './overlay-placement.js';
export class NotificationQueue{
 constructor(){this.channels=new Map(['critical','progress','action'].map(k=>[k,[]]))}
 post(channel,notice){const queue=this.channels.get(channel)||this.channels.get('action');if(channel==='action')queue.length=0;if(queue.some(n=>n.text===notice.text))return;queue.push(notice);if(queue.length>8)queue.splice(1,1)}
 take(channel){return this.channels.get(channel)?.shift()}
}
export class NotificationCenter{
 constructor(actionElement,{renderer=null}={}){this.renderer=renderer;this.queue=new NotificationQueue();this.root=document.createElement('aside');this.root.id='notificationStack';this.root.setAttribute('aria-label','World feedback');document.querySelector('#app').append(this.root);this.lanes=new Map();for(const channel of ['critical','progress','action']){const el=channel==='action'?actionElement:document.createElement('div');el.hidden=true;el.classList.add('notice-lane');el.dataset.channel=channel;el.setAttribute('role',channel==='critical'?'alert':'status');this.root.append(el);this.lanes.set(channel,{el,active:false})}}
 post(text,ms,tone,channel='action'){if(channel==='action'){const lane=this.lanes.get(channel);clearTimeout(lane.timer);lane.active=false}if(this.lanes.get(channel)?.active&&this.lanes.get(channel).el.textContent===text)return;this.queue.post(channel,{text,ms,tone});this.advance(channel)}
 advance(channel){const lane=this.lanes.get(channel);if(lane.active)return;const notice=this.queue.take(channel);if(!notice){lane.el.hidden=true;return}lane.active=true;lane.el.textContent=notice.text;lane.el.dataset.tone=notice.tone;lane.el.hidden=false;this.layout(true);lane.timer=setTimeout(()=>{lane.active=false;lane.el.hidden=true;this.advance(channel);this.layout(true)},notice.ms)}
 clear(){for(const [channel,lane] of this.lanes){clearTimeout(lane.timer);lane.active=false;lane.el.hidden=true;this.queue.channels.get(channel).length=0}this.root.hidden=true}
 layout(force=false){const root=this.root;if(![...this.lanes.values()].some(l=>!l.el.hidden)){root.hidden=true;return}root.hidden=false;const protectedRects=gameplayProtectedRects(this.renderer),current=root.getBoundingClientRect();if(!force&&performance.now()-(this.lastLayout||0)<120&&!protectedRects.some(r=>overlapArea(current,r)))return;this.lastLayout=performance.now();
 const obstacles=[...document.querySelectorAll('.context-radial:not([hidden])>*:not([hidden]),#stageUtilities>button,#stageUtilities #quickMenu:not([hidden]),#tutorial:not([hidden]),.knowledge-panel:not([hidden]),.journal-page,#interactionDock:not([hidden])')].map(e=>e.getBoundingClientRect());
 const bounds=root.getBoundingClientRect(),dock=document.querySelector('#interactionDock')?.getBoundingClientRect(),viewport={left:0,top:0,right:innerWidth,bottom:Math.max(bounds.height+20,Math.min(innerHeight,dock?.top||innerHeight)-8)};
 const placed=chooseOverlayPlacement({width:bounds.width,height:bounds.height,viewport,preferred:{left:10,top:10},previous:{left:current.left,top:current.top},protectedRects,obstacles});root.style.left=placed.left+'px';root.style.top=placed.top+'px';
 }
}
