import assert from 'node:assert/strict';
import {processingNoticeModel} from '../docs/art/processing-notice-v1-handoff/processing-notice-view.mjs';
const status=Object.freeze({exceeded:true,load:Object.freeze({pendingSeconds:.8,regionalWork:false})}),message='Processing capacity warning - 195 living organisms, 0 eggs. All offspring are retained.';
assert.equal(processingNoticeModel(status,''),null,'canonical message alone owns visibility');const before=JSON.stringify(status),model=processingNoticeModel(status,message);assert.equal(model.detail,message);assert.equal(model.title,'The world is busy');assert.equal(JSON.stringify(status),before);assert.ok(!/resume|ready|safe|surviv/i.test(model.body));assert.equal(processingNoticeModel({load:{regionalWork:true}},message).title,'Life beyond this view');
console.log('Processing notice candidate PASS: original message visibility/detail preserved, immutable status and no invented completion/recovery promise. No live integration.');
