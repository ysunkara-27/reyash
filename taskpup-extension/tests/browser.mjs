// Isolated Chromium test profile; never touches the user's browser or accounts.
// The fixture manifest pregrants website access only in this disposable profile.
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdtemp,cp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../savetheworld/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const fixture=await mkdtemp(join(tmpdir(),'taskpup-extension-test-')),extension=join(fixture,'extension');
await cp(resolve('taskpup-extension/unpacked'),extension,{recursive:true});
const manifest=JSON.parse(await readFile(join(extension,'manifest.json'),'utf8'));
manifest.host_permissions=['https://*/*','http://*/*'];await writeFile(join(extension,'manifest.json'),JSON.stringify(manifest));
const executablePath=process.env.TASKPUP_TEST_CHROMIUM||[chromium.executablePath(),'/private/tmp/taskpup-test-browsers/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'].find(existsSync);
if(!executablePath)throw new Error('Set TASKPUP_TEST_CHROMIUM to a current Chromium / Chrome for Testing executable.');
const context=await chromium.launchPersistentContext(join(fixture,'profile'),{executablePath,headless:false,ignoreDefaultArgs:['--disable-extensions'],args:['--headless=new',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`],viewport:{width:1280,height:800}});
const errors=[];context.on('console',message=>{if(message.type()==='error')console.error('Browser:',message.text());});console.log('Browser launched');
const snapshot={version:1,connected:true,pet:{name:'Biscuit',coat:'honey',collar:'sage',roaming:true},care:{used:1,unlocked:2},focused:false};
try{
 let worker=context.serviceWorkers()[0];if(!worker)worker=await context.waitForEvent('serviceworker');
 const extensionId=new URL(worker.url()).host;console.log('Worker loaded');
 await context.route('https://www.taskpup.lol/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body><h1>Task Pup fixture</h1><div id="pet-wanderer"></div></body></html>'}));
 await context.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':"default-src 'none'; style-src 'none'; script-src 'none'; require-trusted-types-for 'script'"},body:'<!doctype html><html><body><h1>Reading, quietly.</h1><p>A fixture page with a strict content security policy.</p><label>Write here <input id="editor"></label><button id="underlying">Page button</button></body></html>'}));
 const popup=await context.newPage();await popup.goto(`chrome-extension://${extensionId}/popup.html`);popup.on('pageerror',e=>errors.push(e.message));
 console.log('Popup loaded');const enabled=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'ENABLE_SITES'}));assert(!enabled.error,enabled.error);console.log('Sites enabled');
 const home=await context.newPage();await home.goto('https://www.taskpup.lol/');home.on('pageerror',e=>errors.push(e.message));
 await home.evaluate(value=>document.dispatchEvent(new CustomEvent('taskpup:companion-state',{detail:JSON.stringify(value)})),snapshot);
 await expect.poll(()=>worker.evaluate(async()=>!!(await chrome.storage.local.get('snapshot')).snapshot?.connected)).toBe(true);
 assert.equal(await home.locator('taskpup-companion').count(),0);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://example.com/');await page.bringToFront();
 await expect(page.locator('taskpup-companion')).toBeVisible();
 // Closed shadow DOM is intentionally opaque to page scripts; use real input
 // and the accessibility tree to exercise the overlay instead of exposing it.
 assert.equal(await page.locator('taskpup-companion').evaluate(el=>el.shadowRoot),null);
 await page.screenshot({path:'/private/tmp/taskpup-extension-desktop.png'});
 const box=await page.locator('taskpup-companion').boundingBox();assert.equal(Math.round(box.width),52);assert(box.x>1100);
 await page.mouse.click(box.x+26,box.y+28);
 await page.screenshot({path:'/private/tmp/taskpup-extension-menu.png'});
 // Tab reaches the four real buttons inside the closed shadow root.
 await page.keyboard.press('Tab');await page.keyboard.press('Enter');
 const moved=await page.locator('taskpup-companion').boundingBox();assert(moved.x<50);
 await page.locator('#editor').fill('Normal page input remains usable');
 assert.equal(await page.locator('#editor').inputValue(),'Normal page input remains usable');
 await popup.bringToFront();await popup.reload();await popup.locator('#motion').selectOption('gentle');await popup.locator('#size').selectOption('44');
 await page.bringToFront();await expect.poll(async()=>Math.round((await page.locator('taskpup-companion').boundingBox()).width)).toBe(44);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>document.documentElement.requestFullscreen());await expect(page.locator('taskpup-companion')).toBeHidden();await page.evaluate(()=>document.exitFullscreen());await expect(page.locator('taskpup-companion')).toBeVisible();
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'/private/tmp/taskpup-extension-small.png'});
 await popup.bringToFront();await popup.locator('#snooze').click();await page.bringToFront();await expect(page.locator('taskpup-companion')).toBeHidden();
 await popup.bringToFront();await popup.locator('#snooze').click();await page.bringToFront();await expect(page.locator('taskpup-companion')).toBeVisible();
 const current=await page.locator('taskpup-companion').boundingBox();await page.mouse.click(current.x+22,current.y+22);await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Enter');await expect(page.locator('taskpup-companion')).toBeHidden();
 await popup.bringToFront();await popup.reload();await popup.getByText('Hidden websites & connection').click();await popup.getByRole('button',{name:'Show again'}).click();await page.bringToFront();await expect(page.locator('taskpup-companion')).toBeVisible();
 await home.bringToFront();await home.evaluate(()=>document.dispatchEvent(new CustomEvent('taskpup:companion-state',{detail:JSON.stringify({version:1,connected:false})})));await page.bringToFront();await expect(page.locator('taskpup-companion')).toBeHidden();
 assert.deepEqual(errors,[]);console.log('PASS: real MV3 worker + bridge, isolated overlay, strict CSP, no duplicate native pet, controls, normal typing, popup preferences, snooze, site exclusion, logout and small-screen layout.');
}finally{await context.close();}
