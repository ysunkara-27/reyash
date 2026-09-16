import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../analytics.js',import.meta.url),'utf8');
function execute(hostname){const scripts=[],window={};runInNewContext(source,{window,location:{hostname,origin:'https://'+hostname,search:'?event=private'},document:{createElement:()=>({}),head:{append:s=>scripts.push(s)}}});return {window,scripts}}
test('production uses main-site property and canonical page URL',()=>{for(const host of ['ysunkara.com','www.ysunkara.com']){const {window,scripts}=execute(host);assert.equal(scripts.length,1);assert(scripts[0].async);const config=[...window.dataLayer[1]];assert.equal(config[0],'config');assert.equal(config[1],'G-DG7D1X0M0W');assert.equal(config[2].page_location,'https://'+host+'/rides/');assert.equal(config[2].page_title,'HooRaas Rides')}});
test('local and preview sites never load analytics',()=>{for(const host of ['localhost','127.0.0.1','reyash-preview.vercel.app']){const result=execute(host);assert.equal(result.scripts.length,0);assert.equal(result.window.dataLayer,undefined)}});
