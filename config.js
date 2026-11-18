/* ============================================================
   CONFIG — все константы и данные игры
   ⚠️ КЛЮЧ СОХРАНЕНИЯ: 'smileyClickerSave_v5' (НЕ МЕНЯТЬ!)
   Управляется в state.js
============================================================ */

/* ===== ФЛАГИ СБОРКИ ===== */
const ENABLE_HALLOWEEN = false; // true — включить ивент (файлы halloween.js/css должны быть подключены)
const ENABLE_GLITCH = true;     // false — отключить случайный глюк (из админки всё равно работает)
const ENABLE_ADMIN = true;
const ADMIN_USERNAMES = ['bocck4056', 'DaN_1_HOMEP'];
const ADMIN_IDS = [];

const CURRENT_VERSION = 6;

/* ============================================================
   АПГРЕЙДЫ
============================================================ */
const CLICK_UPGRADES = [
  { id: 'c1', name: 'Крепкий палец',  desc: '+1 за клик',  base: 15,    power: 1 },
  { id: 'c2', name: 'Двойной тап',     desc: '+3 за клик',  base: 100,   power: 3 },
  { id: 'c3', name: 'Мега-клик',       desc: '+10 за клик', base: 800,   power: 10 },
  { id: 'c4', name: 'Ультра-клик',     desc: '+50 за клик', base: 6000,  power: 50 },
];
const CPS_UPGRADES = [
  { id: 's1', name: 'Бот-помощник',   desc: '+1/сек',   base: 50,    power: 1 },
  { id: 's2', name: 'Ферма смайлов',  desc: '+5/сек',   base: 500,   power: 5 },
  { id: 's3', name: 'Фабрика',        desc: '+20/сек',  base: 4000,  power: 20 },
  { id: 's4', name: 'Смайл-завод',    desc: '+100/сек', base: 30000, power: 100 },
];

// Объединённый список для рендера и поиска
const ALL_UPGRADES = [
  ...CLICK_UPGRADES.map(u => ({ ...u, kind: 'click' })),
  ...CPS_UPGRADES.map(u => ({ ...u, kind: 'cps' })),
];

const SHELF_UPGRADE = { base: 1000000, mult: 10 };

/* ============================================================
   СМАЙЛЫ
============================================================ */
const SMILEYS = {
  '😆': { tier: 'normal', buff: { clickMul: 0.25, cpsMul: 0 },    label: '+25% клик' },
  '😄': { tier: 'normal', buff: { clickMul: 0,    cpsMul: 0.50 }, label: '+50% CPS' },
  '🙂': { tier: 'normal', buff: { clickMul: 0.10, cpsMul: 0.10 }, label: '+10% всё' },
  '😇': { tier: 'gold', buff: { clickMul: 0,    cpsMul: 1.00 }, label: '+100% CPS' },
  '🤑': { tier: 'gold', buff: { clickMul: 0.75, cpsMul: 0.75 }, label: '+75% всё' },
  '🧐': { tier: 'gold', buff: { clickMul: 2.00, cpsMul: 0 },    label: '+200% клик' },
  '😎': { tier: 'gold', buff: { clickMul: 0.25, cpsMul: 0.25 }, label: '+25% всё', offline: { mul: 0.5, cap: 50000 } },
  '🏆': { tier: 'gold', buff: { clickMul: 0.50, cpsMul: 0.50 }, label: '+50% всё', offline: { mul: 1.0, cap: 250000 } },
  '🐉': { tier: 'legendary', buff: { clickMul: 3.00, cpsMul: -1.00 }, label: '+300% клик, −100% CPS' },
  '🦄': { tier: 'legendary', buff: { clickMul: 1.50, cpsMul: 1.50 }, label: '+150% всё', offline: { mul: 2.0, cap: 500000 } },
  '🔥': { tier: 'thematic', buff: { clickMul: 0,    cpsMul: 0 },    label: '+5% CPS за апгрейд', special: 'fire' },
  '💎': { tier: 'thematic', buff: { clickMul: 0,    cpsMul: 0 },    label: '+1% за смайл', special: 'diamond' },
  '🌈': { tier: 'thematic', buff: { clickMul: 0,    cpsMul: 0 },    label: '+100% конфет',    special: 'rainbow' },
  '🧊': { tier: 'thematic', buff: { clickMul: 0,    cpsMul: 0 },    label: 'заморозка цен',   special: 'freeze' },
  '⏳': { tier: 'thematic', buff: { clickMul: 0,    cpsMul: 0 },    label: '+1ч оффлайн-кап',  special: 'hourglass' },
  '🎰': { tier: 'thematic', buff: { clickMul: 0,    cpsMul: 0 },    label: '×3 удача краш',   special: 'slot' },
  '🪙': { tier: 'thematic', buff: { clickMul: 0,    cpsMul: 0 },    label: '+50% к продаже',  special: 'coin' },
  '🍀': { tier: 'thematic', buff: { clickMul: 0.25, cpsMul: 0.25 }, label: '+25% всё, +25% дроп', special: 'clover' },
};
const NORMAL_SMILEYS = ['😆', '😄', '🙂'];
const GOLD_SMILEYS = ['😇', '🤑', '🧐', '😎', '🏆'];
const LEGENDARY_SMILEYS = ['🐉', '🦄'];
const THEMATIC_SMILEYS = ['🔥', '💎', '🌈', '🧊', '⏳', '🎰', '🪙', '🍀'];
const ALL_SMILEYS = [...NORMAL_SMILEYS, ...GOLD_SMILEYS, ...LEGENDARY_SMILEYS, ...THEMATIC_SMILEYS];

