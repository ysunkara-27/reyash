import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as preferences from '../preferences.mjs';
import * as portals from '../portals.mjs';
import * as customSites from '../custom-sites.mjs';
import { rankJobs } from '../../lib/amma/match.mjs';

// Optional development-only DOM implementation; no runtime dependency is added.
const require = createRequire(import.meta.url);
let parseHTML;
try { ({ parseHTML } = require(process.env.AMMA_DOM_MODULE || 'linkedom')); } catch { /* Clearly skip if the test-only tool isn't installed. */ }
const uiTest = (name, fn) => test(name, { skip: !parseHTML && 'Set AMMA_DOM_MODULE to an installed linkedom module to run DOM tests.' }, fn);
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const script = (await readFile(new URL('../app.mjs', import.meta.url), 'utf8')).replace(/^import .*;$/gm, '');
const now = Date.now();
function payload() {
  return { checkedAt: new Date(now).toISOString(), sources: [{ id: 'progressive', name: 'Progressive', status: 'ok', url: 'https://careers.progressive.com/', note: 'Checked' }, { id: 'usajobs', name: 'USAJOBS', status: 'setup', url: 'https://www.usajobs.gov/', note: 'Not connected' }], jobs: rankJobs([
    { id: '1', company: 'Progressive', sector: 'private', title: 'IT Manager', mode: 'remote', location: 'Remote, US', postedAt: new Date(now - 1000).toISOString(), url: 'https://example.com/jobs/1', description: 'Lead a team of software engineers. Agile delivery and stakeholder roadmaps.' },
    { id: '2', company: 'Contractor', sector: 'contractor', title: 'Technical Program Manager', mode: 'hybrid', location: 'Arlington, VA', postedAt: new Date(now - 5 * 86400000).toISOString(), url: 'https://example.com/jobs/2', description: 'Lead a team of software engineers. Agile delivery and stakeholder roadmaps.' },
  ], now) };
}
async function app({ data = payload(), fail = false, saved, storageEntries, fetcher, storageFails = false } = {}) {
  const { document, window } = parseHTML(html);
  const form = document.querySelector('#filters');
  form.reset = () => { document.querySelector('#query').value = '';  for (const s of form.querySelectorAll('select')) { for (const o of s.querySelectorAll('option')) o.selected = false; s.querySelector('option').selected = true; } };
  form.reset();
  const storage = new Map(storageEntries || (saved ? [['amma-feed-v2', JSON.stringify(saved)]] : []));
  const localStorage = { getItem(k) { if (storageFails) throw Error(); return storage.get(k); }, setItem(k, v) { if (storageFails) throw Error(); storage.set(k, v); } };
  const context = vm.createContext({ ...preferences, ...portals, ...customSites, document, console, URL, Date, Intl, AbortSignal, localStorage,
    FormData: class { constructor(f) { this.entries = [...f.querySelectorAll('select,input')].map(s => [s.name, s.value]); } [Symbol.iterator]() { return this.entries[Symbol.iterator](); } },
    fetch: fetcher || (async () => { if (fail) throw Error('offline'); return { ok: true, json: async () => data }; }), setInterval() {},
  });
  vm.runInContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return { document, storage, select(name, value) { const select = form.querySelector(`[name="${name}"]`); for (const o of select.querySelectorAll('option')) o.selected = false; select.querySelector(`option[value="${value}"]`).selected = true; form.dispatchEvent(new window.Event('change')); } };
}
uiTest('renders useful fields, first priority and explicit partial-source notice', async () => {
  const { document } = await app();
  assert.equal(document.querySelectorAll('.job').length, 2);
  assert.match(document.querySelector('.job').className, /progressive/);
  assert.match(document.querySelector('#notice').textContent, /need attention/);
  assert.equal(document.querySelector('#feed').getAttribute('aria-busy'), 'false');
  assert.match(document.querySelector('.why').textContent, /20\+/);
  assert.equal(document.querySelector('.apply').getAttribute('target'), '_blank');
});
uiTest('role, sector, mode and recency filters intersect; clear restores the feed', async () => {
  const { document, select } = await app();
  select('sector', 'contractor'); assert.equal(document.querySelectorAll('.job').length, 1);
  select('role', 'program'); assert.equal(document.querySelectorAll('.job').length, 1);
  select('mode', 'remote'); assert.equal(document.querySelectorAll('.job').length, 0);
  assert.ok(document.querySelector('#empty-reset'));
  document.querySelector('#empty-reset').click(); assert.equal(document.querySelectorAll('.job').length, 2);
  select('days', '3'); assert.equal(document.querySelectorAll('.job').length, 1);
  select('sector', 'progressive'); assert.equal(document.querySelectorAll('.job').length, 1);
});
uiTest('escapes job and source text instead of interpreting external markup', async () => {
  const data = payload();
  data.jobs[0].title = '<img src=x onerror=alert(1)> IT Manager';
  data.jobs[0].reasons = ['<script>alert(1)</script>'];
  data.sources[0].name = '<svg onload=alert(1)>';
  const { document } = await app({ data });
  assert.equal(document.querySelectorAll('#feed img,#feed script,#sources-list svg').length, 0);
  assert.match(document.querySelector('.job h3').textContent, /<img/);
});
uiTest('offline cached results are labeled and expired jobs disappear immediately', async () => {
  const saved = payload(); saved.checkedAt = new Date(now - 3600000).toISOString();
  saved.jobs[1].closesAt = new Date(now - 1000).toISOString();
  const { document } = await app({ saved, fail: true });
  assert.equal(document.querySelectorAll('.job').length, 1);
  assert.match(document.querySelector('#notice').textContent, /Showing saved results/);
});
uiTest('unavailable network never looks like a successful zero-match search', async () => {
  const { document } = await app({ fail: true });
  assert.match(document.querySelector('#notice').textContent, /connection problem/);
  assert.match(document.querySelector('#results-label').textContent, /could not be reached/);
  assert.equal(document.querySelector('#check').disabled, false);
});
uiTest('storage disabled still loads results; snapshots older than two days are not shown', async () => {
  const live = await app({ storageFails: true }); assert.equal(live.document.querySelectorAll('.job').length, 2);
  const saved = payload(); saved.checkedAt = new Date(now - 3 * 86400000).toISOString();
  const offline = await app({ saved, fail: true }); assert.equal(offline.document.querySelectorAll('.job').length, 0);
});
uiTest('Applied survives reload, can be undone, and View does not mark it applied', async () => {
  const first = await app();
  assert.equal(first.document.querySelector('.applied-toggle').getAttribute('aria-pressed'), 'false');
  first.document.querySelector('.applied-toggle').click();
  assert.equal(first.document.querySelector('.applied-toggle').getAttribute('aria-pressed'), 'true');
  const second = await app({ storageEntries: [...first.storage] });
  assert.equal(second.document.querySelector('.applied-toggle').textContent, '✓ Applied');
  second.select('status', 'unapplied'); assert.equal(second.document.querySelectorAll('.job').length, 1);
  second.select('status', 'applied'); assert.equal(second.document.querySelectorAll('.job').length, 1);
  second.document.querySelector('.applied-toggle').click(); assert.equal(second.document.querySelectorAll('.job').length, 0);
});
uiTest('Applied archive keeps closed jobs after they leave the live feed', async () => {
  const first = await app(); first.document.querySelector('.applied-toggle').click();
  const data = payload(); data.jobs = [];
  const second = await app({ data, storageEntries: [...first.storage] });
  second.select('status','applied'); assert.equal(second.document.querySelectorAll('.job').length,1);
});
uiTest('compact pagination shows 50 jobs and can reach every result', async () => {
  const data = payload(), template = data.jobs[0];
  data.jobs = Array.from({length: 121}, (_,i) => ({ ...template, id: String(i), title: `IT Manager ${i}`, url:`https://example.com/jobs/${i}` }));
  const {document} = await app({data});
  assert.equal(document.querySelectorAll('.job').length,50);
  document.querySelector('#next').click(); assert.match(document.querySelector('#page-label').textContent,/Page 2 of 3/);
  document.querySelector('#next').click(); assert.equal(document.querySelectorAll('.job').length,21);
  document.querySelector('#previous').click(); assert.equal(document.querySelectorAll('.job').length,50);
});
uiTest('keyword suggestions filter descriptions; active-clearance jobs require opt-in', async () => {
  const data = payload(); data.jobs[0].searchText += ' Azure'; data.jobs[1].requiresActiveClearance = true;
  const { document, select } = await app({data}); assert.equal(document.querySelectorAll('.job').length,1);
  select('eligibility','all'); assert.equal(document.querySelectorAll('.job').length,2);
  document.querySelector('[data-term="Azure"]').click(); assert.equal(document.querySelectorAll('.job').length,1);
});
uiTest('a failing extra source group preserves the successful priority feed', async () => {
  const data=payload(); data.groups=['priority','insurance'];
  const {document}=await app({fetcher:async url=>{if(url.includes('?'))throw Error('timeout');return {ok:true,json:async()=>data};}});
  assert.equal(document.querySelectorAll('.job').length,2); assert.match(document.querySelector('#notice').textContent,/could not refresh/);
});
uiTest('mobile filter control expands without resetting the selected filters', async () => {
  const { document, select } = await app();
  select('sector', 'progressive');
  const button = document.querySelector('#filter-toggle');
  button.click(); assert.equal(button.getAttribute('aria-expanded'), 'true'); assert.ok(document.querySelector('#filters').classList.contains('expanded'));
  button.click(); assert.equal(button.getAttribute('aria-expanded'), 'false'); assert.equal(document.querySelectorAll('.job').length, 1);
  assert.equal(document.querySelector('.brand-note').textContent, 'For your next chapter');
});
uiTest('custom career boards import, persist and remove without losing Applied history', async () => {
  let customCalls = 0;
  const custom = payload(); custom.jobs = [{ ...custom.jobs[0], id: 'custom-job', company: 'customtest', url: 'https://jobs.ashbyhq.com/customtest/123' }];
  custom.sources = [{ id: 'custom:ashby:customtest', name: 'customtest', status: 'ok', url: 'https://jobs.ashbyhq.com/customtest', note: 'Checked' }];
  const fetcher = async url => { if (url.startsWith('/api/amma/custom')) customCalls++; return { ok: true, json: async () => url.startsWith('/api/amma/custom') ? custom : payload() }; };
  const first = await app({ fetcher });
  first.document.querySelector('#site-url').value = 'https://jobs.ashbyhq.com/customtest/123';
  first.document.querySelector('#site-form').dispatchEvent(new first.document.defaultView.Event('submit', { cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(customCalls, 1); assert.equal(first.document.querySelectorAll('.job').length, 3);
  assert.match(first.document.querySelector('#saved-sites').textContent, /Automatic import · 1 matches/);
  [...first.document.querySelectorAll('.applied-toggle')].find(b => b.getAttribute('data-job-key').includes('custom-job')).click();
  const second = await app({ storageEntries: [...first.storage], fetcher });
  assert.equal(second.document.querySelectorAll('.saved-site').length, 1);
  second.document.querySelector('.remove-site').click();
  assert.equal(second.document.querySelectorAll('.job').length, 2);
  second.select('status', 'applied'); assert.equal(second.document.querySelectorAll('.job').length, 1);
  assert.match(second.document.querySelector('.job').textContent, /customtest/);
  assert.equal(JSON.parse(second.storage.get(customSites.SITES_KEY)).length, 0);
});
uiTest('unsupported sites save as links without fetching them; duplicate and unsafe URLs explain the problem', async () => {
  let calls = 0; const { document } = await app({ fetcher: async () => { calls++; return { ok: true, json: async () => payload() }; } });
  const add = async url => { document.querySelector('#site-url').value = url; document.querySelector('#site-form').dispatchEvent(new document.defaultView.Event('submit', { cancelable: true })); await new Promise(resolve => setImmediate(resolve)); };
  await add('https://careers.example.com/jobs'); assert.equal(calls, 1); assert.match(document.querySelector('#saved-sites').textContent, /Direct link · no automatic import/);
  await add('https://careers.example.com/jobs'); assert.match(document.querySelector('#site-notice').textContent, /already saved/);
  await add('http://localhost'); assert.match(document.querySelector('#site-notice').textContent, /HTTPS/);
  assert.equal(document.querySelectorAll('.saved-site').length, 1);
});
