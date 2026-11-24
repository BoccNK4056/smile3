/* ============================================================
   TESTER — класс тестера
   - Консоль (перехват log/warn/error/info)
   - Отладка state
   - Логи действий
   - Кнопка «Открыть предрелиз»
============================================================ */

/* ============================================================
   ПРОВЕРКА ТЕСТЕРА
============================================================ */
function checkTester() {
  if (typeof ENABLE_TESTER === 'undefined' || !ENABLE_TESTER) return false;
  if (typeof IS_ADMIN !== 'undefined' && IS_ADMIN) return true;
  const u = typeof TG_USER !== 'undefined' ? TG_USER : null;
  if (!u) return false;
  const byName = u.username && TESTER_USERNAMES.includes(u.username);
  const byId = u.id && TESTER_IDS.includes(u.id);
  return !!(byName || byId);
}

const IS_TESTER = checkTester();

/* ============================================================
   КОНСОЛЬ — перехват
============================================================ */
const testerLogs = [];
const MAX_LOGS = 100;

function captureConsole() {
  if (!IS_TESTER) return;
  const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  ['log', 'warn', 'error', 'info'].forEach(level => {
    console[level] = function (...args) {
      let msg;
      try {
        msg = args.map(a => {
          if (typeof a === 'object') {
            try { return JSON.stringify(a); } catch (e) { return String(a); }
          }
          return String(a);
        }).join(' ');
      } catch (e) {
        msg = '[unserializable]';
      }
      testerLogs.push({ level, msg, time: Date.now() });
      if (testerLogs.length > MAX_LOGS) testerLogs.shift();
      orig[level].apply(console, args);
      if (typeof currentTab !== 'undefined' && currentTab === 'tester') {
        renderTesterConsole();
      }
    };
  });
}

/* ============================================================
   ЛОГИ ДЕЙСТВИЙ
============================================================ */
const actionLog = [];
const MAX_ACTIONS = 50;

function logAction(type, data) {
  if (!IS_TESTER) return;
  actionLog.push({ type, data, time: Date.now() });
  if (actionLog.length > MAX_ACTIONS) actionLog.shift();
}

/* ============================================================
   RENDER TESTER
============================================================ */
function renderTester() {
  if (!content || !IS_TESTER) return;
  const html = [];

  html.push(`<div class="section-title">🧪 Тестер-панель</div>`);
  html.push(`<div class="card-sub" style="text-align:center;margin-bottom:12px">Только для тестеров</div>`);

  /* Кнопка предрелиза */
  html.push(`<button class="btn big" id="testerPre" style="width:100%;margin-bottom:14px">📄 Открыть предрелиз (index-pre.html)</button>`);

  /* Быстрые действия */
  html.push(`<div class="section-title">⚡ Быстрые действия</div>`);
  html.push(`<div class="card column" style="gap:8px">
    <button class="btn" data-tact="money1m" style="width:100%">+1 000 000</button>
    <button class="btn" data-tact="money1b" style="width:100%">+1 000 000 000</button>
    <button class="btn" data-tact="allsmiles" style="width:100%">Выдать все смайлы</button>
    <button class="btn" data-tact="resetintro" style="width:100%">Сбросить вступление</button>
    <button class="btn" data-tact="glitch" style="width:100%">Запустить глюк</button>
    <button class="btn" data-tact="offline1h" style="width:100%">Симулировать оффлайн 1 час</button>
    <button class="btn danger" data-tact="reset" style="width:100%">Сбросить сохранение</button>
  </div>`);

  /* Консоль */
  html.push(`<div class="section-title" style="margin-top:14px">🖥 Консоль</div>`);
  html.push(`<div class="card column" id="testerConsole" style="max-height:300px;overflow-y:auto;padding:10px"></div>`);
  html.push(`<button class="btn" id="testerClearConsole" style="width:100%;margin-top:8px">Очистить консоль</button>`);

  /* Логи действий */
  html.push(`<div class="section-title" style="margin-top:14px">📋 Логи действий</div>`);
  html.push(`<div class="card column" id="testerActions" style="max-height:300px;overflow-y:auto;padding:10px"></div>`);

  /* State (JSON) */
  html.push(`<div class="section-title" style="margin-top:14px">📦 State</div>`);
  html.push(`<div class="card column"><pre id="testerState" style="font-size:10px;overflow-x:auto;white-space:pre-wrap;max-height:400px;overflow-y:auto"></pre></div>`);

  content.innerHTML = html.join('');

  /* Обработчики */
  document.getElementById('testerPre').addEventListener('click', () => {
    location.href = 'index-pre.html';
  });

  document.getElementById('testerClearConsole').addEventListener('click', () => {
    testerLogs.length = 0;
    renderTesterConsole();
  });

  content.querySelectorAll('[data-tact]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.tact;
      if (act === 'money1m') { state.balance += 1000000; toast('+1 000 000'); renderHeader(); saveState(); }
      else if (act === 'money1b') { state.balance += 1000000000; toast('+1 000 000 000'); renderHeader(); saveState(); }
      else if (act === 'allsmiles') {
        for (const s of ALL_SMILEYS) if (!state.inventory.includes(s)) state.inventory.push(s);
        toast('Выданы все смайлы'); saveState();
      }
      else if (act === 'resetintro') { state.introSeen = false; toast('Вступление сброшено'); saveState(); }
      else if (act === 'glitch') { if (typeof triggerGlitch === 'function') triggerGlitch(); }
      else if (act === 'offline1h') {
        state.lastOnline = Date.now() - 3600000;
        computeOffline();
        toast(`Оффлайн: +${fmt(state.pendingOffline)}`);
        renderHeader();
        saveState();
      }
      else if (act === 'reset') {
        if (confirm('Сбросить сохранение?')) {
          storage.remove('smileyClickerSave_v5');
          storage.remove('smileyClickerSave_v5_backup');
          location.reload();
        }
      }
    });
  });

  renderTesterConsole();
  renderTesterActions();
  renderTesterState();
}

function renderTesterConsole() {
  const el = document.getElementById('testerConsole');
  if (!el) return;
  if (testerLogs.length === 0) {
    el.innerHTML = '<div style="opacity:0.5;text-align:center;font-size:12px">Пусто</div>';
    return;
  }
  el.innerHTML = testerLogs.map(l => {
    const color = l.level === 'error' ? '#ff6b6b' : l.level === 'warn' ? '#ffd700' : '#fff';
    return `<div style="color:${color};font-size:11px;font-family:monospace;margin-bottom:4px;word-break:break-all">[${l.level}] ${l.msg}</div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function renderTesterActions() {
  const el = document.getElementById('testerActions');
  if (!el) return;
  if (actionLog.length === 0) {
    el.innerHTML = '<div style="opacity:0.5;text-align:center;font-size:12px">Пусто</div>';
    return;
  }
  el.innerHTML = actionLog.slice().reverse().map(a => {
    const t = new Date(a.time).toLocaleTimeString('ru-RU');
    return `<div style="font-size:11px;font-family:monospace;margin-bottom:4px;word-break:break-all"><b>${a.type}</b> [${t}]: ${JSON.stringify(a.data)}</div>`;
  }).join('');
}

function renderTesterState() {
  const el = document.getElementById('testerState');
  if (!el) return;
  try {
    el.textContent = JSON.stringify(state, null, 2);
  } catch (e) {
    el.textContent = '[state не сериализуется]';
  }
  }
