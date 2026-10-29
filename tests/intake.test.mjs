import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import intake from '../intake/worker.mjs';
const T='a'.repeat(64);
const URL='https://personal-device-lab-intake.automice2095.workers.dev';
const digest=x=>createHash('sha256').update(x).digest('hex');
class KV {
 constructor(){this.map=new Map;this.ttls=[]}
 async get(k){return this.map.get(k)??null}
 async put(k,v,options){this.map.set(k,v);this.ttls.push({k,ttl:options?.expirationTtl})}
}
function env(){const kv=new KV();kv.map.set('permit:'+digest(T),'active');return {INTAKE_KV:kv}}
function report(){return {schema:'personal-device-lab/v1',version:'0.2.0',visitorId:'not-for-upload',privacy:{visitorIdentifier:'secret-visitor'},items:[{id:'net-出口 IP',label:'出口 IP',value:'198.51.100.34',status:'PASS',source:'test'},{id:'browser-ua',label:'User Agent',value:'synthetic',status:'PASS',source:'test'}]}}
function upForm(slot,doc,extra={}){
 const f=new FormData();
 f.set('ticket',extra.ticket??T);f.set('slot',slot);
 f.set('keepVisitor',extra.keepVisitor?'1':'0');
 f.set('file',new File([typeof doc==='string'?doc:JSON.stringify(doc)],extra.filename??'sample.json',{type:'application/json'}));
 return new Request(URL+'/api/upload',{method:'POST',body:f});
}
test('public HTML intentionally does not embed private ticket',async()=>{const r=await intake.fetch(new Request(URL+'/'),env());assert.equal(r.status,200);const text=await r.text();assert.match(text,/设备检测报告上传/);assert.doesNotMatch(text,/a{64}/);assert.match(r.headers.get('cache-control'),/no-store/)});
test('health endpoint does not return submitted data',async()=>{const r=await intake.fetch(new Request(URL+'/api/health'),env());assert.equal(r.status,200);assert.equal((await r.json()).temporaryKV,true)});
test('unknown public retrieval endpoints are unavailable',async()=>{const r=await intake.fetch(new Request(URL+'/api/reports'),env());assert.equal(r.status,404)});
test('upload rejects invalid ticket',async()=>{const r=await intake.fetch(upForm('android-v1',report(),{ticket:'b'.repeat(64)}),env());assert.equal(r.status,403)});
test('upload rejects unapproved file extension',async()=>{const r=await intake.fetch(upForm('android-v1',report(),{filename:'secrets.bin'}),env());assert.equal(r.status,415)});
test('upload rejects wrong JSON schema',async()=>{const r=await intake.fetch(upForm('android-v1',{schema:'something-else',items:[]}),env());assert.equal(r.status,422)});
test('JSON report stored only under ticket hash, and IP and ID redacted',async()=>{const e=env();const r=await intake.fetch(upForm('android-v1',report()),e);assert.equal(r.status,200);const a=await r.json();assert.deepEqual({slot:a.slot,kind:a.kind},{slot:'android-v1',kind:'json'});const raw=await e.INTAKE_KV.get('report:'+digest(T)+':android-v1');assert.ok(raw);assert.ok(!raw.includes('198.51.100.34'));assert.ok(!raw.includes('not-for-upload'));assert.ok(!raw.includes('secret-visitor'));const saved=JSON.parse(raw);assert.equal(saved.payload.items[0].value,'[REDACTED]');assert.equal(saved.keepVisitorId,false);assert.equal(e.INTAKE_KV.ttls[0].ttl,604800)});
test('explicit visitor ID opt in still redacts exit IP',async()=>{const e=env();const r=await intake.fetch(upForm('android-v2',report(),{keepVisitor:true}),e);assert.equal(r.status,200);const saved=JSON.parse(await e.INTAKE_KV.get('report:'+digest(T)+':android-v2'));assert.equal(saved.payload.visitorId,'not-for-upload');assert.equal(saved.payload.items[0].value,'[REDACTED]')});
test('status contains slot labels only, never report content',async()=>{const e=env();await intake.fetch(upForm('windows',report()),e);const r=await intake.fetch(new Request(URL+'/api/status',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ticket:T})}),e);assert.equal(r.status,200);const t=await r.text();assert.match(t,/windows/);assert.doesNotMatch(t,/198.51.100.34|not-for-upload|synthetic/);assert.equal(JSON.parse(t).missing.length,2)});
test('unsupported or extra slots cannot write',async()=>{const e=env();const r=await intake.fetch(upForm('device-4',report()),e);assert.equal(r.status,400);assert.equal(e.INTAKE_KV.ttls.length,0)});
test('file exceeding JSON limit returns 413',async()=>{const e=env();const big={...report(),items:[{id:'big',label:'long',value:'x'.repeat(520000)}]};const r=await intake.fetch(upForm('windows',big),e);assert.equal(r.status,413)});
test('PDF fake extension is not accepted as a PDF',async()=>{const e=env();const r=await intake.fetch(upForm('windows','NOT A PDF',{filename:'a.pdf'}),e);assert.equal(r.status,422)});
