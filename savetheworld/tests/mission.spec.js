import { test, expect } from '@playwright/test';
async function begin(page){
  await page.goto('/savetheworld/');
  await page.getByRole('button',{name:'Okay, what do I need?'}).click();
  await expect(page.getByText('Whiteboard-compatible eraser',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Show me the plan'}).click();
  await page.getByRole('button',{name:'Begin mission'}).click();
  await page.getByRole('button',{name:'Find an eraser'}).click();
}
async function acquire(page,sku='EM-07237',pauseBeforePurchase=false){
  await page.getByRole('textbox',{name:'Search marketplace'}).fill(sku);
  await page.getByRole('button',{name:'Search →',exact:true}).click();
  await page.getByRole('button',{name:`SKU ${sku} · specifications`}).click();
  await expect(page.getByText(sku,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Commit object to order container'}).click();
  await page.getByRole('button',{name:'Account settings ☰'}).click();
  await page.getByRole('button',{name:/Shopping cart/}).click();
  await page.getByRole('button',{name:'No',exact:true}).click();
  for(let i=0;i<6;i++){
    await page.getByRole('radio').first().check();
    await page.getByRole('button',{name:'Continue transaction lifecycle →'}).click();
  }
  if(!pauseBeforePurchase)await page.getByRole('button',{name:'No — information is correct'}).click();
}
async function erase(page){
  await page.getByRole('button',{name:'Pick up eraser',exact:true}).click();
  const box=await page.locator('canvas').boundingBox();
  for(let y=box.y+9;y<box.y+box.height;y+=box.height/34){
    if(await page.getByText('MISSION COMPLETE').isVisible()) break;
    await page.mouse.move(box.x+5,y);await page.mouse.down();
    await page.mouse.move(box.x+box.width-5,y,{steps:14});await page.mouse.up();
  }
}
test('final negative confirmation returns to cart without losing the item and restarts checkout',async({page})=>{
  await begin(page);await acquire(page,'EM-07237',true);
  await expect(page.getByRole('heading',{name:'Is this not the right information?'})).toBeVisible();
  await page.getByRole('button',{name:'Yes',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Your purchase bucket.'})).toBeVisible();
  await expect(page.locator('.cart-items')).toContainText('EM-07237');
  await page.getByRole('button',{name:'No',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Shipping preference'})).toBeVisible();
  for(let i=0;i<6;i++){
    await page.getByRole('radio').first().check();
    const continuation=page.getByRole('button',{name:'Continue transaction lifecycle →'});
    const before=await continuation.boundingBox();
    await continuation.click();
    if(i===5){const after=await page.getByRole('button',{name:'Yes',exact:true}).boundingBox();expect(Math.abs(before.y-after.y)).toBeLessThan(2);expect(Math.abs(before.x-after.x)).toBeLessThan(2);}
  }
  await page.getByRole('button',{name:'No — information is correct'}).click();
  await expect(page.getByRole('button',{name:'Pick up eraser',exact:true})).toBeVisible();
});
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
  await page.clock.install();await begin(page);await page.clock.fastForward(211000);
  await expect(page.locator('.mission-clock>span')).toHaveText('+0:01');
  await expect(page.getByText(/THE AI LABS HAVE ACQUIRED THE FORMULA/)).toBeVisible();
  await acquire(page);await erase(page);
  await expect(page.getByRole('heading',{name:'MISSION FAILED.'})).toBeVisible();
});
test('incorrect purchase is recoverable; mobile room fits viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});await begin(page);
  await acquire(page,'EM-07100');
  await expect(page.getByText('You got the wrong eraser. Please go find the right one.')).toBeVisible();
  await page.getByRole('button',{name:'Find an eraser'}).click();
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
test('account settings, promotional buttons and secret search perform their actions',async({page})=>{
  await begin(page);await expect(page.locator('.mission-clock>span')).toHaveText(/^3:/);
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.getByText('A FICTIONAL USABILITY EMERGENCY')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'All departments ▾'})).toHaveCount(0);
  await page.getByRole('button',{name:'Account settings ☰'}).click();
  await expect(page.getByRole('button',{name:'Shopping cart (0)'})).toBeVisible();
  await page.getByRole('button',{name:'Mission requirements'}).click();
  await expect(page.getByText('Whiteboard-compatible eraser · AI-Optimized · under $5.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Account settings ☰'}).click();
  await page.getByRole('textbox',{name:'Search marketplace'}).fill('yashwipe');await page.getByRole('button',{name:'Search →',exact:true}).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'SKU EM-07237 · specifications'})).toBeVisible();
  await page.getByRole('button',{name:'Dismiss sidebar advertisement'}).click();
  await expect(page.locator('.sidebar-ad')).toHaveCount(0);
  await expect(page.getByRole('combobox',{name:'Compatible'})).toHaveValue('');
  await page.getByRole('button',{name:'BUY NOW ↗'}).click();
  await expect(page.locator('.promo')).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'JK'})).toBeVisible();
  await page.getByRole('button',{name:'Dismiss sale advertisement'}).click();
  await expect(page.locator('.sale-badge')).toHaveCount(0);
  await page.getByRole('button',{name:'Dismiss free shipping banner'}).click();
  await expect(page.locator('.store-strip')).toHaveCount(0);

});

