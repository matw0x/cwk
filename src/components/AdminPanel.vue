<template>
  <div class="admin-panel">
    <h3>Управление (Окно №{{ windowId }})</h3>
    
    <div class="controls">
      <button 
        class="btn-call" 
        @click="$emit('call-next', windowId)" 
        :disabled="isLoading || currentTicket"
      >
        Вызвать следующего
      </button>

      <div v-if="currentTicket" class="active-ticket">
        <span>Текущий клиент: <strong>{{ currentTicket.id }}</strong></span>
        <button 
          class="btn-finish" 
          @click="$emit('finish', currentTicket.id)" 
          :disabled="isLoading"
        >
          Завершить
        </button>
      </div>
      <div v-else class="empty-state">Свободно</div>
    </div>
  </div>
</template>

<script setup>
// defineProps - входящие данные. defineEmits - исходящие события.
defineProps({
  windowId: { type: Number, required: true },
  currentTicket: { type: Object, default: null },
  isLoading: { type: Boolean, default: false }
});

defineEmits(['call-next', 'finish']);
</script>

<style scoped>
.admin-panel {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  border-top: 4px solid var(--primary);
  margin-top: 1rem;
}
.controls { display: flex; flex-direction: column; gap: 1rem; }
.btn-call { background-color: var(--primary); color: white; }
.btn-finish { background-color: var(--success); color: white; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.active-ticket { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
</style>