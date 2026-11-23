import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function readContract(root) {
  return JSON.parse(await readFile(resolve(root, 'config/production-routes.json'), 'utf8'));
}

export function assetReferences(html, pagePath) {
  const origin = 'https://www.ysunkara.com';
  const refs = new Set();
  for (const [tag] of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    if (/^<link/i.test(tag) && !/\brel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
    const ref = tag.match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!ref) continue;
    const url = new URL(ref.replaceAll('&amp;', '&'), new URL(pagePath, origin));
    if (url.origin === origin) refs.add(url.pathname);
  }
  return [...refs];
}

function outputPath(path, config) {
  for (const rule of config.rewrites ?? []) {
    if (/^https?:/.test(rule.destination)) continue;
    if (rule.source === path) return rule.destination;
    if (rule.source.endsWith('/:path*')) {
      const prefix = rule.source.slice(0, -7);
      if (path.startsWith(`${prefix}/`)) return rule.destination.replace(':path*', path.slice(prefix.length + 1));
    }
  }
  return path;
}

export async function validateSource(root, contract = null) {
  contract ??= await readContract(root);
  const config = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
  for (const kind of ['redirects', 'rewrites']) {
    for (const rule of contract[kind]) {
      const actual = config[kind]?.find(item => item.source === rule.source);
      if (!actual || actual.destination !== rule.destination || (kind === 'redirects' && actual.permanent !== rule.permanent)) {
        throw new Error(`Protected ${kind} rule changed: ${rule.source}. Preserve it or document an explicitly requested migration in the contract.`);
      }
    }
  }
  for (const file of contract.serverlessFiles) await readFile(resolve(root, file));
  return { contract, config };
}

export async function validateBuild(root, output = resolve(root, 'dist')) {
  const { contract, config } = await validateSource(root);
  const registered = new Set(contract.pages.map(page => page.file));
  for (const entry of await readdir(output, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = `${entry.name}/index.html`;
    try { await readFile(resolve(output, file)); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (!registered.has(file)) throw new Error(`Register the new public page ${file} in config/production-routes.json.`);
  }
  const assets = new Set();
  for (const page of contract.pages) {
    const html = await readFile(resolve(output, page.file), 'utf8');
    if (!html.includes(`<title>${page.title}</title>`)) throw new Error(`Unexpected page at ${page.file}: expected title ${page.title}`);
    for (const path of assetReferences(html, page.path)) assets.add(path);
  }
  for (const asset of assets) {
    let content;
    try { content = await readFile(resolve(output, `.${asset}`)); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      content = await readFile(resolve(output, `.${outputPath(asset, config)}`));
    }
    if (!content.length || /^\s*(?:<!doctype html|<html)/i.test(content.toString('utf8'))) throw new Error(`Missing or invalid script/stylesheet: ${asset}`);
  }
  console.log(`Production contract passed: ${contract.pages.length} pages, ${assets.size} assets, ${contract.redirects.length} redirects, ${contract.rewrites.length} rewrites.`);
}

export async function verifyLive(root, base, fetchImpl = fetch) {
  const contract = await readContract(root);
  const origin = new URL(base).origin;
  const assets = new Set();
  const failures = [];
  const request = (path, redirect = 'follow') => fetchImpl(new URL(path, origin), { redirect, signal: AbortSignal.timeout(20000) });
  // Bounded concurrency keeps this read-only check gentle on production.
  async function check(items, fn) {
    let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < items.length) {
        const item = items[next++];
        try { await fn(item); } catch (error) { failures.push(`${typeof item === 'string' ? item : item.path ?? item.source}: ${error.message}`); }
      }
    }));
  }
  await check(contract.pages.filter(page => page.live !== false), async page => {
    const response = await request(page.path);
    const html = await response.text();
    if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/html') || !html.includes(`<title>${page.title}</title>`)) {
      throw new Error(`expected its own HTML page; got HTTP ${response.status} at ${response.url}`);
    }
    for (const asset of assetReferences(html, new URL(response.url).pathname)) assets.add(asset);
  });
  await check([...assets], async asset => {
    const response = await request(asset);
    const type = response.headers.get('content-type') ?? '';
    const body = await response.text();
    const expectedType = asset.endsWith('.css') ? /text\/css/i : /javascript|ecmascript/i;
    if (response.status !== 200 || !expectedType.test(type) || !body.length || /^\s*(?:<!doctype html|<html)/i.test(body)) {
      throw new Error(`expected a working asset; got HTTP ${response.status}, ${type}`);
    }
  });
  await check(contract.redirects, async rule => {
    const substitute = value => value.replace(/:path\+|:path\*/g, 'release-probe/nested');
    const path = substitute(rule.source);
    const expected = new URL(substitute(rule.destination), origin).href;
    const response = await request(path, 'manual');
    const location = response.headers.get('location');
    const actual = location && new URL(location, origin).href;
    if (response.status !== (rule.permanent ? 308 : 307) || actual !== expected) throw new Error(`expected redirect to ${expected}; got ${response.status} ${actual}`);
  });
  if (failures.length) throw new Error(`Production route checks failed:\n${failures.join('\n')}`);
  console.log(`Live contract passed at ${origin}: ${contract.pages.filter(page => page.live !== false).length} pages, ${assets.size} scripts/stylesheets, ${contract.redirects.length} redirects.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(import.meta.dirname, '..');
  if (process.argv[2] === '--live') {
    if (!process.argv[3]) throw new Error('Usage: node scripts/production-routes.mjs --live https://www.ysunkara.com');
    await verifyLive(root, process.argv[3]);
  } else if (process.argv[2] === '--source') {
    await validateSource(root);
    console.log('Protected routes and serverless sources are present.');
  } else await validateBuild(root);
}
