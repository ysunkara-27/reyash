import {feedbackReport} from './feedback-api.mjs';
const encoder=new TextEncoder();
const SITES=new Set(['taskpup','home','amma','atlas','rides','bidpoints','apgovelections','pujarinet','writings','savetheworld','officehours','blindspot','other']);
const HOUR=3600000;
const EVENT_NAME=/^[a-z0-9_]{1,40}$/;
const FIVE_MINUTES=300000,DAY=86400000,WEEK=7*DAY;
const SESSION_ID=/^[a-zA-Z0-9_-]{8,80}$/;
const MAX_READ_SECONDS=4*3600;
const FALLBACK_PASSWORD_HASH='5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
const tableReady=new WeakMap();
const rows=async statement=>(await statement.all()).results;
const hex=buffer=>Array.from(new Uint8Array(buffer),byte=>byte.toString(16).padStart(2,'0')).join('');
const digest=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const safePath=value=>{const path=typeof value==='string'?value.split(/[?#]/,1)[0]:'';return path.startsWith('/')&&path.length<=180?path:'/';};
const safeSite=value=>SITES.has(value)?value:'other';
const timingSafeEqual=(a,b)=>{let difference=a.length^b.length;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0;};
const base64url=value=>btoa(value).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const fromBase64url=value=>atob(value.replaceAll('-','+').replaceAll('_','/'));
// Tracking and feedback also arrive from Blindspot's own domain and its Vercel preview deployments.
// Only /analytics/* and /feedback/* get these extra origins; every other route keeps the base allow-list.
const PUBLIC_ORIGINS=new Set(['https://scanblindspot.com','https://www.scanblindspot.com']);
const VERCEL_PREVIEW=/^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
export function publicCorsHeaders(request,base={}){
 if(base['access-control-allow-origin'])return base;
 const origin=request.headers.get('Origin');
 return origin&&(PUBLIC_ORIGINS.has(origin)||VERCEL_PREVIEW.test(origin))?{...base,'access-control-allow-origin':origin,vary:'Origin'}:base;
}

async function ensureTables(env){
 if(!tableReady.has(env.DB))tableReady.set(env.DB,(async()=>{
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS analytics_activity (site TEXT NOT NULL, actor TEXT NOT NULL, bucket INTEGER NOT NULL, username TEXT, path TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(site,actor,bucket))').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS analytics_activity_bucket ON analytics_activity(bucket)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS analytics_activity_site_bucket ON analytics_activity(site,bucket)').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS analytics_events (site TEXT NOT NULL, event TEXT NOT NULL, bucket INTEGER NOT NULL, count INTEGER NOT NULL DEFAULT 0, value REAL NOT NULL DEFAULT 0, PRIMARY KEY(site,event,bucket))').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS analytics_events_bucket ON analytics_events(bucket)').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS analytics_reads (session TEXT PRIMARY KEY, actor TEXT NOT NULL, path TEXT NOT NULL, title TEXT, started INTEGER NOT NULL, last_seen INTEGER NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, depth INTEGER NOT NULL DEFAULT 0, country TEXT, region TEXT, city TEXT, referrer TEXT, device TEXT)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS analytics_reads_started ON analytics_reads(started)').run();
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

export async function recordEvent(env,{site,event,value=1},now=Date.now()){
 if(!SITES.has(site)||typeof event!=='string'||!EVENT_NAME.test(event))return false;
 const amount=value===undefined?1:Number(value);
 if(!Number.isFinite(amount)||amount<0)return false;
 await ensureTables(env);
 const bucket=Math.floor(now/HOUR)*HOUR;
 await env.DB.prepare('INSERT INTO analytics_events(site,event,bucket,count,value) VALUES (?,?,?,1,?) ON CONFLICT(site,event,bucket) DO UPDATE SET count=count+1,value=value+excluded.value').bind(site,event,bucket,amount).run();
 return true;
}

// One row per article page load. Location comes from Cloudflare's request.cf (city level); no IP is stored.
const shortText=(value,max)=>typeof value==='string'&&value.trim()?value.trim().slice(0,max):null;
const referrerHost=value=>{try{const host=new URL(value).hostname.replace(/^www\./,'');return host&&host!=='ysunkara.com'?host.slice(0,80):null;}catch{return null;}};
const articlePath=value=>{const path=safePath(value).replace(/\/+$/,'');return /^\/writings\/[a-z0-9-]{1,120}$/.test(path)?path:null;};
export async function recordRead(env,{actor,session,path,title,seconds=0,depth=0,referrer='',cf={},userAgent=''},now=Date.now()){
 const article=articlePath(path);
 if(!article||typeof actor!=='string'||!/^[a-zA-Z0-9_-]{8,160}$/.test(actor)||typeof session!=='string'||!SESSION_ID.test(session))return false;
 const added=Math.max(0,Math.min(60,Math.round(Number(seconds)||0)));
 const reached=Math.max(0,Math.min(100,Math.round(Number(depth)||0)));
 await ensureTables(env);
 await env.DB.prepare(`INSERT INTO analytics_reads(session,actor,path,title,started,last_seen,seconds,depth,country,region,city,referrer,device) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(session) DO UPDATE SET last_seen=excluded.last_seen,seconds=MIN(${MAX_READ_SECONDS},analytics_reads.seconds+excluded.seconds),depth=MAX(analytics_reads.depth,excluded.depth)`)
  .bind(session,await actorHash(env,actor),article,shortText(title,160),now,now,added,reached,shortText(cf.country,2),shortText(cf.region,60),shortText(cf.city,60),referrerHost(referrer),/Mobi|Android|iPhone|iPad/i.test(userAgent)?'mobile':'desktop').run();
 return true;
}

async function writingsReport(env,now){
 const since=now-365*DAY;
 const articles=await rows(env.DB.prepare(`SELECT path,MAX(title) AS title,COUNT(*) AS reads,COUNT(DISTINCT actor) AS readers,
  SUM(seconds) AS seconds,AVG(seconds) AS avg_seconds,AVG(depth) AS avg_depth,SUM(CASE WHEN depth>=90 THEN 1 ELSE 0 END) AS finished,
  SUM(CASE WHEN started>=? THEN 1 ELSE 0 END) AS reads_week,MAX(last_seen) AS last_read
  FROM analytics_reads WHERE started>=? GROUP BY path ORDER BY reads DESC`).bind(now-WEEK,since));
 const places=await rows(env.DB.prepare(`SELECT country,region,city,COUNT(*) AS reads,COUNT(DISTINCT actor) AS readers,SUM(seconds) AS seconds
  FROM analytics_reads WHERE started>=? GROUP BY country,region,city ORDER BY readers DESC,reads DESC LIMIT 40`).bind(since));
 const referrers=await rows(env.DB.prepare(`SELECT COALESCE(referrer,'direct') AS referrer,COUNT(*) AS reads
  FROM analytics_reads WHERE started>=? GROUP BY referrer ORDER BY reads DESC LIMIT 12`).bind(since));
 const daily=await rows(env.DB.prepare(`SELECT strftime('%Y-%m-%d',started/1000,'unixepoch') AS day,COUNT(DISTINCT actor) AS users,COUNT(*) AS hits,SUM(seconds) AS seconds
  FROM analytics_reads WHERE started>=? GROUP BY day ORDER BY day`).bind(now-30*DAY));
 const recent=await rows(env.DB.prepare(`SELECT path,title,started,last_seen,seconds,depth,country,region,city,referrer,device
  FROM analytics_reads WHERE started>=? ORDER BY started DESC LIMIT 60`).bind(since));
 const totals=(await env.DB.prepare(`SELECT COUNT(*) AS reads,COUNT(DISTINCT actor) AS readers,COALESCE(SUM(seconds),0) AS seconds,
  COUNT(CASE WHEN last_seen>=? THEN 1 END) AS live
  FROM analytics_reads WHERE started>=?`).bind(now-2*60*1000,since).first())||{};
 await env.DB.prepare('DELETE FROM analytics_reads WHERE started<?').bind(since).run();
 return {totals,articles,places,referrers,daily,recent};
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
 const events=await rows(env.DB.prepare(`SELECT site,event,
  SUM(CASE WHEN bucket>=? THEN count ELSE 0 END) AS day_count,
  SUM(count) AS week_count,
  SUM(CASE WHEN bucket>=? THEN value ELSE 0 END) AS day_value,
  SUM(value) AS week_value
  FROM analytics_events WHERE bucket>=? GROUP BY site,event ORDER BY site,week_count DESC,event`).bind(day,day,week));
 let feedback={n:0,averages:{ease:null,teaching:null,accuracy:null,recommend:null},real_product:{yes:0,maybe:0,no:0},recent:[]};
 try{feedback=await feedbackReport(env);}catch(error){console.error('Feedback report failed',error);}
 const writings=await writingsReport(env,now);
 await env.DB.prepare('DELETE FROM analytics_activity WHERE bucket<?').bind(now-90*DAY).run();
 await env.DB.prepare('DELETE FROM analytics_events WHERE bucket<?').bind(now-90*DAY).run();
 return {generatedAt:now,trackingSince:(await env.DB.prepare('SELECT MIN(bucket) AS value FROM analytics_activity').first())?.value||null,windows:{liveMinutes:15},totals,sites,usernames,hourly,daily,recentAccounts,events,feedback,writings};
}

export async function handleAnalytics(request,env,headers={}){
 const reply=(data,status=200)=>Response.json(data,{status,headers:{...headers,'cache-control':'no-store'}});
 const url=new URL(request.url),now=Date.now();
 try{
  if(url.pathname==='/analytics/event'||url.pathname==='/analytics/track'||url.pathname==='/analytics/read'){
   if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
   await ensureTables(env);
   const limitKey=await digest(`${request.headers.get('CF-Connecting-IP')||'local'}:${Math.floor(now/60000)}`);
   await env.DB.prepare('INSERT INTO analytics_limits(key,attempts,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(limitKey,now+60000).run();
   const limit=await env.DB.prepare('SELECT attempts FROM analytics_limits WHERE key=?').bind(limitKey).first();
   if(limit.attempts>120)return reply({error:'Too many events.'},429);
   await env.DB.prepare('DELETE FROM analytics_limits WHERE expires<?').bind(now).run();
   const raw=await request.text();if(raw.length>1000)return reply({error:'Event too large.'},413);
   let body;try{body=JSON.parse(raw||'{}');}catch{return reply({error:'Invalid event.'},400);}
   if(!body||typeof body!=='object'||!SITES.has(body.site))return reply({error:'Unknown site.'},400);
   if(url.pathname==='/analytics/read'){
    const ok=await recordRead(env,{actor:body.visitor,session:body.session,path:body.path,title:body.title,seconds:body.seconds,depth:body.depth,referrer:body.referrer,cf:request.cf||{},userAgent:request.headers.get('user-agent')||''},now);
    return ok?reply({ok:true}):reply({error:'Invalid read.'},400);
   }
   if(url.pathname==='/analytics/track'){
    if(typeof body.event!=='string'||!EVENT_NAME.test(body.event))return reply({error:'Invalid event name.'},400);
    if(body.value!==undefined&&!(typeof body.value==='number'&&Number.isFinite(body.value)&&body.value>=0))return reply({error:'Invalid value.'},400);
    const ok=await recordEvent(env,{site:body.site,event:body.event,value:body.value},now);
    return ok?reply({ok:true}):reply({error:'Invalid event.'},400);
   }
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
