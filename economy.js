/* ============================================================
   ECONOMY — расчёты: клик, CPS, баффы, цены, оффлайн, бусты
============================================================ */

/* ============================================================
   БУСТЫ — множители
============================================================ */
function getBoostMultipliers() {
  const active = (typeof getActiveBoosts === 'function') ? getActiveBoosts() : {};
  let clickMul = 1;
  let cpsMul = 1;
  let crashLuck = 1;
  let dropBonus = 0;

  if (active['click5']) clickMul *= 5;
  if (active['cps2']) cpsMul *= 2;
  if (active['crash3']) crashLuck *= 3;
  if (active['drop50']) dropBonus += 0.5;

  return { clickMul, cpsMul, crashLuck, dropBonus };
}

/* ============================================================
   БАЗОВЫЕ ЗНАЧЕНИЯ
============================================================ */
function baseClickPower() {
  let p = 1;
  for (const u of CLICK_UPGRADES) p += (state.upgrades[u.id] || 0) * u.power;
  if (ENABLE_HALLOWEEN && state.halloween) p += (state.halloween.clickBonusFlat || 0);
  return p;
}

function baseCps() {
  let p = 0;
  for (const u of CPS_UPGRADES) p += (state.upgrades[u.id] || 0) * u.power;
  return p;
}

/* ============================================================
   БАФФЫ ПОЛКИ
============================================================ */
function shelfBuffs() {
  let clickMul = 0, cpsMul = 0, candyMul = 0;
  let hasGhost = false, hasBlood = false, hasZombie = false, hasVampire = false, hasMask = false;
  let clickExtra = 0, cpsExtra = 0, offlineExtra = 0;

  for (const slot of state.shelf) {
    if (!slot) continue;

    if (ENABLE_HALLOWEEN && HALLOWEEN_ITEMS[slot]) {
      if (slot === '🎭') {
        hasMask = true;
        clickMul += 3.0; cpsMul += 3.0; candyMul += 3.0;
        continue;
      }
      const it = HALLOWEEN_ITEMS[slot];
      clickMul += it.buff.clickMul || 0;
      cpsMul += it.buff.cpsMul || 0;
      if (it.buff.noOffline) hasGhost = true;
      if (it.buff.doubleRefund) hasBlood = true;
      if (it.buff.priceUp) hasZombie = true;
      if (it.buff.offlineMul) hasVampire = true;
      continue;
    }

    const meta = SMILEYS[slot];
    if (!meta) continue;

    clickMul += meta.buff.clickMul || 0;
    cpsMul += meta.buff.cpsMul || 0;

    if (meta.special === 'fire') {
      const totalUpg = Object.values(state.upgrades).reduce((a, b) => a + b, 0);
      cpsExtra += totalUpg * 0.05;
    }
    if (meta.special === 'diamond') {
      cpsExtra += state.inventory.length * 0.01;
    }
    if (meta.special === 'hourglass') {
      offlineExtra += 60 * 60 * 1000;
    }
  }

  return { clickMul, cpsMul, candyMul, hasGhost, hasBlood, hasZombie, hasVampire, hasMask, clickExtra, cpsExtra, offlineExtra };
}

/* ============================================================
   ИТОГОВЫЕ ЗНАЧЕНИЯ — с учётом бустов
============================================================ */
function totalClickPower() {
  const b = shelfBuffs();
  const boost = getBoostMultipliers();
  return Math.max(0, baseClickPower() * (1 + b.clickMul + b.clickExtra) * boost.clickMul);
}

function totalCps() {
  const b = shelfBuffs();
  const boost = getBoostMultipliers();
  return Math.max(0, baseCps() * (1 + b.cpsMul + b.cpsExtra) * boost.cpsMul);
}

/* ============================================================
   HALLOWEEN: конфеты
============================================================ */
function candyClickPower() {
  if (!ENABLE_HALLOWEEN || !state.halloween) return 0;
  let p = 0;
  for (const u of HALLOWEEN_UPGRADES) {
    if (u.kind === 'click') p += (state.halloween.halUpgrades[u.id] || 0) * u.power;
  }
  if (state.shelf.includes('🌈')) p *= 2;
  if (shelfBuffs().hasMask) p *= 4.2;
  return p;
}

function candyCps() {
  if (!ENABLE_HALLOWEEN || !state.halloween) return 0;
  let p = 0;
  for (const u of HALLOWEEN_UPGRADES) {
    if (u.kind === 'cps') p += (state.halloween.halUpgrades[u.id] || 0) * u.power;
  }
  if (state.shelf.includes('🌈')) p *= 2;
  if (shelfBuffs().hasMask) p *= 4.2;
  return p;
}

/* ============================================================
   ЗАМОРОЗКА ЦЕН
============================================================ */
function isFrozen() {
  return state.freezeUntil > Date.now();
}

