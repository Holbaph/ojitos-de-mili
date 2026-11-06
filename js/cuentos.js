// cuentos.js — 📖 "Cuentos de Mili": cada vez un cuento nuevo, armado al azar
// con un amigo del juego de vestir, un lugar, una misión, un problema y cómo lo
// resuelven (siempre con el "parche mágico" de Mili ayudando: refuerza que el
// parche es algo bueno). Se lee en voz alta (js/voz.js) página por página,
// con un dibujo de Mili (con su parche) y su amigo en el lugar del cuento.

const Cuentos = (function () {
  const $ = (id) => document.getElementById(id);
  const pick = (l) => l[Math.floor(Math.random() * l.length)];

  const LUGARES = [
    { n: 'el bosque encantado', e: ['🌲', '🍄', '🦋', '🌳'], f: ['#bfe8c0', '#e9f7d8'] },
    { n: 'la playa del sol', e: ['🏖️', '🐚', '🦀', '🌴'], f: ['#ffe9a8', '#bfe6f5'] },
    { n: 'el castillo de hielo', e: ['❄️', '🏰', '⛄', '✨'], f: ['#d6efff', '#f3fbff'] },
    { n: 'una isla en medio del mar', e: ['🌊', '🏝️', '🐢', '⛵'], f: ['#a8e0f5', '#e8fbff'] },
    { n: 'el jardín de las flores', e: ['🌸', '🌷', '🐝', '🌼'], f: ['#ffd6e7', '#fff3d6'] },
    { n: 'la ciudad de los dulces', e: ['🍭', '🧁', '🍬', '🍩'], f: ['#ffd1ec', '#fff0d1'] },
    { n: 'el espacio, entre las estrellas', e: ['🚀', '🪐', '⭐', '🌙'], f: ['#2a2560', '#5b3f8f'] },
    { n: 'el fondo del mar', e: ['🐠', '🐙', '🫧', '🐳'], f: ['#7cc4ea', '#bde8f7'] },
    { n: 'la montaña de nieve', e: ['🏔️', '🌨️', '🦌', '🧣'], f: ['#e3ecf7', '#ffffff'] },
    { n: 'la casita mágica de Encanto', e: ['🦋', '🕯️', '🌺', '🏡'], f: ['#ffe3c2', '#fff6e3'] },
  ];
  const MISIONES = [
    { n: 'encontrar una estrella que se había caído del cielo', obj: 'la estrellita', e: '⭐' },
    { n: 'preparar una torta para un cumpleaños sorpresa', obj: 'la torta', e: '🎂' },
    { n: 'ayudar a un pajarito a volver a su nido', obj: 'el pajarito', e: '🐦' },
    { n: 'buscar el tesoro de los colores', obj: 'el tesoro', e: '💎' },
    { n: 'rescatar a un gatito que estaba perdido', obj: 'el gatito', e: '🐱' },
    { n: 'pintar el arcoíris más lindo del mundo', obj: 'el arcoíris', e: '🌈' },
    { n: 'encontrar la canción que se le perdió a la luna', obj: 'la canción', e: '🎵' },
    { n: 'llevar un regalo a la abuelita', obj: 'el regalo', e: '🎁' },
  ];
  const PROBLEMAS = [
    'un río muy ancho que no se podía cruzar',
    'una neblina tan espesa que no dejaba ver nada',
    'una cueva oscurita y silenciosa',
    'un laberinto lleno de caminos iguales',
    'un montón de hojas que tapaban el camino',
    'un viento fuerte que soplaba y soplaba',
  ];
  const PODERES = {
    elsa: 'con su magia hizo un puente de hielo brillante',
    anna: 'encontró un camino escondido con su valentía',
    olaf: 'dio un abrazo calentito que les dio mucho ánimo',
    sven: 'los llevó en su lomo saltando y saltando',
    kristoff: 'trepó con su cuerda y los ayudó a subir',
    moana: 'guió un bote por el agua como una gran navegante',
    maui: 'se transformó en halcón y voló a mirar desde arriba',
    stitch: 'dio un salto gigante ¡y aterrizó del otro lado!',
    rapunzel: 'lanzó su pelo larguísimo como si fuera una cuerda',
    ariel: 'nadó rapidísimo y les mostró la salida',
    mirabel: 'abrió una puerta mágica llena de luces',
    luisa: 'levantó una roca enorme con su fuerza',
    bruni: 'encendió una lucecita para alumbrar el camino',
    rumi: 'cantó una canción tan bonita que todo se iluminó',
    mickey: 'tuvo una idea genial con su sombrero mágico',
    minnie: 'hizo un moño gigante que sirvió de paracaídas',
    blippi: 'construyó una máquina de colores para cruzar',
    luli: 'cantó una canción y todos bailaron hasta llegar',
  };
  const FINALES = [
    'Y aprendieron que juntos, ¡todo es más fácil!',
    'Y Mili se sintió muy valiente y feliz.',
    'Y esa noche, Mili soñó con su gran aventura.',
    'Y todos celebraron con una fiesta de baile.',
    'Y su ojito, gracias al parche, se puso cada día más fuertecito.',
  ];

  let cuento = null, pagina = 0;

  function crear() {
    const amigos = Juego.personajes().filter((p) => p.id !== 'mili');
    const amigo = pick(amigos);
    const lugar = pick(LUGARES), mision = pick(MISIONES), problema = pick(PROBLEMAS);
    const poder = PODERES[amigo.id] || 'tuvo una idea genial';
    const final = pick(FINALES);
    const titulo = `Mili y ${amigo.nombre} en ${lugar.n}`;
    return {
      titulo, lugar, amigo, mision,
      paginas: [
        { t: `Había una vez una niña muy valiente llamada Mili, que tenía un parche mágico para que su ojito se pusiera fuerte. Un día, Mili fue a ${lugar.n} junto a ${amigo.nombre}.`, parche: true },
        { t: `Allí les contaron un secreto: tenían que ${mision.n}. "¡Vamos!", dijo Mili, y partieron muy contentos.` },
        { t: `Pero en el camino encontraron ${problema}. "¿Y ahora qué hacemos?", preguntó ${amigo.nombre}.` },
        { t: `Mili se acomodó su parche mágico y su ojito valiente miró con mucha atención… ¡y vio la solución! Entonces ${amigo.nombre} ${poder}.`, parche: true, brillo: true },
        { t: `¡Lo lograron! Encontraron ${mision.obj} ${mision.e} y todos aplaudieron. ${final}`, fiesta: true },
        { t: '¡Fin! ¿Quieres otro cuento?', fin: true },
      ],
    };
  }

  function dibujo(p) {
    const L = cuento.lugar;
    const deco = L.e.map((e, i) => `<span class="cu-deco" style="left:${8 + i * 24}%;top:${i % 2 ? 6 : 16}%;animation-delay:${i * 0.4}s">${e}</span>`).join('');
    const mili = Juego.figura('mili', Juego.vestido('mili'), p.parche ? { parche: 'izquierdo' } : {});
    const amigo = Juego.figura(cuento.amigo.id, Juego.vestido(cuento.amigo.id), { pose: p.fiesta ? 'hurra' : 'normal' });
    return `<div class="cu-escena${p.brillo ? ' brillo' : ''}${p.fiesta ? ' fiesta' : ''}" style="background:linear-gradient(180deg,${L.f[0]},${L.f[1]})">${deco}` +
      `<svg class="cu-pj" viewBox="0 -10 320 450">${mili}</svg><svg class="cu-pj" viewBox="0 -10 320 450">${amigo}</svg>` +
      (p.fiesta ? `<span class="cu-premio">${cuento.mision.e}</span>` : '') + '</div>';
  }

  function mostrar() {
    const p = cuento.paginas[pagina];
    $('cuTitulo').textContent = cuento.titulo;
    $('cuSub').textContent = `Página ${pagina + 1} de ${cuento.paginas.length}`;
    $('cuDibujo').innerHTML = dibujo(p);
    $('cuTexto').textContent = p.t;
    $('cuAntes').disabled = pagina === 0;
    $('cuDespues').classList.toggle('hidden', !!p.fin);
    $('cuOtro').classList.toggle('hidden', !p.fin);
    Voz.decir(p.t, { rapidez: 0.9 });
  }
  function nuevo() { cuento = crear(); pagina = 0; mostrar(); }

  let cableado = false;
  function cablear() {
    $('cuCerrar').addEventListener('click', cerrar);
    $('cuAntes').addEventListener('click', () => { if (pagina > 0) { pagina--; mostrar(); } });
    $('cuDespues').addEventListener('click', () => { if (pagina < cuento.paginas.length - 1) { pagina++; mostrar(); } });
    $('cuOtro').addEventListener('click', nuevo);
    $('cuLeer').addEventListener('click', () => Voz.decir(cuento.paginas[pagina].t, { rapidez: 0.9 }));
  }
  function abrir() {
    if (!cableado) { cablear(); cableado = true; }
    $('cuento').classList.remove('hidden');
    document.body.classList.add('jugando');
    nuevo();
  }
  function cerrar() {
    Voz.callar();
    $('cuento').classList.add('hidden');
    document.body.classList.remove('jugando');
  }
  return { abrir, cerrar, crear };
})();
