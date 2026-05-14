<template>
  <div class="queue-board">
    <!-- Колонка "Ожидают" -->
    <section class="column" aria-labelledby="col-waiting">
      <h2 id="col-waiting">
        Ожидают
        <span class="counter">{{ waiting.length }}</span>
      </h2>

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
          :is-next="showNextHint && ticket.id === nextTicketId"
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
import { computed } from 'vue';
import TicketCard from './TicketCard.vue';
import SkeletonCard from './SkeletonCard.vue';

const props = defineProps({
  waiting: { type: Array, required: true },
  processing: { type: Array, required: true },
  myTicketIds: { type: Array, default: () => [] },
  isInitialLoad: { type: Boolean, default: false },
  isOperatorView: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  showNextHint: { type: Boolean, default: false }, // показывать ли бейдж "следующий"
});

defineEmits(['cancel']);

// ID первого в очереди — кого вызовут следующим
// Приоритет такой же, как в mockApi.callNext (но без проверки skipUntil — для UI достаточно)
const nextTicketId = computed(() => {
  const skipped = props.waiting.find((t) => t.status === 'skipped');
  if (skipped) return skipped.id;
  const first = props.waiting.find((t) => t.status === 'waiting');
  return first?.id || null;
});
</script>

<style scoped>
.queue-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
}

.column {
  background: var(--column-bg);
  padding: 0.85rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-soft);
  min-height: 240px;
  display: flex;
  flex-direction: column;
}

h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.85;
}

.counter {
  background: var(--primary);
  color: white;
  font-size: 0.8rem;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  min-width: 24px;
  text-align: center;
}

.empty-state {
  text-align: center;
  opacity: 0.5;
  margin: auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.5rem 0;
}
.empty-icon { font-size: 1.6rem; }

.list-container {
  flex: 1;
  /* Динамическая высота под доступное пространство, но не слишком много */
  max-height: 45vh;
  overflow-y: auto;
  padding-right: 4px;
  scroll-behavior: smooth;
}
.list-container::-webkit-scrollbar { width: 5px; }
.list-container::-webkit-scrollbar-thumb {
  background: var(--border-soft);
  border-radius: 4px;
}
.list-container::-webkit-scrollbar-thumb:hover { background: var(--primary); }

@media (max-width: 768px) {
  .queue-board { grid-template-columns: 1fr; }
  .column { min-height: 200px; }
  .list-container { max-height: 50vh; }
}
</style>
