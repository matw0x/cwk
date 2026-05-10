/**
 * src/composables/useQueue.js
 * * Модуль бизнес-логики приложения. Связывает сырые асинхронные данные из mockApi
 * с реактивной системой Vue.
 */
import { ref, computed, readonly } from 'vue';
import { mockApi } from '../api/mockBackend.js';

export function useQueue() {
    // === СОСТОЯНИЕ (STATE) ===
    // ref() делает переменную реактивной. Аналог умного указателя, 
    // к значению которого нужно обращаться через .value
    const tickets = ref([]); 
    const isLoading = ref(false); // Флаг загрузки (для показа лоадеров в UI)
    const errorMsg = ref(null);

    // === ВЫЧИСЛЯЕМЫЕ СВОЙСТВА (COMPUTED) ===
    // computed() - это кэшируемые геттеры. Они автоматически пересчитываются,
    // ТОЛЬКО если изменился массив tickets. Это очень сильно экономит ресурсы.
    const waitingTickets = computed(() => 
        tickets.value.filter(t => t.status === 'waiting')
    );
    
    const processingTickets = computed(() => 
        tickets.value.filter(t => t.status === 'processing')
    );

    // === МЕТОДЫ (ACTIONS) ===
    const loadTickets = async () => {
        isLoading.value = true;
        tickets.value = await mockApi.getTickets();
        isLoading.value = false;
    };

    const takeTicket = async () => {
        isLoading.value = true;
        errorMsg.value = null;
        
        const newTicket = await mockApi.addTicket();
        tickets.value.push(newTicket); // UI обновится автоматически!
        
        isLoading.value = false;
        return newTicket
    };

    const callNextClient = async (windowNum) => {
        isLoading.value = true;
        errorMsg.value = null;
        
        const result = await mockApi.callNext(windowNum);
        
        if (result.error) {
            errorMsg.value = result.error;
        } else {
            // Находим талон в нашем локальном реактивном массиве и обновляем его
            const index = tickets.value.findIndex(t => t.id === result.data.id);
            if (index !== -1) {
                tickets.value[index] = result.data;
            }
        }
        isLoading.value = false;
    };

    const finishTicket = async (id) => {
        isLoading.value = true;
        await mockApi.completeTicket(id);
        
        const index = tickets.value.findIndex(t => t.id === id);
        if (index !== -1) {
            tickets.value[index].status = 'done';
        }
        isLoading.value = false;
    };

    // Очистка ошибки (для UI крестика)
    const clearError = () => {
        errorMsg.value = null;
    };

    // === ЭКСПОРТ ===
    // Возвращаем наружу только то, что нужно компонентам (Инкапсуляция).
    return {
        // readonly() - оборачиваем массивы, чтобы визуальные компоненты 
        // могли их только читать, но не могли напрямую делать .push() (как const в C++).
        // Все изменения должны идти строго через методы ниже.
        tickets: readonly(tickets),
        waitingTickets,
        processingTickets,
        isLoading: readonly(isLoading),
        errorMsg: readonly(errorMsg),

        loadTickets,
        takeTicket,
        callNextClient,
        finishTicket,
        clearError
    };
}