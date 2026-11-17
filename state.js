/* ============================================================
   STATE — состояние игры, сохранение, миграция, бэкап
   ⚠️ КЛЮЧ СОХРАНЕНИЯ: 'smileyClickerSave_v5' — НЕ МЕНЯТЬ!
   Все данные читаются/пишутся только под этим ключом.
============================================================ */

const SAVE_KEY = 'smileyClickerSave_v5';
const BACKUP_KEY = 'smileyClickerSave_v5_backup';

/* ============================================================
   DEFAULT STATE
============================================================ */
function defaultState() {
  const upgrades = {};
  ALL_UPGRADES.forEach(u => upgrades[u.id] = 0);

  const halUpg = {};
  HALLOWEEN_UPGRADES.forEach(u => halUpg[u.id] = 0);

  return {
    version: CURRENT_VERSION,
    balance: 0,
    upgrades,
    shelfLevel: 0,
    inventory: [],
    shelf: [],
    usedCodes: [],
    rewardDay: 0,
    lastVisit: 0,
    lastRewardClaim: 0,
    lastOnline: Date.now(),
    pendingOffline: 0,
    crashHistory: [],
    quickBets: [100, 1000, 10000, 100000, 1000000],
    adminFree: false,
    introSeen: false,
    compensationClaimed: false,
    compensationAmount: 0,

    stats: {
      clicks: 0, upgrades: 0, cases: 0, crafts: 0,
      crashBest: 0, maxBalance: 0, smileysCount: 0,
    },
    achievements: {},

    daily: {
      date: '',
      scale: 1,
      quests: [],
      progress: {},
      claimed: {},
    },

    themesOwned: [],
    activeTheme: 'default',
    themeCaseOpened: 0,
    freezeUntil: 0,

    vibrateEnabled: true,
    clickAnimation: 'default',
    animationsOwned: ['default'],

    // HALLOWEEN — данные сохраняются, даже если ивент выключен
    halloween: {
      candy: 0,
      candyFrac: 0,
      items: {},
      halUpgrades: halUpg,
      lastOnline: Date.now(),
      pendingCandy: 0,
      doorOpenedCount: 0,
      passLevel: 0,
      passClaimed: [],
      clickBonusFlat: 0,
    },
  };
}

/* ============================================================
   FIX SHELF
============================================================ */
function fixShelf(s) {
  const total = 3 + (s.shelfLevel || 0);
  const shelf = Array.isArray(s.shelf) ? s.shelf.slice(0, total) : [];
  while (shelf.length < total) shelf.push(null);
  s.shelf = shelf;
}

/* ============================================================
   INIT NEW
============================================================ */
function initNew() {
  const s = defaultState();
  fixShelf(s);
  s.lastOnline = Date.now();
  s.halloween.lastOnline = Date.now();
  return s;
}

/* ============================================================
   MIGRATE — обновление старого сохранения до CURRENT_VERSION
   Не удаляет данные, только добавляет недостающие поля.
============================================================ */
function migrate(s) {
  if (!s || typeof s !== 'object') return initNew();

  const def = defaultState();
  const v = s.version || 1;

  // Базовый merge: недостающие поля из def, существующие — сохраняем
  const merged = { ...def, ...s };

  // Вложенные объекты — аккуратно
  merged.upgrades = { ...def.upgrades, ...(s.upgrades || {}) };
  merged.stats = { ...def.stats, ...(s.stats || {}) };
  merged.achievements = { ...(s.achievements || {}) };

  merged.daily = { ...def.daily, ...(s.daily || {}) };
  merged.daily.progress = { ...(s.daily?.progress || {}) };
  merged.daily.claimed = { ...(s.daily?.claimed || {}) };
  if (!Array.isArray(merged.daily.quests)) merged.daily.quests = [];
  if (typeof merged.daily.scale !== 'number' || merged.daily.scale <= 0) merged.daily.scale = 1;

  merged.halloween = { ...def.halloween, ...(s.halloween || {}) };
  merged.halloween.halUpgrades = { ...def.halloween.halUpgrades, ...(s.halloween?.halUpgrades || {}) };
  merged.halloween.items = { ...(s.halloween?.items || {}) };
  merged.halloween.passClaimed = Array.isArray(s.halloween?.passClaimed) ? s.halloween.passClaimed : [];

  merged.animationsOwned = Array.isArray(s.animationsOwned) ? s.animationsOwned : ['default'];
  merged.themesOwned = Array.isArray(s.themesOwned) ? s.themesOwned : [];
  merged.crashHistory = Array.isArray(s.crashHistory) ? s.crashHistory : [];
  merged.quickBets = Array.isArray(s.quickBets) && s.quickBets.length ? s.quickBets : def.quickBets;
  merged.usedCodes = Array.isArray(s.usedCodes) ? s.usedCodes : [];
  merged.inventory = Array.isArray(s.inventory) ? s.inventory : [];
  merged.shelf = Array.isArray(s.shelf) ? s.shelf : [];

  if (typeof merged.vibrateEnabled !== 'boolean') merged.vibrateEnabled = true;
  if (typeof merged.introSeen !== 'boolean') merged.introSeen = false;
  if (typeof merged.compensationClaimed !== 'boolean') merged.compensationClaimed = false;
  if (typeof merged.compensationAmount !== 'number') merged.compensationAmount = 0;
  if (typeof merged.adminFree !== 'boolean') merged.adminFree = false;
  if (typeof merged.balance !== 'number' || !isFinite(merged.balance)) merged.balance = 0;
  if (typeof merged.pendingOffline !== 'number' || !isFinite(merged.pendingOffline)) merged.pendingOffline = 0;

  merged.version = CURRENT_VERSION;
  fixShelf(merged);
  return merged;
}

