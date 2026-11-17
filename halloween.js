/* ============================================================
   HALLOWEEN — изолированный ивент
   ⚠️ Если ENABLE_HALLOWEEN = false — весь файл неактивен.
   Данные (candy, passClaimed, items) сохраняются в state.
============================================================ */

(function () {
  if (!ENABLE_HALLOWEEN) return;

  /* ============================================================
     RENDER EVENT
  ============================================================ */
  window.renderEvent = function renderEvent() {
    if (!ENABLE_HALLOWEEN || !content || !state.halloween) return;
    const h = state.halloween;
    const items = Object.keys(h.items).filter(k => h.items[k]);
    const html = [];

    html.push(`<div class="section-title">🎃 Хэллоуин-ивент</div><div class="candy-display">🍬 Конфеты: <b>${fmt(h.candy)}</b>${h.candyFrac > 0 ? ` (+${h.candyFrac.toFixed(2)})` : ''}</div>`);

    /* Пасс */
    html.push(`<div class="section-title" style="margin-top:6px">🎟️ Хэллоуин-пасс · ${h.passLevel}/5</div>`);
    const passPct = (h.passLevel / PASS_LEVELS.length) * 100;
    html.push(`<div class="pass-bar"><div class="pass-fill" style="width:${passPct}%"></div></div>`);

    for (const lv of PASS_LEVELS) {
      const claimed = h.passClaimed.includes(lv.lvl);
      const locked = lv.lvl > 1 && !h.passClaimed.includes(lv.lvl - 1);
      const canBuy = !claimed && !locked && h.candy >= lv.price;
      const cls = claimed ? 'claimed' : (locked ? 'locked' : '');
      const icon = claimed ? '✅' : (locked ? '🔒' : '🎁');

      html.push(`
        <div class="pass-level ${cls}">
          <div class="lvl-num">${icon}<br><span style="font-size:11px">${lv.lvl}</span></div>
          <div class="lvl-info">
            <div class="lvl-title">${lv.title}</div>
            <div class="lvl-reward">${lv.reward}</div>
            <div class="lvl-price">${fmt(lv.price)} 🍬</div>
          </div>
          ${claimed ? '<div style="font-size:12px;font-weight:800;color:#9cff9c">Куплено</div>' : (locked ? '<div style="font-size:12px;opacity:0.6">🔒</div>' : `<button class="btn" data-pass="${lv.lvl}" ${!canBuy ? 'disabled' : ''}>Купить</button>`)}
        </div>
      `);
    }

    /* Дверь */
    html.push(`<div class="section-title" style="margin-top:14px">🚪 Стук в дверь</div>`);
    html.push(`<div class="door-wrap"><div class="door-visual" id="doorVisual">🚪</div></div>`);
    html.push(`<button class="btn big" id="knockBtn" style="width:100%;margin-bottom:14px">Постучать (${DOOR_COST} 🍬)</button>`);

    /* Обменник */
    html.push(`<div class="section-title">🍬 Обменник</div>`);
    html.push(`<div class="card"><div class="card-info"><div class="card-title">1 конфета</div><div class="card-sub">за ${fmt(CANDY_EXCHANGE)}</div></div><button class="btn" id="exchBtn">Обменять</button></div>`);
    html.push(`<div class="card"><div class="card-info"><div class="card-title">×10 конфет</div><div class="card-sub">за ${fmt(CANDY_EXCHANGE * 10)}</div></div><button class="btn" id="exch10Btn">Обменять</button></div>`);

    /* Конфетные апгрейды */
    html.push(`<div class="section-title" style="margin-top:14px">⬆️ Конфетные улучшения</div>`);
    for (const u of HALLOWEEN_UPGRADES) {
      const lvl = h.halUpgrades[u.id] || 0;
      const price = getHalloweenUpgradePrice(u);
      html.push(`<div class="card"><div class="card-info"><div class="card-title">${u.name} ${lvl ? `<span style="opacity:0.7">(ур. ${lvl})</span>` : ''}</div><div class="card-sub">${u.desc}</div></div><button class="btn" data-halupg="${u.id}" ${h.candy < price ? 'disabled' : ''}>${fmt(price)} 🍬</button></div>`);
    }

    /* Предметы */
    html.push(`<div class="section-title" style="margin-top:14px">🎃 Предметы (${items.length}/${HALLOWEEN_LIST.length})</div><div class="card-sub" style="padding:0 4px 8px;opacity:0.8">Ставятся на полку во вкладке «Полка»</div><div class="hal-grid">`);
    for (const s of HALLOWEEN_LIST) {
      const owned = !!h.items[s];
      if (owned) {
        html.push(`<div class="hal-item active">${s}<div class="buff-badge">${HALLOWEEN_ITEMS[s].label}</div></div>`);
      } else {
        html.push(`<div class="hal-item" style="opacity:0.3">❓</div>`);
      }
    }
    html.push(`</div>`);

    content.innerHTML = html.join('');

    document.getElementById('knockBtn').addEventListener('click', knockDoor);
    document.getElementById('exchBtn').addEventListener('click', () => exchangeCandy(1));
    document.getElementById('exch10Btn').addEventListener('click', () => exchangeCandy(10));
    content.querySelectorAll('[data-halupg]').forEach(b => {
      b.addEventListener('click', () => buyHalloweenUpgrade(b.dataset.halupg));
    });
    content.querySelectorAll('[data-pass]').forEach(b => {
      b.addEventListener('click', () => buyPassLevel(+b.dataset.pass));
    });
  };

  /* ============================================================
     PASS
  ============================================================ */
  function buyPassLevel(lvl) {
    const h = state.halloween;
    const level = PASS_LEVELS.find(l => l.lvl === lvl);
    if (!level) return;
    if (h.passClaimed.includes(lvl)) return;
    if (lvl > 1 && !h.passClaimed.includes(lvl - 1)) { toast('Сначала купи предыдущий уровень'); return; }
    if (h.candy < level.price) { toast('Недостаточно конфет'); return; }

    h.candy -= level.price;
    h.passClaimed.push(lvl);
    h.passLevel = Math.max(h.passLevel, lvl);

    if (lvl === 1) {
      if (!h.items['🎭']) h.items['🎭'] = true;
      if (!state.inventory.includes('🎭')) state.inventory.push('🎭');
    }
    if (lvl === 2) h.clickBonusFlat = (h.clickBonusFlat || 0) + 100;
    if (lvl === 3) h.clickBonusFlat = (h.clickBonusFlat || 0) + 500;
    if (lvl === 4) {
      if (!state.themesOwned.includes('halloween')) state.themesOwned.push('halloween');
    }
    if (lvl === 5) {
      if (!state.animationsOwned.includes('spiders')) state.animationsOwned.push('spiders');
      state.clickAnimation = 'spiders';
    }

    vibrateNotification('success');
    toast(`🎟️ Пасс уровень ${lvl}: ${level.title}`);
    renderEvent();
    renderHeader();
    saveState();
  }

  /* ============================================================
     HALLOWEEN UPGRADE
  ============================================================ */
  function buyHalloweenUpgrade(id) {
    const u = HALLOWEEN_UPGRADES.find(x => x.id === id);
    if (!u) return;
    const price = getHalloweenUpgradePrice(u);
    if (state.halloween.candy < price) return;
    state.halloween.candy -= price;
    state.halloween.halUpgrades[id] = (state.halloween.halUpgrades[id] || 0) + 1;
    vibrate('medium');
    toast(`Куплено: ${u.name}`);
    renderEvent();
    saveState();
  }

  /* ============================================================
     EXCHANGE
  ============================================================ */
  function exchangeCandy(n) {
    const cost = CANDY_EXCHANGE * n;
    if (state.balance < cost) { toast('Недостаточно средств'); return; }
    state.balance -= cost;
    state.halloween.candy += n;
    vibrateNotification('success');
    toast(`+${n} 🍬`);
    renderEvent();
    renderHeader();
    saveState();
  }

  /* ============================================================
     DOOR — стук
  ============================================================ */
  let doorBusy = false;

  function knockDoor() {
    if (doorBusy) return;
    if (state.halloween.candy < DOOR_COST) { toast(`Нужно ${DOOR_COST} 🍬`); return; }

    doorBusy = true;
    state.halloween.candy -= DOOR_COST;
    bumpDaily('dKnocks');
    renderHeader();
    vibrate('heavy');

    const cd = content.querySelector('.candy-display');
    if (cd) cd.innerHTML = `🍬 Конфеты: <b>${fmt(state.halloween.candy)}</b>`;

    const door = document.getElementById('doorVisual');
    if (!door) { doorBusy = false; return; }

    const vw = window.innerWidth, vh = window.innerHeight;
    const positions = [
      { x: vw * 0.3, y: vh * 0.3, r: -15 },
      { x: vw * 0.7, y: vh * 0.35, r: 12 },
      { x: vw * 0.5, y: vh * 0.45, r: -8 },
    ];

    positions.forEach((p, i) => {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'knock-anim';
        el.textContent = 'тук';
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
        el.style.setProperty('--r', p.r + 'deg');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
      }, i * 400);
    });

    setTimeout(() => {
      if (door) door.classList.add('opening');
      setTimeout(() => {
        const roll = pickByWeight(HALLOWEEN_LIST.map(s => ({ s, w: 1 })));
        const isDup = !!state.halloween.items[roll];

        if (isDup) {
          showGadost();
          vibrateNotification('error');
          toast(`Повторка: ${roll} · без возврата`);
        } else {
          state.halloween.items[roll] = true;
          vibrateNotification('success');
          toast(`🎁 Получен предмет: ${roll} (${HALLOWEEN_ITEMS[roll].name})`);
        }

        state.halloween.doorOpenedCount = (state.halloween.doorOpenedCount || 0) + 1;
        saveState();
        doorBusy = false;
        showDropResult(roll, isDup);
      }, 900);
    }, 1600);
  }

  /* ============================================================
     DROP RESULT / GADOST
  ============================================================ */
  function showDropResult(roll, isDup) {
    showModal({
      emoji: roll,
      title: isDup ? 'Повторка!' : 'Новый предмет!',
      desc: `<b>${HALLOWEEN_ITEMS[roll].name}</b><br>${HALLOWEEN_ITEMS[roll].label}${isDup ? '<br><br><span style="color:#ff9c9c">Без возврата.</span>' : '<br><br>Можно поставить на полку!'}`,
      buttons: [{
        label: 'Ок',
        onClick: () => { renderEvent(); renderHeader(); },
      }],
    });
  }

  function showGadost() {
    const ov = document.createElement('div');
    ov.className = 'gadost-overlay';
    ov.innerHTML = `<div class="gadost-text">ГАДОСТЬ</div>`;
    document.body.appendChild(ov);
    setTimeout(() => ov.remove(), 5000);
  }

})();
