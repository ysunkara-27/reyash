import { collectSources, SOURCE_GROUPS } from '../../lib/amma/sources.mjs';
import { rankJobs } from '../../lib/amma/match.mjs';

const caches = new Map(), pending = new Map();
const TTL = 6 * 60 * 60 * 1000;
export async function getFeed(collect = collectSources, now = Date.now(), group = 'priority') {
  const cached = caches.get(group);
  if (cached && now < cached.expiresAt) return cached.payload;
  if (!pending.has(group)) pending.set(group, (async () => {
    const result = await collect({ group });
    const payload = { group, groups: SOURCE_GROUPS, checkedAt: new Date(now).toISOString(), refreshHours: 6, jobs: rankJobs(result.jobs, now), sources: result.sources };
    const available = result.sources.some(s => s.status === 'ok' || s.status === 'partial');
    caches.set(group, { payload, expiresAt: now + (available ? TTL : 300_000) });
    return payload;
  })().finally(() => pending.delete(group)));
  return pending.get(group);
}
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).json({ error: 'Method not allowed' }); }
  const url = new URL(req.url, 'https://www.ysunkara.com');
  const group = url.searchParams.get('group') || 'priority';
  if (!SOURCE_GROUPS.includes(group)) return res.status(400).json({ error: 'Unknown source group' });
  const canonical = '/api/amma/jobs' + (group === 'priority' ? '' : `?group=${group}`);
  if (url.pathname + url.search !== canonical) { res.setHeader('Location', canonical); return res.status(307).end(); }
  try {
    const payload = await getFeed(collectSources, Date.now(), group);
    const available = payload.sources.some(s => ['ok', 'partial'].includes(s.status));
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.setHeader('Vercel-CDN-Cache-Control', `public, s-maxage=${available ? 21600 : 300}, stale-while-revalidate=300`);
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(200).json(payload);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Job sources are temporarily unavailable. Please try again shortly.' });
  }
}
