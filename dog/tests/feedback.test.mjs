import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleFeedback,validateFeedback,feedbackReport} from '../feedback-api.mjs';
import {handleAnalytics,publicCorsHeaders} from '../analytics-api.mjs';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE dog_users(id TEXT PRIMARY KEY,username TEXT);CREATE TABLE dog_care_days(user_id TEXT,day TEXT);');
 const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}}},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}}};}};
 const env={DB,SESSION_SECRET:'test-session-secret'};
 const submit=(body,headers={})=>handleFeedback(new Request('https://test/feedback/submit',{method:'POST',headers:{'user-agent':'test-agent','CF-Connecting-IP':'203.0.113.7',...headers},body:typeof body==='string'?body:JSON.stringify(body)}),env,{});
 return {db,env,submit};
}
const valid={role:'radiologist',years:'5-15',ease:4,teaching:5,accuracy:3,recommend:4,real_product:'maybe',missing:'More cases.',contact:'dr@example.org'};

test('validateFeedback accepts the documented shape and rejects everything else',()=>{
 assert.deepEqual(validateFeedback(valid).row,valid);
 assert.deepEqual(validateFeedback({role:'other',ease:1,teaching:1,accuracy:1,recommend:1,real_product:'no'}).row,{role:'other',years:'',ease:1,teaching:1,accuracy:1,recommend:1,real_product:'no',missing:'',contact:''});
 assert.ok(validateFeedback({...valid,role:'nurse'}).error);
 assert.ok(validateFeedback({...valid,years:'20'}).error);
 assert.ok(validateFeedback({...valid,ease:0}).error);
 assert.ok(validateFeedback({...valid,ease:6}).error);
 assert.ok(validateFeedback({...valid,ease:'4'}).error);
 assert.ok(validateFeedback({...valid,teaching:2.5}).error);
 assert.ok(validateFeedback({...valid,recommend:undefined}).error);
 assert.ok(validateFeedback({...valid,real_product:'sure'}).error);
 assert.ok(validateFeedback({...valid,missing:'x'.repeat(601)}).error);
 assert.equal(validateFeedback({...valid,missing:'x'.repeat(600)}).error,undefined);
 assert.ok(validateFeedback({...valid,contact:'x'.repeat(201)}).error);
 assert.ok(validateFeedback({...valid,missing:['not','text']}).error);
 assert.equal(validateFeedback({...valid,missing:null,contact:undefined}).row.missing,'');
});

test('POST /feedback/submit validates, stores a row, caps the body and limits per IP',async()=>{
 const f=fixture();try{
  assert.equal((await handleFeedback(new Request('https://test/feedback/submit'),f.env,{})).status,405);
  assert.equal((await handleFeedback(new Request('https://test/feedback/other',{method:'POST',body:'{}'}),f.env,{})).status,404);
  assert.equal((await f.submit('not json')).status,400);
  assert.equal((await f.submit({...valid,ease:9})).status,400);
  assert.equal((await f.submit({...valid,role:'nurse'})).status,400);
  assert.equal((await f.submit({...valid,missing:'x'.repeat(5000)})).status,413);
  const ok=await f.submit(valid);assert.equal(ok.status,200);
  const body=await ok.json();assert.equal(body.ok,true);assert.match(body.id,/^[0-9a-f-]{36}$/);
  const row=f.db.prepare('SELECT * FROM blindspot_feedback').get();
  assert.equal(row.id,body.id);assert.equal(row.role,'radiologist');assert.equal(row.years,'5-15');assert.equal(row.ease,4);assert.equal(row.recommend,4);
  assert.equal(row.real_product,'maybe');assert.equal(row.missing,'More cases.');assert.equal(row.contact,'dr@example.org');assert.equal(row.ua,'test-agent');
  for(let i=0;i<4;i++)assert.equal((await f.submit({...valid,missing:'again '+i})).status,200);
  assert.equal((await f.submit(valid)).status,429);
  assert.equal((await f.submit(valid,{'CF-Connecting-IP':'198.51.100.2'})).status,200);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM blindspot_feedback').get().n,6);
  f.db.prepare('UPDATE blindspot_feedback_limits SET created=created-3600001').run();
  assert.equal((await f.submit(valid)).status,200);
 }finally{f.db.close();}
});

test('feedbackReport and /stats/data expose counts, averages, verdicts and recent rows',async()=>{
 const f=fixture();try{
  let empty=await feedbackReport(f.env);
  assert.deepEqual(empty,{n:0,averages:{ease:null,teaching:null,accuracy:null,recommend:null},real_product:{yes:0,maybe:0,no:0},recent:[]});
  await f.submit({...valid,ease:5,teaching:4,accuracy:3,recommend:2,real_product:'yes',missing:'<b>first</b>'});
  await f.submit({...valid,ease:4,teaching:2,accuracy:3,recommend:5,real_product:'no',missing:'second',contact:''},{'CF-Connecting-IP':'198.51.100.2'});
  await f.submit({...valid,ease:3,teaching:3,accuracy:3,recommend:5,real_product:'yes',years:''},{'CF-Connecting-IP':'198.51.100.3'});
  const token=(await (await handleAnalytics(new Request('https://test/stats/login',{method:'POST',body:JSON.stringify({password:'password'})}),f.env,{})).json()).token;
  const response=await handleAnalytics(new Request('https://test/stats/data',{headers:{authorization:'Bearer '+token}}),f.env,{});
  assert.equal(response.status,200);
  const {feedback}=await response.json();
  assert.equal(feedback.n,3);
  assert.deepEqual(feedback.averages,{ease:4,teaching:3,accuracy:3,recommend:4});
  assert.deepEqual(feedback.real_product,{yes:2,maybe:0,no:1});
  assert.equal(feedback.recent.length,3);
  assert.deepEqual(Object.keys(feedback.recent[0]).sort(),['accuracy','contact','created','ease','id','missing','real_product','recommend','role','teaching','years']);
  assert.equal(feedback.recent.find(row=>row.missing==='<b>first</b>').contact,'dr@example.org');
  assert.equal(feedback.recent.find(row=>row.missing==='second').contact,'');
  assert.ok(feedback.recent.every(row=>!('ua' in row)));
 }finally{f.db.close();}
});

test('feedback replies carry the CORS headers the worker computed for scanblindspot.com',async()=>{
 const f=fixture();try{
  const request=new Request('https://test/feedback/submit',{method:'POST',headers:{Origin:'https://scanblindspot.com','content-type':'application/json'},body:JSON.stringify({...valid,ease:9})});
  const response=await handleFeedback(request,f.env,publicCorsHeaders(request));
  assert.equal(response.status,400);
  assert.equal(response.headers.get('access-control-allow-origin'),'https://scanblindspot.com');
  assert.equal(response.headers.get('vary'),'Origin');
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM blindspot_feedback').get().n,0);
 }finally{f.db.close();}
});
