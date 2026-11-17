/* ============================================================
   API — обёртка над storage + заглушка под будущий сервер
   Пока всё в localStorage. Когда появится сервер — заменить
   тела методов, интерфейс (save/load) не меняется.
============================================================ */

const api = {
  /* Сохранить состояние (пока — localStorage) */
  save() {
    return saveState();
  },

  /* Загрузить состояние (пока — localStorage) */
  load() {
    return loadState();
  },

  /* Проверка доступности сервера (заглушка) */
  isOnline() {
    return false;
  },

  /* Синхронизация (заглушка — ничего не делает) */
  async sync() {
    return { ok: true, local: true };
  },

  /* Авторизация (заглушка) */
  async auth() {
    return { ok: true, local: true };
  },
};

/* ============================================================
   STORAGE — безопасные обёртки (на случай приватного режима)
============================================================ */
const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) {
      console.error('[storage] set failed', e);
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); return true; } catch (e) { return false; }
  },
  clear() {
    try { localStorage.clear(); return true; } catch (e) { return false; }
  },
};
