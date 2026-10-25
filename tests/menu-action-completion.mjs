import assert from 'node:assert/strict';
import {FrontEnd} from '../src/ui/front-end.js';
for(const [action,screen,callback] of [['continue','home','onContinue'],['create','new','onCreate'],['load-world','worlds','onLoad']])for(const mode of ['same-screen','newer-pause','unsuccessful']){
 let settle,closed=0,calls=0;const pending=new Promise(r=>settle=r),button={dataset:{action,slot:'retained-world'}},fields={'#newWorldName':{value:'Existing name'},'#newWorldSeed':{value:'existing-seed'},'#newWorldStartingPoint':{value:'new'},'#newWorldGeography':{value:'planetary/1'},'#newWorldCreature':{value:'recorded'}};
 const ui=Object.assign(Object.create(FrontEnd.prototype),{screen,open:true,busy:false,audio:{unlock(){}},el:{contains:b=>b===button,querySelector:q=>fields[q]||null},startingPointsReady:Promise.resolve(),setMessage(){},close(){closed++;this.open=false},[callback]:async()=>{calls++;return pending}});
 const click=ui.click({target:{closest:()=>button},preventDefault(){}});await Promise.resolve();await Promise.resolve();assert.equal(calls,1);assert.equal(ui.busy,true);if(mode==='newer-pause')ui.screen='pause';settle(mode!=='unsuccessful');await click;assert.equal(closed,mode==='same-screen'?1:0);assert.equal(ui.busy,false);if(mode==='newer-pause'){assert.equal(ui.screen,'pause');assert.equal(ui.open,true)}
}
console.log('Menu action completion PASS: continue/create/load close their original screen, preserve newer pause and do not close on unsuccessful callbacks.');