/* ============================================================
   ЦЕНЫ АПГРЕЙДОВ
============================================================ */
function getUpgradePrice(u) {
  if (state.adminFree) return 0;
  const lvl = state.upgrades[u.id] || 0;

  let price;
  if (isFrozen()) {
    price = Math.ceil(u.base);
  } else {
    price = Math.ceil(u.base * Math.pow(1.15, lvl));
  }

  if (shelfBuffs().hasZombie) price = Math.ceil(price * 1.25);
  return price;
}

function getUpgradePriceForN(u, n) {
  if (state.adminFree) return 0;
  n = Math.max(1, Math.floor(n));
  const lvl = state.upgrades[u.id] || 0;

  let total;
  if (isFrozen()) {
    total = Math.ceil(u.base * n);
  } else {
    const first = u.base * Math.pow(1.15, lvl);
    total = Math.ceil(first * (Math.pow(1.15, n) - 1) / 0.15);
  }

  if (shelfBuffs().hasZombie) total = Math.ceil(total * 1.25);
  return total;
}

function getMaxAffordable(u) {
  if (state.adminFree) return 999;
  const lvl = state.upgrades[u.id] || 0;

  if (isFrozen()) {
    const price = Math.ceil(u.base);
    if (price <= 0) return 0;
    return Math.floor(state.balance / price);
  }

  const first = u.base * Math.pow(1.15, lvl);
  if (first <= 0) return 0;
  const factor = 1 + (state.balance * 0.15) / first;
  if (factor < 1) return 0;
  const n = Math.floor(Math.log(factor) / Math.log(1.15));
  return Math.max(0, n);
}

/* ============================================================
   ЦЕНЫ ПОЛКИ И КЕЙСОВ
============================================================ */
function getShelfPrice() {
  if (state.adminFree) return 0;
  let price = Math.ceil(SHELF_UPGRADE.base * Math.pow(SHELF_UPGRADE.mult, state.shelfLevel));
  if (shelfBuffs().hasZombie) price = Math.ceil(price * 1.25);
  return price;
}

function getCasePrice(kind) {
  if (state.adminFree) return 0;
  switch (kind) {
    case 'normal': return CASE_PRICE;
    case 'gold': return GOLD_CASE_PRICE;
    case 'legendary': return LEGENDARY_CASE_PRICE;
    case 'thematic': return THEMATIC_CASE_PRICE;
    case 'theme': return THEME_CASE_PRICE;
  }
  return CASE_PRICE;
}

function getCaseRefund(kind) {
  switch (kind) {
    case 'normal': return CASE_REFUND;
    case 'gold': return GOLD_CASE_REFUND;
    case 'legendary': return LEGENDARY_CASE_REFUND;
    case 'thematic': return THEMATIC_CASE_REFUND;
    case 'theme': return THEME_CASE_REFUND;
  }
  return CASE_REFUND;
}

function getHalloweenUpgradePrice(u) {
  if (state.adminFree) return 0;
  if (!state.halloween) return 0;
  const lvl = state.halloween.halUpgrades[u.id] || 0;
  return Math.ceil(u.base * Math.pow(1.15, lvl));
}

/* ============================================================
   ОФФЛАЙН
============================================================ */
function offlineCapTotal() {
  let cap = 0;
  for (const slot of state.shelf) {
    if (!slot) continue;
    if (ENABLE_HALLOWEEN && HALLOWEEN_ITEMS[slot]) continue;
    const meta = SMILEYS[slot];
    if (meta && meta.offline) cap += meta.offline.cap;
  }
  if (shelfBuffs().hasVampire) cap *= 2;
  return cap;
}

function offlineMulTotal() {
  let mul = 0;
  for (const slot of state.shelf) {
    if (!slot) continue;
    if (ENABLE_HALLOWEEN && HALLOWEEN_ITEMS[slot]) {
      const it = HALLOWEEN_ITEMS[slot];
      if (it.buff.offlineMul) mul += it.buff.offlineMul;
      continue;
    }
    const meta = SMILEYS[slot];
    if (meta && meta.offline) mul += meta.offline.mul;
  }
  return mul;
}

function computeOffline() {
  const now = Date.now();
  const last = state.lastOnline || now;
  const b = shelfBuffs();

  let maxMs = OFFLINE_MAX_MS + b.offlineExtra;
  let dt = Math.min(now - last, maxMs);

  if (dt < 10 * 1000) return;
  if (b.hasGhost) return;

  // CPS с бустами (но бусты временные — оффлайн считаем без них, чтобы не абузили)
  const cps = baseCps() * (1 + b.cpsMul + b.cpsExtra);
  if (cps <= 0) return;

  const mul = offlineMulTotal();
  const cap = offlineCapTotal();
  if (mul <= 0 || cap <= 0) return;

  let earned = cps * (dt / 1000) * mul;
  earned = Math.min(earned, cap);
  earned = Math.floor(earned);

  if (earned > 0) state.pendingOffline += earned;
}

/* ============================================================
   СЕРИЯ 🔥 (хелпер для отображения)
============================================================ */
function getFireStreakInfo() {
  return {
    streak: state.fireStreak || 0,
    active: state.shelf.includes('🔥'),
    lastDate: state.lastFireDate || '',
  };
    }
