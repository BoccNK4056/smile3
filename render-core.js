/* ============================================================
   RENDER CORE — header, tabs, main, shop, shelf, bank
   + новые вкладки: tester, boosts, stuff, advent, daily-shop, rank
   + фикс полей ввода, спавн подарков, тема «Время»
============================================================ */

const content = document.getElementById('content');
const balanceEl = document.getElementById('balance');
const statClickEl = document.getElementById('statClick');
const statCpsEl = document.getElementById('statCps');
const buffLineEl = document.getElementById('buffLine');
const tabsEl = document.getElementById('tabs');

let currentTab = 'main';

/* ============================================================
   HEADER
============================================================ */
function renderHeader() {
  if (balanceEl) balanceEl.innerHTML = fmt(state.balance) + ' ' + coinIcon();
  if (statClickEl) statClickEl.textContent = fmt(totalClickPower());
  if (statCpsEl) statCpsEl.textContent = fmt(totalCps());

  const b = shelfBuffs();
  const parts = [];
  if (b.clickMul !== 0) parts.push(`${b.clickMul > 0 ? '+' : ''}${Math.round(b.clickMul * 100)}% клик`);
  if (b.cpsMul !== 0) parts.push(`${b.cpsMul > 0 ? '+' : ''}${Math.round(b.cpsMul * 100)}% CPS`);
  if (b.cpsExtra) parts.push(`+${Math.round(b.cpsExtra * 100)}% CPS (спец)`);
  if (b.hasMask) parts.push('маска ×4.2 конфеты');
  if (b.hasGhost) parts.push('призрак: оффлайн ✕');
  if (b.hasZombie) parts.push('зомби: цены +25%');

  // Активные бусты
  if (typeof getActiveBoosts === 'function') {
    const ab = getActiveBoosts();
    for (const id of Object.keys(ab)) {
      const left = Math.ceil(ab[id] / 60000);
      parts.push(`⚡ ${BOOSTS[id].name} (${left}м)`);
    }
  }

  // Серия 🔥
  if (state.shelf.includes('🔥') && state.fireStreak > 0) {
    parts.push(`🔥 серия: ${state.fireStreak} дн.`);
  }

  // Ранг
  if (typeof getRank === 'function') {
    const r = getRank(state.elo);
    parts.push(`${r.emoji} ${r.name}`);
  }

  const offMul = offlineMulTotal();
  if (offMul > 0 && !b.hasGhost) parts.push(`оффлайн ×${offMul.toFixed(2)}`);

  if (buffLineEl) buffLineEl.textContent = parts.length ? ('✨ ' + parts.join(' · ')) : '';

  setStatMax('maxBalance', Math.floor(state.balance));
  setStatMax('smileysCount', state.inventory.length);
  setStatMax('crashBest', state.stats.crashBest || 0);
}

/* ============================================================
   TABS
============================================================ */
function buildTabs() {
  const tabs = [
    { id: 'main', label: '😃 Кликер' },
    { id: 'shop', label: '🛒 Магазин' },
    { id: 'shelf', label: '🗄️ Полка' },
    { id: 'bank', label: '🏦 Банк' },
    { id: 'games', label: '🎮 Игры' },
    { id: 'cases', label: '📦 Кейсы' },
    { id: 'boosts', label: '⚡ Бусты' },
    { id: 'stuff', label: '🧸 Stuff' },
    { id: 'advent', label: '🎄 Адвент' },
    { id: 'daily-shop', label: '🛍️ Ежедневный' },
    { id: 'rank', label: '💎 Ранг' },
  ];
  if (ENABLE_HALLOWEEN) tabs.push({ id: 'event', label: '🎃 Ивент' });
  if (typeof IS_TESTER !== 'undefined' && IS_TESTER) tabs.push({ id: 'tester', label: '🧪 Тестер' });
  tabs.push({ id: 'settings', label: '⚙️ Настройки' });

  if (tabsEl) {
    tabsEl.innerHTML = tabs.map(t => `<button class="tab" data-tab="${t.id}">${t.label}</button>`).join('');
  }
}

function renderTabs() {
  if (!tabsEl) return;
  [...tabsEl.children].forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab);
  });
}

/* ============================================================
   RENDER
============================================================ */
function render() {
  applyTheme();
  renderHeader();
  renderTabs();

  switch (currentTab) {
    case 'main':       renderMain(); break;
    case 'shop':       renderShop(); break;
    case 'shelf':      renderShelf(); break;
    case 'bank':       renderBank(); break;
    case 'games':      renderGames(); break;
    case 'cases':      renderCases(); break;
    case 'boosts':     renderBoosts(); break;
    case 'stuff':      renderStuff(); break;
    case 'advent':     renderAdvent(); break;
    case 'daily-shop': renderDailyShop(); break;
    case 'rank':       renderRank(); break;
    case 'event':      if (ENABLE_HALLOWEEN && typeof renderEvent === 'function') renderEvent(); else renderMain(); break;
    case 'tester':     if (typeof renderTester === 'function' && IS_TESTER) renderTester(); else renderMain(); break;
    case 'settings':   renderSettings(); break;
    default:           renderMain(); break;
  }

  saveState();
}

