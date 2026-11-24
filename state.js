/* ============================================================
   STATE — состояние игры, сохранение, миграция, бэкап
   ⚠️ КЛЮЧ СОХРАНЕНИЯ: 'smileyClickerSave_v5' (обычный)
   ⚠️ ПРЕДРЕЛИЗ: 'smileyClickerSave_v5_pre' (если IS_PRE)
   НЕ МЕНЯТЬ _v5 на другой!
============================================================ */

const SAVE_KEY = 'smileyClickerSave_v5';
const BACKUP_KEY = SAVE_KEY + '_backup';

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
      rewards: [],        // ← новые награды (ребаланс)
    },

    themesOwned: [],
    activeTheme: 'default',
    themeCaseOpened: 0,
    freezeUntil: 0,

    vibrateEnabled: true,
    clickAnimation: 'default',
    animationsOwned: ['default'],

    /* ===== ПАТЧ: РАНГ / ELO ===== */
    elo: 0,
    rank: 'bronze',

    /* ===== ПАТЧ: СЕРИЯ 🔥 ===== */
    fireStreak: 0,
    lastFireDate: '',

    /* ===== ПАТЧ: ЕЖЕДНЕВНЫЙ МАГАЗИН ===== */
    dailyShop: {
      date: '',
      items: [],          // [{ type, id, price, bought }]
    },

    /* ===== ПАТЧ: НОВОГОДНИЙ ===== */
    gifts: 0,             // накопленные подарки (сданы Эльфу)
    giftOnScreen: 0,      // счётчик подарков на экране
    elfEnabled: true,     // эльф показывается
    stuffs: {},           // { elf: true, snowman: false, ... }
    activeStuff: 'elf',
    newyearSeen: false,

    /* ===== ПАТЧ: БУСТЫ ===== */
    boosts: {},           // { click5: expireTimestamp, ... }

    /* ===== ПАТЧ: АДВЕНТ ===== */
    advent: {
      claimed: {},        // { 1: true, 2: true, ... }
    },

    /* ===== HALLOWEEN (данные сохраняются) ===== */
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
   RANK HELPERS
============================================================ */
function getRank(elo) {
  if (typeof RANKS === 'undefined' || !RANKS.length) return RANKS?.[0] || { id: 'bronze', name: 'Бронза', emoji: '🥉', min: 0 };
  let current = RANKS[0];
  for (const r of RANKS) {
    if (elo >= r.min) current = r;
    else break;
  }
  return current;
}

function addElo(amount) {
  if (!amount || amount <= 0) return;
  state.elo = (state.elo || 0) + Math.floor(amount);
  const newRank = getRank(state.elo);
  if (newRank.id !== state.rank) {
    state.rank = newRank.id;
    if (typeof toast === 'function') toast(`💎 Новый ранг: ${newRank.name}!`);
    if (typeof vibrateNotification === 'function') vibrateNotification('success');
  }
}

function updateFireStreak() {
  const today = todayStr();
  const last = state.lastFireDate || '';
  if (last === today) return; // уже сегодня

  // 🔥 должен быть на полке
  if (!state.shelf.includes('🔥')) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (last === yStr) {
    state.fireStreak = (state.fireStreak || 0) + 1;
  } else {
    state.fireStreak = 1;
  }
  state.lastFireDate = today;
  addElo(ELO_REWARDS.fireStreakDay);
  if (typeof toast === 'function') toast(`🔥 Серия: ${state.fireStreak} дн.`);
}

