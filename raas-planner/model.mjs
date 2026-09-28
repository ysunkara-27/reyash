export const defaults={weights:{history:45,location:20,flight:15,cost:10,time:10,strength:0},lookback:5,halfLife:3,distanceScale:700,flightScale:400,costScale:500,driveLimit:500,roadFactor:1.2,mileCost:.25,hotel:45,nights:2,fee:50,bags:40,transfer:35,spacing:14,spacingPenalty:10,fareMultiplier:1,strengthDirection:1,strengthLookback:2};
export const day = d => Date.parse(`${d}T12:00:00Z`)/86400000;
export function week(d){const t=new Date(`${d}T12:00:00Z`);return day(d)-((t.getUTCDay()+6)%7);}
export function haversine(a,b){if(!a||!b)return null;const r=Math.PI/180;const v=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2;return 3958.76*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));}
export function historical(data,team,competition,settings){
 const seasons=[...new Set(data.events.filter(e=>e.teams.length).map(e=>e.season))].sort().reverse().slice(0,settings.lookback);
 const active=seasons.filter(s=>data.events.some(e=>e.season===s&&e.teams.includes(team)));
 const opportunities=data.events.filter(e=>active.includes(e.season)&&e.id===competition&&e.teams.length);
 const latest=Number(data.season.slice(0,4))-1;
 let numerator=0,denominator=0;
 for(const e of opportunities){const w=2**(-(latest-Number(e.season.slice(0,4)))/settings.halfLife);denominator+=w;numerator+=w*Number(e.teams.includes(team));}
 const universe=new Set(data.events.filter(e=>seasons.includes(e.season)).flatMap(e=>e.teams));
 const observed=data.events.filter(e=>seasons.includes(e.season)&&e.teams.length);
 const prior=observed.length&&universe.size?observed.reduce((s,e)=>s+e.teams.length,0)/observed.length/universe.size:.2;
 return {signal:(numerator+prior*2)/(denominator+2),prior,numerator,denominator,priorWeight:2,attended:opportunities.filter(e=>e.teams.includes(team)).length,opportunities:opportunities.length,records:opportunities.map(e=>({season:e.season,attended:e.teams.includes(team),weight:2**(-(latest-Number(e.season.slice(0,4)))/settings.halfLife),source:data.attendance.find(a=>a.season===e.season&&a.team===team&&a.competition===competition)?.cell||null})),active};
}
export function typicalCount(data,team,settings){const h=historical(data,team,'',settings);const values=h.active.map(s=>data.events.filter(e=>e.season===s&&e.teams.includes(team)).length).sort((a,b)=>a-b);return values.length?Math.round(values[Math.floor(values.length/2)]):3;}
export function usableQuote(q,origin,destination,date,now=Date.now()){
 if(!q||q.origin!==origin||q.destination!==destination||q.competitionDate!==date||q.currency!=='USD'||!Number.isFinite(q.amount)||q.amount<0)return null;
 if(q.expiresAt&&Date.parse(q.expiresAt)<=now&&!q.planningSnapshot)return null;
 return q;
}
export function scoreTeam(data,state,team){
 const s=state.settings,p=state.teams[team],events=state.competitions;
 const hosting=events.filter(c=>c.hosts.includes(team)&&c.date);
 return events.map(c=>{
  const reasons=[];
  if(!c.date||!Number.isFinite(day(c.date)))reasons.push('Competition date missing');
  for(const h of hosting)if(c.date&&week(h.date)===week(c.date))reasons.push(`Hosting ${h.id} this weekend`);
  if(p.unavailable?.some(d=>week(d)===week(c.date)))reasons.push('Team unavailable this weekend');
  const distance=haversine(p,c),route=state.routes[`${team}|${c.id}`]||{};
  const mode=route.mode||((distance??Infinity)<=s.driveLimit?'drive':'fly');
  const q=usableQuote(route.quote,p.airport,c.airport,c.date);
  const fare=q?.amount??null,modeledFare=fare===null?null:fare*(s.fareMultiplier??1);
  const miles=distance===null?null:distance*s.roadFactor;
  const transport=mode==='drive'?(miles===null?null:2*miles*s.mileCost):(modeledFare===null?null:modeledFare+s.bags+s.transfer);
  const cost=transport===null?null:transport+s.hotel*s.nights+(c.fee??s.fee);
  const hours=mode==='drive'?(miles===null?null:miles/55):(q?.durationHours??(distance===null?null:distance/450+3));
  const history=historical(data,team,c.id,s);
  const strength=competitionStrength(data,c.id,team,s.strengthLookback);
  const signals={history:history.signal,location:distance===null?.5:Math.exp(-distance/s.distanceScale),flight:mode==='drive'?.5:modeledFare===null?.5:Math.exp(-modeledFare/s.flightScale),cost:cost===null?.5:Math.exp(-cost/s.costScale),time:hours===null?.5:Math.exp(-hours/8),strength:strength.score===null?.5:s.strengthDirection===0?1-strength.score/100:strength.score/100};
  const totalWeight=Object.values(s.weights).reduce((a,b)=>a+b,0);
  const contributions=Object.fromEntries(Object.entries(signals).map(([k,v])=>[k,totalWeight?100*v*(s.weights[k]||0)/totalWeight:0]));
  const score=Object.values(contributions).reduce((a,b)=>a+b,0);
  const missing=[];if(!c.hosts.length)missing.push('Host not verified');if(mode==='fly'&&fare===null)missing.push('Flight price missing or expired');if(distance===null)missing.push('Location missing');if(!history.opportunities)missing.push('No comparable team history');
  return {competition:c,team,score:reasons.length?null:score,rawScore:score,blocked:reasons.length>0,reasons,missing,history,distance,mode,fare,modeledFare,cost,hours,signals,contributions,strength,transport,quote:q};
 });
}
// Enumerate feasible schedules; optimize aggregate score with a short-recovery penalty.
// The small 17-event season permits an exact search, with no greedy ordering artifacts.
export function plan(rows,profile,settings){
 const candidates=rows.filter(r=>!r.blocked).sort((a,b)=>a.competition.date.localeCompare(b.competition.date)||a.competition.id.localeCompare(b.competition.id));
 const target=Math.max(0,Math.min(8,profile.target));
 const budget=profile.budget||null;
 const hostingDates=rows.filter(r=>r.competition.hosts.includes(r.team)).map(r=>r.competition.date).filter(Boolean);
 const gapPenalty=gap=>gap<settings.spacing?settings.spacingPenalty*(1-gap/settings.spacing):0;
 function recovery(chosen){
  const weeks=[...new Set([...hostingDates,...chosen.map(r=>r.competition.date)].map(week))].sort((a,b)=>a-b);
  return weeks.slice(1).reduce((sum,w,i)=>sum+gapPenalty(w-weeks[i]),0);
 }
 let best={rows:[],value:-recovery([]),cost:0,unknownCosts:0};
 function walk(start,chosen,value,cost,unknown){
  const adjusted=value-recovery(chosen);
  if(chosen.length>best.rows.length||(chosen.length===best.rows.length&&adjusted>best.value))best={rows:[...chosen],value:adjusted,cost,unknownCosts:unknown};
  if(chosen.length===target)return;
  for(let i=start;i<candidates.length;i++){
   const r=candidates[i],last=chosen.at(-1);
   if(last&&week(last.competition.date)===week(r.competition.date))continue;
   if(profile.strictRest&&[...hostingDates,...chosen.map(x=>x.competition.date)].some(d=>Math.abs(week(d)-week(r.competition.date))<settings.spacing))continue;
   if(budget&&(r.cost===null||cost+r.cost>budget))continue;
   walk(i+1,[...chosen,r],value+r.score,cost+(r.cost??0),unknown+Number(r.cost===null));
  }
 }
 if(target)walk(0,[],0,0,0);
 return {...best,target,shortfall:target-best.rows.length,fitTotal:best.rows.reduce((sum,r)=>sum+r.score,0),restPenalty:recovery(best.rows)};
}

