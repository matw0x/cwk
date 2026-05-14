<template>
  <div class="app-container">
    <header class="app-header">
      <h1>
        <span class="logo" aria-hidden="true">🎫</span>
        Электронная очередь
      </h1>
      <div class="header-controls">
        <div class="user-badge" :title="`Вы: ${userId}`">
          <span aria-hidden="true">👤</span>
          <span class="user-id">{{ userId }}</span>
        </div>

        <div class="mode-switch" role="tablist">
          <button
            role="tab"
            :class="{ active: viewMode === 'client' }"
            :aria-selected="viewMode === 'client'"
            @click="viewMode = 'client'"
          >
            Клиент
          </button>
          <button
            role="tab"
            :class="{ active: viewMode === 'admin' }"
            :aria-selected="viewMode === 'admin'"
            @click="viewMode = 'admin'"
          >
            Оператор
          </button>
        </div>

        <button
          class="theme-toggle"
          type="button"
          :aria-label="`Включить ${isDark ? 'светлую' : 'тёмную'} тему`"
          @click="toggleTheme"
        >
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <Transition name="fade-slide">
      <div v-if="errorMsg" class="error-banner" role="alert">
        <span>⚠️ {{ errorMsg }}</span>
        <button type="button" aria-label="Закрыть ошибку" @click="clearError">✕</button>
      </div>
    </Transition>

    <!-- === Клиентская зона === -->
    <section v-if="viewMode === 'client'" class="client-zone" aria-label="Клиентская зона">
      <TransitionGroup name="banner" tag="div">
        <MyTicketBanner
          v-for="ticket in myActiveTickets"
          :key="ticket.id"
          :ticket="ticket"
          :waiting-list="waitingTickets"
          :is-loading="isLoading"
          :avg-service-minutes="avgServiceMinutes"
          @cancel="handleCancel"
        />
      </TransitionGroup>

      <div class="take-ticket-card">
        <div class="take-ticket-text">
          <h2>Возьмите талон</h2>
          <p>Введите имя — необязательно, но удобнее.</p>
        </div>
        <div class="take-ticket-controls">
          <input
            v-model="clientName"
            type="text"
            class="name-input"
            placeholder="Ваше имя"
            maxlength="40"
            aria-label="Ваше имя"
            @keyup.enter="handleTakeTicket"
          />
          <button
            class="btn-take-ticket"
            type="button"
            :disabled="isLoading"
            @click="handleTakeTicket"
          >
            <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
            <span v-else>ВЗЯТЬ ТАЛОН</span>
          </button>
        </div>
      </div>

      <QueueBoard
        :waiting="waitingTickets"
        :processing="processingTickets"
        :my-ticket-ids="myTicketIds"
        :is-initial-load="isInitialLoad"
        :is-loading="isLoading"
        @cancel="handleCancel"
      />
    </section>

    <!-- === Зона оператора === -->
    <section v-if="viewMode === 'admin'" class="admin-zone" aria-label="Зона оператора">
      <!-- Статистика (пункт 7) -->
      <StatsBar
        :served-count="servedCount"
        :waiting-count="waitingTickets.length"
        :processing-count="processingTickets.length"
        :avg-minutes="avgServiceMinutes"
        :is-loading="isLoading"
        @reset="handleResetRequest"
      />

      <div class="windows-grid">
        <AdminPanel
          v-for="(windowId, idx) in WINDOWS"
          :key="windowId"
          :window-id="windowId"
          :current-ticket="getTicketForWindow(windowId)"
          :is-loading="isLoading"
          :waiting-count="waitingTickets.length"
          :call-key="CALL_KEYS[idx]"
          :finish-key="FINISH_KEYS[idx]"
          @call-next="callNextClient"
          @skip="skipTicket"
          @finish="finishTicket"
        />
      </div>

      <!-- Подсказка по хоткеям -->
      <div class="hotkeys-hint">
        Хоткеи: <kbd>Q</kbd>/<kbd>W</kbd> — вызвать в окно 1/2,
        <kbd>1</kbd>/<kbd>2</kbd> — завершить окно 1/2
      </div>

      <QueueBoard
        :waiting="waitingTickets"
        :processing="processingTickets"
        :my-ticket-ids="[]"
        :is-initial-load="isInitialLoad"
        :is-loading="isLoading"
        :is-operator-view="true"
        :show-next-hint="true"
        :served-count="servedCount"
      />
    </section>

    <!-- Модальное окно подтверждения сброса -->
    <Transition name="modal">
      <div v-if="showResetConfirm" class="modal-backdrop" @click.self="showResetConfirm = false">
        <div class="modal" role="dialog" aria-modal="true">
          <h3>Сбросить очередь?</h3>
          <p>Все талоны будут удалены, счётчик обнулится. Действие нельзя отменить.</p>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showResetConfirm = false">
              Отмена
            </button>
            <button type="button" class="btn-danger" @click="confirmReset">
              Да, сбросить
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useQueue } from './composables/useQueue';
import { useLocalStorage } from './composables/useLocalStorage';
import { getUserId } from './composables/useUserId';
import { useTitleNotifier } from './composables/useTitleNotifier';
import QueueBoard from './components/QueueBoard.vue';
import AdminPanel from './components/AdminPanel.vue';
import MyTicketBanner from './components/MyTicketBanner.vue';
import StatsBar from './components/StatsBar.vue';

