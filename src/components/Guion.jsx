import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CHARLA from '../data/guion.json';
import MARCO from '../data/marco.json';

// La charla (nueve bloques) y, al final, el anexo con el marco jurídico.
const GUION = [...CHARLA, MARCO];
const DECK_URL = 'https://claude.ai/artifact/TBxQ7MmCYfPyziaWZ598YM';
import { leer, guardar } from '../lib/storage.js';
import { fragmentosDe, duracionEstimada } from '../lib/lector.js';

const VELOCIDADES = [0.8, 0.9, 1, 1.1, 1.25, 1.5];
const PREFS_INICIALES = { velocidad: 1, incluirEscena: false, continuar: true, vozNombre: '', conduccion: false };

function minutosTexto(seg) {
  const m = Math.max(1, Math.round(seg / 60));
  return `${m} min de audio`;
}

export default function Guion() {
  const hayVoz = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [prefs, setPrefs] = useState(() => ({ ...PREFS_INICIALES, ...leer('guionPrefs', {}) }));
  const [pos, setPos] = useState(() => ({ cap: 0, frag: 0, ...leer('guionPos', {}) }));
  const [sonando, setSonando] = useState(false);
  const [voces, setVoces] = useState([]);
  const [fallo, setFallo] = useState('');
  const fallos = useRef(0);

  const turno = useRef(0);
  const vigilante = useRef(null);
  const candado = useRef(null);
  const actual = useRef(null);

  useEffect(() => { guardar('guionPrefs', prefs); }, [prefs]);
  useEffect(() => { guardar('guionPos', pos); }, [pos]);

  const fragmentosPorCap = useMemo(
    () => GUION.map((c) => fragmentosDe(c, { incluirEscena: prefs.incluirEscena })),
    [prefs.incluirEscena]
  );
  const cap = Math.min(pos.cap, GUION.length - 1);
  const frags = fragmentosPorCap[cap];
  const frag = Math.min(pos.frag, frags.length - 1);

  // Voces disponibles en el navegador (en español).
  useEffect(() => {
    if (!hayVoz) return undefined;
    const cargar = () => setVoces(window.speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('es')));
    cargar();
    window.speechSynthesis.addEventListener?.('voiceschanged', cargar);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', cargar);
  }, [hayVoz]);

  const vozElegida = useMemo(() => {
    if (!voces.length) return null;
    return voces.find((v) => v.name === prefs.vozNombre)
      || voces.find((v) => v.lang.toLowerCase() === 'es-mx')
      || voces.find((v) => v.lang.toLowerCase().startsWith('es-us'))
      || voces[0];
  }, [voces, prefs.vozNombre]);

  // Mantener la pantalla encendida mientras suena (si el navegador lo permite).
  const pedirCandado = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !candado.current) {
        candado.current = await navigator.wakeLock.request('screen');
        candado.current.addEventListener?.('release', () => { candado.current = null; });
      }
    } catch { /* el navegador lo rechazó: se sigue sin candado */ }
  }, []);
  const soltarCandado = useCallback(() => {
    try { candado.current?.release(); } catch { /* sin efecto */ }
    candado.current = null;
  }, []);

  const detener = useCallback(() => {
    turno.current += 1;
    clearTimeout(vigilante.current);
    if (hayVoz) window.speechSynthesis.cancel();
    setSonando(false);
    soltarCandado();
  }, [hayVoz, soltarCandado]);

  const decir = useCallback((c, f) => {
    if (!hayVoz) return;
    const lista = fragmentosPorCap[c];
    if (!lista || !lista[f]) { detener(); return; }
    const mio = ++turno.current;
    clearTimeout(vigilante.current);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(lista[f].texto);
    u.lang = vozElegida?.lang || 'es-MX';
    if (vozElegida) u.voice = vozElegida;
    u.rate = prefs.velocidad;
    actual.current = { c, f };

    const avanzar = () => {
      if (mio !== turno.current) return;
      clearTimeout(vigilante.current);
      let nc = c;
      let nf = f + 1;
      if (nf >= lista.length) {
        if (!prefs.continuar || c + 1 >= GUION.length) {
          setPos({ cap: c, frag: lista.length - 1 });
          detener();
          return;
        }
        nc = c + 1;
        nf = 0;
      }
      setPos({ cap: nc, frag: nf });
      // Pausa breve entre fragmentos; más larga entre capítulos.
      setTimeout(() => { if (mio === turno.current) decir(nc, nf); }, nc !== c ? 1500 : 250);
    };
    u.onend = () => { fallos.current = 0; avanzar(); };
    u.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled' || mio !== turno.current) return;
      fallos.current += 1;
      if (fallos.current >= 2) {
        setFallo('La voz del navegador no respondió. Revisa el volumen, que el teléfono tenga voces en español instaladas, o prueba otro navegador.');
        detener();
        return;
      }
      setTimeout(() => { if (mio === turno.current) decir(c, f); }, 600);
    };
    // Vigilante: algunos navegadores no disparan onend.
    vigilante.current = setTimeout(avanzar, Math.max(5000, (lista[f].texto.length * 110) / prefs.velocidad + 2500));
    window.speechSynthesis.speak(u);
  }, [hayVoz, fragmentosPorCap, vozElegida, prefs.velocidad, prefs.continuar, detener]);

  function reproducir() {
    setFallo('');
    fallos.current = 0;
    setSonando(true);
    pedirCandado();
    decir(cap, frag);
  }

  function ir(c, f) {
    const nc = Math.max(0, Math.min(GUION.length - 1, c));
    const nf = Math.max(0, Math.min(fragmentosPorCap[nc].length - 1, f));
    setPos({ cap: nc, frag: nf });
    if (sonando) decir(nc, nf);
  }

  // Al cambiar velocidad, voz u opciones mientras suena, reanudar desde el fragmento actual.
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    if (sonando) decir(cap, frag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.velocidad, prefs.vozNombre, prefs.incluirEscena]);

  // Recuperar el candado de pantalla al volver a la app.
  useEffect(() => {
    const alVolver = () => { if (document.visibilityState === 'visible' && sonando) pedirCandado(); };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [sonando, pedirCandado]);

  // Al salir de la pestaña, callar.
  useEffect(() => () => { turno.current += 1; clearTimeout(vigilante.current); if (hayVoz) window.speechSynthesis.cancel(); soltarCandado(); }, [hayVoz, soltarCandado]);

  // Seguir con la vista el fragmento que suena.
  const refActual = useRef(null);
  useEffect(() => {
    if (!prefs.conduccion) refActual.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [cap, frag, prefs.conduccion]);

  const set = (cambios) => setPrefs((p) => ({ ...p, ...cambios }));
  const totalMin = GUION.reduce((s, c) => s + (c.min || 0), 0);

  if (!hayVoz) {
    return (
      <section className="panel">
        <div className="panel__cabeza"><h2>Guion</h2></div>
        <p className="aviso">Este navegador no tiene lectura en voz alta. Usa Chrome, Edge o Safari actualizados.</p>
      </section>
    );
  }

  const controles = (
    <div className={`lector__controles ${prefs.conduccion ? 'lector__controles--grandes' : ''}`}>
      <button type="button" className="boton boton--secundario" onClick={() => ir(cap - 1, 0)} disabled={cap === 0} aria-label="Capítulo anterior">Cap. anterior</button>
      <button type="button" className="boton boton--secundario" onClick={() => ir(cap, frag - 1)} disabled={frag === 0} aria-label="Fragmento anterior">Atrás</button>
      {sonando
        ? <button type="button" className="boton boton--primario lector__principal" onClick={detener}>Pausa</button>
        : <button type="button" className="boton boton--primario lector__principal" onClick={reproducir}>Reproducir</button>}
      <button type="button" className="boton boton--secundario" onClick={() => ir(cap, frag + 1)} disabled={frag >= frags.length - 1} aria-label="Fragmento siguiente">Adelante</button>
      <button type="button" className="boton boton--secundario" onClick={() => ir(cap + 1, 0)} disabled={cap >= GUION.length - 1} aria-label="Capítulo siguiente">Cap. siguiente</button>
    </div>
  );

  return (
    <section className="panel" aria-labelledby="t-guion">
      <div className="panel__cabeza">
        <h2 id="t-guion">Guion de la charla</h2>
        {prefs.conduccion ? null : <p className="nota">Nueve capítulos, {totalMin} minutos de exposición, más el anexo con el marco jurídico. Escúchalo para estudiar y repasar. Material de uso personal: contiene notas internas y el guion del testigo.</p>}
        {prefs.conduccion ? null : <p className="nota"><a href={DECK_URL} target="_blank" rel="noopener noreferrer">Abrir las diapositivas de la charla</a> (se abren en Claude con tu cuenta).</p>}
      </div>

      <p className="aviso aviso--legal"><strong>En el vehículo:</strong> elige el capítulo y pulsa Reproducir antes de arrancar; no manipules el teléfono mientras conduces. Deja la pantalla encendida y la app al frente: si el teléfono se bloquea o cambias de app, la lectura se detiene.</p>

      <div className="lector">
        <p className="etiqueta">{GUION[cap].anexo ? 'Anexo' : `Capítulo ${GUION[cap].n} de ${CHARLA.length}`} · fragmento {frag + 1} de {frags.length}</p>
        <h3 className="lector__titulo">{GUION[cap].titulo}</h3>
        {prefs.conduccion ? <p className="lector__frase">{frags[frag]?.texto}</p> : null}
        {controles}
        {fallo ? <p className="aviso" role="alert">{fallo}</p> : null}
        <div className="fila lector__opciones">
          <label className="campo campo--chico">
            <span>Velocidad</span>
            <select value={prefs.velocidad} onChange={(e) => set({ velocidad: Number(e.target.value) })}>
              {VELOCIDADES.map((v) => <option key={v} value={v}>{v}×</option>)}
            </select>
          </label>
          {voces.length > 1 ? (
            <label className="campo">
              <span>Voz</span>
              <select value={vozElegida?.name || ''} onChange={(e) => set({ vozNombre: e.target.value })}>
                {voces.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
              </select>
            </label>
          ) : null}
        </div>
        <label className="interruptor"><input type="checkbox" checked={prefs.conduccion} onChange={(e) => set({ conduccion: e.target.checked })} /><span><strong>Modo conducción:</strong> botones grandes y solo la frase en curso.</span></label>
        <label className="interruptor"><input type="checkbox" checked={prefs.continuar} onChange={(e) => set({ continuar: e.target.checked })} /><span>Al terminar un capítulo, seguir con el siguiente.</span></label>
        <label className="interruptor"><input type="checkbox" checked={prefs.incluirEscena} onChange={(e) => set({ incluirEscena: e.target.checked })} /><span>Leer también las indicaciones de escena (diapositivas, pausas, notas).</span></label>
      </div>

      {!prefs.conduccion ? (
        <>
          <h3>Capítulos</h3>
          <ol className="capitulos">
            {GUION.map((c, i) => (
              <li key={c.n}>
                <button type="button" className={`capitulo ${i === cap ? 'capitulo--activo' : ''}`} onClick={() => ir(i, 0)}>
                  <span className="capitulo__n">{c.anexo ? 'A' : c.n}</span>
                  <span className="capitulo__titulo">{c.titulo}</span>
                  <span className="nota">{c.anexo ? 'Texto de las normas · verificar antes de citar' : `${c.min} min en la charla`} · {minutosTexto(duracionEstimada(fragmentosPorCap[i], prefs.velocidad))}</span>
                </button>
              </li>
            ))}
          </ol>

          <h3>{GUION[cap].anexo ? 'Texto del anexo' : `Texto del capítulo ${GUION[cap].n}`}</h3>
          <div className="texto-guion">
            {frags.map((f, i) => (
              <p
                key={i}
                ref={i === frag ? refActual : null}
                className={`frag frag--${f.tipo} ${i === frag ? 'frag--actual' : ''}`}
                onClick={() => ir(cap, i)}
              >
                {f.texto}
              </p>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
