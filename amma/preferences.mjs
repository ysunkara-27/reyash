export const STATUS_KEY = 'amma-applied-v1';
export function jobKey(job) { return `${job.company.toLowerCase()}|${job.id || job.url}`; }
export function readApplied(storage) {
  try {
    const data = JSON.parse(storage.getItem(STATUS_KEY) || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([, v]) => v?.job && typeof v.job.title === 'string' && /^https:\/\//.test(v.job.url) && Number.isFinite(Date.parse(v.appliedAt))));
  } catch { return {}; }
}
export function toggleApplied(applied, job, now = new Date().toISOString()) {
  const next = { ...applied }, key = jobKey(job);
  if (next[key]) delete next[key];
  else next[key] = { appliedAt: now, job: { ...job, searchText: `${job.title} ${job.company} ${job.reasons.join(' ')}` } };
  return next;
}
export function keywordMatch(job, query = '') {
  const text = [job.title, job.company, job.location, job.searchText, ...(job.reasons || [])].join(' ').toLowerCase();
  // Commas mean alternatives; words in an alternative must all appear. No arbitrary regex.
  return !query.trim() || query.toLowerCase().split(',').filter(s => s.trim()).some(phrase => phrase.trim().split(/\s+/).every(word => text.includes(word)));
}
