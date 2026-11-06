// candado.js — 🔒 PIN de padres para entrar a Historial y Configuración.
//
// Es un "candado para niños": evita que Mili entre sin querer a la parte de los
// padres (por ejemplo, a "Dar más tiempo hoy"). El PIN es de 4 números y es el
// mismo en todos los celulares de la familia (se guarda en configuracion.pin_padres
// como "sal:sha256", nunca el número). Se pide SIEMPRE, cada vez que se entra.
// En cada celular se puede activar Face ID / huella (WebAuthn, con el
// autenticador del propio teléfono) para entrar sin escribirlo. Si se olvida,
// se entra con la contraseña de la cuenta y se puede crear otro.

const Candado = (function () {
  const $ = (id) => document.getElementById(id);
  const BIO = 'ojitos-biometria'; // id de la credencial de Face ID / huella de ESTE celular
  let huella = null;           // 'sal:hash' o null (sin PIN)
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
  function teclado(titulo, sub, { conOlvido = false, conBio = false } = {}) {
    return new Promise((res) => {
      resolver = res; escrito = '';
      $('pinTitulo').textContent = titulo;
      $('pinSub').textContent = sub || '';
      $('pinSub').classList.remove('error');
      $('pinTeclas').classList.remove('hidden');
      $('pinPuntos').classList.remove('hidden');
      $('pinClave').classList.add('hidden');
      $('pinOlvido').classList.toggle('hidden', !conOlvido);
      $('pinBio').classList.toggle('hidden', !conBio);
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
    $('pinBio').addEventListener('click', () => { if (bioEnCurso) return; bioPedir().then((ok) => { if (ok && resolver) terminar('bio'); }); });
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
  // ---------- Face ID / huella (WebAuthn con el autenticador del celular) ----------
  // No se manda nada a ningún servidor: solo se le pide al teléfono que confirme
  // que es su dueño (cara o huella). Es para no escribir el PIN.
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const desdeB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  function bioId() { try { return localStorage.getItem(BIO); } catch (e) { return null; } }
  async function bioDisponible() {
    try { return !!(window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }
    catch (e) { return false; }
  }
  async function bioActivar() {
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'Ojitos de Mili' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'padres-de-mili', displayName: 'Padres de Mili' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000,
    } });
    if (!cred) throw new Error('sin credencial');
    localStorage.setItem(BIO, b64(cred.rawId));
  }
  function bioQuitar() { try { localStorage.removeItem(BIO); } catch (e) {} }
  // Un solo pedido de Face ID a la vez: si ya hay uno en curso (por ejemplo, el
  // automático y el botón), se usa el mismo y no aparece dos veces.
  let bioEnCurso = null;
  function bioPedir() {
    const id = bioId();
    if (!id || !navigator.credentials) return Promise.resolve(false);
    if (bioEnCurso) return bioEnCurso;
    bioEnCurso = navigator.credentials.get({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: 'public-key', id: desdeB64(id), transports: ['internal'] }],
      userVerification: 'required',
      timeout: 60000,
    } }).then((c) => !!c).catch(() => false).finally(() => { bioEnCurso = null; });
    return bioEnCurso;
  }

  // Pide el PIN (o Face ID) SIEMPRE. Devuelve 'ok', 'olvido' (entró con la
  // contraseña: conviene crear un PIN nuevo) o null (canceló).
  // Si se toca dos veces seguidas (o dos botones), se usa el mismo pedido.
  let pidiendo = null;
  function pedir(motivo) {
    if (!huella) return Promise.resolve('ok');
    if (pidiendo) return pidiendo;
    pidiendo = pedirUnaVez(motivo).finally(() => { pidiendo = null; });
    return pidiendo;
  }
  async function pedirUnaVez(motivo) {
    const conBio = !!bioId();
    // Face ID parte altiro (todavía dentro del toque, como pide el celular);
    // si falla o se cancela, queda el teclado para escribir el PIN.
    if (conBio) bioPedir().then((ok) => { if (ok && resolver) terminar('bio'); });
    let sub = motivo;
    for (;;) {
      const pin = await teclado('🔒 PIN de padres', sub, { conOlvido: true, conBio });
      if (pin === null) return null;
      if (pin === 'bio') return 'ok';
      if (pin === 'olvido') return 'olvido';
      if (await coincide(pin)) return 'ok';
      sub = 'PIN incorrecto 🙈 intenta de nuevo';
      await new Promise((r) => setTimeout(r, 50));
      error(sub);
    }
  }
  // (ya no hay tiempo de gracia: el PIN se pide cada vez)
  function seguirAbierto() {}
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
  return { configurar, activo, pedir, crear, seguirAbierto, bioDisponible, bioActivo: () => !!bioId(), bioActivar, bioQuitar };
})();
