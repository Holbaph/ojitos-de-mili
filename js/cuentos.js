// cuentos.js — 📖 "Cuentos de Mili": cada vez un cuento nuevo y más largo
// (unas 10 páginas), armado al azar con un amigo del juego de vestir, un lugar,
// una misión, un ayudante, un objeto mágico, dos problemas y un final. En dos
// momentos MILI ELIGE qué pasa (p. ej. "¿cruzan por el puente o en bote?") y
// eso cambia la historia y el final. Siempre está el "parche mágico" de Mili
// ayudando (refuerza que el parche es algo bueno). Se lee en voz alta (voz.js).

const Cuentos = (function () {
  const $ = (id) => document.getElementById(id);
  const pick = (l) => l[Math.floor(Math.random() * l.length)];
  const mezclar = (l) => l.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

  // ---------- los ingredientes ----------
  const LUGARES = [
    { n: 'el bosque encantado', e: ['🌲', '🍄', '🦋', '🌳'], f: ['#bfe8c0', '#e9f7d8'], d: 'Los árboles eran tan altos que tocaban las nubes, y los hongos brillaban como lucecitas de colores.', caminos: [['el sendero de los hongos brillantes', '🍄'], ['el túnel de ramas y hojas', '🌿']] },
    { n: 'la playa del sol', e: ['🏖️', '🐚', '🦀', '🌴'], f: ['#ffe9a8', '#bfe6f5'], d: 'La arena era tibiecita, las olas hacían "shhh, shhh" y los cangrejos bailaban de lado.', caminos: [['la orilla del mar, saltando olas', '🌊'], ['las dunas de arena dorada', '🏜️']] },
    { n: 'el castillo de hielo', e: ['❄️', '🏰', '⛄', '✨'], f: ['#d6efff', '#f3fbff'], d: 'Las paredes eran de hielo transparente y, cuando les llegaba el sol, se llenaban de arcoíris.', caminos: [['la escalera de copos de nieve', '❄️'], ['el tobogán de hielo', '🛷']] },
    { n: 'una isla en medio del mar', e: ['🌊', '🏝️', '🐢', '⛵'], f: ['#a8e0f5', '#e8fbff'], d: 'En la isla había palmeras con cocos, flores gigantes y una cascada que cantaba.', caminos: [['la cascada que canta', '💦'], ['la selva de palmeras', '🌴']] },
    { n: 'el jardín de las flores', e: ['🌸', '🌷', '🐝', '🌼'], f: ['#ffd6e7', '#fff3d6'], d: 'Las flores eran tan grandes como paraguas y olían a frutilla y a vainilla.', caminos: [['el laberinto de girasoles', '🌻'], ['el puente de pétalos', '🌸']] },
    { n: 'la ciudad de los dulces', e: ['🍭', '🧁', '🍬', '🍩'], f: ['#ffd1ec', '#fff0d1'], d: 'Las casas eran de galleta, los techos de chocolate y los ríos, de leche con frutilla.', caminos: [['la calle de los caramelos', '🍬'], ['el río de chocolate, en un bote de galleta', '🍫']] },
    { n: 'el espacio, entre las estrellas', e: ['🚀', '🪐', '⭐', '🌙'], f: ['#2a2560', '#5b3f8f'], d: 'Flotaban despacito, como burbujas, y los planetas tenían anillos de colores.', caminos: [['el camino de la Luna', '🌙'], ['el planeta de los anillos', '🪐']] },
    { n: 'el fondo del mar', e: ['🐠', '🐙', '🫧', '🐳'], f: ['#7cc4ea', '#bde8f7'], d: 'Los peces de colores nadaban en filita y los pulpos saludaban con sus ocho brazos.', caminos: [['el bosque de algas', '🌿'], ['la cueva de las perlas', '🦪']] },
    { n: 'la montaña de nieve', e: ['🏔️', '🌨️', '🦌', '🧣'], f: ['#e3ecf7', '#ffffff'], d: 'La nieve crujía bajo sus botas, "cranch, cranch", y el aire olía a chocolate caliente.', caminos: [['la cuesta en trineo', '🛷'], ['la cueva de los osos dormilones', '🐻']] },
    { n: 'la casita mágica de Encanto', e: ['🦋', '🕯️', '🌺', '🏡'], f: ['#ffe3c2', '#fff6e3'], d: 'Las puertas brillaban, las baldosas bailaban y las ventanas se abrían solas para saludar.', caminos: [['la escalera que se mueve', '🪜'], ['el patio de las mariposas amarillas', '🦋']] },
    { n: 'la selva de los monos', e: ['🐒', '🌴', '🦜', '🍌'], f: ['#b8e6a0', '#effbd9'], d: 'Los monos se columpiaban de liana en liana y los loros repetían todo lo que decían.', caminos: [['las lianas columpio', '🐒'], ['el río de los hipopótamos', '🦛']] },
    { n: 'el reino de las nubes', e: ['☁️', '🌈', '🕊️', '✨'], f: ['#cfe8ff', '#fff6fb'], d: 'Las nubes eran suavecitas como algodón de azúcar y se podía saltar sobre ellas.', caminos: [['el tobogán de arcoíris', '🌈'], ['el castillo de nubes', '☁️']] },
    { n: 'la granja feliz', e: ['🐮', '🐔', '🐷', '🌾'], f: ['#fff0b8', '#e9f7d8'], d: 'Las vacas decían "muuu", las gallinas "co-co-co" y los chanchitos jugaban en el barro.', caminos: [['el granero rojo', '🛖'], ['el campo de girasoles', '🌻']] },
    { n: 'el circo de las estrellas', e: ['🎪', '🤹', '🎈', '🎠'], f: ['#ffd6d6', '#fff3d6'], d: 'Había malabaristas, globos de todos los colores y un carrusel con caballitos que brillaban.', caminos: [['la cuerda floja', '🤸'], ['el carrusel mágico', '🎠']] },
  ];
  const MISIONES = [
    { n: 'encontrar una estrella que se había caído del cielo', obj: 'la estrellita', e: '⭐' },
    { n: 'preparar una torta para un cumpleaños sorpresa', obj: 'los ingredientes de la torta', e: '🎂' },
    { n: 'ayudar a un pajarito a volver a su nido', obj: 'el nido del pajarito', e: '🐦' },
    { n: 'buscar el tesoro de los colores', obj: 'el tesoro de los colores', e: '💎' },
    { n: 'rescatar a un gatito que estaba perdido', obj: 'al gatito', e: '🐱' },
    { n: 'pintar el arcoíris más lindo del mundo', obj: 'los colores del arcoíris', e: '🌈' },
    { n: 'encontrar la canción que se le perdió a la luna', obj: 'la canción de la luna', e: '🎵' },
    { n: 'llevarle un regalo a la abuelita', obj: 'la casa de la abuelita', e: '🎁' },
    { n: 'despertar al sol, que se había quedado dormido', obj: 'la cama del sol', e: '☀️' },
    { n: 'encontrar la llave de la puerta de los juguetes', obj: 'la llave dorada', e: '🗝️' },
    { n: 'ayudar a un dragoncito a aprender a volar', obj: 'la cima de la montaña', e: '🐉' },
    { n: 'buscar las semillas mágicas para plantar un jardín', obj: 'las semillas mágicas', e: '🌱' },
    { n: 'devolverle la corona a la reina de las mariposas', obj: 'la corona de las mariposas', e: '👑' },
    { n: 'encontrar al perrito que se escapó a jugar', obj: 'al perrito juguetón', e: '🐶' },
  ];
  const PROBLEMAS = [
    'un río muy ancho que no se podía cruzar', 'una neblina tan espesa que no dejaba ver nada', 'una cueva oscurita y silenciosa',
    'un laberinto lleno de caminos iguales', 'un montón de hojas que tapaban el camino', 'un viento fuerte que soplaba y soplaba',
    'una puerta gigante cerrada con candado', 'un puente roto, con tablitas sueltas', 'una montaña de nieve que bloqueaba el paso',
    'un dragón que lloraba porque nadie jugaba con él', 'un charco enorme de barro pegajoso', 'una nube de lluvia que no paraba de llorar',
  ];
  const AYUDANTES = [
    { n: 'una tortuga muy sabia', e: '🐢' }, { n: 'un búho que usaba anteojos', e: '🦉' }, { n: 'un delfín muy juguetón', e: '🐬' },
    { n: 'una ardillita rapidísima', e: '🐿️' }, { n: 'un conejito saltarín', e: '🐰' }, { n: 'una mariposa que hablaba', e: '🦋' },
    { n: 'un pingüino muy educado', e: '🐧' }, { n: 'una llamita chilena muy simpática', e: '🦙' }, { n: 'un unicornio tímido', e: '🦄' },
    { n: 'un pulpo con ocho abrazos', e: '🐙' }, { n: 'una abejita trabajadora', e: '🐝' }, { n: 'un perrito con nariz de detective', e: '🐕' },
  ];
  const OBJETOS = [
    { n: 'una varita que hacía burbujas de colores', e: '🪄', usa: 'hizo una burbuja gigante y todos flotaron por encima' },
    { n: 'un mapa que hablaba', e: '🗺️', usa: 'dijo con su vocecita: "¡Por aquí, por aquí!"' },
    { n: 'una linterna de luciérnagas', e: '🔦', usa: 'iluminó todo con lucecitas que bailaban' },
    { n: 'un paraguas que volaba', e: '☂️', usa: 'se abrió solito y los llevó volando por el aire' },
    { n: 'una brújula que siempre apuntaba a los amigos', e: '🧭', usa: 'giró y giró hasta mostrarles el camino' },
    { n: 'un globo que nunca se desinflaba', e: '🎈', usa: 'los levantó suavecito hasta el otro lado' },
    { n: 'una flauta que hacía dormir a los problemas', e: '🪈', usa: 'tocó una canción tan bonita que todo se calmó' },
    { n: 'unas botas saltarinas', e: '👢', usa: 'les dio unos saltos tan grandes que cruzaron de un brinco' },
  ];
  const PODERES = {
    elsa: 'con su magia hizo un puente de hielo brillante', anna: 'encontró un camino escondido con su valentía',
    olaf: 'dio un abrazo calentito que les dio mucho ánimo', sven: 'los llevó en su lomo saltando y saltando',
    kristoff: 'trepó con su cuerda y los ayudó a subir', moana: 'guió un bote por el agua como una gran navegante',
    maui: 'se transformó en halcón y voló a mirar desde arriba', stitch: 'dio un salto gigante ¡y aterrizó del otro lado!',
    rapunzel: 'lanzó su pelo larguísimo como si fuera una cuerda', ariel: 'nadó rapidísimo y les mostró la salida',
    mirabel: 'abrió una puerta mágica llena de luces', luisa: 'levantó una roca enorme con su fuerza',
    bruni: 'encendió una lucecita para alumbrar el camino', rumi: 'cantó una canción tan bonita que todo se iluminó',
    mickey: 'tuvo una idea genial con su sombrero mágico', minnie: 'hizo un moño gigante que sirvió de paracaídas',
    blippi: 'construyó una máquina de colores para cruzar', luli: 'cantó una canción y todos bailaron hasta llegar',
    merida: 'lanzó una flecha con una cuerda para cruzar', tiana: 'preparó una sopa mágica que les dio fuerzas',
    bella: 'buscó la respuesta en su libro favorito', cenicienta: 'pidió ayuda a sus amigos los ratoncitos',
    jasmine: 'llamó a la alfombra mágica para volar', heihei: 'picoteó y picoteó hasta abrir un caminito',
  };
  const INICIOS = [
    (a) => `Había una vez una niña muy valiente llamada Mili, que tenía un parche mágico para que su ojito se pusiera fuerte. Una mañana, mientras tomaba desayuno, alguien tocó la puerta: toc, toc, toc. ¡Era ${a}!`,
    (a) => `Una tarde de sol, Mili estaba jugando en el patio con su parche mágico puesto. De repente, apareció ${a} corriendo, con cara de tener algo muy importante que contar.`,
    (a) => `Mili se estaba lavando los dientes antes de dormir cuando vio una luz brillante por la ventana. ¡Era ${a}, que venía a buscarla para una aventura!`,
    (a) => `Un día de lluvia, Mili miraba las gotitas por la ventana. "Qué aburrido", pensó. Pero justo entonces llegó ${a} con una carta mágica en la mano.`,
    (a) => `Mili despertó con un rayito de sol en la cara. Se puso su parche mágico, que le daba superpoderes de valentía, y escuchó una voz conocida: era ${a}.`,
  ];
  const ELECCION_2 = [
    [['Cantar una canción muy fuerte', '🎵', 'cantó una canción tan alegre que todos se pusieron a bailar, y el problema se hizo chiquitito'],
     ['Contar hasta diez y pensar con calma', '🔢', 'respiró hondo, contó hasta diez, miró con su ojito valiente y encontró la solución']],
    [['Pedir ayuda a los amigos', '🤝', 'pidió ayuda a todos sus amigos y, juntos, lo lograron en un ratito'],
     ['Usar el objeto mágico', '✨', 'usó el objeto mágico']],
    [['Darle un abrazo al problema', '🤗', 'le dio un abrazo grandote y el problema dejó de estar triste'],
     ['Hacer reír a todos con un chiste', '😂', 'contó un chiste tan chistoso que hasta las piedras se rieron, y todo se arregló']],
  ];
  const FINALES = [
    'Volvieron a casa felices y, esa noche, Mili soñó con su gran aventura. 🌙',
    'Hicieron una fiesta enorme con globos, torta y música, ¡y bailaron hasta cansarse! 🎉',
    'Desde ese día, todos los amigos del lugar la llamaban "Mili, la valiente del parche mágico". 🩹✨',
    'Se quedaron mirando las estrellas, comiendo galletas, y contando chistes hasta que les dio sueño. ⭐',
    'Antes de irse, plantaron una semillita para que, cuando volvieran, hubiera un árbol esperándolos. 🌱',
    'De regalo, le dieron a Mili una medalla dorada que decía: "La niña más valiente del mundo". 🏅',
    'Prometieron volver a jugar muy pronto, porque las mejores aventuras son con amigos. 💖',
    'Y su ojito, gracias al parche, quedó un poquito más fuerte que el día anterior. 👀💪',
  ];
  const MORALEJAS = [
    'Y aprendieron que juntos, ¡todo es más fácil!', 'Y aprendieron que ser valiente es intentarlo, aunque dé un poquito de miedo.',
    'Y aprendieron que ayudar a los demás llena el corazón de alegría.', 'Y aprendieron que con calma y paciencia, todo se puede.',
  ];

  // ---------- armar el cuento ----------
  // Las páginas van en "tramos": al llegar a una elección, Mili elige y recién
  // ahí se arma lo que sigue (así cada camino tiene su propia historia).
  let c = null, paginas = [], pagina = 0;
  function crear() {
    const todos = Juego.personajes().filter((p) => p.id !== 'mili' && !['teka', 'tamatoa', 'hans', 'gigante', 'viento', 'nokk'].includes(p.id));
    const [amigo, amigo2] = mezclar(todos);
    const [prob1, prob2] = mezclar(PROBLEMAS);
    c = {
      amigo, amigo2, lugar: pick(LUGARES), mision: pick(MISIONES), ayudante: pick(AYUDANTES), objeto: pick(OBJETOS),
      prob1, prob2, eleccion2: pick(ELECCION_2), final: pick(FINALES), moraleja: pick(MORALEJAS),
    };
    c.titulo = `Mili y ${amigo.nombre} en ${c.lugar.n}`;
    const L = c.lugar, A = amigo.nombre;
    return [
      { t: pick(INICIOS)(A), parche: true },
      { t: `"¡Mili, te necesito!", dijo ${A}. "Tenemos que ${c.mision.n}. ¿Me acompañas?". Mili sonrió, se acomodó su parche mágico y dijo: "¡Claro que sí! ¡Vamos!".` },
      { t: `Antes de salir, Mili guardó en su mochila ${c.objeto.n} ${c.objeto.e}. "Nunca se sabe cuándo lo vamos a necesitar", dijo.`, deco: c.objeto.e },
      { t: `Caminaron y caminaron hasta llegar ${L.n.startsWith('el ') ? 'al ' + L.n.slice(3) : 'a ' + L.n}. ${L.d}` },
      {
        t: `Al rato, el camino se dividió en dos. "¿Por dónde vamos?", preguntó ${A}. Mili, ¿tú qué eliges?`,
        elegir: L.caminos.map(([n, e], i) => ({ n: n[0].toUpperCase() + n.slice(1), e, ir: () => tramoCamino(i, n, e) })),
      },
    ];
  }
  // tramo 1: según el camino, conocen al ayudante o se les une otro amigo
  function tramoCamino(i, camino, e) {
    const A = c.amigo.nombre, poder = PODERES[c.amigo.id] || 'tuvo una idea genial';
    const encuentro = i === 0
      ? { t: `Fueron por ${camino} ${e}. ¡Qué lindo era! Ahí conocieron a ${c.ayudante.n} ${c.ayudante.e}, que les dijo: "¡Yo los acompaño!".`, deco: c.ayudante.e, ayudante: true }
      : { t: `Fueron por ${camino} ${e}. Y, de repente, ¿a quién se encontraron? ¡A ${c.amigo2.nombre}! "¡Me sumo a la aventura!", gritó feliz.`, amigo2: true };
    return [
      encuentro,
      { t: `Pero entonces apareció ${c.prob1}. "¡Oh, no!", dijo ${A}. "¿Y ahora qué hacemos?".`, susto: true },
      { t: `Mili miró con su ojito valiente, que gracias al parche estaba cada día más fuerte, y tuvo una idea. ¡Entonces ${A} ${poder}! Y lo pasaron.`, parche: true, brillo: true, ayudante: i === 0, amigo2: i === 1 },
      { t: `Siguieron un poco más… pero encontraron ${c.prob2}. Esta vez parecía más difícil. Mili, ¿qué hacemos?`, susto: true, ayudante: i === 0, amigo2: i === 1,
        elegir: c.eleccion2.map(([n, e, hace], k) => ({ n, e, ir: () => tramoFinal(i, k, hace) })) },
    ];
  }
  // tramo 2: cómo resuelven el segundo problema y el final
  function tramoFinal(camino, k, hace) {
    const A = c.amigo.nombre, extra = { ayudante: camino === 0, amigo2: camino === 1 };
    const accion = hace === 'usó el objeto mágico' ? `sacó ${c.objeto.n} de la mochila, y el objeto ${c.objeto.usa}` : hace;
    const quien = camino === 0 ? `${c.ayudante.n} ${c.ayudante.e}` : c.amigo2.nombre;
    return [
      { t: `Mili ${accion}. "¡Bravo, Mili!", gritaron ${A} y ${quien}.`, brillo: true, ...extra },
      { t: `Y ahí, detrás de una piedra brillante, encontraron ${c.mision.obj} ${c.mision.e}. ¡Lo habían logrado! Todos saltaron de alegría.`, fiesta: true, premio: true, ...extra },
      { t: `${c.final} ${c.moraleja}`, fiesta: true, ...extra },
      { t: '¡Fin! ¿Quieres otro cuento? 📖', fin: true },
    ];
  }

  // ---------- dibujo de cada página ----------
  function dibujo(p) {
    const L = c.lugar;
    const deco = L.e.map((e, i) => `<span class="cu-deco" style="left:${8 + i * 24}%;top:${i % 2 ? 6 : 16}%;animation-delay:${i * 0.4}s">${e}</span>`).join('');
    const fig = (id, st, o) => `<svg class="cu-pj pj-vivo" viewBox="0 -10 320 450"><g class="pj-cuerpo">${Juego.figura(id, st, o)}</g></svg>`;
    let pjs = fig('mili', Juego.vestido('mili'), p.parche ? { parche: 'izquierdo' } : {}) +
      fig(c.amigo.id, Juego.vestido(c.amigo.id), { pose: p.fiesta ? 'hurra' : 'normal' });
    if (p.amigo2) pjs += fig(c.amigo2.id, Juego.vestido(c.amigo2.id), { pose: p.fiesta ? 'hurra' : 'normal' });
    const ayud = p.ayudante ? `<span class="cu-ayudante">${c.ayudante.e}</span>` : '';
    const obj = p.deco && !p.ayudante ? `<span class="cu-ayudante">${p.deco}</span>` : '';
    return `<div class="cu-escena${p.brillo ? ' brillo' : ''}${p.fiesta ? ' fiesta' : ''}${p.susto ? ' susto' : ''}${p.amigo2 ? ' tres' : ''}" style="background:linear-gradient(180deg,${L.f[0]},${L.f[1]})">${deco}` +
      pjs + ayud + obj + (p.premio ? `<span class="cu-premio">${c.mision.e}</span>` : '') + '</div>';
  }

  function leer(p) {
    let t = p.t;
    if (p.elegir) t += ' ' + p.elegir.map((o) => o.n).join(', o… ') + '?';
    return Voz.decir(t, { rapidez: 0.9 });
  }
  function mostrar() {
    const p = paginas[pagina];
    $('cuTitulo').textContent = c.titulo;
    $('cuSub').textContent = `Página ${pagina + 1}`;
    $('cuDibujo').innerHTML = dibujo(p);
    $('cuTexto').textContent = p.t;
    $('cuAntes').disabled = pagina === 0;
    const elige = !!p.elegir && pagina === paginas.length - 1;
    $('cuDespues').classList.toggle('hidden', !!p.fin || elige);
    $('cuOtro').classList.toggle('hidden', !p.fin);
    $('cuElegir').classList.toggle('hidden', !p.elegir);
    $('cuElegir').innerHTML = p.elegir ? p.elegir.map((o, i) => `<button class="cu-opcion${p.elegido === i ? ' elegida' : ''}" data-op="${i}"><span>${o.e}</span>${o.n}</button>`).join('') : '';
    leer(p);
  }
  function elegir(i) {
    const p = paginas[pagina];
    if (!p.elegir) return;
    // si vuelve atrás y elige otra cosa, la historia cambia desde ahí
    paginas = paginas.slice(0, pagina + 1);
    p.elegido = i;
    paginas.push(...p.elegir[i].ir());
    pagina++;
    mostrar();
  }
  function nuevo() { paginas = crear(); pagina = 0; mostrar(); }

  let cableado = false;
  function cablear() {
    $('cuCerrar').addEventListener('click', cerrar);
    $('cuAntes').addEventListener('click', () => { if (pagina > 0) { pagina--; mostrar(); } });
    $('cuDespues').addEventListener('click', () => { if (pagina < paginas.length - 1) { pagina++; mostrar(); } });
    $('cuOtro').addEventListener('click', nuevo);
    $('cuLeer').addEventListener('click', () => leer(paginas[pagina]));
    $('cuElegir').addEventListener('click', (e) => { const b = e.target.closest('[data-op]'); if (b) elegir(Number(b.dataset.op)); });
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
  // crear(): para pruebas (devuelve las primeras páginas)
  return { abrir, cerrar, crear: () => { const p = crear(); return { titulo: c.titulo, paginas: p }; } };
})();
