// Transfer credentials directly to the provider CLI stdin; never print their values.
import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const base=new URL('../',import.meta.url),cloud='https://raas-atlas-api.sunkarayashaswi.workers.dev',local='http://127.0.0.1:8107';
const credentials=JSON.parse(await readFile(new URL('.local/secrets.json',base),'utf8'));
if(!credentials.serpApiKey)throw Error('Connect the local key before migrating.');
let admin;try{admin=await readFile(new URL('.local/cloud-admin.key',base),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;admin=randomBytes(32).toString('hex');await writeFile(new URL('.local/cloud-admin.key',base),admin,{mode:0o600});}
for(const [name,value] of (process.argv.includes('--resume')?[]:[['SERPAPI_API_KEY',credentials.serpApiKey],['ATLAS_ADMIN_KEY',admin]])){
 const result=spawnSync('npx',['wrangler@4.128.0','secret','put',name],{cwd:new URL('worker/',base),input:value,encoding:'utf8'});if(result.status!==0)throw Error(`Could not install private ${name}; credentials were not printed.`);console.log(`Installed private ${name}.`);
}
const privatePost=async(path,body={})=>{const r=await fetch(cloud+path,{method:'POST',headers:{Authorization:`Bearer ${admin}`,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const detail=await r.json().catch(()=>({}));throw Error(`Hosted ${path} returned ${r.status}: ${detail.error||'unavailable'}.`);}return r.json();};
const checked=await privatePost('/admin/check');console.log(`Hosted Free account verified; ${checked.account.remaining} searches remain.`);
const before=await (await fetch(local+'/api/status')).json();
const pause=await fetch(local+'/api/refresh',{method:'POST',headers:{Origin:local,'Content-Type':'application/json'},body:JSON.stringify({pause:true})});if(!pause.ok)throw Error('Could not pause local queue safely.');
const db=JSON.parse(await readFile(new URL('.local/fares.json',base),'utf8'));db.enabled=before.refresh.enabled;db.scope=db.scope||(db.routes.length>200?'all':'shortlist');db.account=checked.account;db.message='Hosted queue imported; automatic refresh runs every five minutes, subject to route interval and free quota.';
try{await privatePost('/admin/import',db);}catch(error){if(before.refresh.enabled)await fetch(local+'/api/refresh',{method:'POST',headers:{Origin:local,'Content-Type':'application/json'},body:JSON.stringify({routes:db.routes,intervalDays:db.intervalDays,scope:db.scope})});throw error;}
await writeFile(new URL('.local/hosted.json',base),JSON.stringify({url:cloud,migratedAt:new Date().toISOString(),routes:db.routes.length}),{mode:0o600});
console.log(`Migrated ${db.routes.length} routes and ${Object.keys(db.quotes).length} saved prices; local queue is paused to avoid duplicate searches.`);
const tick=await privatePost('/admin/tick');console.log(JSON.stringify({hosted:true,refresh:tick.refresh}));
const snapshot=await (await fetch(cloud+'/fares')).json();delete snapshot.account;await writeFile(new URL('fares.json',base),JSON.stringify(snapshot));
