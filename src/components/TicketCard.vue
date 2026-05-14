<template>
  <article
    class="ticket-card"
    :class="[ticket.status, { mine: isMine }]"
    :aria-label="`Талон ${ticket.id}, статус ${statusText}`"
  >
    <div class="ticket-main">
      <div class="ticket-header">
        <span class="ticket-id">{{ ticket.id }}</span>
        <span v-if="isMine" class="badge badge-mine">Это вы</span>
        <span v-if="ticket.status === 'skipped'" class="badge badge-skipped">
          Пропущен
        </span>
      </div>

      <!-- Имя клиента -->
      <div v-if="ticket.clientName" class="ticket-name">
        <template v-if="isOperatorView || showFullName">
          <span>{{ ticket.clientName }}</span>
          <!-- Кнопка "свернуть" — только для клиентского режима -->
          <button
            v-if="!isOperatorView && showFullName"
            class="name-toggle"
            type="button"
            aria-label="Скрыть имя"
            @click="showFullName = false"
          >
            скрыть
          </button>
        </template>
        <button
          v-else
          class="name-reveal"
          type="button"
          aria-label="Показать имя полностью"
          @click="showFullName = true"
        >
          {{ maskedName }} 👁
        </button>
      </div>
    </div>

    <div class="ticket-info">
      <span v-if="ticket.status === 'waiting'">В ожидании</span>
      <span v-else-if="ticket.status === 'skipped'">Ожидает повторного вызова</span>
      <span v-else-if="ticket.status === 'processing'" class="processing-info">
        Окно <strong class="window-num">№{{ ticket.window }}</strong>
      </span>
      <span v-else>Завершено</span>
    </div>

    <!-- Кнопка "выйти из очереди": только для своих ожидающих/пропущенных талонов -->
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
  isOperatorView: { type: Boolean, default: false }, // оператор видит имя без маски
  isLoading: { type: Boolean, default: false },
});

defineEmits(['cancel']);

// Локальное состояние: раскрыто ли имя
const showFullName = ref(false);

// Маска для имени: "Иван Иванов" → "Ив*** И."
const maskedName = computed(() => {
  const name = props.ticket.clientName || '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || '';
  const lastInitial = parts[1] ? ` ${parts[1][0]}.` : '';
  if (first.length <= 2) return first + '***' + lastInitial;
  return first.slice(0, 2) + '***' + lastInitial;
});

const statusText = computed(() => {
  return {
    waiting: 'в ожидании',
    processing: `у окна номер ${props.ticket.window}`,
    skipped: 'пропущен',
    done: 'завершён',
  }[props.ticket.status];
});
</script>

<style scoped>
.ticket-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-left: 6px solid transparent;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.ticket-card.waiting { border-left-color: var(--warning); }
.ticket-card.processing {
  border-left-color: var(--success);
  /* Мягкое свечение вместо пульсации — никаких "тряслок" */
  box-shadow: 0 2px 12px var(--success-glow);
}
.ticket-card.skipped { border-left-color: var(--danger); }
.ticket-card.done { border-left-color: gray; opacity: 0.5; }

/* Подсветка "своего" талона */
.ticket-card.mine {
  background-color: var(--mine-bg);
}

.ticket-main { flex: 1; min-width: 0; }

.ticket-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.ticket-id {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.ticket-name {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

/* Кнопка раскрытия имени */
.name-reveal {
  background: transparent;
  border: 1px dashed var(--text-color);
  color: var(--text-color);
  padding: 0.15rem 0.5rem;
  font-size: 0.85rem;
  opacity: 0.7;
  font-weight: normal;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}
.name-reveal:hover { opacity: 1; border-color: var(--primary); }

/* Кнопка "скрыть имя" */
.name-toggle {
  background: transparent;
  border: none;
  color: var(--primary);
  padding: 0;
  font-size: 0.8rem;
  font-weight: normal;
  text-decoration: underline;
  opacity: 0.7;
}
.name-toggle:hover { opacity: 1; }

.window-num {
  font-size: 1.4rem;
  color: var(--success);
}

.processing-info {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 12px;
  font-weight: bold;
  color: white;
}
.badge-mine { background-color: var(--primary); }
.badge-skipped { background-color: var(--danger); }

/* Кнопка выхода из очереди */
.btn-cancel {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
  font-size: 1rem;
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
