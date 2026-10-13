import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../sahana');
const files={'/sahana/':['index.html','text/html'],'/sahana/style.css':['style.css','text/css'],'/sahana/app.mjs':['app.mjs','text/javascript'],'/sahana/model.mjs':['model.mjs','text/javascript'],'/sahana/programs.mjs':['programs.mjs','text/javascript'],'/sahana/mark.svg':['mark.svg','image/svg+xml']};
createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/api/sahana/feed'){try{const payload=await readFile('/private/tmp/sahana-preview-feed.json');res.writeHead(200,{'Content-Type':'application/json'});return res.end(payload);}catch{res.writeHead(503);return res.end('{}');}}
 if(path==='/'||path==='/sahana'){res.writeHead(302,{Location:'/sahana/'});return res.end();}
 if(!files[path]){res.writeHead(404);return res.end();}
 const [file,type]=files[path];res.writeHead(200,{'Content-Type':type});res.end(await readFile(resolve(root,file)));
}).listen(4189,'127.0.0.1',()=>console.log('Sahana: http://127.0.0.1:4189/sahana/'));
