export const escapeText = text => String(text).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

export const decoy = (label, className = '') =>
  `<button type="button" class="${className}" data-unavailable>${label}</button>`;
