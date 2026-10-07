import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleAnalytics,publicCorsHeaders,recordActivity,recordEvent} from '../analytics-api.mjs';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE dog_users(id TEXT PRIMARY KEY,username TEXT);CREATE TABLE dog_care_days(user_id TEXT,day TEXT);');
 const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}}},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}}};}};
 const env={DB,SESSION_SECRET:'test-session-secret'};
 const request=(path,options={})=>handleAnalytics(new Request('https://test'+path,options),env,{});
 return {db,env,request};
}

test('analytics aggregates unique visitors, attaches usernames, and protects reports',async()=>{
 const f=fixture();try{
  const now=Date.now();
  await recordActivity(f.env,{site:'home',actor:'browser_one',path:'/'},now);
  await recordActivity(f.env,{site:'home',actor:'browser_one',path:'/writings/'},now+1000);
  await recordActivity(f.env,{site:'taskpup',actor:'browser_two',username:'pupfan',path:'/dog/day'},now);
  let response=await f.request('/stats/data');assert.equal(response.status,401);
  response=await f.request('/stats/login',{method:'POST',body:JSON.stringify({password:'wrong'})});assert.equal(response.status,401);
  response=await f.request('/stats/login',{method:'POST',body:JSON.stringify({password:'password'})});assert.equal(response.status,200);
  const token=(await response.json()).token;
  response=await f.request('/stats/data',{headers:{authorization:'Bearer '+token}});assert.equal(response.status,200);
  const report=await response.json();
  assert.equal(report.totals.live,2);assert.equal(report.totals.hits_day,3);
  assert.equal(report.sites.find(site=>site.site==='home').day,1);
  assert.equal(report.usernames[0].username,'pupfan');
 }finally{f.db.close();}
});

test('public event ingestion validates source and visitor',async()=>{
 const f=fixture();try{
  let response=await f.request('/analytics/event',{method:'POST',body:JSON.stringify({site:'unknown',path:'/',visitor:'browser_one'})});assert.equal(response.status,400);
  response=await f.request('/analytics/event',{method:'POST',body:JSON.stringify({site:'amma',path:'/amma/?private=1',visitor:'browser_one'})});assert.equal(response.status,200);
  const row=f.db.prepare('SELECT site,path FROM analytics_activity').get();assert.equal(row.site,'amma');assert.equal(row.path,'/amma/');
 }finally{f.db.close();}
});

test('blindspot page views are accepted as a tracked site',async()=>{
 const f=fixture();try{
  const response=await f.request('/analytics/event',{method:'POST',body:JSON.stringify({site:'blindspot',path:'/blindspot/?case=1',visitor:'browser_bs_one'})});assert.equal(response.status,200);
  const row=f.db.prepare('SELECT site,path FROM analytics_activity').get();assert.equal(row.site,'blindspot');assert.equal(row.path,'/blindspot/');
 }finally{f.db.close();}
});

test('interaction tracking validates site, event name and value, then aggregates per hour',async()=>{
 const f=fixture();try{
  const post=body=>f.request('/analytics/track',{method:'POST',body:JSON.stringify(body)});
  assert.equal((await post({site:'nope',event:'session_start'})).status,400);
  assert.equal((await post({site:'blindspot'})).status,400);
  assert.equal((await post({site:'blindspot',event:'Bad-Name'})).status,400);
  assert.equal((await post({site:'blindspot',event:'x'.repeat(41)})).status,400);
  assert.equal((await post({site:'blindspot',event:'tutor_spend_usd',value:-1})).status,400);
  assert.equal((await post({site:'blindspot',event:'tutor_spend_usd',value:'0.5'})).status,400);
  assert.equal((await post({site:'blindspot',event:'tutor_spend_usd',value:Infinity})).status,400);
  assert.equal((await f.request('/analytics/track',{method:'GET'})).status,405);
  assert.equal((await post({site:'blindspot',event:'session_start',visitor:'browser_bs_one'})).status,200);
  assert.equal((await post({site:'blindspot',event:'session_start'})).status,200);
  assert.equal((await post({site:'blindspot',event:'tutor_spend_usd',value:0.012})).status,200);
  assert.equal((await post({site:'blindspot',event:'tutor_spend_usd',value:0.03})).status,200);
  const rows=f.db.prepare('SELECT site,event,bucket,count,value FROM analytics_events ORDER BY event').all();
  assert.equal(rows.length,2);
  assert.equal(rows[0].event,'session_start');assert.equal(rows[0].count,2);assert.equal(rows[0].value,2);
  assert.equal(rows[1].event,'tutor_spend_usd');assert.equal(rows[1].count,2);assert.ok(Math.abs(rows[1].value-0.042)<1e-9);
  assert.equal(rows[0].bucket%3600000,0);
 }finally{f.db.close();}
});

