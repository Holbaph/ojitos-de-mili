// clima.js — 🌦️ Mili se viste según el tiempo que hace donde está la familia:
// con frío se abriga (abrigo, gorro y botas), si llueve se pone botas de lluvia
// e impermeable, con calor se saca la chaqueta y se pone lentes de sol y jockey.
// Es solo para el avatar de la pantalla principal: no cambia la ropa guardada.
//
// Se activa en Configuración → ✨ Mili (en cada dispositivo). Pide permiso de
// ubicación; a Open-Meteo (servicio de clima gratis, sin cuenta) se le manda
// solo la ubicación APROXIMADA (redondeada a ~10 km), nunca la exacta.

const Clima = (function () {
  const ACTIVO = 'ojitos-clima-activo', CACHE = 'ojitos-clima', VIGENCIA = 45 * 60 * 1000;
  const leer = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const activo = () => leer(ACTIVO) === '1';
  function setActivo(v) { escribir(ACTIVO, v ? '1' : '0'); }

  function ubicacion() {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) { rej(new Error('sin ubicación')); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: Math.round(p.coords.latitude * 10) / 10, lon: Math.round(p.coords.longitude * 10) / 10 }),
        (e) => rej(e), { enableHighAccuracy: false, timeout: 12000, maximumAge: 60 * 60 * 1000 });
    });
  }
  // { t: °C, codigo: código WMO, dia: true/false, ts }
  async function obtener(forzar) {
    if (!forzar) {
      try { const c = JSON.parse(leer(CACHE)); if (c && Date.now() - c.ts < VIGENCIA) return c; } catch (e) {}
    }
    const { lat, lon } = await ubicacion();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('sin clima');
    const j = await r.json();
    const cur = j.current || {};
    const c = { t: Math.round(Number(cur.temperature_2m)), codigo: Number(cur.weather_code) || 0, dia: cur.is_day !== 0, ts: Date.now() };
    if (!isFinite(c.t)) throw new Error('sin clima');
    escribir(CACHE, JSON.stringify(c));
    return c;
  }

  const LLUVIA = (k) => (k >= 51 && k <= 67) || (k >= 80 && k <= 82) || k >= 95;
  const NIEVE = (k) => (k >= 71 && k <= 77) || k === 85 || k === 86;
  function tipo(c) {
    if (NIEVE(c.codigo)) return 'nieve';
    if (LLUVIA(c.codigo)) return 'lluvia';
    if (c.t < 12) return 'frio';
    if (c.t < 18) return 'fresco';
    if (c.t >= 27) return 'calor';
    return 'templado';
  }
  function icono(c) {
    if (NIEVE(c.codigo)) return '❄️';
    if (c.codigo >= 95) return '⛈️';
    if (LLUVIA(c.codigo)) return '🌧️';
    if (c.codigo === 45 || c.codigo === 48) return '🌫️';
    if (c.codigo >= 1 && c.codigo <= 3) return c.dia ? '⛅' : '☁️';
    return c.dia ? '☀️' : '🌙';
  }
  const FRASE = {
    nieve: '¡Está nevando! Me abrigué mucho ❄️', frio: '¡Hace frío! Me abrigué 🧣', fresco: 'Está fresquito, me puse chaqueta 🧥',
    lluvia: '¡Está lloviendo! Me puse mis botas 🌧️', calor: '¡Qué calor! Me puse lentes de sol 😎', templado: '¡Qué rico día! ☀️',
  };

  // la apariencia de Mili con la ropita de la estación (sin tocar la original)
  function vestir(ap, c) {
    const a = { ...ap };
    switch (tipo(c)) {
      case 'nieve': case 'frio':
        Object.assign(a, { encima: 'abrigo', encimaColor: '#c9503a', sombrero: 'gorro-lana', sombreroColor: '#4a78c2', zapatos: 'botas', zapatosColor: '#8a5a3a' });
        break;
      case 'fresco':
        Object.assign(a, { encima: 'chaqueta', encimaColor: '#7cc4ea' });
        if (a.zapatos === 'sandalias') Object.assign(a, { zapatos: 'zapatillas', zapatosColor: '#f7f5f2' });
        break;
      case 'lluvia':
        Object.assign(a, { encima: 'abrigo', encimaColor: '#f2cf5b', zapatos: 'botas-lluvia', zapatosColor: '#f2cf5b' });
        break;
      case 'calor':
        Object.assign(a, { encima: 'ninguno', sombrero: 'jockey', sombreroColor: '#f28bb0', lentes: 'lentes', lentesColor: '#3a3540', zapatos: 'sandalias', zapatosColor: '#c96f8f' });
        break;
    }
    return a;
  }
  const texto = (c) => `${icono(c)} ${c.t}°`;
  const frase = (c) => FRASE[tipo(c)];
  return { activo, setActivo, obtener, vestir, texto, frase, tipo };
})();
