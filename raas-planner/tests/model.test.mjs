import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaults,week,historical,scoreTeam,plan,usableQuote,migrateHosts,seasonWeeks,scheduleSummary,teamRatings,competitionStrength,scheduleStrength,scenarioWithPreset} from '../model.mjs';
import {parseOffers,flightRequest,validateSearch,serpParameters,parseSerpOffers,publicFreeAccount} from '../flights.mjs';
const data=JSON.parse(readFileSync(new URL('../data.json',import.meta.url)));
const settings=structuredClone(defaults);
function state(){return {settings,teams:{UVA:{lat:38,lon:-78,airport:'CHO',target:4,budget:0,unavailable:[]}},routes:{},competitions:data.competitions.map(c=>({...c,lat:40,lon:-90,airport:'ORD'}))};}
test('workbook imports unique attendance only, source cells traceable, schedule matches screenshots',()=>{
 assert.equal(data.teams.length,38);assert.equal(data.competitions.length,17);assert.equal(data.competitions[0].date,'2027-01-23');assert.equal(data.competitions.at(-1).date,'2027-03-06');
 assert.equal(new Set(data.attendance.map(a=>[a.season,a.team,a.competition].join('|'))).size,data.attendance.length);
 assert(data.attendance.every(a=>a.cell&&!a.competition.includes('ALL STARS')&&a.season!=='2026-2027'));
 assert.equal(data.attendance.filter(a=>a.season==='2025-2026'&&a.team==='UVA').length,4);
});
test('HooRaas cannot attend ECS or NAACH on its hosting weekend, even Fri/Sun',()=>{
 const s=state();s.competitions.find(c=>c.id==='NAACH').date='2027-02-21';
 let rows=scoreTeam(data,s,'UVA');for(const id of ['ECS','NAACH'])assert(rows.find(r=>r.competition.id===id).blocked);
 assert.equal(week('2027-02-19'),week('2027-02-21'));
 s.competitions.find(c=>c.id==='ECS').date='2027-02-13';rows=scoreTeam(data,s,'UVA');assert(rows.find(r=>r.competition.id==='RDS').blocked);assert(!rows.find(r=>r.competition.id==='NAACH').blocked);
});
test('history uses prior seasons only, comparable editions and real attendance',()=>{
 const h=historical(data,'UVA','RAMPAGE',settings);assert.equal(h.opportunities,5);assert.equal(h.attended,1);assert(h.signal>0&&h.signal<1);
 const fresh=historical(data,'UVA','BND',settings);assert.equal(fresh.opportunities,0);assert(fresh.signal>0);
});
const row=(id,date,score,hosts=[])=>({team:'UVA',competition:{id,date,hosts},score,cost:100,blocked:false});
test('soft rest changes optimal season; strict rest constrains counts and includes hosting',()=>{
 const rows=[row('A','2027-01-23',90),row('B','2027-01-30',89),row('C','2027-02-06',87)];
 const p={target:2,budget:0};assert.deepEqual(plan(rows,p,{...settings,spacingPenalty:0}).rows.map(r=>r.competition.id),['A','B']);
 assert.deepEqual(plan(rows,p,{...settings,spacingPenalty:20}).rows.map(r=>r.competition.id),['A','C']);
 assert.equal(plan(rows,{...p,target:3,strictRest:true},settings).rows.length,2);
 rows.push({...row('HOST','2027-01-30',null,['UVA']),blocked:true});assert.equal(plan(rows,{...p,strictRest:true},settings).rows.length,0);
});
test('never double books, respects blackout weekends and refuses unknown-cost budget schedules',()=>{
 const s=state();s.teams.UVA.unavailable=['2027-02-06'];let rows=scoreTeam(data,s,'UVA');assert(rows.filter(r=>r.competition.date==='2027-02-06').every(r=>r.blocked));
 const a=plan(rows,s.teams.UVA,settings);assert.equal(new Set(a.rows.map(r=>week(r.competition.date))).size,a.rows.length);
 assert.equal(plan([row('A','2027-01-23',90),row('B','2027-02-06',89)],{target:2,budget:150},settings).rows.length,1);
 assert.equal(plan([{...row('A','2027-01-23',90),cost:null}],{target:1,budget:500},settings).rows.length,0);
});
test('fare provenance matches airports and dates, expired/foreign fares cannot leak into score',()=>{
 const q={origin:'CHO',destination:'SFO',competitionDate:'2027-03-06',currency:'USD',amount:320,expiresAt:'2026-10-01T00:00:00Z'};
 assert(usableQuote(q,'CHO','SFO','2027-03-06',Date.parse('2026-09-27')));
 assert.equal(usableQuote(q,'IAD','SFO','2027-03-06',0),null);assert.equal(usableQuote(q,'CHO','SFO','2027-03-07',0),null);assert.equal(usableQuote(q,'CHO','SFO','2027-03-06',Date.parse('2026-10-02')),null);
 const rows=scoreTeam(data,state(),'UVA');assert(rows.every(r=>r.mode==='fly'&&r.fare===null&&r.cost===null));
});
test('flight adapter rejects invalid requests and never presents sandbox fares as live',()=>{
 assert.throws(()=>validateSearch({origin:'CHO',destination:'CHO',competitionDate:'2027-03-06'}));
 const input={origin:'CHO',destination:'SFO',competitionDate:'2027-03-06'};assert.equal(flightRequest(input).data.slices[0].departure_date,'2027-03-05');assert.equal(flightRequest(input).data.slices[1].departure_date,'2027-03-07');
 const offer={total_currency:'USD',total_amount:'250',expires_at:'2099-01-01',live_mode:false,slices:[]};assert.equal(parseOffers({data:{offers:[offer]}},input),null);
 const q=parseOffers({data:{offers:[{...offer,live_mode:true}]}},input);assert.equal(q.amount,250);
});
test('all user-confirmed hosts are excluded from every event on their hosting weekend',()=>{
 const s=state();
 for(const [team,host,blocked] of [['Wisconsin','BND','MANIA'],['Illini','MANIA','BND'],['Northeastern','BNB','MASTI'],['BU','BNB','MASTI']]){
  s.teams[team]={...s.teams.UVA};const rows=scoreTeam(data,s,team);
  for(const id of [host,blocked])assert(rows.find(r=>r.competition.id===id).reasons.includes(`Hosting ${host} this weekend`));
  const planned=plan(rows,s.teams[team],settings);assert(!planned.rows.some(r=>[host,blocked].includes(r.competition.id)));
 }
 assert(data.teams.includes('UW')&&data.teams.includes('Wisconsin'));
});
test('saved scenarios gain confirmed hosts once and preserve custom dates, settings, and fares',()=>{
 const template=state();template.teams.Wisconsin={...template.teams.UVA,airport:'MSN'};
 const old=structuredClone(template);delete old.teams.Wisconsin;
 for(const c of old.competitions)if(['BND','MANIA','BNB'].includes(c.id)){c.hosts=[];delete c.hostRevision;}
 old.competitions.find(c=>c.id==='BNB').date='2027-03-06';old.settings.weights.history=72;old.routes['UVA|BNB']={quote:{amount:345}};
 migrateHosts(old,template);assert.deepEqual(old.competitions.find(c=>c.id==='BNB').hosts,['Northeastern','BU']);assert.equal(old.competitions.find(c=>c.id==='BNB').date,'2027-03-06');assert.equal(old.settings.weights.history,72);assert.equal(old.routes['UVA|BNB'].quote.amount,345);assert.equal(old.teams.Wisconsin.airport,'MSN');
 old.competitions.find(c=>c.id==='BNB').hosts=['BU'];migrateHosts(old,template);assert.deepEqual(old.competitions.find(c=>c.id==='BNB').hosts,['BU']);
});
test('timeline includes empty weekends and distinguishes hosting, attendance, blackouts, and rest',()=>{
 const rows=[row('A','2027-01-23',90),{...row('HOST','2027-02-13',null,['UVA']),blocked:true},row('B','2027-02-20',70)];
 const profile={target:1,budget:0,unavailable:['2027-02-06']};const selected=plan(rows,profile,settings);const weeks=seasonWeeks(rows.map(r=>r.competition));assert.equal(weeks.length,5);
 const s=scheduleSummary(rows,selected,profile,settings,weeks);assert.deepEqual(s.timeline.map(s=>s.kind),['compete','free','unavailable','host','free']);assert.equal(s.free,2);assert.equal(s.hosting,1);assert.equal(s.events,1);
});
test('two-season ratings and strength arithmetic reconcile, exclude self and preserve unknown fields',()=>{
 const ratings=teamRatings(data);assert.equal(ratings.UVA.points,18);assert.equal(ratings.UVA.appearances,8);assert.equal(ratings.UVA.rating,56.25);assert.equal(ratings.Northeastern.rating,78.125);
 assert.equal(competitionStrength(data,'BND','UVA').score,null);
 const field=competitionStrength(data,'RCR','UVA');assert.equal(field.editions.length,2);assert(field.editions.every(e=>!e.opponents.some(t=>t.team==='UVA')));
 const manual=field.editions.map(e=>{const rated=e.opponents.filter(t=>t.rating!==null);return rated.reduce((s,t)=>s+100*t.points/(4*t.appearances),0)/rated.length;});assert(Math.abs(field.score-(manual[0]+manual[1])/2)<1e-10);
 const strength=scheduleStrength(data,'UVA',['RCR','BND']);assert.equal(strength.known,1);assert.equal(strength.total,2);assert.equal(strength.score,field.score);
 assert.equal(scheduleStrength(data,'UVA',[],'2024-2025').total,4);
});
test('score contributions and schedule fit minus rest penalty reconcile',()=>{
 const s=state(),rows=scoreTeam(data,s,'UVA');for(const r of rows){assert(Math.abs(r.rawScore-Object.values(r.contributions).reduce((a,b)=>a+b,0))<1e-10);assert.equal(r.contributions.strength,0);}
 const p=plan(rows,s.teams.UVA,s.settings);assert(Math.abs(p.value-(p.fitTotal-p.restPenalty))<1e-10);
});
test('what-if previews do not mutate saved settings or quotes and affect only stated inputs',()=>{
 const s=state(),old=structuredClone(s);const recent=scenarioWithPreset(s,'recent');assert.equal(recent.settings.lookback,2);assert.deepEqual(s,old);
 const c=s.competitions.find(c=>c.id==='RAMPAGE');s.routes['UVA|RAMPAGE']={quote:{origin:'CHO',destination:'ORD',competitionDate:c.date,currency:'USD',amount:200}};
 const before=scoreTeam(data,s,'UVA').find(r=>r.competition.id===c.id),after=scoreTeam(data,scenarioWithPreset(s,'airfare'),'UVA').find(r=>r.competition.id===c.id);
 assert.equal(after.fare,200);assert.equal(after.modeledFare,250);assert.equal(after.cost-before.cost,50);assert.equal(s.routes['UVA|RAMPAGE'].quote.amount,200);
 assert.equal(scenarioWithPreset(s,'challenge').settings.weights.strength,30);assert.equal(scenarioWithPreset(s,'easier').settings.strengthDirection,0);
});
test('free SerpApi integration validates exact USD round trip and never leaks account key',()=>{
 const input={origin:'CHO',destination:'SFO',competitionDate:'2027-03-06'},params=serpParameters(input);assert.equal(params.type,'1');assert.equal(params.stops,'2');assert.equal(params.return_date,'2027-03-07');
 const offer={price:350,type:'Round trip',total_duration:320,flights:[{airline:'Example Air',departure_airport:{id:'CHO',time:'2027-03-05 10:00'},arrival_airport:{id:'SFO',time:'2027-03-05 12:20'}}]};
 const payload={search_parameters:params,best_flights:[offer],search_metadata:{processed_at:new Date().toISOString()}};
 const quote=parseSerpOffers(payload,input);assert.equal(quote.amount,350);assert.equal(quote.itineraries.length,1);assert(quote.note.includes('return choice'));assert.equal(quote.currency,'USD');
 assert.equal(parseSerpOffers({...payload,search_parameters:{...params,currency:'EUR'}},input),null);assert.equal(parseSerpOffers(payload,{...input,destination:'LAX'}),null);assert.equal(parseSerpOffers({...payload,best_flights:[{...offer,type:'One way'}]},input),null);
 const account=publicFreeAccount({account_status:'Active',plan_monthly_price:0,total_searches_left:245,searches_per_month:250,api_key:'never-return-me',account_email:'private@example.com'});assert.equal(account.remaining,245);assert(!JSON.stringify(account).includes('never-return-me'));assert(!('account_email' in account));
 assert.throws(()=>publicFreeAccount({account_status:'Active',plan_monthly_price:25}));assert.throws(()=>publicFreeAccount({error:'Invalid key'}));
});
