/**
 * src/composables/useQueue.js
 *
 * Бизнес-логика очереди. Связывает асинхронный mockApi с реактивным
 * состоянием Vue. Подписана на внешние изменения mockApi.
 */
import { ref, computed, readonly, onMounted, onUnmounted } from 'vue';
import { mockApi } from '../api/mockBackend.js';

export function useQueue() {
  // === Состояние ===
  const tickets = ref([]);
  const isLoading = ref(false);
  const isInitialLoad = ref(true);
  const errorMsg = ref(null);

  // === Computed ===
  // Сортируем по timestamp, чтобы порядок был стабильным
  const sortedWaiting = computed(() =>
    [...tickets.value]
      .filter((t) => t.status === 'waiting' || t.status === 'skipped')
      .sort((a, b) => a.timestamp - b.timestamp)
  );

  const waitingTickets = sortedWaiting; // алиас для совместимости с шаблонами

  const processingTickets = computed(() =>
    tickets.value.filter((t) => t.status === 'processing')
  );

  // === Хелпер для async-операций ===
  const runAction = async (fn) => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await fn();
    } catch (e) {
      errorMsg.value = e?.message || 'Произошла непредвиденная ошибка';
      console.error(e);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // === Действия ===
  const loadTickets = async (silent = false) => {
    if (!silent) isInitialLoad.value = true;
    await runAction(async () => {
      tickets.value = await mockApi.getTickets();
    });
    isInitialLoad.value = false;
  };

  // takeTicket теперь принимает ownerId — это id пользователя из ?user=
  const takeTicket = async (clientName = '', ownerId = null) => {
    return runAction(async () => {
      const newTicket = await mockApi.addTicket(clientName, ownerId);
      tickets.value.push(newTicket);
      return newTicket;
    });
  };

  const cancelTicket = async (id) => {
    return runAction(async () => {
      const result = await mockApi.cancelTicket(id);
      if (result.error) {
        errorMsg.value = result.error;
        return false;
      }
      tickets.value = tickets.value.filter((t) => t.id !== id);
      return true;
    });
  };

  const callNextClient = async (windowNum) => {
    return runAction(async () => {
      const result = await mockApi.callNext(windowNum);
      if (result.error) {
        errorMsg.value = result.error;
        return;
      }
      const index = tickets.value.findIndex((t) => t.id === result.data.id);
      if (index !== -1) tickets.value[index] = result.data;
    });
  };

  const skipTicket = async (id) => {
    return runAction(async () => {
      const result = await mockApi.skipTicket(id);
      if (result.error) {
        errorMsg.value = result.error;
        return;
      }
      const index = tickets.value.findIndex((t) => t.id === id);
      if (index !== -1) tickets.value[index] = result.data;
    });
  };

  const finishTicket = async (id) => {
    return runAction(async () => {
      await mockApi.completeTicket(id);
      const index = tickets.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tickets.value[index] = { ...tickets.value[index], status: 'done' };
      }
    });
  };

  const clearError = () => {
    errorMsg.value = null;
  };

  // === Кросс-табная синхронизация ===
  let unsubscribe = null;
  onMounted(() => {
    unsubscribe = mockApi.onExternalChange(() => {
      loadTickets(true);
    });
  });
  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });

  return {
    tickets: readonly(tickets),
    waitingTickets,
    processingTickets,
    isLoading: readonly(isLoading),
    isInitialLoad: readonly(isInitialLoad),
    errorMsg: readonly(errorMsg),

    loadTickets,
    takeTicket,
    cancelTicket,
    callNextClient,
    skipTicket,
    finishTicket,
    clearError,
  };
}
