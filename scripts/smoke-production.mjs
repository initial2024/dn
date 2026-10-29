const BASE='https://device.feiling.ccwu.cc';
async function request(path){
 const url=BASE+path;
 const resp=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{accept:path==='/'?'text/html':'application/json'}});
 if(resp.status!==200)throw new Error(path+' status='+resp.status+' (expected 200)');
 if(new URL(resp.url).origin!==new URL(BASE).origin)throw new Error('unexpected redirect origin');
 return {response:resp,body:await resp.text()};
}
try{
 const h=await request('/api/health');
 const data=JSON.parse(h.body);
 if(data.version!=='0.2.1'||data.status!=='ok'||data.persistence!=='none')throw new Error('unexpected health payload');
 const page=await request('/');
 if(!page.response.headers.get('content-type')?.includes('text/html'))throw new Error('unexpected HTML type');
 if(!page.body.includes('Personal Device Lab')||!page.body.includes('开始基础检测')||page.body.length<10000)throw new Error('invalid homepage');
 console.log('HTTP_SMOKE=PASS HTTPS_HOST='+new URL(BASE).host+' HEALTH_VERSION='+data.version+' HTML_LENGTH='+page.body.length);
}catch(e){
 console.error('HTTP_SMOKE=FAIL',e instanceof Error?e.message:String(e));
 process.exitCode=1;
}
