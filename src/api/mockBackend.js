/**
 * src/api/mockBackend.js
 *
 * Заглушка бэкенда с persistence и кросс-табной синхронизацией через localStorage.
 *
 * Логика пропуска (skip):
 *  Когда оператор нажимает "не пришёл", талон не возвращается в начало очереди.
 *  Ему присваивается skipUntil — порядковый номер следующих обслуживаний,
 *  после которого он снова станет доступен. По умолчанию пропускаем 2 клиента
 *  вперёд. Это решает проблему "тот же самый клиент сразу же вызывается снова".
 */

const STORAGE_KEY = 'queue:data';
const SKIP_AHEAD = 2; // сколько клиентов пропустить вперёд

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('mockApi: не удалось прочитать состояние', e);
  }
  return { tickets: [], ticketCounter: 1, servedCount: 0 };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('mockApi: не удалось сохранить состояние', e);
  }
}

let state = loadState();
// Совместимость со старыми сохранёнными данными
if (state.servedCount === undefined) state.servedCount = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sortedCopy = () =>
  [...state.tickets].sort((a, b) => a.timestamp - b.timestamp);

// === Кросс-табная синхронизация ===
const externalListeners = new Set();

window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  state = loadState();
  if (state.servedCount === undefined) state.servedCount = 0;
  externalListeners.forEach((cb) => cb());
});

export const mockApi = {
  async getTickets() {
    await delay(300);
    return sortedCopy();
  },

  // Сколько клиентов уже обслужено — нужно для логики "попозже"
  getServedCount() {
    return state.servedCount;
  },

  onExternalChange(callback) {
    externalListeners.add(callback);
    return () => externalListeners.delete(callback);
  },

  // Создать талон. ownerId — идентификатор пользователя (для multi-user через ?user=)
  async addTicket(clientName = '', ownerId = null) {
    await delay(500);

    const newTicket = {
      id: `A-${state.ticketCounter++}`,
      status: 'waiting', // 'waiting' | 'processing' | 'done' | 'skipped'
      window: null,
      clientName: String(clientName || '').trim().slice(0, 40),
      ownerId: ownerId || null,
      skipUntil: null, // если skipped — после какого servedCount можно снова вызвать
      timestamp: Date.now(),
    };

    state.tickets.push(newTicket);
    saveState(state);
    return { ...newTicket };
  },

  async cancelTicket(id) {
    await delay(200);
    const ticket = state.tickets.find((t) => t.id === id);
    if (!ticket) return { error: 'Талон не найден' };
    if (ticket.status !== 'waiting' && ticket.status !== 'skipped') {
      return { error: 'Этот талон уже обслуживается, отменить нельзя' };
    }
    state.tickets = state.tickets.filter((t) => t.id !== id);
    saveState(state);
    return { data: { id } };
  },

  async callNext(windowNumber) {
    await delay(400);

    // Защита: окно уже занято
    const alreadyAtWindow = state.tickets.find(
      (t) => t.status === 'processing' && t.window === windowNumber
    );
    if (alreadyAtWindow) {
      return { error: `Окно ${windowNumber} уже занято` };
    }

    const sorted = sortedCopy();

    // Сначала ищем "созревшие" skipped — те, чей skipUntil уже пройден
    const readySkipped = sorted.find(
      (t) => t.status === 'skipped' && state.servedCount >= (t.skipUntil ?? 0)
    );

    // Иначе берём первого waiting
    const next = readySkipped || sorted.find((t) => t.status === 'waiting');

    if (!next) {
      // Дополнительно проверим: может, есть skipped, но они ещё "спят"?
      const stillSleeping = sorted.find((t) => t.status === 'skipped');
      if (stillSleeping) {
        return { error: 'Очередь пуста (пропущенные ещё не созрели)' };
      }
      return { error: 'Очередь пуста, некого вызывать' };
    }

    const real = state.tickets.find((t) => t.id === next.id);
    real.status = 'processing';
    real.window = windowNumber;
    real.skipUntil = null; // больше не "спим"
    saveState(state);

    return { data: { ...real } };
  },

  // Пропустить клиента — не возвращать в очередь сразу, а через SKIP_AHEAD обслуживаний
  async skipTicket(id) {
    await delay(200);
    const ticket = state.tickets.find((t) => t.id === id);
    if (!ticket) return { error: 'Талон не найден' };
    ticket.status = 'skipped';
    ticket.window = null;
    // Пропустить вперёд SKIP_AHEAD клиентов
    ticket.skipUntil = state.servedCount + SKIP_AHEAD;
    saveState(state);
    return { data: { ...ticket } };
  },

  async completeTicket(id) {
    await delay(200);
    const ticket = state.tickets.find((t) => t.id === id);
    if (ticket) {
      ticket.status = 'done';
      state.servedCount += 1; // счётчик "сколько обслужено"
    }
    saveState(state);
    return { success: true };
  },

  async resetAll() {
    state = { tickets: [], ticketCounter: 1, servedCount: 0 };
    saveState(state);
  },
};
