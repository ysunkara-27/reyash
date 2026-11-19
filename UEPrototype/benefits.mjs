import { decoy, escapeText as esc } from './ui.mjs';

const home = '#benefits';
const assistance = home + '/assistance';
const resources = home + '/resources';
const groups = [
  ['family', 'Family / children care', ['Family', 'Pregnant', 'Elder care', 'Foster', 'Birth–5yr']],
  ['finance', 'Finance + housing', ['Homeless', 'Utility support', 'Unemployed']],
  ['health', 'Health + wellbeing', ['Health + medication', 'Substance use', 'Medical coverage']],
  ['transitions', 'Life transitions', ['Reentry', 'Veteran', 'Unemployed', 'Other']]
];
const categories = ['Recovery support', 'Family support', 'Mental health + addiction'];
const listings = [
  { id: 'community-counseling', number: 1, name: 'Community Counseling Center', area: 'Downtown Lexington', category: [categories[2]], description: 'Explore counseling and substance use support for individuals and families.', service: 'Individual counseling', schedule: 'Weekday appointments', miles: [2, 26], point: [40, 49], open: true, always: false },
  { id: 'recovery-connections', number: 2, name: 'Recovery Connections', area: 'North Lexington', category: [categories[0], categories[2]], description: 'Learn about recovery-focused guidance and peer support options.', service: 'Peer support groups for alcohol recovery', schedule: 'Alcohol recovery support group meets Tuesdays and Thursdays at 6:30 p.m.', miles: [5, 27], point: [70, 32], open: true, always: false },
  { id: 'family-support-hub', number: 3, name: 'Family Support Hub', area: 'East Lexington', category: [categories[1]], description: 'Explore practical support for families impacted by substance use.', service: 'Family support and resource navigation', schedule: 'Weekday appointments', miles: [8, 30], point: [81, 72], open: false, always: false },
  { id: 'community-treatment', number: 4, name: 'Community Treatment Services', area: 'South Lexington', category: [categories[0]], description: 'Connect with clinical treatment and recovery services.', service: 'Clinical substance use treatment', schedule: '24-hour services', miles: [9, 31], point: [51, 86], open: true, always: true }
];
const states = { zip: '40507', miles: 500, categories: new Set(), hours: new Set(), view: 'split', grouped: false, expanded: false, sort: 'relevance', page: 0, selected: null, zoom: 1 };
let categoryJump = '';

function header(page) {
  return `<header class="kynect-header"><div class="ky-wrap">
    <a href="${home}" class="kynect-brand"><img src="/UEPrototype/assets/kynect.png" alt="kynect"><span>Kentucky benefits &amp;<br> community resources</span></a>
    <nav aria-label="Main navigation">${page === 'home' ? '<a href="#assistance-section" data-section="assistance-section">Assistance</a>' : `<a href="${home}">Home</a>`}
    ${page === 'home' ? '<a href="#about-section" data-section="about-section">About</a><a href="#contact-section" data-section="contact-section">Contact</a>' : decoy('About') + decoy('Contact')}
    ${page === 'resources' || page === 'detail' ? `<a class="find-help" href="${assistance}">Find help and resources</a>` : ''}
    </nav></div></header>
    <div class="kynect-bar"><div class="ky-wrap"><span>Connecting Kentuckians to the support they need.</span><nav aria-label="Support">
      ${decoy('Help')}${decoy('♙ &nbsp; Sign in')}<label class="ky-language">◎ <select aria-label="Language" id="ky-language"><option value="">English</option><option>Español</option></select></label>
    </nav></div></div>`;
}

function footer() {
  return `<footer class="kynect-footer"><div class="ky-wrap"><span>kynect · Kentucky benefits and community resources</span><nav aria-label="Policies">${decoy('Accessibility')}${decoy('Privacy')}${decoy('Terms of use')}</nav></div></footer>`;
}

