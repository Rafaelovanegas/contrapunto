import { useState } from 'react';
import { prepararInterrogatorio } from '../lib/servicios.js';
import { ErrorCaja, Cargando } from './comunes.jsx';

const ETAPAS = { acreditar: 'Acreditar', situar: 'Situar', narrar: 'Narrar', comprometer: 'Comprometer', 'acreditar-registro': 'Acreditar el registro', confrontar: 'Confrontar', cierre: 'Cierre' };

export default function Preparacion({ ajustes, testigos, documentos, teoria }) {
  const [testigoId, setTestigoId] = useState(testigos[0]?.id || '');
  const testigo = testigos.find((t) => t.id === testigoId);
  const [tipo, setTipo] = useState(testigo?.lado === 'propio' ? 'directo' : 'contra');
  const [resultado, setResultado] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);

  async function generar() {
    setError(null);
    setOcupado(true);
    setResultado(null);
    try {
      const docs = documentos.filter((d) => d.testigoId === testigoId);
      setResultado(await prepararInterrogatorio({ ajustes, tipo, testigo, documentos: docs, teoria }));
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
          <select value={testigoId} onChange={(e) => { const t = testigos.find((x) => x.id === e.target.value); setTestigoId(e.target.value); setTipo(t?.lado === 'propio' ? 'directo' : 'contra'); setResultado(null); }}>
            {testigos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
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
