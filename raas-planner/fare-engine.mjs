import {validateSearch,serpParameters,parseSerpOffers,publicFreeAccount} from './flights.mjs';
const HOUR=3600000,DAY=24*HOUR;
export const routeKey=r=>`${r.origin}|${r.destination}|${r.competitionDate}`;
export class FareEngine{
 constructor(directory,{fetcher=(...args)=>fetch(...args),now=()=>Date.now()}={}){this.directory=directory;this.fetcher=fetcher;this.now=now;this.key='';this.account=null;this.busy=false;this.nextCheck=0;this.revision=0;this.db={version:1,quotes:{},routes:[],enabled:false,intervalDays:7,attempts:[],message:'Connect your key, then start the initial fetch.'};this.pending=Promise.resolve();}
 async save(){this.revision++;if(this.account)this.db.account=this.account;await this.write('fares.json',this.db);}
 async verify(key=this.key){const url=new URL('https://serpapi.com/account.json');url.searchParams.set('api_key',key);const r=await this.fetcher(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Could not verify your SerpApi account. Check the key.');return publicFreeAccount(await r.json());}
 async connect(key){if(this.busy)throw Error('A search is running. Try connecting again after it finishes.');if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{20,200}$/.test(key))throw Error('Enter your SerpApi private API key.');const account=await this.verify(key);await this.write('secrets.json',{serpApiKey:key});this.key=key;this.account=account;this.nextCheck=0;return this.status();}
 async disconnect(){if(this.busy)throw Error('A search is running. Try disconnecting again after it finishes.');this.key='';this.account=null;this.db.enabled=false;await this.write('secrets.json',{});await this.save();return this.status();}
 status(){const now=this.now(),active=this.db.routes.filter(r=>Date.parse(r.competitionDate)>now+DAY),priced=active.filter(r=>this.db.quotes[routeKey(r)]),due=active.filter(r=>!r.nextDue||r.nextDue<=now);return {flights:!!this.key,provider:this.key?'SerpApi':null,account:this.account,refresh:{enabled:this.db.enabled,busy:this.busy,intervalDays:this.db.intervalDays,routes:active.length,priced:priced.length,due:due.length,failed:active.filter(r=>r.error&&r.lastAttempt).length,message:this.db.message,lastUpdated:this.db.lastUpdated||null,nextCheck:this.nextCheck?new Date(this.nextCheck).toISOString():null,reserve:25,hourlyLimit:40,revision:this.revision,scope:this.db.scope||null}};}
 snapshot(){return {quotes:Object.values(this.db.quotes),...this.status()};}
 async configure({routes,enabled=true,intervalDays=7,scope='shortlist'}){
  if(!this.key)throw Error('Connect your free key first.');
  if(![1,7,14,30].includes(intervalDays))throw Error('Choose daily, weekly, fortnightly, or monthly updates.');
  if(!Array.isArray(routes)||routes.length>700)throw Error('Provide at most 700 routes.');
  const old=new Map(this.db.routes.map(r=>[routeKey(r),r])),unique=new Map();
  for(const raw of routes){const r=validateSearch(raw),id=routeKey(r);if(!unique.has(id)){const previous=old.get(id),quote=this.db.quotes[id];unique.set(id,{origin:r.origin,destination:r.destination,competitionDate:r.competitionDate,priority:Number.isFinite(raw.priority)?raw.priority:0,...(previous?{lastAttempt:previous.lastAttempt,error:previous.error}:{}),nextDue:previous?.error?previous.nextDue:quote?Date.parse(quote.retrievedAt)+intervalDays*DAY:previous?.nextDue||0});}}
  this.db.routes=[...unique.values()].sort((a,b)=>b.priority-a.priority||routeKey(a).localeCompare(routeKey(b)));this.db.enabled=Boolean(enabled);this.db.scope=scope==='all'?'all':'shortlist';this.db.intervalDays=intervalDays;this.db.message=`${unique.size} unique routes queued. Proposed schedules have priority.`;this.nextCheck=0;await this.save();return this.status();
 }
 async pause(){this.db.enabled=false;this.db.message='Automatic updates paused. Saved prices remain available.';await this.save();return this.status();}
 async search(raw,{background=false}={}){
  const input=validateSearch(raw),key=routeKey(input),now=this.now(),cached=this.db.quotes[key];
  if(cached&&Date.parse(cached.expiresAt)>now)return {quote:cached,cached:true};
  if(this.busy)throw Error('A fare search is already running. Try again shortly.');if(!this.key)throw Error('Connect your free key first.');
  this.db.attempts=this.db.attempts.filter(t=>t>now-HOUR);
  if(this.db.attempts.length>=40){this.nextCheck=this.db.attempts[0]+HOUR+1000;throw Error('Hourly search allowance reached; the queue resumes automatically.');}
  this.busy=true;
  try{
   this.account=await this.verify();
   if(this.account.remaining<=(background?25:0)){this.nextCheck=now+HOUR;throw Error(background?'Automatic searches paused to preserve 25 free credits; quota is checked hourly.':'Your free search allowance is used up.');}
   this.db.attempts.push(now);await this.save();
   const url=new URL('https://serpapi.com/search.json');for(const [k,v] of Object.entries({...serpParameters(input),api_key:this.key}))url.searchParams.set(k,v);
   const response=await this.fetcher(url,{signal:AbortSignal.timeout(40000)});
   if(!response.ok){if(response.status===429)this.nextCheck=now+HOUR;throw Error(`Flight provider returned ${response.status}; retry later.`);}
   const payload=await response.json();if(payload.error)throw Error('No usable flight results returned for this route.');
   this.account.remaining=Math.max(0,this.account.remaining-1);
   let quote=parseSerpOffers(payload,input);
   if(quote){quote={...quote,planningSnapshot:true,note:'Saved round-trip planning estimate; its retrieval date is shown. Only the outbound itinerary was fetched. Return choice, baggage, group availability, and final price need checking.'};this.db.quotes[key]=quote;this.db.lastUpdated=new Date(now).toISOString();}
   await this.save();return {quote,account:this.account,message:quote?'Price saved in the backend.':'No matching round-trip price found; any older saved estimate is retained.'};
  }finally{this.busy=false;}
 }
 async tick(){
  if(!this.db.enabled||!this.key||this.busy||this.now()<this.nextCheck)return;
  const now=this.now();
  const due=this.db.routes.filter(r=>Date.parse(r.competitionDate)>now+DAY&&(!r.nextDue||r.nextDue<=now)).sort((a,b)=>Number(!!a.lastAttempt)-Number(!!b.lastAttempt)||b.priority-a.priority||(a.lastAttempt||0)-(b.lastAttempt||0));
  if(!due.length){this.nextCheck=now+60000;return;}
  const route=due[0];
  try{const result=await this.search(route,{background:true});route.lastAttempt=now;route.nextDue=now+this.db.intervalDays*DAY;route.error=result.quote?null:'No matching fare returned';this.db.message=result.quote?`Saved ${route.origin} → ${route.destination} for ${route.competitionDate}.`:`No fare found for ${route.origin} → ${route.destination}; older estimate retained.`;}
  catch(e){this.db.message=e.message;if(!this.nextCheck||this.nextCheck<=now){route.error=e.message;route.lastAttempt=now;route.nextDue=now+HOUR;this.nextCheck=now+60000;}}
  await this.save();
 }
}