function landing() {
  return `${header('home')}<main>
    <section class="kynect-hero" id="assistance-section"><div class="ky-wrap">
      <h1>How can we Assist you?</h1><p>A little support can make a big difference. Let’s find the right place to start.</p>
      <div class="benefit-cards">
        <article><h2><span aria-hidden="true">♡</span> Health insurance</h2><p>Explore health coverage and enrollment.</p><p>Find a health plan that fits your needs.</p>${decoy('Explore coverage →', 'secondary')}</article>
        <article class="benefits-featured"><h2><span aria-hidden="true">⊙</span> Benefits</h2><p>Find programs and support for everyday needs.</p><p>Food, family, housing and more.</p><a class="primary" href="${assistance}">Find assistance →</a></article>
        <article><h2><span aria-hidden="true">♙</span> Services / Resources</h2><p>Connect with services in your community.</p><p>Discover local support, close to home.</p>${decoy('Find resources →', 'secondary')}</article>
      </div>
    </div></section>
    <div class="ky-wrap ky-home-lower">
      <section id="about-section"><h2>About Us</h2><div class="about-grid"><img src="/UEPrototype/assets/about.png" alt="A family sitting together on a porch">
        <article><h2>Support for every chapter of life.</h2><p>kynect brings Kentucky benefits and community resources together, making it easier to explore help for health, family and everyday needs.</p>${decoy('Learn more about kynect →', 'inline-action')}</article>
        <article class="where"><h2>Not sure where to begin?</h2><p>Browse assistance by life situation, or find services near your ZIP code.</p>${decoy('Explore your options →', 'inline-action')}</article>
      </div></section>
      <section id="contact-section"><h2>Contact</h2><div class="contact-grid">
        <article><span aria-hidden="true">▢</span><div><h3>We’re here to help</h3><p>Get help with your questions about kynect.</p>${decoy('Visit the help center →', 'inline-action')}</div></article>
        <article><span aria-hidden="true">♙</span><div><h3>Find someone to guide you</h3><p>Explore options for help with benefits and coverage.</p>${decoy('Find local assistance →', 'inline-action')}</div></article>
      </div></section>
    </div></main>${footer()}`;
}

function assistancePage() {
  return `${header('assistance')}<main class="ky-wrap assistance">
    <div class="crumb"><a href="${home}">Home</a> / Benefits and Assistance</div>
    <h1>Benefits and Assistance</h1><p>Find support for you and your family. Choose a topic to explore benefits and community resources.</p>
    <nav aria-label="Benefit categories" class="categories">${groups.map(([id, title]) => `<a href="#${id}" data-section="${id}" class="${categoryJump === id ? 'current' : ''}">${title}</a>`).join('')}</nav>
    ${groups.map(([id, title, items]) => `<section id="${id}"><h2>${title}</h2><div class="benefit-options">${items.map(item => item === 'Substance use' ? `<a href="${resources}" class="benefit-option">${item}<span aria-hidden="true">›</span></a>` : `<button type="button" class="benefit-option${item === 'Other' ? ' other' : ''}" data-unavailable>${item}<span aria-hidden="true">›</span></button>`).join('')}</div></section>`).join('')}
  </main>${footer()}`;
}

function resourcePage() {
  return `${header('resources')}<main class="ky-resource"><div class="ky-wide">
    <div class="crumb"><a href="${home}">Home</a> / <a href="${assistance}">Benefits and Assistance</a> / Substance use</div>
    <h1>Resources for those impacted by substance use</h1><p id="resource-subtitle">Find nearby support and services.</p>
    <div class="resource-toolbar"><h2 id="resource-count" aria-live="polite"></h2><div class="view-switch" aria-label="Results view">
      <button type="button" data-view="split">◫ &nbsp;List + map</button><button type="button" data-view="list">☰ &nbsp;List</button><button type="button" data-view="map">◫ &nbsp;Map</button>
    </div></div>
    <div class="resource-grid">
      <aside class="resource-filters"><div><h2>Filters</h2><button type="button" class="inline-action" data-reset>Reset</button></div>
        <div class="filter-block"><h3>Location</h3><label class="zip-label" for="zip">ZIP code</label><div class="zip-input"><input id="zip" inputmode="numeric" maxlength="5" value="${esc(states.zip)}"><span class="pin-icon" aria-hidden="true"></span></div>
        <div class="miles-label"><label for="miles">Miles Away</label><output for="miles" id="miles-value">${states.miles} mi</output></div>
        <input id="miles" type="range" min="0" max="500" value="${states.miles}"><div class="miles-limits"><span>0 miles</span><span>500 miles</span></div></div>
        <fieldset class="filter-block"><legend>Category</legend>${filterOptions(categories, 'categories')}</fieldset>
        <fieldset class="filter-block"><legend>Hours</legend>${filterOptions(['Open now', '24-hour services'], 'hours')}</fieldset>
      </aside>
      <div id="resource-results"></div>
    </div>
  </div></main>${footer()}`;
}

function filterOptions(values, key) {
  return values.map(value => `<label class="checkbox"><input type="checkbox" data-filter="${key}" value="${value}"${states[key].has(value) ? ' checked' : ''}>${value}</label>`).join('');
}

