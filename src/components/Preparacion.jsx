import { useState } from 'react';
import { teoriaComoTexto } from '../lib/teoria.js';
import { prepararInterrogatorio } from '../lib/servicios.js';
import { ErrorCaja, Cargando } from './comunes.jsx';

const ETAPAS = { acreditar: 'Acreditar', situar: 'Situar', narrar: 'Narrar', comprometer: 'Comprometer', 'acreditar-registro': 'Acreditar el registro', confrontar: 'Confrontar', cierre: 'Cierre' };

export default function Preparacion({ ajustes, testigos, documentos, teoria, lineaInicial }) {
  const lineaDe = teoria.lineas.find((l) => l.id === lineaInicial);
  const misionInicial = lineaDe?.mision?.[0];
  const [lineaId, setLineaId] = useState(lineaDe ? lineaDe.id : '');
  const [testigoId, setTestigoId] = useState(misionInicial?.testigoId || testigos[0]?.id || '');
  const testigo = testigos.find((t) => t.id === testigoId);
  const [tipo, setTipo] = useState(misionInicial?.tipo || (testigo?.lado === 'propio' ? 'directo' : 'contra'));
  const lineas = [...teoria.lineas].sort((a, b) => a.prioridad - b.prioridad);
  const lineasDelTestigo = lineas.filter((l) => l.mision.some((m) => m.testigoId === testigoId));
  const mision = lineas.find((l) => l.id === lineaId)?.mision.find((m) => m.testigoId === testigoId);

  function elegirLinea(id) {
    setLineaId(id);
    setResultado(null);
    const m = lineas.find((l) => l.id === id)?.mision.find((x) => x.testigoId === testigoId);
    if (m) setTipo(m.tipo);
  }
  const [resultado, setResultado] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);

  async function generar() {
    setError(null);
    setOcupado(true);
    setResultado(null);
    try {
      const docs = documentos.filter((d) => d.testigoId === testigoId);
      setResultado(await prepararInterrogatorio({ ajustes, tipo, testigo, documentos: docs, teoria: teoriaComoTexto(teoria, testigos, lineaId || null) }));
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  }

  function copiar() {
    if (!resultado) return;
    const txt = resultado.preguntas.map((p, i) => `${i + 1}. ${p.pregunta}\n   Objetivo: ${p.objetivo}${p.riesgo ? `\n   Riesgo: ${p.riesgo}` : ''}`).join('\n');
    try { navigator.clipboard.writeText(txt); } catch { /* sin portapapeles */ }
  }

  return (
    <section className="panel" aria-labelledby="t-prep">
      <div className="panel__cabeza">
        <h2 id="t-prep">Preparación</h2>
        <p className="nota">Propone el interrogatorio a partir de la teoría del caso y los registros previos del testigo. Es un borrador: el abogado decide qué preguntas usar.</p>
      </div>
      <div className="fila">
        <label className="campo">
          <span>Testigo</span>
          <select value={testigoId} onChange={(e) => { const t = testigos.find((x) => x.id === e.target.value); setTestigoId(e.target.value); setTipo(t?.lado === 'propio' ? 'directo' : 'contra'); setResultado(null); if (!lineas.some((l) => l.id === lineaId && l.mision.some((m) => m.testigoId === e.target.value))) setLineaId(''); }}>
            {testigos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Línea de defensa</span>
          <select value={lineaId} onChange={(e) => elegirLinea(e.target.value)}>
            <option value="">Toda la teoría del caso</option>
            {lineasDelTestigo.map((l) => <option key={l.id} value={l.id}>{l.prioridad}. {l.titulo}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="directo">Interrogatorio directo</option>
            <option value="contra">Contrainterrogatorio</option>
          </select>
        </label>
        <button type="button" className="boton boton--primario" onClick={generar} disabled={ocupado}>Generar propuesta</button>
      </div>
      {mision ? <p className="aviso aviso--legal"><strong>Misión de este interrogatorio:</strong> {mision.objetivo}</p> : null}
      {ocupado ? <Cargando texto="Preparando el interrogatorio…" /> : null}
      <ErrorCaja error={error} onCerrar={() => setError(null)} />
      {resultado ? (
        <>
          {resultado.demo ? <p className="aviso">Modo demostración: propuesta precargada para el caso ficticio.</p> : null}
          <ol className="lista-preguntas">
            {resultado.preguntas.map((p, i) => (
              <li key={i}>
                <p className="lista-preguntas__q">{p.pregunta}</p>
                <p className="nota">{ETAPAS[p.etapa] || p.etapa} · {p.objetivo}</p>
                {p.riesgo ? <p className="nota nota--riesgo">Riesgo: {p.riesgo}</p> : null}
              </li>
            ))}
          </ol>
          <button type="button" className="boton boton--secundario" onClick={copiar}>Copiar al portapapeles</button>
        </>
      ) : null}
    </section>
  );
}
