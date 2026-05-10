<template>
  <div class="ticket-card" :class="ticket.status">
    <div class="ticket-header">
      <span class="ticket-id">{{ ticket.id }}</span>
      <span v-if="isMine" class="badge">Это вы</span>
    </div>
    <div class="ticket-info">
      <span v-if="ticket.status === 'waiting'">В ожидании</span>
      <span v-else-if="ticket.status === 'processing'">
        Окно: <strong class="window-num">{{ ticket.window }}</strong>
      </span>
      <span v-else>Завершено</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  ticket: {
    type: Object,
    required: true
  },
  isMine: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.ticket-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 6px solid transparent;
}

.ticket-card.waiting { border-left-color: var(--warning); }
.ticket-card.processing { border-left-color: var(--success); }
.ticket-card.done { border-left-color: gray; opacity: 0.5; }

.ticket-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ticket-id { 
  font-size: 2rem; 
  font-weight: 800; 
}

.window-num {
  font-size: 1.5rem;
  color: var(--success);
}

.badge {
  font-size: 0.8rem;
  background-color: var(--primary);
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-weight: bold;
}
</style>