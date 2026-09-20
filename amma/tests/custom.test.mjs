import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSite, boardSite, readSites } from '../custom-sites.mjs';
import handler, { customFeed } from '../../api/amma/custom.mjs';

test('career links normalize supported board and posting URLs; other sites remain link-only', () => {
  assert.deepEqual(parseSite('https://boards.greenhouse.io/acme/jobs/123?gh_src=x'), boardSite('greenhouse', 'acme'));
  assert.equal(parseSite('https://jobs.lever.co/acme/123').url, 'https://jobs.lever.co/acme');
  assert.equal(parseSite('https://jobs.ashbyhq.com/acme/123').provider, 'ashby');
  assert.equal(parseSite('https://careers.example.com/jobs').provider, null);
  assert.equal(parseSite('https://jobs.lever.co.evil.example/acme').provider, null);
  for (const value of ['http://careers.example.com', 'https://user:secret@example.com', 'https://127.0.0.1', 'https://localhost', 'https://host.local', 'javascript:alert(1)', 'https://example.com:8080', 'https://jobs.lever.co/../../', 'https://jobs.ashbyhq.com/%2fsecret']) assert.throws(() => parseSite(value));
  for (const [provider, board] of [['__proto__','foo'],['https://localhost','foo'],['lever','../secret'],['ashby','foo?x=1'],['greenhouse','foo/bar']]) assert.throws(() => boardSite(provider, board));
});
test('saved sites revalidate URLs, deduplicate canonical boards and ignore forged provider fields', () => {
  const sites = readSites({ getItem: () => JSON.stringify([{ url: 'https://jobs.ashbyhq.com/acme', provider: 'http://localhost' }, { url: 'https://jobs.ashbyhq.com/acme/123' }, { url: 'javascript:alert(1)' }]) });
  assert.equal(sites.length, 1); assert.equal(sites[0].provider, 'ashby');
  assert.deepEqual(readSites({ getItem() { throw Error(); } }), []);
});
test('custom endpoint rejects arbitrary fetch targets and write requests', async () => {
  for (const [method, url, expected] of [
    ['POST', '/api/amma/custom?provider=ashby&board=foo', 405],
    ['GET', '/api/amma/custom?provider=https://localhost&board=foo', 400],
    ['GET', '/api/amma/custom?provider=lever&board=..', 400],
    ['GET', '/api/amma/custom?provider=lever&board=foo&url=https://localhost', 400],
    ['GET', '/api/amma/custom?provider=lever&board=foo&board=bar', 400],
  ]) {
    const res = { setHeader() {}, status(n) { this.code = n; return this; }, json(payload) { this.payload = payload; return this; } };
    await handler({ method, url }, res); assert.equal(res.code, expected);
  }
});
test('custom imports use fixed origins, rank real matches and cache concurrent visits', async () => {
  let calls = 0; const now = Date.now();
  const options = { now, throttle: false, fetcher: async url => {
    calls++; assert.equal(url, 'https://api.ashbyhq.com/posting-api/job-board/customtest?includeCompensation=true');
    return new Response(JSON.stringify({ jobs: [{ isListed: true, title: 'Engineering Manager', location: 'Remote, US', workplaceType: 'Remote', publishedAt: new Date(now - 1000).toISOString(), descriptionPlain: 'Lead a team of software engineers. Agile delivery and stakeholder roadmaps.', jobUrl: 'https://jobs.ashbyhq.com/customtest/123' }, { isListed: true, title: 'Junior Software Engineer' }] }));
  } };
  const [a,b] = await Promise.all([customFeed('ashby', 'customtest', options), customFeed('ashby', 'customtest', options)]);
  assert.equal(calls, 1); assert.deepEqual(a,b); assert.equal(a.jobs.length, 1); assert.equal(a.sources[0].status, 'ok'); assert.equal(a.jobs[0].sourceId, 'custom:ashby:customtest');
  await customFeed('ashby', 'customtest', options); assert.equal(calls, 1);
});
test('missing custom board is labeled unavailable and briefly cached', async () => {
  let calls = 0; const options = { throttle: false, fetcher: async () => { calls++; return new Response('', { status: 404 }); } };
  const result = await customFeed('greenhouse', 'missingcustomtest', options);
  assert.equal(result.sources[0].status, 'unavailable'); assert.equal(result.jobs.length, 0);
  await customFeed('greenhouse', 'missingcustomtest', options); assert.equal(calls, 1);
});
