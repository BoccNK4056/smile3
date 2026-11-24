/* ============================================================
   RANKS — утилиты для рангов (логика в state.js)
============================================================ */

/* ============================================================
   ПОЛУЧИТЬ РАНГ (уже есть в state.js, но продублируем для удобства)
   — не нужно, getRank уже глобальная
============================================================ */

/* ============================================================
   ПРОГРЕСС ДО СЛЕДУЮЩЕГО РАНГА
============================================================ */
function getRankProgress() {
  const elo = state.elo || 0;
  const current = getRank(elo);
  const idx = RANKS.findIndex(r => r.id === current.id);
  if (idx === -1 || idx >= RANKS.length - 1) {
    return { current, next: null, progress: 1, needed: 0 };
  }
  const next = RANKS[idx + 1];
  const span = next.min - current.min;
  const done = elo - current.min;
  const progress = span > 0 ? Math.min(1, done / span) : 1;
  return { current, next, progress, needed: Math.max(0, next.min - elo) };
}

/* ============================================================
   ОТОБРАЖЕНИЕ РАНГА (строка)
============================================================ */
function renderRankLine() {
  const r = getRank(state.elo || 0);
  return `${r.emoji} ${r.name} · Elo: ${fmt(state.elo || 0)}`;
}

/* ============================================================
   ДОБАВИТЬ ELO ЗА ДЕЙСТВИЕ (хелпер)
============================================================ */
function addEloForAction(action) {
  if (!ELO_REWARDS[action]) return;
  if (typeof addElo === 'function') addElo(ELO_REWARDS[action]);
          }
