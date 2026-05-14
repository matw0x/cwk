<template>
  <div class="admin-panel" :class="{ 'has-client': currentTicket }">
    <header class="panel-head">
      <h3>
        Окно №{{ windowId }}
        <kbd v-if="callKey" class="hotkey" :title="`Хоткей: ${callKey}`">{{ callKey }}</kbd>
      </h3>
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

    <Transition name="fade-up">
      <div v-if="currentTicket" class="active-ticket">
        <div class="active-info">
          <span class="active-label">Клиент:</span>
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
            title="Клиент не подошёл — отложить на потом"
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
            <kbd v-if="finishKey" class="hotkey-inline">{{ finishKey }}</kbd>
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
  callKey: { type: String, default: '' },   // подсказка хоткея для вызова
  finishKey: { type: String, default: '' }, // и для завершения
});

defineEmits(['call-next', 'skip', 'finish']);
</script>

<style scoped>
.admin-panel {
  background: var(--card-bg);
  padding: 0.9rem 1rem;
  border-radius: var(--border-radius);
  border-top: 3px solid var(--border-soft);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.admin-panel.has-client {
  border-top-color: var(--success);
  box-shadow: 0 3px 12px var(--success-glow);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}
.panel-head h3 {
  margin: 0;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Подсказка хоткея */
.hotkey {
  display: inline-block;
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  background: var(--column-bg);
  border: 1px solid var(--border-soft);
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  opacity: 0.7;
}
.hotkey-inline {
  margin-left: 0.4rem;
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  padding: 0.05rem 0.3rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}
.status-dot.free { background: var(--warning); }
.status-dot.busy {
  background: var(--success);
  box-shadow: 0 0 0 3px var(--success-glow);
}

.btn-call {
  width: 100%;
  background-color: var(--primary);
  color: white;
  padding: 0.6rem;
  font-size: 0.95rem;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.btn-call:hover:not(:disabled) { background-color: var(--primary-hover); }
.btn-call:active:not(:disabled) { transform: scale(0.98); }
.btn-call:disabled { opacity: 0.5; cursor: not-allowed; }

.active-ticket {
  margin-top: 0.7rem;
  padding: 0.6rem;
  background: var(--column-bg);
  border-radius: 6px;
}

.active-info {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
}
.active-label { opacity: 0.7; font-size: 0.85rem; }
.active-id { font-size: 1.35rem; color: var(--success); }
.active-name { font-size: 0.9rem; opacity: 0.85; }

.action-row {
  display: flex;
  gap: 0.4rem;
}
.btn-skip, .btn-finish {
  flex: 1;
  padding: 0.45rem;
  font-size: 0.85rem;
  transition: transform 0.1s ease;
}
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
  margin-top: 0.7rem;
  padding: 0.6rem;
  opacity: 0.5;
  font-style: italic;
  font-size: 0.9rem;
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-up-enter-from, .fade-up-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
