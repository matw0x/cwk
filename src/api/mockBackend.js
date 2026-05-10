/**
 * src/api/mockBackend.js
 * * Это наша "заглушка" бэкенда. Она хранит данные в оперативной памяти (в массиве)
 * и имитирует сетевые задержки, чтобы удовлетворить требование "работа с асинхронностью".
 */

// Имитация базы данных (private стейт)
let tickets = [];
let ticketCounter = 1;

// Утилита для имитации сетевой задержки.
// Возвращает Promise, который "выполнится" (resolve) через ms миллисекунд.
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
    // Получить весь список талонов
    async getTickets() {
        await delay(300); // Ждем 300мс
        // Возвращаем КОПИЮ массива [...tickets], а не ссылку на него. 
        // Это гарантия иммутабельности (защита от случайных изменений извне).
        return [...tickets]; 
    },

    // Создать новый талон (действие клиента)
    async addTicket() {
        await delay(500); // Генерация талона занимает время
        
        const newTicket = {
            id: `A-${ticketCounter++}`, // Формируем ID, например "A-1", "A-2"
            status: 'waiting',          // Возможные статусы: 'waiting', 'processing', 'done'
            window: null,               // Номер окна (пока не назначен)
            timestamp: Date.now()       // Временная метка для сортировки
        };
        
        tickets.push(newTicket);
        // Снова возвращаем копию объекта (через spread-оператор {...}), чтобы соблюсти инкапсуляцию
        return { ...newTicket };
    },

    // Вызвать следующего клиента к окну (действие оператора)
    async callNext(windowNumber) {
        await delay(400);
        
        // Ищем первый попавшийся талон со статусом 'waiting'
        const nextTicket = tickets.find(t => t.status === 'waiting');
        
        if (!nextTicket) {
            // Современный паттерн возврата ошибок (похоже на std::expected в C++23)
            // Возвращаем объект ошибки, вместо того чтобы кидать throw (исключение)
            return { error: 'Очередь пуста, некого вызывать' };
        }

        // Обновляем статус
        nextTicket.status = 'processing';
        nextTicket.window = windowNumber;
        
        return { data: { ...nextTicket } };
    },

    // Завершить обслуживание талона (действие оператора)
    async completeTicket(id) {
        await delay(200);
        const ticket = tickets.find(t => t.id === id);
        if (ticket) {
            ticket.status = 'done';
        }
        return { success: true };
    }
};