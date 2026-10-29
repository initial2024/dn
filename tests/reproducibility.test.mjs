import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
function text(path){return readFileSync(new URL(path,root),'utf8')}
const sha=s=>createHash('sha256').update(s).digest('hex');

test('rebuild from editable source equals frozen deployed Worker byte-for-byte',()=>{
 const compiled=text('dist/worker.deployment.mjs');
 const frozen=text('worker.mjs');
 assert.equal(compiled,frozen,`source drift: compiled=${sha(compiled)} frozen=${sha(frozen)}`);
});
test('editable HTML source is versioned and nonempty',()=>{
 const html=text('src/index.html');
 assert.ok(html.length>24000);
 assert.match(html,/<html lang="zh-CN"/);
 assert.match(html,/DSH/);
});
test('editable backend avoids persistent server bindings',()=>{
 const source=text('src/worker.mjs');
 const cfg=text('wrangler.toml');
 assert.match(source,/const VERSION='0\.1\.0'/);
 assert.doesNotMatch(cfg,/\bkv_namespaces\b|\bd1_databases\b|\broutes\s*=/);
});
