const types = ['Eraser', 'Chalkboard eraser', 'Cleaning cloth', 'Replacement pad', 'Pencil eraser', 'Whiteboard wipes'];
const brands = ['E-Z Wipe', 'Obliterate', 'BoardRoom', 'WipeGPT', 'FeltSense', 'Null & Void', 'EraseCorp', 'Sponge.AI'];
const variants = ['Compact Edition', 'Enterprise Mini', 'Professional Max', 'Executive Felt', 'Cloud Edition', 'Studio Standard'];
export const REQUIREMENTS = { type: 'Eraser', dry: true, safe: true, ai: 'AI-Optimized', surface: 'Whiteboard' };
export const MISSION_SECONDS = 210;
export const SECRET_SEARCH = 'yashwipe';
export function isCorrect(p) { return Boolean(p && p.price < 5 && Object.entries(REQUIREMENTS).every(([key, value]) => p[key] === value)); }
export const products = Array.from({ length: 101 }, (_, index) => {
  const i = index === 8 ? 137 : index;
  const p = { id: i + 1, sku: `EM-${String(7100 + i).padStart(5, '0')}`, name: `${brands[i % 8]} ${i % 3 ? 'AI Optimized' : 'Dry-Erase'} Whiteboard Eraser — ${variants[i % 6]}`, price: 4.87, ...REQUIREMENTS, style:'Standard', code:'X7-B', color: ['mint', 'pink', 'blue', 'yellow', 'purple', 'black'][i % 6], mood: ['Ambitious', 'Melancholic', 'Synergistic'][i % 3], magnet: i % 2 ? 'Yes' : 'No', weight: 30 + i % 70, texture: i % 10, cloud: i % 2 ? 'Hybrid' : 'Offline', personality: ['Introvert', 'Disruptor', 'Thought leader'][i % 3] };
  if (i !== 137) {
    switch (i % 9) {
      case 0: p.dry = false; break;
      case 1: p.safe = false; break;
      case 2: p.price = [5.09,6.49,8.99,12.50,19.95,34.99,59,99.95][Math.floor(i/9)%8]; break;
      case 3: p.ai = 'AI-Ready'; break;
      case 4: p.style = 'Mini'; p.dry = false; break;
      case 5: p.surface = 'Glass'; break;
      case 6: p.surface = 'Chalkboard'; p.dry = false; break;
      case 7: p.code = 'X7-8'; p.price = [5.25,7.75,11.99,24.50,45,79.95][Math.floor(i/9)%6]; break;
      case 8: p.ai = 'AI-Enhanced'; break;
    }
  } else p.name = 'E-Z Wipe AI Optimized Dry-Erase Whiteboard Eraser — Compact Edition';
  p.compatible = p.type === 'Eraser' && p.dry && p.safe && p.surface === 'Whiteboard';
  if (i !== 137 && i%9 !== 2 && i%9 !== 7) p.price = Number((.10 + ((i*173)%9500)/100).toFixed(2));
  p.compatibility = p.compatible ? 'Whiteboard compatible' : p.surface === 'Glass' ? 'Glass compatible' : p.surface === 'Chalkboard' ? 'Chalkboard compatible' : 'Desk compatible';
  p.material = ['Felt','Foam','Microfiber'][i%3];
  p.shape = ['Rectangle','Round','Wedge'][i%3];
  return p;
});
export const PRODUCTS_PER_PAGE = 11;
export function randomizeProducts(random = Math.random) {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
export function makePricePuzzle(random = Math.random) {
  return [10000 + Math.floor(random() * 90000), 10000 + Math.floor(random() * 90000)];
}
export function findProducts(query, filters) {
  if (query.trim().toLowerCase() === SECRET_SEARCH) return products.filter(isCorrect);
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return products.filter(p => (!words.length || words.some(w => `${p.name} ${p.sku} ${p.type}`.toLowerCase().includes(w))) && Object.entries(filters).every(([key, value]) => !value || (key === 'price' ? p.price <= Number(value) : key === 'weight' ? p.weight <= Number(value) : String(p[key]) === value)));
}
export function clockText(seconds) { const left = MISSION_SECONDS - Math.floor(seconds); const n = Math.abs(left); return `${left < 0 ? '+' : ''}${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; }
