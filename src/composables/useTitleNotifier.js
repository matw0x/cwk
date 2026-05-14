/**
 * src/composables/useTitleNotifier.js
 *
 * Мигает document.title, пока вкладка неактивна. Возвращает функцию notify(text).
 * Когда пользователь возвращается на вкладку — title восстанавливается.
 */
import { onMounted, onUnmounted } from 'vue';

export function useTitleNotifier() {
  const originalTitle = document.title;
  let intervalId = null;
  let toggled = false;

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    document.title = originalTitle;
    toggled = false;
  };

  const notify = (text) => {
    if (!document.hidden) return; // вкладка активна — не мигаем
    if (intervalId) return; // уже мигаем

    intervalId = setInterval(() => {
      toggled = !toggled;
      document.title = toggled ? text : originalTitle;
    }, 1000);
  };

  // Когда вкладка снова в фокусе — прекращаем мигать
  const onVisibilityChange = () => {
    if (!document.hidden) stop();
  };

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
  });
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    stop();
  });

  return { notify, stop };
}
