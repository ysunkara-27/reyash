import test from 'node:test';import assert from 'node:assert/strict';import worker from '../worker/index.mjs';
test('public hosted routes cannot mutate prices or trigger searches',async()=>{
 const env={ATLAS_ADMIN_KEY:'test-only',ALLOWED_ORIGIN:'https://www.ysunkara.com'};
 for(const path of ['/admin/import','/admin/tick','/admin/pause','/admin/check']){const r=await worker.fetch(new Request('https://example.com'+path,{method:'POST',body:'{}'}),env);assert.equal(r.status,401);}
 for(const method of ['POST','PUT','DELETE'])assert.equal((await worker.fetch(new Request('https://example.com/fares',{method}),env)).status,405);
 const r=await worker.fetch(new Request('https://example.com/fares',{headers:{Origin:'https://www.ysunkara.com'}}),{...env,SERPAPI_API_KEY:'hidden-fixture-key',DB:{prepare:()=>({first:async()=>({body:JSON.stringify({version:1,quotes:{},routes:[],enabled:false,intervalDays:30,attempts:[],message:'Ready'})})})}});
 assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://www.ysunkara.com');assert(!(await r.text()).includes('hidden-fixture-key'));
});
