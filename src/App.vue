<template>
  <div class="app-container">
    <header>
      <h1>Электронная очередь</h1>
      <div class="header-controls">
        <div class="mode-switch">
          <button :class="{ active: viewMode === 'client' }" @click="viewMode = 'client'">Клиент</button>
          <button :class="{ active: viewMode === 'admin' }" @click="viewMode = 'admin'">Оператор</button>
        </div>
        <button class="theme-toggle" @click="toggleTheme" aria-label="Переключить темную тему">🌓 Тема</button>
      </div>
    </header>

    <div v-if="errorMsg" class="error-banner" role="alert">
      {{ errorMsg }}
      <button @click="clearError" aria-label="Закрыть ошибку">✕</button>
    </div>

    <section v-if="viewMode === 'client'" class="client-zone">
      <button class="btn-take-ticket" @click="handleTakeTicket" :disabled="isLoading">
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>ВЗЯТЬ ТАЛОН</span>
      </button>
      
      <QueueBoard 
        :waiting="waitingTickets" 
        :processing="processingTickets"
        :myTicketIds="myTicketIds" 
      />
    </section>

    <section v-if="viewMode === 'admin'" class="admin-zone">
      <h2>Пульт операторов</h2>
      <div class="windows-grid">
        <AdminPanel 
          :windowId="1" 
          :currentTicket="getTicketForWindow(1)"
          :isLoading="isLoading"
          :waitingCount="waitingTickets.length"
          @call-next="callNextClient" 
          @finish="finishTicket" 
        />
        <AdminPanel 
          :windowId="2" 
          :currentTicket="getTicketForWindow(2)"
          :isLoading="isLoading"
          :waitingCount="waitingTickets.length"
          @call-next="callNextClient" 
          @finish="finishTicket" 
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useQueue } from './composables/useQueue';
import QueueBoard from './components/QueueBoard.vue';
import AdminPanel from './components/AdminPanel.vue';

const { 
  waitingTickets, processingTickets, isLoading, errorMsg, 
  loadTickets, takeTicket, callNextClient, finishTicket, clearError 
} = useQueue();

const myTicketIds = ref([]);
const viewMode = ref('client'); // По умолчанию показываем интерфейс клиента

onMounted(() => {
  loadTickets(); 
});

const handleTakeTicket = async () => {
  const newTicket = await takeTicket();
  if (newTicket) {
    myTicketIds.value.push(newTicket.id);
  }
};

const getTicketForWindow = (windowId) => {
  return processingTickets.value.find(t => t.window === windowId);
};

const isDark = ref(false);
const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
};
</script>

<style>
@import './assets/styles.css';

.app-container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.header-controls { display: flex; gap: 1rem; align-items: center; }

/* Стили для переключателя Клиент/Админ */
.mode-switch { display: flex; background: var(--card-bg); border-radius: var(--border-radius); overflow: hidden; border: 1px solid var(--text-color); }
.mode-switch button { border-radius: 0; background: transparent; color: var(--text-color); opacity: 0.6; }
.mode-switch button.active { background: var(--text-color); color: var(--bg-color); opacity: 1; }

.theme-toggle { background: transparent; border: 1px solid var(--text-color); color: var(--text-color); }
.btn-take-ticket { width: 100%; height: 70px; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; background-color: var(--primary); color: white; border-radius: var(--border-radius); transition: background-color 0.2s; }
.btn-take-ticket:hover:not(:disabled) { background-color: #0b5ed7; }
.btn-take-ticket:disabled { opacity: 0.8; cursor: wait; }

.error-banner { background-color: #f8d7da; color: #842029; padding: 1rem; border-radius: var(--border-radius); display: flex; justify-content: space-between; margin-bottom: 1rem;}
.windows-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }

@media (max-width: 768px) { 
  .windows-grid { grid-template-columns: 1fr; }
  header { flex-direction: column; gap: 1rem; }
}
</style>