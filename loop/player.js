'use strict';

const byId = id => document.getElementById(id);
const audio = byId('audio');
const files = byId('files');
const dropZone = byId('drop-zone');
const track = byId('track');
const seek = byId('seek');
const settings = byId('settings');
const start = byId('start');
const end = byId('end');
const gap = byId('gap');
const play = byId('play');
const status = byId('status');

let clips = [];
let clip;
let objectUrl;
let phase = 'paused';
let timer;
let playbackRequest = 0;

function formatTime(seconds) {
  const hundredths = Math.floor(seconds * 100);
  const minutes = Math.floor(hundredths / 6000);
  const remainder = ((hundredths % 6000) / 100).toFixed(2).padStart(5, '0');
  return minutes + ':' + remainder;
}

function drawPosition() {
  if (!Number.isFinite(audio.currentTime)) return;
  seek.value = audio.currentTime;
  byId('position').textContent = formatTime(audio.currentTime);
}

function showPhase(next, message = '') {
  phase = next;
  play.textContent = phase === 'paused' ? 'Play loop' : 'Pause';
  status.textContent = message;
}

function pause(message = '') {
  clearTimeout(timer);
  playbackRequest += 1;
  showPhase('paused', message);
  audio.pause();
}

function inRange() {
  return audio.currentTime >= clip.start && audio.currentTime < clip.end;
}

async function playLoop() {
  const request = ++playbackRequest;
  clearTimeout(timer);
  showPhase('playing');
  if (clip.end !== null && !inRange()) audio.currentTime = clip.start;
  try {
    await audio.play();
    if (request === playbackRequest) checkBoundary();
  } catch (error) {
    if (request !== playbackRequest || audio.error) return;
    pause(error.name === 'NotAllowedError' ? 'Press Play loop to begin.' : 'This audio could not start.');
  }
}

function repeat() {
  if (phase !== 'playing') return;
  clearTimeout(timer);
  if (!clip.gap) {
    audio.currentTime = clip.start;
    if (audio.paused) void playLoop();
    return;
  }

  showPhase('rest', 'Resting for ' + clip.gap + ' sec…');
  audio.pause();
  audio.currentTime = clip.start;
  timer = setTimeout(playLoop, clip.gap * 1000);
}

function checkBoundary() {
  if (phase !== 'playing') return;
  clearTimeout(timer);
  if (clip.end === null || audio.loop || audio.seeking || audio.paused) return;

  const remaining = clip.end - audio.currentTime;
  if (remaining <= 0) {
    repeat();
  } else if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    timer = setTimeout(checkBoundary, Math.max(10, Math.min(remaining * 1000, 2147483647)));
  }
}

function syncRange() {
  start.value = clip.start;
  end.value = clip.end;
  gap.value = clip.gap;
  audio.loop = clip.start === 0 && clip.end === audio.duration && clip.gap === 0;
  const selection = byId('selection');
  selection.style.left = 100 * clip.start / audio.duration + '%';
  selection.style.width = 100 * (clip.end - clip.start) / audio.duration + '%';
}

function updateRange(first, last, rest = clip.gap) {
  if (!Number.isFinite(first) || !Number.isFinite(last) ||
      first < 0 || last > audio.duration || first >= last) {
    syncRange();
    status.textContent = 'Start must be before end and both must be within the track.';
    return;
  }

  const wasResting = phase === 'rest';
  clip.start = first;
  clip.end = last;
  clip.gap = rest;
  syncRange();
  status.textContent = '';
  if (!inRange()) audio.currentTime = clip.start;

  if (wasResting) {
    if (clip.gap) {
      clearTimeout(timer);
      showPhase('rest', 'Resting for ' + clip.gap + ' sec…');
      timer = setTimeout(playLoop, clip.gap * 1000);
    } else {
      void playLoop();
    }
  } else {
    checkBoundary();
  }
}

function loadTrack() {
  pause();
  audio.removeAttribute('src');
  audio.load();
  if (objectUrl) URL.revokeObjectURL(objectUrl);

  clip = clips[track.selectedIndex];
  audio.loop = false;
  settings.disabled = true;
  seek.disabled = true;
  play.disabled = true;
  seek.max = 0;
  drawPosition();
  byId('duration').textContent = formatTime(0);
  byId('selection').style.width = '0%';

  objectUrl = URL.createObjectURL(clip.file);
  audio.src = objectUrl;
  void playLoop();
  status.textContent = 'Loading audio…';
}

function addFiles(list) {
  const incoming = Array.from(list).filter(file => file.size > 0);
  if (!incoming.length) return;
  const firstAdded = clips.length;
  for (const file of incoming) {
    clips.push({ file, start: 0, end: null, gap: 0 });
    track.add(new Option(file.name));
  }
  track.selectedIndex = firstAdded;
  byId('player').hidden = false;
  byId('file-action').textContent = 'Add audio files';
  loadTrack();
}

function togglePlayback() {
  if (phase === 'paused') void playLoop();
  else pause();
}

files.addEventListener('change', () => {
  addFiles(files.files);
  files.value = '';
});
dropZone.addEventListener('dragover', event => {
  if (!event.dataTransfer.types.includes('Files')) return;
  event.preventDefault();
  dropZone.classList.add('dragging');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', event => {
  if (!event.dataTransfer.types.includes('Files')) return;
  event.preventDefault();
  dropZone.classList.remove('dragging');
  addFiles(event.dataTransfer.files);
});
track.addEventListener('change', loadTrack);

audio.addEventListener('loadedmetadata', () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
    pause('This file has no playable duration.');
    return;
  }
  if (clip.end === null) clip.end = audio.duration;
  seek.max = start.max = end.max = audio.duration;
  byId('duration').textContent = formatTime(audio.duration);
  syncRange();
  if (!inRange()) audio.currentTime = clip.start;
  drawPosition();
  settings.disabled = seek.disabled = play.disabled = false;
  if (status.textContent === 'Loading audio…') status.textContent = '';
});
audio.addEventListener('error', () => {
  if (!audio.error) return;
  pause('This file could not be played. Try a different audio file.');
  settings.disabled = seek.disabled = play.disabled = true;
});
audio.addEventListener('timeupdate', () => {
  drawPosition();
  checkBoundary();
});
audio.addEventListener('playing', checkBoundary);
audio.addEventListener('seeked', checkBoundary);
audio.addEventListener('waiting', () => {
  if (phase === 'playing') clearTimeout(timer);
});
audio.addEventListener('pause', () => {
  if (phase === 'playing' && audio.paused && !audio.ended) pause();
});
audio.addEventListener('ended', repeat);

seek.addEventListener('input', () => {
  audio.currentTime = seek.valueAsNumber;
  if (phase === 'rest' || (phase === 'playing' && !inRange())) pause();
  drawPosition();
});
start.addEventListener('change', () => updateRange(start.valueAsNumber, clip.end));
end.addEventListener('change', () => updateRange(clip.start, end.valueAsNumber));
gap.addEventListener('change', () => updateRange(clip.start, clip.end, Number(gap.value)));
byId('set-start').addEventListener('click', () => updateRange(audio.currentTime, clip.end));
byId('set-end').addEventListener('click', () => updateRange(clip.start, audio.currentTime));
byId('whole').addEventListener('click', () => updateRange(0, audio.duration));
play.addEventListener('click', togglePlayback);
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey ||
      event.target.closest('input, select, button, textarea, a, [contenteditable]') ||
      play.disabled || byId('player').hidden) return;
  event.preventDefault();
  togglePlayback();
});
