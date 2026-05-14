/**
 * src/composables/useUserId.js
 *
 * Определяет "личность" вкладки по query-параметру ?user=
 * Это даёт примитивный multi-user без бэка: разные вкладки с разными user
 * видят одну очередь, но у каждой свой набор "Моих талонов".
 *
 * Если параметра нет — генерируем случайный id и сохраняем в sessionStorage,
 * чтобы он жил, пока вкладка открыта.
 */

export function getUserId() {
  // 1) Сначала проверяем URL: ?user=ivan
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('user');
  if (fromUrl) return fromUrl.trim().slice(0, 30);

  // 2) Иначе — берём из sessionStorage или генерируем новый
  let sid = sessionStorage.getItem('queue:userId');
  if (!sid) {
    // Короткий случайный id, например "guest-3kf2"
    sid = 'guest-' + Math.random().toString(36).slice(2, 6);
    sessionStorage.setItem('queue:userId', sid);
  }
  return sid;
}