/* ============================================================
   КОМПЕНСАЦИЯ ХЭЛЛОУИНА — одноразово
============================================================ */
function calcHalloweenCompensation(h) {
  if (!h) return 0;
  let total = 0;
  total += (h.candy || 0) * 100;
  total += (h.doorOpenedCount || 0) * 10000;
  const passClaimed = Array.isArray(h.passClaimed) ? h.passClaimed : [];
  total += passClaimed.length * 10000000;
  // потолок
  return Math.min(Math.floor(total), 500000000);
}

function migrateHalloweenCompensation(s) {
  if (s.compensationClaimed) return s;
  const h = s.halloween;
  if (!h) { s.compensationClaimed = true; return s; }

  const hadProgress =
    (h.candy || 0) > 0 ||
    (Array.isArray(h.passClaimed) && h.passClaimed.length > 0) ||
    (h.doorOpenedCount || 0) > 0;

  if (!hadProgress) { s.compensationClaimed = true; return s; }

  const amount = calcHalloweenCompensation(h);
  if (amount > 0) {
    s.balance = (s.balance || 0) + amount;
    s.compensationAmount = amount;
  }

  // Анимка «Пауки» — если был 5 уровень пасса
  if (Array.isArray(h.passClaimed) && h.passClaimed.includes(5)) {
    if (!Array.isArray(s.animationsOwned)) s.animationsOwned = ['default'];
    if (!s.animationsOwned.includes('spiders')) s.animationsOwned.push('spiders');
  }

  s.compensationClaimed = true;
  return s;
}

/* ============================================================
   LOAD STATE — с бэкапом и восстановлением
============================================================ */
function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}

  // Если основного нет — пробуем бэкап
  if (!raw) {
    try { raw = localStorage.getItem(BACKUP_KEY); } catch (e) {}
    if (raw) console.warn('[state] Основное сохранение пусто, загружен бэкап');
  }

  // Совсем ничего — новая игра
  if (!raw) {
    const fresh = initNew();
    return migrateHalloweenCompensation(fresh);
  }

  // Парсим
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('[state] Битый JSON, пробуем бэкап', e);
    try {
      const bak = localStorage.getItem(BACKUP_KEY);
      if (bak) parsed = JSON.parse(bak);
    } catch (e2) {
      console.error('[state] Бэкап тоже битый', e2);
    }
    if (!parsed) {
      const fresh = initNew();
      return migrateHalloweenCompensation(fresh);
    }
  }

  // Миграция
  let migrated;
  try {
    migrated = migrate(parsed);
  } catch (e) {
    console.error('[state] Ошибка миграции', e);
    migrated = initNew();
  }

  // Компенсация Хэллоуина
  try {
    migrated = migrateHalloweenCompensation(migrated);
  } catch (e) {
    console.error('[state] Ошибка компенсации', e);
  }

  return migrated;
}

