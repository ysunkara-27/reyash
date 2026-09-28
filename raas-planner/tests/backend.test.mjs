import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,stat,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {FareStore,routeKey} from '../fare-store.mjs';
import {fareRoutes,mergeBackendFares} from '../fare-routes.mjs';
import {freshScenario} from '../scenario.mjs';
import {allocateCircuit} from '../circuit.mjs';
import {teamRatings,competitionStrength,scheduleStrength,week,usableQuote} from '../model.mjs';
const data=JSON.parse(await readFile(new URL('../data.json',import.meta.url))),geo=JSON.parse(await readFile(new URL('../geography.json',import.meta.url)));
const input={origin:'CHO',destination:'SFO',competitionDate:'2027-03-06'},key='test_key_only_not_a_real_credential';
async function fixture(){
 let clock=Date.now(),remaining=250,calls=0,empty=false;
 const directory=pathToFileURL((await mkdtemp('/private/tmp/raas-fares-test-'))+'/');
 const fetcher=async url=>{url=new URL(url);if(url.pathname==='/account.json')return {ok:true,json:async()=>({account_status:'Active',plan_monthly_price:0,total_searches_left:remaining,searches_per_month:250,api_key:key})};calls++;remaining--;const params=Object.fromEntries(url.searchParams);delete params.api_key;return {ok:true,json:async()=>({search_parameters:params,search_metadata:{processed_at:new Date(clock).toISOString()},best_flights:empty?[]:[{type:'Round trip',price:345,flights:[{airline:'Fixture',departure_airport:{id:params.departure_id},arrival_airport:{id:params.arrival_id}}]}]})};};
 const options={fetcher,now:()=>clock},store=await new FareStore(directory,options).init();
 return {store,directory,options,get calls(){return calls;},advance:ms=>clock+=ms,quota:n=>remaining=n,empty:()=>empty=true};
}
test('saved key and fares survive restart; public state never exposes credentials; disconnect removes saved key',async()=>{
 const f=await fixture(),s=f.store;await s.connect(key);await s.configure({routes:[input,{...input,priority:50}]});assert.equal(s.db.routes.length,1);await s.tick();assert.equal(f.calls,1);assert.equal(s.status().refresh.priced,1);
 assert.equal((await stat(new URL('secrets.json',f.directory))).mode&0o777,0o600);
 assert.equal((await stat(f.directory)).mode&0o777,0o700);
 assert(!JSON.stringify(s.snapshot()).includes(key));
 const restarted=await new FareStore(f.directory,f.options).init();assert(restarted.status().flights);assert(restarted.db.enabled);assert.equal(restarted.db.quotes[routeKey(input)].amount,345);
 await restarted.search(input);assert.equal(f.calls,1);await restarted.disconnect();assert(!JSON.stringify(JSON.parse(await readFile(new URL('secrets.json',f.directory)))).includes(key));assert.equal(restarted.db.enabled,false);assert.equal(restarted.snapshot().quotes.length,1);
});
test('weekly refresh preserves original retrieval age, survives missing fares, and pauses at free reserve',async()=>{
 const f=await fixture(),s=f.store;await s.connect(key);await s.configure({routes:[input]});await s.tick();const original=s.snapshot().quotes[0];f.advance(8*86400000);assert(usableQuote(original,input.origin,input.destination,input.competitionDate,f.options.now()));
 f.quota(25);await s.tick();assert.equal(f.calls,1);assert(s.db.message.includes('25 free credits'));f.quota(250);f.advance(3601000);await s.tick();assert.equal(f.calls,2);assert.notEqual(s.snapshot().quotes[0].retrievedAt,original.retrievedAt);
 f.advance(8*86400000);const saved=s.snapshot().quotes[0];f.empty();await s.tick();assert.equal(s.snapshot().quotes[0].retrievedAt,saved.retrievedAt);assert(s.db.routes[0].error);await s.pause();f.advance(8*86400000);await s.tick();assert.equal(f.calls,3);
});
test('rolling hourly limits and failures are persisted; invalid routes cannot start a batch',async()=>{
 const f=await fixture(),s=f.store;await s.connect(key);s.db.attempts=Array(40).fill(f.options.now());await s.configure({routes:[input]});await s.tick();assert.equal(f.calls,0);assert(s.db.message.includes('Hourly'));f.advance(3601001);await s.tick();assert.equal(f.calls,1);
 await assert.rejects(()=>s.configure({routes:[{...input,origin:'BADCODE'}]}));assert.equal(s.db.routes.length,1);
});
test('joint lineups meet 6–8 capacities and team constraints; impossible targets produce explicit incomplete draft',()=>{
 const state=freshScenario(data,geo),allocation=allocateCircuit(data,state);assert(allocation.complete);assert.equal(allocation.fields.length,17);assert(allocation.fields.every(c=>c.count>=6&&c.count<=8));
 function check(s,a){for(const [t,r] of Object.entries(a.matrix)){assert(r.plan.rows.length<=s.teams[t].target);assert(r.plan.rows.every(row=>!row.blocked));const weeks=r.plan.rows.map(row=>week(row.competition.date));assert.equal(weeks.length,new Set(weeks).size);if(s.teams[t].budget)assert(r.plan.cost<=s.teams[t].budget&&!r.plan.unknownCosts);if(s.teams[t].strictRest){const host=s.competitions.filter(c=>c.hosts.includes(t)).map(c=>week(c.date));assert(weeks.every((w,i)=>[...host,...weeks.slice(0,i)].every(v=>Math.abs(v-w)>=s.settings.spacing)));}}assert(a.fields.every(c=>c.count<=8));}
 check(state,allocation);state.teams.UVA.strictRest=true;state.teams.BU.budget=300;state.teams.Illini.unavailable=['2027-02-13'];check(state,allocateCircuit(data,state));
 for(const p of Object.values(state.teams))p.target=0;const empty=allocateCircuit(data,state);assert.equal(empty.total,0);assert(!empty.complete);assert(empty.issues[0].includes('at least 102'));
});
test('route shortlist deduplicates airport/date pairs, excludes hosts, and merges snapshots without overwriting manual fares',()=>{
 const state=freshScenario(data,geo),a=allocateCircuit(data,state),routes=fareRoutes(state,a),all=fareRoutes(state,a,'all');assert(routes.length<all.length);assert.equal(new Set(routes.map(routeKey)).size,routes.length);assert(routes.every(r=>r.origin!==r.destination));
 const c=state.competitions.find(c=>c.id==='GGG'),q={...input,destination:c.airport,competitionDate:c.date,planningSnapshot:true,currency:'USD',amount:345,retrievedAt:new Date().toISOString(),expiresAt:'2020-01-01'};assert(mergeBackendFares(state,[q])>0);assert.equal(state.routes['UVA|GGG'].quote.amount,345);
 state.routes['UVA|GGG'].quote={...q,planningSnapshot:false,amount:222,expiresAt:'2099-01-01'};mergeBackendFares(state,[q]);assert.equal(state.routes['UVA|GGG'].quote.amount,222);
});
test('five-season strength uses all five sourced seasons, isolates caches and drives score calculations',()=>{
 const two=teamRatings(data,2),five=teamRatings(data,5);assert.equal(two.UVA.rating,56.25);assert.equal(five.UVA.rating,42.5);assert.equal(five.UVA.records.length,5);assert.equal(five.UVA.points,34);assert.equal(five.UVA.appearances,20);assert(five.UVA.records.some(r=>r.source==='2021-2022!W29'));assert.equal(teamRatings(data,2).UVA.rating,56.25);
 const field=competitionStrength(data,'RCR','UVA',5);assert.equal(field.editions.length,5);assert.equal(scheduleStrength(data,'UVA',['RCR'],null,5).score,field.score);assert.notEqual(field.score,competitionStrength(data,'RCR','UVA',2).score);
});