/* ============================================================
   MAIN — + шанс подарка из кнопки
============================================================ */
function renderMain() {
  if (!content) return;
  content.innerHTML = `
    <div class="main-centered">
      <button id="smiley" class="smiley-emoji">😃</button>
      <div class="click-hint">Тапай по смайлику!</div>
    </div>
  `;
  const s = document.getElementById('smiley');
  if (s) s.addEventListener('click', onSmileyClick);
}

function onSmileyClick(e) {
  // Шанс подарка из кнопки
  if (typeof isNewYear === 'function' && isNewYear() && Math.random() < NEWYEAR_BUTTON_CHANCE) {
    if (typeof spawnGift === 'function') spawnGift();
  }

  const gain = totalClickPower();
  state.balance += gain;
  bumpStat('clicks');
  bumpDaily('dClicks');
  addElo(ELO_REWARDS.click);
  vibrate('light');

  if (ENABLE_HALLOWEEN) {
    const cc = candyClickPower();
    if (cc > 0) {
      const roll = cc * (0.1 + Math.random() * 0.9);
      state.halloween.candyFrac += roll;
      if (state.halloween.candyFrac >= 1) {
        const whole = Math.floor(state.halloween.candyFrac);
        state.halloween.candy += whole;
        state.halloween.candyFrac -= whole;
      }
    }
  }

  renderHeader();

  const s = document.getElementById('smiley');
  if (s) {
    s.classList.remove('pop');
    void s.offsetWidth;
    s.classList.add('pop');
  }

  const rect = s ? s.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
  const t = (e && e.touches && e.touches[0]) || e;
  const x = (t && t.clientX) || (rect.left + rect.width / 2);
  const y = (t && t.clientY) || (rect.top + rect.height / 2);

  spawnFloat(x, y, '+' + fmt(gain));

  if (state.clickAnimation === 'spiders' && state.animationsOwned.includes('spiders')) {
    spawnSpiderBurst(x, y);
  }

  saveState();
}

/* ============================================================
   SHOP — фикс полей ввода
============================================================ */
function renderShop() {
  if (!content) return;
  const html = [];

  html.push(`<div class="section-title">💪 За клик</div>`);
  for (const u of CLICK_UPGRADES) html.push(upgradeCardHTML(u));

  html.push(`<div class="section-title" style="margin-top:14px">⚡ В секунду</div>`);
  for (const u of CPS_UPGRADES) html.push(upgradeCardHTML(u));

  html.push(`<div class="section-title" style="margin-top:14px">🗄️ Полка</div>`);
  const shelfPrice = getShelfPrice();
  html.push(`<div class="card"><div class="card-info"><div class="card-title">Доп. место на полке</div><div class="card-sub">Всего слотов: ${3 + state.shelfLevel} → ${4 + state.shelfLevel}</div></div><button class="btn" data-shelf="1" ${state.balance < shelfPrice ? 'disabled' : ''}>${fmt(shelfPrice)} ${coinIcon()}</button></div>`);

  if (isFrozen()) {
    const left = Math.ceil((state.freezeUntil - Date.now()) / 60000);
    html.push(`<div class="card-sub" style="text-align:center;color:#9cf">❄️ Цены заморожены (осталось ${left} мин)</div>`);
  }

  content.innerHTML = html.join('');

  content.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.buy;
      const n = parseInt(btn.dataset.n) || 1;
      buyUpgradeN(id, n);
    });
  });

  content.querySelectorAll('[data-upg-input]').forEach(input => {
    input.addEventListener('input', () => updateBuyRow(input));
  });
  content.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.upgId;
      const preset = btn.dataset.preset;
      const input = content.querySelector(`[data-upg-input="${id}"]`);
      if (!input) return;
      const u = [...CLICK_UPGRADES, ...CPS_UPGRADES].find(x => x.id === id);
      if (!u) return;
      if (preset === 'max') input.value = getMaxAffordable(u);
      else input.value = parseInt(preset) || 1;
      updateBuyRow(input);
    });
  });

  const sb = content.querySelector('[data-shelf]');
  if (sb) sb.addEventListener('click', buyShelfSlot);
}

function upgradeCardHTML(u) {
  const lvl = state.upgrades[u.id] || 0;
  const price = getUpgradePrice(u);
  const canBuy = state.balance >= price;
  const priceN = getUpgradePriceForN(u, 1);

  return `
    <div class="card">
      <div class="card-info">
        <div class="card-title">${u.name} ${lvl ? `<span style="opacity:0.7">(ур. ${lvl})</span>` : ''}</div>
        <div class="card-sub">${u.desc} · <span data-price-label="${u.id}">${fmt(priceN)}</span> ${coinIcon()}</div>
      </div>
      <div class="buy-row">
        <button class="btn preset" data-preset="1" data-upg-id="${u.id}">1</button>
        <button class="btn preset" data-preset="10" data-upg-id="${u.id}">10</button>
        <button class="btn preset" data-preset="max" data-upg-id="${u.id}">Max</button>
        <input type="number" min="1" value="1" data-upg-input="${u.id}">
        <button class="btn" data-buy="${u.id}" data-n="1" ${!canBuy ? 'disabled' : ''}>Купить</button>
      </div>
    </div>
  `;
}

