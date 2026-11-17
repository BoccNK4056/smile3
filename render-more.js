/* ============================================================
   RENDER MORE — games, crash, craft, cases, settings
============================================================ */

/* ============================================================
   GAMES — меню игр
============================================================ */
function renderGames() {
  if (!content) return;
  content.innerHTML = `
    <div class="section-title">🎮 Игры</div>
    <div class="card column">
      <div class="card-title" style="text-align:center;font-size:18px;margin-bottom:6px">🚀 Краш</div>
      <div class="card-sub" style="text-align:center;margin-bottom:10px">Множитель растёт — забери вовремя!</div>
      <button class="btn big" id="goCrash" style="width:100%">Играть в Краш</button>
    </div>
    <div class="card column">
      <div class="card-title" style="text-align:center;font-size:18px;margin-bottom:6px">⚒️ Крафт</div>
      <div class="card-sub" style="text-align:center;margin-bottom:10px">3 обычных → gold, 5 gold → legendary, 10 любых → thematic</div>
      <button class="btn big" id="goCraft" style="width:100%">Открыть Крафт</button>
    </div>
  `;
  document.getElementById('goCrash').addEventListener('click', () => { currentTab = 'crash'; renderTabs(); applyTheme(); renderCrash(); });
  document.getElementById('goCraft').addEventListener('click', () => { currentTab = 'craft'; renderTabs(); applyTheme(); renderCraft(); });
}

/* ============================================================
   CRASH
============================================================ */
let crash = { active: false, bet: 0, mult: 1, crashAt: 0, rafId: null, startTime: 0, points: [], crashed: false };

function renderCrash() {
  if (!content) return;
  const hist = state.crashHistory.slice(-10);
  const histHTML = hist.length
    ? hist.map(m => `<span class="${m >= 2 ? 'high' : 'low'}">${m.toFixed(2)}x</span>`).join('')
    : '<span style="opacity:0.6;border-color:transparent">пока нет раундов</span>';

  content.innerHTML = `
    <div class="section-title">🚀 Краш · история</div>
    <div class="crash-history">${histHTML}</div>
    <div class="crash-chart-wrap">
      <canvas id="crashCanvas"></canvas>
      <div class="crash-mult" id="crashMult">1.00x</div>
    </div>
    <div class="bet-input-row">
      <input id="crashBet" type="number" min="100" value="${state.quickBets[0]}" placeholder="ставка">
    </div>
    <div class="quick-bets">${state.quickBets.map((v, i) => `<button class="btn" data-qb="${i}">${fmt(v)}</button>`).join('')}</div>
    <button class="btn big" id="crashBtn" style="width:100%;margin-bottom:8px">Ставка</button>
    <div class="card-sub" style="text-align:center;padding:0 8px">Ставка сгорает при крахе.</div>
  `;

  const betInput = document.getElementById('crashBet');
  document.querySelectorAll('[data-qb]').forEach(b => {
    b.addEventListener('click', () => { betInput.value = state.quickBets[+b.dataset.qb]; vibrate('light'); });
  });
  document.getElementById('crashBtn').addEventListener('click', () => { if (crash.active) cashOut(); else startCrash(); });

  drawCrashChart();
  updateCrashBtn();
}

function updateCrashBtn() {
  const btn = document.getElementById('crashBtn');
  if (!btn) return;
  if (crash.active) btn.textContent = `Забрать ${fmt(crash.bet * crash.mult)} (${crash.mult.toFixed(2)}x)`;
  else btn.textContent = 'Ставка';
}