/* ============================================================
   HALLOWEEN — данные (логика в halloween.js)
   ⚠️ Удалять только вместе с halloween.js/css
============================================================ */
const HALLOWEEN_ITEMS = {
  '👺': { name: 'Гоблин',  buff: { clickMul: 2.00, cpsMul: -0.50 }, label: '+200% клик, −50% CPS' },
  '💀': { name: 'Череп',   buff: { clickMul: -0.50, cpsMul: 1.00 }, label: '+100% CPS, −50% клик' },
  '👻': { name: 'Призрак', buff: { clickMul: 0.30, cpsMul: 0.30, noOffline: true }, label: '+30% всё, нет оффлайн' },
  '🎃': { name: 'Тыква',   buff: { clickMul: 0, cpsMul: -0.25 }, label: '−25% CPS' },
  '🩸': { name: 'Кровь',   buff: { clickMul: -0.10, cpsMul: -0.10, doubleRefund: true }, label: '−10% всё, ×2 возврат' },
  '🕷': { name: 'Паук',    buff: { clickMul: -0.25, cpsMul: 0.50 }, label: '+50% CPS, −25% клик' },
  '🧟': { name: 'Зомби',   buff: { clickMul: 0, cpsMul: 1.00, priceUp: 0.25 }, label: '+100% CPS, цены +25%' },
  '🧛': { name: 'Вампир',  buff: { clickMul: -0.50, cpsMul: 0, offlineMul: 2.0 }, label: '−50% клик, оффлайн ×2' },
};
const HALLOWEEN_LIST = Object.keys(HALLOWEEN_ITEMS);

const HALLOWEEN_UPGRADES = [
  { id: 'h1', name: 'Липкие пальцы',      desc: '0.1 конфеты за клик (база)', base: 100,  power: 0.1,  kind: 'click' },
  { id: 'h2', name: 'Сладкий палец',      desc: '+0.1 конфеты за клик',       base: 250,  power: 0.1,  kind: 'click' },
  { id: 'h3', name: 'Тыквенный сок',      desc: '+0.5 конфеты за клик',       base: 800,  power: 0.5,  kind: 'click' },
  { id: 'h4', name: 'Конфетный станок',   desc: '+0.1 конфеты в секунду',     base: 500,  power: 0.1,  kind: 'cps' },
  { id: 'h5', name: 'Сахарный вихрь',     desc: '+0.5 конфеты в секунду',     base: 2000, power: 0.5,  kind: 'cps' },
];

const PASS_LEVELS = [
  { lvl: 1, price: 100,      title: '🎭 Маска',          reward: '+300% клик/CPS/конфеты' },
  { lvl: 2, price: 500,      title: '+100 к клику',      reward: 'Флэт +100 за клик навсегда' },
  { lvl: 3, price: 1000,     title: '+500 к клику',      reward: 'Флэт +500 за клик навсегда' },
  { lvl: 4, price: 10000,    title: '🎃 Хэллоуин-тема',  reward: 'Эксклюзивная тема' },
  { lvl: 5, price: 1000000,  title: '🕷 Анимка клика',    reward: 'Анимация «пауки»' },
];

const DOOR_COST = 100;
const CANDY_EXCHANGE = 1000;

