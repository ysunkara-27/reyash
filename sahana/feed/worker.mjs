import { collect } from './sources.mjs';
let inFlight;
export async function refresh(env) {
  if(inFlight) return inFlight;
  inFlight=(async()=>{
    const previous=await env.FEED.get('latest','json') || {jobs:[],sources:[]};
    const feed=await collect(previous,fetch,Date.now(),env.FEDERAL_URL);
    await env.FEED.put('latest',JSON.stringify(feed));
    return feed;
  })().finally(()=>{inFlight=null;});
  return inFlight;
}
export default {
  async scheduled(controller,env,ctx){ctx.waitUntil(refresh(env));},
  async fetch(req,env,ctx){
    const url=new URL(req.url);
    if(!['/feed','/health'].includes(url.pathname))return new Response('Not found',{status:404});
    if(!['GET','HEAD'].includes(req.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    if(url.pathname==='/health')return Response.json({ok:true,schedule:'0 11 * * *'});
    let feed=await env.FEED.get('latest','json');
    if(!feed) feed=await refresh(env);
    else if(Date.now()-Date.parse(feed.checkedAt)>26*3600000) ctx.waitUntil(refresh(env));
    const origin=req.headers.get('Origin');
    const allowed=['https://www.ysunkara.com','https://ysunkara.com','http://127.0.0.1:4189'];
    return Response.json(feed,{headers:{'Cache-Control':'public, max-age=300','X-Robots-Tag':'noindex',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin,Vary:'Origin'}:{})}});
  }
};