function drawCrashChart() {
  const canvas = document.getElementById('crashCanvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const w = wrap.clientWidth - 20;
  const h = 180;
  canvas.width = w * 2;
  canvas.height = h * 2;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const y = h - (h / 5) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const pts = crash.points;
  if (pts.length < 2) return;

  // Фикс: не «прыгать» при shift — мапим по первому x
  const x0 = pts[0].x;
  const xN = pts[pts.length - 1].x;
  const maxX = Math.max(xN - x0, 10);
  const maxY = Math.max(...pts.map(p => p.y), 1.2);

  const px = i => ((pts[i].x - x0) / maxX) * (w - 6) + 4;
  const py = i => h - ((pts[i].y - 1) / (maxY - 1)) * (h - 16) - 8;

  ctx.strokeStyle = crash.crashed ? '#ff6b6b' : '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(px(i), py(i));
    else ctx.lineTo(px(i), py(i));
  }
  ctx.stroke();
  ctx.lineTo(px(pts.length - 1), h);
  ctx.lineTo(px(0), h);
  ctx.closePath();

  const grd = ctx.createLinearGradient(0, 0, 0, h);
  if (crash.crashed) {
    grd.addColorStop(0, 'rgba(255,107,107,0.35)');
    grd.addColorStop(1, 'rgba(255,107,107,0)');
  } else {
    grd.addColorStop(0, 'rgba(255,255,255,0.35)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
  }
  ctx.fillStyle = grd;
  ctx.fill();
}

function generateCrashPoint() {
  // Честная формула с house edge 2%, cap 100x
  const r = Math.random();
  if (r === 0) return CRASH_MIN_MULT;
  let point = (1 - CRASH_HOUSE_EDGE) / (1 - r);
  if (point < CRASH_MIN_MULT) point = CRASH_MIN_MULT;
  if (point > CRASH_MAX_MULT) point = CRASH_MAX_MULT;
  return point;
}

function startCrash() {
  if (crash.active) return;
  const input = document.getElementById('crashBet');
  let bet = Math.floor(+input.value || 0);

  if (bet < 100) { toast('Мин. ставка: 100'); return; }
  if (bet > state.balance) { toast('Недостаточно средств'); return; }
  if (state.adminFree) bet = 0;

  state.balance -= bet;
  renderHeader();

  crash.active = true;
  crash.bet = bet;
  crash.mult = 1;
  crash.points = [{ x: 0, y: 1 }];
  crash.startTime = performance.now();
  crash.crashed = false;
  crash.crashAt = generateCrashPoint();

  const multEl = document.getElementById('crashMult');
  if (multEl) multEl.classList.remove('crashed');

  updateCrashBtn();
  vibrate('medium');

  const tick = () => {
    if (!crash.active) return;
    const elapsed = (performance.now() - crash.startTime) / 1000;
    let m = 1 + Math.pow(elapsed, 1.4) * 0.15;
    crash.mult = m;
    crash.points.push({ x: elapsed, y: m });
    if (crash.points.length > 400) crash.points.shift();

    if (multEl) multEl.textContent = m.toFixed(2) + 'x';
    updateCrashBtn();
    drawCrashChart();

    if (m >= crash.crashAt) {
      crash.active = false;
      crash.crashed = true;
      if (multEl) {
        multEl.textContent = 'CRASH 💥 ' + crash.crashAt.toFixed(2) + 'x';
        multEl.classList.add('crashed');
      }
      state.crashHistory.push(crash.crashAt);
      if (state.crashHistory.length > 50) state.crashHistory.shift();
      vibrateNotification('error');
      toast(`💥 Краш на ${crash.crashAt.toFixed(2)}x · ставка сгорела`);
      drawCrashChart();
      renderHeader();
      saveState();
      setTimeout(() => { if (currentTab === 'crash') renderCrash(); }, 1200);
      return;
    }
    crash.rafId = requestAnimationFrame(tick);
  };
  crash.rafId = requestAnimationFrame(tick);
}

function cashOut() {
  if (!crash.active) return;
  crash.active = false;
  cancelAnimationFrame(crash.rafId);

  const win = crash.bet * crash.mult;
  state.balance += win;
  setStatMax('crashBest', crash.mult);
  bumpDaily('dCrashWin');

  const multEl = document.getElementById('crashMult');
  if (multEl) multEl.textContent = '✅ ' + crash.mult.toFixed(2) + 'x';

  vibrateNotification('success');
  toast(`✅ Забрано ${fmt(win)} (${crash.mult.toFixed(2)}x)`);
  renderHeader();
  saveState();
  setTimeout(() => { if (currentTab === 'crash') renderCrash(); }, 900);
}

/* ============================================================
   CRAFT — рецепты + QTE-бонус
============================================================ */
let craftSession = null;

function renderCraft() {
  if (!content) return;

  const counts = {
    normal: state.inventory.filter(s => SMILEYS[s]?.tier === 'normal').length,
    gold: state.inventory.filter(s => SMILEYS[s]?.tier === 'gold').length,
    any: state.inventory.length,
  };

  const recipes = CRAFT_RECIPES.map((r, i) => {
    const have = r.from === 'any' ? counts.any : (counts[r.from] || 0);
    const can = have >= r.fromCount;
    const label = `${r.fromCount} ${r.from === 'any' ? 'любых' : (r.from === 'normal' ? 'обычных' : 'gold')} → 1 ${r.to}`;
    return `<div class="card"><div class="card-info"><div class="card-title">${label}</div><div class="card-sub">У тебя: ${have} / ${r.fromCount}</div></div><button class="btn" data-recipe="${i}" ${!can ? 'disabled' : ''}>Крафт</button></div>`;
  }).join('');

  content.innerHTML = `
    <div class="section-title">⚒️ Крафт смайлов</div>
    <div class="craft-info">Прозрачный крафт: 100% шанс. QTE даёт бонус (7/10 → +1 смайл того же тира).<br><b>Сними обычные/gold смайлы с полки перед крафтом!</b></div>
    <div class="qte-status" id="qteStatus">Выбери рецепт</div>
    <div class="craft-area" id="craftArea"></div>
    ${recipes}
    <button class="btn" id="backGames" style="width:100%;margin-top:8px">Назад в Игры</button>
  `;

  document.getElementById('backGames').addEventListener('click', () => { currentTab = 'games'; renderTabs(); applyTheme(); renderGames(); });
  content.querySelectorAll('[data-recipe]').forEach(b => {
    b.addEventListener('click', () => startCraftRecipe(+b.dataset.recipe));
  });
}

function startCraftRecipe(idx) {
  const r = CRAFT_RECIPES[idx];
  if (!r) return;

  // Проверка: смайлы на полке?
  const onShelf = state.shelf.some(s => {
    if (!s) return false;
    if (r.from === 'any') return !!SMILEYS[s];
    return SMILEYS[s]?.tier === r.from;
  });
  if (onShelf) { toast('Сними нужные смайлы с полки перед крафтом'); return; }

  // Есть ли нужное количество?
  const pool = state.inventory.filter(s => {
    if (r.from === 'any') return !!SMILEYS[s];
    return SMILEYS[s]?.tier === r.from;
  });
  if (pool.length < r.fromCount) { toast('Не хватает смайлов'); return; }

  craftSession = { recipe: r, round: 0, total: CRAFT_QTE_ROUNDS, hits: 0 };
  const area = document.getElementById('craftArea');
  const status = document.getElementById('qteStatus');
  if (!area || !status) return;
  area.innerHTML = '';
  status.textContent = 'Приготовься...';
  setTimeout(() => nextCraftRound(), 400);
}

function nextCraftRound() {
  if (!craftSession) return;
  if (craftSession.round >= craftSession.total) { finishCraft(); return; }
  craftSession.round++;
  const area = document.getElementById('craftArea');
  const status = document.getElementById('qteStatus');
  if (!area || !status) { craftSession = null; return; }

  status.textContent = `Раунд ${craftSession.round} / ${craftSession.total} · Попаданий: ${craftSession.hits}`;

  const rect = area.getBoundingClientRect();
  const size = 70;
  const x = Math.random() * (rect.width - size);
  const y = Math.random() * (rect.height - size);
  const target = document.createElement('div');
  target.className = 'qte-target';
  target.style.left = x + 'px';
  target.style.top = y + 'px';
  target.textContent = craftSession.round;

  let reacted = false;
  const timeLimit = 1200 - craftSession.round * 50;
  const timeout = setTimeout(() => {
    if (reacted) return;
    reacted = true;
    target.remove();
    setTimeout(() => nextCraftRound(), 200);
  }, Math.max(500, timeLimit));

  target.addEventListener('click', () => {
    if (reacted) return;
    reacted = true;
    clearTimeout(timeout);
    craftSession.hits++;
    target.classList.add('hit');
    vibrate('light');
    setTimeout(() => { target.remove(); nextCraftRound(); }, 200);
  });

  area.innerHTML = '';
  area.appendChild(target);
}

function finishCraft() {
  if (!craftSession) return;
  const { recipe, hits, total } = craftSession;
  const success = hits >= CRAFT_QTE_NEEDED;
  craftSession = null;

  // Списываем смайлы
  let need = recipe.fromCount;
  for (let i = state.inventory.length - 1; i >= 0 && need > 0; i--) {
    const s = state.inventory[i];
    const isMatch = recipe.from === 'any' ? !!SMILEYS[s] : SMILEYS[s]?.tier === recipe.from;
    if (isMatch) { state.inventory.splice(i, 1); need--; }
  }

  // Выдаём результат
  let pool;
  if (recipe.to === 'gold') pool = GOLD_SMILEYS;
  else if (recipe.to === 'legendary') pool = LEGENDARY_SMILEYS;
  else pool = THEMATIC_SMILEYS;

  const drop = pool[Math.floor(Math.random() * pool.length)];
  const isDup = state.inventory.includes(drop);

  if (isDup) {
    const refund = THEMATIC_CASE_REFUND;
    state.balance += refund;
    toast(`Крафт: дубликат ${drop} → +${fmt(refund)}`);
  } else {
    state.inventory.push(drop);
    toast(`✅ Крафт: ${drop}!`);
  }

  // Бонус за QTE
  if (success) {
    const bonusPool = pool;
    const bonus = bonusPool[Math.floor(Math.random() * bonusPool.length)];
    if (!state.inventory.includes(bonus)) {
      state.inventory.push(bonus);
      toast(`🎯 QTE-бонус: ${bonus}!`);
      vibrateNotification('success');
    } else {
      state.balance += THEMATIC_CASE_REFUND;
      toast(`🎯 QTE-бонус: дубликат ${bonus} → +${fmt(THEMATIC_CASE_REFUND)}`);
    }
  } else {
    toast(`QTE: ${hits}/${total} — без бонуса`);
  }

  bumpStat('crafts');
  bumpDaily('dCrafts');
  saveState();
  renderCraft();
  renderHeader();
}

/* ============================================================
   CASES
============================================================ */
function renderCases() {
  if (!content) return;

  const caseCard = (title, emoji, drops, refund, kind, extraCls = '') => `
    <div class="section-title" style="margin-top:14px">${title}</div>
    <div class="card column">
      <div class="case-visual ${extraCls}">${emoji}</div>
      <div class="drop-pool">${drops.map(d => `<span>${d.s}${d.w ? `<span class="chance">${d.w}%</span>` : ''}</span>`).join('')}</div>
      <div class="card-sub" style="text-align:center;margin-bottom:10px">Повторка → возврат ${fmt(refund)} ${coinIcon()}</div>
      <button class="btn big" data-open="${kind}" style="width:100%">Открыть за ${fmt(getCasePrice(kind))} ${coinIcon()}</button>
    </div>
  `;

  content.innerHTML = `
    ${caseCard('📦 Обычный кейс', '🎁', NORMAL_DROPS, CASE_REFUND, 'normal')}
    ${caseCard('🏆 Золотой кейс', '💎', GOLD_DROPS, GOLD_CASE_REFUND, 'gold', 'gold-visual')}
    ${caseCard('🐉 Легендарный кейс', '🌟', LEGENDARY_DROPS, LEGENDARY_CASE_REFUND, 'legendary', 'legendary-visual')}
    ${caseCard('🎭 Тематический кейс', '🎭', THEMATIC_DROPS, THEMATIC_CASE_REFUND, 'thematic')}
    ${caseCard('🎨 Кейс с темами', '🎨', [{ s: '❄️', w: 33 }, { s: '🍁', w: 33 }, { s: '🌙', w: 34 }], THEME_CASE_REFUND, 'theme')}
  `;

  content.querySelectorAll('[data-open]').forEach(b => {
    b.addEventListener('click', () => openCase(b.dataset.open));
  });
}

let caseAnimating = false;

function pickByWeight(drops) {
  const total = drops.reduce((a, d) => a + d.w, 0);
  let r = Math.random() * total;
  for (const d of drops) {
    if (r < d.w) return d.s;
    r -= d.w;
  }
  return drops[drops.length - 1].s;
}

function openCase(kind) {
  if (caseAnimating) return;
  const price = getCasePrice(kind);
  if (state.balance < price) { toast('Недостаточно средств'); return; }

  caseAnimating = true;
  state.balance -= price;
  renderHeader();
  vibrate('rigid');

  const visualMap = { normal: '🎁', gold: '💎', legendary: '🌟', thematic: '🎭', theme: '🎨' };
  content.innerHTML = `<div class="section-title">📦 Открываем...</div><div class="case-opening">${visualMap[kind]}</div>`;

  setTimeout(() => {
    let resultHTML = '';
    let iceWhisper = '';

    if (kind === 'theme') {
      const notOwned = THEMES.filter(t => !state.themesOwned.includes(t));
      if (notOwned.length === 0) {
        const refund = getCaseRefund('theme');
        state.balance += refund;
        resultHTML = `<div class="case-opening">🎨</div><div class="card column"><div class="card-title" style="text-align:center">Все темы уже есть!</div><div class="card-sub" style="text-align:center">Возврат: +${fmt(refund)} ${coinIcon()}</div></div>`;
      } else {
        const theme = notOwned[Math.floor(Math.random() * notOwned.length)];
        state.themesOwned.push(theme);
        resultHTML = `<div class="case-opening">🎨</div><div class="card column"><div class="card-title" style="text-align:center">Новая тема: ${THEME_NAMES[theme]}</div><div class="card-sub" style="text-align:center">Доступна во вкладке «Настройки» → Темы</div></div>`;
        toast(`🎨 Тема: ${THEME_NAMES[theme]}`);
        vibrateNotification('success');
      }
    } else {
      const drops = { normal: NORMAL_DROPS, gold: GOLD_DROPS, legendary: LEGENDARY_DROPS, thematic: THEMATIC_DROPS }[kind];
      const roll = pickByWeight(drops);
      const isDup = state.inventory.includes(roll);
      let refund = getCaseRefund(kind);
      if (shelfBuffs().hasBlood) refund *= 2;

      // Пасхалка «лёд»
      if (roll === '🧊') {
        const whisper = ICE_WHISPERS[Math.floor(Math.random() * ICE_WHISPERS.length)];
        iceWhisper = `<div class="ice-whisper">"${whisper}"</div>`;
      }

      if (isDup) {
        state.balance += refund;
        resultHTML = `<div class="case-opening">${roll}</div><div class="card column"><div class="card-title" style="text-align:center">Повторка! ${roll}</div><div class="card-sub" style="text-align:center">Возврат: +${fmt(refund)} ${coinIcon()}</div>${iceWhisper}</div>`;
        vibrateNotification('warning');
      } else {
        state.inventory.push(roll);
        const meta = SMILEYS[roll];
        resultHTML = `<div class="case-opening">${roll}</div><div class="card column"><div class="card-title" style="text-align:center">Новый смайл: ${roll}</div><div class="card-sub" style="text-align:center">Баф: ${meta.label}</div>${meta.offline ? `<div class="card-sub" style="text-align:center">💤 Оффлайн ×${meta.offline.mul.toFixed(2)}, кап ${fmt(meta.offline.cap)}</div>` : ''}${iceWhisper}</div>`;
        toast(`Новый смайл ${roll}!`);
        vibrateNotification('success');
      }
    }

    bumpStat('cases');
    bumpDaily('dCases');

    content.innerHTML = `<div class="section-title">📦 Результат</div>${resultHTML}<button class="btn big" id="againBtn" style="width:100%;margin-top:10px">Ещё раз</button><button class="btn" id="backBtn" style="width:100%;margin-top:8px">Назад в кейсы</button>`;

    document.getElementById('againBtn').addEventListener('click', () => { caseAnimating = false; openCase(kind); });
    document.getElementById('backBtn').addEventListener('click', () => { caseAnimating = false; renderCases(); });

    renderHeader();
    saveState();
    caseAnimating = false;
  }, 700);
}

/* ============================================================
   SETTINGS
============================================================ */
function renderSettings() {
  if (!content) return;
  const html = [];

  html.push(`<div class="section-title">⚙️ Настройки</div>`);

  // Аккаунт
  html.push(`<div class="section-title">👤 Аккаунт</div>`);
  if (TG_USER) {
    const avatarInner = TG_USER.photo_url ? `<img src="${TG_USER.photo_url}" alt="">` : '👤';
    const name = [TG_USER.first_name, TG_USER.last_name].filter(Boolean).join(' ') || 'Без имени';
    const uname = TG_USER.username ? '@' + TG_USER.username : '(без username)';
    html.push(`
      <div class="acc-card">
        <div class="acc-avatar">${avatarInner}</div>
        <div class="acc-info">
          <div class="acc-name">${name} ${IS_ADMIN ? '<span class="acc-admin-badge">👑 Админ</span>' : ''}</div>
          <div class="acc-id">${uname} · ID: ${TG_USER.id}</div>
          <div class="acc-balance">Баланс: ${fmt(state.balance)} ${coinIcon()}</div>
        </div>
      </div>
    `);
  } else {
    html.push(`<div class="card column"><div class="card-sub" style="text-align:center">Открой через Telegram, чтобы увидеть аккаунт</div></div>`);
  }

  if (ENABLE_ADMIN && IS_ADMIN) {
    html.push(`<button class="btn big" id="adminBtn" style="width:100%;margin-bottom:14px">👑 Открыть админ-панель</button>`);
    html.push(`<div id="adminPanel"></div>`);
  }

  // Вибрация
  html.push(`<div class="section-title" style="margin-top:14px">📳 Вибрация</div>`);
  html.push(`<div class="toggle-row"><div><div class="card-title">Вибрация</div><div class="card-sub">Тактильный отклик</div></div><div class="toggle ${state.vibrateEnabled ? 'on' : ''}" id="vibToggle"></div></div>`);

  // Темы
  html.push(`<div class="section-title" style="margin-top:14px">🎨 Темы</div><div class="theme-grid">`);
  const defActive = state.activeTheme === 'default' || !state.activeTheme;
  html.push(`<div class="theme-card theme-default-preview ${defActive ? 'active' : ''}" data-theme="default"><div class="big-emoji">💧</div><div>Голубая</div></div>`);

  const allThemes = [...THEMES];
  if (ENABLE_HALLOWEEN && state.themesOwned.includes('halloween')) allThemes.push('halloween');

  for (const t of allThemes) {
    const owned = state.themesOwned.includes(t);
    const active = state.activeTheme === t;
    const previewCls = `theme-${t}-preview`;
    html.push(`<div class="theme-card ${previewCls} ${active ? 'active' : ''} ${owned ? '' : 'locked'}" data-theme="${t}"><div class="big-emoji">${THEME_NAMES[t].split(' ')[0]}</div><div>${THEME_NAMES[t].split(' ').slice(1).join(' ')}</div>${owned ? '' : '<div style="font-size:10px;opacity:0.8">не куплена</div>'}</div>`);
  }
  html.push(`</div>`);

  // Анимки
  html.push(`<div class="section-title">🎬 Анимка клика</div><div class="anim-grid">`);
  html.push(`<div class="anim-card ${state.clickAnimation === 'default' ? 'active' : ''}" data-anim="default"><div class="big-emoji">😃</div><div>Стандарт</div></div>`);
  const spidersOwned = state.animationsOwned.includes('spiders');
  html.push(`<div class="anim-card ${state.clickAnimation === 'spiders' ? 'active' : ''} ${spidersOwned ? '' : 'locked'}" data-anim="spiders"><div class="big-emoji">🕷</div><div>Пауки${spidersOwned ? '' : ' 🔒'}</div></div>`);
  html.push(`</div>`);

  content.innerHTML = html.join('');

  // Обработчики
  const vibT = document.getElementById('vibToggle');
  if (vibT) vibT.addEventListener('click', () => {
    state.vibrateEnabled = !state.vibrateEnabled;
    vibT.classList.toggle('on', state.vibrateEnabled);
    if (state.vibrateEnabled) vibrate('medium');
    saveState();
  });

  content.querySelectorAll('[data-theme]').forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.theme;
      if (t === 'default') state.activeTheme = 'default';
      else {
        if (!state.themesOwned.includes(t)) { toast('Тема не куплена!'); return; }
        state.activeTheme = t;
      }
      vibrate('medium');
      toast(`Тема: ${THEME_NAMES[t]}`);
      render();
    });
  });

  content.querySelectorAll('[data-anim]').forEach(el => {
    el.addEventListener('click', () => {
      const a = el.dataset.anim;
      if (a !== 'default' && !state.animationsOwned.includes(a)) { toast('Анимка не куплена!'); return; }
      state.clickAnimation = a;
      vibrate('medium');
      toast(`Анимка: ${a === 'spiders' ? '🕷 Пауки' : '😃 Стандарт'}`);
      renderSettings();
      saveState();
    });
  });

  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) adminBtn.addEventListener('click', () => {
    const panel = document.getElementById('adminPanel');
    if (panel && typeof renderAdmin === 'function') renderAdmin(panel);
  });
}
