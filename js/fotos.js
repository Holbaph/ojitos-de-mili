// fotos.js — 🧩 Rompecabezas con fotos de la familia. Los papás agregan fotos
// (con el PIN de padres) y Mili las arma como rompecabezas, eligiendo cuántas
// piezas. Las fotos quedan SOLO en este celular (IndexedDB): no se suben a
// ningún lado. Se achican al guardarlas para no ocupar mucho espacio.

const Fotos = (function () {
  const $ = (id) => document.getElementById(id);
  const decir = (t) => { if (typeof Voz !== 'undefined') Voz.decir(t); };
  const MAX = 60;

  let dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('sin IndexedDB')); return; }
      const r = indexedDB.open('ojitos-fotos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('fotos', { keyPath: 'id' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbP;
  }
  async function tx(modo, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction('fotos', modo), out = fn(t.objectStore('fotos'));
      t.oncomplete = () => res(out && out.result !== undefined ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  const todas = () => tx('readonly', (s) => s.getAll()).then((l) => (l || []).sort((a, b) => b.fecha - a.fecha));

  // achica la foto (lado mayor 1000 px, JPEG) antes de guardarla
  function achicar(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1000 / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? res(b) : rej(new Error('no se pudo'))), 'image/jpeg', 0.85);
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
      img.src = url;
    });
  }
  async function agregar(files) {
    let n = (await todas()).length, ok = 0;
    for (const f of files) {
      if (n >= MAX || !/^image\//.test(f.type)) continue;
      try {
        const blob = await achicar(f);
        await tx('readwrite', (s) => s.put({ id: 'f' + Date.now() + Math.random().toString(36).slice(2, 6), fecha: Date.now(), blob }));
        n++; ok++;
      } catch (e) { /* esa foto no se pudo leer */ }
    }
    return ok;
  }

  // ---------- pantalla ----------
  let urls = [], lista = [], papas = false, quitar = null;
  async function render() {
    urls.forEach((u) => URL.revokeObjectURL(u)); urls = [];
    try { lista = await todas(); } catch (e) { lista = []; }
    $('foVacio').classList.toggle('hidden', lista.length > 0);
    $('foGrid').innerHTML = lista.map((f, i) => {
      const u = URL.createObjectURL(f.blob); urls.push(u);
      return `<div class="fo-item"><button class="fo-foto" data-i="${i}" aria-label="Armar esta foto"><img src="${u}" alt=""></button>` +
        (papas ? `<button class="ta-borrar" data-borrar="${i}" aria-label="Borrar foto">🗑️</button>` : '') + '</div>';
    }).join('');
    $('foPapas').textContent = papas ? '➕ Agregar fotos' : '🔒 Papás: agregar fotos';
    $('foSub').textContent = 'Las fotos quedan solo en este celular';
  }
  async function botonPapas() {
    if (!papas) {
      const r = await Candado.pedir('Para agregar o borrar fotos');
      if (r !== 'ok' && r !== 'olvido') return;
      papas = true; render();
    }
    $('foInput').click();
  }

  // ---------- armar ----------
  let parar = null;
  function armar(i) {
    const f = lista[i];
    if (!f) return;
    $('foLista').classList.add('hidden');
    $('foJuego').classList.remove('hidden');
    const area = $('foArea');
    const fig = `<image href="${urls[i]}" x="0" y="0" width="320" height="440" preserveAspectRatio="xMidYMid slice"/>`;
    const ganar = (t) => {
      $('foMsg').textContent = t + ' 🎉';
      decir('¡Muy bien! ¡Armaste la foto!');
      if (typeof confetiPantallaGlobal === 'function') confetiPantallaGlobal();
    };
    const aviso = (t) => { $('foMsg').textContent = t; decir(t); };
    $('foMsg').textContent = '';
    if (parar) parar();
    parar = JuegosPeques.rompecabezas(area, 1, ganar, aviso, { fig, nombre: 'la foto', W: 320, H: 440, consigna: 'Arma la foto: lleva cada pieza a su lugar 📸' });
    decir('¡Arma la foto! Lleva cada pieza a su lugar');
  }
  function volver() {
    if (parar) { parar(); parar = null; }
    $('foArea').innerHTML = '';
    $('foJuego').classList.add('hidden');
    $('foLista').classList.remove('hidden');
  }

  let cableado = false;
  function cablear() {
    $('foCerrar').addEventListener('click', () => { if (!$('foJuego').classList.contains('hidden')) volver(); else cerrar(); });
    $('foPapas').addEventListener('click', botonPapas);
    $('foOtra').addEventListener('click', volver);
    $('foInput').addEventListener('change', async (e) => {
      const files = [...(e.target.files || [])];
      e.target.value = '';
      if (!files.length) return;
      $('foSub').textContent = 'Guardando fotos…';
      const n = await agregar(files);
      render();
      if (!n) $('foSub').textContent = 'No se pudo guardar (¿llegaste al máximo de ' + MAX + '?)';
    });
    $('foGrid').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-borrar]');
      if (b) {
        const i = Number(b.dataset.borrar);
        if (quitar !== i) { quitar = i; b.textContent = '¿Seguro?'; b.classList.add('confirmar'); return; }
        quitar = null;
        await tx('readwrite', (s) => s.delete(lista[i].id));
        render();
        return;
      }
      const f = e.target.closest('[data-i]');
      if (f) armar(Number(f.dataset.i));
    });
  }
  function abrir() {
    if (!cableado) { cablear(); cableado = true; }
    papas = false; quitar = null;
    volver();
    $('fotos').classList.remove('hidden');
    document.body.classList.add('jugando');
    render();
  }
  function cerrar() {
    volver();
    urls.forEach((u) => URL.revokeObjectURL(u)); urls = [];
    $('fotos').classList.add('hidden');
    document.body.classList.remove('jugando');
  }
  return { abrir, cerrar };
})();
