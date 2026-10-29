import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
const segment=html.match(/\/\/ PDL_LOCAL_VISITOR_V1_BEGIN([\s\S]*?)\/\/ PDL_LOCAL_VISITOR_V1_END/);
assert.ok(segment,'visitor opt-in helpers are included in the production HTML');
function sandbox(stored=new Map()){
 const localStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,String(v)),removeItem:k=>stored.delete(k)};
 const vmctx=vm.createContext({crypto:webcrypto,Uint8Array,Array,localStorage,STORE:'pdl-reports-v1',Error});
 vm.runInContext(segment[1],vmctx);
 return {ctx:vmctx,stored,eval:expr=>vm.runInContext(expr,vmctx)};
}
test('no identifier exists before explicit user opt in',()=>{
 const x=sandbox();assert.equal(x.eval('readVisitorId()'),null);assert.equal(x.stored.size,0);
});
test('opt-in uses random 128-bit hexadecimal local browser ID and stays stable',()=>{
 const x=sandbox();const a=x.eval('enableVisitorId()');assert.match(a,/^pdl_[0-9a-f]{32}$/);assert.equal(x.eval('enableVisitorId()'),a);assert.equal(x.stored.get('pdl-visitor-id-v1'),a);
});
test('opt-in ID resets to a new random value',()=>{
 const x=sandbox();const prev=x.eval('enableVisitorId()');x.eval('localStorage.removeItem(VISITOR_KEY)');const next=x.eval('enableVisitorId()');assert.notEqual(prev,next);
});
test('legacy, invalid or spoofed identifiers are not trusted as stored ID',()=>{
 const x=sandbox(new Map([['pdl-visitor-id-v1','__proto__'],['pdl-reports-v1','[]']]));assert.equal(x.eval('readVisitorId()'),null);assert.match(x.eval('enableVisitorId()'),/^pdl_[a-f0-9]{32}$/);
});
test('forgetting strips identifiers from local saved reports before clearing',()=>{
 const x=sandbox();const id=x.eval('enableVisitorId()');const saved=[{visitorId:id,privacy:{visitorIdLocalOnly:true,serverPersistence:false},items:[]}];x.stored.set('pdl-reports-v1',JSON.stringify(saved));
 x.eval('scrubVisitorHistory();localStorage.removeItem(VISITOR_KEY)');const updated=JSON.parse(x.stored.get('pdl-reports-v1'));
 assert.equal(x.eval('readVisitorId()'),null);assert.equal(updated[0].visitorId,undefined);assert.equal(updated[0].privacy.visitorIdLocalOnly,undefined);assert.equal(updated[0].privacy.serverPersistence,false);
});
test('report metadata may be scrubbed without mutating readings',()=>{
 const x=sandbox();const r=x.eval('scrubVisitorFromReport({visitorId:"private",privacy:{visitorIdLocalOnly:true,serverPersistence:false},items:[{id:"browser"}]})');
 assert.equal(r.visitorId,undefined);assert.equal(r.items[0].id,'browser');
});
test('storage failure does not fabricate successful persistent visitor identity',()=>{
 const x=sandbox();const bad=vm.createContext({crypto:webcrypto,Uint8Array,Array,localStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){}},STORE:'pdl-reports-v1',Error});vm.runInContext(segment[1],bad);assert.equal(vm.runInContext('readVisitorId()',bad),null);assert.throws(()=>vm.runInContext('enableVisitorId()',bad),/blocked/);
});
test('tracking request endpoint and fingerprint SDK are never included in HTML',()=>{
 assert.ok(!html.includes('fingerprintjs')&&!html.includes('amplitude.com'));
 assert.ok(html.includes('本地访客标识')&&html.includes('visitor-optin'));
 assert.ok(html.includes('localStorage.removeItem(VISITOR_KEY)'));
});
