import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../savetheworld/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/v2/state',r=>r.fulfill({json:{admin:null,revision:0,data:{roster:[],locations:[],events:[{id:'test',date:'2026-09-16',title:'Practice',location:'AFC',time:'8–11 PM',verified:null,overrides:{}}]}}}));
 await page.route('**/v2/game?*',r=>{assert.equal(r.request().method(),'GET');const all=new URL(r.request().url()).searchParams.get('scope')==='all';return r.fulfill({json:{day:'2026-09-16',scores:Array.from({length:9},(_,i)=>({name:(all?'alltime':'today')+'player'+i,score:35738-i*1000}))}})});
 for(const width of [1440,390,375]){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:8098/rides/');await page.locator('.teaser-board li').filter({hasText:'todayplayer0'}).waitFor();
  assert.equal(await page.locator('.teaser-board li').count(),6);
  const before=await page.locator('.game-teaser').boundingBox();
  const tops=await page.locator('.teaser-board li').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().top));assert.equal(new Set(tops).size,3);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole('button',{name:'All-time',exact:true}).click();await page.locator('.teaser-board li').filter({hasText:'alltimeplayer0'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'All-time',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal((await page.locator('.game-teaser').boundingBox()).height,before.height);
  await page.getByRole('button',{name:'Play & leaderboard',exact:true}).click();assert.equal(await page.locator('#boardScope').inputValue(),'all');
  await page.locator('#boardScope').selectOption('daily');await page.locator('#gamePanel li').filter({hasText:'todayplayer0'}).waitFor();await page.getByRole('button',{name:'Close game',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Today',exact:true}).getAttribute('aria-pressed'),'true');
  await page.screenshot({path:'/private/tmp/rides-leaderboard-'+width+'.png',fullPage:true});
 }
 assert.deepEqual(errors,[]);console.log('PASS: top six in three rows, Today/All-time controls and modal sync, stable section height and no mobile overflow. All scores mocked.');
}finally{await browser.close()}
