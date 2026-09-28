export const fareRouteKey=r=>`${r.origin}|${r.destination}|${r.competitionDate}`;
export function fareRoutes(state,allocation,scope='shortlist'){
 const routes=new Map();
 for(const [team,{rows,plan}] of Object.entries(allocation.matrix)){
  const proposed=new Set(plan.rows.map(r=>r.competition.id));
  const eligible=rows.filter(r=>!r.blocked&&r.mode==='fly').sort((a,b)=>b.score-a.score);
  const backups=new Set(eligible.filter(r=>!proposed.has(r.competition.id)).slice(0,2).map(r=>r.competition.id));
  for(const r of eligible){
   const chosen=proposed.has(r.competition.id);if(scope!=='all'&&!chosen&&!backups.has(r.competition.id))continue;
   const route={origin:state.teams[team].airport,destination:r.competition.airport,competitionDate:r.competition.date,priority:(chosen?1000:backups.has(r.competition.id)?500:0)+r.score};
   if(route.origin===route.destination||!/^[A-Z]{3}$/.test(route.origin)||!/^[A-Z]{3}$/.test(route.destination))continue;
   const key=fareRouteKey(route);if(!routes.has(key)||routes.get(key).priority<route.priority)routes.set(key,route);
  }
 }
 return [...routes.values()].sort((a,b)=>b.priority-a.priority||fareRouteKey(a).localeCompare(fareRouteKey(b)));
}
export function mergeBackendFares(state,quotes){
 const byRoute=new Map(quotes.filter(q=>q.planningSnapshot&&q.currency==='USD'&&Number.isFinite(q.amount)&&q.amount>0&&Number.isFinite(Date.parse(q.retrievedAt))).map(q=>[fareRouteKey(q),q]));
 let changed=0;
 for(const [team,p] of Object.entries(state.teams))for(const c of state.competitions){
  const quote=byRoute.get(fareRouteKey({origin:p.airport,destination:c.airport,competitionDate:c.date}));if(!quote)continue;
  const key=`${team}|${c.id}`,previous=state.routes[key]?.quote;
  if(previous&&!previous.planningSnapshot&&(!previous.expiresAt||Date.parse(previous.expiresAt)>Date.now()))continue;
  if(previous?.planningSnapshot&&previous.origin===quote.origin&&previous.destination===quote.destination&&previous.competitionDate===quote.competitionDate&&Date.parse(previous.retrievedAt)>=Date.parse(quote.retrievedAt))continue;
  state.routes[key]??={};state.routes[key].quote=structuredClone(quote);changed++;
 }
 return changed;
}
