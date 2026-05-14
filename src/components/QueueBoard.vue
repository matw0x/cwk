<template>
  <div class="queue-board">
    <!-- Колонка "Ожидают" -->
    <section class="column" aria-labelledby="col-waiting">
      <h2 id="col-waiting">
        Ожидают
        <span class="counter">{{ waiting.length }}</span>
      </h2>

      <!-- Скелетоны при первой загрузке -->
      <div v-if="isInitialLoad" class="list-container">
        <SkeletonCard v-for="n in 3" :key="`sk-w-${n}`" />
      </div>

      <TransitionGroup
        v-else
        name="list"
        tag="div"
        class="list-container"
        aria-live="polite"
      >
        <TicketCard
          v-for="ticket in waiting"
          :key="ticket.id"
          :ticket="ticket"
          :is-mine="myTicketIds.includes(ticket.id)"
          :is-operator-view="isOperatorView"
          :is-loading="isLoading"
          @cancel="$emit('cancel', $event)"
        />
      </TransitionGroup>

      <div v-if="!isInitialLoad && waiting.length === 0" class="empty-state">
        <span class="empty-icon">🌙</span>
        Очередь пуста
      </div>
    </section>

    <!-- Колонка "У окон" -->
    <section class="column" aria-labelledby="col-processing">
      <h2 id="col-processing">
        У окон
        <span class="counter">{{ processing.length }}</span>
      </h2>

      <div v-if="isInitialLoad" class="list-container">
        <SkeletonCard v-for="n in 2" :key="`sk-p-${n}`" />
      </div>

      <TransitionGroup
        v-else
        name="list"
        tag="div"
        class="list-container"
        aria-live="polite"
      >
        <TicketCard
          v-for="ticket in processing"
          :key="ticket.id"
          :ticket="ticket"
          :is-mine="myTicketIds.includes(ticket.id)"
          :is-operator-view="isOperatorView"
          :is-loading="isLoading"
        />
      </TransitionGroup>

      <div v-if="!isInitialLoad && processing.length === 0" class="empty-state">
        <span class="empty-icon">💤</span>
        Никого не вызывают
      </div>
    </section>
  </div>
</template>

<script setup>
import TicketCard from './TicketCard.vue';
import SkeletonCard from './SkeletonCard.vue';

defineProps({
  waiting: { type: Array, required: true },
  processing: { type: Array, required: true },
  myTicketIds: { type: Array, default: () => [] },
  isInitialLoad: { type: Boolean, default: false },
  isOperatorView: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
});

defineEmits(['cancel']);
</script>

<style scoped>
.queue-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.column {
  background: var(--column-bg);
  padding: 1.25rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-soft);
  /* Минимальная высота, чтобы пустые колонки не выглядели сжато */
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.85;
}

.counter {
  background: var(--primary);
  color: white;
  font-size: 0.85rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  min-width: 28px;
  text-align: center;
}

.empty-state {
  text-align: center;
  opacity: 0.5;
  margin: auto 0; /* центрирование по вертикали внутри flex-колонки */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 0;
}
.empty-icon { font-size: 2rem; }

.list-container {
  flex: 1;
  /* Используем calc от высоты вьюпорта, чтобы список вытягивался под экран */
  max-height: calc(100vh - 320px);
  min-height: 300px;
  overflow-y: auto;
  padding-right: 6px;
  scroll-behavior: smooth;
}
.list-container::-webkit-scrollbar { width: 6px; }
.list-container::-webkit-scrollbar-thumb {
  background: var(--border-soft);
  border-radius: 4px;
}
.list-container::-webkit-scrollbar-thumb:hover { background: var(--primary); }

@media (max-width: 768px) {
  .queue-board { grid-template-columns: 1fr; gap: 1rem; }
  .column { min-height: 250px; }
  .list-container { max-height: 60vh; }
}
</style>