function findListings() {
  const valid = /^\d{5}$/.test(states.zip);
  const region = ['40507', '40508', '40502'].includes(states.zip) ? 0 : states.zip === '40601' ? 1 : -1;
  const matches = listings.filter(item => (!states.zip || (valid && region >= 0)) && item.miles[Math.max(region, 0)] <= states.miles &&
    (!states.categories.size || item.category.some(value => states.categories.has(value))) &&
    (!states.hours.has('Open now') || item.open) && (!states.hours.has('24-hour services') || item.always));
  if (states.sort === 'name') matches.sort((a, b) => a.name.localeCompare(b.name));
  if (states.sort === 'distance') matches.sort((a, b) => a.miles[Math.max(region, 0)] - b.miles[Math.max(region, 0)]);
  return matches;
}

function resourceCard(item) {
  return `<article class="resource-card" data-card="${item.number}">
    <a href="${resources}/${item.id}" class="resource-card-link"><h3>${states.view === 'split' ? `<span>${item.number}</span>` : ''}${item.name}</h3>
    ${states.categories.size ? `<p class="resource-category">${item.category.includes(categories[2]) ? categories[2] : item.category[0]}</p>` : ''}
    <p class="location">${item.area}, KY · Illustrative location</p><p>${item.description}</p>
    <div><strong>View details →</strong><span>Address &amp; contact information</span></div></a>
    <button class="bookmark" type="button" aria-label="Save ${item.name}" data-unavailable></button></article>`;
}

function resultList(items) {
  if (!items.length) {
    return '<p class="resource-card empty">No resources match your filters. Try another ZIP code, increase Miles Away, or clear a filter.</p>';
  }
  if (states.grouped) {
    return categories.map((category, index) => {
      const members = items.filter(item => {
        const group = [...item.category].reverse().find(value => states.categories.has(value)) || item.category[0];
        return group === category;
      });
      if (!members.length) return '';
      const visible = states.expanded ? members : members.slice(0, 1);
      return `<section class="category-results"><h2>${category}</h2>${visible.map(resourceCard).join('')}
        ${members.length > 1 ? `<button type="button" class="inline-action" data-expand="${index}">${states.expanded ? 'Show fewer' : `View ${members.length - 1} more in this category →`}</button>` : ''}</section>`;
    }).join('') + (states.categories.has(categories[2]) ? `<section class="category-results"><h2>Additional support</h2>${resourceCard(listings[2])}</section>` : '');
  }
  if (states.view === 'list') {
    return `${states.categories.size === 1 ? `<h2>${[...states.categories][0]}</h2>` : ''}${items.map(resourceCard).join('')}`;
  }
  const start = states.page * 3;
  return items.slice(start, start + 3).map(resourceCard).join('') + `<div class="pagination"><span>Showing ${start + 1}–${Math.min(start + 3, items.length)} of ${items.length}</span>
    ${states.page ? '<button type="button" class="inline-action" data-page="0">← Previous</button>' : ''}
    ${items.length > start + 3 ? '<button type="button" class="inline-action" data-page="1">Next →</button>' : ''}</div>`;
}

function mapPanel(items) {
  const item = items.find(result => result.id === states.selected);
  return `<section class="resource-map" aria-label="Resource map">
    <div class="map-plane" style="--zoom:${states.zoom}"><canvas id="map-art" width="900" height="540" aria-hidden="true"></canvas>
    ${items.map(r => `<button type="button" class="map-pin${item === r ? ' selected' : ''}" data-pin="${r.number}" style="left:${r.point[0]}%;top:${r.point[1]}%" aria-label="${r.number}. ${r.name}" aria-pressed="${item === r}"><span>${r.number}</span></button>`).join('')}</div>
    <span class="map-location">◫ &nbsp; Lexington area</span>
    <div class="map-controls"><button type="button" data-view="${states.view === 'map' ? 'split' : 'map'}" aria-label="${states.view === 'map' ? 'Minimize map' : 'Expand map'}">⤢</button><button type="button" data-zoom="1" aria-label="Zoom in">+</button><button type="button" data-zoom="-1" aria-label="Zoom out">−</button><button type="button" data-zoom="0" aria-label="Reset map view">◎</button></div>
    <span class="map-scale">━━━━ &nbsp;1 mi</span><span class="map-credit">Illustrative map · Not for navigation</span>
    ${item ? `<article class="map-preview"><button type="button" class="preview-close" data-close-pin aria-label="Close resource preview">×</button>
      <span>Selected resource</span><h2>${item.name}</h2><p class="resource-category">${item.category[0]}</p>
      <p>${item.area}, KY<br>Illustrative location<br>Address &amp; contact details in full listing</p><p>${item.description}</p>
      <a class="primary" href="${resources}/${item.id}">View details →</a></article>` : ''}</section>`;
}