const WINDOWS = [1, 2];
const CALL_KEYS = ['Q', 'W'];   // хоткей "вызвать" для окон 1/2
const FINISH_KEYS = ['1', '2']; // хоткей "завершить" для окон 1/2

const userId = getUserId();

const {
  waitingTickets,
  processingTickets,
  servedCount,
  avgServiceMinutes,
  isLoading,
  isInitialLoad,
  errorMsg,
  loadTickets,
  takeTicket,
  cancelTicket,
  callNextClient,
  skipTicket,
  finishTicket,
  resetAll,
  clearError,
} = useQueue();

const myTicketIds = useLocalStorage(`queue:myTicketIds:${userId}`, []);
const viewMode = useLocalStorage('queue:viewMode', 'client');
const isDark = useLocalStorage('queue:isDark', false);
const clientName = ref('');
const showResetConfirm = ref(false);

watch(
  isDark,
  (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  },
  { immediate: true }
);

const toggleTheme = () => {
  isDark.value = !isDark.value;
};

const myActiveTickets = computed(() => {
  const ids = new Set(myTicketIds.value);
  return [...waitingTickets.value, ...processingTickets.value].filter((t) =>
    ids.has(t.id)
  );
});

// === Title-уведомление (пункт 2) ===
// Когда твой талон переходит в processing — мигаем заголовком вкладки
const { notify } = useTitleNotifier();
watch(
  () => myActiveTickets.value.map((t) => `${t.id}:${t.status}`).join(','),
  (newVal, oldVal) => {
    const wasProcessing = (oldVal || '').includes(':processing');
    const isProcessing = newVal.includes(':processing');
    // Сработало только в момент перехода в processing
    if (!wasProcessing && isProcessing) {
      const myTicket = myActiveTickets.value.find((t) => t.status === 'processing');
      if (myTicket) {
        notify(`🔔 ${myTicket.id} → Окно №${myTicket.window}`);
      }
    }
  }
);

onMounted(() => {
  loadTickets();
});

const handleTakeTicket = async () => {
  const newTicket = await takeTicket(clientName.value, userId);
  if (newTicket) {
    myTicketIds.value.push(newTicket.id);
    clientName.value = '';
  }
};

const handleCancel = async (id) => {
  const ok = await cancelTicket(id);
  if (ok) {
    myTicketIds.value = myTicketIds.value.filter((tid) => tid !== id);
  }
};

const getTicketForWindow = (windowId) =>
  processingTickets.value.find((t) => t.window === windowId);

// === Сброс с подтверждением ===
const handleResetRequest = () => {
  showResetConfirm.value = true;
};
const confirmReset = async () => {
  showResetConfirm.value = false;
  await resetAll();
  // Чистим и наши локальные id (они уже не существуют)
  myTicketIds.value = [];
};

