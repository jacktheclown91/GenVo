import assert from 'node:assert/strict';
import {informationNavigationEvent} from '../src/ui/information-input.js';
const target=(...matches)=>({closest:selector=>selector.split(',').some(s=>matches.includes(s))?{}:null});
const panel=target('.detail-panel'),field=target('.detail-panel','input'),world=target();
for(const code of ['PageDown','ArrowDown','Home','End','Enter','Space','Tab'])assert.equal(informationNavigationEvent({type:'keydown',code,target:panel}),true);
assert.equal(informationNavigationEvent({type:'keyup',code:'Space',target:panel}),true);
assert.equal(informationNavigationEvent({type:'keydown',code:'KeyW',target:field}),true,'typing in a panel field stays native');
for(const event of [{type:'click',code:'Enter',target:panel},{type:'pointerdown',code:'Space',target:panel},{type:'keydown',code:'Escape',target:panel},{type:'keydown',code:'KeyL',target:panel},{type:'keydown',code:'PageDown',target:world},{type:'keydown',code:'KeyW',target:world}])assert.equal(informationNavigationEvent(event),false,'preserve pointer barriers, Escape, letter shortcuts and world controls');
console.log('Information input boundary PASS: native panel navigation/typing, retained pointer barriers and world shortcuts.');

const command=target('#interactionDock');
for(const code of ['Tab','Enter','Space'])for(const type of ['keydown','keyup'])assert.equal(informationNavigationEvent({type,code,target:command}),true,'native command navigation is never replayed as untrusted keyboard input');
assert.equal(informationNavigationEvent({type:'keydown',code:'ArrowDown',target:command}),false,'directional world movement remains available after clicking a HUD command');
assert.equal(informationNavigationEvent({type:'click',code:'Enter',target:command}),false,'actual command click retains the existing tick barrier');
