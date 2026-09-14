import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787/v2/';
const login=await fetch(base+'login',{method:'POST',body:JSON.stringify({name:'Meera',passcode:'194728',setupCode:'local-admin-setup'})});assert.equal(login.status,200);const {token}=await login.json();
const headers={Authorization:'Bearer '+token};
let response=await fetch(base+'state',{method:'PUT',body:'{}'});assert.equal(response.status,401);
response=await fetch(base+'login',{method:'POST',body:JSON.stringify({name:'Meera',passcode:'000000'})});assert.equal(response.status,401);
let state=await(await fetch(base+'state',{headers})).json();
const put=body=>fetch(base+'state',{method:'PUT',headers,body:JSON.stringify(body)});
response=await put(state);assert.equal(response.status,200);response=await put(state);assert.equal(response.status,409);
state=await(await fetch(base+'state',{headers})).json();state.data.roster[0].capacity=6;response=await put(state);assert.equal(response.status,400);
state=await(await fetch(base+'state',{headers})).json();const id=state.data.events[0].id;response=await put({...state,verifyId:id});assert.equal(response.status,200);state=await response.json();assert.equal(state.data.events[0].verified.by,'Meera');
state.data.roster[0].name+=' test';response=await put(state);assert.equal(response.status,200);state=await response.json();assert.equal(state.data.events[0].verified,null);
// A client cannot manufacture a checked badge.
state.data.events[0].verified={by:'Fake admin',at:new Date().toISOString()};response=await put(state);assert.equal(response.status,200);assert.equal((await response.json()).data.events[0].verified,null);
const publicState=await(await fetch(base+'state')).json();assert.equal(publicState.admin,null);assert(publicState.data.roster.length>20);
console.log('PASS: anonymous reads, protected writes, bad PIN, concurrent edit rejection, capacity validation, verification, global edit invalidation, forged verification ignored.');