/* ============================================================
   SAVE STATE — с бэкапом предыдущего успешного
============================================================ */
function saveState() {
  try {
    state.lastOnline = Date.now();
    if (state.halloween) state.halloween.lastOnline = Date.now();
    const raw = JSON.stringify(state);
    // бэкап предыдущего
    try {
      const prev = localStorage.getItem(SAVE_KEY);
      if (prev) localStorage.setItem(BACKUP_KEY, prev);
    } catch (e) {}
    localStorage.setItem(SAVE_KEY, raw);
    return true;
  } catch (e) {
    console.error('[state] Save failed', e);
    // Попытка облегчить и сохранить
    try {
      if (Array.isArray(state.crashHistory)) state.crashHistory = state.crashHistory.slice(-10);
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (e2) {
      console.error('[state] Save failed twice', e2);
      return false;
    }
  }
}

/* ============================================================
   ГЛОБАЛЬНОЕ СОСТОЯНИЕ
============================================================ */
let state = loadState();

/* ============================================================
   ENSURE DAILY — ребаланс ежедневок от прогресса
   Вызывается при загрузке и смене дня.
============================================================ */
function ensureDaily() {
  const today = todayStr();
  if (state.daily.date === today && Array.isArray(state.daily.quests) && state.daily.quests.length > 0) {
    return;
  }

  // Пересчитываем scale от текущего прогресса
  const clickP = (typeof totalClickPower === 'function') ? totalClickPower() : 1;
  const cpsP = (typeof totalCps === 'function') ? totalCps() : 0;
  const avg = (clickP + cpsP) / 2;
  const scale = Math.max(1, Math.floor(avg * 60));

  state.daily.date = today;
  state.daily.scale = scale;
  state.daily.progress = {};
  state.daily.claimed = {};

  // Выбираем 3 квеста из пула без повторов
  const pool = [...DAILY_QUESTS_POOL];
  const chosen = [];
  while (chosen.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  state.daily.quests = chosen.map(q => {
    let goal;
    if (q.mode === 'click') {
      goal = Math.max(q.goalBase, Math.floor(scale * 0.5));
      if (goal > q.goalMax) goal = q.goalMax;
    } else {
      goal = q.goalBase;
    }
    const rewardSmiles = Math.floor(scale * 5);
    const rewardCandy = Math.floor(scale / 1000);
    return {
      id: q.id,
      title: q.title.replace('{goal}', formatNumber(goal)),
      goal,
      stat: q.stat,
      reward: { smiles: rewardSmiles, candy: rewardCandy },
    };
  });

  saveState();
}

/* ============================================================
   BUMP DAILY — прогресс квестов
============================================================ */
function bumpDaily(statKey, amount = 1) {
  if (!state.daily || !Array.isArray(state.daily.quests)) return;
  for (const q of state.daily.quests) {
    if (q.stat === statKey) {
      state.daily.progress[q.id] = (state.daily.progress[q.id] || 0) + amount;
    }
  }
}

/* ============================================================
   STATS HELPERS
============================================================ */
function bumpStat(key, value = 1) {
  state.stats[key] = (state.stats[key] || 0) + value;
  if (typeof checkAchievements === 'function') checkAchievements();
}
function setStatMax(key, value) {
  state.stats[key] = Math.max(state.stats[key] || 0, value);
  if (typeof checkAchievements === 'function') checkAchievements();
}

/* ============================================================
   ACHIEVEMENTS — награда масштабируется по scale
============================================================ */
function checkAchievements() {
  if (!Array.isArray(ACHIEVEMENTS)) return;
  const scale = state.daily?.scale || 1;

  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    if ((state.stats[a.stat] || 0) >= a.goal) {
      state.achievements[a.id] = true;

      const reward = {};
      if (a.reward.smilesBase) reward.smiles = Math.max(a.reward.smilesBase, Math.floor(scale * 5));
      if (a.reward.candyBase) reward.candy = Math.max(a.reward.candyBase, Math.floor(scale / 1000));
      if (a.reward.smiley) reward.smiley = a.reward.smiley;

      if (typeof grantReward === 'function') {
        grantReward(reward, `🏅 Достижение: ${a.title}`);
      }
    }
  }
}

/* ============================================================
   GRANT REWARD — выдача
============================================================ */
function grantReward(reward, msg) {
  if (!reward) return;
  if (reward.smiles) state.balance += reward.smiles;
  if (reward.candy && state.halloween) state.halloween.candy += reward.candy;
  if (reward.smiley) {
    if (!state.inventory.includes(reward.smiley)) state.inventory.push(reward.smiley);
  }
  if (msg && typeof toast === 'function') toast(msg);
  if (typeof renderHeader === 'function') renderHeader();
}

/* ============================================================
   УТИЛИТЫ
============================================================ */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatNumber(n) {
  n = Math.floor(n);
  if (typeof fmt === 'function') return fmt(n);
  return n.toString();
    }