/* ============================================================
   MIGRATE
============================================================ */
function migrate(s) {
  if (!s || typeof s !== 'object') return initNew();

  const def = defaultState();
  const merged = { ...def, ...s };

  merged.upgrades = { ...def.upgrades, ...(s.upgrades || {}) };
  merged.stats = { ...def.stats, ...(s.stats || {}) };
  merged.achievements = { ...(s.achievements || {}) };

  merged.daily = { ...def.daily, ...(s.daily || {}) };
  merged.daily.progress = { ...(s.daily?.progress || {}) };
  merged.daily.claimed = { ...(s.daily?.claimed || {}) };
  if (!Array.isArray(merged.daily.quests)) merged.daily.quests = [];
  if (!Array.isArray(merged.daily.rewards)) merged.daily.rewards = [];
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

  /* ===== ПАТЧ: новые поля ===== */
  if (typeof merged.elo !== 'number') merged.elo = 0;
  if (typeof merged.rank !== 'string') merged.rank = getRank(merged.elo).id;
  if (typeof merged.fireStreak !== 'number') merged.fireStreak = 0;
  if (typeof merged.lastFireDate !== 'string') merged.lastFireDate = '';

  merged.dailyShop = { ...def.dailyShop, ...(s.dailyShop || {}) };
  if (!Array.isArray(merged.dailyShop.items)) merged.dailyShop.items = [];

  merged.advent = { ...def.advent, ...(s.advent || {}) };
  if (!merged.advent.claimed) merged.advent.claimed = {};

  merged.boosts = (s.boosts && typeof s.boosts === 'object') ? s.boosts : {};
  merged.stuffs = (s.stuffs && typeof s.stuffs === 'object') ? s.stuffs : {};
  if (typeof merged.gifts !== 'number') merged.gifts = 0;
  if (typeof merged.giftOnScreen !== 'number') merged.giftOnScreen = 0;
  if (typeof merged.elfEnabled !== 'boolean') merged.elfEnabled = true;
  if (typeof merged.activeStuff !== 'string') merged.activeStuff = 'elf';
  if (typeof merged.newyearSeen !== 'boolean') merged.newyearSeen = false;

  /* ===== ПАТЧ: вернуть halloween-тему, если был 4-й уровень пасса ===== */
  if (Array.isArray(merged.halloween.passClaimed) && merged.halloween.passClaimed.includes(4)) {
    if (!merged.themesOwned.includes('halloween')) merged.themesOwned.push('halloween');
  }

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
   КОМПЕНСАЦИЯ ХЭЛЛОУИНА
============================================================ */
function calcHalloweenCompensation(h) {
  if (!h) return 0;
  let total = 0;
  total += (h.candy || 0) * 100;
  total += (h.doorOpenedCount || 0) * 10000;
  const passClaimed = Array.isArray(h.passClaimed) ? h.passClaimed : [];
  total += passClaimed.length * 10000000;
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

  if (Array.isArray(h.passClaimed) && h.passClaimed.includes(5)) {
    if (!Array.isArray(s.animationsOwned)) s.animationsOwned = ['default'];
    if (!s.animationsOwned.includes('spiders')) s.animationsOwned.push('spiders');
  }

  /* ПАТЧ: если 4-й уровень — вернуть тему */
  if (Array.isArray(h.passClaimed) && h.passClaimed.includes(4)) {
    if (!Array.isArray(s.themesOwned)) s.themesOwned = [];
    if (!s.themesOwned.includes('halloween')) s.themesOwned.push('halloween');
  }

  s.compensationClaimed = true;
  return s;
}

/* ============================================================
   СБРОС ИГРОКА @DAN_1_HOMEP (одноразово)
============================================================ */
function checkDanReset() {
  if (typeof TG_USER === 'undefined' || !TG_USER) return;
  if (TG_USER.username !== 'DAN_1_HOMEP') return;
  if (state.danResetDone) return;

  // Полный сброс, но сохраняем только служебные флаги
  const fresh = initNew();
  fresh.danResetDone = true;
  fresh.compensationClaimed = true; // чтобы старая компенсация не начислилась
  fresh.introSeen = state.introSeen; // не показывать интро повторно
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, fresh);
  saveState();
  if (typeof toast === 'function') toast('Прогресс сброшен. Добро пожаловать!');
}

/* ============================================================
   LOAD STATE
============================================================ */
function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}

  if (!raw) {
    try { raw = localStorage.getItem(BACKUP_KEY); } catch (e) {}
    if (raw) console.warn('[state] Основное пусто, загружен бэкап');
  }

  if (!raw) {
    const fresh = initNew();
    return migrateHalloweenCompensation(fresh);
  }

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

  let migrated;
  try {
    migrated = migrate(parsed);
  } catch (e) {
    console.error('[state] Ошибка миграции', e);
    migrated = initNew();
  }

  try {
    migrated = migrateHalloweenCompensation(migrated);
  } catch (e) {
    console.error('[state] Ошибка компенсации', e);
  }

  return migrated;
}