// Apply confirmed host updates once, without discarding saved travel inputs or dates.
export function migrateHosts(saved,template){
 for(const [key,value] of Object.entries(defaults))if(key!=='weights')saved.settings[key]??=value;
 saved.settings.weights.strength??=0;
 for(const [team,profile] of Object.entries(template.teams))saved.teams[team]??=structuredClone(profile);
 for(const current of template.competitions){
  const old=saved.competitions.find(c=>c.id===current.id);
  if(old&&(current.hostRevision||0)>(old.hostRevision||0)){
   for(const key of ['name','hosts','hostSource','hostRevision'])old[key]=structuredClone(current[key]);
  }
 }
 return saved;
}

export function seasonWeeks(competitions){
 const values=competitions.filter(c=>c.date&&Number.isFinite(day(c.date))).map(c=>week(c.date));
 if(!values.length)return [];
 const first=Math.min(...values),last=Math.max(...values);
 return Array.from({length:Math.min(104,Math.round((last-first)/7)+1)},(_,i)=>first+i*7);
}
export function scheduleSummary(rows,schedule,profile,settings,weeks=seasonWeeks(rows.map(r=>r.competition))){
 const timeline=weeks.map(w=>{
  const hosts=rows.filter(r=>r.competition.hosts.includes(r.team)&&week(r.competition.date)===w).map(r=>r.competition.id);
  const events=schedule.rows.filter(r=>week(r.competition.date)===w).map(r=>r.competition.id);
  const unavailable=profile.unavailable.some(d=>week(d)===w);
  return {week:w,kind:hosts.length?'host':events.length?'compete':unavailable?'unavailable':'free',events:hosts.length?hosts:events};
 });
 const busy=timeline.filter(w=>['host','compete'].includes(w.kind));
 const shortGaps=busy.slice(1).filter((w,i)=>w.week-busy[i].week<settings.spacing).length;
 return {timeline,events:schedule.rows.length,target:schedule.target,free:timeline.filter(w=>w.kind==='free').length,hosting:timeline.filter(w=>w.kind==='host').length,shortGaps,flights:schedule.rows.filter(r=>r.mode==='fly').length,cost:schedule.cost,unknownCosts:schedule.unknownCosts,averageFit:schedule.rows.length?schedule.rows.reduce((sum,r)=>sum+r.score,0)/schedule.rows.length:null,selected:schedule.rows.map(r=>r.competition.id)};
}

