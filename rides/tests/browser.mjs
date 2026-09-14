import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../savetheworld/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8093/rides/');await page.getByText('Ausdin drives',{exact:true}).waitFor();
 assert.equal(await page.locator('.car').count(),4);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'Admin access',exact:true}).click();await page.getByRole('button',{name:'Close',exact:true}).filter({visible:true}).click();
 assert.equal(await page.locator('dialog[open]').count(),0);
 await page.getByRole('button',{name:'Admin access',exact:true}).click();
 await page.locator('#loginForm [name=passcode]').fill('194728');await page.getByText('First time setting up admin access?').click();await page.locator('#loginForm [name=setupCode]').fill('local-admin-setup');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Verify rides',exact:true}).waitFor();
 await page.getByLabel('Ride status for Anjali',{exact:true}).selectOption('ride');await page.getByText('Saved. Rides updated automatically.',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('Ride status for Anjali',{exact:true}).inputValue(),'ride');
 await page.getByRole('button',{name:'Add person',exact:true}).click();await page.locator('#personForm [name=name]').fill('Test new member');await page.getByRole('button',{name:'Add a pickup pin',exact:true}).click();await page.locator('#locationForm [name=name]').fill('Test pickup entrance');
 await page.locator('.leaflet-tile-loaded').first().waitFor();await page.locator('#pinMap').click({position:{x:145,y:130}});assert.notEqual(await page.locator('#locationForm [name=lat]').inputValue(),'');
 await page.getByRole('button',{name:'Save pickup pin',exact:true}).click();await page.locator('#location').waitFor({state:'hidden'});await page.getByRole('button',{name:'Save person',exact:true}).click();await page.locator('#person').waitFor({state:'hidden'});
 await page.getByLabel('Ride status for Test new member',{exact:true}).waitFor();
 await page.reload();await page.getByLabel('Ride status for Test new member',{exact:true}).waitFor();
 // Read local test data and finish pins so Verify can be exercised end-to-end.
 const token=await page.evaluate(()=>localStorage.getItem('rides-admin-token'));const api='http://127.0.0.1:8787/v2/state';let s=await (await fetch(api,{headers:{Authorization:'Bearer '+token}})).json();
 const currentId=await page.locator('#eventPicker').inputValue();s.data.locations.forEach((l,i)=>{l.lat=38.03+i*.001;l.lng=-78.5});s.data.roster.forEach(p=>{if(!p.locationId)p.needsRide=false});
 let response=await fetch(api,{method:'PUT',headers:{Authorization:'Bearer '+token},body:JSON.stringify(s)});assert.equal(response.status,200);
 await page.reload();await page.getByRole('button',{name:'Verify rides',exact:true}).click();await page.getByText('Verified by Meera',{exact:true}).waitFor();
 await page.getByLabel('Ride status for Syed',{exact:true}).selectOption('no');await page.getByText('Unverified · auto-posted',{exact:true}).waitFor();
 const selected=await page.locator('#eventPicker').inputValue();const options=await page.locator('#eventPicker option').evaluateAll(xs=>xs.map(x=>x.value));await page.locator('#eventPicker').selectOption(options.find(x=>x!==selected));assert.equal(await page.getByLabel('Ride status for Syed',{exact:true}).inputValue(),'ride');
 await page.getByRole('button',{name:'New event',exact:true}).click();await page.locator('#eventForm [name=title]').fill('Team dinner');await page.locator('#eventForm [name=date]').fill('2026-10-01');await page.getByRole('button',{name:'Save event',exact:true}).click();await page.locator('#event').waitFor({state:'hidden'});await page.getByText('Team dinner · AFC · 8–11 PM',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Sign out · Meera',exact:true}).click();await page.getByRole('button',{name:'Admin access',exact:true}).waitFor();assert.equal(await page.locator('.car').count(),4);
 await page.screenshot({path:'/private/tmp/rides-phone.png',fullPage:true});await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/private/tmp/rides-desktop.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: public cars, mobile layout, modal close, admin setup/login, attendance, map click, add member, persisted session, verify/edit invalidation, event isolation, new event, logout.');
}finally{await browser.close()}
