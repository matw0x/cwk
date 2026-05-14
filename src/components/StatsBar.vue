<template>
  <!-- Компактный блок статистики (пункт 7) -->
  <div class="stats-bar">
    <div class="stat">
      <span class="stat-label">Обслужено</span>
      <span class="stat-value">{{ servedCount }}</span>
    </div>
    <div class="stat">
      <span class="stat-label">В ожидании</span>
      <span class="stat-value">{{ waitingCount }}</span>
    </div>
    <div class="stat">
      <span class="stat-label">У окон</span>
      <span class="stat-value">{{ processingCount }}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Среднее время</span>
      <span class="stat-value">~{{ avgMinutes }} мин</span>
    </div>

    <button
      class="btn-reset"
      type="button"
      :disabled="isLoading"
      title="Очистить очередь (с подтверждением)"
      @click="$emit('reset')"
    >
      🗑 Сбросить
    </button>
  </div>
</template>

<script setup>
defineProps({
  servedCount: { type: Number, default: 0 },
  waitingCount: { type: Number, default: 0 },
  processingCount: { type: Number, default: 0 },
  avgMinutes: { type: Number, default: 3 },
  isLoading: { type: Boolean, default: false },
});

defineEmits(['reset']);
</script>

<style scoped>
.stats-bar {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--border-radius);
  padding: 0.6rem 1rem;
  margin-bottom: 0.75rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}
.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.6;
}
.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary);
}

.btn-reset {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.btn-reset:hover:not(:disabled) {
  background: var(--danger);
  color: white;
}
.btn-reset:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 600px) {
  .stats-bar { gap: 0.75rem; padding: 0.5rem 0.75rem; }
  .stat-value { font-size: 0.95rem; }
  .btn-reset { margin-left: 0; }
}
</style>
