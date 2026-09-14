import test from 'node:test';
import assert from 'node:assert/strict';
import { products, isCorrect, findProducts, clockText } from './products.js';
test('exactly one of 101 products meets every requirement',()=>{assert.equal(products.length,101);const matches=products.filter(isCorrect);assert.equal(matches.length,1);assert.equal(matches[0].price,4.87);assert.equal(new Set(products.map(p=>p.id)).size,101);});
test('all products are reachable and the correct item is discoverable by attributes',()=>{assert.equal(findProducts('',{}).length,101);const found=findProducts('whiteboard eraser',{safe:'true',dry:'true',ai:'AI-Optimized',code:'X7-B',style:'Standard',surface:'Whiteboard',type:'Eraser',price:'4.99'});assert.equal(found.length,1);assert.ok(isCorrect(found[0]));});
test('search uses OR and supports exact SKU lookup',()=>{assert.equal(findProducts('whiteboard nonexistent',{}).length,101);assert.equal(findProducts(products.find(isCorrect).sku,{}).length,1);});
test('five-minute timer continues after deadline',()=>{assert.equal(clockText(0),'5:00');assert.equal(clockText(299),'0:01');assert.equal(clockText(300),'0:00');assert.equal(clockText(301),'+0:01');assert.equal(clockText(365),'+1:05');});
test('secret search reliably finds the right eraser despite conflicting filters',()=>{const found=findProducts(' YASHWIPE ',{safe:'false',type:'Pencil eraser',price:'1'});assert.equal(found.length,1);assert.ok(isCorrect(found[0]));});
