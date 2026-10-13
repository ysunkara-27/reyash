export const DAY = 86400000;
export function plain(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, x => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[x]).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, ' ').trim();
}
export function safeURL(value) { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; } }
export function matchJob(raw, now = Date.now()) {
  const title = plain(raw.title), description = plain(raw.description), text = `${title} ${description}`;
  if (!safeURL(raw.url) || !/\b(intern(?:ship)?s?|student (?:trainee|assistant|volunteer|research assistant)|co-?op|undergraduate research)\b/i.test(title)) return null;
  if (raw.closesAt && Date.parse(raw.closesAt) < now) return null;
  // A title must describe a relevant placement; incidental equal-opportunity language is not a match.
  const relevant = /data|analy[stzi]|informatics|information (?:technology|systems)|computer|statistics|research|testing|quality|public health|health insurance|medical and health|epidemiolog|biostatistic|program (?:support|evaluation)/i;
  if (!relevant.test(title) && !/data analy|data clean|informatics|statistical analy|software test|quality assurance|health research|public health research/i.test(description) && !(raw.sector==='healthcare' && /analy[stz]|research|informatics|testing|statistics/i.test(description))) return null;
  if (/\b(?:postdoctoral|post-doctoral|medical resident|pharmacy|nursing|legal|law clerk)\b/i.test(title)) return null;
  const warnings = [];
  let eligibility = 'review';
  const required = description.split(/preferred (?:qualifications|skills|experience)/i)[0];
  if (/\b(?:freshm[ae]n|first[- ]year (?:college|undergraduate)|all (?:class|year) levels)\b/i.test(description)) eligibility = 'first-year';
  if (/(?:must|required|seeking|only|currently|rising|enrolled)[^.]{0,70}\b(?:juniors?|seniors?)|completed (?:at least )?(?:two|2|three|3) years|(?:junior|senior)[- /]level/i.test(description) || (!/bachelor|undergraduate/i.test(description) && /(?:must|required|seeking|currently|enrolled|pursuing)[^.]{0,70}\b(?:graduate students?|master'?s|doctoral|ph\.?d)/i.test(description))) {
    eligibility = 'later'; warnings.push('Check year of study: upper-level or graduate requirements mentioned.');
  }
  const grad = description.match(/(?:graduat(?:e|ing|ion)|degree completion)[^.]{0,100}?(20\d{2})(?:[^.]{0,35}?(20\d{2}))?/i);
  if (grad) {
    const years = grad.slice(1).filter(Boolean).map(Number);
    if (years.every(y => y < 2029) && !/or later|or after|onward|prior to|before/i.test(grad[0])) { eligibility = 'later'; warnings.push(`Graduation requirement mentions ${years.join('–')}; check against 2029 / 2030.`); }
  }
  if (/(?:at least |minimum of )?(?:four|4|six|6)(?: or more)? semesters|(?:two|2) years of (?:successfully )?completed education/i.test(required)) {eligibility='later';warnings.push('The posting mentions at least two years of college or four semesters.');}
  if (/(?:completed|earned|hold|have) (?:a )?bachelor[’']?s? degree/i.test(required)) { eligibility = 'later'; warnings.push('A completed bachelor’s degree is mentioned in the requirements.'); }
  const credits = required.match(/(?:minimum of|at least)\s+(\d+)\s+(?:completed?\s+)?(?:college[- ](?:level )?)?credit hours/i)?.[1];
  if (credits) { warnings.push(`At least ${credits} college credits are required; verify whether these must be completed by application or start date.`); if(Number(credits)>=60)eligibility='later'; }
  if (/\b(?:active|current|possess|hold)[^.]{0,45}(?:security clearance|TS\/SCI|top secret)/i.test(text)) { eligibility = 'later'; warnings.push('Existing security clearance may be required.'); }
  if (eligibility === 'review') warnings.push('First-year eligibility is not confirmed. Read the education requirements.');
  const local = /\b(?:Washington,? (?:DC|District of Columbia)|District of Columbia|Fairfax|Arlington,? (?:VA|Virginia)|Reston|McLean|Bethesda|Rockville|Falls Church|Alexandria,? (?:VA|Virginia)|Chantilly|Herndon|Tysons|Vienna,? (?:VA|Virginia)|Silver Spring|College Park|Greenbelt|Gaithersburg|DC|D\.C\.)\b/i.test(raw.location || '');
  const remote = raw.mode === 'remote' || /\bremote\b/i.test(raw.location || '');
  const track = /test|quality assurance|quality engineering/i.test(title) ? 'Testing & quality' : /informatic|information (?:technology|systems)|computer/i.test(title) ? 'Health informatics' : /data|analy|statistic/i.test(title) ? 'Data & analysis' : 'Public health & research';
  const health = raw.sector === 'healthcare' || /health|clinical|medical|patient|epidemiolog|biostatistic|medicare|medicaid/i.test(title + ' ' + raw.company) || /public health|health(?:care)? (?:data|research|analytics|informatics)|patient data|clinical (?:data|research)|epidemiolog|biostatistic/i.test(description);
  const government = raw.sector === 'government';
  const range = text.match(/\$[\d,.]+\s*(?:–|-|to)\s*\$?[\d,.]+(?:\s*(?:per|\/)\s*(?:hour|year))?/i)?.[0];
  const hourly = text.match(/\$[\d,.]+\s*(?:per\s+|\/)hour/i)?.[0];
  const salary = raw.salary || hourly || (range ? `${range}${/hour|year/i.test(range)?'':' · see pay basis'}` : null);
  const unpaid = /\bunpaid\b|without compensation|non-paid/i.test(text);
  const score = (government ? 40 : raw.sector === 'contractor' ? 20 : 0) + (health ? 25 : 0) + (local ? 18 : 0) + (remote ? 15 : 0) + (eligibility === 'first-year' ? 25 : eligibility === 'later' ? -90 : 0) + (/data|analy|informatic/i.test(title) ? 12 : 0);
  return {...raw, id: String(raw.id || raw.url), title, description: description.slice(0,22000), url: safeURL(raw.url), track, health, local, mode: remote ? 'remote' : raw.mode || 'unspecified', salary, unpaid, eligibility, credits:credits?Number(credits):null, warnings, score, reasons: [government ? 'Government mission' : health ? 'Healthcare experience' : 'Transferable data skills', local ? 'Near George Mason' : remote ? 'Remote option' : 'Broaden your search', track]};
}
export function rankJobs(jobs, now = Date.now()) {
  const seen = new Set();
  return jobs.map(j => matchJob(j, now)).filter(j => j && !seen.has(j.url) && seen.add(j.url)).sort((a,b) => b.score-a.score || (Date.parse(b.postedAt)||0)-(Date.parse(a.postedAt)||0));
}