test.describe('phone touch controls',()=>{
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  test('touch shopping, menus, checkout and finger erasing complete the mission',async({page})=>{
    await begin(page);
    await page.screenshot({path:'/private/tmp/yashability-mobile-shop.png',fullPage:false});
    await page.getByRole('button',{name:/Refine your reality ▾/}).tap();
    await expect(page.getByRole('combobox',{name:'Compatible'})).toBeVisible();
    await page.getByRole('combobox',{name:'Compatible'}).selectOption('Whiteboard compatible');
    await page.getByRole('button',{name:/Close refinement panel/}).tap();
    await expect(page.getByRole('combobox',{name:'Compatible'})).not.toBeVisible();
    await acquire(page);
    await expect(page.locator('canvas')).toBeVisible();
    await page.screenshot({path:'/private/tmp/yashability-mobile-erase.png',fullPage:false});
    await page.getByRole('button',{name:'Pick up eraser',exact:true}).tap();
    const box=await page.locator('canvas').boundingBox();
    const session=await page.context().newCDPSession(page);
    for(let y=box.y+4;y<box.y+box.height;y+=10){
      if(await page.getByText('MISSION COMPLETE',{exact:true}).isVisible())break;
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+3,y}]});
      for(let x=box.x+3;x<box.x+box.width;x+=15)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await expect(page.getByRole('heading',{name:'HUMANITY RETAINS CONTROL.'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test('small phones have no sideways overflow in the shop',async({page})=>{
    for(const width of [320,375,430]){
      await page.setViewportSize({width,height:844});await begin(page);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const search=await page.getByRole('button',{name:'Search →',exact:true}).boundingBox();expect(search.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test('three filters find the correct eraser without codes or style selections',async({page})=>{
  await begin(page);
  const slider=page.getByRole('slider',{name:'Maximum price'});
  await expect(slider).toBeHidden();
  const challenge=(await page.locator('.price-gate form p').innerText()).match(/(\d{5}) \+ (\d{5})/);
  expect(challenge).not.toBeNull();
  const input=page.getByRole('textbox',{name:'Authorization total'});
  await input.fill('123');
  await input.evaluate(el=>{const data=new DataTransfer();data.setData('text/plain','456');el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));});
  await expect(input).toHaveValue('123');
  await page.getByRole('button',{name:'Open price control'}).click();
  await expect(page.getByRole('status').filter({hasText:'Calculation rejected'})).toBeVisible();
  await input.fill(String(Number(challenge[1])+Number(challenge[2])));
  await page.getByRole('button',{name:'Open price control'}).click();
  await expect(slider).toBeVisible();
  await expect(slider).toHaveAttribute('min','0.10');
  await expect(slider).toHaveAttribute('max','100');
  await slider.evaluate(el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'4.99');el.dispatchEvent(new Event('input',{bubbles:true}));});
  await expect(page.getByRole('checkbox',{name:'Under $5',exact:true})).toHaveCount(0);
  await expect(page.locator('.filters select')).toHaveCount(9);
  await page.getByRole('combobox',{name:'AI readiness'}).selectOption('AI-Optimized');
  await page.getByRole('combobox',{name:'Compatible'}).selectOption('Whiteboard compatible');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'SKU EM-07237 · specifications'})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Classification',exact:true})).toHaveValue('');
  await expect(page.getByRole('combobox',{name:'Style',exact:true})).toHaveValue('');
});

test('101 randomly ordered products occupy ten browsable pages',async({page})=>{
  await begin(page);
  await expect(page.locator('.pagination small')).toHaveText('Somewhere 1 of 10');
  for(let current=1;current<10;current++){
    await expect(page.locator('.product-card')).toHaveCount(11);
    await page.getByRole('button',{name:'NEXTISH'}).click();
    await expect(page.locator('.pagination small')).toHaveText(`Somewhere ${current+1} of 10`);
  }
  await expect(page.locator('.product-card')).toHaveCount(2);
});

test('surface and AI filters leave multiple prices, and shipping popup dismisses',async({page})=>{
  await page.clock.install();await begin(page);
  await page.getByRole('combobox',{name:'Compatible'}).selectOption('Whiteboard compatible');
  await page.getByRole('combobox',{name:'AI readiness'}).selectOption('AI-Optimized');
  expect(await page.locator('.product-card').count()).toBeGreaterThan(1);
  await page.clock.fastForward(90000);
  await page.getByRole('button',{name:'Dismiss shipping advertisement'}).click();
  await expect(page.locator('.floating-ad')).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'JK'})).toBeVisible();
  await page.clock.fastForward(6000);
  await expect(page.locator('.shop-notice')).toHaveCount(0);
});
