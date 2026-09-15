import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../savetheworld/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let count=6;
 await page.route('**/v2/state',async route=>{
   assert.equal(route.request().method(),'GET');const response=await route.fetch(),state=await response.json();
   state.admin='Meera';state.data.roster=Array.from({length:count},(_,i)=>({id:'driver-'+i,name:'Driver '+(i+1),active:true,driver:true,capacity:5,needsRide:true,skip:[],locationId:state.data.locations[0].id}));state.data.carPresets=[];
   state.data.events.forEach(e=>e.overrides={});await route.fulfill({response,json:state});
 });
 for(const [width,height,cars] of [[1440,900,6],[1440,900,8],[390,844,6],[375,667,9]]){
   count=cars;await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:8093/rides/');await page.getByText(cars+' cars · all shown',{exact:true}).waitFor();
   assert.equal(await page.locator('.car:visible').count(),cars);assert.equal(await page.locator('.car[hidden]').count(),0);assert.equal(await page.locator('.car-pages').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width>=1000)assert(await page.locator('.cars').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'All car rows fit on desktop');
   await page.getByText('Car '+cars+' of '+cars,{exact:true}).scrollIntoViewIfNeeded();
 }
 assert.deepEqual(errors,[]);console.log('PASS: 6/8 desktop cars fit, 6/9 mobile cars continuously accessible, no hidden cards or horizontal overflow. Mocked roster; no data writes.');
}finally{await browser.close()}
