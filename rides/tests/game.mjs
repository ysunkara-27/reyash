import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../savetheworld/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 let scores=[],submitted;
 // Mock only the leaderboard: no test scores or rider edits touch preview data.
 await p.route('**/v2/game?*',async route=>{if(route.request().method()==='POST'){submitted=route.request().postDataJSON();scores=[submitted]}await route.fulfill({json:{scores,day:'2026-09-15'},headers:{'Access-Control-Allow-Origin':'*'}})});
 await p.goto('http://127.0.0.1:8093/rides/');
 await p.getByRole('button',{name:'Play & leaderboard',exact:true}).click();
 await p.getByRole('link',{name:'Watch this raas set today ↗',exact:true}).waitFor();
 await p.getByRole('button',{name:'Start endless run',exact:true}).click();
 await p.locator('#road').click();
 await p.locator('#scoreForm').waitFor({state:'visible',timeout:26000});
 await p.locator('#scoreForm input').fill('test racer');
 await p.getByRole('button',{name:'Submit score',exact:true}).click();
 await p.getByText('Saved! Your best score stays on the board.',{exact:true}).waitFor();
 assert.equal(submitted.name,'test racer');assert(Number.isInteger(submitted.score));assert.equal(submitted.day,'2026-09-15');
 await p.locator('#boardScope').selectOption('all');
 await p.getByRole('button',{name:'Play again',exact:true}).click();
 await p.getByRole('button',{name:'Pause',exact:true}).click();
 await p.getByRole('button',{name:'Resume',exact:true}).waitFor();
 await p.getByRole('button',{name:'Close game',exact:true}).click();
 await p.getByRole('button',{name:'Play & leaderboard',exact:true}).click();
 await p.getByRole('button',{name:'Play again',exact:true}).waitFor();
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: mobile play, game end, mocked score submission, leaderboard rendering, and closing/reopening mid-round. No preview scores written.');
}finally{await b.close()}
