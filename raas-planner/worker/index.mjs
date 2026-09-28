import {FareEngine} from '../fare-engine.mjs';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const equal=(a,b)=>{if(!a||!b)return false;let diff=a.length^b.length;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^(b.charCodeAt(i)||0);return diff===0;};
class HostedFares extends FareEngine{
 constructor(env,db,lease){super(null);this.env=env;this.db=db;this.key=env.SERPAPI_API_KEY||'';this.account=db.account||null;this.lease=lease;}
 async write(name,value){if(name!=='fares.json')throw Error('Use private Worker secrets for credentials.');const result=await this.env.DB.prepare('UPDATE atlas_state SET body=? WHERE id=1 AND lease_token=?').bind(JSON.stringify(value),this.lease).run();if(!result.meta.changes)throw Error('Refresh lease expired.');}
}
export async function runQueue(env){
 const lease=crypto.randomUUID(),now=Date.now();
 const record=await env.DB.prepare('UPDATE atlas_state SET lease_until=?,lease_token=? WHERE id=1 AND lease_until<? RETURNING body').bind(now+8*60000,lease,now).first();
 if(!record)return {busy:true};
 try{const engine=new HostedFares(env,JSON.parse(record.body),lease);for(let i=0;i<4;i++){await engine.tick();if(!engine.db.enabled||engine.nextCheck>Date.now())break;}return engine.status();}
 finally{await env.DB.prepare('UPDATE atlas_state SET lease_until=0,lease_token=NULL WHERE id=1 AND lease_token=?').bind(lease).run();}
}
export default{
 async scheduled(event,env,ctx){ctx.waitUntil(runQueue(env));},
 async fetch(request,env){
  const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGIN||'').split(','),cors=allowed.includes(origin)?{'Access-Control-Allow-Origin':origin,Vary:'Origin'}:{};
  const path=new URL(request.url).pathname;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'GET,HEAD','Access-Control-Allow-Headers':'content-type'}});
  if(path==='/health'&&request.method==='GET')return json({ok:true,service:'Raas Atlas'},200,cors);
  if(path==='/fares'){
   if(!['GET','HEAD'].includes(request.method))return json({error:'Published fares are read-only.'},405,cors);
   const record=await env.DB.prepare('SELECT body FROM atlas_state WHERE id=1').first();
   const engine=new HostedFares(env,JSON.parse(record.body),null);const snapshot=engine.snapshot();snapshot.hosted=true;
   return request.method==='HEAD'?new Response(null,{headers:cors}):json(snapshot,200,cors);
  }
  if(path.startsWith('/admin/')){
   if(!equal(request.headers.get('Authorization'),`Bearer ${env.ATLAS_ADMIN_KEY||''}`)||!env.ATLAS_ADMIN_KEY)return json({error:'Unauthorized'},401);
   if(request.method!=='POST')return json({error:'Method not allowed'},405);
   if(path==='/admin/check'){try{const engine=new HostedFares(env,{},null);return json({account:await engine.verify()});}catch(e){return json({error:e.message},502);}}
   if(path==='/admin/tick')return json(await runQueue(env));
   if(path==='/admin/import'){
    const raw=await request.text();if(raw.length>2000000)return json({error:'Import too large'},413);
    const value=JSON.parse(raw);if(value.version!==1||!Array.isArray(value.routes)||value.routes.length>700||!value.quotes||![1,7,14,30].includes(value.intervalDays)||!Array.isArray(value.attempts))return json({error:'Invalid fare store'},400);
    const result=await env.DB.prepare('UPDATE atlas_state SET body=? WHERE id=1 AND lease_until<?').bind(JSON.stringify(value),Date.now()).run();return json({imported:!!result.meta.changes},result.meta.changes?200:409);
   }
   if(path==='/admin/pause'){const record=await env.DB.prepare('SELECT body FROM atlas_state WHERE id=1').first();const value=JSON.parse(record.body);value.enabled=false;const result=await env.DB.prepare('UPDATE atlas_state SET body=? WHERE id=1 AND lease_until<?').bind(JSON.stringify(value),Date.now()).run();return json({paused:!!result.meta.changes},result.meta.changes?200:409);}
  }
  return json({error:'Not found'},404,cors);
 }
};
