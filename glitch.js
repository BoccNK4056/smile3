/* ============================================================
   GLITCH — событие «Глюк»
   Экран затемняется, тряска, всплывают реплики (воспоминания),
   все смайлы становятся чёрными. 8–12 сек, потом затухание.
   Сбрасывается при закрытии Mini App (не сохраняется).
============================================================ */

let glitchActive = false;
let glitchTimeouts = [];

function triggerGlitch() {
   if (!ENABLE_GLITCH) return;
  if (glitchActive) return;
  const layer = document.getElementById('glitch-layer');
  if (!layer) return;                 // ← до glitchActive
  glitchActive = true;

  document.body.classList.add('glitch-mode');
  layer.hidden = false;
  layer.style.display = '';           // ← вернуть видимость
  layer.classList.remove('fading');
  layer.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'glitch-whispers';
  layer.appendChild(wrap);

  // Тряска
  document.body.classList.add('glitch-shake');

  // Выбор 6–7 случайных реплик без повторов
  const count = 6 + Math.floor(Math.random() * 2);
  const pool = [...ICE_WHISPERS];
  const chosen = [];
  while (chosen.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  // Показ реплик по очереди
  const totalDuration = 9000 + Math.random() * 3000; // 9–12 сек
  const step = totalDuration / (chosen.length + 1);

  chosen.forEach((text, i) => {
    glitchTimeouts.push(setTimeout(() => {
      if (!glitchActive) return;
      const el = document.createElement('div');
      el.className = 'glitch-whisper';
      if (Math.random() < 0.3) el.classList.add('distort');
      el.textContent = text;
      el.style.animationDelay = '0s';
      wrap.appendChild(el);
      // Удаляем старые, чтобы не копились
      if (wrap.children.length > 3) {
        wrap.removeChild(wrap.firstChild);
      }
      vibrate('light');
    }, i * step));
  });

  // Завершение
  glitchTimeouts.push(setTimeout(() => {
    layer.classList.add('fading');
    document.body.classList.remove('glitch-shake');
    glitchTimeouts.push(setTimeout(() => {
      layer.classList.add('fading');
      layer.hidden = true;
      layer.innerHTML = '';
      document.body.classList.remove('glitch-mode');
      glitchActive = false;
    }, 2000));
  }, totalDuration));
}

/* ============================================================
   СБРОС при закрытии Mini App
============================================================ */
function resetGlitch() {
  glitchTimeouts.forEach(t => clearTimeout(t));
  glitchTimeouts = [];

  const layer = document.getElementById('glitch-layer');
  if (layer) {
    layer.hidden = true;
    layer.style.display = 'none';     // ← жёстко скрыть
    layer.innerHTML = '';
    layer.classList.remove('fading');
  }
  document.body.classList.remove('glitch-mode', 'glitch-shake');
  glitchActive = false;
}

/* ============================================================
   СЛУЧАЙНЫЙ ТРИГГЕР — 0.000001% каждую секунду
   Вызывается из main.js через setInterval(1000)
============================================================ */
function maybeRandomGlitch() {
  if (!ENABLE_GLITCH) return;
  if (glitchActive) return;
  if (Math.random() < 0.00000001) {
    triggerGlitch();
  }
}
