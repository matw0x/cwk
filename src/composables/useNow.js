/**
 * src/composables/useNow.js
 *
 * Возвращает реактивный ref с текущим timestamp, обновляется раз в секунду.
 * Нужен для "вы в очереди уже 4:32" — вычисляемое выражение само пересчитается
 * при каждом тике.
 */
import { ref, onMounted, onUnmounted } from 'vue';

export function useNow(intervalMs = 1000) {
  const now = ref(Date.now());
  let intervalId = null;

  onMounted(() => {
    intervalId = setInterval(() => {
      now.value = Date.now();
    }, intervalMs);
  });
  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return now;
}
