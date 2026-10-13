import { plain, rankJobs } from '../../lib/sahana/match.mjs';

export const SOURCES = [
  {id:'usajobs',name:'USAJOBS · federal students',kind:'federal',sector:'government',url:'https://www.usajobs.gov/Search/Results?hp=student&k=health%20data'},
  {id:'icf',name:'ICF',kind:'workday',sector:'contractor',url:'https://careers.icf.com/us/en/early-career-and-internships'},
  ...[['kodiaksolutions','Kodiak Solutions'],['precisionaq','Precision AQ'],['oscar','Oscar Health'],['flatironhealth','Flatiron Health'],['omadahealth','Omada Health'],['natera','Natera'],['solutions','Cadence']].map(([id,name])=>({id,name,kind:'greenhouse',sector:'healthcare',url:`https://job-boards.greenhouse.io/${id}`})),
  {id:'insitro',name:'insitro',kind:'ashby',sector:'healthcare',url:'https://jobs.ashbyhq.com/insitro'},
];
async function json(url, options = {}, fetcher = fetch) {
  const r = await fetcher(url,{...options,signal:AbortSignal.timeout(20000),headers:{Accept:'application/json',...options.headers}});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function collectSource(s, fetcher = fetch, federalURL = 'https://www.ysunkara.com/api/sahana/jobs') {
  if(s.kind === 'federal') {
    const data = await json(federalURL,{},fetcher);
    if(!Array.isArray(data.jobs)) throw new Error('Invalid federal response');
    return {...data, upstreamCheckedAt:data.checkedAt};
  }
  if(s.kind === 'greenhouse') {
    const data = await json(`https://boards-api.greenhouse.io/v1/boards/${s.id}/jobs?content=true`,{},fetcher);
    if(!Array.isArray(data.jobs)) throw new Error('Invalid employer response');
    return {scanned:data.jobs.length,jobs:data.jobs.map(j=>({id:`${s.id}-${j.id}`,sourceId:s.id,title:j.title,company:s.name,sector:s.sector,location:j.location?.name || 'See posting',description:plain(plain(j.content)),url:j.absolute_url,postedAt:j.first_published || null,updatedAt:j.updated_at}))};
  }
  if(s.kind === 'ashby') {
    const data=await json(`https://api.ashbyhq.com/posting-api/job-board/${s.id}`,{},fetcher);
    if(!Array.isArray(data.jobs))throw new Error('Invalid employer response');
    return {scanned:data.jobs.length,jobs:data.jobs.filter(j=>j.isListed!==false).map(j=>({id:`${s.id}-${j.id}`,sourceId:s.id,title:j.title,company:s.name,sector:s.sector,location:j.location,mode:j.isRemote?'remote':'unspecified',description:j.descriptionPlain || plain(j.descriptionHtml),url:j.jobUrl,postedAt:j.publishedAt}))};
  }
  if(s.kind === 'workday') {
    const root='https://icf.wd5.myworkdayjobs.com/wday/cxs/icf/ICFExternal_Career_Site';
    const listings = []; let total=0;
    for(let offset=0;offset<200;offset+=20) {
      const data=await json(`${root}/jobs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({appliedFacets:{},limit:20,offset,searchText:'intern'})},fetcher);
      if(!Array.isArray(data.jobPostings)) throw new Error('Invalid ICF response');
      total=data.total;listings.push(...data.jobPostings);
      if(listings.length>=total || !data.jobPostings.length) break;
    }
    const candidates=listings.filter(j=>/intern|student|co-?op/i.test(j.title) && /data|analy|health|research|test|quality|informatics|information|computer|statistic|business transformation/i.test(j.title));
    const jobs=[];let failed=0;
    // Bounded concurrent detail retrieval; incomplete coverage is shown explicitly.
    const queue=candidates.slice(0,24);
    await Promise.all(Array.from({length:3},async()=>{while(queue.length){const j=queue.shift();try{
      const d=await json(`${root}${j.externalPath}`,{},fetcher),x=d.jobPostingInfo;
      if(!x?.title || !x.jobDescription) throw new Error('Missing detail');
      jobs.push({id:`icf-${x.jobReqId}`,sourceId:'icf',title:x.title,company:'ICF',sector:'contractor',location:[x.location,...(x.additionalLocations||[])].filter(Boolean).join(' · '),description:plain(x.jobDescription),url:`https://icf.wd5.myworkdayjobs.com/en-US/ICFExternal_Career_Site${j.externalPath}`,postedAt:x.startDate,closesAt:x.endDate});
    }catch{failed++;}}}));
    if(candidates.length && failed===candidates.length) throw new Error('ICF details unavailable');
    return {jobs,scanned:listings.length,partial:failed>0 || total>200 || candidates.length>24};
  }
  throw new Error('Unknown source');
}
export async function collect(previous = {jobs:[],sources:[]}, fetcher = fetch, now = Date.now(), federalURL) {
  const checkedAt=new Date(now).toISOString();
  const results=await Promise.all(SOURCES.map(async s=>{
    try {
      const result=await collectSource(s,fetcher,federalURL);
      const sourceCheckedAt=result.upstreamCheckedAt || checkedAt;
      const jobs=rankJobs(result.jobs,now).map(j=>({...j,checkedAt:sourceCheckedAt,stale:false,firstSeenAt:previous.jobs?.find(old=>old.id===j.id)?.firstSeenAt || checkedAt}));
      return {jobs,source:{...s,status:result.partial?'partial':'ok',checkedAt:sourceCheckedAt,attemptedAt:checkedAt,count:jobs.length,scanned:result.scanned}};
    } catch {
      const oldSource=previous.sources?.find(x=>x.id===s.id);
      const jobs=(previous.jobs||[]).filter(j=>j.sourceId===s.id && now-Date.parse(j.checkedAt)<7*86400000 && (!j.closesAt || Date.parse(j.closesAt)>now)).map(j=>({...j,stale:true}));
      return {jobs,source:{...s,status:'unavailable',checkedAt:oldSource?.checkedAt || null,attemptedAt:checkedAt,count:jobs.length,note:'Could not check this source. Any retained listings are marked unverified.'}};
    }
  }));
  return {version:1,checkedAt,schedule:'Daily at 11:00 UTC (7 am EDT / 6 am EST)',jobs:results.flatMap(x=>x.jobs).sort((a,b)=>b.score-a.score),sources:results.map(x=>x.source)};
}