export function strengthSeasons(data,lookback=2){const latest=Number(data.season.slice(0,4))-1;return Array.from({length:Math.max(2,Math.min(5,lookback))},(_,i)=>`${latest-i}-${latest-i+1}`).reverse();}
const ratingCache=new WeakMap(),fieldCache=new WeakMap();
export function teamRatings(data,lookback=2){
 let cache=ratingCache.get(data);if(!cache){cache=new Map();ratingCache.set(data,cache);}if(cache.has(lookback))return cache.get(lookback);
 const grouped={};
 for(const r of data.performance||[]){if(!strengthSeasons(data,lookback).includes(r.season)||r.appearances<=0||!Number.isFinite(r.points))continue;(grouped[r.team]??=[]).push(r);}
 const ratings=Object.fromEntries(Object.entries(grouped).map(([team,records])=>{const points=records.reduce((s,r)=>s+r.points,0),appearances=records.reduce((s,r)=>s+r.appearances,0);return [team,{team,points,appearances,rating:100*points/(4*appearances),records}];}));
 cache.set(lookback,ratings);return ratings;
}
function fieldStrength(data,event,excludeTeam,lookback=2){
 const ratings=teamRatings(data,lookback),opponents=event.teams.filter(t=>t!==excludeTeam).map(team=>({team,...(ratings[team]||{rating:null,points:null,appearances:0,records:[]})})),known=opponents.filter(t=>t.rating!==null);
 return {season:event.season,competition:event.id,opponents,known:known.length,total:opponents.length,score:known.length?known.reduce((s,t)=>s+t.rating,0)/known.length:null};
}
export function competitionStrength(data,competition,excludeTeam,lookback=2){
 let cache=fieldCache.get(data);if(!cache){cache=new Map();fieldCache.set(data,cache);}const key=JSON.stringify([competition,excludeTeam,lookback]);if(cache.has(key))return cache.get(key);
 const editions=data.events.filter(e=>e.id===competition&&strengthSeasons(data,lookback).includes(e.season)&&e.teams.length).map(e=>fieldStrength(data,e,excludeTeam,lookback));
 const known=editions.filter(e=>e.score!==null);const result={score:known.length?known.reduce((s,e)=>s+e.score,0)/known.length:null,editions,knownOpponents:editions.reduce((s,e)=>s+e.known,0),totalOpponents:editions.reduce((s,e)=>s+e.total,0)};cache.set(key,result);return result;
}
export function scheduleStrength(data,team,competitionIds,season=null,lookback=2){
 const events=season?data.events.filter(e=>e.season===season&&e.teams.includes(team)).map(e=>fieldStrength(data,e,team,lookback)):competitionIds.map(id=>({competition:id,...competitionStrength(data,id,team,lookback)}));
 const known=events.filter(e=>e.score!==null);return {score:known.length?known.reduce((s,e)=>s+e.score,0)/known.length:null,known:known.length,total:events.length,events};
}
export const presets={
 balanced:{label:'Balanced',description:'History, travel cost, and distance together.',weights:{history:45,location:20,flight:15,cost:10,time:10,strength:0},fareMultiplier:1,spacing:14,spacingPenalty:10},
 recent:{label:'Last 2 seasons',description:'Focus attendance patterns on 2024–25 and 2025–26.',lookback:2,weights:{history:65,location:15,flight:10,cost:5,time:5,strength:0}},
 budget:{label:'Lower travel cost',description:'Give trip cost and airfare more influence.',weights:{history:20,location:15,flight:25,cost:30,time:10,strength:0}},
 rest:{label:'More recovery',description:'Strongly prefer one free weekend between commitments.',spacing:14,spacingPenalty:50},
 airfare:{label:'Fares rise 25%',description:'Raise entered flight prices by 25%; missing fares stay unknown.',fareMultiplier:1.25},
 challenge:{label:'Stronger fields',description:'Favor stronger fields across your selected strength-history window.',weights:{history:30,location:15,flight:10,cost:10,time:5,strength:30},strengthDirection:1},
 easier:{label:'Lighter fields',description:'Favor lower historical field strength, with travel still considered.',weights:{history:30,location:15,flight:10,cost:10,time:5,strength:30},strengthDirection:0}
};
export function scenarioWithPreset(state,id){if(!presets[id])throw Error('Unknown model preset.');const copy=structuredClone(state),{label,description,...settings}=presets[id];Object.assign(copy.settings,settings);return copy;}
