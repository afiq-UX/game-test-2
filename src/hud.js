// hud.js — 2D overlay: counters, timer, room label, interact prompt, win screen.
import { ROOMS } from './house.js';

export function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function currentRoomName(pos) {
  for (const r of Object.values(ROOMS)) {
    if (pos.x > r.xMin && pos.x < r.xMax && pos.z > r.zMin && pos.z < r.zMax) return r.name;
  }
  return 'Luar rumah';
}

export function createHud() {
  const countEl = document.getElementById('count');
  const totalEl = document.getElementById('total');
  const promptEl = document.getElementById('prompt');
  const promptTextEl = document.getElementById('promptText');
  const timerEl = document.getElementById('timer');
  const roomEl = document.getElementById('room');
  const winEl = document.getElementById('win');
  const winTimeEl = document.getElementById('winTime');
  const interactBtn = document.getElementById('interact');
  document.getElementById('restart').addEventListener('click', () => location.reload());

  // Credits modal — reachable from the HUD link (start of the game) and from
  // a second button on the win screen (end of the game); both open the same panel.
  const creditsModal = document.getElementById('creditsModal');
  const openCredits = () => creditsModal.classList.add('open');
  const closeCredits = () => creditsModal.classList.remove('open');
  document.getElementById('creditsLink').addEventListener('click', openCredits);
  document.getElementById('creditsBtnWin').addEventListener('click', openCredits);
  document.getElementById('creditsClose').addEventListener('click', closeCredits);
  creditsModal.addEventListener('click', (e) => { if (e.target === creditsModal) closeCredits(); });

  return {
    setTotal(n) { totalEl.textContent = n; },
    setOffCount(n) { countEl.textContent = n; },
    setTimer(str) { timerEl.textContent = str; },
    setRoom(name) { roomEl.textContent = name; },
    showPrompt(text) {
      promptEl.style.display = 'block';
      promptTextEl.textContent = text;
      interactBtn.classList.add('live');
    },
    hidePrompt() {
      promptEl.style.display = 'none';
      interactBtn.classList.remove('live');
    },
    showWin(timeStr) {
      winTimeEl.textContent = timeStr;
      winEl.style.display = 'flex';
    },
  };
}
