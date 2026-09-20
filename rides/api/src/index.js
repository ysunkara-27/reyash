import {handleRequests} from '../../../dog/requests-api.mjs';
import {handleAnalytics} from '../../../dog/analytics-api.mjs';
import {handle} from './v2.mjs';
import {handleDog} from '../../../dog/api.mjs';
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...headers } });
const roster = [
  ['Ashiyana','Carrollton',0],['Ausdin','1718 JPA',1],['Tej','Main St / IRC',1],['Misthi','1725 JPA',0],['Mann','Main St / IRC',1],['Samai','Main St / IRC',0],['Kshema','Main St / IRC',0],['Radhika','1725 JPA',0],['Malav','1725 JPA',0],['Sruthika','Main St / IRC',0],['Syed','1718 JPA',0],['Shlok','Upper JPA / Stadium',0],['Yashaswi','Courtenay',0],['Simran','Carrollton',0],['Malhar','Carrollton',0],['Anjali','',0,1],['Ariya','Main St / IRC',0],['Shikha','Carrollton',0],['Shuprava','Upper JPA / Stadium',0],['Meera','1725 JPA',1],['Rahil','',0,1],['Shawn','',0],['Omkar','',0],['Sanju','',0],['Isha','',0],['Sarim','',0,1]
].map(([name,address,driver,exempt]) => ({ name, address, driver: Boolean(driver), exempt: Boolean(exempt), needsRide: !exempt, seats: driver ? 4 : 0 }));
const defaultState = { date: '2026-09-01', location: 'AFC', time: '8:15–10:45 PM', note: '', published: true, rules: { Yashaswi: { AFC: 'noRide' } }, roster: roster.map(r => ({ ...r, exempt: false, needsRide: true, seats: r.driver ? 5 : 0 })) };
const encoder = new TextEncoder();
const bytes = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const timingSafeEqual = (a, b) => { if (a.length !== b.length) return false; let result = 0; for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i); return result === 0; };
async function hash(passcode, salt) { const key = await crypto.subtle.importKey('raw', encoder.encode(passcode), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256); return bytes(bits); }
async function inviteCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
async function tokenFor(name, role, secret) { const payload = `${name}|${role}|${Date.now() + 1000 * 60 * 60 * 24 * 30}`; const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const signature = bytes(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))); return `${btoa(payload)}.${signature}`; }
async function userFrom(request, secret) { const token = request.headers.get('authorization')?.replace('Bearer ', ''); if (!token?.includes('.')) return null; const [encoded, signature] = token.split('.'); let payload; try { payload = atob(encoded); } catch { return null; } const [name, role, expires] = payload.split('|'); if (!name || !role || Number(expires) < Date.now()) return null; const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const expected = bytes(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))); return timingSafeEqual(signature, expected) ? { name, role } : null; }
function cors(request, env) { const origin = request.headers.get('Origin'); const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(x => x.trim()); return origin && allowed.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}; }
function validCode(code) { return /^\d{4,8}$/.test(code || ''); }
export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS', 'access-control-allow-headers': 'authorization,content-type,x-analytics-id' } });
    const path = new URL(request.url).pathname;
    if(path.startsWith('/analytics/')||path.startsWith('/stats/')) return handleAnalytics(request,env,headers);
    if(path==='/requests') return handleRequests(request,env,headers);
    if(path.startsWith('/dog/')) return handleDog(request,env,headers);
    if(path==='/health') return json({ok:true,version:2},200,headers);
    if(path.startsWith('/v2/')) return handle(request,env,{json,headers,hash,tokenFor,userFrom,defaultState});
    return json({error:'This version has been replaced. Refresh /rides to use the new app.'},410,headers);
  }
};
