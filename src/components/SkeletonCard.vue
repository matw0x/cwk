<template>
  <!-- Серая карточка-заглушка, имитирующая структуру TicketCard.
       Показывается во время первой загрузки данных (UX-требование 3.3). -->
  <div class="skeleton-card" aria-hidden="true">
    <div class="skeleton-line skeleton-id"></div>
    <div class="skeleton-line skeleton-info"></div>
  </div>
</template>

<style scoped>
.skeleton-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  border-left: 6px solid var(--skeleton-bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-height: 56px;
}

.skeleton-line {
  height: 1.2rem;
  background: linear-gradient(
    90deg,
    var(--skeleton-bg) 0%,
    var(--skeleton-shine) 50%,
    var(--skeleton-bg) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  /* "Мерцающая" анимация */
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-id { width: 60px; height: 1.8rem; }
.skeleton-info { width: 100px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