function updateBuyRow(input) {
  const id = input.dataset.upgInput;
  const u = [...CLICK_UPGRADES, ...CPS_UPGRADES].find(x => x.id === id);
  if (!u) return;
  const n = Math.max(1, parseInt(input.value) || 1);
  const price = getUpgradePriceForN(u, n);
  const label = content.querySelector(`[data-price-label="${id}"]`);
  if (label) label.textContent = fmt(price);
  const btn = content.querySelector(`[data-buy="${id}"]`);
  if (btn) {
    btn.dataset.n = n;
    btn.disabled = state.balance < price;
  }
}

function buyUpgradeN(id, n) {
  const u = [...CLICK_UPGRADES, ...CPS_UPGRADES].find(x => x.id === id);
  if (!u) return;
  n = Math.max(1, Math.floor(n));
  const price = getUpgradePriceForN(u, n);
  if (state.balance < price) return;

  state.balance -= price;
  state.upgrades[id] = (state.upgrades[id] || 0) + n;
  bumpStat('upgrades');
  bumpDaily('dUpgrades');
  vibrate('medium');
  toast(`Куплено: ${u.name} ×${n}`);
  render();
}

function buyShelfSlot() {
  const price = getShelfPrice();
  if (state.balance < price) return;
  state.balance -= price;
  state.shelfLevel += 1;
  state.shelf.push(null);
  vibrate('medium');
  toast(`Полка расширена! Слотов: ${3 + state.shelfLevel}`);
  render();
}

/* ============================================================
   SHELF
============================================================ */
function itemMeta(s) {
  if (ENABLE_HALLOWEEN && HALLOWEEN_ITEMS[s]) return HALLOWEEN_ITEMS[s];
  return SMILEYS[s];
}

function itemTierCls(s) {
  if (ENABLE_HALLOWEEN && HALLOWEEN_ITEMS[s]) return '';
  const m = SMILEYS[s];
  if (!m) return '';
  if (m.tier === 'gold') return 'gold';
  if (m.tier === 'legendary') return 'legendary';
  return '';
}

