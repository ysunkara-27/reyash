import { DAY, plain, roleType, safeURL, workMode } from './match.mjs';

export const SOURCE_DEFINITIONS = [
  { id: 'progressive', name: 'Progressive', sector: 'private', kind: 'careers', url: 'https://careers.progressive.com/search/category/technology/jobs/', pages: ['https://careers.progressive.com/search/category/technology/jobs/', 'https://careers.progressive.com/search/job-level/people-leader/jobs/', 'https://careers.progressive.com/search/job-level/senior-leader/jobs/'] },
  { id: 'usajobs', name: 'USAJOBS', sector: 'federal', kind: 'federal', url: 'https://www.usajobs.gov/Search/Results?j=2210&hp=public&s=startdate&sd=desc' },
  { id: 'leidos', name: 'Leidos', sector: 'contractor', kind: 'careers', url: 'https://careers.leidos.com/search/category/proj-and-prog-management/cfm17/united-states/jobs', pages: ['https://careers.leidos.com/search/category/proj-and-prog-management/cfm17/united-states/jobs', 'https://careers.leidos.com/search/cfm17/united-states/jobs?q=software%20manager', 'https://careers.leidos.com/search/cfm17/united-states/jobs?q=scrum'] },
  { id: 'navapbc', name: 'Nava PBC', sector: 'contractor', kind: 'greenhouse', url: 'https://job-boards.greenhouse.io/navapbc' },
  { id: 'civicactions', name: 'CivicActions', sector: 'contractor', kind: 'greenhouse', url: 'https://job-boards.greenhouse.io/civicactions' },
  { id: 'nextinsurance66', name: 'ERGO NEXT', sector: 'private', kind: 'greenhouse', url: 'https://job-boards.greenhouse.io/nextinsurance66' },
  { id: 'root', name: 'Root Insurance', sector: 'private', kind: 'greenhouse', url: 'https://job-boards.greenhouse.io/root' },
  { id: 'twilio', name: 'Twilio', sector: 'private', kind: 'greenhouse', url: 'https://job-boards.greenhouse.io/twilio' },
  {"id": "metrostarsystems", "name": "MetroStar", "sector": "contractor", "kind": "greenhouse", "group": "civic", "url": "https://job-boards.greenhouse.io/metrostarsystems"},
  {"id": "oddball", "name": "Oddball", "sector": "contractor", "kind": "greenhouse", "group": "civic", "url": "https://job-boards.greenhouse.io/oddball"},
  {"id": "redhorsecorp", "name": "Redhorse", "sector": "contractor", "kind": "lever", "group": "federal-delivery", "url": "https://jobs.lever.co/redhorsecorp"},
  {"id": "anavationllc", "name": "AnaVation", "sector": "contractor", "kind": "lever", "group": "federal-delivery", "url": "https://jobs.lever.co/anavationllc"},
  {"id": "agile-defense", "name": "Agile Defense", "sector": "contractor", "kind": "lever", "group": "federal-delivery", "url": "https://jobs.lever.co/agile-defense"},
  {"id": "ibility", "name": "Ibility", "sector": "contractor", "kind": "lever", "group": "federal-delivery", "url": "https://jobs.lever.co/ibility"},
  {"id": "insomniacdesign", "name": "Insomniac Design", "sector": "private", "kind": "lever", "group": "federal-delivery", "url": "https://jobs.lever.co/insomniacdesign"},
  {"id": "pieinsurance", "name": "Pie Insurance", "sector": "private", "kind": "greenhouse", "group": "insurance", "url": "https://job-boards.greenhouse.io/pieinsurance"},
  {"id": "oscar", "name": "Oscar Health", "sector": "private", "kind": "greenhouse", "group": "insurance", "url": "https://job-boards.greenhouse.io/oscar"},
  {"id": "headway", "name": "Headway", "sector": "private", "kind": "ashby", "group": "insurance", "url": "https://jobs.ashbyhq.com/headway"},
  {"id": "omadahealth", "name": "Omada Health", "sector": "private", "kind": "greenhouse", "group": "insurance", "url": "https://job-boards.greenhouse.io/omadahealth"},
  {"id": "datadog", "name": "Datadog", "sector": "private", "kind": "greenhouse", "group": "platforms", "url": "https://job-boards.greenhouse.io/datadog"},
  {"id": "cloudflare", "name": "Cloudflare", "sector": "private", "kind": "greenhouse", "group": "platforms", "url": "https://job-boards.greenhouse.io/cloudflare"},
  {"id": "gitlab", "name": "GitLab", "sector": "private", "kind": "greenhouse", "group": "platforms", "url": "https://job-boards.greenhouse.io/gitlab"},
  {"id": "okta", "name": "Okta", "sector": "private", "kind": "greenhouse", "group": "platforms", "url": "https://job-boards.greenhouse.io/okta"},
  {"id": "zscaler", "name": "Zscaler", "sector": "private", "kind": "greenhouse", "group": "platforms", "url": "https://job-boards.greenhouse.io/zscaler"},
  {"id": "affirm", "name": "Affirm", "sector": "private", "kind": "greenhouse", "group": "finance", "url": "https://job-boards.greenhouse.io/affirm"},
  {"id": "sofi", "name": "SoFi", "sector": "private", "kind": "greenhouse", "group": "finance", "url": "https://job-boards.greenhouse.io/sofi"},
  {"id": "coinbase", "name": "Coinbase", "sector": "private", "kind": "greenhouse", "group": "finance", "url": "https://job-boards.greenhouse.io/coinbase"},
  {"id": "robinhood", "name": "Robinhood", "sector": "private", "kind": "greenhouse", "group": "finance", "url": "https://job-boards.greenhouse.io/robinhood"},
  {"id": "ramp", "name": "Ramp", "sector": "private", "kind": "ashby", "group": "software", "url": "https://jobs.ashbyhq.com/ramp"},
  {"id": "vanta", "name": "Vanta", "sector": "private", "kind": "ashby", "group": "software", "url": "https://jobs.ashbyhq.com/vanta"},
  {"id": "notion", "name": "Notion", "sector": "private", "kind": "ashby", "group": "software", "url": "https://jobs.ashbyhq.com/notion"},
  {"id": "ashby", "name": "Ashby", "sector": "private", "kind": "ashby", "group": "software", "url": "https://jobs.ashbyhq.com/ashby"},
  {"id": "openteams", "name": "OpenTeams", "sector": "private", "kind": "greenhouse", "group": "civic", "url": "https://job-boards.greenhouse.io/openteams"},
  {"id": "tomorrow", "name": "Tomorrow.io", "sector": "private", "kind": "greenhouse", "group": "civic", "url": "https://job-boards.greenhouse.io/tomorrow"},
];
const USER_AGENT = 'AmmaJobs/1.0 (+https://www.ysunkara.com/amma/)';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const nextRequest = new Map();
async function request(url, { signal, fetcher = fetch, headers = {}, allowPath, throttle = true, requestTimes = nextRequest, interval = 300 } = {}, redirects = 0) {
  signal?.throwIfAborted();
  const origin = new URL(url).origin;
  if (throttle) {
    const next = Math.max(Date.now(), requestTimes.get(origin) || 0);
    requestTimes.set(origin, next + interval);
    await pause(next - Date.now());
  }
  signal?.throwIfAborted();
  const response = await fetcher(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,text/html', ...headers }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000), redirect: 'manual' });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const target = new URL(response.headers.get('location'), url);
    if (redirects >= 3 || target.origin !== origin || (allowPath && !allowPath(target.pathname + target.search))) throw new Error('Source redirected outside allowed paths');
    return request(target.href, { signal, fetcher, headers, allowPath, throttle, requestTimes, interval }, redirects + 1);
  }
  if (!response.ok) throw Object.assign(new Error(`Source returned HTTP ${response.status}`), { status: response.status });
  const body = await response.text();
  if (body.length > 12_000_000) throw new Error('Source response too large');
  return body;
}
export function robotsAllowed(text, path, agent = 'ammajobs') {
  const groups = []; let group = { agents: [], rules: [], delay: 0 }, hasRules = false;
  for (const line of text.split(/\r?\n/)) {
    const m = line.replace(/#.*$/, '').trim().match(/^([^:]+):\s*(.*)$/); if (!m) continue;
    const key = m[1].toLowerCase(), value = m[2].trim();
    if (key === 'user-agent') {
      if (hasRules) { groups.push(group); group = { agents: [], rules: [], delay: 0 }; hasRules = false; }
      group.agents.push(value.toLowerCase());
    } else if (group.agents.length && ['allow', 'disallow', 'crawl-delay'].includes(key)) {
      hasRules = true;
      if (key === 'crawl-delay') group.delay = Number(value) || 0;
      else if (value) group.rules.push({ allow: key === 'allow', path: value });
    }
  }
  groups.push(group);
  let selected = groups.filter(g => g.agents.some(a => a !== '*' && agent.includes(a)));
  if (!selected.length) selected = groups.filter(g => g.agents.includes('*'));
  // A longer crawl delay cannot fit this small on-demand function. Skip, don't ignore it.
  if (selected.some(g => g.delay > 1)) return false;
  const rules = selected.flatMap(g => g.rules).filter(r => {
    const pattern = r.path.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${pattern}`).test(path);
  }).sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return !rules.length || rules[0].allow;
}
export function structuredJobs(html) {
  const jobs = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if ([node['@type']].flat().includes('JobPosting')) jobs.push(node);
    if (Array.isArray(node)) node.forEach(visit);
    else for (const [key, value] of Object.entries(node)) if (key !== '@context' && typeof value === 'object') visit(value);
  }
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(m[1])); } catch { /* Fail closed for malformed structured data. */ }
  }
  return jobs;
}
export function listingLinks(html, base) {
  const links = new Map();
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = new URL(plain(m[1]), base), title = plain(m[2]);
      if (url.origin === new URL(base).origin && /^\/jobs\/\d+/.test(url.pathname) && roleType(title)) links.set(url.href, title);
    } catch { /* Ignore invalid links. */ }
  }
  return [...links.keys()];
}
function salaryText(salary, description = '') {
  if (salary?.value) {
    const v = salary.value, amount = v.minValue ? `${Number(v.minValue).toLocaleString('en-US')}${v.maxValue ? `–${Number(v.maxValue).toLocaleString('en-US')}` : '+'}` : v.value ? Number(v.value).toLocaleString('en-US') : null;
    if (amount) return `${salary.currency || 'USD'} ${amount}${v.unitText ? ` / ${v.unitText.toLowerCase()}` : ''}`;
  }
  return plain(description).match(/\$[\d,]+(?:\.\d{2})?\s*(?:-|–|to)\s*\$[\d,]+(?:\.\d{2})?(?:\s*(?:per |\/)?(?:year|annually|hour))?/i)?.[0] || null;
}
export function fromStructured(j, source, url) {
  const locations = [j.jobLocation].flat().filter(Boolean).map(l => {
    const a = l.address || {}; return [a.addressLocality, a.addressRegion, typeof a.addressCountry === 'object' ? a.addressCountry.name : a.addressCountry].filter(Boolean).join(', ');
  });
  const countryValues = [j.jobLocation].flat().filter(Boolean).map(l => l.address?.addressCountry).filter(Boolean).map(c => typeof c === 'object' ? c.name : c);
  if (countryValues.length && countryValues.every(c => !/^(US|USA|United States(?: of America)?)$/i.test(c))) return null;
  const mode = j.jobLocationType === 'TELECOMMUTE' ? 'remote' : workMode(`${j.title} ${locations.join(' ')} ${plain(j.description).match(/(?:work (?:location|arrangement)|remote work|workplace type)\s*:.{0,50}/i)?.[0] || ''}`);
  return { id: j.identifier?.value || url, title: j.title, company: source.name, sector: source.sector, description: j.description, postedAt: j.datePosted, closesAt: j.validThrough, location: locations.join(' · ') || (mode === 'remote' ? 'Remote — see location restrictions' : ''), mode, salary: salaryText(j.baseSalary, j.description), url };
}
async function careers(source, options) {
  const origin = new URL(source.url).origin;
  let robots;
  try { robots = await request(`${origin}/robots.txt`, options); }
  catch (e) { if (e.message.includes('HTTP 404')) robots = ''; else throw new Error('Could not verify source crawl policy'); }
  const read = async url => {
    options.signal?.throwIfAborted();
    const parsed = new URL(url);
    if (parsed.origin !== origin || !robotsAllowed(robots, parsed.pathname + parsed.search)) throw new Error('Source crawl policy prevents automatic checks');
    await pause(1100);
    return request(url, { ...options, allowPath: path => robotsAllowed(robots, path) });
  };
  const links = new Set(), jobs = []; let pagesRead = 0, failed = 0, malformed = 0;
  // Each category is newest-first on the source. Bound crawling to three search pages and twelve details.
  for (const page of source.pages) {
    if (options.signal?.aborted) { failed++; break; }
    try { const html = await read(page); pagesRead++; listingLinks(html, page).forEach(url => links.add(url));
      if (!/\/jobs\/\d+|0 (?:results|jobs)|no (?:jobs|results|matching)/i.test(html)) malformed++;
    } catch (error) { failed++; if (error.status === 429 || error.status === 503) break; }
  }
  if (!pagesRead || malformed === pagesRead) throw new Error('Public listings could not be read');
  for (const url of [...links].slice(0, 12)) {
    if (options.signal?.aborted) { failed++; break; }
    try {
      const html = await read(url), items = structuredJobs(html);
      if (!items.length) { failed++; continue; }
      items.map(j => fromStructured(j, source, url)).filter(Boolean).forEach(j => jobs.push(j));
    } catch (error) { failed++; if (error.status === 429 || error.status === 503) break; }
  }
  return { jobs, partial: failed > 0 || malformed > 0 || links.size > 12, note: 'Newest category pages; up to 12 relevant posting details per check.' };
}
export async function greenhouse(source, options = {}) {
  const base = `https://boards-api.greenhouse.io/v1/boards/${source.id}/jobs`;
  const data = JSON.parse(await request(`${base}`, options));
  if (!Array.isArray(data.jobs)) throw new Error('Unexpected job board response');
  const candidates = data.jobs.filter(j => roleType(j.title) && j.internal_job_id !== null)
    .filter(j => !j.updated_at || Date.parse(j.updated_at) >= (options.now || Date.now()) - 30 * DAY)
    .filter(j => usLocation(j.location?.name || ''))
    .sort((a, b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0));
  const jobs = []; let failed = 0;
  for (const listing of candidates.slice(0, 24)) {
    if (options.signal?.aborted) { failed++; break; }
    try {
      // The list endpoint does not provide first_published. Retrieve the original date and deadline.
      const j = JSON.parse(await request(`${base}/${encodeURIComponent(listing.id)}?pay_transparency=true`, options));
      if (!j.first_published) { failed++; continue; }
      const location = j.location?.name || listing.location?.name || '';
      const pay = j.pay_input_ranges?.[0];
      const salary = pay ? `${pay.currency_type} ${(pay.min_cents / 100).toLocaleString('en-US')}–${(pay.max_cents / 100).toLocaleString('en-US')}${pay.title ? ` (${plain(pay.title)})` : ''}` : salaryText(null, plain(j.content));
      jobs.push({ id: j.requisition_id || j.id, title: j.title, description: plain(plain(j.content)), company: source.name, sector: source.sector, location, mode: workMode(location), postedAt: j.first_published, closesAt: j.application_deadline, url: safeURL(j.absolute_url), salary });
    } catch (error) { failed++; if (error.status === 429 || error.status === 503) break; }
  }
  return { jobs, partial: failed > 0 || candidates.length > 24, note: 'Public employer job board; up to 24 recently updated leadership postings checked for original dates and deadlines.' };
}
export function usLocation(location = '', countries = []) {
  if (countries.length) return countries.some(c => /^(US|USA|United States(?: of America)?)$/i.test(c));
  if (/\b(United States|USA|US)\b/.test(location)) return true;
  return !/\b(India|Bengaluru|Bangalore|Hyderabad|Israel|Tel Aviv|London|UK|United Kingdom|Germany|Canada|Toronto|Dublin|Singapore|Australia|Brazil|Colombia|Estonia|Ireland|Poland|Spain|France|Paris|Portugal|Netherlands|Mexico|Romania|Japan|EMEA|APAC|LATAM)\b/i.test(location);
}
export function fromAshby(j, source) {
  if (j.isListed !== true || !roleType(j.title)) return null;
  const countries = [j.address?.postalAddress?.addressCountry, ...(j.secondaryLocations || []).map(l => l.address?.addressCountry)].filter(Boolean);
  const location = [j.location, ...(j.secondaryLocations || []).map(l => l.location)].filter(Boolean).join(' · ');
  if (!usLocation(location, countries)) return null;
  return { id: j.jobUrl, sourceId: source.id, company: source.name, sector: source.sector, title: j.title, description: j.descriptionPlain || j.descriptionHtml,
    location, mode: workMode(j.workplaceType || (j.isRemote ? 'Remote' : '')), postedAt: j.publishedAt, dateLabel: 'Published / reposted',
    salary: j.compensation?.scrapeableCompensationSalarySummary || salaryText(null, j.descriptionPlain), url: safeURL(j.jobUrl) };
}
export async function ashby(source, options = {}) {
  const data = JSON.parse(await request(`https://api.ashbyhq.com/posting-api/job-board/${source.id}?includeCompensation=true`, options));
  if (!Array.isArray(data.jobs)) throw new Error('Unexpected Ashby response');
  const jobs = data.jobs.map(j => fromAshby(j, source)).filter(Boolean);
  return { jobs, partial: jobs.some(j => !j.postedAt), note: 'All public listings scanned. Dates are the last publication/republication date, not necessarily the original opening date.' };
}
export async function lever(source, options = {}) {
  const candidates = []; let capped = false;
  for (let skip = 0; skip < 2000; skip += 100) {
    const rows = JSON.parse(await request(`https://api.lever.co/v0/postings/${source.id}?mode=json&limit=100&skip=${skip}`, options));
    if (!Array.isArray(rows)) throw new Error('Unexpected Lever response');
    candidates.push(...rows.filter(j => roleType(j.text) && usLocation(j.categories?.location)));
    if (rows.length < 100) break;
    if (skip === 1900) capped = true;
  }
  const policyCache = options.policyCache || new Map();
  const origin = 'https://jobs.lever.co';
  if (!policyCache.has(origin)) policyCache.set(origin, request(`${origin}/robots.txt`, options).catch(e => { if (e.status === 404) return ''; throw e; }));
  const robots = await policyCache.get(origin);
  const jobs = []; let failed = 0;
  for (const j of candidates.slice(0, 24)) {
    if (options.signal?.aborted) { failed++; break; }
    try {
      const url = new URL(j.hostedUrl);
      if (url.origin !== origin || !url.pathname.startsWith(`/${source.id}/`) || !robotsAllowed(robots, url.pathname)) { failed++; continue; }
      const html = await request(url.href, { ...options, interval: 1100, allowPath: path => robotsAllowed(robots, path) });
      const structured = structuredJobs(html).find(s => s.datePosted);
      if (!structured) { failed++; continue; }
      const converted = fromStructured(structured, source, url.href);
      if (!converted) continue;
      jobs.push({ ...converted, id: j.id, sourceId: source.id, title: j.text,
        description: [j.descriptionPlain || j.description, ...(j.lists || []).map(l => `${l.text} ${l.content}`), j.additionalPlain || j.additional].join(' '),
        location: converted.location || j.categories?.location, mode: workMode(j.workplaceType || j.categories?.location),
        salary: converted.salary || (j.salaryRange ? `${j.salaryRange.currency} ${j.salaryRange.min}–${j.salaryRange.max} / ${j.salaryRange.interval}` : null) });
    } catch (error) { failed++; if (error.status === 429 || error.status === 503) break; }
  }
  return { jobs, partial: capped || failed > 0 || candidates.length > 24, note: 'Public API listings with posting dates checked on employer detail pages. Undated and unreadable details are excluded.' };
}
export function fromFederal(d) {
  const details = d.UserArea?.Details || {}, pay = d.PositionRemuneration?.[0];
  const description = [d.QualificationSummary, details.JobSummary, details.MajorDuties, details.Education, details.Requirements, details.Evaluations].flat().filter(Boolean).join(' ');
  return { id: d.PositionID, title: d.PositionTitle, company: d.OrganizationName || d.DepartmentName, sector: 'federal', description,
    location: d.PositionLocationDisplay, mode: details.RemoteIndicator === true || details.RemoteIndicator === 'True' ? 'remote' : 'unknown',
    salary: pay ? `USD ${Number(pay.MinimumRange).toLocaleString('en-US')}–${Number(pay.MaximumRange).toLocaleString('en-US')} / ${pay.Description || pay.RateIntervalCode || 'year'}` : null,
    postedAt: d.PublicationStartDate, closesAt: d.ApplicationCloseDate?.length === 10 ? `${d.ApplicationCloseDate}T23:59:59-12:00` : d.ApplicationCloseDate, url: d.PositionURI };
}
async function federal(source, options) {
  const env = options.env || process.env;
  if (!env.USAJOBS_API_KEY || !env.USAJOBS_EMAIL) return { jobs: [], setup: true, note: 'Federal feed is not connected yet. Browse USAJOBS directly below.' };
  const jobs = []; let partial = false;
  // 2210 covers IT; 0340 adds program management. Public hiring path avoids internal-only announcements.
  for (let page = 1; page <= 3; page++) {
    const data = JSON.parse(await request(`https://data.usajobs.gov/api/search?JobCategoryCode=2210;0340&HiringPath=public&DatePosted=30&ResultsPerPage=500&SortField=opendate&SortDirection=desc&Fields=Full&Page=${page}`, { ...options, headers: { 'User-Agent': env.USAJOBS_EMAIL, 'Authorization-Key': env.USAJOBS_API_KEY } }));
    if (!Array.isArray(data.SearchResult?.SearchResultItems)) throw new Error('Unexpected USAJOBS response');
    const rows = data.SearchResult.SearchResultItems;
    jobs.push(...rows.map(item => fromFederal(item.MatchedObjectDescriptor)));
    const total = Number(data.SearchResult.SearchResultCountAll);
    if (page * 500 >= total || rows.length < 500) break;
    if (page === 3) partial = true;
    await pause(1100);
  }
  return { jobs, partial, note: 'Public federal IT and program management announcements (series 2210 and 0340). Check specialized experience, citizenship, and eligibility.' };
}
export const SOURCE_GROUPS = ['priority', 'civic', 'federal-delivery', 'insurance', 'platforms', 'finance', 'software'];
export async function collectSources(options = {}) {
  options = { requestTimes: new Map(), policyCache: new Map(), ...options };
  const definitions = options.group ? SOURCE_DEFINITIONS.filter(s => (s.group || 'priority') === options.group) : SOURCE_DEFINITIONS;
  const runners = { careers, greenhouse, federal, ashby, lever };
  const results = await Promise.allSettled(definitions.map(async source => {
    const result = await runners[source.kind](source, { ...options, signal: AbortSignal.timeout(48_000) });
    return { ...result, source };
  }));
  const jobs = [], sources = results.map((result, i) => {
    const source = definitions[i];
    if (result.status === 'rejected') return { sector: source.sector, kind: source.kind, id: source.id, name: source.name, url: source.url, status: 'unavailable', note: source.id === 'usajobs' && [401, 403].includes(result.reason?.status) ? 'USAJOBS rejected the credentials. Check the key and registered email in Vercel, then deploy again.' : 'Could not read this source within its crawl policy and time budget. Open its career page directly.' };
    const value = result.value; jobs.push(...value.jobs.map(j => ({ ...j, sourceId: source.id })));
    return { sector: source.sector, kind: source.kind, id: source.id, name: source.name, url: source.url, status: value.setup ? 'setup' : value.partial ? 'partial' : 'ok', note: value.note, fetched: value.jobs.length };
  });
  return { jobs, sources };
}
