import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateBuild, verifyLive } from './production-routes.mjs';

const html = '<title>Hello</title><link rel="stylesheet" href="./style.css"><script src="./app.mjs"></script>';
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'production-routes-'));
  t.after(() => rm(root, { recursive:true, force:true }));
  const contract = {
    pages:[{path:'/hello/',file:'hello/index.html',title:'Hello'}],
    redirects:[{source:'/hello',destination:'/hello/',permanent:false}],
    rewrites:[{source:'/worker/:path*',destination:'https://worker.example/:path*'}],
    serverlessFiles:['api/jobs.mjs']
  };
  await Promise.all(['config','dist/hello','api'].map(dir=>mkdir(join(root,dir),{recursive:true})));
  const put = (path,value) => writeFile(join(root,path),typeof value === 'string' ? value : JSON.stringify(value));
  await Promise.all([
    put('config/production-routes.json',contract),
    put('vercel.json',{redirects:contract.redirects,rewrites:contract.rewrites}),
    put('dist/hello/index.html',html),put('dist/hello/style.css','body { color:green }'),
    put('dist/hello/app.mjs','console.log("Hello")'),put('api/jobs.mjs','export default () => {};')
  ]);
  return {root,put,contract};
}

test('complete page, assets, API source and routes pass',async t=>{
  const {root} = await fixture(t);
  await validateBuild(root);
});
test('omitting a whole existing subsite fails the build',async t=>{
  const {root} = await fixture(t);
  await rm(join(root,'dist/hello'),{recursive:true});
  await assert.rejects(validateBuild(root),/ENOENT/);
});
test('missing JavaScript and HTML masquerading as an asset both fail',async t=>{
  const {root,put} = await fixture(t);
  await rm(join(root,'dist/hello/app.mjs'));
  await assert.rejects(validateBuild(root),/ENOENT/);
  await put('dist/hello/app.mjs','<!doctype html><title>Fallback</title>');
  await assert.rejects(validateBuild(root),/invalid script\/stylesheet/);
});
test('removed redirect and changed Worker proxy both fail',async t=>{
  const {root,put,contract} = await fixture(t);
  await put('vercel.json',{redirects:[],rewrites:contract.rewrites});
  await assert.rejects(validateBuild(root),/Protected redirects/);
  await put('vercel.json',{redirects:contract.redirects,rewrites:[{source:'/worker/:path*',destination:'https://wrong.example/:path*'}]});
  await assert.rejects(validateBuild(root),/Protected rewrites/);
});
test('deleting an API source fails',async t=>{
  const {root} = await fixture(t);
  await rm(join(root,'api/jobs.mjs'));
  await assert.rejects(validateBuild(root),/ENOENT/);
});
test('new top-level app must be registered',async t=>{
  const {root,put} = await fixture(t);
  await mkdir(join(root,'dist/new-app'));
  await put('dist/new-app/index.html','<title>New app</title>');
  await assert.rejects(validateBuild(root),/Register the new public page/);
});
test('asset resolution honors filesystem before SPA rewrites and resolves aliases',async t=>{
  const {root,put,contract} = await fixture(t);
  contract.rewrites.push({source:'/hello/:path*',destination:'/hello/index.html'},{source:'/alias/:path*',destination:'/hello/:path*'});
  contract.pages[0].path = '/alias/';
  await put('config/production-routes.json',contract);
  await put('vercel.json',{redirects:contract.redirects,rewrites:contract.rewrites});
  await validateBuild(root);
  contract.pages[0].path = '/hello/';
  await put('config/production-routes.json',contract);
  await validateBuild(root);
});
test('live check rejects HTTP 200 fallback HTML for missing page or script',async t=>{
  const {root} = await fixture(t);
  let broken = null;
  const fakeFetch = async url=>{
    const path = url.pathname;
    const body = path === '/hello/' ? (broken === 'page' ? '<title>Portfolio fallback</title>' : html) : path.endsWith('.css') ? 'body {}' : broken === 'script' ? '<!doctype html><title>Fallback</title>' : 'console.log("Hello")';
    const response = path === '/hello'
      ? new Response(null,{status:307,headers:{location:'/hello/'}})
      : new Response(body,{status:200,headers:{'content-type':path === '/hello/' || (broken === 'script' && path.endsWith('.mjs')) ? 'text/html' : path.endsWith('.css') ? 'text/css' : 'application/javascript'}});
    Object.defineProperty(response,'url',{value:url.href});
    return response;
  };
  await verifyLive(root,'https://www.ysunkara.com',fakeFetch);
  broken = 'page';
  await assert.rejects(verifyLive(root,'https://www.ysunkara.com',fakeFetch),/expected its own HTML/);
  broken = 'script';
  await assert.rejects(verifyLive(root,'https://www.ysunkara.com',fakeFetch),/expected a working asset/);
});
