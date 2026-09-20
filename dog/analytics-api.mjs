const encoder=new TextEncoder();
const SITES=new Set(['taskpup','home','amma','rides','bidpoints','apgovelections','pujarinet','writings','savetheworld','officehours','other']);
const FIVE_MINUTES=300000,DAY=86400000,WEEK=7*DAY;
const FALLBACK_PASSWORD_HASH='5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
const tableReady=new WeakMap();
const hex=buffer=>Array.from(new Uint8Array(buffer),byte=>byte.toString(16).padStart(2,'0')).join('');
const digest=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const safePath=value=>{const path=typeof value==='string'?value.split(/[?#]/,1)[0]:'';return path.startsWith('/')&&path.length<=180?path:'/';};
const safeSite=value=>SITES.has(value)?value:'other';
const timingSafeEqual=(a,b)=>{let difference=a.length^b.length;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0;};
const base64url=value=>btoa(value).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const fromBase64url=value=>atob(value.replaceAll('-','+').replaceAll('_','/'));

async function ensureTables(env){
 if(!tableReady.has(env.DB))tableReady.set(env.DB,(async()=>{
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS analytics_activity (site TEXT NOT NULL, actor TEXT NOT NULL, bucket INTEGER NOT NULL, username TEXT, path TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(site,actor,bucket))').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS analytics_activity_bucket ON analytics_activity(bucket)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS analytics_activity_site_bucket ON analytics_activity(site,bucket)').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS analytics_limits (key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,expires INTEGER NOT NULL)').run();
 })());
 return tableReady.get(env.DB);
}
async function actorHash(env,value){return digest(`${env.SESSION_SECRET||'analytics'}:activity:${value}`);}

export async function recordActivity(env,{site,actor,username=null,path='/'},now=Date.now()){
 if(typeof actor!=='string'||!/^[a-zA-Z0-9_-]{8,160}$/.test(actor))return false;
 await ensureTables(env);
 const bucket=Math.floor(now/FIVE_MINUTES)*FIVE_MINUTES;
 const cleanName=typeof username==='string'&&username.length<=64?username:null;
 await env.DB.prepare('INSERT INTO analytics_activity(site,actor,bucket,username,path,hits) VALUES (?,?,?,?,?,1) ON CONFLICT(site,actor,bucket) DO UPDATE SET hits=hits+1,username=COALESCE(excluded.username,analytics_activity.username),path=excluded.path').bind(safeSite(site),await actorHash(env,actor),bucket,cleanName,safePath(path)).run();
 return true;
}

async function sign(env,payload){
 const key=await crypto.subtle.importKey('raw',encoder.encode(env.SESSION_SECRET||'stats-session'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return base64url(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(payload)))));
}
async function tokenFor(env,now){const payload=base64url(JSON.stringify({expires:now+12*60*60*1000}));return `${payload}.${await sign(env,payload)}`;}
async function validToken(env,token,now){
 if(typeof token!=='string'||!token.includes('.'))return false;
 const [payload,signature]=token.split('.');
 try{const data=JSON.parse(fromBase64url(payload));return Number(data.expires)>now&&timingSafeEqual(signature,await sign(env,payload));}catch{return false;}
}
const rows=async statement=>(await statement.all()).results;

async function report(env,now){
 await ensureTables(env);
 const live=now-15*60*1000,day=now-DAY,week=now-WEEK;
 const sites=await rows(env.DB.prepare(`SELECT site,
  COUNT(DISTINCT CASE WHEN bucket>=? THEN actor END) AS live,
  COUNT(DISTINCT CASE WHEN bucket>=? THEN actor END) AS day,
  COUNT(DISTINCT actor) AS week,
  SUM(CASE WHEN bucket>=? THEN hits ELSE 0 END) AS hits_day,
  SUM(hits) AS hits_week,
  MAX(bucket) AS last_seen
  FROM analytics_activity WHERE bucket>=? GROUP BY site ORDER BY day DESC,week DESC,site`).bind(live,day,day,week));
 const totals=(await env.DB.prepare(`SELECT
  COUNT(DISTINCT CASE WHEN bucket>=? THEN actor END) AS live,
  COUNT(DISTINCT CASE WHEN bucket>=? THEN actor END) AS day,
  COUNT(DISTINCT actor) AS week,
  SUM(CASE WHEN bucket>=? THEN hits ELSE 0 END) AS hits_day,
  SUM(hits) AS hits_week
  FROM analytics_activity WHERE bucket>=?`).bind(live,day,day,week).first())||{};
 const usernames=await rows(env.DB.prepare(`SELECT username,MIN(bucket) AS first_seen,MAX(bucket) AS last_seen,SUM(hits) AS hits
  FROM analytics_activity WHERE site='taskpup' AND username IS NOT NULL AND bucket>=?
  GROUP BY username ORDER BY last_seen DESC,username LIMIT 200`).bind(week));
 const hourly=await rows(env.DB.prepare(`SELECT (bucket/3600000)*3600000 AS start,COUNT(DISTINCT actor) AS users,SUM(hits) AS hits
  FROM analytics_activity WHERE bucket>=? GROUP BY start ORDER BY start`).bind(day));
 const daily=await rows(env.DB.prepare(`SELECT strftime('%Y-%m-%d',bucket/1000,'unixepoch') AS day,COUNT(DISTINCT actor) AS users,SUM(hits) AS hits
  FROM analytics_activity WHERE bucket>=? GROUP BY day ORDER BY day`).bind(week));
 let recentAccounts=[];
 try{recentAccounts=await rows(env.DB.prepare(`SELECT u.username,MAX(c.day) AS last_day
   FROM dog_care_days c JOIN dog_users u ON u.id=c.user_id
   WHERE c.day>=date(?/1000,'unixepoch','-7 day') GROUP BY u.id,u.username ORDER BY last_day DESC,u.username`).bind(now));}catch{}
 await env.DB.prepare('DELETE FROM analytics_activity WHERE bucket<?').bind(now-90*DAY).run();
 return {generatedAt:now,trackingSince:(await env.DB.prepare('SELECT MIN(bucket) AS value FROM analytics_activity').first())?.value||null,windows:{liveMinutes:15},totals,sites,usernames,hourly,daily,recentAccounts};
}

export async function handleAnalytics(request,env,headers={}){
 const reply=(data,status=200)=>Response.json(data,{status,headers:{...headers,'cache-control':'no-store'}});
 const url=new URL(request.url),now=Date.now();
 try{
  if(url.pathname==='/analytics/event'){
   if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
   await ensureTables(env);
   const limitKey=await digest(`${request.headers.get('CF-Connecting-IP')||'local'}:${Math.floor(now/60000)}`);
   await env.DB.prepare('INSERT INTO analytics_limits(key,attempts,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(limitKey,now+60000).run();
   const limit=await env.DB.prepare('SELECT attempts FROM analytics_limits WHERE key=?').bind(limitKey).first();
   if(limit.attempts>120)return reply({error:'Too many events.'},429);
   await env.DB.prepare('DELETE FROM analytics_limits WHERE expires<?').bind(now).run();
   const raw=await request.text();if(raw.length>1000)return reply({error:'Event too large.'},413);
   let body;try{body=JSON.parse(raw||'{}');}catch{return reply({error:'Invalid event.'},400);}
   if(!SITES.has(body.site))return reply({error:'Unknown site.'},400);
   const ok=await recordActivity(env,{site:body.site,actor:body.visitor,path:body.path},now);
   return ok?reply({ok:true}):reply({error:'Invalid visitor.'},400);
  }
  if(url.pathname==='/stats/login'){
   if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
   let body;try{body=await request.json();}catch{return reply({error:'Invalid request.'},400);}
   const expected=env.STATS_PASSWORD_HASH||FALLBACK_PASSWORD_HASH;
   const supplied=await digest(typeof body.password==='string'?body.password:'');
   if(!timingSafeEqual(supplied,expected))return reply({error:'Incorrect password.'},401);
   return reply({token:await tokenFor(env,now),expiresIn:43200});
  }
  if(url.pathname==='/stats/data'){
   if(request.method!=='GET')return reply({error:'Method not allowed.'},405);
   const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
   if(!await validToken(env,token,now))return reply({error:'Please unlock stats.'},401);
   return reply(await report(env,now));
  }
  return reply({error:'Not found.'},404);
 }catch(error){console.error('Analytics request failed',error);return reply({error:'Analytics are temporarily unavailable.'},503);}
}
