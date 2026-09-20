import { STATUS_KEY, jobKey, readApplied, toggleApplied, keywordMatch } from './preferences.mjs';
import { PORTALS, SUGGESTED_TERMS } from './portals.mjs';
import { SITES_KEY, MAX_SITES, parseSite, readSites } from './custom-sites.mjs';
const $ = selector => document.querySelector(selector);
const DAY = 86_400_000, CACHE_KEY = 'amma-feed-v2', PAGE_SIZE = 50;
let feed, loading = false, lastAttempt = 0, offline = false, page = 1, applied = {};
try { applied = readApplied(localStorage); } catch { /* Storage optional. */ }
const batches = new Map(), sitePending = new Map();
let sites = [];
try { sites = readSites(localStorage); } catch { /* Storage optional. */ }
const modeNames = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site', unknown: 'Setup not specified' };
const sectorNames = { federal: 'Federal', contractor: 'Federal contractor' };
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function safeLink(value) { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? escape(u.href) : '#'; } catch { return '#'; } }
const date = value => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
function validJob(j) { return j && typeof j.title === 'string' && typeof j.company === 'string' && safeLink(j.url) !== '#' && Number.isFinite(Date.parse(j.postedAt)) && Array.isArray(j.reasons) && Array.isArray(j.considerations); }
function alive(j) { const now = Date.now(); return now - Date.parse(j.postedAt) <= 30 * DAY && Date.parse(j.postedAt) <= now + DAY && (!j.closesAt || Date.parse(j.closesAt) >= now); }
function card(j) {
  const progressive = j.company === 'Progressive', done = applied[jobKey(j)];
  return `<article class="job ${progressive ? 'progressive' : ''} ${done ? 'is-applied' : ''}"><div class="job-main"><div class="job-top"><span class="company">${escape(j.company)}</span>${progressive ? '<span class="badge blue">First priority</span>' : ''}${sectorNames[j.sector] ? `<span class="badge">${sectorNames[j.sector]}</span>` : ''}<span class="strength">${escape(j.strength)}</span></div>
    <h3><a href="${safeLink(j.url)}" target="_blank" rel="noopener noreferrer">${escape(j.title)}</a></h3>
    <div class="job-meta"><span>${escape(j.location)}</span><span>${modeNames[j.mode] || modeNames.unknown}</span>${j.salary ? `<span class="salary">${escape(j.salary)}</span>` : ''}<span>${escape(j.dateLabel || 'Posted')} ${date(j.postedAt)}</span>${j.requiresActiveClearance ? '<span class="requirement">Active clearance required</span>' : ''}${!alive(j) ? '<span>Older / no longer in current feed</span>' : ''}</div>
    <details class="match-detail"><summary>${escape(j.reasons[0] || 'See resume match')}</summary><div class="why"><strong>WHY IT FITS</strong><p>${j.reasons.map(escape).join(' ')}</p></div>${j.considerations.length ? `<p class="considerations">${j.considerations.map(escape).join(' ')}</p>` : ''}${j.closesAt ? `<p class="posted">Closes ${date(j.closesAt)}</p>` : ''}</details></div>
    <div class="job-actions"><a class="apply" href="${safeLink(j.url)}" target="_blank" rel="noopener noreferrer" aria-label="View ${escape(j.title)} at ${escape(j.company)} (opens in a new tab)">View job ↗</a><button type="button" class="applied-toggle" data-job-key="${escape(jobKey(j))}" aria-pressed="${Boolean(done)}" aria-label="${done ? 'Mark not applied' : 'Mark applied'}: ${escape(j.title)}">${done ? '✓ Applied' : 'Not applied'}</button>${done ? `<span class="posted">${date(done.appliedAt)}</span>` : ''}</div></article>`;
}
function jobsForView(status) {
  const live = (feed?.jobs || []).filter(validJob).filter(alive);
  if (status !== 'applied') return live;
  const byKey = new Map(live.map(j => [jobKey(j), j]));
  return Object.values(applied).map(v => byKey.get(jobKey(v.job)) || v.job).filter(validJob).sort((a,b) => Date.parse(applied[jobKey(b)].appliedAt) - Date.parse(applied[jobKey(a)].appliedAt));
}
function render() {
  if (!feed && !Object.keys(applied).length) return;
  const f = Object.fromEntries(new FormData($('#filters'))), all = jobsForView(f.status);
  const filtered = all.filter(j => (f.role === 'all' || j.role === f.role) && (f.sector === 'all' || (f.sector === 'progressive' ? j.company === 'Progressive' : j.sector === f.sector)) && (f.mode === 'all' || j.mode === f.mode) && (f.status === 'applied' || Date.now() - Date.parse(j.postedAt) <= Number(f.days) * DAY) && (f.status !== 'unapplied' || !applied[jobKey(j)]) && (f.status === 'applied' || f.eligibility === 'all' || !j.requiresActiveClearance) && keywordMatch(j, f.q));
  $('#count').textContent = (feed?.jobs || []).filter(validJob).filter(alive).length;
  $('#results-label').textContent = offline ? 'Job sources could not be reached' : `${filtered.length} ${filtered.length === 1 ? 'opportunity' : 'opportunities'} · ${Object.keys(applied).length} applied${loading ? ' · more sources loading…' : ''}`;
  const narrowed = f.role !== 'all' || f.sector !== 'all' || f.mode !== 'all' || f.days !== '30' || Boolean(f.q?.trim()) || f.status !== 'all' || f.eligibility === 'all';
  $('#reset').hidden = !narrowed;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); page = Math.min(page, pages);
  $('#pagination').hidden = pages === 1;
  $('#page-label').textContent = `Page ${page} of ${pages} · ${PAGE_SIZE} per page`;
  $('#previous').disabled = page === 1; $('#next').disabled = page === pages;
  $('#feed').setAttribute('aria-busy', 'false');
  $('#feed').innerHTML = filtered.length ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(card).join('') : `<div class="empty"><h3>${loading ? 'Checking more sources…' : f.status === 'applied' ? 'Your applied jobs will appear here.' : narrowed ? 'No matches for these filters.' : 'No recent matches available from the checked sources.'}</h3><p>${f.status === 'applied' ? 'Use the Not applied button on any job to mark it Applied.' : 'Try another keyword or browse the official career portals below.'}</p>${narrowed ? '<button class="text-button" id="empty-reset" type="button">Show all opportunities →</button>' : ''}</div>`;
  $('#empty-reset')?.addEventListener('click', reset);
  for (const button of document.querySelectorAll('.applied-toggle')) button.addEventListener('click', () => {
    const key = button.getAttribute('data-job-key'), job = all.find(j => jobKey(j) === key);
    if (!job) return;
    applied = toggleApplied(applied, job);
    try { localStorage.setItem(STATUS_KEY, JSON.stringify(applied)); $('#tracking-note').textContent = 'Applied choices saved in this browser. Opening a posting does not mark it applied.'; }
    catch { $('#tracking-note').textContent = 'Browser storage is unavailable. Applied changes will be lost when you close this page.'; }
    render();
    [...document.querySelectorAll('.applied-toggle')].find(b => b.getAttribute('data-job-key') === key)?.focus();
  });
  const p = feed?.sources.find(s => s.id === 'progressive'), total = (feed?.jobs || []).filter(alive).filter(j => j.company === 'Progressive').length;
  $('#progressive-status').textContent = total ? `${total} current matches in your feed.` : p?.status === 'ok' ? 'No recent matches in the checked listings.' : 'Browse careers directly while automatic checks are incomplete.';
  $('#sources-list').innerHTML = (feed?.sources || []).map(s => `<li><a href="${safeLink(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.name)} ↗</a><span class="source-state">${escape({ ok: 'Checked', partial: 'Partial coverage', setup: 'Not connected', unavailable: 'Check unavailable' }[s.status] || 'Unknown')}</span><p>${escape(s.note)}</p><p>Check attempted: ${escape(new Date(s.checkedAt || feed.checkedAt).toLocaleString())}</p></li>`).join('');
}
function reset() { $('#filters').reset(); page = 1; render(); }
function showNotice(text) { $('#notice').textContent = text; $('#notice').hidden = !text; }
function combine() {
  const sources = [], jobs = new Map(), dates = [];
  for (const batch of batches.values()) {
    dates.push(Date.parse(batch.checkedAt));
    sources.push(...batch.sources.map(s => ({ ...s, checkedAt: batch.checkedAt })));
    for (const j of batch.jobs.filter(validJob)) if (!jobs.has(jobKey(j))) jobs.set(jobKey(j), j);
  }
  feed = { checkedAt: new Date(dates.length ? Math.min(...dates) : Date.now()).toISOString(), sources, jobs: [...jobs.values()].sort((a,b) => a.priority - b.priority || Date.parse(b.postedAt) - Date.parse(a.postedAt) || b.score - a.score), batches: Object.fromEntries(batches) };
  render(); renderSites();
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(feed)); } catch { /* Snapshot optional. */ }
}
async function loadGroup(group) {
  const response = await fetch('/api/amma/jobs' + (group === 'priority' ? '' : `?group=${encodeURIComponent(group)}`), { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error('unavailable');
  const next = await response.json();
  if (!Array.isArray(next.jobs) || !Array.isArray(next.sources) || !Number.isFinite(Date.parse(next.checkedAt))) throw new Error('invalid');
  batches.set(group, next); combine(); return next;
}
async function refresh() {
  if (loading) return;
  loading = true; offline = false; lastAttempt = Date.now(); $('#check').disabled = true;
  let received = 0; const failedGroups = [];
  try {
    let groups = ['civic', 'federal-delivery', 'insurance', 'platforms', 'finance', 'software'];
    try { const first = await loadGroup('priority'); received++; groups = first.groups?.filter(g => g !== 'priority') || []; } catch { failedGroups.push('priority'); }
    const queue = [...groups];
    const worker = async () => { while (queue.length) { const group = queue.shift(); try { await loadGroup(group); received++; } catch { failedGroups.push(group); } } };
    await Promise.all([worker(), worker()]);
    const customQueue = sites.filter(s => s.provider);
    const customWorker = async () => { while (customQueue.length) { const site = customQueue.shift(); try { await loadSite(site); received++; } catch { failedGroups.push(site.name); } } };
    await Promise.all([customWorker(), customWorker()]);
    if (!received) throw new Error('offline');
    const incomplete = feed.sources.filter(s => s.status !== 'ok');
    $('#freshness').textContent = `${feed.sources.filter(s => s.status === 'ok').length} of ${feed.sources.length} sources fully checked · refreshed about every 6 hours`;
    showNotice(failedGroups.length ? `${failedGroups.length} source groups could not refresh. Any saved results may be outdated; check original postings. See source status below.` : incomplete.length ? `${incomplete.length} sources have partial coverage or need attention. See source status below; direct career links are always available.` : '');
  } catch {
    offline = true; $('#freshness').textContent = 'Unable to check for new opportunities right now.';
    if (feed && Date.now() - Date.parse(feed.checkedAt) < 2 * DAY) { render(); showNotice(`Showing saved results from ${new Date(feed.checkedAt).toLocaleString()}. Availability may have changed.`); }
    else {
      feed = { checkedAt: new Date().toISOString(), jobs: [], sources: [] }; render();
      $('#results-label').textContent = 'Job sources could not be reached';
      showNotice('No live results loaded. This is a connection problem, not an absence of matching jobs. Applied history is still available.');
    }
  } finally { loading = false; $('#check').disabled = false; render(); }
}
function renderSites() {
  $('#saved-sites').innerHTML = sites.map(site => {
    const source = batches.get(site.key)?.sources[0];
    const state = !site.provider ? 'Direct link · no automatic import' : sitePending.has(site.key) ? 'Checking for matching jobs…' : source?.status === 'ok' ? `Automatic import · ${batches.get(site.key).jobs.length} matches` : source?.status === 'partial' ? 'Automatic import · partial coverage' : source?.status === 'unavailable' ? 'Import unavailable · open the link to check' : 'Automatic import · awaiting check';
    return `<li class="saved-site"><div><a href="${safeLink(site.url)}" target="_blank" rel="noopener noreferrer">${escape(source?.name || site.name)} ↗</a><small>${escape(state)}</small></div><button class="remove-site" type="button" data-site-key="${escape(site.key)}" aria-label="Remove ${escape(site.name)}">Remove</button></li>`;
  }).join('');
  for (const button of document.querySelectorAll('.remove-site')) button.addEventListener('click', () => {
    const key = button.getAttribute('data-site-key');
    sites = sites.filter(s => s.key !== key); batches.delete(key); saveSites('Site removed. Applied history is kept.'); combine();
  });
}
function saveSites(message) {
  try { localStorage.setItem(SITES_KEY, JSON.stringify(sites)); $('#site-notice').textContent = message; }
  catch { $('#site-notice').textContent = 'Browser storage is unavailable. Site changes work for this visit but will not survive reloading.'; }
  renderSites();
}
async function loadSite(site) {
  if (sitePending.has(site.key)) return sitePending.get(site.key);
  const task = (async () => {
    try {
      const response = await fetch(`/api/amma/custom?provider=${encodeURIComponent(site.provider)}&board=${encodeURIComponent(site.board)}`, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error('unavailable');
      const next = await response.json();
      if (!Array.isArray(next.jobs) || !Array.isArray(next.sources) || !Number.isFinite(Date.parse(next.checkedAt))) throw new Error('invalid');
      if (sites.some(s => s.key === site.key)) { batches.set(site.key, next); combine(); }
    } catch (error) {
      if (sites.some(s => s.key === site.key)) {
        const previous = batches.get(site.key);
        batches.set(site.key, { checkedAt: previous?.checkedAt || new Date().toISOString(), jobs: previous?.jobs || [], sources: [{ id: site.key, name: site.name, url: site.url, status: 'unavailable', note: 'Unable to refresh this board. Any saved results may be outdated; check the original posting.' }] }); combine();
      }
      throw error;
    }
  })().finally(() => { sitePending.delete(site.key); renderSites(); });
  sitePending.set(site.key, task); renderSites(); return task;
}
$('#site-form').addEventListener('submit', async e => {
  e.preventDefault();
  let site;
  try {
    site = parseSite($('#site-url').value);
    if (sites.some(s => s.key === site.key)) throw new Error('This career site is already saved.');
    if (sites.length >= MAX_SITES) throw new Error(`You can save up to ${MAX_SITES} sites. Remove one to add another.`);
  } catch (error) { $('#site-notice').textContent = error.message; return; }
  sites.push(site); $('#site-url').value = '';
  saveSites(site.provider ? 'Site saved. Checking for matching jobs…' : 'Site saved as a direct link. Automatic importing is available for Greenhouse, Lever, and Ashby boards.');
  if (site.provider) {
    try { await loadSite(site); } catch { /* Visible in the saved site status. */ }
    if (sites.some(s => s.key === site.key)) saveSites('Site saved. See its import status below.');
  }
});
$('#filter-toggle').addEventListener('click', () => {
  const expanded = $('#filter-toggle').getAttribute('aria-expanded') !== 'true';
  $('#filter-toggle').setAttribute('aria-expanded', String(expanded));
  $('#filter-toggle').textContent = expanded ? 'Fewer filters' : 'More filters';
  $('#filters').classList.toggle('expanded', expanded);
});
renderSites();
$('#filters').addEventListener('submit', e => e.preventDefault());
$('#filters').addEventListener('change', () => { page = 1; render(); });
$('#query').addEventListener('input', () => { page = 1; render(); });
$('#reset').addEventListener('click', reset); $('#check').addEventListener('click', refresh);
$('#previous').addEventListener('click', () => { page--; render(); }); $('#next').addEventListener('click', () => { page++; render(); });
$('#suggested-terms').innerHTML = SUGGESTED_TERMS.map(term => `<button type="button" data-term="${escape(term)}">${escape(term)}</button>`).join('');
for (const button of document.querySelectorAll('[data-term]')) button.addEventListener('click', () => { $('#query').value = button.getAttribute('data-term'); page = 1; render(); });
$('#portal-directory').innerHTML = PORTALS.map(p => `<div class="portal"><a href="${safeLink(p.url)}" target="_blank" rel="noopener noreferrer">${escape(p.name)} ↗</a><span>Search: ${escape(p.keywords)}</span></div>`).join('');
try { const saved = JSON.parse(localStorage.getItem(CACHE_KEY)); if (saved && Array.isArray(saved.jobs) && Array.isArray(saved.sources) && Date.now() - Date.parse(saved.checkedAt) < 2 * DAY) { feed = saved; for (const [k,v] of Object.entries(saved.batches || {})) if (!k.startsWith('custom:') || sites.some(s => s.key === k)) batches.set(k,v); if (saved.batches) combine(); else render(); showNotice('Showing saved results while checking for updates…'); } } catch { /* Storage optional. */ }
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastAttempt > 6 * 3_600_000) refresh(); });
setInterval(() => { if (!document.hidden) refresh(); }, 6 * 3_600_000);
refresh();
