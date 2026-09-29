import {week,haversine} from './calendar.mjs';
export const YEARS=['2021-2022','2022-2023','2023-2024','2024-2025','2025-2026'];
export const recentYears=(n=5)=>YEARS.slice(-Math.max(1,Math.min(5,n)));
const spring=e=>e.date&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&e.date.slice(0,4)===e.season.slice(5)&&Number(e.date.slice(5,7))<=4;
const bucket=gap=>Math.min(3,Math.max(0,gap));
const cache=new WeakMap();
export function breakEvidence(data,years=YEARS){
 const key=years.join('|');let saved=cache.get(data);if(!saved){saved=new Map();cache.set(data,saved);}if(saved.has(key))return saved.get(key);
 const totals=[0,0,0,0],byTeam={},seasons=[],records=[];let missingDates=0,offSeason=0,sameWeek=0;
 for(const season of years){const all=data.events.filter(e=>e.season===season&&e.teams.length);missingDates+=all.filter(e=>!e.date).length;offSeason+=all.filter(e=>e.date&&!spring(e)).length;const events=all.filter(spring),teams=[...new Set(events.flatMap(e=>e.teams))],counts=[0,0,0,0];let active=0;
  for(const team of teams){const attended=events.filter(e=>e.teams.includes(team)).sort((a,b)=>a.date.localeCompare(b.date)),unique=[];for(const e of attended){if(unique.at(-1)&&week(unique.at(-1).date)===week(e.date)){sameWeek++;continue;}unique.push(e);}
   const profile=byTeam[team]??={counts:[0,0,0,0],records:[],seasons:[]};profile.seasons.push({season,appearances:unique.length,events:unique.map(e=>e.id)});if(unique.length>1)active++;
   for(let i=1;i<unique.length;i++){const from=unique[i-1],to=unique[i],gap=(week(to.date)-week(from.date))/7-1,b= bucket(gap);if(!Number.isInteger(gap)||gap<0)continue;counts[b]++;totals[b]++;profile.counts[b]++;const record={team,season,from:from.id,to:to.id,fromDate:from.date,toDate:to.date,gap,sourceFrom:from.source,sourceTo:to.source};profile.records.push(record);records.push(record);}
  }
  seasons.push({season,counts,total:counts.reduce((a,b)=>a+b,0),teamSeasons:active});
 }
 const total=totals.reduce((a,b)=>a+b,0),circuitRates=totals.map(n=>total?n/total:.25);
 for(const profile of Object.values(byTeam)){profile.total=profile.counts.reduce((a,b)=>a+b,0);profile.rates=profile.counts.map((n,i)=>(n+2*circuitRates[i])/(profile.total+2));}
 const result={counts:totals,total,rates:circuitRates,byTeam,seasons,records,missingDates,offSeason,sameWeek};saved.set(key,result);return result;
}
export function restProfile(data,team,years=YEARS){const all=breakEvidence(data,years),own=all.byTeam[team];return own?{...own,fallback:false}:{counts:[0,0,0,0],total:0,rates:all.rates,records:[],seasons:[],fallback:true};}
export function typicalSpringCount(data,team){const rows=restProfile(data,team).seasons.map(s=>s.appearances).sort((a,b)=>a-b);return rows.length?Math.round((rows[Math.floor((rows.length-1)/2)]+rows[Math.floor(rows.length/2)])/2):3;}
export function restPenalty(profile,weeks,settings,team){
 const ordered=[...new Set(weeks)].sort((a,b)=>a-b),mode=team.rest==='inherit'?settings.restMode:team.rest;
 if(mode==='none'||!settings.restWeight)return 0;
 const gaps=ordered.slice(1).map((w,i)=>(w-ordered[i])/7-1);
 if(mode==='one')return gaps.reduce((sum,g)=>sum+settings.restWeight*(g===0?1:0),0);
 const best=Math.max(...profile.rates);
 return gaps.reduce((sum,g)=>sum+settings.restWeight*(best-profile.rates[bucket(g)]),0);
}
export function historyEvidence(data,team,id,years){
 const active=years.filter(season=>data.events.some(e=>e.season===season&&e.teams.includes(team)&&spring(e))),events=data.events.filter(e=>active.includes(e.season)&&e.id===id&&e.teams.length&&spring(e));
 const attended=events.filter(e=>e.teams.includes(team)).length;
 const opportunities=data.events.filter(e=>active.includes(e.season)&&e.teams.length&&spring(e));
 const ownRate=opportunities.length?opportunities.filter(e=>e.teams.includes(team)).length/opportunities.length:null;
 const prior=ownRate??.5;
 return {attended,opportunities:events.length,signal:events.length?attended/events.length:prior,fallback:events.length===0,records:events.map(e=>({season:e.season,attended:e.teams.includes(team),source:e.source,cell:data.attendance.find(a=>a.season===e.season&&a.team===team&&a.competition===id)?.cell||null}))};
}
const ratingsCache=new WeakMap();
export function ratings(data,years=YEARS){let saved=ratingsCache.get(data);if(!saved){saved=new Map();ratingsCache.set(data,saved);}const key=years.join('|');if(saved.has(key))return saved.get(key);const grouped={};for(const record of data.performance||[]){if(years.includes(record.season)&&record.appearances>0&&Number.isFinite(record.points))(grouped[record.team]??=[]).push(record);}const result=Object.fromEntries(Object.entries(grouped).map(([team,records])=>{const points=records.reduce((s,r)=>s+r.points,0),appearances=records.reduce((s,r)=>s+r.appearances,0);return [team,{team,points,appearances,score:100*points/(4*appearances),records}];}));saved.set(key,result);return result;}
export function fieldStrength(data,id,years=YEARS,exclude=null){
 const r=ratings(data,years),editions=data.events.filter(e=>e.id===id&&years.includes(e.season)&&e.teams.length).map(e=>{const opponents=e.teams.filter(t=>t!==exclude).map(team=>({team,rating:r[team]||null})),known=opponents.filter(o=>o.rating);return {season:e.season,opponents,known:known.length,total:opponents.length,score:known.length?known.reduce((s,o)=>s+o.rating.score,0)/known.length:null};}),known=editions.filter(e=>e.score!==null);
 return {editions,score:known.length?known.reduce((s,e)=>s+e.score,0)/known.length:null,known:editions.reduce((s,e)=>s+e.known,0),total:editions.reduce((s,e)=>s+e.total,0)};
}
export function scheduleDifficulty(data,team,ids,years=YEARS){const values=ids.map(id=>fieldStrength(data,id,years,team).score),known=values.filter(v=>v!==null);return {score:known.length?known.reduce((a,b)=>a+b,0)/known.length:null,known:known.length,total:ids.length};}
export function scoreRows(data,state,team){
 const p=state.teams[team],s=state.settings,years=recentYears(s.historyYears),hosts=state.competitions.filter(c=>c.hosts.includes(team)).map(c=>week(c.date));
 const distances=state.competitions.map(c=>haversine(p,c)),known=distances.filter(Number.isFinite),strongWeight=s.difficulty==='any'?0:25;
 return state.competitions.map((c,i)=>{const reasons=[];if(hosts.includes(week(c.date)))reasons.push('Hosting this weekend');if(p.unavailable.includes(week(c.date)))reasons.push('Unavailable this weekend');if(p.preferences[c.id]==='avoid')reasons.push('Avoided in your scenario');const distance=Number.isFinite(distances[i])?distances[i]:null,travel=distance===null?.5:known.length<=1?1:(known.filter(d=>d>distance).length+.5*(known.filter(d=>d===distance).length-1))/(known.length-1),history=historyEvidence(data,team,c.id,years),strength=fieldStrength(data,c.id,YEARS,team),strengthSignal=strength.score===null?.5:s.difficulty==='lighter'?1-strength.score/100:strength.score/100;
  const weights={history:(100-s.travelWeight)*(1-strongWeight/100),travel:s.travelWeight*(1-strongWeight/100),strength:strongWeight},signals={history:history.signal,travel,strength:strengthSignal},parts=Object.fromEntries(Object.entries(signals).map(([key,value])=>[key,value*weights[key]])),rawScore=Object.values(parts).reduce((a,b)=>a+b,0),boost=p.preferences[c.id]==='prefer'?Math.min(20,100-rawScore):0;
  return {team,competition:c,cweek:week(c.date),distance,mode:distance===null?'unknown':distance<=p.driveLimit?'drive':'fly',history,strength,weights,parts,rawScore,boost,score:reasons.length?null:rawScore+boost,blocked:reasons.length>0,reasons};
 });
}