function drawMap(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e9ede4';
  ctx.fillRect(0, 0, 900, 540);
  const path = (points, color, width) => {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) {
      if (point.length === 6) ctx.bezierCurveTo(...point);
      else ctx.lineTo(...point);
    }
    if (width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  };
  path([[0, 0], [190, 0], [148, 112], [0, 126]], '#d5e3cc');
  path([[33, 384], [211, 431], [193, 535], [0, 535]], '#d5e3cc');
  path([[644, 322], [860, 292], [900, 416], [717, 434]], '#d5e3cc');
  path([[714, -5], [488, 118, 855, 157, 659, 261], [458, 355, 674, 403, 918, 518]], '#bed9df', 10);
  for (const y of [115, 200, 285, 366, 440]) path([[35, y], [866, y + 45]], '#fff', 7);
  for (const x of [65, 181, 294, 425, 558, 690, 822]) path([[x, 94], [x - 49, 489]], '#fff', 6);
  path([[34, 480], [784, 71], [666, 475], [120, 128]], '#fff', 6);
  const highway = [[-5, 368], [199, 296, 380, 324, 546, 273], [695, 233, 811, 192, 921, 166]];
  const cross = [[359, 551], [385, 374, 480, 346, 487, 232], [490, 162, 476, 110, 563, -8]];
  for (const route of [highway, cross]) {
    path(route, '#d6c8a7', 11);
    path(route, '#f8edcf', 7);
  }
  ctx.fillStyle = '#667665';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Lexington', 358, 325);
  ctx.font = '12px Arial';
  ctx.fillText('NORTHSIDE', 452, 112);
  ctx.fillText('DOWNTOWN', 77, 328);
  ctx.fillText('Community park', 724, 418);
}

