const base='https://personal-device-lab-intake.automice2095.workers.dev';
const request=async(path,opts={})=>{const r=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(15000),...opts});const txt=await r.text();return {r,txt}};
try{
 const h=await request('/api/health');if(h.r.status!==200)throw Error('health '+h.r.status);const obj=JSON.parse(h.txt);if(!obj.ok||obj.service!=='pdl-private-intake')throw Error('health schema');
 const page=await request('/');if(page.r.status!==200||!page.txt.includes('设备检测报告上传')||page.txt.length<2000)throw Error('upload page invalid');
 const denied=await request('/api/upload',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});if(denied.r.status===200)throw Error('bad upload accepted');
 const deniedRead=await request('/api/report');if(deniedRead.r.status!==404)throw Error('public report read accessible');
 console.log('INTAKE_HTTPS_SMOKE=PASS page_length='+page.txt.length+' health='+obj.service+' public_read=DENIED');
}catch(e){console.error('INTAKE_HTTPS_SMOKE=FAIL',e?.message||String(e));process.exitCode=1}
