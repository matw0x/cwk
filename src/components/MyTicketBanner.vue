<template>
  <article class="my-ticket" :class="ticket.status">
    <!-- Статус слева -->
    <div class="status-side">
      <div class="ticket-big-id">{{ ticket.id }}</div>
      <div class="status-text">
        <template v-if="ticket.status === 'processing'">
          <span class="status-label processing-label">ВАС ВЫЗЫВАЮТ</span>
          <span class="window-info">К окну №{{ ticket.window }}</span>
        </template>
        <template v-else-if="ticket.status === 'skipped'">
          <span class="status-label skipped-label">Вы пропущены</span>
          <span class="status-sub">Подойдите к окну, вас вызовут повторно</span>
        </template>
        <template v-else>
          <span class="status-label">В очереди</span>
          <span v-if="positionInQueue !== null" class="status-sub">
            Перед вами:
            <strong>{{ peopleBefore }}</strong>
            {{ peopleWord }}
          </span>
        </template>
      </div>
    </div>

    <!-- Оценка ожидания справа (только для waiting) -->
    <div v-if="ticket.status === 'waiting'" class="estimate-side">
      <div class="estimate-label">Примерное ожидание</div>
      <div class="estimate-value">
        <span v-if="peopleBefore === 0">сейчас</span>
        <span v-else>~{{ estimatedMinutes }} мин</span>
      </div>
    </div>

    <!-- Кнопка отмены -->
    <button
      v-if="ticket.status === 'waiting' || ticket.status === 'skipped'"
      class="btn-leave"
      type="button"
      :disabled="isLoading"
      @click="$emit('cancel', ticket.id)"
    >
      Выйти из очереди
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  ticket: { type: Object, required: true },
  waitingList: { type: Array, required: true }, // отсортированный список ожидающих
  isLoading: { type: Boolean, default: false },
  avgServiceMinutes: { type: Number, default: 3 }, // среднее время обслуживания одного клиента
});

defineEmits(['cancel']);

// Позиция в очереди (0-индексированная). null если талон не в waiting.
const positionInQueue = computed(() => {
  if (props.ticket.status !== 'waiting') return null;
  return props.waitingList.findIndex((t) => t.id === props.ticket.id);
});

// Сколько людей перед нашим (не считая нас)
const peopleBefore = computed(() => {
  const pos = positionInQueue.value;
  return pos === null || pos < 0 ? 0 : pos;
});

// Правильное склонение: 1 человек, 2-4 человека, 5+ человек
const peopleWord = computed(() => {
  const n = peopleBefore.value % 100;
  const n10 = n % 10;
  if (n > 10 && n < 20) return 'человек';
  if (n10 === 1) return 'человек';
  if (n10 >= 2 && n10 <= 4) return 'человека';
  return 'человек';
});

// Оценка времени = (людей перед / число окон) * среднее время на клиента
// Окон у нас 2, но если активно только одно — делитель 1
const estimatedMinutes = computed(() => {
  const minutes = Math.max(1, Math.ceil(
    (peopleBefore.value / 2) * props.avgServiceMinutes
  ));
  return minutes;
});
</script>

<style scoped>
.my-ticket {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr auto;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
  background: linear-gradient(135deg, var(--card-bg), var(--mine-bg));
  border-radius: var(--border-radius);
  border-left: 6px solid var(--primary);
  box-shadow: 0 4px 16px rgba(13, 110, 253, 0.12);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 1rem;
}

.my-ticket.processing {
  border-left-color: var(--success);
  box-shadow: 0 4px 24px var(--success-glow);
}
.my-ticket.skipped {
  border-left-color: var(--danger);
}

.status-side {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-width: 0;
}

.ticket-big-id {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1;
  color: var(--primary);
}
.my-ticket.processing .ticket-big-id { color: var(--success); }
.my-ticket.skipped .ticket-big-id { color: var(--danger); }

.status-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.status-label {
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
}
.processing-label {
  color: var(--success);
  /* Лёгкое мигание только текста статуса — не всей карточки */
  animation: blink-text 1.4s ease-in-out infinite;
}
.skipped-label { color: var(--danger); }

@keyframes blink-text {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}

.window-info {
  font-size: 1.2rem;
  font-weight: 600;
}
.status-sub {
  font-size: 0.95rem;
  opacity: 0.75;
}

/* Правая часть — оценка ожидания */
.estimate-side {
  text-align: right;
  border-left: 1px solid var(--border-soft);
  padding-left: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.estimate-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
  margin-bottom: 0.25rem;
}
.estimate-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.btn-leave {
  grid-column: 1 / -1;
  justify-self: start;
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 0.45rem 1rem;
  font-size: 0.9rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.btn-leave:hover:not(:disabled) {
  background-color: var(--danger);
  color: white;
}
.btn-leave:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 700px) {
  .my-ticket { grid-template-columns: 1fr; }
  .status-side { flex-direction: column; align-items: flex-start; text-align: left; }
  .estimate-side {
    border-left: none;
    border-top: 1px solid var(--border-soft);
    padding-left: 0;
    padding-top: 0.75rem;
    text-align: left;
  }
}
</style>
