/* ============================================================
   MAIN — boot, tabs, loop, оффлайн-хуки
============================================================ */

/* ============================================================
   TABS — обработчик кликов
============================================================ */
if (tabsEl) {
  tabsEl.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    if (btn.dataset.tab === 'event' && !ENABLE_HALLOWEEN) return;

    // Авто-кэшаут краша при смене таба
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
    resetGlitch();
  } else if (_wasHidden) {
    _wasHidden = false;
    resetGlitch();                    // ← добавить
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
  resetGlitch();
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

  // Защита от троттлинга в фоне
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
============================================================ */
setInterval(() => {
  saveState();
  if (currentTab === 'shop') renderShop();
}, 5000);

/* ============================================================
   GLITCH — случайный триггер (1 сек)
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
render();

/* Компенсация Хэллоуина — модалка при первом входе */
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

/* Модалка оффлайна — если что-то накопилось */
if (state.pendingOffline > 0) {
  setTimeout(() => {
    if (currentTab !== 'bank') {
      toast(`💤 Накоплено ${fmt(state.pendingOffline)} — забери в Банке`);
    }
  }, 1500);
}
