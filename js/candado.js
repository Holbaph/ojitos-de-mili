// candado.js — 🔒 PIN de padres para entrar a Historial y Configuración.
//
// Es un "candado para niños": evita que Mili entre sin querer a la parte de los
// padres (por ejemplo, a "Dar más tiempo hoy"). El PIN es de 4 números y es el
// mismo en todos los celulares de la familia (se guarda en configuracion.pin_padres
// como "sal:sha256", nunca el número). Después de escribirlo bien, queda abierto
// unos minutos para no pedirlo a cada rato. Si se olvida, se entra con la
// contraseña de la cuenta y se puede crear otro.

const Candado = (function () {
  const $ = (id) => document.getElementById(id);
  const GRACIA_MS = 3 * 60 * 1000;
  let huella = null;           // 'sal:hash' o null (sin PIN)
  let abiertoHasta = 0;
  let verificarCuenta = null;  // async (contraseña) => boolean

  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  async function sha256(texto) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))); }
  async function crearHuella(pin) {
    const sal = hex(crypto.getRandomValues(new Uint8Array(16)));
    return sal + ':' + (await sha256(sal + pin));
  }
  async function coincide(pin) {
    if (!huella) return true;
    const [sal, h] = huella.split(':');
    return (await sha256(sal + pin)) === h;
  }

  // ---------- el teclado ----------
  // Devuelve una promesa con los 4 números, null si se cancela, u 'olvido'.
  let resolver = null, escrito = '';
  function pintarPuntos() {
    $('pinPuntos').querySelectorAll('i').forEach((p, i) => p.classList.toggle('lleno', i < escrito.length));
  }
  function teclado(titulo, sub, { conOlvido = false } = {}) {
    return new Promise((res) => {
      resolver = res; escrito = '';
      $('pinTitulo').textContent = titulo;
      $('pinSub').textContent = sub || '';
      $('pinSub').classList.remove('error');
      $('pinTeclas').classList.remove('hidden');
      $('pinPuntos').classList.remove('hidden');
      $('pinClave').classList.add('hidden');
      $('pinOlvido').classList.toggle('hidden', !conOlvido);
      pintarPuntos();
      $('pinCaja').classList.remove('hidden');
    });
  }
  function terminar(valor) {
    const r = resolver; resolver = null;
    $('pinCaja').classList.add('hidden');
    $('pinClaveInput').value = '';
    if (r) r(valor);
  }
  function error(texto) {
    escrito = ''; pintarPuntos();
    $('pinSub').textContent = texto;
    $('pinSub').classList.add('error');
    const caja = $('pinPuntos');
    caja.classList.remove('pq-no'); void caja.offsetWidth; caja.classList.add('pq-no');
  }

  let cableado = false;
  function cablear() {
    $('pinTeclas').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]');
      if (!b || !resolver) return;
      const k = b.dataset.k;
      if (k === 'borrar') escrito = escrito.slice(0, -1);
      else if (escrito.length < 4) escrito += k;
      pintarPuntos();
      if (escrito.length === 4) { const pin = escrito; setTimeout(() => { const r = resolver; if (r) { resolver = null; $('pinCaja').classList.add('hidden'); r(pin); } }, 150); }
    });
    $('pinCancelar').addEventListener('click', () => terminar(null));
    $('pinOlvido').addEventListener('click', () => {
      // mostrar el campo de contraseña de la cuenta
      $('pinTitulo').textContent = 'Entra con tu contraseña';
      $('pinSub').textContent = 'Es la contraseña con que inicias sesión en la app.';
      $('pinSub').classList.remove('error');
      $('pinTeclas').classList.add('hidden');
      $('pinPuntos').classList.add('hidden');
      $('pinOlvido').classList.add('hidden');
      $('pinClave').classList.remove('hidden');
      setTimeout(() => $('pinClaveInput').focus(), 50);
    });
    const enviarClave = async () => {
      const clave = $('pinClaveInput').value;
      if (!clave || !verificarCuenta) return;
      $('pinClaveOk').disabled = true;
      let ok = false;
      try { ok = await verificarCuenta(clave); } catch (e) { ok = false; }
      $('pinClaveOk').disabled = false;
      if (ok) terminar('olvido');
      else { $('pinSub').textContent = 'Contraseña incorrecta, intenta de nuevo.'; $('pinSub').classList.add('error'); }
    };
    $('pinClaveOk').addEventListener('click', enviarClave);
    $('pinClaveInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') enviarClave(); });
    document.addEventListener('keydown', (e) => {
      if (!resolver || $('pinTeclas').classList.contains('hidden')) return;
      if (/^[0-9]$/.test(e.key)) $('pinTeclas').querySelector(`[data-k="${e.key}"]`).click();
      else if (e.key === 'Backspace') $('pinTeclas').querySelector('[data-k="borrar"]').click();
      else if (e.key === 'Escape') terminar(null);
    });
  }

  // ---------- API ----------
  // opts: { huella, verificarCuenta }
  function configurar(opts) {
    if (!cableado) { cablear(); cableado = true; }
    if ('huella' in opts) huella = typeof opts.huella === 'string' && /^[0-9a-f]{32}:[0-9a-f]{64}$/.test(opts.huella) ? opts.huella : null;
    if (opts.verificarCuenta) verificarCuenta = opts.verificarCuenta;
  }
  const activo = () => !!huella;
  // Pide el PIN si hace falta. Devuelve 'ok', 'olvido' (entró con la
  // contraseña: conviene crear un PIN nuevo) o null (canceló).
  async function pedir(motivo) {
    if (!huella || Date.now() < abiertoHasta) return 'ok';
    let sub = motivo;
    for (;;) {
      const pin = await teclado('🔒 PIN de padres', sub, { conOlvido: true });
      if (pin === null) return null;
      if (pin === 'olvido') { abiertoHasta = Date.now() + GRACIA_MS; return 'olvido'; }
      if (await coincide(pin)) { abiertoHasta = Date.now() + GRACIA_MS; return 'ok'; }
      sub = 'PIN incorrecto 🙈 intenta de nuevo';
      await new Promise((r) => setTimeout(r, 50));
      error(sub);
    }
  }
  // Mientras los padres están adentro, el tiempo de gracia se renueva.
  function seguirAbierto() { if (huella) abiertoHasta = Date.now() + GRACIA_MS; }
  // Pide un PIN nuevo dos veces. Devuelve la huella para guardar, o null.
  async function crear() {
    let sub = 'Que Mili no lo vea 🙈';
    for (;;) {
      const a = await teclado('Crea un PIN de 4 números', sub);
      if (a === null) return null;
      const b = await teclado('Escríbelo otra vez', 'Para confirmar');
      if (b === null) return null;
      if (a === b) return crearHuella(a);
      sub = 'No coincidían 🙈 vamos de nuevo';
    }
  }
  return { configurar, activo, pedir, crear, seguirAbierto };
})();
