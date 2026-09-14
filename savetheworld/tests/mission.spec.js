import { test, expect } from '@playwright/test';
async function begin(page){
  await page.goto('/savetheworld/');
  await page.getByRole('button',{name:'Okay, what do I need?'}).click();
  await expect(page.getByText('Classification X7-B · Eraser',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Show me the plan'}).click();
  await page.getByRole('button',{name:'Begin mission'}).click();
  await page.getByRole('button',{name:'Find an eraser'}).click();
}
async function acquire(page,sku='EM-07237'){
  await page.getByRole('textbox',{name:'Search marketplace'}).fill(sku);
  await page.getByRole('button',{name:'Search →',exact:true}).click();
  await page.getByRole('button',{name:`SKU ${sku} · specifications`}).click();
  await expect(page.getByText(sku,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Commit object to order container'}).click();
  await page.getByRole('button',{name:'Account settings ☰'}).click();
  await page.getByRole('button',{name:/Item Vault \/ Purchase Bucket/}).click();
  await page.getByRole('button',{name:'No',exact:true}).click();
  for(let i=0;i<6;i++){
    await page.getByRole('radio').first().check();
    await page.getByRole('button',{name:'Continue transaction lifecycle →'}).click();
  }
  await page.getByRole('button',{name:'Finalize simulated purchase'}).click();
}
async function erase(page){
  const box=await page.locator('canvas').boundingBox();
  for(let y=box.y+9;y<box.y+box.height;y+=box.height/34){
    if(await page.getByText('MISSION COMPLETE').isVisible()) break;
    await page.mouse.move(box.x+5,y);await page.mouse.down();
    await page.mouse.move(box.x+box.width-5,y,{steps:14});await page.mouse.up();
  }
}
test('correct purchase and physical erasing succeed before deadline',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/savetheworld/');await page.screenshot({path:'/private/tmp/savetheworld-room.png',fullPage:true});
  await begin(page);await page.screenshot({path:'/private/tmp/savetheworld-shop.png',fullPage:true});
  await acquire(page);
  await expect(page.getByText('Eraser equipped. Press and drag across the formula.',{exact:true})).toBeVisible();
  await erase(page);
  await expect(page.getByRole('heading',{name:'HUMANITY RETAINS CONTROL.'})).toBeVisible();
  expect(errors).toEqual([]);
});
test('failure timer counts upward and user can still complete',async({page})=>{
  await page.clock.install();await begin(page);await page.clock.fastForward(301000);
  await expect(page.locator('.mission-clock>span')).toHaveText('+0:01');
  await expect(page.getByText(/THE AI LABS HAVE ACQUIRED THE FORMULA/)).toBeVisible();
  await acquire(page);await erase(page);
  await expect(page.getByRole('heading',{name:'MISSION FAILED.'})).toBeVisible();
});
test('incorrect purchase is recoverable; mobile room fits viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});await begin(page);
  await acquire(page,'EM-07100');
  await expect(page.getByText('Error 482. Item rejected by writing panel.')).toBeVisible();
  await page.getByRole('button',{name:'Source more objects →'}).click();
  await acquire(page);await expect(page.getByText('Eraser equipped. Press and drag across the formula.',{exact:true})).toBeVisible();
  await page.screenshot({path:'/private/tmp/savetheworld-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('briefing fits one screen and the approaching labs stay in the shop header',async({page})=>{
  for(const viewport of [{width:1440,height:900},{width:1366,height:768},{width:390,height:844},{width:375,height:667}]){
    await page.setViewportSize(viewport);await page.goto('/savetheworld/');
    for(const name of ['Okay, what do I need?','Show me the plan','Begin mission']){
      const button=page.getByRole('button',{name,exact:true});
      await expect(button).toBeVisible();
      const bounds=await button.boundingBox();expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height);
      const caption=page.locator('.board-explainer p');await expect(caption).toBeVisible();
      const captionBounds=await caption.boundingBox();expect(captionBounds.y+captionBounds.height).toBeLessThanOrEqual(viewport.height);
      expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(name==='Begin mission') break;
      await button.click();
    }
  }
  await page.screenshot({path:'/private/tmp/yashability-briefing-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Begin mission'}).click();await page.getByRole('button',{name:'Find an eraser'}).click();
  await page.mouse.wheel(0,1000);
  const header=page.getByRole('banner');await expect(header.getByText('OpenAI',{exact:true})).toBeVisible();await expect(header.getByText('Meta AI',{exact:true})).toBeVisible();
  expect((await header.boundingBox()).y).toBe(0);
});
test('departments, promotional buttons and secret search perform their actions',async({page})=>{
  await begin(page);await expect(page.locator('.mission-clock>span')).toHaveText(/^[45]:/);
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.getByText('A FICTIONAL USABILITY EMERGENCY')).toHaveCount(0);
  await page.getByRole('button',{name:'All departments ▾'}).click();
  await page.getByRole('button',{name:'Pencil erasers',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Material / product ontology'})).toHaveValue('Pencil eraser');
  await page.getByRole('textbox',{name:'Search marketplace'}).fill('yashwipe');await page.getByRole('button',{name:'Search →',exact:true}).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'SKU EM-07237 · specifications'})).toBeVisible();
  await page.getByRole('button',{name:'SHOW SAFE SUPPLIES →'}).click();
  await expect(page.getByRole('combobox',{name:'Whiteboard safe'})).toHaveValue('true');
  await page.getByRole('button',{name:'BUY NOW ↗'}).click();
  await expect(page.locator('.specs')).toBeVisible();
  await page.getByRole('button',{name:'ENTERPRISE EXCELLENCE ✓'}).click();
  await expect(page.getByRole('status').filter({hasText:'Enterprise excellence certificate'})).toBeVisible();
});
