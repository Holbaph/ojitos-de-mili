// llamada.js — 📞 Te llama un amigo: cuando Mili se pone el parche, la "llama"
// por videollamada uno de sus personajes (o su perrito) para felicitarla.
// Suena el teléfono, ella contesta y el personaje le habla con voz. Son
// nuestros propios dibujos; no se llama a nadie de verdad.

const Llamada = (function () {
  const $ = (id) => document.getElementById(id);
  const pick = (l) => l[Math.floor(Math.random() * l.length)];
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  let ctx = null, ringT = null, quien = null, activa = false, corte = null;

  function timbre() {
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { return; }
    const sonar = () => {
      const t = ctx.currentTime + 0.02;
      [[880, 0], [660, 0.18], [880, 0.36], [660, 0.54]].forEach(([f, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.16);
        o.connect(g).connect(ctx.destination); o.start(t + d); o.stop(t + d + 0.18);
      });
    };
    sonar();
    clearInterval(ringT); ringT = setInterval(sonar, 1800);
  }
  const callarTimbre = () => { clearInterval(ringT); ringT = null; };

  // quién llama: un personaje al azar, o (a veces) su perrito
  function elegir() {
    const perro = Juego.extra('mascota');
    if (perro && typeof Mascota !== 'undefined' && Mascota.RAZAS[perro.raza] && Math.random() < 0.25) {
      const nombre = String(perro.nombre || 'Pancho').replace(/[<>&"'`]/g, '').slice(0, 14);
      return { perro: true, nombre, raza: perro.raza, tono: 1.5 };
    }
    // sin los "malos" ni los que pueden asustar
    const NO = ['mili', 'teka', 'tamatoa', 'hans', 'gigante', 'viento', 'nokk'];
    const p = pick(Juego.personajes().filter((x) => !NO.includes(x.id)));
    return { id: p.id, nombre: p.nombre, tono: 1 + Math.random() * 0.6 };
  }
  function dibujo(q, chico) {
    if (q.perro) return `<svg viewBox="${chico ? '40 20 240 200' : '0 0 320 320'}" class="pj-vivo">${'<g class="pj-cuerpo">' + Mascota.perro(q.raza, { animo: 'feliz', parche: true }) + '</g>'}</svg>`;
    return `<svg viewBox="${chico ? '22 18 276 276' : '0 -20 320 470'}" class="pj-vivo"><g class="pj-cuerpo">${Juego.figura(q.id, Juego.vestido(q.id))}</g></svg>`;
  }
  function frases(q) {
    if (q.perro) {
      return [`¡Guau, guau! ¡Hola, Mili! ¡Soy ${q.nombre}!`, '¡Mira, yo también tengo mi parche puesto! ¡Somos iguales!',
        pick(['¡Cuando termines, me das comida y jugamos a la pelota!', '¡Eres la mejor amiga del mundo!']), '¡Guau! ¡Chao, Mili! ¡Te quiero mucho!'];
    }
    return [
      `¡Hola, Mili! ¡Soy ${q.nombre}!`,
      pick(['¡Me contaron que hoy te pusiste tu parche! ¡Eres súper valiente!', '¡Qué bien que usas tu parche! Tu ojito se está poniendo fuertecito.', '¡Te llamo para felicitarte por usar tu parche hoy!']),
      pick(['Yo también hago cosas difíciles, ¡y tú me das mucho ánimo!', '¡Cuando termines, juguemos juntas en el juego de vestir!', 'Me encanta tu parche, ¡se te ve precioso!', '¡Eres mi amiga más valiente!']),
      '¡Chao, Mili! ¡Te quiero mucho!',
    ];
  }

  // 1) suena el teléfono
  function llamar() {
    if (activa) return;
    activa = true;
    quien = elegir();
    $('llFoto').innerHTML = dibujo(quien, true);
    $('llNombre').textContent = quien.nombre;
    $('llEntrante').classList.remove('hidden'); $('llEnCurso').classList.add('hidden');
    $('llamada').classList.remove('hidden');
    document.body.classList.add('jugando');
    timbre();
    if (navigator.vibrate) try { navigator.vibrate([300, 200, 300]); } catch (e) {}
    clearTimeout(corte); corte = setTimeout(colgar, 30000); // si nadie contesta
  }
  // 2) contesta: el personaje le habla
  async function contestar() {
    callarTimbre(); clearTimeout(corte);
    $('llEntrante').classList.add('hidden'); $('llEnCurso').classList.remove('hidden');
    $('llVideo').innerHTML = dibujo(quien, false);
    $('llYo').innerHTML = `<svg viewBox="22 18 276 276"><g>${Juego.figura('mili', Juego.vestido('mili'), { parche: 'izquierdo' })}</g></svg>`;
    const ini = Date.now();
    const reloj = setInterval(() => { const s = Math.floor((Date.now() - ini) / 1000); $('llTiempo').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 500);
    const svg = () => $('llVideo').querySelector('svg');
    for (const f of frases(quien)) {
      if (!activa) break;
      const g = $('llGlobo'); g.textContent = f; g.classList.remove('ver'); void g.offsetWidth; g.classList.add('ver');
      const s = svg(); if (s) { s.classList.remove('pj-salto'); void s.getBoundingClientRect(); s.classList.add('pj-salto'); }
      if (typeof Voz !== 'undefined' && Voz.activa()) await Voz.decir(f, { tono: quien.tono, rapidez: 0.95 });
      else await espera(2600);
      await espera(400);
    }
    clearInterval(reloj);
    if (activa) { $('llGlobo').textContent = '📞 Llamada terminada'; await espera(1500); colgar(); }
  }
  function colgar() {
    callarTimbre(); clearTimeout(corte);
    activa = false;
    if (typeof Voz !== 'undefined') Voz.callar();
    $('llamada').classList.add('hidden');
    document.body.classList.remove('jugando');
  }

  let cableado = false;
  function iniciar() {
    if (cableado) return;
    cableado = true;
    $('llContestar').addEventListener('click', contestar);
    $('llRechazar').addEventListener('click', colgar);
    $('llColgar').addEventListener('click', colgar);
  }
  return { iniciar, llamar, colgar };
})();
