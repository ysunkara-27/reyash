import {test} from 'node:test';
import assert from 'node:assert/strict';
const event=()=>({addListener(){},removeListener(){}});
let storage={},registered=[],permissions=true,sent=[],opened=[],accessLevel;
globalThis.chrome={
 runtime:{id:'test-id',getURL:path=>'chrome-extension://test-id/'+path,onMessage:event(),onInstalled:event(),onStartup:event()},
 storage:{local:{async setAccessLevel(value){accessLevel=value.accessLevel;},async get(keys){return Object.fromEntries(keys.filter(k=>k in storage).map(k=>[k,storage[k]]));},async set(next){Object.assign(storage,next);},async remove(keys){keys.forEach(k=>delete storage[k]);}}},
 permissions:{async contains(){return permissions;},onAdded:event(),onRemoved:event()},
 tabs:{async query(){return [{id:1,windowId:1,url:'https://example.com/'}];},async sendMessage(id,payload){sent.push({id,payload});},async create(tab){opened.push(tab);},async update(id,value){opened.push({id,...value});}},windows:{async update(){}},
 scripting:{async getRegisteredContentScripts(){return registered;},async registerContentScripts(value){registered.push(...value);},async unregisterContentScripts(){registered=[];},async executeScript(){}},
};
const {handle}=await import('../src/background.mjs');
const popup={id:'test-id',url:'chrome-extension://test-id/popup.html'};
const site={id:'test-id',url:'https://www.taskpup.lol/',frameId:0,tab:{id:2}};
const content={id:'test-id',url:'https://example.com/',frameId:0,tab:{id:1}};
const snapshot={version:1,connected:true,pet:{name:'Pip',coat:'cream',collar:'berry',roaming:true},care:{used:1,unlocked:2},focused:false};
test('trusted storage and sender validation keep the site bridge display-only',async()=>{
 assert.equal(accessLevel,'TRUSTED_CONTEXTS');
 await assert.rejects(handle({type:'SYNC',snapshot},content));await assert.rejects(handle({type:'SYNC',snapshot},{...site,frameId:1}));await assert.rejects(handle({type:'GET'},{...popup,id:'wrong'}));
 await handle({type:'SYNC',snapshot:{...snapshot,password:'secret'}},site);assert.equal(storage.snapshot.pet.name,'Pip');assert(!JSON.stringify(storage.snapshot).includes('secret'));assert(sent.length>0);
 await assert.rejects(handle({type:'SETTINGS',patch:{enabled:false}},content));await assert.rejects(handle({type:'CONNECT'},content));
});
test('site-specific hiding uses the actual sender host, not a supplied URL',async()=>{
 await handle({type:'MUTE',host:'another.test'},content);assert.deepEqual(storage.settings.mutedHosts,['example.com']);assert.equal((await handle({type:'GET'},content)).show,false);
 await handle({type:'SETTINGS',patch:{mutedHosts:[],size:44}},popup);assert.equal((await handle({type:'GET'},content)).show,true);
});
test('disconnect survives subsequent heartbeats until an explicit reconnect',async()=>{
 await handle({type:'DISCONNECT'},popup);await handle({type:'SYNC',snapshot},site);assert.equal(storage.snapshot,undefined);
 await handle({type:'CONNECT'},popup);await handle({type:'SYNC',snapshot},site);assert.equal(storage.snapshot.pet.name,'Pip');assert(opened.every(t=>t.url==='https://www.taskpup.lol/'));
});
test('website injection is permission gated and persists across worker suspension',async()=>{
 permissions=false;await assert.rejects(handle({type:'ENABLE_SITES'},popup));assert.equal(registered.length,0);
 permissions=true;await handle({type:'ENABLE_SITES'},popup);assert.equal(registered.length,1);assert.equal(registered[0].persistAcrossSessions,true);await handle({type:'ENABLE_SITES'},popup);assert.equal(registered.length,1);
});
test('logout clears existing companion displays and does not carry task data',async()=>{
 await handle({type:'SYNC',snapshot:{version:1,connected:false}},site);assert.equal((await handle({type:'GET'},content)).show,false);
 assert(sent.at(-1).payload.state.snapshot.connected===false);
});
