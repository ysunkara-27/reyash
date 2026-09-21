import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanSnapshot,cleanSettings,displayState,isTaskPup,resting} from '../src/model.mjs';
import {companionSnapshot} from '../../dog/companion-bridge.mjs';
const pet={name:'Biscuit',coat:'honey',collar:'sage',roaming:true};
const snapshot=companionSnapshot({pet,care:{used:1,unlocked:2,last:{task:'PRIVATE'},lifetime:500},focused:true,signedIn:true});
test('site and extension boundaries export only appearance, care flags, and focus',()=>{
 assert.deepEqual(Object.keys(snapshot).sort(),['care','connected','focused','pet','version']);assert.deepEqual(snapshot.care,{used:1,unlocked:2});
 const result=cleanSnapshot({...snapshot,token:'SECRET',tasks:['PRIVATE'],username:'secret'});assert(!JSON.stringify(result).includes('SECRET'));assert(!JSON.stringify(result).includes('PRIVATE'));assert(!('username' in result));
 assert.equal(result.pet.species,'dog');
});
test('logout clears the pet while loading does not erase cached state',()=>{assert.deepEqual(companionSnapshot({signedIn:false}),{version:1,connected:false});assert.equal(companionSnapshot({signedIn:true}),null);assert.deepEqual(cleanSnapshot({version:1,connected:false,token:'no'}),{version:1,connected:false});});
test('only exact HTTPS Task Pup origins can synchronize',()=>{assert(isTaskPup('https://www.taskpup.lol/'));for(const url of ['https://taskpup.lol.attacker.test/','http://taskpup.lol/','https://evil.test/?taskpup.lol','https://www.taskpup.lol@evil.test/','data:text/html,taskpup.lol'])assert(!isTaskPup(url));});
test('untrusted profile values cannot become SVG attributes or unbounded storage',()=>{
 for(const patch of [{coat:'red" onload="alert(1)'},{name:'x'.repeat(25)},{collar:'__proto__'},{species:'dragon'},{roaming:'yes'}])assert.throws(()=>cleanSnapshot({...snapshot,pet:{...pet,...patch}}));
 for(const patch of [{used:8},{used:-1},{used:1.5},{unlocked:4}])assert.throws(()=>cleanSnapshot({...snapshot,care:{...snapshot.care,...patch}}));
 assert.throws(()=>cleanSnapshot({...snapshot,focused:'yes'}));
});
test('disabled, snoozed, and explicitly muted hosts hide the pet',()=>{
 const state={snapshot,settings:{enabled:true,snoozeUntil:1000,mutedHosts:['example.com']}};
 assert(!displayState(state,'other.test',999).show);assert(displayState(state,'other.test',1001).show);assert(!displayState(state,'example.com',1001).show);
 assert(!displayState({...state,settings:{enabled:false}},'other.test',1001).show);assert(!displayState({},'other.test',1001).show);
});
test('settings are bounded and stale focus never traps the pet asleep',()=>{
 const settings=cleanSettings({size:10000,corner:'top',motion:'chaos',mutedHosts:['ok.test','ok.test','bad/path',null]});assert.equal(settings.size,52);assert.equal(settings.corner,'right');assert.equal(settings.motion,'still');assert.deepEqual(settings.mutedHosts,['ok.test']);
 assert(resting(snapshot,1000,0));assert(!resting(snapshot,120001,0));assert(resting({...snapshot,focused:false,care:{used:7}},120001,0));
});
