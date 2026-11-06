// galeria.js — 🖼️ Mi galería: los dibujos de Mili. Se guardan los que pinta
// en "Pintar" (juegos con el parche) y los que hace a mano alzada en la hoja
// en blanco de la galería. Quedan SOLO en este celular (IndexedDB), y desde
// aquí se pueden mirar en grande, compartir con la familia o borrar.

const Galeria = (function () {
  const $ = (id) => document.getElementById(id);
  const decir = (t) => { if (typeof Voz !== 'undefined') Voz.decir(t); };
  const MAX = 120;

  // ---------- IndexedDB ----------
  let dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('sin IndexedDB')); return; }
      const r = indexedDB.open('ojitos-galeria', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('dibujos', { keyPath: 'id' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbP;
  }
  async function tx(modo, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction('dibujos', modo), s = t.objectStore('dibujos');
      const out = fn(s);
      t.oncomplete = () => res(out && out.result !== undefined ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  const todos = () => tx('readonly', (s) => s.getAll()).then((l) => (l || []).sort((a, b) => b.fecha - a.fecha));
  const borrarUno = (id) => tx('readwrite', (s) => s.delete(id));

  // un dibujo es una imagen (Blob PNG/JPEG); de un SVG se saca la imagen primero
  function svgAImagen(svgTexto, lado) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svgTexto], { type: 'image/svg+xml' }));
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = lado; c.height = lado;
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, lado, lado); x.drawImage(img, 0, 0, lado, lado);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? res(b) : rej(new Error('sin imagen'))), 'image/png');
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
      img.src = url;
    });
  }
  async function guardarBlob(blob, origen) {
    const lista = await todos();
    if (lista.length >= MAX) await borrarUno(lista[lista.length - 1].id); // se va el más antiguo
    await tx('readwrite', (s) => s.put({ id: 'd' + Date.now() + Math.random().toString(36).slice(2, 6), fecha: Date.now(), origen, blob }));
  }
  // desde "Pintar": recibe el <svg> pintado
  async function guardarSvg(svgEl) {
    const clon = svgEl.cloneNode(true);
    clon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clon.querySelectorAll('[class]').forEach((n) => n.removeAttribute('class'));
    const blob = await svgAImagen(new XMLSerializer().serializeToString(clon), 900);
    await guardarBlob(blob, 'pintar');
  }

  // ---------- pantalla ----------
  let urls = [], lista = [], vista = null;
  async function render() {
    urls.forEach((u) => URL.revokeObjectURL(u)); urls = [];
    try { lista = await todos(); } catch (e) { lista = []; }
    $('gaVacio').classList.toggle('hidden', lista.length > 0);
    $('gaGrid').innerHTML = lista.map((d, i) => { const u = URL.createObjectURL(d.blob); urls.push(u); return `<button class="ga-item" data-i="${i}" aria-label="Ver dibujo"><img src="${u}" alt=""></button>`; }).join('');
    $('gaSub').textContent = lista.length ? `${lista.length} dibujo${lista.length === 1 ? '' : 's'} · solo en este celular` : 'Solo en este celular';
  }
  function ver(i) {
    vista = lista[i];
    if (!vista) return;
    $('gaGrandeImg').src = urls[i];
    $('gaFecha').textContent = new Date(vista.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    $('gaBorrar').textContent = '🗑️ Borrar'; $('gaBorrar').classList.remove('confirmar');
    $('gaCompartir').classList.toggle('hidden', !(navigator.canShare && navigator.canShare({ files: [new File([vista.blob], 'dibujo.png', { type: vista.blob.type })] })));
    $('gaGrande').classList.remove('hidden');
  }
  async function compartir() {
    if (!vista) return;
    try { await navigator.share({ files: [new File([vista.blob], 'dibujo-de-mili.png', { type: vista.blob.type })], title: 'Un dibujo de Mili 🎨' }); } catch (e) { /* canceló */ }
  }
  async function borrar() {
    const b = $('gaBorrar');
    if (!b.classList.contains('confirmar')) { b.classList.add('confirmar'); b.textContent = '¿Seguro? Toca otra vez'; return; }
    await borrarUno(vista.id);
    $('gaGrande').classList.add('hidden');
    render();
  }

  // ---------- ✏️ hoja en blanco ----------
  const PALETA = ['#2a2740', '#e5412f', '#f28a2e', '#f2cf5b', '#56b04a', '#3fb8b0', '#4a78c2', '#9b6fd6', '#f28bb0', '#8a5a3a', '#ffffff'];
  let lienzo, ctx, col = PALETA[1], grosor = 12, dib = false, ult = null, rayado = false;
  function abrirHoja() {
    $('gaHoja').classList.remove('hidden');
    lienzo = $('gaLienzo');
    const r = lienzo.parentElement.getBoundingClientRect(), lado = Math.floor(Math.min(r.width, r.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    lienzo.width = lado * dpr; lienzo.height = lado * dpr; lienzo.style.width = lado + 'px'; lienzo.style.height = lado + 'px';
    ctx = lienzo.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, lado, lado);
    rayado = false;
    $('gaPaleta').innerHTML = PALETA.map((c) => `<button class="ta-color${c === col ? ' activo' : ''}" data-c="${c}" style="background:${c}" aria-label="Color"></button>`).join('') +
      [6, 12, 24].map((g) => `<button class="ga-grosor${g === grosor ? ' activo' : ''}" data-g="${g}" aria-label="Grosor"><i style="width:${g}px;height:${g}px"></i></button>`).join('');
    decir('¡Dibuja lo que quieras!');
  }
  const p = (e) => { const r = lienzo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function linea(e) {
    if (!dib) return;
    const [x, y] = p(e);
    ctx.strokeStyle = col; ctx.lineWidth = grosor; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...(ult || [x + 0.1, y])); ctx.lineTo(x, y); ctx.stroke();
    ult = [x, y]; rayado = true;
  }
  async function guardarHoja() {
    if (!rayado) { decir('¡Primero dibuja algo!'); return; }
    const blob = await new Promise((res) => lienzo.toBlob(res, 'image/png'));
    if (blob) await guardarBlob(blob, 'hoja');
    $('gaHoja').classList.add('hidden');
    decir('¡Tu dibujo quedó en tu galería!');
    render();
  }

  let cableado = false;
  function cablear() {
    $('gaCerrar').addEventListener('click', cerrar);
    $('gaGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) ver(Number(b.dataset.i)); });
    $('gaVolver').addEventListener('click', () => $('gaGrande').classList.add('hidden'));
    $('gaCompartir').addEventListener('click', compartir);
    $('gaBorrar').addEventListener('click', borrar);
    $('gaNuevo').addEventListener('click', abrirHoja);
    $('gaHojaCerrar').addEventListener('click', () => $('gaHoja').classList.add('hidden'));
    $('gaHojaGuardar').addEventListener('click', guardarHoja);
    $('gaHojaBorrar').addEventListener('click', () => { const l = lienzo.getBoundingClientRect(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, l.width, l.height); rayado = false; });
    $('gaPaleta').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.c) col = b.dataset.c;
      if (b.dataset.g) grosor = Number(b.dataset.g);
      $('gaPaleta').querySelectorAll('button').forEach((x) => x.classList.toggle('activo', x.dataset.c === col || Number(x.dataset.g) === grosor));
    });
    const l = $('gaLienzo');
    l.addEventListener('pointerdown', (e) => { dib = true; ult = null; l.setPointerCapture(e.pointerId); linea(e); });
    l.addEventListener('pointermove', linea);
    ['pointerup', 'pointercancel'].forEach((t) => l.addEventListener(t, () => { dib = false; ult = null; }));
  }
  function abrir() {
    if (!cableado) { cablear(); cableado = true; }
    $('gaGrande').classList.add('hidden'); $('gaHoja').classList.add('hidden');
    $('galeria').classList.remove('hidden');
    document.body.classList.add('jugando');
    render();
  }
  function cerrar() { $('galeria').classList.add('hidden'); document.body.classList.remove('jugando'); }
  return { abrir, cerrar, guardarSvg };
})();