function renderShelf() {
  if (!content) return;
  const html = [];

  html.push(`<div class="section-title">🗄️ Полка (${state.shelf.filter(Boolean).length}/${state.shelf.length})</div><div class="slots" id="slots">`);
  state.shelf.forEach((slot, i) => {
    if (slot) {
      const meta = itemMeta(slot);
      html.push(`<div class="slot filled" data-slot="${i}">${slot}<div class="buff-badge">${meta ? meta.label : ''}</div></div>`);
    } else {
      html.push(`<div class="slot" data-slot="${i}"><span class="empty-label">пусто</span></div>`);
    }
  });
  html.push(`</div>`);

  if (state.shelf.includes('🔥') && state.fireStreak > 0) {
    html.push(`<div class="card-sub" style="text-align:center;margin:8px 0;color:#ffb347">🔥 Серия заходов: ${state.fireStreak} дн.</div>`);
  }

  html.push(`<div class="section-title" style="margin-top:14px">🎒 Смайлы (${state.inventory.length}) · долгий тап = статы</div>`);
  if (state.inventory.length === 0) {
    html.push(`<div class="empty-msg">Пока пусто.<br>Открой кейс во вкладке «Кейсы»!</div>`);
  } else {
    html.push(`<div class="inventory">`);
    state.inventory.forEach(s => {
      const onShelf = state.shelf.includes(s);
      const meta = SMILEYS[s];
      html.push(`<div class="inv-item ${onShelf ? 'on-shelf' : ''} ${itemTierCls(s)}" data-inv="${s}">${s}<div class="buff-badge">${meta ? meta.label : ''}</div></div>`);
    });
    html.push(`</div>`);
  }

  if (ENABLE_HALLOWEEN && state.halloween) {
    const halItems = Object.keys(state.halloween.items).filter(k => state.halloween.items[k]);
    html.push(`<div class="section-title" style="margin-top:14px">🎃 Хэллоуин-предметы (${halItems.length})</div>`);
    if (halItems.length === 0) {
      html.push(`<div class="empty-msg">Пока пусто.<br>Постучи в дверь во вкладке «Ивент»!</div>`);
    } else {
      html.push(`<div class="inventory">`);
      halItems.forEach(s => {
        const onShelf = state.shelf.includes(s);
        const meta = HALLOWEEN_ITEMS[s];
        html.push(`<div class="inv-item ${onShelf ? 'on-shelf' : ''}" data-inv="${s}" style="border-color:#ff8c00">${s}<div class="buff-badge">${meta.label}</div></div>`);
      });
      html.push(`</div>`);
    }
  }

  content.innerHTML = html.join('');

  content.querySelectorAll('[data-slot]').forEach(el => {
    el.addEventListener('click', () => {
      const i = +el.dataset.slot;
      if (state.shelf[i]) {
        const removed = state.shelf[i];
        // Защита от случайного снятия 🔥
        if (removed === '🔥' && state.fireStreak > 0) {
          if (!confirm(`Снять 🔥? Серия (${state.fireStreak} дн.) сохранится, но перестанет расти.`)) return;
        }
        state.shelf[i] = null;
        vibrate('light');
        toast(`Снято с полки: ${removed}`);
        renderShelf();
        renderHeader();
        saveState();
      }
    });
  });

  content.querySelectorAll('[data-inv]').forEach(el => {
    const s = el.dataset.inv;
    let longPressTimer = null;
    let longPressed = false;

    const startPress = () => {
      longPressed = false;
      longPressTimer = setTimeout(() => {
        longPressed = true;
        vibrate('medium');
        openSmileyModal(s);
      }, 600);
    };
    const cancelPress = () => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    };
    const endPress = () => {
      cancelPress();
      if (longPressed) return;

      const idx = state.shelf.indexOf(s);
      if (idx !== -1) {
        if (s === '🔥' && state.fireStreak > 0) {
          if (!confirm(`Снять 🔥? Серия (${state.fireStreak} дн.) сохранится, но перестанет расти.`)) return;
        }
        state.shelf[idx] = null;
        vibrate('light');
        toast(`Снято с полки: ${s}`);
      } else {
        const free = state.shelf.indexOf(null);
        if (free === -1) { toast('Нет свободных мест на полке!'); return; }
        state.shelf[free] = s;
        vibrate('light');
        toast(`Поставлено на полку: ${s}`);
      }
      renderShelf();
      renderHeader();
      saveState();
    };

    el.addEventListener('mousedown', startPress);
    el.addEventListener('mouseup', endPress);
    el.addEventListener('mouseleave', cancelPress);
    el.addEventListener('touchstart', startPress, { passive: true });
    el.addEventListener('touchend', (e) => { e.preventDefault(); endPress(); });
    el.addEventListener('touchcancel', cancelPress);
    el.addEventListener('contextmenu', e => e.preventDefault());
  });
}

function openSmileyModal(s) {
  const onShelf = state.shelf.includes(s);
  const hal = (ENABLE_HALLOWEEN && HALLOWEEN_ITEMS[s]) ? HALLOWEEN_ITEMS[s] : null;
  const sm = SMILEYS[s];
  const meta = hal || sm;

  let price = 0;
  if (!hal && sm) {
    if (sm.tier === 'normal') price = CASE_REFUND;
    else if (sm.tier === 'gold') price = GOLD_CASE_REFUND;
    else if (sm.tier === 'legendary') price = LEGENDARY_CASE_REFUND;
    else price = THEMATIC_CASE_REFUND;
    if (state.shelf.includes('🪙')) price = Math.floor(price * 1.5);
  }

  let buffHTML = '';
  if (hal) {
    buffHTML = `<b>Баф:</b> ${hal.label}<br>`;
  } else if (sm) {
    buffHTML = `<b>Баф:</b> ${sm.label}<br>`;
    if (sm.offline) buffHTML += `💤 Оффлайн ×${sm.offline.mul.toFixed(2)}, кап ${fmt(sm.offline.cap)}<br>`;
    if (sm.tier === 'gold') buffHTML += '<span style="color:#ffd700">⭐ Золотой</span><br>';
    if (sm.tier === 'legendary') buffHTML += '<span style="color:#d97aff">🌟 Легендарный</span><br>';
    if (sm.tier === 'thematic') buffHTML += '<span style="color:#9cf">🎭 Тематический</span><br>';
  }

  const buttons = [];
  buttons.push({
    label: onShelf ? 'Снять с полки' : 'Поставить на полку',
    onClick: () => {
      if (onShelf) {
        if (s === '🔥' && state.fireStreak > 0) {
          if (!confirm(`Снять 🔥? Серия (${state.fireStreak} дн.) сохранится.`)) return;
        }
        const idx = state.shelf.indexOf(s);
        state.shelf[idx] = null;
        vibrate('light');
        toast(`Снято: ${s}`);
      } else {
        const free = state.shelf.indexOf(null);
        if (free === -1) { toast('Нет свободных мест!'); return; }
        state.shelf[free] = s;
        vibrate('light');
        toast(`Поставлено: ${s}`);
      }
      renderShelf();
      renderHeader();
      saveState();
    },
  });

  if (!hal) {
    buttons.push({
      label: `Продать за ${fmt(price)} ${coinIcon()}`,
      cls: 'danger',
      onClick: () => {
        if (onShelf) { toast('Сначала сними с полки!'); return; }
        const idx = state.inventory.indexOf(s);
        if (idx === -1) return;
        state.inventory.splice(idx, 1);
        state.balance += price;
        vibrateNotification('success');
        toast(`Продано: ${s} за ${fmt(price)}`);
        renderShelf();
        renderHeader();
        saveState();
      },
    });
  }

  buttons.push({ label: 'Закрыть' });

  showModal({
    emoji: s,
    title: hal ? (hal.name + ' · ' + (onShelf ? 'на полке' : 'в инвентаре')) : (onShelf ? 'На полке' : 'В инвентаре'),
    desc: buffHTML,
    buttons,
  });
}

