import { ELEVEN_TTS_URL, ELEVEN_VOICES_URL, ELEVEN_MODELO_TTS } from '../config.js';

let audioActual = null;

export function detenerVoz() {
  try {
    if (audioActual) {
      audioActual.pause();
      audioActual = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch {
    /* nada que detener */
  }
}

/** Voz del navegador (plan B, sin llaves). */
function hablarNavegador(texto) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve({ motor: 'ninguno' });
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-MX';
    const voces = window.speechSynthesis.getVoices();
    const v = voces.find((x) => x.lang === 'es-MX') || voces.find((x) => x.lang && x.lang.startsWith('es'));
    if (v) u.voice = v;
    u.rate = 1;
    let listo = false;
    const fin = () => { if (!listo) { listo = true; resolve({ motor: 'navegador' }); } };
    u.onend = fin;
    u.onerror = fin;
    // Algunos navegadores nunca disparan onend: límite de seguridad.
    setTimeout(fin, Math.max(4000, texto.length * 90));
    window.speechSynthesis.speak(u);
  });
}

/**
 * Habla con ElevenLabs si hay llave y voz; si falla, usa la voz del navegador y avisa.
 * Devuelve { motor, aviso? }.
 */
export async function hablar(texto, { llaveEleven, vozId, usarEleven }) {
  detenerVoz();
  if (usarEleven && llaveEleven && vozId) {
    try {
      const res = await fetch(`${ELEVEN_TTS_URL}${encodeURIComponent(vozId)}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'xi-api-key': llaveEleven, accept: 'audio/mpeg' },
        body: JSON.stringify({ text: texto, model_id: ELEVEN_MODELO_TTS, language_code: 'es' }),
      });
      if (!res.ok) {
        const cuerpo = await res.text();
        throw new Error(`ElevenLabs ${res.status}: ${cuerpo.slice(0, 300)}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      await new Promise((resolve) => {
        const a = new Audio(url);
        audioActual = a;
        a.onended = () => { URL.revokeObjectURL(url); resolve(); };
        a.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        a.play().catch(() => resolve());
      });
      return { motor: 'elevenlabs' };
    } catch (e) {
      const r = await hablarNavegador(texto);
      return { ...r, aviso: `No se pudo usar ElevenLabs (${e.message}). Se usó la voz del navegador.` };
    }
  }
  return hablarNavegador(texto);
}

export async function listarVocesEleven(llave) {
  const res = await fetch(ELEVEN_VOICES_URL, { headers: { 'xi-api-key': llave } });
  const cuerpo = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${cuerpo.slice(0, 300)}`);
  const data = JSON.parse(cuerpo);
  return (data.voices || []).map((v) => ({ id: v.voice_id, nombre: v.name, etiquetas: v.labels || {} }));
}
