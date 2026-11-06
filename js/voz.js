// voz.js — 🗣️ la voz de Mili: lee en voz alta lo que dice el avatar, las
// instrucciones y pistas de los juegos, y los cuentos (para una niña que todavía
// no lee). Usa la voz en español del propio celular (speechSynthesis): no se
// envía nada a ningún lado. Se puede apagar en Configuración → ✨ Mili
// (se guarda en este dispositivo).

const Voz = (function () {
  const CLAVE = 'ojitos-voz';
  const ok = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let activa = true, voz = null;
  try { activa = localStorage.getItem(CLAVE) !== '0'; } catch (e) {}

  function elegirVoz() {
    if (!ok) return;
    const vs = speechSynthesis.getVoices();
    voz = vs.find((v) => /^es[-_](CL|419|MX|US|AR|CO)/i.test(v.lang)) || vs.find((v) => /^es/i.test(v.lang)) || null;
  }
  if (ok) { elegirVoz(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', elegirVoz); }

  // sin emojis ni símbolos (la voz los leería en voz alta)
  const limpiar = (t) => String(t || '').replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}️‍]/gu, '').replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();

  // Dice el texto. Devuelve una promesa que termina cuando acaba de hablar.
  function decir(texto, op) {
    op = op || {};
    return new Promise((fin) => {
      const t = limpiar(texto);
      if (!ok || !activa || !t) { fin(); return; }
      try {
        if (!op.enCola) speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(t);
        u.lang = voz ? voz.lang : 'es-CL';
        if (voz) u.voice = voz;
        u.pitch = op.tono || 1.3;   // un poquito aguda, como de niña
        u.rate = op.rapidez || 0.95;
        u.onend = fin; u.onerror = fin;
        speechSynthesis.speak(u);
        setTimeout(fin, 4000 + t.length * 120); // por si el celular no avisa que terminó
      } catch (e) { fin(); }
    });
  }
  function callar() { if (ok) try { speechSynthesis.cancel(); } catch (e) {} }
  function setActiva(v) {
    activa = !!v;
    try { localStorage.setItem(CLAVE, v ? '1' : '0'); } catch (e) {}
    if (!v) callar();
  }
  return { decir, callar, setActiva, activa: () => activa && ok, disponible: () => ok };
})();
