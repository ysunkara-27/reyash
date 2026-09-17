import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handle} from '../api/src/v2.mjs';
import {dailyKey} from '../game-engine.mjs';
test('three-lane scores stay separate from legacy scores and retain best daily/all-time runs',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE rides_auth_limits(key TEXT PRIMARY KEY,attempts INTEGER,expires INTEGER)');
 const env={DB:{prepare(sql){let args=[];return {bind(...values){args=values;return this},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}}},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}}};},async batch(statements){return Promise.all(statements.map(s=>s.run()));}}};
 const request=(query,score)=>handle(new Request('https://test/v2/game?'+query,{method:score===undefined?'GET':'POST',...(score===undefined?{}:{body:JSON.stringify({name:'Racer',score,day:dailyKey()})})}),env,{headers:{},json:(data,status,headers)=>Response.json(data,{status,headers})});
 try{await request('',999);await request('mode=traffic',100);await request('mode=traffic',10);
  assert.equal((await (await request('mode=traffic')).json()).scores[0].score,100);
  assert.equal((await (await request('mode=traffic&scope=all')).json()).scores[0].score,100);
  assert.equal((await (await request('')).json()).scores[0].score,999);
 }finally{db.close();}
});
