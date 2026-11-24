/* ============================================================
   MAIN — boot, tabs, loop, оффлайн-хуки, бусты, подарки
============================================================ */

/* ============================================================
   TABS — обработчик кликов
============================================================ */
if (tabsEl) {
  tabsEl.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    if (btn.dataset.tab === 'event' && !ENABLE_HALLOWEEN) return;
    if (btn.dataset.tab === 'tester' && !IS_TESTER) return;

    if (currentTab === 'crash' && typeof crash !== 'undefined' && crash.active) {
      cashOut();
    }

    currentTab = btn.dataset.tab;
    caseAnimating = false;
    vibrate('light');
    render();
  });
}

/* ============================================================
   OFFLINE — visibilitychange / pagehide / beforeunload
============================================================ */
let _wasHidden = false;

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    _wasHidden = true;
    saveState();
    if (typeof resetGlitch === 'function') resetGlitch();
  } else if (_wasHidden) {
    _wasHidden = false;
    if (typeof resetGlitch === 'function') resetGlitch();
    computeOffline();
    state.lastOnline = Date.now();
    renderHeader();
    if (state.pendingOffline > 0) {
      toast(`💤 Накоплено ${fmt(state.pendingOffline)} — забери в Банке`);
    }
  }
});

window.addEventListener('pagehide', () => {
  saveState();
  if (typeof resetGlitch === 'function') resetGlitch();
});

window.addEventListener('beforeunload', () => {
  saveState();
});

/* ============================================================
   PERSISTENT STORAGE
============================================================ */
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

/* ============================================================
   LOOP — CPS и конфеты
============================================================ */
let lastTick = Date.now();

setInterval(() => {
  const now = Date.now();
  let dt = (now - lastTick) / 1000;
  lastTick = now;
  if (dt > 5) dt = 5;

  const cps = totalCps();
  if (cps > 0) {
    state.balance += cps * dt;
    renderHeader();
  }

  if (ENABLE_HALLOWEEN) {
    const ccps = candyCps();
    if (ccps > 0 && state.halloween) {
      state.halloween.candyFrac += ccps * dt;
      if (state.halloween.candyFrac >= 1) {
        const whole = Math.floor(state.halloween.candyFrac);
        state.halloween.candy += whole;
        state.halloween.candyFrac -= whole;
      }
    }
  }
}, 100);

/* ============================================================
   SAVE — каждые 5 секунд + обновление магазина
   ФИКС: не пересоздавать shop, если открыт input
============================================================ */
setInterval(() => {
  saveState();
  if (currentTab === 'shop') {
    const active = document.activeElement;
    if (!active || active.tagName !== 'INPUT') {
      renderShop();
    }
  }
}, 5000);

/* ============================================================
   BOOSTS — тик каждую секунду
============================================================ */
setInterval(() => {
  if (typeof tickBoostsUI === 'function') tickBoostsUI();
}, 1000);

/* ============================================================
   GLITCH — случайный триггер
============================================================ */
setInterval(() => {
  if (typeof maybeRandomGlitch === 'function') maybeRandomGlitch();
}, 1000);

/* ============================================================
   BOOT
============================================================ */
ensureDaily();
computeOffline();
buildTabs();

/* Сброс @DAN_1_HOMEP — одноразово */
if (typeof checkDanReset === 'function') checkDanReset();

/* Capture console для тестера */
if (typeof IS_TESTER !== 'undefined' && IS_TESTER && typeof captureConsole === 'function') {
  captureConsole();
}

/* Запуск спавна подарков */
if (typeof startGiftSpawner === 'function') startGiftSpawner();

/* Отрисовка */
render();

/* Эльф на экране */
if (typeof renderStuffOnScreen === 'function') {
  setTimeout(() => renderStuffOnScreen(), 1000);
}

/* Компенсация Хэллоуина */
if (state.compensationAmount > 0 && !state.compensationShown) {
  setTimeout(() => {
    showModal({
      emoji: '🎃',
      title: 'Компенсация за Хэллоуин',
      desc: `Ивент завершён. Твои конфеты, пасс и стуки в дверь конвертированы в <b>${fmt(state.compensationAmount)}</b> смайлов.<br><br>Все предметы и анимки сохранены.`,
      buttons: [{
        label: 'Забрать',
        onClick: () => {
          state.compensationShown = true;
          renderHeader();
          saveState();
        },
      }],
    });
  }, 500);
}

/* Тост оффлайна */
if (state.pendingOffline > 0) {
  setTimeout(() => {
    if (currentTab !== 'bank') {
      toast(`💤 Накоплено ${fmt(state.pendingOffline)} — забери в Банке`);
    }
  }, 1500);
}

setInterval(() => {
  if (state.activeTheme === 'time') {
    document.body.classList.toggle('time-flipped');
  }
}, 120000);
