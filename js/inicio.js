// inicio.js — lo primero que corre (va en el <head>, sin código "en línea",
// para que la política de seguridad CSP de index.html pueda prohibirlo).
//
// 1) La app no se deja abrir dentro de otra página (un "marco"/iframe): es un
//    truco para hacer que alguien toque botones sin darse cuenta.
// 2) Registra el service worker (sw.js).
(function () {
  if (window.top !== window.self) {
    try { window.top.location.replace(window.self.location.href); }
    catch (e) { document.documentElement.style.display = 'none'; }
    return;
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
