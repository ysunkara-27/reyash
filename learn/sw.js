/* Bump BUILD whenever a published lesson or app asset changes. */
const BUILD='2026-10-02-offline-1';
const APP='learn-app-'+BUILD;
const RUNTIME='learn-python-0.27.7-v1';
const CDN='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
const CORE=['/learn/','/learn/app.mjs','/learn/content.mjs','/learn/practice.mjs','/learn/style.css','/learn/worker.mjs','/learn/offline.mjs'];
const BOOT=['pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'];
const PACKAGES=['numpy','pandas','scikit-learn','matplotlib','sqlite3','scipy'];
const MANIFEST=new URL('/learn/offline-python-manifest',self.location.origin).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(APP);
 for(const url of CORE){const response=await fetch(url,{cache:'reload'});if(!response.ok)throw Error('Cannot save '+url);await cache.put(url,response);}
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin===self.location.origin&&(url.pathname==='/learn'||url.pathname.startsWith('/learn/'))){
  if(url.pathname==='/learn/sw.js')return;
  event.respondWith((async()=>{
   const cache=await caches.open(APP);
   const key=event.request.mode==='navigate'?'/learn/':url.pathname;
   const saved=await cache.match(key);return saved||fetch(event.request);
  })());
 }else if(event.request.url.startsWith(CDN)){
  event.respondWith((async()=>{const cache=await caches.open(RUNTIME);const saved=await cache.match(event.request.url);if(saved)return saved;const response=await fetch(event.request);if(response.ok)await cache.put(event.request.url,response.clone());return response;})());
 }
});
async function inventory(){
 const app=await caches.open(APP),runtime=await caches.open(RUNTIME);
 const manifest=await runtime.match(MANIFEST);
 const files=manifest?await manifest.json():null;
 const coreReady=(await Promise.all(CORE.map(u=>app.match(u)))).every(Boolean);
 const present=files?await Promise.all(files.urls.map(u=>runtime.match(u))):[];
 return {build:BUILD,lessonsReady:coreReady,ready:coreReady&&!!files&&present.every(Boolean),files:present.filter(Boolean).length,total:files?.urls.length||0,bytes:files?.bytes||0};
}
let preparing=false;
self.addEventListener('message',event=>{
 const port=event.ports[0];if(!port)return;
 const send=data=>port.postMessage(data);
 event.waitUntil((async()=>{
  try{
   if(event.data.type==='STATUS'){send({done:true,...await inventory()});return;}
   if(event.data.type!=='PREPARE')return;
   if(preparing)throw Error('Another offline download is running. Keep that tab open, then check again.');
   preparing=true;
   try{
    const cache=await caches.open(RUNTIME);
    let lock=await cache.match(CDN+'pyodide-lock.json');
    if(!lock){lock=await fetch(CDN+'pyodide-lock.json');if(!lock.ok)throw Error('Cannot download Python package list.');await cache.put(CDN+'pyodide-lock.json',lock.clone());}
    const packages=(await lock.json()).packages;
    const selected=new Set();
    function include(name){if(selected.has(name))return;const p=packages[name];if(!p)throw Error('Missing Python package '+name);selected.add(name);p.depends.forEach(include);}
    PACKAGES.forEach(include);
    const urls=[...new Set([...BOOT,...[...selected].map(p=>packages[p].file_name)])].map(f=>CDN+f);
    let finished=0,bytes=0;
    // Sequential fetch keeps memory bounded on mobile and leaves resumable partial downloads.
    for(const url of urls){
     send({status:`Saving Python files: ${finished+1} of ${urls.length}`,finished,total:urls.length});
     let response=await cache.match(url);
     if(!response){response=await fetch(url);if(!response.ok)throw Error('Download failed: '+url.split('/').pop());await cache.put(url,response.clone());}
     bytes+=(await response.arrayBuffer()).byteLength;finished++;
     send({status:`Saved ${finished} of ${urls.length} files · ${Math.round(bytes/1048576)} MB`,finished,total:urls.length,bytes});
    }
    await cache.put(MANIFEST,new Response(JSON.stringify({urls,bytes}),{headers:{'Content-Type':'application/json'}}));
    const status=await inventory();if(!status.ready)throw Error('Some downloads are missing. Please retry.');
    send({done:true,...status});
   }finally{preparing=false;}
  }catch(error){send({done:true,error:error.message});}
 })());
});