/* ============================================================
   BANK
============================================================ */
function renderBank() {
  if (!content) return;
  const html = [];

  html.push(`<div class="section-title">🏦 Банк</div>`);

  /* Копилка */
  html.push(`<div class="section-title">🐷 Копилка оффлайна</div>`);
  const capTotal = offlineCapTotal();
  const hasGhost = shelfBuffs().hasGhost;
  const filled = state.pendingOffline;
  const pct = capTotal > 0 ? Math.min(100, (filled / capTotal) * 100) : 0;

  let sourcesHTML = '';
  if (capTotal > 0) {
    const sources = [];
    const seen = {};
    for (const slot of state.shelf) {
      if (!slot) continue;
      const meta = SMILEYS[slot];
      if (meta && meta.offline && !seen[slot]) {
        seen[slot] = true;
        const m = meta.offline.mul * (shelfBuffs().hasVampire ? 2 : 1);
        const c = meta.offline.cap * (shelfBuffs().hasVampire ? 2 : 1);
        sources.push(`${slot} ×${m.toFixed(1)} CPS, кап ${fmt(c)}`);
      }
    }
    sourcesHTML = sources.length ? sources.map(s => '· ' + s).join('<br>') : '';
  } else {
    sourcesHTML = `<span style="opacity:0.7">Поставь 😎/🏆/🦄 на полку</span>`;
  }

  html.push(`
    <div class="piggy-card">
      <div class="piggy-counter">${fmt(filled)} <small>/ ${capTotal > 0 ? fmt(capTotal) : '—'}</small></div>
      <div class="piggy-bar"><div class="piggy-fill" style="width:${pct}%"></div></div>
      <div class="piggy-sources">${sourcesHTML}${hasGhost ? '<br><span style="color:#ff9c9c">👻 Призрак блокирует оффлайн!</span>' : ''}</div>
      <button class="btn big" id="piggyClaim" style="width:100%" ${filled <= 0 ? 'disabled' : ''}>Забрать ${fmt(filled)} ${coinIcon()}</button>
    </div>
  `);

  /* Ежедневные награды — ребаланс */
  html.push(`<div class="section-title" style="margin-top:14px">🎁 Ежедневные награды · серия: ${state.rewardDay}/7</div>`);
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const lastVisitDay = state.lastVisit ? (() => { const d = new Date(state.lastVisit); d.setHours(0, 0, 0, 0); return d.getTime(); })() : 0;
  const today = startOfToday.getTime();

  if (lastVisitDay && today - lastVisitDay > DAY) state.rewardDay = 0;
  if (today !== lastVisitDay) state.lastVisit = today;

  const lastClaimDay = state.lastRewardClaim ? (() => { const d = new Date(state.lastRewardClaim); d.setHours(0, 0, 0, 0); return d.getTime(); })() : 0;
  const canClaim = lastClaimDay !== today && state.rewardDay < (state.daily.rewards.length || REWARDS.length);

  const rewards = (state.daily.rewards && state.daily.rewards.length) ? state.daily.rewards : REWARDS;

  html.push(`<div class="reward-grid">`);
  for (let i = 0; i < rewards.length; i++) {
    const cls = [];
    if (i < state.rewardDay) cls.push('claimed');
    if (i === state.rewardDay && canClaim) cls.push('today');
    // 7-й день — тема «Время»
    if (i === 6) {
      html.push(`<div class="reward-day ${cls.join(' ')}"><div class="day">День 7</div><div class="amt">⏳ Время</div></div>`);
    } else {
      html.push(`<div class="reward-day ${cls.join(' ')}"><div class="day">День ${i + 1}</div><div class="amt">${fmt(rewards[i])}</div></div>`);
    }
  }
  html.push(`</div>`);

  if (state.rewardDay >= rewards.length) {
    html.push(`<div class="empty-msg">Все награды получены! 🎉<br>Заходи завтра, серия обновится.</div>`);
  } else if (canClaim) {
    const isDay7 = state.rewardDay === 6;
    html.push(`<button class="btn big" id="claimBtn" style="width:100%;margin-bottom:14px">${isDay7 ? 'Забрать тему «Время»' : `Забрать награду дня ${state.rewardDay + 1}: ${fmt(rewards[state.rewardDay])} ${coinIcon()}`}</button>`);
  } else {
    const msLeft = startOfToday.getTime() + DAY - now;
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    html.push(`<div class="empty-msg" style="margin-bottom:14px">Уже получено сегодня.<br>Следующая через ${h}ч ${m}м.</div>`);
  }

  /* Ежедневные задания */
  html.push(`<div class="section-title" style="margin-top:14px">📅 Ежедневные задания</div>`);
  for (const q of state.daily.quests) {
    const prog = state.daily.progress[q.id] || 0;
    const done = prog >= q.goal;
    const claimed = state.daily.claimed[q.id];

    let rewardStr = '';
    if (q.reward.smiles) rewardStr += `${fmt(q.reward.smiles)} ${coinIcon()}`;
    if (q.reward.candy) rewardStr += ` +${q.reward.candy} 🍬`;

    html.push(`<div class="quest-item ${done ? 'done' : ''}"><div class="quest-info"><div class="quest-title">${q.title}</div><div class="quest-progress">${Math.min(prog, q.goal)} / ${q.goal}</div><div class="quest-reward">Награда: ${rewardStr}</div></div>${claimed ? '<div style="font-size:20px">✓</div>' : (done ? `<button class="btn" data-qclaim="${q.id}">Забрать</button>` : '')}</div>`);
  }

  /* Достижения */
  html.push(`<div class="section-title" style="margin-top:14px">🏅 Достижения (${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length})</div>`);
  for (const a of ACHIEVEMENTS) {
    const done = !!state.achievements[a.id];
    const cur = state.stats[a.stat] || 0;
    let rw = '';
    if (a.reward.smilesBase) rw += `${fmt(a.reward.smilesBase)}+ ${coinIcon()}`;
    if (a.reward.smiley) rw += ` ${a.reward.smiley}`;
    html.push(`<div class="ach-item ${done ? 'done' : ''}"><div class="ach-icon">${a.icon}</div><div class="ach-info"><div class="ach-title">${a.title}</div><div class="ach-desc">${a.desc}</div><div class="ach-progress">${done ? '✓ Получено' : `${Math.min(cur, a.goal)} / ${a.goal}`} · ${rw}</div></div></div>`);
  }

  /* Коды */
  html.push(`<div class="section-title" style="margin-top:14px">🔑 Коды</div>`);
  html.push(`<div class="codes-row"><input id="codeInput" type="text" placeholder="код..." autocomplete="off"><button class="btn" id="codeBtn">Активировать</button></div>`);

  content.innerHTML = html.join('');

  /* Обработчики */
  const pc = document.getElementById('piggyClaim');
  if (pc) pc.addEventListener('click', () => {
    if (state.pendingOffline <= 0) return;
    const amount = state.pendingOffline;
    state.balance += amount;
    state.pendingOffline = 0;
    vibrateNotification('success');
    toast(`+${fmt(amount)} из копилки`);
    render();
  });

  const cb = document.getElementById('claimBtn');
  if (cb) cb.addEventListener('click', claimReward);

  content.querySelectorAll('[data-qclaim]').forEach(b => {
    b.addEventListener('click', () => {
      const qid = b.dataset.qclaim;
      const q = state.daily.quests.find(x => x.id === qid);
      if (!q || state.daily.claimed[qid]) return;
      const prog = state.daily.progress[qid] || 0;
      if (prog < q.goal) return;
      state.daily.claimed[qid] = true;
      vibrateNotification('success');
      grantReward(q.reward, `✅ Задание: ${q.title}`);
      addElo(ELO_REWARDS.dailyQuest);
      renderBank();
      saveState();
    });
  });

  const input = document.getElementById('codeInput');
  const btn = document.getElementById('codeBtn');
  if (btn) btn.addEventListener('click', tryCode);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') tryCode(); });
}

