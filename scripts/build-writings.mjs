// Turns every writings/<slug>/article.md into writings/<slug>/index.html and refreshes the
// writing lists on /writings and the homepage. Run: node scripts/build-writings.mjs
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const writingsDir = resolve(root, 'writings');
const SITE = 'https://ysunkara.com';
const AUTHOR = 'Yash Sunkara';
const ABOUT = '<b>Yash Sunkara</b> studies computer science and public policy at the University of Virginia and builds software tools. Corrections welcome.';

const escapeHtml = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Straight quotes to curly ones, the way the published essays are typeset.
function smart(text) {
  return text
    .replace(/(^|[\s([{—-])"/g, '$1“').replace(/"/g, '”')
    .replace(/(^|[\s([{—-])'/g, '$1‘').replace(/'/g, '’');
}

function inline(text) {
  const kept = [];
  const keep = html => `\u0000${kept.push(html) - 1}\u0000`;
  let out = text
    .replace(/`([^`]+)`/g, (_, code) => keep(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => keep(`<a href="${escapeHtml(url)}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : ''}>`) + label + keep('</a>'))
    .replace(/https?:\/\/[^\s)<]+[^\s)<.,]/g, url => keep(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a>`));
  out = smart(escapeHtml(out).replace(/&quot;/g, '"'))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[i]);
}

const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  if (!match) return { meta, body: source };
  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([a-z_]+):\s*(.*)$/);
    if (pair) meta[pair[1]] = pair[2].replace(/^"(.*)"$/, '$1').trim();
  }
  return { meta, body: source.slice(match[0].length) };
}

async function renderMarkdown(body, dir) {
  const lines = body.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const include = line.match(/^<!--\s*include:\s*(\S+)\s*-->$/);
    if (include) { out.push(await readFile(resolve(dir, include[1]), 'utf8')); i++; continue; }
    if (line.startsWith('<!--')) { while (i < lines.length && !lines[i].includes('-->')) i++; i++; continue; }
    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) { const level = heading[1].length; out.push(`<h${level} id="${slugify(heading[2])}">${inline(heading[2])}</h${level}>`); i++; continue; }
    // ::: story <name> <graphic.html>  ...steps separated by +++ ...  :::
    const story = line.match(/^:::\s*story\s+([a-z0-9-]+)\s+(\S+)\s*$/);
    if (story) {
      const steps = [[]];
      for (i++; i < lines.length && lines[i].trim() !== ':::'; i++) {
        if (lines[i].trim() === '+++') steps.push([]);
        else steps.at(-1).push(lines[i]);
      }
      i++;
      const graphic = await readFile(resolve(dir, story[2]), 'utf8');
      const stepHtml = [];
      for (const [index, step] of steps.entries()) stepHtml.push(`<div class="story-step" data-step="${index + 1}"><div class="story-card">\n${await renderMarkdown(step.join('\n'), dir)}\n</div></div>`);
      out.push(`<section class="story story-${story[1]}" id="story-${story[1]}" data-step="${steps.length}" data-steps="${steps.length}">\n<div class="story-graphic">\n${graphic}\n</div>\n<div class="story-steps">\n${stepHtml.join('\n')}\n</div>\n</section>`);
      continue;
    }
    if (/^```/.test(line)) {
      const kind = line.slice(3).trim();
      const content = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) content.push(lines[i]);
      i++;
      out.push(kind === 'formula' ? `<div class="formula">${content.map(inline).join('<br>')}</div>` : `<pre><code>${escapeHtml(content.join('\n'))}</code></pre>`);
      continue;
    }
    if (/^---+$/.test(line.trim())) { out.push('<hr>'); i++; continue; }
    const image = line.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/);
    if (image) { out.push(`<figure><img src="${escapeHtml(image[2])}" alt="${escapeHtml(image[1])}" loading="lazy">${image[3] ? `<figcaption>${inline(image[3])}</figcaption>` : ''}</figure>`); i++; continue; }
    if (line.startsWith('|')) {
      const rows = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i].replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
      const [head, , ...rest] = rows;
      out.push(`<div class="tablewrap"><table><thead><tr>${head.map(cell => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rest.map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    const listItem = /^(\d+\.|[-*])\s+/;
    if (listItem.test(line)) {
      const ordered = /^\d/.test(line);
      const items = [];
      for (; i < lines.length && listItem.test(lines[i]); i++) items.push(`<li>${inline(lines[i].replace(listItem, ''))}</li>`);
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }
    if (line.startsWith('<')) {
      const html = [];
      for (; i < lines.length && lines[i].trim(); i++) html.push(lines[i]);
      out.push(html.join('\n'));
      continue;
    }
    const paragraph = [];
    for (; i < lines.length && lines[i].trim() && !/^(#{2,3}\s|\||```|!\[|<|:::|(\d+\.|[-*])\s)/.test(lines[i]); i++) paragraph.push(lines[i]);
    out.push(`<p>${paragraph.map(text => inline(text.trim())).join(' ')}</p>`);
  }
  return out.join('\n');
}

const monthYear = date => new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const plain = text => smart(text);

function page(meta, slug, bodyHtml, notesHtml, hasOg) {
  const url = `${SITE}/writings/${slug}`;
  const title = plain(meta.title);
  const description = plain(meta.description || meta.dek || '');
  const extraStyles = (meta.styles || '').split(',').map(s => s.trim()).filter(Boolean).map(href => `<link rel="stylesheet" href="/writings/${slug}/${href}">`).join('\n');
  const storyScript = bodyHtml.includes('class="story ') ? '<script src="/writings/story.js" defer></script>\n' : '';
  const extraScripts = storyScript + (meta.scripts || '').split(',').map(s => s.trim()).filter(Boolean).map(src => `<script src="/writings/${slug}/${src}" defer></script>`).join('\n');
  const image = hasOg ? `${url}/og.png` : '';
  return `<!doctype html>
<!-- Generated from article.md by scripts/build-writings.mjs. Edit article.md, not this file. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="author" content="${AUTHOR}">
<link rel="canonical" href="${url}">
<link rel="preload" href="/css/ramboia-font-family/RamboiaTestVF.ttf" as="font" type="font/ttf" crossorigin>
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
${image ? `<meta property="og:image" content="${image}">\n<meta name="twitter:image" content="${image}">\n` : ''}<meta property="article:published_time" content="${meta.date.slice(0, 10)}">
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<link rel="stylesheet" href="/writings/article.css">
${extraStyles}
</head>
<body>
<header class="masthead">
  <div class="row"><a class="back" href="/writings">← Writings</a><span class="t">${escapeHtml(title)}</span></div>
  <div class="progress"><span id="prog"></span></div>
</header>
<main>
<header class="head">
  ${meta.kicker ? `<p class="kicker">${escapeHtml(plain(meta.kicker))}</p>` : ''}
  <h1>${escapeHtml(title)}</h1>
  ${meta.dek ? `<p class="dek">${escapeHtml(plain(meta.dek))}</p>` : ''}
  <p class="byline">By <strong>${AUTHOR}</strong> · ${monthYear(meta.date)}${meta.reading_time ? ` · ${escapeHtml(meta.reading_time)}` : ''}</p>
</header>
<article class="prose">
${bodyHtml}
</article>
${notesHtml ? `<section class="notes"><div class="prose">\n${notesHtml}\n</div></section>` : ''}
</main>
<footer class="about"><p>${meta.about ? inline(meta.about) : ABOUT}</p></footer>
<script>
(function(){var bar=document.getElementById('prog');function update(){var max=document.documentElement.scrollHeight-innerHeight;bar.style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%';}addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();})();
</script>
${extraScripts}
</body>
</html>
`;
}

function listItem(entry, kind) {
  const href = `/writings/${entry.slug}`;
  const meta = `${monthYear(entry.meta.date)}${entry.meta.reading_time ? ` · ${escapeHtml(entry.meta.reading_time)}` : ''}`;
  const dek = escapeHtml(plain(entry.meta.listing_dek || entry.meta.dek || ''));
  const title = escapeHtml(plain(entry.meta.title));
  if (kind === 'home') return `                        <div class="resume-item">
                            <h3><a href="${href}">${title}</a></h3>
                            <p class="role">${meta}</p>
                            <p>${dek}</p>
                        </div>`;
  return `            <li class="writing-entry">
                <a href="${href}">
                    <h2>${title}</h2>
                    <p class="writing-dek">${dek}</p>
                    <p class="writing-meta">${meta}</p>
                </a>
            </li>`;
}

async function replaceList(file, kind, entries) {
  const path = resolve(root, file);
  const html = await readFile(path, 'utf8');
  const start = '<!-- writings:list:start -->', end = '<!-- writings:list:end -->';
  const from = html.indexOf(start), to = html.indexOf(end);
  if (from < 0 || to < 0) throw new Error(`${file} is missing the writings list markers`);
  const items = entries.map(entry => listItem(entry, kind)).join('\n');
  await writeFile(path, `${html.slice(0, from + start.length)}\n${items}\n${html.slice(to)}`);
}

export async function buildWritings() {
  const entries = [];
  for (const entry of await readdir(writingsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = resolve(writingsDir, entry.name);
    const source = resolve(dir, 'article.md');
    if (!existsSync(source)) continue;
    const { meta, body } = parseFrontmatter(await readFile(source, 'utf8'));
    if (!meta.title || !meta.date) throw new Error(`${entry.name}/article.md needs a title and a date`);
    if (meta.draft === 'true') continue;
    entries.push({ slug: entry.name, meta });
    // page: custom means the folder ships its own hand-built index.html; only list it.
    if (meta.page === 'custom') continue;
    const [main, notes = ''] = body.split(/^## Sources\s*$/m);
    const bodyHtml = await renderMarkdown(main, dir);
    const notesHtml = notes ? `<h2 id="sources">Sources</h2>\n${await renderMarkdown(notes, dir)}` : '';
    await writeFile(resolve(dir, 'index.html'), page(meta, entry.name, bodyHtml, notesHtml, existsSync(resolve(dir, 'og.png'))));
  }
  entries.sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.meta.title.localeCompare(b.meta.title));
  await replaceList('writings/index.html', 'index', entries);
  await replaceList('index.html', 'home', entries);
  return entries;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const entries = await buildWritings();
  console.log(`Built ${entries.length} writing${entries.length === 1 ? '' : 's'}: ${entries.map(entry => entry.slug).join(', ')}`);
}
