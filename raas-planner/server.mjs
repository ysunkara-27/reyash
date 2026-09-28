import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {FareStore} from './fare-store.mjs';
const port=Number(process.env.RAAS_PORT||8107),base=new URL('./',import.meta.url);
const fares=await new FareStore(new URL(process.env.RAAS_DATA_DIR||'.local/',base)).init();
const timer=setInterval(()=>fares.tick().catch(()=>{fares.db.message='Could not save the background refresh. Check local disk access.';}),2500);timer.unref();
const assets=new Set(['index.html','style.css','app.mjs','model.mjs','circuit.mjs','scenario.mjs','fare-routes.mjs','locations.mjs','data.json','geography.json']);
const mime={html:'text/html',css:'text/css',mjs:'text/javascript',json:'application/json'};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))return send(res,403,{error:'Local access only.'});
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.method==='GET'&&url.pathname==='/api/status')return send(res,200,fares.status());
  if(req.method==='GET'&&url.pathname==='/api/fares')return send(res,200,fares.snapshot());
  if(req.method==='POST'&&['/api/connection','/api/flights','/api/refresh'].includes(url.pathname)){
   if(req.headers.origin!==`http://${req.headers.host}`)return send(res,403,{error:'Use this connection from the local app only.'});
   const limit=url.pathname==='/api/refresh'?150000:2048;
   let body='';for await(const chunk of req){body+=chunk;if(body.length>limit)return send(res,413,{error:'Request too large.'});}
   let input;try{input=JSON.parse(body);if(!input||typeof input!=='object')throw Error();}catch{return send(res,400,{error:'Invalid request.'});}
   try{
    if(url.pathname==='/api/connection')return send(res,200,input.disconnect?await fares.disconnect():await fares.connect(input.apiKey));
    if(url.pathname==='/api/flights')return send(res,200,await fares.search(input));
    if(input.pause)return send(res,200,await fares.pause());
    const result=await fares.configure(input);send(res,200,result);void fares.tick().catch(()=>{});return;
   }catch(e){return send(res,400,{error:e.name==='TimeoutError'?'Flight provider timed out. Retry later.':e.message});}
  }
  if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed.'});
  const asset=url.pathname==='/'||url.pathname==='/raas-planner/'?'index.html':url.pathname.replace(/^\/raas-planner\//,'').replace(/^\//,'');
  if(!assets.has(asset))return send(res,404,{error:'Not found.'});
  const content=await readFile(new URL(asset,base));res.writeHead(200,{'Content-Type':mime[asset.split('.').at(-1)],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
 }catch{send(res,500,{error:'Unable to complete the request.'});}
}).listen(port,'127.0.0.1',()=>console.log(`Raas planner: http://127.0.0.1:${port}/`));
