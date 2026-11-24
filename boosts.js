/* ============================================================
   BOOSTS — визуализация и тик (логика в state.js)
============================================================ */

/* ============================================================
   ТИК БУСТОВ — вызывается из main.js каждую секунду
============================================================ */
function tickBoostsUI() {
  if (typeof tickBoosts !== 'function') return;
  const changed = tickBoosts();
  if (changed) {
    if (typeof renderHeader === 'function') renderHeader();
    if (typeof currentTab !== 'undefined' && currentTab === 'boosts') {
      if (typeof renderBoosts === 'function') renderBoosts();
    }
  }
}

/* ============================================================
   ФОРМАТИРОВАНИЕ ВРЕМЕНИ БУСТА
============================================================ */
function formatBoostTime(ms) {
  if (ms <= 0) return '0с';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

/* ============================================================
   АКТИВНЫЕ БУСТЫ — для отображения
============================================================ */
function renderActiveBoostsLine() {
  if (typeof getActiveBoosts !== 'function') return '';
  const active = getActiveBoosts();
  const parts = [];
  for (const id of Object.keys(active)) {
    const b = BOOSTS[id];
    if (!b) continue;
    parts.push(`${b.emoji} ${b.name} (${formatBoostTime(active[id])})`);
  }
  return parts.join(' · ');
}
