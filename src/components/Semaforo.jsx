import { teoriaComoTexto } from '../lib/teoria.js';
import { useState } from 'react';
import { DEMO_SEMAFORO } from '../data/caso.js';
import { evaluarPregunta } from '../lib/servicios.js';
import { ChipSemaforo, ErrorCaja, BotonMicrofono, Cargando } from './comunes.jsx';

export default function Semaforo({ ajustes, teoria, testigos }) {
  const [pregunta, setPregunta] = useState('');
  const [modo, setModo] = useState('directo');
  const [historial, setHistorial] = useState([]);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);

  async function evaluar(texto, modoForzado) {
    const q = (texto ?? pregunta).trim();
    if (!q || ocupado) return;
    setError(null);
    setOcupado(true);
    try {
      const m = modoForzado || modo;
      const r = await evaluarPregunta({ ajustes, pregunta: q, modo: m, contexto: teoriaComoTexto(teoria, testigos) });
      setHistorial((h) => [{ id: Date.now(), pregunta: q, modo: m, resultado: r }, ...h]);
      setPregunta('');
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="t-sem">
      <div className="panel__cabeza">
        <h2 id="t-sem">Semáforo de objeciones</h2>
        <p className="nota">Califica una pregunta conforme al art. 373 del CNPP. En el directo, una pregunta sugestiva es objetable; en el contrainterrogatorio, no.</p>
      </div>
      <div className="guion">
        <p className="etiqueta">Ejercicio de la charla</p>
        <div className="guion__botones">
          {DEMO_SEMAFORO.map((d, i) => (
            <button key={i} type="button" className="boton boton--secundario" disabled={ocupado} onClick={() => evaluar(d.pregunta, d.modo)}>{i + 1}. {d.pregunta}</button>
          ))}
        </div>
      </div>
      <form className="pregunta" onSubmit={(e) => { e.preventDefault(); evaluar(); }}>
        <div className="fila">
          <label className="campo">
            <span>¿Quién pregunta?</span>
            <select value={modo} onChange={(e) => setModo(e.target.value)}>
              <option value="directo">Quien ofreció al testigo (directo)</option>
              <option value="contra">La contraparte (contrainterrogatorio)</option>
            </select>
          </label>
        </div>
        <label className="campo campo--ancho">
          <span>Pregunta</span>
          <textarea rows={2} value={pregunta} onChange={(e) => setPregunta(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); evaluar(); } }} />
        </label>
        <div className="pregunta__acciones">
          <BotonMicrofono etiqueta="Dictar pregunta" onTexto={(t) => evaluar(t)} />
          <button type="submit" className="boton boton--primario" disabled={ocupado || !pregunta.trim()}>Calificar</button>
        </div>
      </form>
      {ocupado ? <Cargando texto="Calificando…" /> : null}
      <ErrorCaja error={error} onCerrar={() => setError(null)} />
      <ol className="transcripcion">
        {historial.map((h) => (
          <li key={h.id} className="turno">
            <p className="turno__pregunta"><span className="quien">{h.modo === 'directo' ? 'Directo' : 'Contrainterrogatorio'}</span>{h.pregunta}</p>
            <ChipSemaforo resultado={h.resultado} />
          </li>
        ))}
      </ol>
    </section>
  );
}
