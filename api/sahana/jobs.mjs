import { plain, rankJobs } from '../../lib/sahana/match.mjs';

export async function federalJobs(env = process.env, fetcher = fetch) {
  if (!env.USAJOBS_API_KEY || !env.USAJOBS_EMAIL) throw new Error('Federal source is not configured');
  const jobs = []; let partial = false;
  for (let page = 1; page <= 3; page++) {
    const params = new URLSearchParams({HiringPath:'student', ResultsPerPage:'500', Fields:'Full', SortField:'opendate', SortDirection:'desc', Page:String(page)});
    const response = await fetcher(`https://data.usajobs.gov/api/search?${params}`, {headers:{'User-Agent':env.USAJOBS_EMAIL,'Authorization-Key':env.USAJOBS_API_KEY,Host:'data.usajobs.gov'}, signal:AbortSignal.timeout(18000)});
    if (!response.ok) throw new Error(`USAJOBS HTTP ${response.status}`);
    const data = await response.json(), result = data.SearchResult;
    if (!Array.isArray(result?.SearchResultItems)) throw new Error('Unexpected federal response');
    for (const row of result.SearchResultItems) {
      const d = row.MatchedObjectDescriptor, x = d.UserArea?.Details || {}, pay = d.PositionRemuneration?.[0];
      jobs.push({id:`usajobs-${d.PositionID}`, sourceId:'usajobs', title:d.PositionTitle, company:d.OrganizationName || d.DepartmentName, sector:'government', location:d.PositionLocationDisplay || 'See announcement', mode:String(x.RemoteIndicator).toLowerCase() === 'true' ? 'remote' : 'unspecified', description:plain([d.QualificationSummary,x.JobSummary,x.MajorDuties,x.Education,x.Requirements].flat().filter(Boolean).join(' ')), postedAt:d.PublicationStartDate, closesAt:d.ApplicationCloseDate?.length === 10 ? `${d.ApplicationCloseDate}T23:59:59-12:00` : d.ApplicationCloseDate, url:d.PositionURI, salary:pay ? `$${Number(pay.MinimumRange).toLocaleString('en-US')}–$${Number(pay.MaximumRange).toLocaleString('en-US')} / ${pay.Description || pay.RateIntervalCode || 'year'}` : null});
    }
    if (page*500 >= Number(result.SearchResultCountAll) || result.SearchResultItems.length < 500) break;
    if (page === 3) partial = true;
  }
  return {jobs:rankJobs(jobs), scanned:jobs.length, partial};
}
export default async function handler(req,res) {
  if (!['GET','HEAD'].includes(req.method)) {res.setHeader('Allow','GET, HEAD');return res.status(405).json({error:'Method not allowed'});}
  try {
    const result = await federalJobs();
    res.setHeader('Cache-Control','public, max-age=60');
    res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=3600');
    res.setHeader('X-Robots-Tag','noindex');
    return res.status(200).json({...result,checkedAt:new Date().toISOString()});
  } catch {res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'Federal listings could not be checked. Try USAJOBS directly.'});}
}
