// Derived from the supplied resume. No name, contact details, or resume file is published.
export const DAY = 86_400_000;
export function plain(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi, entity => {
    const named = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' };
    if (named[entity]) return named[entity];
    const n = entity.startsWith('&#x') ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ' ';
  }).replace(/\s+/g, ' ').trim();
}
export function safeURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export function roleType(title) {
  if (/\b(intern|junior|jr\.?|trainee|entry[ -]level|assistant|coordinator)\b/i.test(title)) return null;
  if (/\b(scrum master|agile (?:coach|lead|manager)|release train engineer)\b/i.test(title)) return 'agile';
  if (/\b(SDM|software development supervisor|engineering supervisor)\b/i.test(title)) return 'engineering';
  if (/\bproject management\b/i.test(title) && /\b(manager|director|lead)\b/i.test(title)) return 'project';
  if (/\b(portfolio|program) management\b/i.test(title) && /\b(manager|director|lead)\b/i.test(title)) return 'program';
  if (/\b(service delivery|application support|IT operations|technology operations|release|digital transformation)\b.*\b(manager|lead|director)\b/i.test(title)) return 'it';
  if (/\bsupervisory\b.*\b(IT|information technology)\b/i.test(title)) return 'it';
  if (/\b(IT|information technology) specialist\b.*\b(PROJMGT|project management)\b/i.test(title)) return 'project';
  if (/\b(engineering|software|development)\b.*\b(manager|director|head)\b|\b(manager|director|head)\b.*\b(engineering|software|development)\b/i.test(title)) return 'engineering';
  if (/\b(program|programme)\s+(manager|director|lead)\b/i.test(title)) return 'program';
  if (/\bproject\s+(manager|director|lead)\b/i.test(title)) return 'project';
  if (/\b(IT|information technology|technology|application|applications|technical|delivery)\b.*\b(manager|director|supervisor|lead)\b|\b(manager|director|supervisor)\b.*\b(IT|information technology|technology|applications)\b/i.test(title)) return 'it';
  if (/\b(product (?:owner|leader)|product management)\b/i.test(title)) return 'agile';
  return null;
}
export function workMode(text = '') {
  if (/\bhybrid\b/i.test(text)) return 'hybrid';
  if (/\b(no remote|not remote|on[ -]?site|in[ -]office)\b/i.test(text)) return 'onsite';
  if (/\b(remote|telecommute|telework|work from home)\b/i.test(text)) return 'remote';
  return 'unknown';
}
export function matchJob(job, now = Date.now()) {
  const title = plain(job.title), description = plain(job.description), role = roleType(title);
  const posted = Date.parse(job.postedAt), closes = Date.parse(job.closesAt);
  if (!role || !safeURL(job.url) || !Number.isFinite(posted) || posted > now + DAY || now - posted > 30 * DAY || (Number.isFinite(closes) && closes < now)) return null;
  if (/\b(construction|civil engineering|mechanical|electrical|manufacturing|clinical|nursing|facilities|real estate|directed energy|weapons|hardware engineering)\b/i.test(title)) return null;
  const text = `${title} ${description}`;
  if (!/\b(software|information technology|digital|application|agile|scrum|cloud|engineering team|DevOps|SaaS)\b/i.test(text) && !/\bIT\b/.test(text)) return null;
  const requiresActiveClearance = /\b(active|current)\b.{0,45}\b(TS\/SCI|top secret|secret|clearance|polygraph)\b/i.test(description);
  const reasons = [], considerations = [];
  if (requiresActiveClearance) considerations.push('Active clearance required; the resume does not establish an existing clearance.');
  let score = 52;
  if (/\b(manage|managing|lead|leading|mentor|coaching|people management)\b.{0,100}\b(team|engineer|developer|staff|people)/i.test(description)) {
    score += 14; reasons.push('Led 20+ engineers, analysts, testers, and designers; mentored staff and supported hiring.');
  }
  if (/\b(agile|scrum|sprint|product owner)\b/i.test(text)) {
    score += 12; reasons.push('Certified Scrum Master and Product Owner with Agile delivery and sprint reporting experience.');
  }
  if (/\b(stakeholder|roadmap|project plan|program delivery|cross.functional|vendor|dependencies)\b/i.test(description)) {
    score += 10; reasons.push('Delivered cross-team platforms with project plans, dependencies, vendors, and senior stakeholders.');
  }
  if (/\b(production support|application operations|incident|operational excellence|reliability|observability)\b/i.test(description)) {
    score += 10; reasons.push('Oversaw five business-critical applications and production support; reduced production errors by 90%.');
  }
  if (/\b(insurance|underwriting|policyholder|quoting)\b/i.test(description) || job.company === 'Progressive') {
    score += 12; reasons.push('Deep insurance technology experience across quoting, multi-policy bundling, and agent platforms.');
  }
  if (/\b(azure|jira|splunk|application insights|SQL|confluence)\b/i.test(description)) {
    score += 5; reasons.push('Resume includes Azure certifications and experience with delivery, analytics, and monitoring tools.');
  }
  if (/\b(PMP)\b.{0,50}\b(required|must)\b|\b(required|must)\b.{0,50}\bPMP\b/i.test(description)) considerations.push('PMP required; not listed on the resume.');
  if (/\b(clearance|public trust|citizen|citizenship)\b/i.test(description)) considerations.push('Check citizenship and clearance requirements in the posting.');
  if (/\b(hands.on|proficien\w*|expert\w*)\b.{0,70}\b(coding|programming|python|java|react|golang|C\+\+)\b/i.test(description)) considerations.push('Check hands-on coding requirements; the resume lists several languages under management experience.');
  if (/\b(vice president|VP|chief|senior director)\b/i.test(title)) return null;
  if (/\b(director|head)\b/i.test(title)) { score -= 8; considerations.push('Director scope may be a step up from her current role.'); }
  if (score < 72 || reasons.length < 2) return null;
  return { id: job.id || job.url, title, company: job.company, sector: job.sector, priority: job.company === 'Progressive' ? 0 : job.sector === 'federal' ? 1 : job.sector === 'contractor' ? 2 : 3,
    location: plain(job.location) || 'Location not listed', mode: job.mode || 'unknown', salary: job.salary || null,
    postedAt: new Date(posted).toISOString(), dateLabel: job.dateLabel || 'Posted', closesAt: Number.isFinite(closes) ? new Date(closes).toISOString() : null,
    searchText: text.toLowerCase().slice(0, 24000), sourceId: job.sourceId || null,
    url: safeURL(job.url), role, requiresActiveClearance, score: Math.min(score, 98), strength: score >= 88 ? 'Strong match' : 'Good match', reasons: reasons.slice(0, 2), considerations };
}
export function rankJobs(jobs, now = Date.now()) {
  const seen = new Set();
  return jobs.map(j => matchJob(j, now)).filter(Boolean).sort((a, b) => a.priority - b.priority || Date.parse(b.postedAt) - Date.parse(a.postedAt) || b.score - a.score).filter(j => {
    const canonical = new URL(j.url); canonical.hash = '';
    for (const key of [...canonical.searchParams.keys()]) if (/^(utm_|gh_src$|source$|ref$|tracking$)/i.test(key)) canonical.searchParams.delete(key);
    canonical.searchParams.sort();
    const identity = `${j.company.toLowerCase()}|${String(j.id).toLowerCase()}`;
    const semantic = `${j.company}|${j.title}|${j.location}`.toLowerCase();
    const keys = [identity, canonical.href, semantic];
    if (keys.some(k => seen.has(k))) return false;
    keys.forEach(k => seen.add(k)); return true;
  });
}
