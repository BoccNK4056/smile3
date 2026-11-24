/* ============================================================
   STUFF — персонажи (Эльф, Снеговик)
   Ходят по экрану, прыгают на кнопке, говорят советы
============================================================ */

let stuffElement = null;
let stuffWalkTimer = null;
let stuffJumpTimer = null;
let stuffTipTimer = null;

/* ============================================================
   RENDER STUFF ON SCREEN
============================================================ */
function renderStuffOnScreen() {
  // Убираем старый
  if (stuffElement && stuffElement.parentNode) stuffElement.remove();
  stuffElement = null;
  clearTimeout(stuffWalkTimer);
  clearTimeout(stuffJumpTimer);
  clearTimeout(stuffTipTimer);

  // Если эльф выключен или ивент не активен — не показываем
  if (!state.elfEnabled) return;
  if (typeof isNewYear === 'function' && !isNewYear()) return;

  const activeId = state.activeStuff || 'elf';
  const stuff = STUFFS[activeId];
  if (!stuff) return;
  if (!state.stuffs[activeId]) return;

  // Создаём элемент
  stuffElement = document.createElement('div');
  stuffElement.className = 'stuff-character';
  stuffElement.textContent = stuff.emoji;
  stuffElement.style.cssText = `
    position: fixed;
    left: 20px;
    bottom: 120px;
    font-size: 40px;
    z-index: 50;
    pointer-events: none;
    transition: left 2s ease-in-out, bottom 2s ease-in-out;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
  `;
  document.body.appendChild(stuffElement);

  // Ходьба
  function walk() {
    if (!stuffElement) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = 20 + Math.random() * (vw - 80);
    const y = 120 + Math.random() * (vh - 300);
    stuffElement.style.left = x + 'px';
    stuffElement.style.bottom = y + 'px';
    stuffWalkTimer = setTimeout(walk, 3000 + Math.random() * 2000);
  }
  walk();

  // Прыжки на кнопке — только на главной
  function jump() {
    if (!stuffElement) return;
    if (typeof currentTab !== 'undefined' && currentTab === 'main') {
      const s = document.getElementById('smiley');
      if (s) {
        const rect = s.getBoundingClientRect();
        stuffElement.style.left = (rect.left + rect.width / 2) + 'px';
        stuffElement.style.bottom = (window.innerHeight - rect.top + 20) + 'px';
        // Анимация прыжка
        stuffElement.style.transform = 'translateY(-20px) scale(1.2)';
        setTimeout(() => {
          if (stuffElement) stuffElement.style.transform = '';
        }, 300);
        // Имитация клика
        if (typeof onSmileyClick === 'function') {
          try { onSmileyClick({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }); } catch (e) {}
        }
        vibrate('light');
      }
    }
    stuffJumpTimer = setTimeout(jump, stuff.jumpInterval || 3000);
  }
  stuffJumpTimer = setTimeout(jump, stuff.jumpInterval || 3000);

  // Советы
  function tip() {
    if (!stuffElement) return;
    const tips = stuff.tips || [];
    if (tips.length > 0) {
      const text = tips[Math.floor(Math.random() * tips.length)];
      if (typeof toast === 'function') toast(`${stuff.emoji} ${text}`);
    }
    stuffTipTimer = setTimeout(tip, 30000 + Math.random() * 30000);
  }
  stuffTipTimer = setTimeout(tip, 15000);
}

/* ============================================================
   CLEANUP
============================================================ */
function removeStuff() {
  if (stuffElement && stuffElement.parentNode) stuffElement.remove();
  stuffElement = null;
  clearTimeout(stuffWalkTimer);
  clearTimeout(stuffJumpTimer);
  clearTimeout(stuffTipTimer);
    }
