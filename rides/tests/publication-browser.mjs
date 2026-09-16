import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {migrate} from '../model.mjs';
import {handle} from '../api/src/v2.mjs';
const require=createRequire(new URL('../../savetheworld/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
let stored=migrate({roster:[{name:'Driver A',driver:true,address:'One'},{name:'Driver B',driver:true,address:'Two'},{name:'Rider One',address:'One'},{name:'Rider Two',address:'One'}]}),revision=0;
stored.locations.forEach((l,i)=>Object.assign(l,{lat:38+i*.001,lng:-78.5}));
stored.roster.push({...stored.roster[2],id:'walking',name:'Walker',needsRide:false});
const env={DB:{prepare(sql){return {args:[],bind(...args){this.args=args;return this},async first(){return sql.includes('SELECT name')?{name:'Meera'}:{data:JSON.stringify(stored),revision}},async run(){stored=JSON.parse(this.args[0]);revision++;return {meta:{changes:1}}}}}}};
const helpers={headers:{},json:(d,s=200)=>Response.json(d,{status:s}),userFrom:async req=>req.headers.has('Authorization')?{name:'Meera'}:null};
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/v2/**',async route=>{
   const original=route.request(),url=new URL(original.url());
   if(url.pathname.endsWith('/game'))return route.fulfill({json:{scores:[]}});
   if(url.pathname.endsWith('/login'))return route.fulfill({json:{token:'test-session'}});
   const response=await handle(new Request(original.url(),{method:original.method(),headers:original.headers(),...(original.method()==='PUT'?{body:original.postData()}: {})}),env,helpers);
   await route.fulfill({status:response.status,json:await response.json()});
 });
 await page.goto('http://127.0.0.1:8098/rides/?event='+stored.events[0].id);
 await page.getByText('Rides aren’t posted yet',{exact:true}).waitFor();assert.equal(await page.locator('.car').count(),0);await page.getByRole('button',{name:'Play & leaderboard'}).waitFor();
 const login=async()=>{await page.getByRole('button',{name:'Admin access',exact:true}).click();await page.locator('#loginForm [name=passcode]').fill('1234');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Edit rides',exact:true}).waitFor()};
 await login();await page.getByRole('button',{name:'Change ride for Rider One',exact:true}).click();await page.locator('#rideForm [name=carId]').selectOption('person-1');await page.getByRole('button',{name:'Save ride',exact:true}).click();await page.locator('#routePanel').waitFor({state:'hidden'});
 assert.equal(stored.events[0].overrides['person-3'].carId,'person-0');
 await page.getByRole('button',{name:'Edit rides',exact:true}).click();await page.getByRole('button',{name:'Verify & post rides',exact:true}).click();await page.getByRole('button',{name:'Close edit rides'}).click();await page.getByRole('button',{name:'Sign out · Meera',exact:true}).click();
 await page.getByText('✓ Verified by admin · Meera',{exact:true}).waitFor();assert.equal(await page.locator('.car').count(),2);await page.locator('.no-ride-list').getByText('Walker',{exact:true}).waitFor();
 await login();await page.getByRole('button',{name:'Change ride for Rider One',exact:true}).click();await page.getByRole('button',{name:'No ride needed',exact:true}).click();await page.locator('#routePanel').waitFor({state:'hidden'});await page.getByRole('button',{name:'Sign out · Meera',exact:true}).click();await page.getByText('Rides aren’t posted yet',{exact:true}).waitFor();assert.equal(await page.locator('.car').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: mobile draft waiting page, stable manual move, verify/public view, edit/unpublish; disposable in-memory data only.');
}finally{await browser.close()}
