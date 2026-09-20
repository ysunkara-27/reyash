export const SITES_KEY = 'amma-sites-v1';
export const MAX_SITES = 10;
const hosts = { 'boards.greenhouse.io': 'greenhouse', 'job-boards.greenhouse.io': 'greenhouse', 'jobs.lever.co': 'lever', 'jobs.ashbyhq.com': 'ashby' };
const origins = { greenhouse: 'https://job-boards.greenhouse.io', lever: 'https://jobs.lever.co', ashby: 'https://jobs.ashbyhq.com' };
export function boardSite(provider, board) {
  if (!Object.hasOwn(origins, provider) || typeof board !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(board)) throw new Error('Use a supported public career board URL.');
  return { key: `custom:${provider}:${board}`, provider, board, url: `${origins[provider]}/${board}`, name: board };
}
export function parseSite(value) {
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('Paste the full career page link, starting with https://.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) || /\.(local|localhost|internal|test|invalid)$/i.test(url.hostname)) throw new Error('Use an HTTPS link to a public career site.');
  const provider = hosts[url.hostname], board = url.pathname.split('/')[1];
  if (provider) return boardSite(provider, board);
  url.hash = '';
  return { key: `link:${url.href}`, url: url.href, name: url.hostname.replace(/^www\./, ''), provider: null };
}
export function readSites(storage) {
  try {
    const saved = JSON.parse(storage.getItem(SITES_KEY));
    if (!Array.isArray(saved)) return [];
    const sites = new Map();
    for (const item of saved.slice(0, MAX_SITES)) { try { const site = parseSite(item.url); sites.set(site.key, site); } catch { /* Ignore invalid stored entries. */ } }
    return [...sites.values()];
  } catch { return []; }
}
