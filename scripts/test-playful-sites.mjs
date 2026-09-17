// Browser-only fixtures: no requests reach the local or production databases.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {careView} from '../dog/care-model.mjs';
import {progression} from '../dog/progression.mjs';
import {migrate,publicState} from '../rides/model.mjs';
const require=createRequire(new URL('../savetheworld/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const base=process.env.PLAYFUL_TEST_URL||'http://127.0.0.1:8106';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
  let pet={name:'Biscuit',coat:'honey',collar:'sage',roaming:true},used=0,posts=0,ideas=[],playground=true;
  const care=()=>({...careView({day:'2026-09-17',unlocked:3,used},[{done:true}],15),progress:progression(['2026-09-15','2026-09-16','2026-09-17'],'2026-09-17',15),playground});
  await page.addInitScript(()=>localStorage.setItem('good-day-token','fixture'));
  await page.route('http://127.0.0.1:8791/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;let data={};
   if(path==='/dog/day')data={username:'yash',revision:1,pet,care:care(),plan:{start:540,tasks:[{id:'one',name:'One small step',minutes:25,group:'Life',done:true}]}};
   if(path==='/dog/google/status')data={ready:false,connected:false};
   if(path==='/dog/care'){if(req.method()==='POST'){posts++;used|=1;}data={care:care()};}
   if(path==='/dog/profile'){pet=req.postDataJSON().pet;data={pet};}
   if(path==='/requests'){if(req.method()==='POST')ideas.push({idea:req.postDataJSON().idea,created:Date.now()});data={requests:ideas};}
   await route.fulfill({json:data,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'}});
  });
  await page.goto(base+'/dog/');await expect(page.locator('#workspace')).toBeVisible();
  await page.locator('#pet-menu').click();await page.locator('#open-club').click();
  await expect(page.locator('.club-stats')).toContainText('3 day streak');
  await page.getByRole('button',{name:'Throw the ball',exact:true}).click();await expect(page.locator('.club-feedback')).toContainText('1 toss');
  await page.locator('[data-tab="meal"]').click();await page.locator('.meal-choice').selectOption('Cozy stew');await page.locator('[data-feed]').click();
  await expect(page.locator('[data-feed]')).toHaveText('Fed for today');assert.equal(posts,1);
  await page.locator('.club-sandbox summary').click();await page.locator('.sandbox-toggle').check();await page.locator('[data-feed]').click();assert.equal(posts,1);
  await page.locator('[data-tab="collection"]').click();await page.locator('[data-adopt="luna"]').click();await expect(page.locator('.club-feedback')).toContainText('Previewing Luna');assert.equal(pet.name,'Biscuit');
  await page.locator('.sandbox-toggle').uncheck();await expect(page.locator('[data-adopt="luna"]')).toBeDisabled();await page.locator('[data-adopt="mochi"]').click();await expect(page.locator('.club-feedback')).toContainText('Mochi is your active');assert.equal(pet.species,'cat');
  await page.locator('[data-tab="play"]').click();await page.locator('[data-trick="roll"]').click();await expect(page.locator('.club-feedback')).toContainText('roll');
  assert.equal(await page.locator('#clubhouse').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await page.screenshot({path:`/private/tmp/taskpup-club-${width}.png`});
  await page.getByRole('button',{name:'Close companion club'}).click();
  await page.getByRole('button',{name:'Ideas & requests'}).click();await page.locator('.feature-log textarea').fill('Please add a rainy day backdrop');await page.getByRole('button',{name:'Add request'}).click();await expect(page.locator('.feature-log li')).toContainText('rainy day');
  await page.getByRole('button',{name:'Close request log'}).click();
  playground=false;await page.reload();await expect(page.locator('#workspace')).toBeVisible();await page.locator('#pet-menu').click();await page.locator('#open-club').click();await expect(page.locator('.club-sandbox')).toBeHidden();
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 let submitted;
 await page.route('https://unpkg.com/**',r=>r.abort());
 await page.route('http://127.0.0.1:8787/**',async route=>{const url=new URL(route.request().url());let data={};if(url.pathname==='/v2/state')data={data:publicState(migrate({roster:[]})),revision:1,admin:null};if(url.pathname==='/v2/game'){assert.equal(url.searchParams.get('mode'),'traffic');if(route.request().method()==='POST')submitted=route.request().postDataJSON();data={scores:submitted?[submitted]:[],day:'2026-09-17'};}if(url.pathname==='/requests')data={requests:[]};await route.fulfill({json:data,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'}});});
 await page.goto(base+'/rides/');await page.getByRole('button',{name:'Play & leaderboard'}).click();await page.locator('#startGame').click();
 await page.locator('#road').press('ArrowLeft');await expect(page.locator('[data-lane="0"]')).toHaveAttribute('aria-pressed','true');await page.locator('#road').press('3');await expect(page.locator('[data-lane="2"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#road').press(' ');await expect(page.locator('#pauseGame')).toHaveText('Resume');await page.screenshot({path:'/private/tmp/rides-traffic-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/private/tmp/rides-traffic-mobile.png'});
 assert.equal(await page.locator('#gamePanel').evaluate(el=>el.scrollWidth>el.clientWidth),false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('#pauseGame').click();await page.locator('[data-lane="1"]').click();await page.locator('#scoreForm').waitFor({state:'visible',timeout:45000});
 await page.locator('#scoreForm input').fill('fixture racer');await page.getByRole('button',{name:'Submit score',exact:true}).click();await expect(page.locator('#scoreNotice')).toContainText('Saved!');assert(submitted.score>0);
 await page.locator('#boardScope').selectOption('all');await page.locator('#startGame').click();await page.locator('#closeGame').click();await page.getByRole('button',{name:'Play & leaderboard'}).click();await expect(page.locator('#startGame')).toBeVisible();
 assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile companion meals, play, sandbox isolation, cat adoption, request log; three-lane keyboard/touch controls, pause, crash, score submission and reopen.');
}finally{await browser.close();}
