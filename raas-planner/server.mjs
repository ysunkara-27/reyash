import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const port=Number(process.env.RAAS_PORT||8107),base=new URL('./',import.meta.url);
const assets=new Set(['atlas.html','atlas.css','atlas.mjs','calendar.mjs','lineups.mjs','evidence.mjs','planner-state.mjs','locations.mjs','data.json','geography.json']);
const mime={html:'text/html',css:'text/css',mjs:'text/javascript',json:'application/json'};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))return send(res,403,{error:'Local access only.'});
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed.'});
  const asset=url.pathname==='/'||url.pathname==='/raas-planner/'?'atlas.html':url.pathname.replace(/^\/raas-planner\//,'').replace(/^\//,'');
  if(!assets.has(asset))return send(res,404,{error:'Not found.'});
  const content=await readFile(new URL(asset,base));res.writeHead(200,{'Content-Type':mime[asset.split('.').at(-1)],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
 }catch{send(res,500,{error:'Unable to complete the request.'});}
}).listen(port,'127.0.0.1',()=>console.log(`Raas planner: http://127.0.0.1:${port}/`));
