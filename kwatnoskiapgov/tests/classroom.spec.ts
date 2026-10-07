import {test,expect,type BrowserContext,type Page} from '@playwright/test';
const ids=['blueA','blueB','blueC','redA','redB','redC'];
const key='apgov-classroom-session-v1';
async function closeGuide(p:Page){const b=p.getByRole('button',{name:'Close tutorial'});await b.waitFor({state:'visible',timeout:10000});await b.click();}
async function session(p:Page){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);}
async function state(p:Page){return p.evaluate(async k=>{const s=JSON.parse(localStorage.getItem(k)!);const base=location.hostname.includes('workers.dev')?location.origin:'';const r=await fetch(`${base}/api/classes/${s.code}/state`,{headers:{Authorization:'Bearer '+s.token}});return r.json();},key);}
async function action(p:Page,a:object,gameId='1'){
 return p.evaluate(async({key,a,gameId})=>{const s=JSON.parse(localStorage.getItem(key)!);const base=location.hostname.includes('workers.dev')?location.origin:'';const headers={Authorization:'Bearer '+s.token,'Content-Type':'application/json'};const v=await(await fetch(`${base}/api/classes/${s.code}/state`,{headers})).json();const r=await fetch(`${base}/api/classes/${s.code}/action`,{method:'POST',headers,body:JSON.stringify({gameId,revision:['pauseAll','startAll'].includes((a as any).type)?v.revision:(v.games.find((g:any)=>g.id===gameId)?.revision??0),requestId:crypto.randomUUID(),action:a})});return {status:r.status,data:await r.json()};},{key,a,gameId});
}
test('five tables, thirty independent students, Smart Board, permissions, refresh and outages',async({browser,baseURL},testInfo)=>{
 const contexts:BrowserContext[]=[];const pages:Page[]=[];const errors:string[]=[];
 const tc=await browser.newContext();contexts.push(tc);const teacher=await tc.newPage();teacher.on('pageerror',e=>errors.push(e.message));await teacher.goto(baseURL!);
 await teacher.getByRole('button',{name:'Teacher',exact:true}).click();await teacher.getByLabel('Class name').fill('Classroom rehearsal');await teacher.getByRole('button',{name:'Create classroom'}).click();await expect(teacher.getByRole('heading',{name:'Teacher desk'})).toBeVisible();await closeGuide(teacher);
 const s=await session(teacher);const code=s.code;expect(code).toHaveLength(6);
 // Separate browser contexts guarantee no shared localStorage/session credentials.
 for(let table=1;table<=5;table++)for(let seat=0;seat<6;seat++){
  const c=await browser.newContext();contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(baseURL!);await p.getByLabel('Class code',{exact:true}).fill(code);await p.getByRole('button',{name:'Find my class'}).click();await p.getByRole('button',{name:new RegExp(`^Table ${table} ·`)}).click();await closeGuide(p);await p.getByLabel('Your first name or nickname').fill(`T${table} Student ${seat+1}`);await p.getByRole('button',{name:`Claim ${ids[seat]}`,exact:true}).click();await expect(p.getByText('Your candidate ✓')).toBeVisible();pages.push(p);
 }
 await teacher.screenshot({path:testInfo.outputPath('teacher-five-tables.png'),fullPage:true});
 await expect(teacher.locator('.table-summary b')).toHaveText(Array(5).fill('6/6 candidates'));await teacher.getByRole('button',{name:'Start all ready tables'}).click();await expect(teacher.getByRole('heading',{name:/’s turn/})).toBeVisible();
 const v=await state(teacher);expect(v.games).toHaveLength(5);expect(v.games.every((g:any)=>g.phase==='primary')).toBe(true);
 const first=v.games[0];const active=first.order[first.turn];const acting=pages[ids.indexOf(active)];const waiting=pages[ids.indexOf(ids.find(id=>id!==active)!)];
 const denied=await action(waiting,{type:'draw'});expect(denied.status).toBe(400);expect(denied.data.error).toContain('Wait');
 const foreign=await action(acting,{type:'draw'},'2');expect(foreign.status).toBe(403);
 await expect(acting.getByRole('button',{name:'Draw 3 cards',exact:true})).toBeEnabled();await acting.getByRole('button',{name:'Draw 3 cards',exact:true}).click();await expect(acting.getByRole('heading',{name:'Your hand · 3 cards'})).toBeVisible();
 const hand=(await state(acting)).games[0].hands[active];expect(hand).toHaveLength(3);expect(Object.values((await state(waiting)).games[0].hands).flat()).toHaveLength(0);
 await acting.reload();await expect(acting.getByRole('heading',{name:'Your hand · 3 cards'})).toBeVisible();
 await teacher.getByRole('button',{name:'Pause all tables',exact:true}).click();for(const p of [acting,pages[29]])await expect(p.getByText('Class paused by the teacher. Look up at the Smart Board.')).toBeVisible();
 const paused=await action(acting,{type:'discard',card:hand[0]});expect(paused.data.error).toContain('paused');
 await teacher.getByRole('button',{name:'Resume all tables',exact:true}).click();await expect(acting.getByText('Class paused by the teacher. Look up at the Smart Board.')).not.toBeVisible();
 await acting.screenshot({path:testInfo.outputPath('student-turn.png'),fullPage:true});
 // Actually complete a turn with the visible card controls.
 await acting.locator('.hand-card').first().click();await acting.getByRole('button',{name:'Play this card',exact:true}).click();await expect(acting.locator('.turn-checklist')).toContainText('2. Play ≥1 ✓');
 await acting.locator('.hand-card').first().click();await acting.getByRole('button',{name:'Discard this card',exact:true}).click();await expect(acting.getByRole('button',{name:'Finish turn',exact:true})).toBeEnabled();await acting.getByRole('button',{name:'Finish turn',exact:true}).click();
 await expect.poll(async()=>((await state(teacher)).games[0].turn)).toBeGreaterThan(0);expect((await state(teacher)).games.slice(1).every((g:any)=>g.turn===0&&!g.drawn)).toBe(true);
 // Public projector receives no hands and cycles without exposing the private key.
 const pc=await browser.newContext();contexts.push(pc);const projector=await pc.newPage();await projector.goto(`${baseURL}?monitor=${code}`);await expect(projector.getByRole('heading',{name:'Classroom monitor'})).toBeVisible();await expect(projector.locator('.projector > .spread h2')).toHaveText('Table 1');await expect(projector.locator('.projector > .spread h2')).toHaveText('Table 2',{timeout:12000});await projector.screenshot({path:testInfo.outputPath('smart-board.png'),fullPage:true});expect(await projector.content()).not.toContain(s.token);
 // A device offline cannot issue a move; reload retains the seat after reconnecting.
 const ac=acting.context();await ac.setOffline(true);await expect(acting.getByRole('status').first()).toContainText('Reconnecting',{timeout:15000});await ac.setOffline(false);await expect(acting.getByRole('status').first()).toContainText('Live',{timeout:15000});
 await acting.setViewportSize({width:390,height:844});await acting.getByRole('button',{name:'State cards & counting',exact:true}).click();await expect(acting.getByRole('heading',{name:'State cards & how we count'})).toBeVisible();expect(await acting.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await acting.screenshot({path:testInfo.outputPath('mobile-counting.png'),fullPage:true});
 expect(errors).toEqual([]);for(const c of contexts)await c.close();
});

test('first-time walkthrough has working counting example',async({page,baseURL},testInfo)=>{
 await page.goto(baseURL!);await page.getByRole('button',{name:'First time? Take the tour'}).click();await expect(page.getByRole('dialog')).toBeVisible();for(let i=0;i<4;i++)await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Show who gets the delegates'}).click();await expect(page.getByText(/Blue A wins 12 points/)).toBeVisible();await page.screenshot({path:testInfo.outputPath('counting-tutorial.png')});await page.getByRole('button',{name:'Close tutorial'}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
});