function claimReward() {
  const rewards = (state.daily.rewards && state.daily.rewards.length) ? state.daily.rewards : REWARDS;
  if (state.rewardDay >= rewards.length) return;

  // 7-й день — тема «Время»
  if (state.rewardDay === 6) {
    if (!state.themesOwned.includes('time')) state.themesOwned.push('time');
    state.activeTheme = 'time';
    state.rewardDay += 1;
    state.lastRewardClaim = Date.now();
    vibrateNotification('success');
    toast('⏳ Тема «Время» получена!');
    render();
    return;
  }

  const amount = rewards[state.rewardDay];
  state.balance += amount;
  state.rewardDay += 1;
  state.lastRewardClaim = Date.now();
  vibrateNotification('success');
  toast(`+${fmt(amount)} за день ${state.rewardDay}!`);
  render();
}

function tryCode() {
  const input = document.getElementById('codeInput');
  if (!input) return;
  const code = (input.value || '').trim();
  if (!code) return;
  const key = code.toLowerCase();

  // Объединяем CODES и NEWYEAR_CODES (если есть)
  const allCodes = { ...CODES };
  if (typeof NEWYEAR_CODES !== 'undefined') Object.assign(allCodes, NEWYEAR_CODES);

  const found = Object.keys(allCodes).find(k => k.toLowerCase() === key);

  if (!found) { toast('❌ Неверный код'); input.value = ''; return; }
  if (state.usedCodes.includes(found)) { toast('⚠️ Код уже использован'); input.value = ''; return; }

  state.usedCodes.push(found);
  state.balance += allCodes[found].amount;
  vibrateNotification('success');
  toast(`✅ +${fmt(allCodes[found].amount)}`);
  input.value = '';
  render();
}

