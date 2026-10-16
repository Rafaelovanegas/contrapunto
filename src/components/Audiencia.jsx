import { useState } from 'react';
import { DEMO_CONTRA } from '../data/caso.js';
import { evaluarPregunta, responderTestigo, detectarContradiccion } from '../lib/servicios.js';
import { hablar, detenerVoz } from '../lib/voz.js';
import { ChipSemaforo, AlertaContradiccion, AvisoDescarte, ErrorCaja, BotonMicrofono, Cargando } from './comunes.jsx';

export default function Audiencia({ ajustes, testigos, documentos, teoria }) {
  const [testigoId, setTestigoId] = useState(testigos[0]?.id || '');
  const [modo, setModo] = useState('contra');
  const [pregunta, setPregunta] = useState('');
  const [turnos, setTurnos] = useState([]);
  const [ocupado, setOcupado] = useState('');
  const [error, setError] = useState(null);
  const [avisoVoz, setAvisoVoz] = useState('');
  const [conVoz, setConVoz] = useState(true);

  const testigo = testigos.find((t) => t.id === testigoId);
  const docs = documentos.filter((d) => d.testigoId === testigoId);

  async function preguntar(texto) {
    const q = (texto ?? pregunta).trim();
    if (!q || !testigo || ocupado) return;
    setError(null);
    setAvisoVoz('');
    setOcupado('El testigo responde…');
    const id = Date.now();
    setTurnos((t) => [...t, { id, pregunta: q, respuesta: null, semaforo: null, alerta: null, descarte: null }]);
    setPregunta('');
    try {
      const [semaforo, respuesta] = await Promise.all([
        evaluarPregunta({ ajustes, pregunta: q, modo, contexto: teoria }),
        responderTestigo({ ajustes, testigo, historial: turnos.filter((x) => x.respuesta), pregunta: q }),
      ]);
      setTurnos((t) => t.map((x) => (x.id === id ? { ...x, semaforo, respuesta } : x)));
      setOcupado('Comparando con los registros previos…');
      // La voz corre en paralelo; la alerta no espera a que termine de hablar.
      if (conVoz) {
        hablar(respuesta, { llaveEleven: ajustes.llaveEleven, vozId: ajustes.vozId, usarEleven: ajustes.usarEleven && !ajustes.modoDemo })
          .then((voz) => { if (voz && voz.aviso) setAvisoVoz(voz.aviso); })
          .catch(() => {});
      }
      const verif = await detectarContradiccion({ ajustes, testigo, dichoHoy: respuesta, pregunta: q, documentos: docs });
      setTurnos((t) => t.map((x) => (x.id === id ? { ...x, alerta: verif.alerta, descarte: verif.descartada ? verif.razon : null, sinDocs: verif.sinDocumentos } : x)));
    } catch (e) {
      setError(e);
      setTurnos((t) => t.filter((x) => x.id !== id || x.respuesta));
    } finally {
      setOcupado('');
    }
  }

  return (
    <section className="panel" aria-labelledby="t-audiencia">
      <div className="panel__cabeza">
        <h2 id="t-audiencia">Audiencia simulada</h2>
        <p className="nota">Interroga al testigo de IA. Cada pregunta pasa por el semáforo del art. 373 CNPP y cada respuesta se compara con sus registros previos.</p>
      </div>

      <div className="fila">
        <label className="campo">
          <span>Testigo</span>
          <select value={testigoId} onChange={(e) => { setTestigoId(e.target.value); setTurnos([]); }}>
            {testigos.map((t) => <option key={t.id} value={t.id}>{t.nombre} · {t.rol}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Tipo de interrogatorio</span>
          <select value={modo} onChange={(e) => setModo(e.target.value)}>
            <option value="contra">Contrainterrogatorio</option>
            <option value="directo">Interrogatorio directo</option>
          </select>
        </label>
        <label className="interruptor">
          <input type="checkbox" checked={conVoz} onChange={(e) => { setConVoz(e.target.checked); if (!e.target.checked) detenerVoz(); }} />
          <span>Voz del testigo</span>
        </label>
      </div>
      <p className="nota">Registros previos de este testigo: {docs.length ? docs.map((d) => d.titulo).join(' · ') : 'ninguno (agrega documentos en Expediente)'}</p>

      {ajustes.modoDemo && testigoId === 'ramirez' ? (
        <div className="guion">
          <p className="etiqueta">Guion de demostración (sin conexión)</p>
          <div className="guion__botones">
            {DEMO_CONTRA.map((d, i) => (
              <button key={i} type="button" className="boton boton--secundario" disabled={!!ocupado} onClick={() => preguntar(d.pregunta)}>{d.pregunta}</button>
            ))}
          </div>
        </div>
      ) : null}

      <form className="pregunta" onSubmit={(e) => { e.preventDefault(); preguntar(); }}>
        <label className="campo campo--ancho">
          <span>Tu pregunta</span>
          <textarea rows={2} value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Agente, usted le dijo hoy a este tribunal que…" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); preguntar(); } }} />
        </label>
        <div className="pregunta__acciones">
          <BotonMicrofono etiqueta="Preguntar por voz" onTexto={(t) => preguntar(t)} />
          <button type="submit" className="boton boton--primario" disabled={!!ocupado || !pregunta.trim()}>Preguntar</button>
          <button type="button" className="boton boton--secundario" onClick={() => { detenerVoz(); setTurnos([]); }}>Nueva audiencia</button>
        </div>
      </form>

      <ErrorCaja error={error} onCerrar={() => setError(null)} />
      {avisoVoz ? <p className="aviso">{avisoVoz}</p> : null}
      {ocupado ? <Cargando texto={ocupado} /> : null}

      <ol className="transcripcion" aria-live="polite">
        {[...turnos].reverse().map((t) => (
          <li key={t.id} className="turno">
            <p className="turno__pregunta"><span className="quien">Abogado</span>{t.pregunta}</p>
            <ChipSemaforo resultado={t.semaforo} />
            {t.respuesta ? <p className="turno__respuesta"><span className="quien">{testigo?.nombre || 'Testigo'}</span>{t.respuesta}</p> : null}
            <AlertaContradiccion alerta={t.alerta} />
            {t.descarte ? <AvisoDescarte razon={t.descarte} /> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