/* ============================================================
   SAVE STATE
============================================================ */
function saveState() {
  try {
    state.lastOnline = Date.now();
    if (state.halloween) state.halloween.lastOnline = Date.now();
    const raw = JSON.stringify(state);
    try {
      const prev = localStorage.getItem(SAVE_KEY);
      if (prev) localStorage.setItem(BACKUP_KEY, prev);
    } catch (e) {}
    localStorage.setItem(SAVE_KEY, raw);
    return true;
  } catch (e) {
    console.error('[state] Save failed', e);
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
   ENSURE DAILY — ребаланс + магазин + адвент + бусты
============================================================ */
function ensureDaily() {
  const today = todayStr();

  // === Квесты (если день не тот) ===
  if (state.daily.date !== today || !Array.isArray(state.daily.quests) || state.daily.quests.length === 0) {
    const clickP = (typeof totalClickPower === 'function') ? totalClickPower() : 1;
    const cpsP = (typeof totalCps === 'function') ? totalCps() : 0;
    const avg = (clickP + cpsP) / 2;
    const scale = Math.max(1, Math.floor(avg * 60));

    state.daily.date = today;
    state.daily.scale = scale;
    state.daily.progress = {};
    state.daily.claimed = {};

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

    /* ПАТЧ: ребаланс ежедневных наград */
    const rewardMults = [1, 2, 3, 5, 8, 12, 20];
    state.daily.rewards = rewardMults.map(m => Math.floor(scale * m));
  }

  // === Ежедневный магазин ===
  generateDailyShop();

  // === Бусты: снять истёкшие ===
  tickBoosts();

  // === Серия 🔥 ===
  updateFireStreak();

  saveState();
}

/* ============================================================
   DAILY SHOP
============================================================ */
function generateDailyShop() {
  const today = todayStr();
  if (state.dailyShop.date === today && Array.isArray(state.dailyShop.items) && state.dailyShop.items.length === DAILY_SHOP_ITEMS) {
    return;
  }

  const pool = [...DAILY_SHOP_POOL];
  const items = [];
  while (items.length < DAILY_SHOP_ITEMS && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const item = pool.splice(idx, 1)[0];
    items.push({ ...item, bought: false });
  }

  state.dailyShop.date = today;
  state.dailyShop.items = items;
}

/* ============================================================
   BOOSTS
============================================================ */
function activateBoost(boostId) {
  if (!BOOSTS[boostId]) return false;
  const boost = BOOSTS[boostId];
  const expire = Date.now() + boost.duration;
  // Если уже активен — перезаписываем (не стакается)
  state.boosts[boostId] = expire;
  if (typeof toast === 'function') toast(`${boost.emoji} ${boost.name} активирован!`);
  if (typeof vibrateNotification === 'function') vibrateNotification('success');
  return true;
}

function tickBoosts() {
  const now = Date.now();
  let changed = false;
  for (const id of Object.keys(state.boosts || {})) {
    if (state.boosts[id] <= now) {
      delete state.boosts[id];
      changed = true;
      if (typeof toast === 'function') toast(`⏱ Буст ${BOOSTS[id]?.name || id} закончился`);
    }
  }
  return changed;
}

function getActiveBoosts() {
  const now = Date.now();
  const result = {};
  for (const id of Object.keys(state.boosts || {})) {
    if (state.boosts[id] > now && BOOSTS[id]) {
      result[id] = state.boosts[id] - now;
    }
  }
  return result;
}

/* ============================================================
   ADVENT
============================================================ */
function isAdvent() {
  const now = Date.now();
  return now >= ADVENT_START && now <= ADVENT_END;
}

function getAdventDay() {
  if (!isAdvent()) return 0;
  const now = Date.now();
  const diff = now - ADVENT_START;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

function canClaimAdvent(day) {
  if (!isAdvent()) return false;
  if (day < 1 || day > ADVENT_DAYS) return false;
  if (day > getAdventDay()) return false; // ещё не наступил
  if (state.advent.claimed[day]) return false;
  return true;
}

function claimAdvent(day) {
  if (!canClaimAdvent(day)) return false;
  const reward = ADVENT_REWARDS.find(r => r.day === day);
  if (!reward) return false;

  state.advent.claimed[day] = true;

  if (reward.type === 'smiles') {
    state.balance += reward.amount;
  } else if (reward.type === 'boost') {
    activateBoost(reward.boostId);
  } else if (reward.type === 'smiley') {
    if (!state.inventory.includes(reward.smiley)) state.inventory.push(reward.smiley);
    else state.balance += 500000;
  } else if (reward.type === 'special') {
    if (reward.stuff && !state.stuffs[reward.stuff]) {
      state.stuffs[reward.stuff] = true;
    }
    if (reward.boostId) activateBoost(reward.boostId);
  }

  addElo(ELO_REWARDS.eventAction);
  saveState();
  return true;
}

/* ============================================================
   NEWYEAR
============================================================ */
function isNewYear() {
  const now = Date.now();
  return now >= NEWYEAR_START && now <= NEWYEAR_END;
}

function rollGiftReward() {
  const total = NEWYEAR_GIFT_REWARDS.reduce((a, r) => a + r.weight, 0);
  let r = Math.random() * total;
  for (const reward of NEWYEAR_GIFT_REWARDS) {
    if (r < reward.weight) return reward;
    r -= reward.weight;
  }
  return NEWYEAR_GIFT_REWARDS[0];
}

/* ============================================================
   BUMP DAILY
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
   ACHIEVEMENTS
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
      addElo(ELO_REWARDS.achievement);
    }
  }
}

/* ============================================================
   GRANT REWARD
============================================================ */
function grantReward(reward, msg) {
  if (!reward) return;
  if (reward.smiles) state.balance += reward.smiles;
  if (reward.candy && state.halloween) state.halloween.candy += reward.candy;
  if (reward.smiley) {
    if (!state.inventory.includes(reward.smiley)) state.inventory.push(reward.smiley);
  }
  if (reward.boostId && BOOSTS[reward.boostId]) activateBoost(reward.boostId);
  if (reward.stuffId && !state.stuffs[reward.stuffId]) {
    state.stuffs[reward.stuffId] = true;
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
