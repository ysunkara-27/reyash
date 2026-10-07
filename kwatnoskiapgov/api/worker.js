import { ClassroomService } from '../src/classroom/service';
export class Classroom {
 constructor(state){ this.state=state; }
 async fetch(request){
  // Durable Object transactions serialize simultaneous joins, turns, pauses and retries.
  return this.state.storage.transaction(async tx=>new ClassroomService(tx).fetch(request));
 }
}
const allowed=new Set(['https://ysunkara.com','https://www.ysunkara.com']);
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const local=/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  if(origin&&!allowed.has(origin)&&!local&&origin!==new URL(request.url).origin)return new Response('Origin not allowed',{status:403});
  const headers={'Access-Control-Allow-Origin':origin||'https://www.ysunkara.com','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'86400','Vary':'Origin','Cache-Control':'no-store'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  try {
   const url=new URL(request.url);if(url.pathname==='/health')return Response.json({ok:true},{headers});const match=url.pathname.match(/^\/api\/classes\/([A-Z2-9]{6})\/(create|lobby|join|monitor|state|action)$/);
   if(!match){
    if(env.ASSETS&&(request.method==='GET'||request.method==='HEAD')){
     if(['/', '/elections', '/apgovelections'].includes(url.pathname))return Response.redirect(url.origin+'/elections/'+url.search,302);
     const prefix=['/elections/','/apgovelections/'].find(p=>url.pathname.startsWith(p));
     if(prefix){const assetUrl=new URL(url);assetUrl.pathname=url.pathname.slice(prefix.length-1);return env.ASSETS.fetch(new Request(assetUrl,request));}
    }
    return Response.json({error:'Not found.'},{status:404,headers});
   }
   const object=env.CLASSROOMS.get(env.CLASSROOMS.idFromName(match[1]));
   // The object name is authoritative; do not let a caller spoof its public class code.
   let forwarded=request;
   if(match[2]==='create'&&request.method==='POST'){
    const text=await request.text();if(text.length>20000)return new Response('Request too large',{status:413,headers});
    forwarded=new Request(request,{body:JSON.stringify({...JSON.parse(text),code:match[1]})});
   }
   const response=await object.fetch(forwarded);const out=new Response(response.body,response);for(const [k,v]of Object.entries(headers))out.headers.set(k,v);return out;
  }catch{return Response.json({error:'Connection interrupted. Please retry.'},{status:503,headers});}
 }
};
