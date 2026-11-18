import {buildAtlas} from '../raas-planner/scripts/build_public.mjs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { buildWritings } from './build-writings.mjs';

const root = resolve(import.meta.dirname, '..');
const vercelConfig = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
// The Worker serves the classroom UI and API, so this route must ship with the portfolio.
if (!vercelConfig.rewrites?.some(({ source, destination }) =>
  source === '/dam-dilemma/:path*' &&
  destination === 'https://dam-decision.sunkarayashaswi.workers.dev/dam-dilemma/:path*'
)) {
  throw new Error('vercel.json must route /dam-dilemma and its subpaths to the Dam Decision Worker.');
}

// Publish public assets only, never the source checkout or local environment files.
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const excluded = new Set(['api', 'tests', 'node_modules', 'README.md', 'feed', 'article.md', 'parts']);
// Render Markdown essays and refresh the writing lists before copying them.
await buildWritings();
for (const path of ['index.html', 'assets', 'bidpoints', 'css', 'js', 'apgovelections', 'rides', 'pujarinet', 'writings', 'links', 'sahana', 'amma', 'stats', 'learn', 'loop', 'feedback']) {
  await cp(resolve(root, path), resolve(output, path), {
    recursive: true,
    filter: source => !basename(source).startsWith('.') && !excluded.has(basename(source)),
  });
}
// Preserve the downloadable election classroom materials, alongside the compiled app.
await mkdir(resolve(output, 'kwatnoskiapgov'), { recursive: true });
for (const file of await readdir(resolve(root, 'kwatnoskiapgov'))) {
  if (/\.(pdf|docx|pptx|xlsx)$/i.test(file)) {
    await cp(resolve(root, 'kwatnoskiapgov', file), resolve(output, 'kwatnoskiapgov', file));
  }
}
await cp(resolve(root, 'savetheworld/dist'), resolve(output, 'savetheworld'), { recursive: true });
await cp(resolve(root, 'officehours/ux-studio-screen-main/out'), resolve(output, 'officehours'), { recursive: true });
async function injectAnalytics(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await injectAnalytics(path);
    else if (entry.name.endsWith('.html') && !path.includes('/stats/') && !path.includes('/loop/')) {
      const html = await readFile(path, 'utf8');
      if (!html.includes('/js/analytics.js')) await writeFile(path, html.replace('</head>', '  <script defer src="/js/analytics.js"></script>\n</head>'));
    }
  }
}
await buildAtlas(resolve(root,'raas-planner'),resolve(output,'atlas'));
await injectAnalytics(output);
console.log('Built portfolio and all public sub-sites in dist/');
