import { decoy, escapeText as esc } from './ui.mjs';

const department = 'Health and Family Services';
const jobs = [
  { id: 'healthcare-administrator', title: 'Healthcare Administrator II', department, city: 'Frankfort', county: 'Franklin County', closes: 'January 15, 2027', field: 'Healthcare', type: 'Full-time', posted: 'November 20, 2026', newest: true,
    description: 'The Healthcare Administrator II position is responsible for planning, directing, and coordinating medical and health services within a designated facility or program area. This role works under the administrative oversight of the Department for Medicaid Services and collaborates closely with clinical and operations staff across Health and Family Services.',
    salary: '$54,600 – $71,500 annually', schedule: 'Monday – Friday, 8:00 AM – 4:30 PM', benefits: 'Yes — full state benefits package',
    requirements: ["Bachelor's degree in healthcare administration, public health, business, or a related field", 'Minimum two years of experience in a healthcare, government, or administrative setting', 'Demonstrated ability to coordinate across teams and communicate policy or operational guidance clearly', "Valid driver's license and willingness to travel within the state as required"] },
  { id: 'family-support', title: 'Family Support Specialist', department, city: 'Frankfort', county: 'Franklin County', closes: 'December 4, 2026', field: 'Family Support and Social Work', type: 'Full-time', posted: 'November 16, 2026',
    description: 'Help Kentucky families understand program eligibility, gather documentation, and connect with available benefits and services.', salary: '$39,000 – $52,000 annually', schedule: 'Monday – Friday, 8:00 AM – 4:30 PM', benefits: 'Yes — full state benefits package', requirements: ['Experience in client services or public assistance', 'Ability to explain program requirements clearly'] },
  { id: 'public-health', title: 'Public Health Program Assistant', department, city: 'Lexington', county: 'Fayette County', closes: 'December 11, 2026', field: 'Healthcare', type: 'Part-time' },
  { id: 'administrative', title: 'Administrative Specialist', department: 'Education and Labor', city: 'Frankfort', county: 'Franklin County', closes: 'December 18, 2026', field: 'Administration', type: 'Full-time' },
  { id: 'maintenance', title: 'Highway Maintenance Worker', department: 'Transportation', city: 'Louisville', county: 'Jefferson County', closes: 'December 22, 2026', field: 'Operations', type: 'Full-time' }
];
const fields = [
  { key: 'department', label: 'Hiring Department', options: [department, 'Education and Labor', 'Transportation'], help: 'The government organization offering the position.' },
  { key: 'field', label: 'Career Field', options: ['Healthcare', 'Family Support and Social Work', 'Administration', 'Operations'], help: 'The type of work you would do in the position.' },
  { key: 'city', label: 'City or County', options: ['Frankfort', 'Franklin County', 'Lexington', 'Fayette County', 'Louisville', 'Jefferson County'] },
  { key: 'type', label: 'Employment Type', options: ['Full-time', 'Part-time', 'Temporary', 'Seasonal'] }
];
const blank = () => ({ keyword: '', department: '', field: '', city: '', type: '' });
let applied = blank();

function header(page) {
  return `<header class="career-header"><a class="career-brand" href="#careers"><span>KY</span>Kentucky Government Careers</a>
    <nav aria-label="Careers">${page === 'openings' ? '<a class="current" href="#careers/openings">Current openings</a>' : ''}
    ${page ? decoy('Application help') : ''}${decoy('Employee Login')}</nav></header>`;
}

function landing() {
  return `${header('')}<main class="career-landing">
    <section class="career-hero"><h1>Your next chapter.<br>Kentucky's future.</h1>
    <p>Put your skills to work in public service. Browse open positions across Kentucky government.</p>
    <a class="primary" href="#careers/openings">Find Current Openings</a><div class="browse-note"><span aria-hidden="true">↗</span> Browse all available positions</div></section>
    <section class="career-cards" aria-label="Career resources">
    ${[
      ['♧', 'Career Fields', 'Explore the types of roles available across Kentucky government agencies.', 'View Career Fields'],
      ['◷', 'Employment Types', 'Full-time, part-time, temporary, and seasonal positions explained clearly.', 'View Employment Types'],
      ['ⓘ', 'Application Help', 'Step-by-step guidance on completing and submitting your state application.', 'Get Application Help']
    ].map(([icon, title, description, link]) => `<article><span class="career-icon" aria-hidden="true">${icon}</span><h2>${title}</h2><p>${description}</p>${decoy(link + ' →', 'inline-action')}</article>`).join('')}
    </section></main><footer class="career-footer"><div>${decoy('<strong>Benefits</strong> &nbsp; View →')}${decoy('<strong>Employee Resources</strong> &nbsp; View →')}${decoy('Employee Login', 'secondary')}</div></footer>`;
}

function fieldHelp(field) {
  return field.help ? `<span class="tip-wrap"><button class="tip" type="button" aria-label="About ${field.label}" aria-describedby="tip-${field.key}">i</button><span class="tooltip" id="tip-${field.key}" role="tooltip">${field.help}</span></span>` : '';
}

