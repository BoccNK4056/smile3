/* ============================================================
   DAILY-SHOP — ежедневный магазин (логика в state.js)
   Этот файл — только утилиты и покупка
============================================================ */

/* ============================================================
   ПОКУПКА ПРЕДМЕТА
============================================================ */
function buyDailyShopItem(index) {
  const item = state.dailyShop.items[index];
  if (!item || item.bought) return false;
  if (state.balance < item.price) { toast('Недостаточно средств'); return false; }

  state.balance -= item.price;
  item.bought = true;

  if (item.type === 'boost') {
    if (typeof activateBoost === 'function') activateBoost(item.boostId);
  } else if (item.type === 'case') {
    toast(`📦 Кейс ${item.caseKind} — открывай во вкладке «Кейсы»`);
    if (typeof openCase === 'function') {
      setTimeout(() => openCase(item.caseKind), 100);
    }
  } else if (item.type === 'smiley') {
    if (!state.inventory.includes(item.smiley)) state.inventory.push(item.smiley);
    else state.balance += item.price;
  } else if (item.type === 'smiles') {
    state.balance += item.amount;
  }

  vibrateNotification('success');
  if (typeof currentTab !== 'undefined' && currentTab === 'daily-shop') {
    if (typeof renderDailyShop === 'function') renderDailyShop();
  }
  if (typeof renderHeader === 'function') renderHeader();
  saveState();
  return true;
}

/* ============================================================
   ОБНОВИТЬ МАГАЗИН (принудительно)
============================================================ */
function refreshDailyShop() {
  if (typeof generateDailyShop !== 'function') return;
  state.dailyShop.date = '';
  generateDailyShop();
  saveState();
  if (typeof currentTab !== 'undefined' && currentTab === 'daily-shop') {
    if (typeof renderDailyShop === 'function') renderDailyShop();
  }
}

/* ============================================================
   ИНФО О МАГАЗИНЕ
============================================================ */
function getDailyShopInfo() {
  const bought = (state.dailyShop.items || []).filter(i => i.bought).length;
  const total = (state.dailyShop.items || []).length;
  return { bought, total, date: state.dailyShop.date };
                                  }
