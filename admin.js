/* ============================================================
   ADMIN — панель админа с полями ввода
============================================================ */

function renderAdmin(container) {
  if (!container) return;
  if (!ENABLE_ADMIN || !IS_ADMIN) return;

  const html = [];
  html.push(`<div class="admin-panel"><div class="card-title">👑 Админ-панель</div>`);

  /* Бесплатные покупки */
  html.push(`<div class="toggle-row" style="margin-top:8px"><div><div class="card-title">Бесплатные покупки</div><div class="card-sub">Все цены = 0</div></div><div class="toggle ${state.adminFree ? 'on' : ''}" id="admFree"></div></div>`);

  /* Выдача смайлов */
  html.push(`
    <div class="admin-row">
      <span>Смайлы</span>
      <input class="admin-input" type="number" id="admSmilesInput" value="1000000" min="0">
      <button class="btn" id="admSmilesBtn">Дать</button>
    </div>
  `);

  /* Выдача конфет */
  html.push(`
    <div class="admin-row">
      <span>Конфеты</span>
      <input class="admin-input" type="number" id="admCandyInput" value="1000" min="0">
      <button class="btn" id="admCandyBtn">Дать</button>
    </div>
  `);

  /* Выдать все смайлы */
  html.push(`
    <div class="admin-row">
      <span>Все смайлы</span>
      <button class="btn" id="admAllSmiles">Дать</button>
    </div>
  `);

  /* Сброс сохранения */
  html.push(`
    <div class="admin-row">
      <span>Сброс сохранения</span>
      <button class="btn danger" id="admReset">Сброс</button>
    </div>
  `);

  /* Глюк */
  html.push(`
    <div class="admin-row">
      <span>Запустить глюк</span>
      <button class="btn" id="admGlitch">Запустить</button>
    </div>
  `);

  /* Сброс intro */
  html.push(`
    <div class="admin-row">
      <span>Сбросить вступление</span>
      <button class="btn" id="admIntro">Сброс</button>
    </div>
  `);

  html.push(`</div>`);
  container.innerHTML = html.join('');

  /* ===== Обработчики ===== */
  const freeToggle = document.getElementById('admFree');
  if (freeToggle) freeToggle.addEventListener('click', () => {
    state.adminFree = !state.adminFree;
    freeToggle.classList.toggle('on', state.adminFree);
    toast(`Бесплатные покупки: ${state.adminFree ? 'ВКЛ' : 'ВЫКЛ'}`);
    renderHeader();
    saveState();
  });

  const smilesBtn = document.getElementById('admSmilesBtn');
  if (smilesBtn) smilesBtn.addEventListener('click', () => {
    const val = parseInt(document.getElementById('admSmilesInput').value) || 0;
    state.balance += val;
    toast(`+${fmt(val)} смайлов`);
    renderHeader();
    saveState();
  });

  const candyBtn = document.getElementById('admCandyBtn');
  if (candyBtn) candyBtn.addEventListener('click', () => {
    const val = parseInt(document.getElementById('admCandyInput').value) || 0;
    if (state.halloween) state.halloween.candy += val;
    toast(`+${fmt(val)} конфет`);
    saveState();
  });

  const allSmiles = document.getElementById('admAllSmiles');
  if (allSmiles) allSmiles.addEventListener('click', () => {
    for (const s of ALL_SMILEYS) {
      if (!state.inventory.includes(s)) state.inventory.push(s);
    }
    toast('Выданы все смайлы');
    saveState();
  });

  const resetBtn = document.getElementById('admReset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm('Сбросить сохранение? Это необратимо.')) {
      storage.remove('smileyClickerSave_v5');
      storage.remove('smileyClickerSave_v5_backup');
      location.reload();
    }
  });

  const glitchBtn = document.getElementById('admGlitch');
  if (glitchBtn) glitchBtn.addEventListener('click', () => {
    if (typeof triggerGlitch === 'function') triggerGlitch();
  });

  const introBtn = document.getElementById('admIntro');
  if (introBtn) introBtn.addEventListener('click', () => {
    state.introSeen = false;
    saveState();
    toast('Вступление сброшено — перезапусти игру');
  });
}
