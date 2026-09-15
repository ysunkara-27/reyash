import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {validate} from '../model.mjs';
const require=createRequire(new URL('../../savetheworld/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();let state,writes=0;
 await page.route('**/v2/state',async route=>{
   if(route.request().method()==='PUT'){const body=route.request().postDataJSON();validate(body.data);state={data:body.data,revision:state.revision+1,admin:'Meera'};writes++}
   else if(!state){const response=await route.fetch();state=await response.json();state.admin='Meera';state.data.roster.push({id:'remove-test',name:'Temporary member',active:true,driver:false,needsRide:true,capacity:5,skip:[],locationId:state.data.locations[0].id})}
   await route.fulfill({json:state,headers:{'Access-Control-Allow-Origin':'*'}});
 });
 await page.goto('http://127.0.0.1:8093/rides/');await page.getByRole('button',{name:'Edit rides',exact:true}).click();
 await page.locator('[data-person="remove-test"]').first().click();
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Remove person',exact:true}).click();assert.equal(writes,0);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Remove person',exact:true}).click();await page.locator('#person').waitFor({state:'hidden'});
 assert.equal(writes,1);assert(!state.data.roster.some(p=>p.id==='remove-test'));await page.reload();await page.getByRole('button',{name:'Edit rides',exact:true}).click();assert.equal(await page.locator('[data-person="remove-test"]').count(),0);
 console.log('PASS: cancel keeps person; confirmation removes person and remains removed after reload. All writes mocked, no user data deleted.');
}finally{await browser.close()}