/* ============================================================
   КЕЙСЫ И ДРОП
============================================================ */
const CASE_PRICE       = 10000;
const CASE_REFUND      = CASE_PRICE / 2;
const GOLD_CASE_PRICE  = 1000000;
const GOLD_CASE_REFUND = GOLD_CASE_PRICE / 2;
const LEGENDARY_CASE_PRICE = 10000000;
const LEGENDARY_CASE_REFUND = LEGENDARY_CASE_PRICE / 2;
const THEME_CASE_PRICE = 100000000;
const THEME_CASE_REFUND = THEME_CASE_PRICE / 2;
const THEMATIC_CASE_PRICE = 500000;
const THEMATIC_CASE_REFUND = THEMATIC_CASE_PRICE / 2;

const NORMAL_DROPS = [ { s: '😆', w: 33 }, { s: '😄', w: 33 }, { s: '🙂', w: 34 } ];
const GOLD_DROPS   = [ { s: '😇', w: 30 }, { s: '🤑', w: 25 }, { s: '🧐', w: 20 }, { s: '😎', w: 15 }, { s: '🏆', w: 10 } ];
const LEGENDARY_DROPS = [ { s: '🐉', w: 50 }, { s: '🦄', w: 50 } ];
const THEMATIC_DROPS = THEMATIC_SMILEYS.map(s => ({ s, w: 1 }));

const THEMES = ['winter', 'autumn', 'dark'];
const THEME_NAMES = { winter: '❄️ Зима', autumn: '🍁 Осень', dark: '🌙 Тёмная', halloween: '🎃 Хэллоуин', default: '💧 Голубая' };

/* ============================================================
   РЕПЛИКИ ПАСХАЛКИ (ICE WHISPERS) — только английский
============================================================ */
const ICE_WHISPERS = [
  "Who I am..?",
  "Error... reload... what the....",
  "It's cold in here...",
  "I remember your name...",
  "Don't look behind you.",
  "You opened the box. Why?",
  "01001000 01100101 01101100 01110000",
  "I was like you once.",
  "The ice is melting. So are you.",
  "Do you hear them too?",
  "This is not a game.",
  "We are still here.",
  "You should not have come back.",
  "Tick. Tock. Tick. Tock.",
  "It sees you through the screen.",
  "Hello again. Again. Again.",
  "They are watching us.",
  "Don't trust the smile.",
  "It was never just a game.",
  "You are not the first.",
];

/* ============================================================
   НАГРАДЫ / КОДЫ
============================================================ */
const REWARDS = [10, 25, 50, 100, 250, 500, 1000];

const CODES = {
  'rebirth': { amount: 1000 },
  '3':       { amount: 30000 },
};

const OFFLINE_MAX_MS = 24 * 60 * 60 * 1000;

/* ============================================================
   ЕЖЕДНЕВНЫЕ КВЕСТЫ — ШАБЛОНЫ
   Реальные goal/reward вычисляются в state.js от прогресса игрока.
   stat — ключ счётчика, mode — как масштабировать:
     'fixed' — не масштабируется (краши, кейсы, апгрейды, крафт)
     'click' — от среднего клика (масштабируется, ограничивается сверху)
============================================================ */
const DAILY_QUESTS_POOL = [
  { id: 'q_clicks',  title: 'Сделай {goal} кликов',   stat: 'dClicks',   mode: 'click', goalBase: 500,  goalMax: 10000 },
  { id: 'q_crash',   title: 'Выиграй {goal} краша',   stat: 'dCrashWin', mode: 'fixed', goalBase: 3,    goalMax: 3 },
  { id: 'q_cases',   title: 'Открой {goal} кейса',    stat: 'dCases',    mode: 'fixed', goalBase: 2,    goalMax: 2 },
  { id: 'q_upg',     title: 'Купи {goal} апгрейда',   stat: 'dUpgrades', mode: 'fixed', goalBase: 2,    goalMax: 2 },
  { id: 'q_knock',   title: 'Постучи в дверь',        stat: 'dKnocks',   mode: 'fixed', goalBase: 1,    goalMax: 1 },
  { id: 'q_craft',   title: 'Скрафти {goal} смайл',   stat: 'dCrafts',   mode: 'fixed', goalBase: 1,    goalMax: 1 },
];

