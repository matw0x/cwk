<template>
  <div class="app-container">
    <header class="app-header">
      <h1>
        <span class="logo" aria-hidden="true">🎫</span>
        Электронная очередь
      </h1>
      <div class="header-controls">
        <!-- Индикатор текущего пользователя (для multi-user через ?user=) -->
        <div class="user-badge" :title="`Личность вкладки: ${userId}`">
          <span class="user-icon" aria-hidden="true">👤</span>
          <span class="user-id">{{ userId }}</span>
        </div>

        <!-- Переключатель режимов -->
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

    <!-- Баннер ошибок -->
    <Transition name="fade-slide">
      <div v-if="errorMsg" class="error-banner" role="alert">
        <span>⚠️ {{ errorMsg }}</span>
        <button type="button" aria-label="Закрыть ошибку" @click="clearError">✕</button>
      </div>
    </Transition>

    <!-- === Клиентская зона === -->
    <section v-if="viewMode === 'client'" class="client-zone" aria-label="Клиентская зона">
      <!-- Большие баннеры со своими активными талонами -->
      <TransitionGroup name="banner" tag="div">
        <MyTicketBanner
          v-for="ticket in myActiveTickets"
          :key="ticket.id"
          :ticket="ticket"
          :waiting-list="waitingTickets"
          :is-loading="isLoading"
          @cancel="handleCancel"
        />
      </TransitionGroup>

      <!-- Главный блок: акцентное приглашение взять талон -->
      <div class="take-ticket-card">
        <div class="take-ticket-text">
          <h2>Возьмите талон</h2>
          <p>Введите имя — оператор будет знать, к кому обращается.
            Имя необязательно.</p>
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

      <!-- Общее табло -->
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
      <h2 class="zone-title">Пульт операторов</h2>
      <div class="windows-grid">
        <AdminPanel
          v-for="windowId in WINDOWS"
          :key="windowId"
          :window-id="windowId"
          :current-ticket="getTicketForWindow(windowId)"
          :is-loading="isLoading"
          :waiting-count="waitingTickets.length"
          @call-next="callNextClient"
          @skip="skipTicket"
          @finish="finishTicket"
        />
      </div>

      <QueueBoard
        :waiting="waitingTickets"
        :processing="processingTickets"
        :my-ticket-ids="[]"
        :is-initial-load="isInitialLoad"
        :is-loading="isLoading"
        :is-operator-view="true"
      />
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useQueue } from './composables/useQueue';
import { useLocalStorage } from './composables/useLocalStorage';
import { getUserId } from './composables/useUserId';
import QueueBoard from './components/QueueBoard.vue';
import AdminPanel from './components/AdminPanel.vue';
import MyTicketBanner from './components/MyTicketBanner.vue';

const WINDOWS = [1, 2];

// === ID текущего пользователя (из ?user= или sgenerированный) ===
// От этого зависит, какие талоны считаются "своими"
const userId = getUserId();

const {
  waitingTickets,
  processingTickets,
  isLoading,
  isInitialLoad,
  errorMsg,
  loadTickets,
  takeTicket,
  cancelTicket,
  callNextClient,
  skipTicket,
  finishTicket,
  clearError,
} = useQueue();

// Ключи в localStorage привязаны к userId — у каждого пользователя свой набор
const myTicketIds = useLocalStorage(`queue:myTicketIds:${userId}`, []);
const viewMode = useLocalStorage('queue:viewMode', 'client');
const isDark = useLocalStorage('queue:isDark', false);
const clientName = ref('');

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

// Активные талоны пользователя (waiting/skipped/processing)
const myActiveTickets = computed(() => {
  const ids = new Set(myTicketIds.value);
  return [...waitingTickets.value, ...processingTickets.value].filter((t) =>
    ids.has(t.id)
  );
});

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
</script>

<style>
@import './assets/styles.css';

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.app-header h1 {
  margin: 0;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.logo { font-size: 1.8rem; }

.header-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Бейдж с user-id */
.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--column-bg);
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.85rem;
  cursor: help;
}
.user-icon { opacity: 0.7; }
.user-id { font-family: ui-monospace, monospace; font-weight: 600; }

/* Переключатель режимов */
.mode-switch {
  display: flex;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--border-soft);
  padding: 3px;
  gap: 3px;
}
.mode-switch button {
  border-radius: calc(var(--border-radius) - 4px);
  background: transparent;
  color: var(--text-color);
  opacity: 0.7;
  padding: 0.4rem 0.9rem;
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
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 1.1rem;
  transition: background-color 0.2s ease;
}
.theme-toggle:hover { background: var(--column-bg); }

/* === Главная карточка "Возьмите талон" === */
.take-ticket-card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--border-radius);
  padding: 2rem;
  margin: 1rem 0;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  align-items: center;
}
.take-ticket-text h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}
.take-ticket-text p {
  margin: 0;
  opacity: 0.7;
  font-size: 0.95rem;
  line-height: 1.5;
}

.take-ticket-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.name-input {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1rem;
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
  width: 100%;
  height: 72px;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  background-color: var(--primary);
  color: white;
  border-radius: var(--border-radius);
  transition: background-color 0.2s ease, transform 0.1s ease,
    box-shadow 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn-take-ticket:hover:not(:disabled) {
  background-color: var(--primary-hover);
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.35);
}
.btn-take-ticket:active:not(:disabled) { transform: scale(0.99); }
.btn-take-ticket:disabled { opacity: 0.7; cursor: wait; }

/* Анимация появления баннеров с талонами */
.banner-enter-active, .banner-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.banner-enter-from, .banner-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* Баннер ошибки */
.error-banner {
  background-color: #f8d7da;
  color: #842029;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.error-banner button {
  background: transparent;
  color: #842029;
  font-size: 1.1rem;
  padding: 0 0.5rem;
}
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.zone-title { margin-top: 0; }

.windows-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 900px) {
  .take-ticket-card { grid-template-columns: 1fr; gap: 1rem; padding: 1.5rem; }
}
@media (max-width: 768px) {
  .app-container { padding: 1rem; }
  .windows-grid { grid-template-columns: 1fr; }
  .btn-take-ticket { height: 60px; font-size: 1.2rem; }
}
</style>
