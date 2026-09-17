import {migrate,validate,plan,stabilizeAssignments,publicState} from '../../model.mjs';
import {dailyKey} from '../../game-engine.mjs';
const admins=['Meera','Yashaswi'];
export async function handle(request,env,h){
 const reply=(d,s=200)=>h.json(d,s,{...h.headers,'cache-control':'no-store'});
 try{
 const path=new URL(request.url).pathname;
 if(path==='/v2/game'){
  const scoreTable=new URL(request.url).searchParams.get('mode')==='traffic'?'rides_traffic_scores':'rides_endless_scores';
   const today=dailyKey(),yesterday=dailyKey(new Date(Date.now()-86400000));
   await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ${scoreTable} (period TEXT NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(period,name))`).run();
   if(request.method==='POST'){
     const raw=await request.text();if(raw.length>300)return reply({error:'Score submission too large.'},400);
     const {name,score,day}=JSON.parse(raw);
     if(typeof name!=='string'||!name.trim()||name.trim().length>20||!Number.isInteger(score)||score<0||score>100000000||![today,yesterday].includes(day))return reply({error:'Enter a nickname (1–20 characters) and a valid recent run.'},400);
     const key='game:'+(request.headers.get('CF-Connecting-IP')||'local')+':'+Math.floor(Date.now()/60000);
     await env.DB.prepare('INSERT INTO rides_auth_limits (key,attempts,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(key,Date.now()+60000).run();
     const limit=await env.DB.prepare('SELECT attempts FROM rides_auth_limits WHERE key=?').bind(key).first();
     if(limit.attempts>10)return reply({error:'Too many submissions. Try again in a minute.'},429);
     await env.DB.prepare('DELETE FROM rides_auth_limits WHERE expires < ?').bind(Date.now()).run();
     await env.DB.batch([day,'all'].map(period=>env.DB.prepare(`INSERT INTO ${scoreTable} (period,name,score,updated) VALUES (?,?,?,?) ON CONFLICT(period,name) DO UPDATE SET score=excluded.score, updated=excluded.updated WHERE excluded.score > ${scoreTable}.score`).bind(period,name.trim().toLowerCase(),score,Date.now())));
   }else if(request.method!=='GET')return reply({error:'Method not allowed'},405);
   const period=new URL(request.url).searchParams.get('scope')==='all'?'all':today;
   const rows=await env.DB.prepare(`SELECT name,score FROM ${scoreTable} WHERE period=? ORDER BY score DESC, updated ASC LIMIT 10`).bind(period).all();
   return reply({scores:rows.results,day:today});
 }
 const identity=await h.userFrom(request,env.SESSION_SECRET).catch(()=>null);
 const member=identity&&admins.includes(identity.name)?await env.DB.prepare('SELECT name FROM members WHERE name=?').bind(identity.name).first():null;
 const admin=member?.name||null;
 if(path==='/v2/login'&&request.method==='POST'){
   const {name,passcode,setupCode}=await request.json();
   if(!admins.includes(name)||!/^\d{4,8}$/.test(passcode))return reply({error:'Select an admin and enter a 4–8 digit personal PIN.'},400);
   const window=Math.floor(Date.now()/900000),key=(request.headers.get('CF-Connecting-IP')||'local')+':'+name+':'+window;
   await env.DB.prepare('INSERT INTO rides_auth_limits (key,attempts,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(key,Date.now()+900000).run();
   const limit=await env.DB.prepare('SELECT attempts FROM rides_auth_limits WHERE key=?').bind(key).first();
   if(limit.attempts>12)return reply({error:'Too many attempts. Try again in 15 minutes.'},429);
   await env.DB.prepare('DELETE FROM rides_auth_limits WHERE expires < ?').bind(Date.now()).run();
   const account=await env.DB.prepare('SELECT * FROM members WHERE name=?').bind(name).first();
   if(account){if(await h.hash(passcode,account.salt)!==account.code_hash)return reply({error:'Incorrect PIN.'},401)}
   else{
     if(!env.MANAGER_SETUP_CODE||setupCode!==env.MANAGER_SETUP_CODE)return reply({error:'First time? Enter the admin setup code below as well as your new personal PIN.'},401);
     const salt=crypto.randomUUID();await env.DB.prepare('INSERT INTO members (name,role,code_hash,salt) VALUES (?, ?, ?, ?)').bind(name,'manager',await h.hash(passcode,salt),salt).run();
   }
   return reply({token:await h.tokenFor(name,'manager',env.SESSION_SECRET),admin:name});
 }
 const read=async()=>{
  let row=await env.DB.prepare('SELECT * FROM rides_v2 WHERE id=1').first();
  if(!row){const legacy=await env.DB.prepare('SELECT data FROM app_state WHERE id=1').first();const data=migrate(legacy?JSON.parse(legacy.data):h.defaultState);await env.DB.prepare('INSERT OR IGNORE INTO rides_v2(id,data,revision) VALUES(1,?,0)').bind(JSON.stringify(data)).run();row=await env.DB.prepare('SELECT * FROM rides_v2 WHERE id=1').first()}
  return {data:JSON.parse(row.data),revision:row.revision};
 };
 if(path==='/v2/state'&&request.method==='GET'){const state=await read();return reply({...state,data:admin?state.data:publicState(state.data),admin})}
 if(!admin)return reply({error:'Admin access required.'},401);
 if(path==='/v2/state'&&request.method==='PUT'){
   const body=await request.text();if(body.length>500000)return reply({error:'Update is too large.'},413);
   const {data,revision,verifyId}=JSON.parse(body);validate(data);
   const previous=await read();if(revision!==previous.revision)return reply({error:'Another admin saved changes. Reload before editing again.'},409);
   if(admin!=='Yashaswi'&&JSON.stringify(data.featuredSet)!==JSON.stringify(previous.data.featuredSet))return reply({error:'Only Yashaswi can change the featured raas set.'},403);
   stabilizeAssignments(previous.data,data,verifyId);validate(data);
   const rosterChanged=JSON.stringify(data.roster)!==JSON.stringify(previous.data.roster)||JSON.stringify(data.locations)!==JSON.stringify(previous.data.locations);
   for(const event of data.events){const old=previous.data.events.find(e=>e.id===event.id);const clean=e=>({...e,verified:null});event.verified=!rosterChanged&&old&&JSON.stringify(clean(old))===JSON.stringify(clean(event))?old.verified:null}
   if(verifyId){const event=data.events.find(e=>e.id===verifyId);if(!event)return reply({error:'Event not found.'},400);const result=plan(data,event);if(result.pending.length||result.warnings.length)return reply({error:'Resolve missing pickups, missing pins, and seat shortages before verifying.'},400);event.verified={by:admin,at:new Date().toISOString()}}
   const result=await env.DB.prepare('UPDATE rides_v2 SET data=?, revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data),revision).run();
   if(!result.meta.changes)return reply({error:'Another admin saved changes. Reload before editing again.'},409);
   return reply({data,revision:revision+1,admin});
 }
 return reply({error:'Not found'},404);
 }catch(error){return reply({error:error.message||'Unable to complete request.'},400)}
}
