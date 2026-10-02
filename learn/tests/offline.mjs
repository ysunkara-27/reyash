import {chromium} from '../../savetheworld/node_modules/playwright/index.mjs';
import {createServer} from 'node:http';
import {readFile,mkdtemp} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {lessons} from '../content.mjs';
const root=resolve(import.meta.dirname,'../..');
let server;
const url=process.env.LEARN_URL||'http://127.0.0.1:8102/learn';
if(!process.env.LEARN_URL){server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path==='/learn'||path==='/learn/')path='/learn/index.html';if(!path.startsWith('/learn/')){res.writeHead(404).end();return}const file=resolve(root,'.'+path);if(!file.startsWith(root+'/learn/'))throw Error();const body=await readFile(file);res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css'})[extname(file)]||'application/octet-stream');if(path.endsWith('/sw.js'))res.setHeader('Service-Worker-Allowed','/learn');res.end(body);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(8102,'127.0.0.1',r));}
const profile=await mkdtemp('/private/tmp/learn-offline-profile-');
let context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true});
let page=await context.newPage();await page.goto(url);
await page.locator('#offline-open').click();await page.locator('#offline-prepare').click();
await page.waitForFunction(()=>document.querySelector('#offline-status')?.textContent.includes('and plotting passed'),{},{timeout:360000});
console.log('DOWNLOAD:',await page.locator('#offline-status').textContent());
const cached=await page.evaluate(async()=>{const names=await caches.keys();const c=await caches.open(names.find(n=>n.startsWith('learn-python-')));return (await c.keys()).length});console.log('Saved runtime entries:',cached);
await page.locator('#offline-close').click();await page.getByRole('button',{name:'03 Practice desk'}).click();await page.locator('[data-lesson="select"]').click();await page.locator('textarea').fill('# My offline draft');
const session=await context.newCDPSession(page);await session.send('Network.clearBrowserCache');await context.close();
// Cold start in a new browser process; HTTP cache cleared, networking disabled.
context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}});await context.setOffline(true);page=await context.newPage();
await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForSelector('nav button');
console.log('Cold offline navigation: PASS');
await page.getByRole('button',{name:'03 Practice desk'}).click();await page.locator('[data-lesson="select"]').click();if(await page.locator('textarea').inputValue()!=='# My offline draft')throw Error('Draft lost');
const selected=['r4','sq2','mo3','ed2'].map(id=>lessons.flatMap(l=>l.drills).find(q=>q.id===id));
const result=await page.evaluate(async tasks=>{const w=new Worker('./worker.mjs',{type:'module'});const out=[];for(const q of tasks){const r=await new Promise(resolve=>{w.onmessage=({data})=>{if(data.done)resolve(data)};w.postMessage({setup:q.setup,code:q.solution,checks:q.checks,reference:q.reference})});out.push({id:q.id,passed:r.checks?.every(Boolean)&&!r.error,error:r.error,plot:!!r.plot});}w.terminate();return out;},selected);
console.log('OFFLINE PYTHON:',JSON.stringify(result));if(result.some(r=>!r.passed)||!result.find(r=>r.id==='ed2').plot)throw Error('Offline execution failed');
await page.locator('#offline-open').click();await page.waitForFunction(()=>document.querySelector('#offline-status')?.textContent.includes('Saved on this browser'),{},{timeout:15000});
await page.screenshot({path:'/private/tmp/learn-offline.png',fullPage:true});
// Removing one wheel must remove the ready claim and an offline retry must fail.
await page.evaluate(async()=>{const n=(await caches.keys()).find(n=>n.startsWith('learn-python-'));const c=await caches.open(n);const k=(await c.keys()).find(r=>r.url.includes('scikit_learn-'));await c.delete(k);});
await page.locator('#offline-close').click();await page.locator('#offline-open').click();await page.waitForFunction(()=>document.querySelector('#offline-status')?.textContent.startsWith('Lessons save automatically'));
await page.locator('#offline-prepare').click();await page.waitForFunction(()=>document.querySelector('#offline-status')?.textContent.startsWith('Not fully ready:'),{},{timeout:30000});
console.log('Missing file detected; disconnected retry correctly fails. Progress intact.');
await context.close();if(server)await new Promise(r=>server.close(r));
