/* ============================================================
   UI — хелперы: toast, модалки, fmt, coinIcon, vibrate, темы
============================================================ */

/* ============================================================
   ВАЛЮТА — значок «с с полочкой»
============================================================ */
function coinIcon() {
  return '<span class="smile-coin">c</span>';
}

/* ============================================================
   FORMAT — суффиксы K/M/B/T/Q
============================================================ */
function fmt(n) {
  n = Math.floor(n);
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  if (n >= 1e15) return (n / 1e15).toFixed(2) + 'Q';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/* ============================================================
   VIBRATE
============================================================ */
const tg = window.Telegram?.WebApp;
if (tg) { try { tg.ready(); tg.expand(); } catch (e) {} }

function vibrate(style = 'light') {
  if (!state.vibrateEnabled) return;
  if (tg && tg.HapticFeedback) {
    try { tg.HapticFeedback.impactOccurred(style); } catch (e) {}
  }
}

function vibrateNotification(type = 'success') {
  if (!state.vibrateEnabled) return;
  if (tg && tg.HapticFeedback) {
    try { tg.HapticFeedback.notificationOccurred(type); } catch (e) {}
  }
}

/* ============================================================
   TOAST
============================================================ */
const toastWrap = document.getElementById('toast-wrap');

function toast(msg) {
  if (!toastWrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  toastWrap.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function notify(msg, type = 'success') {
  toast(msg);
  vibrateNotification(type);
}

/* ============================================================
   MODAL — единый
============================================================ */
function showModal({ emoji, title, desc, buttons = [], closable = true }) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';

  const buttonsHTML = buttons.map((b, i) =>
    `<button class="btn ${b.cls || ''}" data-mb="${i}">${b.label}</button>`
  ).join('');

  bg.innerHTML = `
    <div class="modal">
      ${emoji ? `<div class="modal-emoji">${emoji}</div>` : ''}
      ${title ? `<div class="modal-title">${title}</div>` : ''}
      ${desc ? `<div class="modal-desc">${desc}</div>` : ''}
      <div class="modal-actions">${buttonsHTML}</div>
    </div>
  `;

  document.body.appendChild(bg);

  if (closable) {
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
  }

  buttons.forEach((b, i) => {
    const btn = bg.querySelector(`[data-mb="${i}"]`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (b.onClick) b.onClick();
      if (b.keepOpen !== true) bg.remove();
    });
  });

  return bg;
}

/* ============================================================
   ТЕМЫ
============================================================ */
function applyTheme() {
  document.body.classList.remove('theme-winter', 'theme-autumn', 'theme-dark', 'theme-halloween');

  if (ENABLE_HALLOWEEN && currentTab === 'event') {
    document.body.classList.add('theme-halloween');
  } else if (state.activeTheme && state.activeTheme !== 'default') {
    document.body.classList.add('theme-' + state.activeTheme);
  }

  applyWeather();
}

/* ============================================================
   WEATHER — снег / листья / пауки
============================================================ */
let weatherLayer = null;

function applyWeather() {
  if (weatherLayer) { weatherLayer.remove(); weatherLayer = null; }

  const theme = (ENABLE_HALLOWEEN && currentTab === 'event')
    ? 'halloween'
    : (state.activeTheme || 'default');

  if (theme === 'winter') {
    weatherLayer = document.createElement('div');
    weatherLayer.className = 'weather-layer';
    for (let i = 0; i < 30; i++) {
      const f = document.createElement('div');
      f.className = 'snowflake';
      f.textContent = '❄️';
      f.style.left = Math.random() * 100 + '%';
      f.style.fontSize = (10 + Math.random() * 20) + 'px';
      f.style.animationDuration = (6 + Math.random() * 8) + 's';
      f.style.animationDelay = (Math.random() * 8) + 's';
      weatherLayer.appendChild(f);
    }
    document.body.appendChild(weatherLayer);
  } else if (theme === 'autumn') {
    weatherLayer = document.createElement('div');
    weatherLayer.className = 'weather-layer';
    const leaves = ['🍁', '🍂', '🍃'];
    for (let i = 0; i < 25; i++) {
      const f = document.createElement('div');
      f.className = 'leaf';
      f.textContent = leaves[Math.floor(Math.random() * leaves.length)];
      f.style.left = Math.random() * 100 + '%';
      f.style.fontSize = (14 + Math.random() * 16) + 'px';
      f.style.animationDuration = (7 + Math.random() * 8) + 's';
      f.style.animationDelay = (Math.random() * 8) + 's';
      weatherLayer.appendChild(f);
    }
    document.body.appendChild(weatherLayer);
  } else if (theme === 'halloween' && ENABLE_HALLOWEEN) {
    weatherLayer = document.createElement('div');
    weatherLayer.className = 'weather-layer';
    for (let i = 0; i < 8; i++) {
      const f = document.createElement('div');
      f.className = 'spider';
      f.textContent = '🕷️';
      f.style.left = Math.random() * 90 + '%';
      f.style.top = Math.random() * 80 + '%';
      f.style.fontSize = (16 + Math.random() * 14) + 'px';
      f.style.animation = `crawl ${4 + Math.random() * 3}s ease-in-out infinite alternate`;
      f.style.animationDelay = (Math.random() * 4) + 's';
      weatherLayer.appendChild(f);
    }
    document.body.appendChild(weatherLayer);
  }
}

/* ============================================================
   FLOATING NUMBER — всплывающее число при клике
============================================================ */
function spawnFloat(x, y, text) {
  const el = document.createElement('div');
  el.className = 'float-num';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = (y - 20) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

/* ============================================================
   SPIDER BURST — анимка «пауки» при клике
============================================================ */
function spawnSpiderBurst(x, y) {
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'spider-burst';
    el.textContent = '🕷';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 60;
    el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
}

/* ============================================================
   ADMIN CHECK
============================================================ */
const TG_USER = tg?.initDataUnsafe?.user;

function checkAdmin() {
  if (!ENABLE_ADMIN) return false;
  const u = TG_USER;
  if (!u) return false;
  const byName = u.username && ADMIN_USERNAMES.includes(u.username);
  const byId = u.id && ADMIN_IDS.includes(u.id);
  return !!(byName || byId);
}

const IS_ADMIN = checkAdmin();
