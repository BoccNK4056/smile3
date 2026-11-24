/* ============================================================
   ADVENT — адвент-календарь (логика в state.js)
   Этот файл — только утилиты и хелперы
============================================================ */

/* ============================================================
   ПРОВЕРКА ДОСТУПНОСТИ ДНЯ
============================================================ */
function getAdventStatus() {
  if (typeof isAdvent !== 'function' || !isAdvent()) {
    return { active: false, today: 0, total: ADVENT_DAYS, claimed: 0 };
  }
  const today = getAdventDay();
  const claimed = Object.keys(state.advent.claimed || {}).length;
  return { active: true, today, total: ADVENT_DAYS, claimed };
}

/* ============================================================
   ЗАБРАТЬ НАГРАДУ
============================================================ */
function tryClaimAdvent(day) {
  if (typeof canClaimAdvent !== 'function' || !canClaimAdvent(day)) {
    toast('Недоступно');
    return false;
  }
  if (claimAdvent(day)) {
    vibrateNotification('success');
    toast(`🎄 День ${day}: награда получена!`);
    if (typeof currentTab !== 'undefined' && currentTab === 'advent') {
      if (typeof renderAdvent === 'function') renderAdvent();
    }
    if (typeof renderHeader === 'function') renderHeader();
    return true;
  }
  return false;
}

/* ============================================================
   ОСТАЛОСЬ ДНЕЙ
============================================================ */
function getAdventDaysLeft() {
  if (typeof isAdvent !== 'function' || !isAdvent()) return 0;
  const now = Date.now();
  const diff = ADVENT_END - now;
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/* ============================================================
   ПРОВЕРКА, ПРОСРОЧЕН ЛИ АДВЕНТ
============================================================ */
function isAdventExpired() {
  return Date.now() > ADVENT_END;
}

/* ============================================================
   ОЧИСТКА (если адвент прошёл — пометить всё как сгоревшее)
============================================================ */
function cleanupAdvent() {
  if (!isAdventExpired()) return;
  // Все невыбранные дни — сгорают. Просто оставляем как есть.
  // Если нужно — можно записать флаг, что адвент закончился.
  state.adventExpired = true;
}