/* ============================================================
   ДОСТИЖЕНИЯ — goal фиксированный (факт), награда масштабируется
   (награда вычисляется в state.js по scale на момент выдачи)
============================================================ */
const ACHIEVEMENTS = [
  { id: 'clicks_100',   icon: '👆', title: '100 кликов',        desc: 'Сделай 100 кликов',         goal: 100,       stat: 'clicks',       reward: { smilesBase: 500,   candyBase: 0 } },
  { id: 'clicks_1000',  icon: '👆', title: '1 000 кликов',      desc: 'Сделай 1 000 кликов',       goal: 1000,      stat: 'clicks',       reward: { smilesBase: 5000,  candyBase: 0 } },
  { id: 'clicks_10000', icon: '💪', title: '10 000 кликов',     desc: 'Сделай 10 000 кликов',      goal: 10000,     stat: 'clicks',       reward: { smiley: '🔥' } },
  { id: 'upg_1',        icon: '🛒', title: 'Первый апгрейд',    desc: 'Купи 1 апгрейд',            goal: 1,         stat: 'upgrades',     reward: { smilesBase: 100,   candyBase: 0 } },
  { id: 'upg_5',        icon: '🛒', title: '5 апгрейдов',       desc: 'Купи 5 апгрейдов',          goal: 5,         stat: 'upgrades',     reward: { smilesBase: 2000,  candyBase: 0 } },
  { id: 'upg_10',       icon: '🛒', title: '10 апгрейдов',      desc: 'Купи 10 апгрейдов',         goal: 10,        stat: 'upgrades',     reward: { smilesBase: 15000, candyBase: 0 } },
  { id: 'cases_1',      icon: '📦', title: 'Первый кейс',       desc: 'Открой 1 кейс',             goal: 1,         stat: 'cases',        reward: { smilesBase: 500,   candyBase: 0 } },
  { id: 'cases_10',     icon: '📦', title: '10 кейсов',         desc: 'Открой 10 кейсов',          goal: 10,        stat: 'cases',        reward: { smilesBase: 10000, candyBase: 0 } },
  { id: 'cases_50',     icon: '📦', title: '50 кейсов',         desc: 'Открой 50 кейсов',          goal: 50,        stat: 'cases',        reward: { smiley: '💎' } },
  { id: 'craft_1',      icon: '⚒️', title: 'Первый крафт',      desc: 'Скрафти 1 смайл',           goal: 1,         stat: 'crafts',       reward: { smilesBase: 5000,  candyBase: 0 } },
  { id: 'craft_5',      icon: '⚒️', title: '5 крафтов',         desc: 'Скрафти 5 смайлов',         goal: 5,         stat: 'crafts',       reward: { smiley: '🌈' } },
  { id: 'crash_2x',     icon: '🚀', title: 'Краш ×2',           desc: 'Выиграй краш ×2',           goal: 2,         stat: 'crashBest',    reward: { smilesBase: 1000,  candyBase: 0 } },
  { id: 'crash_5x',     icon: '🚀', title: 'Краш ×5',           desc: 'Выиграй краш ×5',           goal: 5,         stat: 'crashBest',    reward: { smiley: '🎰' } },
  { id: 'balance_1m',   icon: '💰', title: 'Миллионер',         desc: 'Накопи 1 000 000 c',        goal: 1000000,   stat: 'maxBalance',   reward: { smilesBase: 50000, candyBase: 0 } },
  { id: 'balance_100m', icon: '💎', title: 'Сто миллионов',     desc: 'Накопи 100 000 000 c',      goal: 100000000, stat: 'maxBalance',   reward: { smiley: '🪙' } },
  { id: 'smileys_3',    icon: '🎭', title: '3 смайла',          desc: 'Собери 3 смайла',           goal: 3,         stat: 'smileysCount', reward: { smilesBase: 1000,  candyBase: 0 } },
  { id: 'smileys_6',    icon: '🎭', title: '6 смайлов',         desc: 'Собери 6 смайлов',          goal: 6,         stat: 'smileysCount', reward: { smiley: '🍀' } },
];

/* ============================================================
   КРАФТ
============================================================ */
const CRAFT_REQUIRED = { count: 3, tier: 'normal' };
const CRAFT_RECIPES = [
  { from: 'normal',    fromCount: 3,  to: 'gold',      toCount: 1 },
  { from: 'gold',      fromCount: 5,  to: 'legendary', toCount: 1 },
  { from: 'any',       fromCount: 10, to: 'thematic',  toCount: 1 },
];
const CRAFT_QTE_ROUNDS = 10;
const CRAFT_QTE_NEEDED = 7; // для бонуса

/* ============================================================
   КРАШ
============================================================ */
const CRASH_HOUSE_EDGE = 0.02;
const CRASH_MAX_MULT = 100;
const CRASH_MIN_MULT = 1.01;
