const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...headers } });
const roster = [
  ['Ashiyana','Carrollton',0],['Ausdin','1718 JPA',1],['Tej','Main St / IRC',1],['Misthi','1725 JPA',0],['Mann','Main St / IRC',1],['Samai','Main St / IRC',0],['Kshema','Main St / IRC',0],['Radhika','1725 JPA',0],['Malav','1725 JPA',0],['Sruthika','Main St / IRC',0],['Syed','1718 JPA',0],['Shlok','Upper JPA / Stadium',0],['Yashaswi','Courtenay',0],['Simran','Carrollton',0],['Malhar','Carrollton',0],['Anjali','',0,1],['Ariya','Main St / IRC',0],['Shikha','Carrollton',0],['Shuprava','Upper JPA / Stadium',0],['Meera','1725 JPA',1],['Rahil','',0,1],['Shawn','',0],['Omkar','',0],['Sanju','',0],['Isha','',0],['Sarim','',0,1]
].map(([name,address,driver,exempt]) => ({ name, address, driver: Boolean(driver), exempt: Boolean(exempt), needsRide: !exempt, seats: driver ? 4 : 0 }));
const defaultState = { date: '2026-09-06', location: 'AFC', time: '7:00–10:00 PM', note: '', published: false, roster };
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
    const headers = cors(request, env); if (request.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS', 'access-control-allow-headers': 'authorization,content-type' } });
    const url = new URL(request.url); const path = url.pathname;
    if (path === '/health') return json({ ok: true }, 200, headers);
    if (path === '/v1/bootstrap' && request.method === 'POST') {
      const { passcode, setupCode } = await request.json();
      if (!validCode(passcode) || setupCode !== env.MANAGER_SETUP_CODE) return json({ error: 'Invalid setup code or passcode.' }, 401, headers);
      const existing = await env.DB.prepare('SELECT name FROM members WHERE name = ?').bind('Meera').first();
      if (existing) return json({ error: 'Manager has already been set up.' }, 409, headers);
      const salt = crypto.randomUUID(), codeHash = await hash(passcode, salt); await env.DB.prepare('INSERT INTO members (name, role, code_hash, salt) VALUES (?, ?, ?, ?)').bind('Meera', 'manager', codeHash, salt).run();
      for (const rider of roster.filter(r => r.name !== 'Meera')) { const code = await inviteCode(); await env.DB.prepare('INSERT OR REPLACE INTO invite_codes (name, code, code_hash) VALUES (?, ?, ?)').bind(rider.name, code, await hash(code, rider.name)).run(); }
      return json({ token: await tokenFor('Meera', 'manager', env.SESSION_SECRET), member: { name: 'Meera', role: 'manager' } }, 201, headers);
    }
    if (path === '/v1/login' && request.method === 'POST') {
      const { name, passcode, inviteCode: claimCode } = await request.json(); if (!roster.some(r => r.name === name) || !validCode(passcode)) return json({ error: 'Invalid name or passcode.' }, 400, headers);
      const member = await env.DB.prepare('SELECT * FROM members WHERE name = ?').bind(name).first();
      if (!member) { if (name === 'Meera') return json({ error: 'The manager account must be set up first.' }, 403, headers); const invite = await env.DB.prepare('SELECT code_hash FROM invite_codes WHERE name = ?').bind(name).first(); if (!invite || !validCode(claimCode) || !timingSafeEqual(await hash(claimCode, name), invite.code_hash)) return json({ error: 'Enter the one-time invite code from Meera.' }, 401, headers); const salt = crypto.randomUUID(), codeHash = await hash(passcode, salt); await env.DB.prepare('INSERT INTO members (name, code_hash, salt) VALUES (?, ?, ?)').bind(name, codeHash, salt).run(); await env.DB.prepare('DELETE FROM invite_codes WHERE name = ?').bind(name).run(); return json({ token: await tokenFor(name, 'rider', env.SESSION_SECRET), member: { name, role: 'rider' } }, 201, headers); }
      if (!timingSafeEqual(await hash(passcode, member.salt), member.code_hash)) return json({ error: 'That passcode does not match.' }, 401, headers);
      return json({ token: await tokenFor(member.name, member.role, env.SESSION_SECRET), member: { name: member.name, role: member.role } }, 200, headers);
    }
    const user = await userFrom(request, env.SESSION_SECRET); if (!user) return json({ error: 'Sign in required.' }, 401, headers);
    if (path === '/v1/state' && request.method === 'GET') { const row = await env.DB.prepare('SELECT data FROM app_state WHERE id = 1').first(); const state = row ? JSON.parse(row.data) : defaultState; if (!state.published && user.role !== 'manager') { const { roster: _, ...draft } = state; return json({ ...draft, roster: state.roster.filter(r => r.name === user.name), published: false }, 200, headers); } return json(state, 200, headers); }
    if (path === '/v1/state' && request.method === 'PUT') { if (user.role !== 'manager') return json({ error: 'Manager access required.' }, 403, headers); const state = await request.json(); if (!Array.isArray(state.roster) || !['AFC', 'NRGC'].includes(state.location)) return json({ error: 'Invalid plan.' }, 400, headers); await env.DB.prepare('INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP').bind(JSON.stringify(state)).run(); return json({ ok: true }, 200, headers); }
    if (path === '/v1/profile' && request.method === 'PUT') { const { address, needsRide, canDrive } = await request.json(); const row = await env.DB.prepare('SELECT data FROM app_state WHERE id = 1').first(); const state = row ? JSON.parse(row.data) : defaultState; const member = state.roster.find(r => r.name === user.name); if (!member) return json({ error: 'Member not found.' }, 404, headers); member.address = String(address || '').slice(0, 140); member.needsRide = Boolean(needsRide); member.driver = Boolean(canDrive); member.seats = member.driver ? 4 : 0; await env.DB.prepare('INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP').bind(JSON.stringify(state)).run(); return json({ ok: true }, 200, headers); }
    if (path === '/v1/invites' && request.method === 'GET') { if (user.role !== 'manager') return json({ error: 'Manager access required.' }, 403, headers); return json({ pending: (await env.DB.prepare('SELECT name, code FROM invite_codes ORDER BY name').all()).results }, 200, headers); }
    return json({ error: 'Not found.' }, 404, headers);
  }
};
