/* ============================================================
   NEWYEAR — новогодний ивент
   Подарки спавнятся в разных вкладках, Эльф собирает, награды
============================================================ */

let giftSpawnTimer = null;
let giftIdCounter = 0;

/* ============================================================
   СПАВН ПОДАРКА
============================================================ */
function spawnGift() {
  if (typeof isNewYear !== 'function' || !isNewYear()) return;
  if (!state.elfEnabled) return;

  // Лимит на экране
  const existing = document.querySelectorAll('.newyear-gift').length;
  if (existing >= NEWYEAR_GIFT_LIMIT) return;

  const gift = document.createElement('div');
  gift.className = 'newyear-gift';
  gift.id = 'gift_' + (giftIdCounter++);
  gift.textContent = '🎁';
  gift.style.cssText = `
    position: fixed;
    left: ${10 + Math.random() * 80}vw;
    top: ${10 + Math.random() * 70}vh;
    font-size: ${28 + Math.random() * 16}px;
    z-index: 60;
    cursor: pointer;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    animation: giftBounce 1.5s ease-in-out infinite;
    pointer-events: auto;
  `;

  gift.addEventListener('click', () => collectGift(gift));
  document.body.appendChild(gift);

  // Автоудаление через 30 секунд
  setTimeout(() => {
    if (gift.parentNode) gift.remove();
  }, 30000);
}

function collectGift(giftEl) {
  if (!giftEl || !giftEl.parentNode) return;

  const rect = giftEl.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Анимация исчезновения
  giftEl.style.transition = 'transform 0.3s, opacity 0.3s';
  giftEl.style.transform = 'scale(1.5)';
  giftEl.style.opacity = '0';
  setTimeout(() => { if (giftEl.parentNode) giftEl.remove(); }, 300);

  // +1 подарок
  state.gifts = (state.gifts || 0) + 1;
  vibrate('light');
  if (typeof spawnFloat === 'function') spawnFloat(x, y, '+🎁');
  if (typeof renderHeader === 'function') renderHeader();
  saveState();
}

/* ============================================================
   СДАЧА ПОДАРКОВ ЭЛЬФУ
============================================================ */
function giveGiftsToElf() {
  if (!state.gifts || state.gifts <= 0) {
    toast('Нет подарков. Ищи 🎁 на экране!');
    return;
  }

  const count = state.gifts;
  state.gifts = 0;

  // Рандомная награда
  const reward = rollGiftReward();

  if (reward.type === 'smiles') {
    state.balance += reward.amount;
    toast(`🎁 ${count} подарков → ${fmt(reward.amount)} ${coinIcon()}`);
  } else if (reward.type === 'boost') {
    activateBoost(reward.boostId);
    toast(`🎁 ${count} подарков → буст ${BOOSTS[reward.boostId].name}`);
  } else if (reward.type === 'stuff') {
    if (!state.stuffs[reward.stuffId]) {
      state.stuffs[reward.stuffId] = true;
      toast(`🎁 ${count} подарков → ${STUFFS[reward.stuffId].name}!`);
    } else {
      state.balance += 50000;
      toast(`🎁 ${count} подарков → дубликат, +${fmt(50000)}`);
    }
  }

  addElo(ELO_REWARDS.eventAction);
  vibrateNotification('success');
  renderHeader();
  if (typeof currentTab !== 'undefined' && currentTab === 'main') renderMain();
  saveState();
}

/* ============================================================
   СПАВН ПОДАРКОВ — интервал
============================================================ */
function startGiftSpawner() {
  if (giftSpawnTimer) clearInterval(giftSpawnTimer);

  giftSpawnTimer = setInterval(() => {
    if (typeof isNewYear !== 'function' || !isNewYear()) return;
    if (Math.random() < NEWYEAR_GIFT_CHANCE) {
      spawnGift();
    }
  }, NEWYEAR_GIFT_SPAWN_MS);
}

function stopGiftSpawner() {
  if (giftSpawnTimer) {
    clearInterval(giftSpawnTimer);
    giftSpawnTimer = null;
  }
  document.querySelectorAll('.newyear-gift').forEach(g => g.remove());
}

/* ============================================================
   RENDER — блок с подарками и кнопкой «Сдать»
   (вызывается в renderMain или renderStuff)
============================================================ */
function renderNewYearBlock() {
  if (typeof isNewYear !== 'function' || !isNewYear()) return '';
  if (!state.elfEnabled) return '';

  return `
    <div class="card column" style="margin-top:10px">
      <div class="card-title" style="text-align:center">🎁 Подарки: ${state.gifts || 0}</div>
      <div class="card-sub" style="text-align:center;margin-bottom:8px">Ищи 🎁 на экране и сдавай Эльфу</div>
      <button class="btn big" id="giveGiftsBtn" style="width:100%" ${(!state.gifts) ? 'disabled' : ''}>Сдать Эльфу</button>
    </div>
  `;
}

function bindNewYearBlock() {
  const btn = document.getElementById('giveGiftsBtn');
  if (btn) btn.addEventListener('click', giveGiftsToElf);
}
