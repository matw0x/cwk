<template>
  <div class="admin-panel" :class="{ 'has-client': currentTicket }">
    <header class="panel-head">
      <h3>Окно №{{ windowId }}</h3>
      <span class="status-dot" :class="currentTicket ? 'busy' : 'free'"></span>
    </header>

    <button
      class="btn-call"
      type="button"
      :disabled="isLoading || !!currentTicket || waitingCount === 0"
      @click="$emit('call-next', windowId)"
    >
      <span v-if="!currentTicket">Вызвать следующего</span>
      <span v-else>Окно занято</span>
    </button>

    <!-- Текущий клиент -->
    <Transition name="fade-up">
      <div v-if="currentTicket" class="active-ticket">
        <div class="active-info">
          <span class="active-label">Текущий клиент:</span>
          <strong class="active-id">{{ currentTicket.id }}</strong>
          <span v-if="currentTicket.clientName" class="active-name">
            {{ currentTicket.clientName }}
          </span>
        </div>

        <div class="action-row">
          <button
            class="btn-skip"
            type="button"
            :disabled="isLoading"
            title="Клиент не подошёл — вернуть в начало очереди"
            @click="$emit('skip', currentTicket.id)"
          >
            Не пришёл
          </button>
          <button
            class="btn-finish"
            type="button"
            :disabled="isLoading"
            @click="$emit('finish', currentTicket.id)"
          >
            Завершить ✓
          </button>
        </div>
      </div>
      <div v-else class="empty-state">
        <span>Свободно</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
defineProps({
  windowId: { type: Number, required: true },
  currentTicket: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
  waitingCount: { type: Number, default: 0 },
});

defineEmits(['call-next', 'skip', 'finish']);
</script>

<style scoped>
.admin-panel {
  background: var(--card-bg);
  padding: 1.25rem;
  border-radius: var(--border-radius);
  border-top: 4px solid var(--border-soft);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.admin-panel.has-client {
  border-top-color: var(--success);
  box-shadow: 0 4px 16px var(--success-glow);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.panel-head h3 { margin: 0; }

/* Индикатор статуса окна — статичный, без пульсации */
.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}
.status-dot.free { background: var(--warning); }
.status-dot.busy {
  background: var(--success);
  box-shadow: 0 0 0 4px var(--success-glow);
}

.btn-call {
  width: 100%;
  background-color: var(--primary);
  color: white;
  padding: 0.75rem;
  font-size: 1rem;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.btn-call:hover:not(:disabled) { background-color: var(--primary-hover); }
.btn-call:active:not(:disabled) { transform: scale(0.98); }
.btn-call:disabled { opacity: 0.5; cursor: not-allowed; }

.active-ticket {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--column-bg);
  border-radius: var(--border-radius);
}

.active-info {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.active-label { opacity: 0.7; font-size: 0.9rem; }
.active-id { font-size: 1.6rem; color: var(--success); }
.active-name { font-size: 0.95rem; opacity: 0.85; }

.action-row {
  display: flex;
  gap: 0.5rem;
}
.btn-skip, .btn-finish { flex: 1; padding: 0.55rem; transition: transform 0.1s ease; }
.btn-skip {
  background-color: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
}
.btn-skip:hover:not(:disabled) { background-color: var(--danger); color: white; }
.btn-finish { background-color: var(--success); color: white; }
.btn-finish:hover:not(:disabled) { filter: brightness(1.08); }
.btn-skip:active:not(:disabled),
.btn-finish:active:not(:disabled) { transform: scale(0.97); }
button:disabled { opacity: 0.55; cursor: not-allowed; }

.empty-state {
  text-align: center;
  margin-top: 1rem;
  padding: 1rem;
  opacity: 0.5;
  font-style: italic;
}

/* Плавное появление блока с клиентом */
.fade-up-enter-active, .fade-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-up-enter-from, .fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
