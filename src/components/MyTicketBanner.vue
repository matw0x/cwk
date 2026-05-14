<template>
  <article class="my-ticket" :class="ticket.status">
    <div class="status-side">
      <!-- Клик по номеру = копирование в буфер (пункт 5) -->
      <button
        class="ticket-big-id"
        type="button"
        :title="copied ? 'Скопировано!' : 'Нажмите, чтобы скопировать'"
        @click="copyId"
      >
        {{ ticket.id }}
        <span v-if="copied" class="copied-badge">✓</span>
      </button>

      <div class="status-text">
        <template v-if="ticket.status === 'processing'">
          <span class="status-label processing-label">ВАС ВЫЗЫВАЮТ</span>
          <span class="window-info">К окну №{{ ticket.window }}</span>
        </template>
        <template v-else-if="ticket.status === 'skipped'">
          <span class="status-label skipped-label">Вы пропущены</span>
          <span class="status-sub">Вас вызовут позднее</span>
        </template>
        <template v-else>
          <span class="status-label">В очереди</span>
          <span class="status-sub">
            <template v-if="peopleBefore === 0">
              Вы следующий
            </template>
            <template v-else>
              Перед вами: <strong>{{ peopleBefore }}</strong> {{ peopleWord }}
            </template>
            <span class="dot-sep">•</span>
            ждёте: <strong>{{ waitedTime }}</strong>
          </span>
        </template>
      </div>
    </div>

    <div v-if="ticket.status === 'waiting'" class="estimate-side">
      <div class="estimate-label">Примерно</div>
      <div class="estimate-value">
        <span v-if="peopleBefore === 0">сейчас</span>
        <span v-else>~{{ estimatedMinutes }} мин</span>
      </div>
    </div>

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
import { computed, ref } from 'vue';
import { useNow } from '../composables/useNow';

const props = defineProps({
  ticket: { type: Object, required: true },
  waitingList: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  avgServiceMinutes: { type: Number, default: 3 },
});

defineEmits(['cancel']);

// Реактивный "сейчас" — обновляется раз в секунду
const now = useNow();

// Позиция в очереди и склонение
const positionInQueue = computed(() => {
  if (props.ticket.status !== 'waiting') return null;
  return props.waitingList.findIndex((t) => t.id === props.ticket.id);
});
const peopleBefore = computed(() => {
  const pos = positionInQueue.value;
  return pos === null || pos < 0 ? 0 : pos;
});
const peopleWord = computed(() => {
  const n = peopleBefore.value % 100;
  const n10 = n % 10;
  if (n > 10 && n < 20) return 'человек';
  if (n10 === 1) return 'человек';
  if (n10 >= 2 && n10 <= 4) return 'человека';
  return 'человек';
});
const estimatedMinutes = computed(() =>
  Math.max(1, Math.ceil((peopleBefore.value / 2) * props.avgServiceMinutes))
);

// Сколько времени уже ждёт (mm:ss)
const waitedTime = computed(() => {
  const sec = Math.max(0, Math.floor((now.value - props.ticket.timestamp) / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
});

// Копирование номера в буфер (пункт 5)
const copied = ref(false);
const copyId = async () => {
  try {
    await navigator.clipboard.writeText(props.ticket.id);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // Если clipboard API недоступен — тихо игнорируем
  }
};
</script>

<style scoped>
.my-ticket {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr auto;
  gap: 0.75rem 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--card-bg), var(--mine-bg));
  border-radius: var(--border-radius);
  border-left: 5px solid var(--primary);
  box-shadow: 0 3px 12px rgba(13, 110, 253, 0.1);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 0.75rem;
}
.my-ticket.processing {
  border-left-color: var(--success);
  box-shadow: 0 4px 18px var(--success-glow);
}
.my-ticket.skipped { border-left-color: var(--danger); }

.status-side {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

/* Кнопка-номер: убираем стандартные стили кнопки */
.ticket-big-id {
  position: relative;
  font-size: 2.3rem;
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1;
  color: var(--primary);
  background: transparent;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.ticket-big-id:hover { background-color: rgba(0, 0, 0, 0.05); }
.my-ticket.processing .ticket-big-id { color: var(--success); }
.my-ticket.skipped .ticket-big-id { color: var(--danger); }

/* Бейдж "скопировано" */
.copied-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--success);
  color: white;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.status-label {
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.9;
}
.processing-label {
  color: var(--success);
  animation: blink-text 1.4s ease-in-out infinite;
}
.skipped-label { color: var(--danger); }
@keyframes blink-text {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}

.window-info { font-size: 1.1rem; font-weight: 600; }
.status-sub { font-size: 0.85rem; opacity: 0.75; }
.dot-sep { margin: 0 0.35rem; opacity: 0.4; }

.estimate-side {
  text-align: right;
  border-left: 1px solid var(--border-soft);
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.estimate-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
}
.estimate-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary);
}

.btn-leave {
  grid-column: 1 / -1;
  justify-self: start;
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 0.3rem 0.85rem;
  font-size: 0.85rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.btn-leave:hover:not(:disabled) {
  background-color: var(--danger);
  color: white;
}
.btn-leave:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 700px) {
  .my-ticket { grid-template-columns: 1fr; }
  .status-side { flex-direction: column; align-items: flex-start; }
  .estimate-side {
    border-left: none;
    border-top: 1px solid var(--border-soft);
    padding-left: 0;
    padding-top: 0.5rem;
    text-align: left;
  }
}
</style>
