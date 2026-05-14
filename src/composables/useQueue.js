/**
 * src/composables/useQueue.js
 *
 * Бизнес-логика очереди.
 */
import { ref, computed, readonly, onMounted, onUnmounted } from 'vue';
import { mockApi } from '../api/mockBackend.js';

export function useQueue() {
  const tickets = ref([]);
  const isLoading = ref(false);
  const isInitialLoad = ref(true);
  const errorMsg = ref(null);
  const servedCount = ref(0); // обслужено всего (для статистики)

  const waitingTickets = computed(() =>
    [...tickets.value]
      .filter((t) => t.status === 'waiting' || t.status === 'skipped')
      .sort((a, b) => a.timestamp - b.timestamp)
  );

  const processingTickets = computed(() =>
    tickets.value.filter((t) => t.status === 'processing')
  );

  // Среднее время обслуживания (по завершённым талонам)
  // Замер: timestamp при создании vs Date.now() при завершении — приблизительно.
  // Для демо достаточно, для реальной системы нужно хранить отдельные time-stamps.
  const avgServiceMinutes = computed(() => {
    const done = tickets.value.filter((t) => t.status === 'done');
    if (done.length === 0) return 3; // дефолт
    // Очень грубая оценка: время от взятия до сейчас, делим пополам
    // (это для UI-демо, не для аналитики)
    const total = done.reduce((sum, t) => sum + (Date.now() - t.timestamp), 0);
    const avgMs = total / done.length;
    return Math.max(1, Math.round(avgMs / 60000 / 2));
  });

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

  const loadTickets = async (silent = false) => {
    if (!silent) isInitialLoad.value = true;
    await runAction(async () => {
      tickets.value = await mockApi.getTickets();
      servedCount.value = mockApi.getServedCount();
    });
    isInitialLoad.value = false;
  };

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
      servedCount.value = mockApi.getServedCount();
    });
  };

  const resetAll = async () => {
    return runAction(async () => {
      await mockApi.resetAll();
      tickets.value = [];
      servedCount.value = 0;
    });
  };

  const clearError = () => {
    errorMsg.value = null;
  };

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
    servedCount: readonly(servedCount),
    avgServiceMinutes,
    isLoading: readonly(isLoading),
    isInitialLoad: readonly(isInitialLoad),
    errorMsg: readonly(errorMsg),

    loadTickets,
    takeTicket,
    cancelTicket,
    callNextClient,
    skipTicket,
    finishTicket,
    resetAll,
    clearError,
  };
}
