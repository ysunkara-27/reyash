import { boardSite } from '../../amma/custom-sites.mjs';
import { greenhouse, lever, ashby, SOURCE_DEFINITIONS } from '../../lib/amma/sources.mjs';
import { rankJobs } from '../../lib/amma/match.mjs';

const cache = new Map(), pending = new Map();
const runners = { greenhouse, lever, ashby };
export async function customFeed(provider, board, options = {}) {
  // Only fixed provider origins + a strictly validated slug ever reach a fetch.
  const site = boardSite(provider, board), now = options.now || Date.now();
  const saved = cache.get(site.key);
  if (saved && saved.expires > now) return saved.payload;
  if (pending.has(site.key)) return pending.get(site.key);
  if (pending.size >= 4) throw new Error('Busy');
  const task = (async () => {
    const known = SOURCE_DEFINITIONS.find(s => s.kind === provider && s.id === board);
    const source = known || { id: board, name: board, kind: provider, sector: 'private', url: site.url };
    let result, status;
    try {
      result = await runners[provider](source, { ...options, signal: AbortSignal.timeout(48_000) });
      status = result.partial ? 'partial' : 'ok';
    } catch {
      result = { jobs: [], note: 'This public board could not be checked. Verify the saved link or try again later.' }; status = 'unavailable';
    }
    const payload = { checkedAt: new Date(now).toISOString(), jobs: rankJobs(result.jobs.map(j => ({ ...j, sourceId: site.key })), now), sources: [{ ...source, id: site.key, status, note: result.note }] };
    if (cache.size >= 100) cache.delete(cache.keys().next().value);
    cache.set(site.key, { payload, expires: now + (status === 'unavailable' ? 300_000 : 21_600_000) });
    return payload;
  })().finally(() => pending.delete(site.key));
  pending.set(site.key, task);
  return task;
}
export default async function handler(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).json({ error: 'Method not allowed' }); }
  const url = new URL(req.url, 'https://www.ysunkara.com');
  const provider = url.searchParams.get('provider'), board = url.searchParams.get('board');
  try { boardSite(provider, board); } catch { return res.status(400).json({ error: 'Invalid public career board' }); }
  if ([...url.searchParams.keys()].some(k => !['provider', 'board'].includes(k)) || url.searchParams.getAll('provider').length !== 1 || url.searchParams.getAll('board').length !== 1) return res.status(400).json({ error: 'Invalid parameters' });
  try {
    const payload = await customFeed(provider, board);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.setHeader('Vercel-CDN-Cache-Control', `public, s-maxage=${payload.sources[0].status === 'unavailable' ? 300 : 21600}`);
    return res.status(200).json(payload);
  } catch {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Retry-After', '60');
    return res.status(503).json({ error: 'Career boards are busy. Please try again shortly.' });
  }
}