/* ============================================================
   BOOSTS
============================================================ */
function renderBoosts() {
  if (!content) return;
  const active = getActiveBoosts();

  const html = [];
  html.push(`<div class="section-title">⚡ Бусты</div>`);
  html.push(`<div class="card-sub" style="text-align:center;margin-bottom:12px">Бусты дают временные усиления. Активация — вручную.</div>`);

  for (const id of Object.keys(BOOSTS)) {
    const b = BOOSTS[id];
    const isActive = active[id] > 0;
    const left = isActive ? Math.ceil(active[id] / 60000) : 0;

    html.push(`
      <div class="card">
        <div class="card-info">
          <div class="card-title">${b.emoji} ${b.name}</div>
          <div class="card-sub">${b.desc}</div>
          ${isActive ? `<div class="card-sub" style="color:#4cd964">⏱ Осталось: ${left} мин</div>` : ''}
        </div>
        <button class="btn ${isActive ? 'gold' : ''}" data-boost="${id}" ${isActive ? 'disabled' : ''}>${isActive ? 'Активен' : 'Активировать'}</button>
      </div>
    `);
  }

  content.innerHTML = html.join('');

  content.querySelectorAll('[data-boost]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.boost;
      // Активация только если есть право (например, за подарки) — упрощаем: даём всем
      if (activateBoost(id)) {
        renderBoosts();
        renderHeader();
      }
    });
  });
}

/* ============================================================
   STUFF
============================================================ */
function renderStuff() {
  if (!content) return;
  const html = [];
  html.push(`<div class="section-title">🧸 Stuff</div>`);
  html.push(`<div class="card-sub" style="text-align:center;margin-bottom:12px">Персонажи ходят по экрану и помогают.</div>`);

  for (const id of Object.keys(STUFFS)) {
    const s = STUFFS[id];
    const owned = !!state.stuffs[id];
    const active = state.activeStuff === id;

    html.push(`
      <div class="card">
        <div class="card-info">
          <div class="card-title">${s.emoji} ${s.name} ${active ? '· активен' : ''}</div>
          <div class="card-sub">${s.desc}</div>
          <div class="card-sub">${owned ? '✅ Есть' : '🔒 Не получен'}</div>
        </div>
        <button class="btn" data-stuff="${id}" ${!owned ? 'disabled' : ''} ${active ? 'disabled' : ''}>${active ? 'Активен' : 'Выбрать'}</button>
      </div>
    `);
  }

  // Эльф — вкл/выкл
  html.push(`<div class="toggle-row" style="margin-top:12px"><div><div class="card-title">Эльф на экране</div><div class="card-sub">Показывать помощника</div></div><div class="toggle ${state.elfEnabled ? 'on' : ''}" id="elfToggle"></div></div>`);

  content.innerHTML = html.join('');

  content.querySelectorAll('[data-stuff]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.stuff;
      if (!state.stuffs[id]) return;
      state.activeStuff = id;
      vibrate('medium');
      toast(`Активен: ${STUFFS[id].name}`);
      renderStuff();
      if (typeof renderStuffOnScreen === 'function') renderStuffOnScreen();
      saveState();
    });
  });

  const elfT = document.getElementById('elfToggle');
  if (elfT) elfT.addEventListener('click', () => {
    state.elfEnabled = !state.elfEnabled;
    elfT.classList.toggle('on', state.elfEnabled);
    if (typeof renderStuffOnScreen === 'function') renderStuffOnScreen();
    saveState();
  });
}

/* ============================================================
   ADVENT
============================================================ */
function renderAdvent() {
  if (!content) return;
  const html = [];
  html.push(`<div class="section-title">🎄 Адвент-календарь</div>`);
  html.push(`<div class="card-sub" style="text-align:center;margin-bottom:12px">25.12.2026 – 07.01.2027 · 14 дней</div>`);

  const today = getAdventDay();
  html.push(`<div class="reward-grid" style="grid-template-columns: repeat(2, 1fr);">`);

  for (const r of ADVENT_REWARDS) {
    const claimed = state.advent.claimed[r.day];
    const available = canClaimAdvent(r.day);
    const locked = r.day > today;

    const cls = claimed ? 'claimed' : (available ? 'today' : '');

    html.push(`
      <div class="reward-day ${cls}" style="padding:14px 8px">
        <div class="day">День ${r.day}</div>
        <div class="amt" style="font-size:12px">${r.label}</div>
        ${claimed ? '<div style="font-size:11px">✓</div>' : (available ? `<button class="btn" data-advent="${r.day}" style="margin-top:6px;padding:6px 10px;font-size:12px">Забрать</button>` : (locked ? '<div style="font-size:11px;opacity:0.5">🔒</div>' : ''))}
      </div>
    `);
  }
  html.push(`</div>`);

  content.innerHTML = html.join('');

  content.querySelectorAll('[data-advent]').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = +btn.dataset.advent;
      if (claimAdvent(day)) {
        toast(`🎄 День ${day}: награда получена!`);
        renderAdvent();
        renderHeader();
      }
    });
  });
}

