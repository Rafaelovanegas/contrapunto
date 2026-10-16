// Reconocimiento de voz del navegador (Web Speech API). Funciona en Chrome y Edge.
// Aviso de privacidad: en Chrome el audio se procesa en servidores del proveedor del navegador.

export function escuchaDisponible() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Crea un oyente. onParcial recibe el texto provisional; onFinal, cada frase confirmada.
 * continuo=true mantiene la escucha (modo en vivo); false se detiene al terminar una frase.
 */
export function crearOyente({ continuo, onParcial, onFinal, onFin, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = 'es-MX';
  rec.interimResults = true;
  rec.continuous = continuo;
  let activo = false;
  let detenidoPorUsuario = false;

  rec.onresult = (ev) => {
    let parcial = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) onFinal && onFinal(r[0].transcript.trim());
      else parcial += r[0].transcript;
    }
    onParcial && onParcial(parcial.trim());
  };
  rec.onerror = (ev) => {
    if (ev.error === 'no-speech' || ev.error === 'aborted') return;
    onError && onError(ev.error === 'not-allowed' ? 'El navegador no tiene permiso para usar el micrófono.' : `Error de reconocimiento de voz: ${ev.error}`);
  };
  rec.onend = () => {
    if (continuo && activo && !detenidoPorUsuario) {
      try { rec.start(); return; } catch { /* reinicio fallido */ }
    }
    activo = false;
    onFin && onFin();
  };

  return {
    iniciar() {
      detenidoPorUsuario = false;
      activo = true;
      try { rec.start(); } catch { /* ya estaba activo */ }
    },
    detener() {
      detenidoPorUsuario = true;
      activo = false;
      try { rec.stop(); } catch { /* no estaba activo */ }
    },
  };
}
