<template>
  <div class="queue-board">
    <div class="column">
      <h2>Ожидают ({{ waiting.length }})</h2>
      
      <TransitionGroup name="list" tag="div" class="list-container">
        <TicketCard 
          v-for="ticket in waiting" 
          :key="ticket.id" 
          :ticket="ticket"
          :isMine="myTicketIds.includes(ticket.id)" 
        />
      </TransitionGroup>
      
      <div v-if="waiting.length === 0" class="empty-state">
        Очередь пуста
      </div>
    </div>

    <div class="column">
      <h2>У окон ({{ processing.length }})</h2>
      
      <TransitionGroup name="list" tag="div" class="list-container">
        <TicketCard 
          v-for="ticket in processing" 
          :key="ticket.id" 
          :ticket="ticket"
          :isMine="myTicketIds.includes(ticket.id)" 
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import TicketCard from './TicketCard.vue';

defineProps({
  waiting: { type: Array, required: true },
  processing: { type: Array, required: true },
  myTicketIds: { type: Array, default: () => [] } // Принимаем массив ID талонов пользователя
});
</script>

<style scoped>
.queue-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 2rem 0;
}

.column {
  background: rgba(0,0,0, 0.02);
  padding: 1rem;
  border-radius: var(--border-radius);
}

h2 { 
  text-align: center; 
  margin-bottom: 1rem;
}

.empty-state { 
  text-align: center; 
  opacity: 0.5; 
  margin-top: 2rem; 
}

/* Ограничиваем высоту списков, чтобы они не разрастались бесконечно */
.list-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px; /* Отступ для скроллбара */
}

/* Стилизация скроллбара */
.list-container::-webkit-scrollbar { 
  width: 6px; 
}
.list-container::-webkit-scrollbar-thumb { 
  background: #ccc; 
  border-radius: 4px; 
}

@media (max-width: 768px) {
  .queue-board { grid-template-columns: 1fr; }
}
</style>