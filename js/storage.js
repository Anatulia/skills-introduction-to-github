// Persistenza locale: la cena in corso e lo storico vivono in localStorage.

const CURRENT_KEY = 'tavolo.current';
const HISTORY_KEY = 'tavolo.history';

export function saveCurrent(state) {
  try { localStorage.setItem(CURRENT_KEY, JSON.stringify(state)); } catch { /* quota piena: pazienza */ }
}

export function loadCurrent() {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearCurrent() {
  localStorage.removeItem(CURRENT_KEY);
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveToHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))); } catch { /* ignora */ }
}

export function deleteFromHistory(index) {
  const history = loadHistory();
  history.splice(index, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
