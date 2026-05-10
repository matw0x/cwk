<template>
  <div class="app-container">
    <header>
      <h1>Электронная очередь</h1>
      <button class="theme-toggle" @click="toggleTheme">Вкл/Выкл темную тему</button>
    </header>

    <div v-if="errorMsg" class="error-banner">
      {{ errorMsg }}
      <button @click="clearError">✕</button>
    </div>

    <section class="client-zone">
      <button class="btn-take-ticket" @click="handleTakeTicket" :disabled="isLoading">
        {{ isLoading ? 'Получение...' : 'ВЗЯТЬ ТАЛОН' }}
      </button>
      
      <QueueBoard 
        :waiting="waitingTickets" 
        :processing="processingTickets"
        :myTicketIds="myTicketIds" 
      />
    </section>

    <hr>

    <section class="admin-zone">
      <h2>Пульт операторов</h2>
      <div class="windows-grid">
        <AdminPanel 
          :windowId="1" 
          :currentTicket="getTicketForWindow(1)"
          :isLoading="isLoading"
          @call-next="callNextClient" 
          @finish="finishTicket" 
        />
        <AdminPanel 
          :windowId="2" 
          :currentTicket="getTicketForWindow(2)"
          :isLoading="isLoading"
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

// Стейт для хранения ВСЕХ наших талонов (теперь это массив)
const myTicketIds = ref([]);

onMounted(() => {
  loadTickets(); 
});

// Добавляем новый ID в массив при взятии талона
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
.theme-toggle { background: transparent; border: 1px solid var(--text-color); color: var(--text-color); }
.btn-take-ticket { width: 100%; padding: 1.5rem; font-size: 1.5rem; background-color: var(--primary); color: white; border-radius: var(--border-radius); transition: background-color 0.2s; }
.btn-take-ticket:hover:not(:disabled) { background-color: #0b5ed7; }
.error-banner { background-color: #f8d7da; color: #842029; padding: 1rem; border-radius: var(--border-radius); display: flex; justify-content: space-between; margin-bottom: 1rem;}
.windows-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
@media (max-width: 768px) { .windows-grid { grid-template-columns: 1fr; } }
hr { border: none; border-top: 1px solid var(--text-color); margin: 3rem 0; opacity: 0.1; }
</style>