import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleAnalytics,recordActivity} from '../analytics-api.mjs';

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
