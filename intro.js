/* ============================================================
   INTRO — вступление
   BoccNK presents… → Powered by DeepSeek → падающие буквы
   + разлетающиеся смайлики. Скип — тап в любой момент.
============================================================ */

(function () {
  const introLayer = document.getElementById('intro-layer');
  const introScene = document.getElementById('introScene');
  if (!introLayer || !introScene) return;

  let skipped = false;
  let timeouts = [];

  function clearTimeouts() {
    timeouts.forEach(t => clearTimeout(t));
    timeouts = [];
  }

  function skip() {
    if (skipped) return;
    skipped = true;
    clearTimeouts();
    introLayer.classList.add('fade-out');
    setTimeout(() => {
      introLayer.remove();
      state.introSeen = true;
      saveState();
    }, 1000);
  }

  // Тап в любой момент — скип
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
      el.remove();
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
      el.remove();
      phaseLetters();
    }, 3000));
  }

  /* ===== Фаза 3: падающие буквы + смайлики ===== */
  function phaseLetters() {
    if (skipped) return;

    const title = document.createElement('div');
    title.className = 'intro-title';
    const text = 'SMILEY CLICKER';

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

    // Смайлики разлетаются
    const emojis = ['😃', '😄', '😆', '🙂', '😎', '🤑', '😇', '🏆'];
    emojis.forEach((e, i) => {
      timeouts.push(setTimeout(() => {
        if (skipped) return;
        const el = document.createElement('div');
        el.className = 'intro-emoji';
        el.textContent = e;
        const angle = (Math.PI * 2 * i) / emojis.length + Math.random() * 0.5;
        const dist = 120 + Math.random() * 140;
        el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
        introScene.appendChild(el);
        setTimeout(() => el.remove(), 1300);
      }, 400 + i * 80));
    });

    // В конце — тряска + вибрация
    timeouts.push(setTimeout(() => {
      if (skipped) return;
      introScene.classList.add('shake');
      vibrate('heavy');
    }, 2200));

    // Через 3 секунды — растворяем
    timeouts.push(setTimeout(() => {
      if (skipped) return;
      introLayer.classList.add('fade-out');
      setTimeout(() => {
        introLayer.remove();
        state.introSeen = true;
        saveState();
      }, 1000);
    }, 3000));
  }

  /* ===== Старт ===== */
  timeouts.push(setTimeout(phasePresent, 300));

})();
