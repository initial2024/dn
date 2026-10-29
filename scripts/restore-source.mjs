import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const bundled=readFileSync(resolve(root,'worker.mjs'),'utf8');
const marker="const VERSION=";
const start=bundled.indexOf(marker);
if(start<0)throw new Error('missing source marker: refuse reconstruction');
const prefix=bundled.slice(0,start);
const match=prefix.match(/atob\('([A-Za-z0-9+/=]+)'\)/);
if(!match)throw new Error('missing gzip source: refuse reconstruction');
const html=gunzipSync(Buffer.from(match[1],'base64')).toString('utf8');
if(!html.startsWith('<!DOCTYPE html>')&&!html.startsWith('<!doctype html>'))throw new Error('unexpected HTML: refuse reconstruction');
const core=bundled.slice(start);
if(!core.includes('new Response(await pageHtml(),{headers:'))throw new Error('unexpected Worker layout: refuse reconstruction');
const readable="// Personal Device Lab Worker. HTML is bundled at build time.\nimport html from './embedded-html.mjs';\n"+
 core.replace('new Response(await pageHtml(),{headers:','new Response(html,{headers:');
mkdirSync(resolve(root,'src'),{recursive:true});
writeFileSync(resolve(root,'src/index.html'),html);
writeFileSync(resolve(root,'src/worker.mjs'),readable);
writeFileSync(resolve(root,'src/embedded-html.mjs'),'export default '+JSON.stringify(html)+';\n');
console.log('RESTORE_SOURCE=PASS HTML_BYTES='+Buffer.byteLength(html)+' CORE_BYTES='+Buffer.byteLength(readable));
