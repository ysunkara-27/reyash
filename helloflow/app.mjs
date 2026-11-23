const screen = document.querySelector('#screen');
const announcement = document.querySelector('#announcement');
const duration = 30 * 60 * 1000;
let view = 'home', walk = null, cueTimeout, acceptTimeout, waveTimeout, audioContext;
let cueSounds = [];
const dialogue = 'Hey Bill! Good to hear from you. How’s your walk going?';
const person = `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M18 71v-8c0-13 10-20 22-20s22 7 22 20v8M28 26c0-18 24-18 24 0v5c0 17-24 17-24 0z" stroke="#345c49" stroke-width="2.4" stroke-linecap="round"/><path d="M27 25c2-14 22-17 27-2-9 0-14-3-16-8-1 6-5 9-11 10" fill="#345c49"/><path d="M35 32h.1m10 0h.1M36 38c3 2 5 2 8 0" stroke="#345c49" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const art = `<svg viewBox="0 0 240 180" fill="none" aria-hidden="true"><ellipse cx="120" cy="155" rx="101" ry="13" fill="#e6eadb"/><path d="M21 149c20-18 30-10 51-12m95 11c15-12 31-12 49-8M38 129V77m0 19c-30-10-25-38-9-41-6-25 26-32 29-11 26 2 24 30 9 34 6 15-9 28-29 18" stroke="#a4b18c" stroke-width="2"/><circle cx="130" cy="40" r="13" fill="#e2e9c9" stroke="#345c49" stroke-width="2"/><path d="m127 54-12 36 25 25-14 34m-11-59-16 30-24 18m45-66 21 16 21-10m-39-17-22 12-5 19" stroke="#345c49" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="m123 59 15 9-6 32-21-8z" fill="#c4d698"/><path d="M183 133v-31m-10 12 10 9 13-13" stroke="#a4b18c" stroke-width="2" stroke-linecap="round"/><path d="m173 35 8-8m5 19 11-2" stroke="#a4b18c" stroke-width="2" stroke-linecap="round"/></svg>`;
const remaining = () => walk ? Math.max(0, Math.ceil((walk.deadline - Date.now()) / 1000)) : 1800;
const format = value => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
const button = (label, action, cls = 'primary') => `<button class="${cls}" data-action="${action}">${label}</button>`;
function say(text) { announcement.textContent = ''; requestAnimationFrame(() => { announcement.textContent = text; }); }
function silence() { window.speechSynthesis?.cancel(); }
function speak() {
  silence();
  if ('speechSynthesis' in window) { const voice = new SpeechSynthesisUtterance(dialogue); voice.rate = .94; window.speechSynthesis.speak(voice); }
}
function prepareSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (Audio) { audioContext ||= new Audio(); audioContext.resume().catch(() => {}); }
}
function chime() {
  if (!audioContext) return;
  [0, .19].forEach((delay, i) => {
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.connect(gain); gain.connect(audioContext.destination);
    const at = audioContext.currentTime + delay;
    oscillator.frequency.value = i ? 660 : 520;
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.08, at + .02); gain.gain.exponentialRampToValueAtTime(.001, at + .25);
    oscillator.start(at); oscillator.stop(at + .27);
  });
}
function stopCue() {
  for (const sound of cueSounds) { try { sound.stop(); } catch {} }
  cueSounds = [];
}
function footsteps() {
  if (!audioContext) return;
  // A quiet series of shoe scuffs and low footfalls grows closer in the earbuds.
  for (let i = 0; i < 8; i++) {
    const at = audioContext.currentTime + .45 + i * .48;
    const level = .025 + i * .014;
    const thud = audioContext.createOscillator(), envelope = audioContext.createGain();
    thud.type = 'sine'; thud.frequency.setValueAtTime(125, at); thud.frequency.exponentialRampToValueAtTime(48, at + .13);
    envelope.gain.setValueAtTime(.001, at); envelope.gain.linearRampToValueAtTime(level, at + .012); envelope.gain.exponentialRampToValueAtTime(.001, at + .18);
    thud.connect(envelope); envelope.connect(audioContext.destination); thud.start(at); thud.stop(at + .2); cueSounds.push(thud);
    const buffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * .12), audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let j = 0; j < samples.length; j++) samples[j] = (Math.random() * 2 - 1) * (1 - j / samples.length);
    const scuff = audioContext.createBufferSource(), filter = audioContext.createBiquadFilter(), gain = audioContext.createGain();
    scuff.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 900;
    gain.gain.setValueAtTime(level * .6, at); gain.gain.exponentialRampToValueAtTime(.001, at + .12);
    scuff.connect(filter); filter.connect(gain); gain.connect(audioContext.destination); scuff.start(at); scuff.stop(at + .13); cueSounds.push(scuff);
  }
}
function switchRow() {
  return `<div class="switch-row"><span class="switch-copy" id="allow-label">Allow Hellos from Contacts<small>${walk.allowed ? 'Open to a familiar voice' : 'Off · enjoy a quiet walk'}</small></span><label class="toggle"><input type="checkbox" id="allow" aria-labelledby="allow-label" ${walk.allowed ? 'checked' : ''}><span></span></label></div>`;
}
function footer() { return `${button('End walk', 'endwalk', 'secondary')}<button class="demo-jump" data-action="jump">Demo: jump to 5 min remain</button>`; }
function render(next = view, focus = true) {
  view = next;
  screen.dataset.view = view;
  const left = remaining();
  if (view === 'home') screen.innerHTML = `<h2>Hey Bill,</h2><p class="body">You have <span class="accent">30 minutes</span><br>before your next meeting.</p><div class="calendar" aria-label="Simulated calendar: thirty minute walk in a thirty minute gap before your meeting"><div class="card-top"><span>YOUR CALENDAR</span><span>Today</span></div><div class="calendar-track"><span class="cal-free">30 min free</span><span class="cal-busy">Meeting</span></div><div class="calendar-times"><span>10:07</span><span>10:37</span></div></div><h3>Want to start a walk?</h3><div class="illustration">${art}</div><div class="spacer"></div>${button('Start', 'start')}${button('Later', 'later', 'text-button')}<p class="tiny">Calendar gap simulated for this prototype.</p>`;
  if (view === 'walk') screen.innerHTML = `<div class="center"><h2 style="margin-top:23px">Walk in Progress</h2><div class="timer" data-timer aria-label="Walk time remaining">${format(left)}</div><p class="timer-caption">remaining of your 30-minute walk</p><div class="illustration walk-art">${art}</div></div>${walk.skipped ? '<p class="notice center">Keep walking. Your walk continues.</p>' : ''}<div class="spacer"></div>${switchRow()}${footer()}`;
  if (['offer', 'waveSent', 'waveBack'].includes(view)) {
    const wavedBack = view === 'waveBack';
    const cueText = wavedBack ? 'Jordan waved back' : view === 'waveSent' ? 'Wave sent' : 'Ping · footsteps approaching';
    screen.innerHTML = `<div class="cue" role="status"><span aria-hidden="true">${view === 'offer' ? '♫' : '👋'}</span><span>${cueText}<br><small>${wavedBack ? 'You both waved.' : view === 'waveSent' ? 'Waiting for Jordan to wave back…' : 'Simulated earbud cue'}</small></span></div><div class="center"><h2>Jordan is also walking!</h2><div class="avatar">${person}</div><p class="person">Jordan</p><p class="sub">From Math class</p></div>${view === 'offer' ? '<p class="notice center">Tap your buds to wave.</p>' : ''}<div class="spacer"></div>${wavedBack ? `${button('Say Hello', 'audio')}${button('Keep Walking', 'skip', 'secondary')}${button('Ask for Video', 'videoInvite', 'text-button')}` : view === 'waveSent' ? '<button class="primary" disabled>Wave sent</button>' + button('Keep Walking', 'skip', 'secondary') : button('Wave', 'wave') + '<p class="tiny">Simulates an earbud tap</p>' + button('Keep Walking', 'skip', 'secondary')}<p class="tiny">Walk in Progress · <span data-timer>${format(left)}</span> remain</p>`;
  }
  if (view === 'audioWaiting') screen.innerHTML = `<h2>Quick Hello</h2><div class="avatar">${person}</div><div class="center"><p class="person">Jordan</p><p class="sub">From Math class</p><p class="notice">Waiting for Jordan to accept your hello…</p></div><div class="spacer"></div><button class="primary" disabled>Waiting for Jordan…</button>${button('Keep Walking', 'skip', 'secondary')}<p class="tiny">Walk in Progress · <span data-timer>${format(left)}</span> remain</p>`;
  if (view === 'audio') screen.innerHTML = `<div class="center"><span class="pill"><span class="dot"></span> Audio hello connected</span><h2 style="margin-top:21px">Quick Hello</h2><div class="connected"><span>Walk in Progress</span><span><span data-timer>${format(left)}</span> left in walk</span></div><p class="person">Jordan</p><p class="sub">From Math class</p><div class="wave" aria-hidden="true">${Array.from({length:29},(_,i)=>`<i style="--h:${15+((i*37)%65)}px;--d:${i*.06}s"></i>`).join('')}</div><div class="transcript"><small>JORDAN · SIMULATED RESPONSE</small>“${dialogue}”</div><p class="tiny">Simulated audio · no microphone is used.</p></div><div class="spacer"></div>${button('End Hello', 'endhello', 'danger')}`;
  if (view === 'videoInvite' || view === 'videoWaiting') screen.innerHTML = `<button class="back" data-action="backOffer">← Back</button><h2>Video Hello</h2><div class="avatar">${person}</div><div class="center"><h3>Jordan</h3><p class="sub">From Math class</p></div><p class="body center">${view === 'videoWaiting' ? 'You accepted. Waiting for Jordan…' : 'Both of you choose to join before a video hello begins.'}</p><div class="spacer"></div>${view === 'videoWaiting' ? '<button class="primary" disabled>Waiting for Jordan…</button>' : button('Accept Video Hello', 'acceptVideo')}${button('Keep Walking', 'skip', 'secondary')}<p class="tiny">Simulated video · no camera is used.<br>Walk in Progress · <span data-timer>${format(left)}</span> remain</p>`;
  if (view === 'video') screen.innerHTML = `<div class="center"><span class="pill"><span class="dot"></span> You and Jordan both accepted</span><h2 style="margin-top:20px">Video Hello</h2><div class="connected"><span>Walk in Progress</span><span><span data-timer>${format(left)}</span> left in walk</span></div><div class="video"><div class="avatar">${person}</div><p class="person">Jordan</p><small>SIMULATED VIDEO · From Math class</small></div><div class="transcript" style="margin-top:14px"><small>JORDAN · SIMULATED RESPONSE</small>“${dialogue}”</div><p class="tiny">No camera or microphone is used.</p></div><div class="spacer"></div>${button('End Hello', 'endhello', 'danger')}`;
  if (view === 'quiet') screen.innerHTML = `<h2>Walk in Progress</h2><div class="five"><h2>5 min remain</h2></div><div class="timer center" data-timer aria-label="Walk time remaining">${format(left)}</div><div class="illustration walk-art">${art}</div><p class="body center">Take these last min to yourself!</p><div class="spacer"></div><div class="switch-row"><span class="switch-copy">Allow Hellos<small>Off for these last five minutes</small></span><label class="toggle"><input type="checkbox" aria-label="Allow Hellos, off for last five minutes" disabled><span></span></label></div>${button('End walk', 'endwalk', 'secondary')}`;
  if (view === 'complete') screen.innerHTML = `<h2>Walk complete.</h2><div class="illustration walk-art">${art}</div><div class="spacer"></div>${button('Done', 'done')}`;
  if (focus) { screen.setAttribute('tabindex', '-1'); screen.focus({preventScroll:true}); }
}
function offer() {
  if (!walk || walk.skipped || walk.offered || !walk.allowed || remaining() <= 300 || view !== 'walk') return;
  walk.offered = true; chime(); footsteps(); render('offer'); say('Ping. Footsteps approaching in your earbuds. Jordan from Math class is also walking. Tap your buds to wave, or use the Wave button.');
}
function scheduleCue() { clearTimeout(cueTimeout); cueTimeout = setTimeout(offer, 3000); }
function stopHello() { silence(); stopCue(); clearTimeout(acceptTimeout); clearTimeout(waveTimeout); }
screen.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'start') { prepareSound(); walk = {deadline:Date.now()+duration, allowed:true, offered:false, skipped:false}; render('walk'); scheduleCue(); }
  if (action === 'later') { render('home'); say('Walk postponed. Start whenever you are ready.'); }
  if (action === 'wave' && view === 'offer') {
    stopCue(); render('waveSent'); say('Wave sent. Waiting for Jordan to wave back.');
    waveTimeout = setTimeout(() => { if (view !== 'waveSent' || !walk) return; walk.wavedBack = true; render('waveBack'); say('Jordan waved back. Say Hello, Keep Walking, or Ask for Video.'); }, 2000);
  }
  if (action === 'audio' && view === 'waveBack') {
    render('audioWaiting'); say('Waiting for Jordan to accept your hello.');
    acceptTimeout = setTimeout(() => { if (view !== 'audioWaiting' || !walk) return; render('audio'); speak(); say('Jordan accepted. Quick Hello connected.'); }, 2000);
  }
  if (action === 'skip') { stopHello(); walk.skipped = true; render(remaining() <= 300 ? 'quiet' : 'walk'); say('Keep walking. Your original walk continues.'); }
  if (action === 'endhello') { stopHello(); render(remaining() <= 300 ? 'quiet' : 'walk'); say('Hello ended. Your original walk continues.'); }
  if (action === 'videoInvite' && view === 'waveBack') render('videoInvite');
  if (action === 'backOffer') { clearTimeout(acceptTimeout); render(walk.wavedBack ? 'waveBack' : 'offer'); }
  if (action === 'acceptVideo') {
    render('videoWaiting'); say('You accepted. Waiting for Jordan to accept.');
    acceptTimeout = setTimeout(() => { if (view !== 'videoWaiting') return; render('video'); say('Jordan accepted. Video Hello connected.'); speak(); }, 2000);
  }
  if (action === 'jump') { stopHello(); clearTimeout(cueTimeout); walk.deadline = Date.now()+300000; walk.allowed = false; render('quiet'); say('Demo advanced to five minutes remaining. Take these last minutes to yourself.'); }
  if (action === 'endwalk') { stopHello(); clearTimeout(cueTimeout); walk = null; render('complete'); }
  if (action === 'done') render('home');
});
screen.addEventListener('change', event => {
  if (event.target.id !== 'allow') return;
  walk.allowed = event.target.checked;
  render('walk', false);
  document.querySelector('#allow').focus();
  say(walk.allowed ? 'Hellos on.' : 'Hellos off. Enjoy a quiet walk.');
  if (walk.allowed) scheduleCue(); else clearTimeout(cueTimeout);
});
setInterval(() => {
  if (!walk) return;
  const left = remaining();
  if (left === 0) { stopHello(); clearTimeout(cueTimeout); walk = null; render('complete'); say('Walk complete.'); return; }
  if (left <= 300 && view !== 'quiet') { stopHello(); clearTimeout(cueTimeout); walk.allowed = false; render('quiet'); say('Five minutes remain. Take these last minutes to yourself.'); }
  screen.querySelectorAll('[data-timer]').forEach(el => { el.textContent = format(left); });
}, 250);
window.addEventListener('pagehide', stopHello);
render('home', false);
