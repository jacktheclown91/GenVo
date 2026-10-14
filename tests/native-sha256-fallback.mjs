import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {sha256Bytes} from '../src/render/sha256-bytes.js';
for(const len of [0,1,3,15,55,56,63,64,65,123,256,4096,65536]){
 const data=crypto.randomBytes(len);
 const result=Buffer.from(sha256Bytes(data)).toString('hex');
 const expected=crypto.createHash('sha256').update(data).digest('hex');
 assert.equal(result,expected,'SHA-256 for '+len+' bytes');
}
assert.equal(Buffer.from(sha256Bytes(new TextEncoder().encode('abc'))).toString('hex'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
console.log('native-sha256-fallback: WebCrypto-compatible SHA256 digest for 14 vectors PASS');
