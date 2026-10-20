import {CreatureEditor} from './creature-editor.js';
import {FounderDesign} from '../lineage/founder-design.js';
import {prepareAuthoredFounders,installAuthoredFounders} from '../persistence/authored-founders.js';

// Reuse the actual modular creature editor. No replacement biology or live
// next-generation controller is installed to impersonate a pending litter.
export function chooseAuthoredFounder(sim,mode){
 const members=prepareAuthoredFounders(sim),design=new FounderDesign(mode);
 return new Promise(resolve=>{
  const cleanup=()=>{removeEventListener('keydown',key,true);editor.close();editor.el.remove();editor.ghost.remove()};
  const editor=new CreatureEditor({getSim:()=>sim,id:'founderEditor',onDone:result=>{cleanup();resolve(result.ok?{members,record:result.record}:null)}});
  editor.el.style.zIndex='70';
  const key=event=>{if(editor.handleKey(event)){event.preventDefault();event.stopImmediatePropagation()}};
  addEventListener('keydown',key,true);
  const session={draft:design.draft,parent:members[0],title:mode==='guided'?'Design your founder':'Sandbox founder',
   kicker:mode==='guided'?'AUTHORED START · GUIDED PRECURSORS':'AUTHORED START · UNRESTRICTED ANCESTRY',
   description:mode==='guided'?'Build viable precursor steps, recording each to unlock later anatomy. These are authored design steps, not elapsed generations.':'All ancestry and relic locks are open. Shared sockets, body support, feeding and sight rules still apply.',
   ...(mode==='guided'?{advance:d=>design.advance(d)}:{}),
   exportDesign:d=>{
    const result=design.finish(d);if(!result.ok)return result;
    const blob=new Blob([JSON.stringify({format:'genvo.authored-creature/1',design:result.record})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='genvo-'+mode+'-creature.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);return{ok:true};
   },
   importDesign:()=>new Promise(done=>{
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;document.body.append(input);
    const finish=result=>{input.remove();done(result)};input.addEventListener('cancel',()=>finish(null),{once:true});
    input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return finish(null);if(file.size>8*1024*1024)throw Error('Creature design exceeds the supported import size.');
      const bundle=JSON.parse(await file.text());if(bundle.format!=='genvo.authored-creature/1')throw Error('Unsupported creature design package.');
      finish({ok:true,draft:design.load(bundle.design)});
     }catch(error){finish({ok:false,problems:[error.message]})}};
    input.click();
   }),
   commit:d=>{
    const result=design.finish(d);if(!result.ok)return result;
    try{installAuthoredFounders(sim,members,result.record);return result}
    catch(error){return{ok:false,problems:[error.message]}}
   }};
  editor.requestSession(session);
 });
}
