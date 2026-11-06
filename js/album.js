// album.js — 📒 "Mi álbum de stickers": por cada día con el parche puesto, Mili
// gana el sticker de un personaje. Los que faltan se ven como sombra (¿quién
// será?). Cuando completa el álbum, los días siguientes le dan stickers
// dorados. Sale de los registros que ya existen (no guarda nada aparte).

const Album = (function () {
  const $ = (id) => document.getElementById(id);

  // orden fijo de los stickers: primero Mili, después todos mezclados siempre igual
  function orden() {
    const ids = Juego.personajes().map((p) => p.id).filter((id) => id !== 'mili');
    let s = 20260924;
    const azar = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ['mili', ...ids];
  }

  // cuántos stickers tiene (un día con parche = un sticker) y si hoy ganó uno
  function estado(entries) {
    const dias = Object.keys(entries).length;
    return { dias, hoy: !!entries[Utils.todayId()] };
  }

  function texto(entries) {
    const { dias } = estado(entries), total = orden().length;
    return dias >= total ? `¡Álbum completo! ⭐ ${dias - total} dorados` : `${dias} de ${total} stickers`;
  }

  function abrir(entries) {
    const ids = orden(), nombres = {};
    Juego.personajes().forEach((p) => { nombres[p.id] = p.nombre; });
    const { dias, hoy } = estado(entries), total = ids.length;
    const dorados = Math.max(0, dias - total);
    $('albumResumen').textContent = dias >= total
      ? `¡Completaste el álbum! Llevas ${dorados} sticker${dorados === 1 ? '' : 's'} dorado${dorados === 1 ? '' : 's'} ⭐`
      : `Tienes ${dias} de ${total} stickers. ¡Cada día con tu parche ganas uno nuevo!`;
    $('albumGrid').innerHTML = ids.map((id, i) => {
      const tiene = i < dias, nuevo = hoy && i === Math.min(dias, total) - 1 && dias <= total, dorado = i < dorados;
      return `<div class="al-sticker${tiene ? ' tiene' : ''}${nuevo ? ' nuevo' : ''}${dorado ? ' dorado' : ''}">` +
        `<svg viewBox="22 18 276 276">${Juego.figura(id, Juego.original(id))}</svg>` +
        `<span>${tiene ? nombres[id] : '¿?'}</span>${nuevo ? '<b>¡Nuevo!</b>' : ''}</div>`;
    }).join('');
    $('album').classList.remove('hidden');
    document.body.classList.add('jugando');
    const n = $('albumGrid').querySelector('.nuevo');
    if (n) setTimeout(() => n.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200);
  }
  function cerrar() {
    $('album').classList.add('hidden');
    document.body.classList.remove('jugando');
  }
  let cableado = false;
  function iniciar() {
    if (cableado) return;
    cableado = true;
    $('albumCerrar').addEventListener('click', cerrar);
  }
  return { abrir, cerrar, iniciar, texto, estado };
})();