test('report lists interaction events for the last week and prunes old rows',async()=>{
 const f=fixture();try{
  const now=Date.now();
  await recordEvent(f.env,{site:'blindspot',event:'film_submitted'},now-2*86400000);
  await recordEvent(f.env,{site:'blindspot',event:'film_submitted'},now);
  await recordEvent(f.env,{site:'blindspot',event:'tutor_spend_usd',value:0.25},now);
  await recordEvent(f.env,{site:'blindspot',event:'tutor_spend_usd',value:1},now-3*86400000);
  await recordEvent(f.env,{site:'blindspot',event:'ancient',value:1},now-10*86400000);
  await recordEvent(f.env,{site:'blindspot',event:'stale',value:1},now-91*86400000);
  const token=(await (await f.request('/stats/login',{method:'POST',body:JSON.stringify({password:'password'})})).json()).token;
  const report=await (await f.request('/stats/data',{headers:{authorization:'Bearer '+token}})).json();
  assert.deepEqual(report.events.map(row=>row.event),['film_submitted','tutor_spend_usd']);
  const films=report.events.find(row=>row.event==='film_submitted');
  assert.equal(films.site,'blindspot');assert.equal(films.day_count,1);assert.equal(films.week_count,2);assert.equal(films.day_value,1);assert.equal(films.week_value,2);
  const spend=report.events.find(row=>row.event==='tutor_spend_usd');
  assert.equal(spend.day_count,1);assert.equal(spend.week_count,2);assert.equal(spend.day_value,0.25);assert.equal(spend.week_value,1.25);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM analytics_events WHERE event='stale'").get().n,0);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM analytics_events WHERE event='ancient'").get().n,1);
 }finally{f.db.close();}
});

test('publicCorsHeaders admits the Blindspot domain and Vercel previews without touching the base allow-list',()=>{
 const from=origin=>publicCorsHeaders(new Request('https://test/analytics/track',{method:'POST',headers:origin?{Origin:origin}:{}}));
 assert.deepEqual(from('https://readblindspot.com'),{'access-control-allow-origin':'https://readblindspot.com',vary:'Origin'});
 assert.deepEqual(from('https://www.readblindspot.com'),{'access-control-allow-origin':'https://www.readblindspot.com',vary:'Origin'});
 assert.deepEqual(from('https://readblindspot-abc123-ysunkara-27s-projects.vercel.app'),{'access-control-allow-origin':'https://readblindspot-abc123-ysunkara-27s-projects.vercel.app',vary:'Origin'});
 assert.deepEqual(from('http://readblindspot.com'),{});
 assert.deepEqual(from('https://readblindspot.com.evil.example'),{});
 assert.deepEqual(from('https://evil.example/.vercel.app'),{});
 assert.deepEqual(from('https://a.b.vercel.app'),{});
 assert.deepEqual(from(null),{});
 const base={'access-control-allow-origin':'https://www.ysunkara.com',vary:'Origin'};
 assert.deepEqual(publicCorsHeaders(new Request('https://test/analytics/track',{headers:{Origin:'https://www.ysunkara.com'}}),base),base);
 assert.deepEqual(publicCorsHeaders(new Request('https://test/analytics/track',{headers:{Origin:'https://evil.example'}}),{vary:'Origin'}),{vary:'Origin'});
});
