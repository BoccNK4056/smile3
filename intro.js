/* ============================================================
   INTRO — вступление
   BoccNK presents… → Powered by DeepSeek → падающие буквы
   + разлетающиеся смайлики. Скип — тап в любой момент.
   Защита: если introScene не найден — оверлей удаляется.
   Страховка: через 15 сек оверлей убирается принудительно.
============================================================ */

(function () {
  'use strict';

  const introLayer = document.getElementById('intro-layer');
  if (!introLayer) return;

  const introScene = document.getElementById('introScene');

  // Если сцены нет — сразу убираем оверлей и не мешаем игре
  if (!introScene) {
    console.warn('[intro] introScene не найден — удаляю оверлей');
    introLayer.remove();
    try { state.introSeen = true; saveState(); } catch (e) {}
    return;
  }

  let skipped = false;
  let timeouts = [];
  let safetyTimer = null;

  /* ===== Страховка: через 15 сек убрать оверлей, если что-то пошло не так ===== */
  safetyTimer = setTimeout(() => {
    console.warn('[intro] safety timeout — принудительное удаление');
    const el = document.getElementById('intro-layer');
    if (el) el.remove();
    try { state.introSeen = true; saveState(); } catch (e) {}
  }, 15000);

  function clearTimeouts() {
    timeouts.forEach(t => clearTimeout(t));
    timeouts = [];
  }

  function finish() {
    if (skipped) return;
    skipped = true;
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    clearTimeouts();
    introLayer.classList.add('fade-out');
    setTimeout(() => {
      if (introLayer.parentNode) introLayer.remove();
      try { state.introSeen = true; saveState(); } catch (e) {}
    }, 1000);
  }

  function skip() {
    if (skipped) return;
    finish();
  }

  // Скип — тап/клик в любой момент
  introLayer.addEventListener('click', skip);
  introLayer.addEventListener('touchstart', skip, { passive: true });

  /* ===== Фаза 1: BoccNK presents… ===== */
  function phasePresent() {
    if (skipped) return;
    const el = document.createElement('div');
    el.className = 'intro-phrase show';
    el.innerHTML = '<span class="brand">BoccNK</span><span class="sub">presents…</span>';
    introScene.appendChild(el);

    timeouts.push(setTimeout(() => {
      if (el.parentNode) el.remove();
      phasePowered();
    }, 3000));
  }

  /* ===== Фаза 2: Powered by DeepSeek ===== */
  function phasePowered() {
    if (skipped) return;
    const el = document.createElement('div');
    el.className = 'intro-phrase show';
    el.innerHTML = '<span class="brand">Powered by</span><span class="sub">DeepSeek</span>';
    introScene.appendChild(el);

    timeouts.push(setTimeout(() => {
      if (el.parentNode) el.remove();
      phaseLetters();
    }, 3000));
  }

  /* ===== Фаза 3: падающие буквы + разлетающиеся смайлики ===== */
  function phaseLetters() {
    if (skipped) return;

    const title = document.createElement('div');
    title.className = 'intro-title';
    const text = 'SMILEY CLICKER';

    try {
      [...text].forEach((ch, i) => {
        const span = document.createElement('span');
        if (ch === ' ') {
          span.className = 'intro-letter space';
          span.innerHTML = '&nbsp;';
        } else {
          span.className = 'intro-letter';
          span.textContent = ch;
          span.style.animationDelay = (i * 0.06) + 's';
        }
        title.appendChild(span);
      });
      introScene.appendChild(title);
    } catch (e) {
      console.error('[intro] ошибка построения букв', e);
    }

    // Смайлики разлетаются
    const emojis = ['😃', '😄', '😆', '🙂', '😎', '🤑', '😇', '🏆'];
    emojis.forEach((emoji, i) => {
      timeouts.push(setTimeout(() => {
        if (skipped) return;
        try {
          const el = document.createElement('div');
          el.className = 'intro-emoji';
          el.textContent = emoji;
          const angle = (Math.PI * 2 * i) / emojis.length + Math.random() * 0.5;
          const dist = 120 + Math.random() * 140;
          el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
          el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
          el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
          introScene.appendChild(el);
          setTimeout(() => { if (el.parentNode) el.remove(); }, 1300);
        } catch (e) {
          console.error('[intro] ошибка смайлика', e);
        }
      }, 400 + i * 80));
    });

    // В конце — тряска + вибрация
    timeouts.push(setTimeout(() => {
      if (skipped) return;
      try {
        introScene.classList.add('shake');
        if (typeof vibrate === 'function') vibrate('heavy');
      } catch (e) {}
    }, 2200));

    // Через 3 секунды — растворяем
    timeouts.push(setTimeout(() => {
      if (skipped) return;
      finish();
    }, 3000));
  }

  /* ===== Старт ===== */
  timeouts.push(setTimeout(phasePresent, 300));

})();