function openings() {
  return `${header('openings')}<main class="career-main">
    <div class="crumb"><a href="#careers">Home</a> / Current openings</div>
    <h1>Current Job Openings</h1><p class="subtitle">Find a role where your work makes a difference for Kentucky.</p>
    <form id="career-form">
      <label class="field-label" for="keyword">Search by keyword</label>
      <div class="keyword"><span aria-hidden="true">⌕</span><input id="keyword" name="keyword" type="search" placeholder="Job title or keyword" value="${esc(applied.keyword)}"></div>
      <p class="input-note">Use Apply Filters below to search your keyword and selected filters together.</p>
      <div class="career-grid"><aside><h2>Filter jobs</h2>
      ${fields.map(field => `<div class="career-field"><div class="field-label"><label for="${field.key}">${field.label}</label>${fieldHelp(field)}</div>
        <select name="${field.key}" id="${field.key}"><option value="">Any</option>${field.options.map(value => `<option${applied[field.key] === value ? ' selected' : ''}>${value}</option>`).join('')}</select></div>`).join('')}
        <button class="primary filter-apply" type="submit">Apply Filters</button><button class="inline-action filter-clear" type="button" id="clear-jobs">Clear Filters</button></aside>
      <section id="job-results" aria-live="polite"></section></div>
    </form>
    </main>`;
}

function showJobs(container) {
  const matches = jobs.filter(job => {
    const searchable = [job.title, job.department, job.field, job.description].join(' ').toLowerCase();
    return applied.keyword.toLowerCase().split(/\s+/).every(word => searchable.includes(word)) &&
      fields.every(({ key }) => !applied[key] || job[key] === applied[key] || (key === 'city' && job.county === applied.city));
  });
  container.innerHTML = `<div class="results-bar"><h2>${matches.length} matching ${matches.length === 1 ? 'job' : 'jobs'}</h2>
    <span>${matches.length ? `Showing 1–${matches.length} of ${matches.length}` : 'Showing 0 of 0'}</span></div>
    <div class="chips">${Object.entries(applied).filter(([, value]) => value).map(([key, value]) => `<button type="button" class="chip" data-remove="${key}" aria-label="Remove ${esc(value)} filter">${esc(value)} ×</button>`).join('')}</div>
    ${matches.length ? matches.map(job => `<article class="job-card">
      ${job.newest ? '<span class="new-label">NEW</span>' : ''}<h3>${job.title}</h3><p>${job.department}</p>
      <div class="job-card-bottom"><div><span class="job-location"><span class="pin-icon" aria-hidden="true"></span>${job.city}</span><span>Closes ${job.closes}</span><span>${job.type}</span></div>${job.description ? `<a href="#careers/job/${job.id}" class="secondary">View Job</a>` : decoy('View Job', 'secondary')}</div>
    </article>`).join('') : '<p class="job-card empty">No jobs match your filters. Clear a filter or try a different keyword.</p>'}
    <p class="sample">Illustrative job listings · Not live vacancies</p>`;
}

function details(job) {
  return `${header('job')}<main class="career-main detail-main">
    <div class="crumb"><a href="#careers">Home</a> / <a href="#careers/openings">Current openings</a> / ${job.title}</div>
    <a class="back-link" href="#careers/openings">← Back to Current openings</a>
    <div class="career-grid"><aside class="search-summary"><h2>Your search</h2>
      ${fields.map(field => `<div class="career-field"><div class="field-label">${field.label}${fieldHelp(field)}</div><div class="readonly">${esc(applied[field.key] || 'Any')}</div></div>`).join('')}
      <a class="secondary" href="#careers/openings">Change Search</a></aside>
    <article class="job-detail">
      <div class="detail-head"><div><h1>${job.title}</h1><p class="subtitle">${job.department}</p></div><div>${decoy('Apply Now', 'primary')}<div class="detail-actions">${decoy('Save to list', 'inline-action')}${decoy('Share', 'inline-action')}</div></div></div>
      <dl class="job-facts">${[['Location', job.city + ', KY'], ['Employment type', job.type], ['Closes', job.closes], ['Career field', job.field], ['Posted', job.posted]].map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl>
      <section><h2>About this position</h2><p>${job.description}</p></section>
      <section><h2>Details</h2><dl class="job-details">${[['Salary range', job.salary], ['Work schedule', job.schedule], ['Benefits eligible', job.benefits]].map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl></section>
      <section><h2>Requirements</h2><ul>${job.requirements.map(item => `<li>${item}</li>`).join('')}</ul></section>
      <div class="ready"><div><h2>Ready to apply?</h2><p>Complete the state application form and attach your résumé. Applications close ${job.closes}.</p></div>${decoy('Apply Now', 'primary')}</div>
      <p class="sample">Illustrative job listing · Not a live vacancy · Closing dates are examples only</p>
    </article></div></main>`;
}

export function careers(root, page, id) {
  const job = page === 'job' && jobs.find(item => item.id === id && item.description);
  document.title = job?.title || (page === 'openings' ? 'Current Job Openings' : 'Kentucky Government Careers');
  root.innerHTML = job ? details(job) : page === 'openings' ? openings() : landing();
  if (page !== 'openings') return;
  const form = root.querySelector('#career-form');
  const results = root.querySelector('#job-results');
  const update = () => showJobs(results);
  form.addEventListener('submit', event => {
    event.preventDefault();
    applied = Object.fromEntries(new FormData(form));
    applied.keyword = applied.keyword.trim();
    update();
  });
  root.querySelector('#clear-jobs').addEventListener('click', () => {
    applied = blank();
    for (const key of Object.keys(applied)) form.elements[key].value = '';
    update();
  });
  results.addEventListener('click', event => {
    const key = event.target.closest('[data-remove]')?.dataset.remove;
    if (!key) return;
    applied[key] = '';
    form.elements[key].value = '';
    update();
  });
  update();
}
