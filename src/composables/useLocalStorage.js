/**
 * src/composables/useLocalStorage.js
 *
 * Маленький хелпер: возвращает реактивный ref, который сам синхронизируется
 * с localStorage. Нужен для "Моих талонов", темы и режима просмотра.
 */
import { ref, watch } from 'vue';

export function useLocalStorage(key, defaultValue) {
  // Пробуем прочитать сохранённое значение
  let initial = defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) initial = JSON.parse(raw);
  } catch (e) {
    // Если в storage битый JSON — просто используем дефолт
    console.warn(`localStorage: не удалось прочитать "${key}"`, e);
  }

  const state = ref(initial);

  // При любом изменении — пишем обратно в storage
  watch(
    state,
    (val) => {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {
        console.warn(`localStorage: не удалось записать "${key}"`, e);
      }
    },
    { deep: true }
  );

  return state;
}
