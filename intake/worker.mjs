// Personal Device Lab private intake: independent from production detector.
// This source contains NO invite tokens. Only own Workers KV receives submissions.
const SLOTS=['android-v1','android-v2','windows'];
const MAX_BODY=2600000, MAX_IMAGE=2000000, MAX_JSON=500000, TTL=604800;
const HEADERS={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=()','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"};
const PAGE=[
"<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"referrer\" content=\"no-referrer\"><meta name=\"color-scheme\" content=\"dark\"><title>设备检测报告 · 私密临时上传</title>",
"<style>body{font:16px/1.6 system-ui,-apple-system,sans-serif;background:#0b1324;color:#eef3ff;padding:16px;margin:0}main{max-width:650px;margin:auto}article{background:#16253e;border:1px solid #354766;border-radius:16px;padding:18px;margin:16px 0}button,select,input{font:inherit}button{background:#3988ff;color:white;border:0;border-radius:11px;padding:12px 20px;cursor:pointer}button:disabled{opacity:.5}select,input[type=file]{width:100%;padding:12px 0;color:inherit}select{background:#203753;border:1px solid #456080;border-radius:8px}a{color:#91bcff}.muted{color:#b7c8e0;font-size:14px}label{display:block;margin:14px 0}#result{white-space:pre-wrap;word-break:break-word}strong{color:#7ce5c9}</style></head><body><main><h1>设备检测报告上传</h1>",
"<p class=\"muted\">仅用于比较你主动上传的 3 份报告：手机版一、手机版二、Windows 电脑。本入口与现有设备检测网站分离；不会自动扫描设备或读取其他文件。</p>",
"<article><h2>选择报告</h2><label>报告来源<select id=\"slot\"><option value=\"android-v1\">手机 · 第一版</option><option value=\"android-v2\">手机 · 第二版</option><option value=\"windows\">Windows · 电脑</option></select></label><label>本机选择文件（推荐 JSON；也支持 TXT、PNG/JPEG/WebP、PDF，图片或 PDF 请自行检查是否含隐私）<input type=\"file\" id=\"file\" accept=\".json,.txt,.png,.jpg,.jpeg,.webp,.pdf,application/json,text/plain,image/png,image/jpeg,image/webp,application/pdf\"></label><label><input type=\"checkbox\" id=\"keepVisitor\"> 明确允许保留 JSON 中的本地访客标识（默认不保留）</label><button id=\"upload\">手动上传这份报告</button><p id=\"result\" role=\"status\">未上传</p></article>",
"<article><h2>隐私与期限</h2><p>JSON 中的完整出口 IP 始终会被删除；访客 ID 默认删除。截图和 PDF 的可见文字无法自动脱敏，请先检查。</p><p>上传文件由 Cloudflare Workers KV 临时保存，<strong>7 天自动过期</strong>，不公开提供下载接口。上传授权链接有效期 48 小时；请勿转发本链接。</p><button id=\"status\">查看已上传的类别</button><p id=\"progress\" class=\"muted\"></p></article>",
"<p class=\"muted\">如果链接失效或你已经完成三份上传，只需返回聊天告诉 ChatGPT“已上传”，不必把检测内容粘贴进聊天。</p></main>",
"<script>'use strict';const get=id=>document.getElementById(id);const ticket=decodeURIComponent(location.hash.replace(/^#/,''));if(!ticket||ticket.length<40){get('upload').disabled=true;get('status').disabled=true;get('result').textContent='链接缺少授权标识，请使用聊天中提供的完整私密链接。'}",
"get('upload').onclick=async()=>{const file=get('file').files[0];if(!file){get('result').textContent='请先选择文件';return;}if(file.size>2000000){get('result').textContent='单个文件不能超过 2MB；优先导出 JSON';return;}get('upload').disabled=true;get('result').textContent='正在上传所选文件…';try{const fd=new FormData();fd.set('ticket',ticket);fd.set('slot',get('slot').value);fd.set('keepVisitor',get('keepVisitor').checked?'1':'0');fd.set('file',file);const r=await fetch('/api/upload',{method:'POST',body:fd,cache:'no-store'});const x=await r.json();if(!r.ok)throw Error(x.error||'HTTP '+r.status);get('result').textContent='已保存：'+x.slot+'（'+x.kind+'），将在 7 天后自动清除。';get('file').value='';}catch(e){get('result').textContent='上传失败：'+e.message;}finally{get('upload').disabled=false;}};",
"get('status').onclick=async()=>{get('progress').textContent='正在检查…';try{const r=await fetch('/api/status',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ticket}),cache:'no-store'});const x=await r.json();if(!r.ok)throw Error(x.error||'HTTP '+r.status);get('progress').textContent='已收到：'+x.uploaded.join('、')+'；尚缺：'+x.missing.join('、');}catch(e){get('progress').textContent='查询失败：'+e.message;}};</script></body></html>"
].join('\n');
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...HEADERS,'content-type':'application/json; charset=utf-8'}});
function hex(a){return [...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function digest(ticket){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ticket)))}
function cleanReport(report,keep){
 if(!report||typeof report!=='object'||!Array.isArray(report.items)||report.items.length>600||!String(report.schema||'').startsWith('personal-device-lab/'))throw new Error('report JSON schema not recognized');
 const data=structuredClone(report);
 const removed={ip:0,visitor:0};
 function walk(v,depth=0){
  if(!v||typeof v!=='object'||depth>9)return;
  if(Array.isArray(v)){for(const x of v)walk(x,depth+1);return}
  for(const key of Object.keys(v)){
   if(/^(?:ip|ipAddress|clientIP|cf-connecting-ip)$/i.test(key)){delete v[key];removed.ip++;continue}
   if(!keep&&/^(?:visitorId|visitorIdentifier|visitor_id|localVisitorId)$/i.test(key)){delete v[key];removed.visitor++;continue}
   if(typeof v[key]==='string'&&/(?:visitor\s*id|visitor.?identifier|访客标识)/i.test(key)&&!keep){delete v[key];removed.visitor++;continue}
   walk(v[key],depth+1);
  }
 }
 walk(data);
 for(const item of data.items){
  if(!item||typeof item!=='object')continue;
  const descriptor=String(item.id||'')+' '+String(item.label||'');
  if(/出口\s*IP|cf-connecting-ip|(?:^|[-\s])ip(?:$|[-\s])|IP\s*地址/i.test(descriptor)){item.value='[REDACTED]';removed.ip++}
  if(!keep&&/visitor.?id|访客标识|访客\s*ID/i.test(descriptor)){item.value='[REDACTED]';removed.visitor++}
 }
 return {report:data,removed}
}
async function boundedForm(req){
 const len=Number(req.headers.get('content-length')||0);
 if(len>MAX_BODY)throw new RangeError('request too large');
 let n=0,parts=[];const rd=req.body?.getReader();if(!rd)throw new Error('body missing');
 try{while(true){const {done,value}=await rd.read();if(done)break;n+=value.byteLength;if(n>MAX_BODY){await rd.cancel();throw new RangeError('request too large')}parts.push(value)}}finally{rd.releaseLock()}
 return new Request(req.url,{method:'POST',headers:{'content-type':req.headers.get('content-type')||''},body:new Blob(parts)}).formData()
}
async function validTicket(env,ticket){
 if(typeof ticket!=='string'||!/^[-_a-zA-Z0-9]{48,128}$/.test(ticket))return null;
 const id=await digest(ticket);
 const permit=await env.INTAKE_KV.get('permit:'+id);
 return permit==='active'?id:null
}
async function upload(req,env){
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('multipart/form-data'))return json({error:'multipart required'},415);
 const f=await boundedForm(req),ticket=f.get('ticket'),id=await validTicket(env,ticket);
 if(!id)return json({error:'授权链接无效或已过期'},403);
 const slot=f.get('slot'),file=f.get('file'),keep=f.get('keepVisitor')==='1';
 if(!SLOTS.includes(slot))return json({error:'unknown report slot'},400);
 if(!file||typeof file.arrayBuffer!=='function'||typeof file.name!=='string')return json({error:'please select a file'},400);
 const ext=(file.name.split('.').pop()||'').toLowerCase(),size=file.size;
 const isJSON=['json','txt'].includes(ext),isImage=['png','jpg','jpeg','webp'].includes(ext),isPDF=ext==='pdf';
 if(!isJSON&&!isImage&&!isPDF)return json({error:'unsupported file type'},415);
 if(size<1||size>(isJSON?MAX_JSON:MAX_IMAGE))return json({error:'file too large or empty; JSON 500KB, images/PDF 2MB max'},413);
 let payload,kind,removed={ip:0,visitor:0};
 if(isJSON){
  let original;
  try{original=JSON.parse(await file.text())}catch{return json({error:'not valid JSON; please export report as JSON'},422)}
  try{const x=cleanReport(original,keep);payload=x.report;removed=x.removed}catch{return json({error:'not a Personal Device Lab report JSON'},422)}
  kind='json';
 }else{
  const arr=new Uint8Array(await file.arrayBuffer());
  const png=arr[0]===137&&arr[1]===80&&arr[2]===78&&arr[3]===71;
  const jpeg=arr[0]===255&&arr[1]===216&&arr[2]===255;
  const pdf=arr[0]===37&&arr[1]===80&&arr[2]===68&&arr[3]===70;
  const webp=arr[0]===82&&arr[1]===73&&arr[2]===70&&arr[3]===70&&arr[8]===87&&arr[9]===69&&arr[10]===66&&arr[11]===80;
  if(!((ext==='png'&&png)||(ext==='jpg'&&jpeg)||(ext==='jpeg'&&jpeg)||(ext==='webp'&&webp)||(ext==='pdf'&&pdf)))return json({error:'file extension does not match content'},422);
  let s='';for(let i=0;i<arr.length;i+=16000)s+=String.fromCharCode(...arr.subarray(i,i+16000));
  payload=btoa(s);kind=ext==='jpg'?'jpeg':ext;
 }
 const record={schema:'personal-device-lab/intake-v1',slot,kind,size,submittedAt:new Date().toISOString(),expiresInDays:7,redaction:removed,keepVisitorId:keep&&isJSON,payload};
 await env.INTAKE_KV.put('report:'+id+':'+slot,JSON.stringify(record),{expirationTtl:TTL});
 return json({ok:true,slot,kind,size,redaction:removed,expiresInDays:7});
}
async function status(req,env){
 if(Number(req.headers.get('content-length')||0)>2000)return json({error:'invalid request'},413);
 const body=await req.json().catch(()=>({})),id=await validTicket(env,body.ticket);
 if(!id)return json({error:'expired link'},403);
 const all=await Promise.all(SLOTS.map(x=>env.INTAKE_KV.get('report:'+id+':'+x)));
 return json({uploaded:SLOTS.filter((x,i)=>!!all[i]),missing:SLOTS.filter((x,i)=>!all[i]),expiresInDays:7});
}
export default {async fetch(req,env){
 const p=new URL(req.url).pathname;
 try{
  if(req.method==='GET'&&p==='/')return new Response(PAGE,{headers:{...HEADERS,'content-type':'text/html; charset=utf-8'}});
  if(req.method==='GET'&&p==='/api/health')return json({ok:true,service:'pdl-private-intake',persistent:false,temporaryKV:true});
  if(req.method==='POST'&&p==='/api/upload')return await upload(req,env);
  if(req.method==='POST'&&p==='/api/status')return await status(req,env);
  return json({error:'not found'},404);
 }catch(e){return json({error:e instanceof RangeError?'file too large':'invalid request'},e instanceof RangeError?413:400)}
}};