/* ============================================================
   DAILY SHOP
============================================================ */
function renderDailyShop() {
  if (!content) return;
  const html = [];
  html.push(`<div class="section-title">🛍️ Ежедневный магазин</div>`);
  html.push(`<div class="card-sub" style="text-align:center;margin-bottom:12px">3 предмета · обновляется каждый день</div>`);

  for (const item of state.dailyShop.items) {
    let label = '';
    if (item.type === 'boost') label = `${BOOSTS[item.boostId].emoji} ${BOOSTS[item.boostId].name}`;
    else if (item.type === 'case') label = `📦 Кейс: ${item.caseKind}`;
    else if (item.type === 'smiley') label = `Смайл ${item.smiley}`;
    else if (item.type === 'smiles') label = `${fmt(item.amount)} ${coinIcon()}`;

    html.push(`
      <div class="card">
        <div class="card-info">
          <div class="card-title">${label}</div>
          <div class="card-sub">Цена: ${fmt(item.price)} ${coinIcon()}</div>
        </div>
        <button class="btn" data-shop="${item.type}" ${item.bought ? 'disabled' : ''}>${item.bought ? 'Куплено' : 'Купить'}</button>
      </div>
    `);
  }

  content.innerHTML = html.join('');

  content.querySelectorAll('[data-shop]').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const item = state.dailyShop.items[i];
      if (!item || item.bought) return;
      if (state.balance < item.price) { toast('Недостаточно средств'); return; }

      state.balance -= item.price;
      item.bought = true;

      if (item.type === 'boost') activateBoost(item.boostId);
      else if (item.type === 'case') {
        // Просто выдаём кейс — открывается во вкладке «Кейсы»
        toast(`📦 Кейс ${item.caseKind} добавлен (открой во вкладке «Кейсы»)`);
        // Для простоты — сразу открываем
        if (typeof openCase === 'function') setTimeout(() => openCase(item.caseKind), 100);
      } else if (item.type === 'smiley') {
        if (!state.inventory.includes(item.smiley)) state.inventory.push(item.smiley);
        else state.balance += item.price;
      } else if (item.type === 'smiles') {
        state.balance += item.amount;
      }

      vibrateNotification('success');
      renderDailyShop();
      renderHeader();
      saveState();
    });
  });
}

/* ============================================================
   RANK
============================================================ */
function renderRank() {
  if (!content) return;
  const current = getRank(state.elo);
  const html = [];

  html.push(`<div class="section-title">💎 Ранг</div>`);
  html.push(`
    <div class="card column" style="text-align:center;padding:20px">
      <div style="font-size:60px">${current.emoji}</div>
      <div class="card-title" style="font-size:22px;color:${current.color}">${current.name}</div>
      <div class="card-sub">Elo: ${fmt(state.elo)}</div>
    </div>
  `);

  html.push(`<div class="section-title">📊 Все ранги</div>`);
  for (const r of RANKS) {
    const isCurrent = r.id === current.id;
    html.push(`
      <div class="card ${isCurrent ? 'done' : ''}" style="${isCurrent ? 'border-color:' + r.color : ''}">
        <div class="card-info">
          <div class="card-title">${r.emoji} ${r.name}</div>
          <div class="card-sub">от ${fmt(r.min)} Elo</div>
        </div>
        ${isCurrent ? '<div style="color:#9cff9c;font-weight:800">✓</div>' : ''}
      </div>
    `);
  }

  html.push(`<div class="section-title" style="margin-top:14px">📈 Как получать Elo</div>`);
  html.push(`<div class="card-sub" style="line-height:1.8;padding:0 4px">
    · Клик: +${ELO_REWARDS.click}<br>
    · Серия 🔥: +${ELO_REWARDS.fireStreakDay} в день<br>
    · Достижение: +${ELO_REWARDS.achievement}<br>
    · Ежедневка: +${ELO_REWARDS.dailyQuest}<br>
    · Кейс: +${ELO_REWARDS.caseOpen}<br>
    · Крафт: +${ELO_REWARDS.craft}<br>
    · Ивент: +${ELO_REWARDS.eventAction}
  </div>`);

  content.innerHTML = html.join('');
     }
