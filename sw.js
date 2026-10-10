/* Service worker de SERVY — reescrito el 09/10/2026.
 *
 * El problema que vino a resolver. Andrés arregló un problema en el navegador
 * del celular el 07/10 y en la webapp instalada lo seguía viendo dos días
 * después, cerrándola y abriéndola varias veces. El service worker anterior
 * (`servy-v4`) ya era network-first, así que debería haber traído lo último;
 * lo que queda pegado es el service worker en sí: el navegador instala uno
 * nuevo solo cuando el ARCHIVO cambia, y si el teléfono se quedó con una
 * versión vieja (antes de la v3 era cache-first), sigue sirviendo esa para
 * siempre. El historial lo muestra: tres commits distintos subiendo el
 * número de versión a mano para forzar la actualización.
 *
 * Qué cambia acá, además de forzar una instalación nueva:
 *
 * 1. Solo se interceptan las PÁGINAS. El anterior pasaba por el caché cada
 *    GET, incluidas las llamadas a la base y a los webhooks, y cuando la red
 *    fallaba podía devolver una respuesta vieja de la API como si fuera
 *    buena. El CSS y el JS no lo necesitan: ya van con la versión en el link.
 * 2. No se precachea nada por adelantado. El precache anterior guardaba
 *    `/home-v2.css` y `/home-v2.js` sin versión, que es justo la copia que
 *    conviene no tener.
 * 3. Cuando entra una versión nueva, la página se recarga sola una vez
 *    (el registro está en home-v2.js). Así este es el último arreglo que
 *    necesita que alguien reinstale la webapp a mano.
 *
 * Lo que sigue igual: sin internet, la webapp abre con la última copia de la
 * página que se visitó.
 */

const CACHE = "servy-paginas-v5";

self.addEventListener("install", () => {
  // Sin esperar a que se cierren las pestañas viejas: si no, un arreglo
  // urgente tarda días en llegar a una webapp que nunca se cierra del todo.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Solo las páginas. Todo lo demás sigue de largo, sin pasar por acá.
  if (req.method !== "GET" || req.mode !== "navigate") return;

  e.respondWith((async () => {
    try {
      const fresca = await fetch(req);
      if (fresca && fresca.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresca.clone()).catch(() => {});
      }
      return fresca;
    } catch {
      const guardada = await caches.match(req);
      if (guardada) return guardada;
      const inicio = await caches.match("index.html");
      if (inicio) return inicio;
      throw new Error("sin red y sin copia guardada");
    }
  })());
});
