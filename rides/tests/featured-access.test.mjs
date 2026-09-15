import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../api/src/v2.mjs';
import {migrate} from '../model.mjs';
test('featured-set writes are restricted to Yashaswi on the server',async()=>{
 const old=migrate({roster:[]}),next=structuredClone(old);next.featuredSet={url:'https://youtu.be/-u7ThyX0Pus',updated:'2026-09-15'};
 for(const [name,expected] of [[null,401],['Meera',403],['Yashaswi',200]]){
   let writes=0;
   const env={SESSION_SECRET:'test',DB:{prepare(sql){return {
     bind(){return this},
     async first(){return sql.includes('SELECT name')?{name}:{data:JSON.stringify(old),revision:0}},
     async run(){writes++;return {meta:{changes:1}}}
   }}}};
   const response=await handle(new Request('https://example.test/v2/state',{method:'PUT',body:JSON.stringify({data:next,revision:0})}),env,{headers:{},json:(data,status=200)=>Response.json(data,{status}),userFrom:async()=>name?{name}:null});
   assert.equal(response.status,expected);assert.equal(writes,expected===200?1:0);
 }
});
