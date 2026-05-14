<template>
  <article
    class="ticket-card"
    :class="[ticket.status, { mine: isMine, 'is-next': isNext }]"
    :aria-label="`Талон ${ticket.id}, статус ${statusText}`"
  >
    <div class="ticket-main">
      <div class="ticket-header">
        <!-- ID можно скопировать по клику -->
        <button
          class="ticket-id"
          type="button"
          :title="copied ? 'Скопировано!' : 'Скопировать номер'"
          @click="copyId"
        >
          {{ ticket.id }}
          <span v-if="copied" class="copied-mark">✓</span>
        </button>
        <span v-if="isNext" class="badge badge-next">следующий</span>
        <span v-if="isMine" class="badge badge-mine">Это вы</span>
        <span v-if="ticket.status === 'skipped'" class="badge badge-skipped">
          Пропущен
        </span>
      </div>

      <div v-if="ticket.clientName" class="ticket-name">
        <template v-if="isOperatorView || showFullName">
          <span>{{ ticket.clientName }}</span>
          <button
            v-if="!isOperatorView && showFullName"
            class="name-toggle"
            type="button"
            @click="showFullName = false"
          >
            скрыть
          </button>
        </template>
        <button
          v-else
          class="name-reveal"
          type="button"
          @click="showFullName = true"
        >
          {{ maskedName }} 👁
        </button>
      </div>
    </div>

    <div class="ticket-info">
      <span v-if="ticket.status === 'waiting'">В ожидании</span>
      <span v-else-if="ticket.status === 'skipped'">Будет вызван позднее</span>
      <span v-else-if="ticket.status === 'processing'" class="processing-info">
        Окно <strong class="window-num">№{{ ticket.window }}</strong>
      </span>
      <span v-else>Завершено</span>
    </div>

    <button
      v-if="isMine && (ticket.status === 'waiting' || ticket.status === 'skipped')"
      class="btn-cancel"
      type="button"
      :disabled="isLoading"
      aria-label="Выйти из очереди"
      title="Выйти из очереди"
      @click="$emit('cancel', ticket.id)"
    >
      ✕
    </button>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  ticket: { type: Object, required: true },
  isMine: { type: Boolean, default: false },
  isOperatorView: { type: Boolean, default: false },
  isNext: { type: Boolean, default: false }, // следующий в очереди (пункт 4)
  isLoading: { type: Boolean, default: false },
});

defineEmits(['cancel']);

const showFullName = ref(false);

const maskedName = computed(() => {
  const name = props.ticket.clientName || '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || '';
  const lastInitial = parts[1] ? ` ${parts[1][0]}.` : '';
  if (first.length <= 2) return first + '***' + lastInitial;
  return first.slice(0, 2) + '***' + lastInitial;
});

const statusText = computed(() => ({
  waiting: 'в ожидании',
  processing: `у окна номер ${props.ticket.window}`,
  skipped: 'пропущен',
  done: 'завершён',
}[props.ticket.status]));

// Копирование номера (пункт 5)
const copied = ref(false);
const copyId = async () => {
  try {
    await navigator.clipboard.writeText(props.ticket.id);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* тихо игнорируем */
  }
};
</script>

<style scoped>
.ticket-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 0.7rem 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  border-left: 5px solid transparent;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.ticket-card.waiting { border-left-color: var(--warning); }
.ticket-card.processing {
  border-left-color: var(--success);
  box-shadow: 0 2px 10px var(--success-glow);
}
.ticket-card.skipped { border-left-color: var(--danger); }
.ticket-card.done { border-left-color: gray; opacity: 0.5; }

.ticket-card.mine { background-color: var(--mine-bg); }

/* "следующий" — тонкая акцентная рамка вокруг карточки */
.ticket-card.is-next {
  outline: 2px solid var(--primary);
  outline-offset: -1px;
}

.ticket-main { flex: 1; min-width: 0; }

.ticket-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ticket-id {
  position: relative;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: transparent;
  border: none;
  color: var(--text-color);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.ticket-id:hover { background-color: rgba(0, 0, 0, 0.06); }

.copied-mark {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--success);
  color: white;
  font-size: 0.65rem;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ticket-name {
  margin-top: 0.15rem;
  font-size: 0.85rem;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.name-reveal {
  background: transparent;
  border: 1px dashed var(--text-color);
  color: var(--text-color);
  padding: 0.1rem 0.45rem;
  font-size: 0.8rem;
  opacity: 0.7;
  font-weight: normal;
}
.name-reveal:hover { opacity: 1; border-color: var(--primary); }
.name-toggle {
  background: transparent;
  border: none;
  color: var(--primary);
  padding: 0;
  font-size: 0.75rem;
  font-weight: normal;
  text-decoration: underline;
  opacity: 0.7;
}
.name-toggle:hover { opacity: 1; }

.window-num { font-size: 1.2rem; color: var(--success); }
.processing-info { display: inline-flex; align-items: center; gap: 0.4rem; }

.badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-weight: bold;
  color: white;
}
.badge-mine { background-color: var(--primary); }
.badge-skipped { background-color: var(--danger); }
.badge-next {
  background-color: var(--warning);
  color: #4a3500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: bold;
  flex-shrink: 0;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.btn-cancel:hover:not(:disabled) {
  background-color: var(--danger);
  color: white;
}
.btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
