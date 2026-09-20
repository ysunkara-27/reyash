import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY, matchJob, rankJobs, roleType, workMode, plain } from '../../lib/amma/match.mjs';
import { robotsAllowed, structuredJobs, listingLinks, fromStructured, fromFederal, greenhouse, collectSources } from '../../lib/amma/sources.mjs';
import handler from '../../api/amma/jobs.mjs';

const now = Date.parse('2026-09-19T16:00:00Z');
const job = (overrides = {}) => ({ id: '123', title: 'Senior Software Engineering Manager', company: 'Example', sector: 'private', location: 'Remote, US', mode: 'remote', postedAt: '2026-09-18T10:00:00Z', description: 'Lead a team of software engineers. Own Agile delivery, stakeholder roadmaps, application operations and production support.', url: 'https://example.com/jobs/123', ...overrides });

test('recognizes requested leadership families, including federal supervisory IT', () => {
  for (const title of ['IT Manager', 'Technical IT Manager', 'Engineering Manager', 'Software Engineering Manager', 'Technical Program Manager', 'Program Manager', 'Project Manager', 'Scrum Master', 'Agile Coach', 'Supervisory IT Specialist']) assert.ok(roleType(title), title);
  for (const title of ['Senior Software Engineer', 'Junior Project Manager', 'Project Coordinator', 'Management Trainee', 'Assistant Program Manager']) assert.equal(roleType(title), null, title);
});
test('excludes old, expired, undated, future, junior, nontechnical, and weak listings', () => {
  for (const overrides of [{ postedAt: new Date(now - 31 * DAY).toISOString() }, { closesAt: '2026-09-17' }, { postedAt: null }, { postedAt: 'bad date' }, { postedAt: '2026-10-19' }, { title: 'Junior IT Manager' }, { title: 'Construction Project Manager' }, { description: 'Administrative responsibilities.' }, { description: 'Software development.' }, { url: 'javascript:alert(1)' }]) assert.equal(matchJob(job(overrides), now), null, JSON.stringify(overrides));
  assert.equal(matchJob(job({ title: 'Program Manager', description: 'Lead a team of people. Own stakeholder roadmaps. Make it happen.' }), now), null);
});
test('match explanations are tied to resume evidence and eligibility is not assumed', () => {
  const result = matchJob(job({ description: job().description + ' PMP required. US citizenship and clearance required. Hands-on programming in Java required.' }), now);
  assert.equal(result.strength, 'Strong match');
  assert.match(result.reasons.join(' '), /20\+/);
  assert.equal(result.considerations.length, 3);
  assert.equal('description' in result, false);
});
test('priority beats recency across groups; date beats score inside groups; deduplicates', () => {
  const items = [job({ id: 'private', url: 'https://example.com/private' }), job({ company: 'Leidos', sector: 'contractor', url: 'https://example.com/contractor' }), job({ company: 'Agency', sector: 'federal', url: 'https://example.com/federal' }), job({ company: 'Progressive', postedAt: '2026-09-01', url: 'https://example.com/progressive' })];
  const sorted = rankJobs([...items, { ...items[0], url: `${items[0].url}?tracking=duplicate` }], now);
  assert.deepEqual(sorted.map(j => j.company), ['Progressive', 'Agency', 'Leidos', 'Example']);
  const newer = job({ id: 'newer', title: 'IT Manager', postedAt: '2026-09-19', url: 'https://example.com/newer' });
  assert.equal(rankJobs([items[0], newer], now)[0].id, 'newer');
});
test('does not mislabel hybrid or no-remote as remote', () => {
  assert.equal(workMode('Hybrid Remote'), 'hybrid');
  assert.equal(workMode('No Remote'), 'onsite');
  assert.equal(workMode('OnSite'), 'onsite');
  assert.equal(roleType('Senior Manager, Project Management'), 'project');
  assert.equal(workMode('Remote — US'), 'remote');
  assert.equal(workMode('Washington, DC'), 'unknown');
});
test('keeps distinct jobs identified by query parameters on custom career pages', () => {
  const first = job({ id: 'one', title: 'IT Manager', url: 'https://example.com/careers?gh_jid=1' });
  const second = job({ id: 'two', title: 'Technical Program Manager', url: 'https://example.com/careers?gh_jid=2' });
  assert.equal(rankJobs([first, second], now).length, 2);
});
test('robots rules honor specificity, agent groups, wildcard and crawl delay', () => {
  const policy = 'User-agent: *\nDisallow: /jobs/\nAllow: /jobs/public/\nUser-agent: Other\nDisallow: /';
  assert.equal(robotsAllowed(policy, '/jobs/12'), false);
  assert.equal(robotsAllowed(policy, '/jobs/public/12'), true);
  assert.equal(robotsAllowed(policy, '/search/jobs'), true);
  assert.equal(robotsAllowed('User-agent: *\nDisallow: /*?secret=*', '/jobs?secret=123'), false);
  assert.equal(robotsAllowed('User-agent: *\nCrawl-delay: 10', '/'), false);
  assert.equal(robotsAllowed('User-agent: *\nDisallow: /\nUser-agent: AmmaJobs\nAllow: /', '/jobs'), true);
});
test('extracts only same-origin matching detail links and JobPosting JSON-LD', () => {
  const html = '<a href="/jobs/123-it-manager">IT Manager</a><a href="https://evil.example/jobs/12">IT Manager</a><a href="/jobs/456">Junior IT Manager</a><script type="application/ld+json">{"@graph":[{"@type":"JobPosting","title":"IT Manager"}]}</script><script type="application/ld+json">invalid</script>';
  assert.deepEqual(listingLinks(html, 'https://careers.example.com/search'), ['https://careers.example.com/jobs/123-it-manager']);
  assert.equal(structuredJobs(html).length, 1);
  assert.equal(plain('IT &amp; Software &#8212; Manager'), 'IT & Software — Manager');
});
test('structured data preserves dates, salaries, US location, explicit remote, and expiry', () => {
  const source = { name: 'Progressive', sector: 'private' };
  const data = { title: 'IT Manager', datePosted: '2026-09-18', validThrough: '2026-09-30', jobLocationType: 'TELECOMMUTE', jobLocation: { address: { addressCountry: 'US', addressRegion: 'VA' } }, baseSalary: { currency: 'USD', value: { minValue: 150000, maxValue: 190000, unitText: 'YEAR' } } };
  const result = fromStructured(data, source, 'https://example.com/jobs/1');
  assert.equal(result.mode, 'remote'); assert.equal(result.postedAt, data.datePosted); assert.equal(result.closesAt, data.validThrough); assert.equal(result.salary, 'USD 150,000–190,000 / year');
  assert.equal(fromStructured({ ...data, jobLocation: { address: { addressCountry: 'UK' } } }, source, 'https://example.com/jobs/1'), null);
});
test('federal converter treats telework eligibility separately from fully remote', () => {
  const result = fromFederal({ PositionID: 'abc', PositionTitle: 'Supervisory IT Specialist', PositionURI: 'https://www.usajobs.gov/job/1', PublicationStartDate: '2026-09-18', ApplicationCloseDate: '2026-09-30', UserArea: { Details: { TeleworkEligible: true, JobSummary: 'Lead software teams', MajorDuties: ['Agile delivery'] } } });
  assert.equal(result.mode, 'unknown'); assert.equal(result.sector, 'federal'); assert.match(result.description, /Agile delivery/); assert.match(result.closesAt, /23:59:59/);
});
test('Greenhouse retrieves original date and deadline from detail, not updated_at', async () => {
  const paths = [], listing = { id: 123, internal_job_id: 456, title: 'IT Manager', location: { name: 'Remote, US' }, updated_at: '2026-09-18' };
  const result = await greenhouse({ id: 'example', name: 'Example', sector: 'private' }, { now, throttle: false, fetcher: async url => {
    paths.push(url);
    return new Response(JSON.stringify(url.includes('/123?') ? { ...listing, first_published: '2026-08-01', application_deadline: '2026-09-01', absolute_url: 'https://example.com/jobs/123', content: job().description } : { jobs: [listing] }));
  } });
  assert.equal(paths.length, 2); assert.equal(result.jobs[0].postedAt, '2026-08-01'); assert.equal(result.jobs[0].closesAt, '2026-09-01');
  assert.equal(rankJobs(result.jobs, now).length, 0);
});
test('one failed source does not prevent other sources or disclose secrets', async () => {
  const result = await collectSources({ env: {}, throttle: false, fetcher: async url => {
    if (url.includes('greenhouse.io')) return new Response('{"jobs":[]}');
    return new Response('rate limited', { status: 429 });
  } });
  assert.ok(result.sources.some(s => s.status === 'ok'));
  assert.ok(result.sources.some(s => s.status === 'unavailable'));
  assert.equal(result.sources.find(s => s.id === 'usajobs').status, 'setup');
});
test('Greenhouse stops detail requests on rate limiting', async () => {
  let calls = 0;
  const result = await greenhouse({ id: 'example', name: 'Example', sector: 'private' }, { now, throttle: false, fetcher: async () => {
    calls++;
    return calls === 1 ? new Response(JSON.stringify({ jobs: [1, 2, 3].map(id => ({ id, title: 'IT Manager', updated_at: '2026-09-18' })) })) : new Response('', { status: 429 });
  } });
  assert.equal(calls, 2); assert.equal(result.partial, true);
});
test('already-aborted source budget does not make another network request', async () => {
  const controller = new AbortController(); controller.abort();
  let called = false;
  await assert.rejects(greenhouse({ id: 'example' }, { signal: controller.signal, fetcher: async () => { called = true; } }));
  assert.equal(called, false);
});
test('complete source failures are cached briefly to avoid repeated outage traffic', async () => {
  const { getFeed } = await import('../../api/amma/jobs.mjs?test=outage');
  let calls = 0;
  const collect = async () => { calls++; return { jobs: [], sources: [{ status: 'unavailable' }] }; };
  await getFeed(collect, now); await getFeed(collect, now + 60_000); assert.equal(calls, 1);
  await getFeed(collect, now + 301_000); assert.equal(calls, 2);
});
test('feed cache coalesces parallel visits and refreshes after TTL', async () => {
  const { getFeed } = await import(`../../api/amma/jobs.mjs?test=cache`);
  let calls = 0;
  const collect = async () => { calls++; return { jobs: [job()], sources: [{ status: 'ok' }] }; };
  const [first, second] = await Promise.all([getFeed(collect, now), getFeed(collect, now)]);
  assert.equal(calls, 1); assert.equal(first, second);
  await getFeed(collect, now + DAY / 24); assert.equal(calls, 1);
  await getFeed(collect, now + DAY); assert.equal(calls, 2);
});
test('HTTP endpoint disallows writes and canonicalizes query strings before fetching', async () => {
  const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(v) { this.body = v; return this; }, end() { return this; } });
  const post = response(); await handler({ method: 'POST', url: '/api/amma/jobs' }, post); assert.equal(post.code, 405);
  const query = response(); await handler({ method: 'GET', url: '/api/amma/jobs?nocache=1' }, query); assert.equal(query.code, 307); assert.equal(query.headers.Location, '/api/amma/jobs');
});

