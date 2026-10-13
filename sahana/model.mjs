export const active = (job, now=Date.now()) => !job.closesAt || !Number.isFinite(Date.parse(job.closesAt)) || Date.parse(job.closesAt)>=now;
export function visibleJobs(feed,tracker,filters,now=Date.now()) {
  let jobs=filters.view==='saved'||filters.view==='applied' ? Object.values(tracker).filter(x=>filters.view==='saved'?x.saved:['applied','interview','offer','rejected'].includes(x.status)).map(x=>({...x.job,...feed.find(j=>j.id===x.job.id),archived:!feed.some(j=>j.id===x.job.id)})) : feed.filter(j=>active(j,now));
  return jobs.filter(j=>{
    if(filters.view==='discover' && !filters.later && j.eligibility==='later')return false;
    if(filters.category==='government' && j.sector!=='government')return false;
    if(filters.category==='healthcare' && !j.health)return false;
    if(filters.category==='data' && j.track!=='Data & analysis')return false;
    if(filters.category==='testing' && j.track!=='Testing & quality')return false;
    if(filters.location==='local' && !j.local)return false;
    if(filters.location==='remote' && j.mode!=='remote')return false;
    const haystack=[j.title,j.company,j.location,j.description].join(' ').toLowerCase();
    return filters.search.toLowerCase().split(/\s+/).every(word=>haystack.includes(word));
  }).sort((a,b)=>filters.sort==='deadline'?(Date.parse(a.closesAt)||Infinity)-(Date.parse(b.closesAt)||Infinity):filters.sort==='new'?(Date.parse(b.firstSeenAt)||0)-(Date.parse(a.firstSeenAt)||0):b.score-a.score);
}
export function csvCell(value){return '"'+String(value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';}