// === Хоткеи оператора (пункт 8) ===
// Работают только в режиме admin и когда не ввод в input
const handleKeydown = (e) => {
  if (viewMode.value !== 'admin') return;
  // Игнорируем, если фокус в input/textarea/contenteditable
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toUpperCase();
  // Q/W — вызвать следующего в окно
  const callIdx = CALL_KEYS.indexOf(key);
  if (callIdx !== -1) {
    e.preventDefault();
    const windowId = WINDOWS[callIdx];
    if (!getTicketForWindow(windowId) && waitingTickets.value.length > 0) {
      callNextClient(windowId);
    }
    return;
  }
  // 1/2 — завершить текущего в окне
  const finishIdx = FINISH_KEYS.indexOf(e.key);
  if (finishIdx !== -1) {
    e.preventDefault();
    const windowId = WINDOWS[finishIdx];
    const ticket = getTicketForWindow(windowId);
    if (ticket) finishTicket(ticket.id);
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style>
@import './assets/styles.css';

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.app-header h1 {
  margin: 0;
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.logo { font-size: 1.5rem; }

.header-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--column-bg);
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.8rem;
  cursor: help;
}
.user-id { font-family: ui-monospace, monospace; font-weight: 600; }

.mode-switch {
  display: flex;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--border-soft);
  padding: 2px;
  gap: 2px;
}
.mode-switch button {
  border-radius: calc(var(--border-radius) - 4px);
  background: transparent;
  color: var(--text-color);
  opacity: 0.7;
  padding: 0.3rem 0.75rem;
  font-size: 0.85rem;
  transition: background-color 0.25s ease, color 0.25s ease, opacity 0.25s ease;
}
.mode-switch button:hover { opacity: 1; }
.mode-switch button.active {
  background: var(--primary);
  color: white;
  opacity: 1;
}

.theme-toggle {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  color: var(--text-color);
  width: 34px;
  height: 34px;
  padding: 0;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}
.theme-toggle:hover { background: var(--column-bg); }

/* Главная карточка "Возьмите талон" — компактнее */
.take-ticket-card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--border-radius);
  padding: 1rem 1.25rem;
  margin: 0.75rem 0;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.25rem;
  align-items: center;
}
.take-ticket-text h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.3rem;
}
.take-ticket-text p {
  margin: 0;
  opacity: 0.7;
  font-size: 0.85rem;
  line-height: 1.4;
}

.take-ticket-controls {
  display: flex;
  gap: 0.6rem;
}

.name-input {
  flex: 1;
  padding: 0.7rem 0.9rem;
  font-size: 0.95rem;
  background: var(--bg-color);
  color: var(--text-color);
  border: 1px solid var(--border-soft);
  border-radius: var(--border-radius);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.name-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
}

.btn-take-ticket {
  min-width: 200px;
  height: 50px;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 1px;
  background-color: var(--primary);
  color: white;
  border-radius: var(--border-radius);
  transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn-take-ticket:hover:not(:disabled) {
  background-color: var(--primary-hover);
  box-shadow: 0 4px 14px rgba(13, 110, 253, 0.3);
}
.btn-take-ticket:active:not(:disabled) { transform: scale(0.99); }
.btn-take-ticket:disabled { opacity: 0.7; cursor: wait; }

/* Подсказка по хоткеям */
.hotkeys-hint {
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.65;
  margin: 0.5rem 0;
}
.hotkeys-hint kbd {
  font-family: ui-monospace, monospace;
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 3px;
  padding: 0.05rem 0.35rem;
  font-size: 0.75rem;
}

.banner-enter-active, .banner-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.banner-enter-from, .banner-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.error-banner {
  background-color: #f8d7da;
  color: #842029;
  padding: 0.6rem 1rem;
  border-radius: var(--border-radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}
.error-banner button {
  background: transparent;
  color: #842029;
  font-size: 1rem;
  padding: 0 0.4rem;
}
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.windows-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Модальное окно подтверждения */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}
.modal h3 { margin-top: 0; }
.modal p { opacity: 0.8; }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-soft);
  color: var(--text-color);
  padding: 0.5rem 1rem;
}
.btn-danger {
  background: var(--danger);
  color: white;
  padding: 0.5rem 1rem;
}
.btn-danger:hover { filter: brightness(1.1); }

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal, .modal-leave-active .modal {
  transition: transform 0.2s ease;
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.95); }

@media (max-width: 900px) {
  .take-ticket-card { grid-template-columns: 1fr; gap: 0.75rem; padding: 0.85rem 1rem; }
  .take-ticket-controls { flex-direction: column; }
  .btn-take-ticket { width: 100%; min-width: 0; }
}
@media (max-width: 768px) {
  .app-container { padding: 0.75rem; }
  .windows-grid { grid-template-columns: 1fr; }
}
</style>