test('expanded registry includes 26 new automated portals in disjoint bounded groups', async () => {
  const {SOURCE_DEFINITIONS,SOURCE_GROUPS}=await import('../../lib/amma/sources.mjs');
  assert.equal(SOURCE_DEFINITIONS.length,34);
  assert.equal(SOURCE_DEFINITIONS.filter(s=>s.group).length,26);
  assert.equal(new Set(SOURCE_DEFINITIONS.map(s=>s.id)).size,34);
  for(const s of SOURCE_DEFINITIONS) assert.ok(SOURCE_GROUPS.includes(s.group||'priority'));
  const result=await collectSources({group:'software',throttle:false,fetcher:async url=>{
    assert.match(url,/api\.ashbyhq\.com/);return new Response('{"jobs":[]}');
  }});
  assert.equal(result.sources.length,4);assert.ok(result.sources.every(s=>s.status==='ok'));
});
test('Ashby respects public visibility, country, compensation and republication semantics', async () => {
  const {fromAshby}=await import('../../lib/amma/sources.mjs');
  const source={id:'example',name:'Example',sector:'private'};
  const raw={isListed:true,title:'Engineering Manager',location:'Remote US',workplaceType:'Hybrid',publishedAt:'2026-09-18',descriptionPlain:job().description,jobUrl:'https://jobs.ashbyhq.com/example/1',address:{postalAddress:{addressCountry:'USA'}},compensation:{scrapeableCompensationSalarySummary:'$150K - $190K'}};
  const j=fromAshby(raw,source);assert.equal(j.mode,'hybrid');assert.equal(j.dateLabel,'Published / reposted');assert.equal(j.salary,'$150K - $190K');
  assert.equal(fromAshby({...raw,isListed:false},source),null);
  assert.equal(fromAshby({...raw,address:{postalAddress:{addressCountry:'GB'}}},source),null);
});
test('Lever reads public API plus real detail date, not the crawl date', async () => {
  const {lever}=await import('../../lib/amma/sources.mjs');
  const result=await lever({id:'example',name:'Example',sector:'contractor'},{throttle:false,fetcher:async url=>{
    if(url.includes('api.lever')) return new Response(JSON.stringify([{id:'1',text:'IT Manager',hostedUrl:'https://jobs.lever.co/example/1',categories:{location:'Virginia, US'},workplaceType:'remote',descriptionPlain:job().description}]));
    if(url.endsWith('robots.txt')) return new Response('User-agent: *\nAllow: /');
    return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'JobPosting',title:'IT Manager',datePosted:'2026-09-18',description:job().description,jobLocation:{address:{addressCountry:'US'}}})+'</script>');
  }});
  assert.equal(result.jobs.length,1);assert.equal(result.jobs[0].postedAt,'2026-09-18');assert.equal(result.jobs[0].mode,'remote');
});
test('group caches are independent and unknown groups cannot trigger arbitrary URLs', async () => {
  const {getFeed}=await import('../../api/amma/jobs.mjs?test=groups');let calls=0;
  const collect=async ({group})=>{calls++;return {jobs:[],sources:[{id:group,status:'ok'}]};};
  const a=await getFeed(collect,now,'priority'); const b=await getFeed(collect,now,'software');
  assert.equal(calls,2);assert.notEqual(a.sources[0].id,b.sources[0].id);
  const res={setHeader(){},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};
  await handler({method:'GET',url:'/api/amma/jobs?group=https://evil.example'},res);assert.equal(res.code,400);
});
test('active-clearance requirements are explicit, not inferred from citizenship or eligibility', () => {
  assert.equal(matchJob(job({description:job().description+' Must have active TS/SCI clearance.'}),now).requiresActiveClearance,true);
  assert.equal(matchJob(job({description:job().description+' Ability to obtain a clearance.'}),now).requiresActiveClearance,false);
});
test('keyword search supports terms in descriptions and comma alternatives without regex execution', async () => {
  const {keywordMatch}=await import('../preferences.mjs');
  assert.equal(keywordMatch({title:'IT Manager',searchText:'azure migration Scrum'},'Azure Scrum'),true);
  assert.equal(keywordMatch({title:'IT Manager',searchText:'azure'},'Azure, Jira'),true);
  assert.equal(keywordMatch({title:'IT Manager',searchText:'azure'},'Azure Jira'),false);
  assert.equal(keywordMatch({title:'IT Manager'},'.*'),false);
});