function showResources(root, output) {
  const items = findListings();
  const list = states.view !== 'map';
  const map = states.view !== 'list';
  const focused = document.activeElement;
  const focusKey = focused?.closest('#resource-results') && [...focused.attributes].find(attribute => ['data-pin', 'data-close-pin', 'data-zoom', 'data-page', 'data-view', 'data-group', 'data-sort'].includes(attribute.name));
  root.querySelector('#resource-count').textContent = states.grouped && list ? 'Resources grouped by category' :
    `${items.length} ${items.length === 1 ? 'resource' : 'resources'}${/^\d{5}$/.test(states.zip) ? ' near ' + states.zip : ''}`;
  root.querySelector('#resource-subtitle').textContent = list ? 'Find nearby support and services.' : 'Map view · Explore support and services near you.';
  root.querySelectorAll('.view-switch button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === states.view)));
  root.querySelector('#miles-value').textContent = states.miles + ' mi';
  output.innerHTML = `<div class="resource-content ${states.view}">
    ${list ? `<div class="resource-list"><div class="list-tools"><span>${states.view === 'split' ? 'All resources' : ''}</span>
      <label>Sort: <select data-sort aria-label="Sort resources"><option value="relevance">Relevance</option><option value="distance"${states.sort === 'distance' ? ' selected' : ''}>Distance</option><option value="name"${states.sort === 'name' ? ' selected' : ''}>Name</option></select></label></div>
      ${states.view === 'list' ? `<button type="button" class="inline-action group-toggle" data-group aria-pressed="${states.grouped}">Group by category ${states.grouped ? '●' : '○'}</button>` : ''}
      <div class="chips">${['categories', 'hours'].flatMap(key => [...states[key]].map(value => `<button type="button" class="chip" data-remove-key="${key}" data-remove-value="${value}" aria-label="Remove ${value} filter">${value} ×</button>`)).join('')}</div>
      ${resultList(items)}${states.view === 'split' ? sample() : ''}
      </div>` : ''}
    ${map ? mapPanel(items) : ''}</div>${states.view !== 'split' ? sample() : ''}`;
  if (map) drawMap(output.querySelector('canvas'));
  if (focusKey) {
    const sameControl = [...output.querySelectorAll(`[${focusKey.name}]`)].find(element => element.getAttribute(focusKey.name) === focusKey.value);
    sameControl?.focus({ preventScroll: true });
  }
}

const sample = () => '<p class="sample">Illustrative listings for this prototype. Locations, contact details and service availability are not verified.</p>';

function resourceDetail(item) {
  return `${header('detail')}<main class="ky-resource"><div class="ky-wide recovery-detail">
    <div class="crumb"><a href="${home}">Home</a> / <a href="${assistance}">Benefits and Assistance</a> / <a href="${resources}">Substance use</a> / ${item.name}</div>
    <a class="back-link" href="${resources}">← Back to resources</a>
    <article class="resource-card"><h1>${item.name}</h1><p class="resource-category">${item.category.join(' · ')}</p><p>${item.description}</p>
      <h2>Services</h2><p>${item.service}</p><h2>Hours</h2><p>${item.schedule}</p>
      <h2>Location</h2><p>${item.area}, KY · Illustrative location</p>
    </article>${sample()}</div></main>${footer()}`;
}

function bindResources(root) {
  const output = root.querySelector('#resource-results');
  const panel = root.querySelector('.resource-grid');
  const update = () => showResources(root, output);
  const refresh = () => { states.page = 0; states.selected = null; update(); };
  const setFilter = (key, value, enabled) => {
    states[key][enabled ? 'add' : 'delete'](value);
    refresh();
  };
  panel.addEventListener('input', event => {
    const field = event.target;
    if (field.id === 'zip') {
      field.value = field.value.replace(/\D/g, '');
      states.zip = field.value;
    } else if (field.id === 'miles') states.miles = Number(field.value);
    else if (field.dataset.filter) {
      setFilter(field.dataset.filter, field.value, field.checked);
      return;
    } else return;
    refresh();
  });
  panel.addEventListener('change', event => {
    if (!event.target.matches('[data-sort]')) return;
    states.sort = event.target.value;
    refresh();
  });
  root.querySelector('.ky-resource').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset;
    if (action.view) {
      states.view = action.view;
      if (states.view !== 'list') states.grouped = false;
      update();
    } else if ('reset' in action) {
      Object.assign(states, { zip: '40507', miles: 500, page: 0, selected: null });
      states.categories.clear();
      states.hours.clear();
      root.querySelector('#zip').value = states.zip;
      root.querySelector('#miles').value = states.miles;
      panel.querySelectorAll('[data-filter]').forEach(input => { input.checked = false; });
      update();
    } else if (action.removeKey) {
      const control = [...panel.querySelectorAll('[data-filter]')].find(input => input.dataset.filter === action.removeKey && input.value === action.removeValue);
      control.checked = false;
      setFilter(action.removeKey, action.removeValue, false);
      control.focus();
    } else if (action.page) {
      states.page = Number(action.page);
      update();
    } else if ('group' in action) {
      states.grouped = !states.grouped;
      states.expanded = false;
      update();
    } else if ('expand' in action) {
      states.expanded = !states.expanded;
      update();
    } else if (action.pin) {
      const id = listings.find(item => item.number === Number(action.pin)).id;
      states.selected = states.selected === id ? null : id;
      update();
    } else if ('closePin' in action) {
      const number = listings.find(item => item.id === states.selected)?.number;
      states.selected = null;
      update();
      output.querySelector(`[data-pin="${number}"]`)?.focus();
    } else if ('zoom' in action) {
      states.zoom = Number(action.zoom) ? Math.min(1.6, Math.max(1, states.zoom + Number(action.zoom) * 0.2)) : 1;
      update();
    }
  });
  function highlight(event, active) {
    const card = event.target.closest('[data-card]');
    if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
    output.querySelector(`[data-pin="${card.dataset.card}"]`)?.classList.toggle('highlight', active);
  }
  output.addEventListener('mouseover', event => highlight(event, true));
  output.addEventListener('mouseout', event => highlight(event, false));
  output.addEventListener('focusin', event => highlight(event, true));
  output.addEventListener('focusout', event => highlight(event, false));
  update();
}

export function benefits(root, page, id) {
  const item = page === 'resources' && listings.find(entry => entry.id === id);
  document.title = item?.name || (page === 'resources' ? 'Resources for those impacted by substance use' : page === 'assistance' ? 'Benefits and Assistance' : 'kynect');
  root.innerHTML = item ? resourceDetail(item) : page === 'resources' ? resourcePage() : page === 'assistance' ? assistancePage() : landing();
  root.querySelector('#ky-language').addEventListener('change', event => {
    event.target.value = '';
    document.querySelector('#unavailable').showModal();
  });
  root.querySelectorAll('[data-section]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const section = link.dataset.section;
    if (page === 'assistance') {
      categoryJump = section;
      root.querySelectorAll('[data-section]').forEach(item => item.classList.toggle('current', item === link));
    }
    document.getElementById(section).scrollIntoView();
  }));
  if (page === 'assistance' && categoryJump) requestAnimationFrame(() => document.getElementById(categoryJump)?.scrollIntoView());
  if (page === 'resources' && !item) bindResources(root);
}
