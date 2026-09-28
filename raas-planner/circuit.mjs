import {scoreTeam,week} from './model.mjs';
export const FIELD_MIN=6,FIELD_MAX=8;

// Deterministic multi-start construction plus local improvement. Every assignment
// is feasible for its team; incomplete fields are reported, never called complete.
export function allocateCircuit(data,state,{attempts=4}={}){
 const teams=data.teams.filter(t=>state.teams[t]),comps=state.competitions,settings=state.settings;
 const rows=Object.fromEntries(teams.map(t=>[t,scoreTeam(data,state,t)]));
 const hosts=Object.fromEntries(teams.map(t=>[t,[...new Set(comps.filter(c=>c.hosts.includes(t)&&c.date).map(c=>week(c.date)))]]));
 const targets=Object.fromEntries(teams.map(t=>[t,Math.max(0,Math.min(8,state.teams[t].target))]));
 const index=new Map(comps.map((c,i)=>[c.id,i]));
 function valid(t,list){
  const p=state.teams[t];if(list.length>targets[t]||list.some(r=>r.blocked))return false;
  const weeks=list.map(r=>week(r.competition.date));if(new Set(weeks).size!==weeks.length)return false;
  if(p.strictRest&&weeks.some((w,i)=>[...hosts[t],...weeks.slice(0,i)].some(v=>Math.abs(w-v)<settings.spacing)))return false;
  return !p.budget||(!list.some(r=>r.cost===null)&&list.reduce((sum,r)=>sum+r.cost,0)<=p.budget);
 }
 function penalty(t,list){const ws=[...new Set([...hosts[t],...list.map(r=>week(r.competition.date))])].sort((a,b)=>a-b);return ws.slice(1).reduce((sum,w,i)=>sum+Math.max(0,1-(w-ws[i])/settings.spacing)*settings.spacingPenalty,0);}
 const value=(t,list)=>list.reduce((sum,r)=>sum+r.score,0)-penalty(t,list);
 let best=null,seed=419;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let attempt=0;attempt<attempts;attempt++){
  const chosen=Object.fromEntries(teams.map(t=>[t,[]])),counts=comps.map(()=>0);
  // Fill scarce fields first, then place remaining team demand up to eight.
  for(const limit of [FIELD_MIN,FIELD_MAX]){
   while(true){
    const options=comps.map((c,i)=>({i,c,eligible:counts[i]>=limit?[]:teams.filter(t=>valid(t,[...chosen[t],rows[t][i]]))})).filter(x=>x.eligible.length);
    if(!options.length)break;
    let event;
    if(limit===FIELD_MIN){options.sort((a,b)=>(a.eligible.length-(limit-counts[a.i]))-(b.eligible.length-(limit-counts[b.i]))||a.i-b.i);event=options[0];}
    else {options.sort((a,b)=>Math.max(...b.eligible.map(t=>value(t,[...chosen[t],rows[t][b.i]])-value(t,chosen[t])))-Math.max(...a.eligible.map(t=>value(t,[...chosen[t],rows[t][a.i]])-value(t,chosen[t])))||a.i-b.i);event=options[0];}
    const ranked=event.eligible.map(t=>({t,score:value(t,[...chosen[t],rows[t][event.i]])-value(t,chosen[t])+(targets[t]-chosen[t].length)*3+(attempt?random()*30:0)})).sort((a,b)=>b.score-a.score||a.t.localeCompare(b.t));
    const t=ranked[0].t;chosen[t].push(rows[t][event.i]);counts[event.i]++;
   }
  }
  // Reassign one team between events to repair shortages or improve its fit/rest.
  for(let pass=0;pass<5;pass++){
   let changed=false;
   for(const t of teams)for(const candidate of rows[t]){
    const ci=index.get(candidate.competition.id);if(counts[ci]>=FIELD_MAX||chosen[t].includes(candidate))continue;
    for(const old of [...chosen[t]]){
     const oi=index.get(old.competition.id);if(counts[oi]<=FIELD_MIN)continue;
     const next=chosen[t].filter(r=>r!==old).concat(candidate);if(!valid(t,next))continue;
     if(counts[ci]<FIELD_MIN||value(t,next)>value(t,chosen[t])+1e-8){chosen[t]=next;counts[oi]--;counts[ci]++;changed=true;break;}
    }
   }
   if(!changed)break;
  }
  const deficit=counts.reduce((s,n)=>s+Math.max(0,FIELD_MIN-n),0),total=counts.reduce((a,b)=>a+b,0),fit=teams.reduce((s,t)=>s+value(t,chosen[t]),0);
  if(!best||deficit<best.deficit||(deficit===best.deficit&&(total>best.total||(total===best.total&&fit>best.fit))))best={chosen,counts,deficit,total,fit};
 }
 const matrix=Object.fromEntries(teams.map(t=>{const list=best.chosen[t].sort((a,b)=>a.competition.date.localeCompare(b.competition.date)||a.competition.id.localeCompare(b.competition.id)),fitTotal=list.reduce((s,r)=>s+r.score,0),restPenalty=penalty(t,list);return [t,{rows:rows[t],plan:{rows:list,target:targets[t],shortfall:targets[t]-list.length,cost:list.reduce((s,r)=>s+(r.cost??0),0),unknownCosts:list.filter(r=>r.cost===null).length,fitTotal,restPenalty,value:fitTotal-restPenalty}}];}));
 const fields=comps.map((c,i)=>({id:c.id,count:best.counts[i],minimum:FIELD_MIN,maximum:FIELD_MAX,shortfall:Math.max(0,FIELD_MIN-best.counts[i])}));
 const targetTotal=Object.values(targets).reduce((a,b)=>a+b,0),issues=[];
 if(targetTotal<comps.length*FIELD_MIN)issues.push(`Team targets allow ${targetTotal} appearances; at least ${comps.length*FIELD_MIN} are needed for six teams at every event.`);
 for(const c of fields.filter(c=>c.shortfall))issues.push(`${c.id} needs ${c.shortfall} more eligible team${c.shortfall===1?'':'s'}.`);
 return {matrix,fields,complete:best.deficit===0,total:best.total,missing:best.deficit,issues,method:'Deterministic heuristic; a complete lineup satisfies all constraints, but optimality or infeasibility is not proven.'};
}
