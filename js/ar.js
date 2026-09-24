// ar.js — realidad aumentada en la cámara: el avatar "interactúa" con quien
// sale en la foto (lo abraza por detrás, le hace orejas de conejo, le pone una
// mano en el hombro, una corona, o le da un besito).
//
// Cómo: PoseLandmarker de MediaPipe (corre en el celular; la imagen no sale
// del dispositivo) entrega dónde están la cabeza, las orejas y los hombros, y
// además la SILUETA de la persona. Con eso se pinta en capas sobre un canvas:
//   1) el video;
//   2) una "capa de atrás" con el avatar y su brazo, a la que se le borra lo
//      que tapa la persona (así el brazo pasa por DETRÁS de ella);
//   3) lo que va por delante: la mano en el hombro, la corona, los corazones.
// La foto es ese mismo canvas.

const RA = (function () {
  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODELO = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
  const EFECTOS = [
    { v: 'abrazo', n: '🤗 Abrazo' }, { v: 'conejito', n: '🐰 Conejito' }, { v: 'hombro', n: '🤝 En el hombro' },
    { v: 'corona', n: '👑 Corona para ti' }, { v: 'besito', n: '😘 Besito' },
  ];

  let detector = null, cargando = null;
  let delegado = 'GPU', siluetasVacias = 0; // en algunos equipos la GPU entrega la silueta vacía: se pasa a CPU
  // cfg = { fuente (video o imagen), canvas, espejo, efecto, dibujar(o) -> SVG,
  //         parche, brazo: { piel, contorno, manga }, alEstado(texto) }
  let cfg = null;
  let activo = false, raf = null, ultimoDetectar = 0, ultimoEstado = '';
  let datos = null;           // { lm } de la última persona encontrada
  let suave = null;           // posiciones suavizadas (para que no tiemble)
  let lado = 1;               // 1: el avatar va a la derecha de la persona; -1: a la izquierda
  const img = {};             // avatar ya convertido a imagen, por variante
  const det = document.createElement('canvas');      // cuadro chico para la IA
  const mascara = document.createElement('canvas');  // silueta de la persona
  const capa = document.createElement('canvas');     // capa de atrás

  // ---------- cargar la IA ----------
  async function crear(conDelegado) {
    const { FilesetResolver, PoseLandmarker } = await import(MP + '/vision_bundle.mjs');
    const vision = await FilesetResolver.forVisionTasks(MP + '/wasm');
    return PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODELO, delegate: conDelegado },
      runningMode: 'VIDEO', numPoses: 1, outputSegmentationMasks: true,
    });
  }
  async function cargar() {
    if (detector) return detector;
    if (!cargando) {
      cargando = (async () => {
        try { detector = await crear('GPU'); delegado = 'GPU'; }
        catch (e) { detector = await crear('CPU'); delegado = 'CPU'; }
        return detector;
      })();
      cargando.catch(() => { cargando = null; });
    }
    return cargando;
  }
  let pasandoACPU = false;
  async function pasarACPU() {
    if (pasandoACPU || delegado === 'CPU') return;
    pasandoACPU = true;
    try { const nuevo = await crear('CPU'); if (detector && detector.close) detector.close(); detector = nuevo; delegado = 'CPU'; }
    catch (e) { /* sigue con lo que había */ }
    pasandoACPU = false;
  }

  // ---------- el avatar como imagen ----------
  function aImagen(interior, viewBox, w, h) {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${interior}</svg>`;
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
      const i = new Image();
      i.onload = () => { URL.revokeObjectURL(url); resolve(i); };
      i.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      i.src = url;
    });
  }
  async function prepararAvatar() {
    const d = (o) => aImagen(cfg.dibujar({ parche: cfg.parche, ...o }), '0 0 320 440', 640, 880);
    const [a, b, c, e, f] = await Promise.all([
      d({ sinBrazo: 'izq' }), d({ sinBrazo: 'der' }), d({ pose: 'hurra' }), d({ pose: 'corazon' }),
      aImagen(Vestuario.sombrero({ t: 'corona', c: '#e2b64a' }), '98 12 124 76', 372, 228),
    ]);
    Object.assign(img, { 'sin-izq': a, 'sin-der': b, hurra: c, corazon: e, corona: f });
  }

  // ---------- IA: persona y silueta ----------
  function medidas(f) { return f.videoWidth ? [f.videoWidth, f.videoHeight] : [f.naturalWidth || f.width, f.naturalHeight || f.height]; }

  function detectar() {
    const [vw, vh] = medidas(cfg.fuente);
    if (!vw) return;
    det.width = 256; det.height = Math.round(256 * vh / vw);
    det.getContext('2d').drawImage(cfg.fuente, 0, 0, det.width, det.height);
    try {
      detector.detectForVideo(det, performance.now(), (r) => {
        if (!r.landmarks || !r.landmarks.length) { datos = null; return; }
        const lm = r.landmarks[0].map((p) => ({ x: p.x, y: p.y, v: p.visibility == null ? 1 : p.visibility }));
        const m = r.segmentationMasks && r.segmentationMasks[0];
        let hay = false;
        if (m) {
          const f = m.getAsFloat32Array();
          mascara.width = m.width; mascara.height = m.height;
          const mctx = mascara.getContext('2d');
          const id = mctx.createImageData(m.width, m.height);
          for (let i = 0; i < f.length; i++) {
            const a = Math.max(0, Math.min(1, (f[i] - 0.35) / 0.3));
            if (a > 0) hay = true;
            id.data[i * 4 + 3] = a * 255;
          }
          mctx.putImageData(id, 0, 0);
        }
        // hay persona pero la silueta vino vacía: con la GPU pasa en algunos equipos
        siluetasVacias = hay ? 0 : siluetasVacias + 1;
        if (siluetasVacias >= 3) pasarACPU();
        datos = { lm, conMascara: hay };
      });
    } catch (e) { /* un cuadro que falla no importa */ }
  }

  // ---------- dibujo ----------
  function estado(texto) { if (texto !== ultimoEstado) { ultimoEstado = texto; if (cfg.alEstado) cfg.alEstado(texto); } }
  const mezcla = (a, b, t) => a + (b - a) * t;
  const punto = (a, b, t) => ({ x: mezcla(a.x, b.x, t), y: mezcla(a.y, b.y, t) });

  // brazo del avatar (curva hombro -> mano), con manga y mano
  function brazo(ctx, de, ctrl, a, esc, conMano) {
    const b = cfg.brazo;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const curva = (hasta) => {
      // tramo de la curva cuadrática de 0 a `hasta` (de Casteljau)
      const p1 = punto(de, ctrl, hasta), p01 = punto(ctrl, a, hasta), fin = punto(p1, p01, hasta);
      ctx.beginPath(); ctx.moveTo(de.x, de.y); ctx.quadraticCurveTo(p1.x, p1.y, fin.x, fin.y);
    };
    curva(1); ctx.strokeStyle = b.contorno; ctx.lineWidth = 17.5 * esc; ctx.stroke();
    ctx.strokeStyle = b.piel; ctx.lineWidth = 15 * esc; ctx.stroke();
    if (b.manga) {
      ctx.fillStyle = b.manga.c; ctx.strokeStyle = b.manga.c;
      if (b.manga.tipo === 'larga' || b.manga.tipo === 'velo') {
        ctx.globalAlpha = b.manga.tipo === 'velo' ? 0.75 : 1;
        curva(0.85); ctx.lineWidth = 18 * esc; ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(de.x, de.y, (b.manga.tipo === 'globo' ? 20 : 15) * esc, (b.manga.tipo === 'globo' ? 16 : 13) * esc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (conMano) mano(ctx, a, esc);
    ctx.restore();
  }
  function mano(ctx, p, esc, dedos) {
    const b = cfg.brazo;
    ctx.save();
    ctx.fillStyle = b.piel; ctx.strokeStyle = b.contorno; ctx.lineWidth = 1.4 * esc;
    ctx.beginPath(); ctx.arc(p.x, p.y, 10 * esc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (dedos) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.ellipse(p.x + i * 6 * esc, p.y + 8 * esc, 3.4 * esc, 5.5 * esc, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function corazon(ctx, x, y, r, color, alfa) {
    ctx.save(); ctx.globalAlpha = alfa; ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y + r);
    ctx.bezierCurveTo(x - r * 1.3, y + r * 0.2, x - r * 1.2, y - r, x, y - r * 0.5);
    ctx.bezierCurveTo(x + r * 1.2, y - r, x + r * 1.3, y + r * 0.2, x, y + r);
    ctx.fill(); ctx.restore();
  }

  function dibujar(t) {
    const cv = cfg.canvas, ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const [vw, vh] = medidas(cfg.fuente);
    if (!vw || !W) return;
    const k = Math.max(W / vw, H / vh), dw = vw * k, dh = vh * k, ox = (W - dw) / 2, oy = (H - dh) / 2;
    const conEspejo = (c, fn) => { c.save(); if (cfg.espejo) { c.translate(W, 0); c.scale(-1, 1); } fn(); c.restore(); };

    // 1) el video
    ctx.clearRect(0, 0, W, H);
    conEspejo(ctx, () => ctx.drawImage(cfg.fuente, ox, oy, dw, dh));
    if (!datos) { estado('🙂 Ponte frente a la cámara, que se te vea la cabeza y los hombros'); return; }
    estado('✨ ¡Listo! Saca la foto');

    // puntos de la persona en la pantalla
    const P = (i) => { const l = datos.lm[i]; let x = ox + l.x * dw; if (cfg.espejo) x = W - x; return { x, y: oy + l.y * dh, v: l.v }; };
    const oA = P(7), oB = P(8), hA = P(11), hB = P(12), nariz = P(0);
    const anchoHombros = Math.hypot(hA.x - hB.x, hA.y - hB.y);
    let anchoCabeza = Math.hypot(oA.x - oB.x, oA.y - oB.y) * 1.35;
    if (anchoCabeza < anchoHombros * 0.3 || oA.v < 0.3 || oB.v < 0.3) anchoCabeza = anchoHombros * 0.5;
    const obj = {
      cx: (oA.x + oB.x) / 2 * 0.6 + nariz.x * 0.4, cy: (oA.y + oB.y) / 2, w: anchoCabeza,
      hAx: hA.x, hAy: hA.y, hBx: hB.x, hBy: hB.y,
    };
    if (!suave) suave = { ...obj };
    Object.keys(obj).forEach((key) => { suave[key] = mezcla(suave[key], obj[key], 0.4); });
    const s = suave;
    // el avatar va hacia donde hay más espacio (con margen para que no salte)
    if (s.cx > W * 0.58) lado = -1; else if (s.cx < W * 0.42) lado = 1;

    const efecto = cfg.efecto;
    // del tamaño de su cabeza, pero sin pasar de ~1/3 del ancho (si la persona está muy cerca)
    const diam = Math.min(s.w * 0.85, W * 0.34);
    const alto = diam * 440 / 236, esc = alto / 440, ancho = 320 * esc;
    let hx, hy;
    if (efecto === 'besito') { hx = s.cx + lado * (s.w * 0.5 + diam * 0.4); hy = s.cy + s.w * 0.08; }
    else if (efecto === 'abrazo') { hx = s.cx + lado * (s.w * 0.5 + diam * 0.55); hy = s.cy + s.w * 0.35; }
    else { hx = s.cx + lado * (s.w * 0.55 + diam * 0.62); hy = s.cy + s.w * 0.35; }
    const bote = Math.sin(t / 320) * 3 * esc;
    // que el avatar no se salga de la imagen (si no hay espacio, queda por delante de la persona)
    hx = Math.min(W - ancho * 0.45, Math.max(ancho * 0.45, hx));
    hy = Math.min(H - alto * 0.35, Math.max(176 * esc * 0.8, hy));
    const ax = hx - 160 * esc, ay = hy - 176 * esc + bote;
    const cercano = lado > 0 ? 'izq' : 'der'; // el brazo del avatar que queda del lado de la persona
    const hombroAv = { x: ax + (cercano === 'izq' ? 118 : 202) * esc, y: ay + 298 * esc };
    const hA2 = { x: s.hAx, y: s.hAy }, hB2 = { x: s.hBx, y: s.hBy };
    const cerca = Math.abs(hA2.x - hombroAv.x) < Math.abs(hB2.x - hombroAv.x) ? hA2 : hB2;
    const lejos = cerca === hA2 ? hB2 : hA2;
    const arribaCabeza = s.cy - s.w * 0.75;

    // 2) capa de atrás: avatar (+ brazo), borrando lo que tapa la persona
    if (capa.width !== W || capa.height !== H) { capa.width = W; capa.height = H; }
    const cc = capa.getContext('2d');
    cc.clearRect(0, 0, W, H);
    const frente = [];
    const dentro = (p) => ({ x: Math.min(W - 12 * esc, Math.max(12 * esc, p.x)), y: Math.min(H - 12 * esc, Math.max(12 * esc, p.y)) });
    if ((efecto === 'abrazo' || efecto === 'hombro' || efecto === 'conejito') && !datos.conMascara) {
      // todavía sin silueta (la IA recién parte): el avatar solo, sin el brazo que va por detrás
      frente.push(() => ctx.drawImage(img.hurra, ax, ay, ancho, alto));
    } else if (efecto === 'abrazo' || efecto === 'hombro' || efecto === 'conejito') {
      // el cuerpo, por delante (el brazo sale de su hombro y se va por detrás de la persona)
      frente.push(() => ctx.drawImage(img['sin-' + cercano], ax, ay, ancho, alto));
      if (efecto === 'abrazo') {
        // por detrás de la espalda, hasta el hombro de más allá
        const a = dentro({ x: lejos.x, y: lejos.y - s.w * 0.12 });
        const ctrl = { x: (hombroAv.x + a.x) / 2, y: Math.max(hombroAv.y, a.y) + s.w * 0.35 };
        brazo(cc, hombroAv, ctrl, a, esc, false);
        frente.push(() => mano(ctx, a, esc * 1.45, true));
      } else if (efecto === 'hombro') {
        const a = dentro({ x: cerca.x - lado * s.w * 0.05, y: cerca.y - s.w * 0.14 });
        const ctrl = { x: (hombroAv.x + a.x) / 2, y: Math.min(hombroAv.y, a.y) - s.w * 0.1 };
        brazo(cc, hombroAv, ctrl, a, esc, false);
        frente.push(() => mano(ctx, a, esc * 1.45, true));
      } else {
        // conejito: la mano detrás de la cabeza y dos dedos asomando arriba
        const a = { x: s.cx + lado * s.w * 0.12, y: arribaCabeza + s.w * 0.25 };
        const ctrl = { x: hombroAv.x + lado * s.w * 0.1, y: a.y };
        brazo(cc, hombroAv, ctrl, a, esc, true);
        const b = cfg.brazo, largo = s.w * 0.62, grosor = 10 * esc;
        [-0.2, 0.2].forEach((ang) => {
          cc.save(); cc.translate(a.x, a.y); cc.rotate(ang);
          cc.fillStyle = b.piel; cc.strokeStyle = b.contorno; cc.lineWidth = 1.4 * esc;
          cc.beginPath(); cc.ellipse(0, -largo / 2, grosor, largo / 2, 0, 0, Math.PI * 2); cc.fill(); cc.stroke();
          cc.restore();
        });
      }
    } else if (efecto === 'corona') {
      frente.push(() => ctx.drawImage(img.hurra, ax, ay, ancho, alto));
      const cw = s.w * 1.0, ch = cw * 76 / 124;
      frente.push(() => ctx.drawImage(img.corona, s.cx - cw / 2, arribaCabeza - ch * 0.55, cw, ch));
    } else { // besito: inclinado hacia la mejilla (detrás de su cara, asomándose)
      cc.save();
      cc.translate(hx, ay + alto); cc.rotate(-lado * 0.16);
      cc.drawImage(img.corazon, ax - hx, -alto, ancho, alto);
      cc.restore();
      frente.push(() => {
        for (let i = 0; i < 3; i++) {
          const fase = ((t / 1400) + i / 3) % 1;
          const x = s.cx + lado * s.w * (0.45 + 0.1 * Math.sin(fase * 6 + i));
          corazon(ctx, x, s.cy - fase * s.w * 0.9, s.w * (0.06 + 0.03 * i), '#e8578a', 1 - fase);
        }
      });
    }
    if (datos.conMascara) {
      cc.globalCompositeOperation = 'destination-out';
      conEspejo(cc, () => cc.drawImage(mascara, ox, oy, dw, dh));
      cc.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(capa, 0, 0);

    // 3) lo de adelante
    frente.forEach((f) => f());
  }

  function bucle(t) {
    if (!activo) return;
    raf = requestAnimationFrame(bucle);
    if (t - ultimoDetectar > 80) { ultimoDetectar = t; detectar(); }
    dibujar(t);
  }

  // ================= API =================
  async function iniciar(c) {
    detener();
    cfg = c; datos = null; suave = null; ultimoEstado = '';
    estado('✨ Preparando la magia… (la primera vez tarda un poquito)');
    await cargar();
    await prepararAvatar();
    activo = true;
    raf = requestAnimationFrame(bucle);
  }
  function detener() { activo = false; cancelAnimationFrame(raf); raf = null; }
  function cambiar(cambios) {
    if (!cfg) return;
    Object.assign(cfg, cambios);
    if ('parche' in cambios) prepararAvatar().catch(() => {});
  }
  // un cuadro "a pedido" (para probar con una imagen fija)
  function dibujarUnaVez(t) { detectar(); dibujar(t || performance.now()); }

  return { EFECTOS, iniciar, detener, cambiar, cargar, dibujarUnaVez, get activo() { return activo; } };
})();
