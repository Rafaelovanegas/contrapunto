import { useEffect, useRef, useState } from 'react';
import { crearOyente, escuchaDisponible } from '../lib/escucha.js';
import { detectarContradiccion } from '../lib/servicios.js';
import { AlertaContradiccion, AvisoDescarte, ErrorCaja } from './comunes.jsx';

/** Modo presencial: escucha a un testigo humano y busca contradicciones con sus registros previos. */
export default function EnVivo({ ajustes, testigos, documentos }) {
  const [testigoId, setTestigoId] = useState(testigos[0]?.id || '');
  const [escuchando, setEscuchando] = useState(false);
  const [parcial, setParcial] = useState('');
  const [frases, setFrases] = useState([]);
  const [manual, setManual] = useState('');
  const [error, setError] = useState(null);
  const oyente = useRef(null);
  const testigo = testigos.find((t) => t.id === testigoId);
  const docs = documentos.filter((d) => d.testigoId === testigoId);

  useEffect(() => () => oyente.current && oyente.current.detener(), []);

  async function analizar(texto) {
    const id = Date.now() + Math.random();
    setFrases((f) => [{ id, texto, estado: 'analizando' }, ...f]);
    try {
      if (ajustes.modoDemo) throw new Error('El modo en vivo necesita la IA: desactiva el modo demostración y agrega tu llave en Ajustes.');
      const v = await detectarContradiccion({ ajustes, testigo, dichoHoy: texto, pregunta: '', documentos: docs });
      setFrases((f) => f.map((x) => (x.id === id ? { ...x, estado: 'listo', alerta: v.alerta, descarte: v.descartada ? v.razon : null } : x)));
    } catch (e) {
      setError(e);
      setFrases((f) => f.map((x) => (x.id === id ? { ...x, estado: 'error' } : x)));
    }
  }

  function alternar() {
    if (escuchando) {
      oyente.current && oyente.current.detener();
      setEscuchando(false);
      return;
    }
    setError(null);
    oyente.current = crearOyente({
      continuo: true,
      onParcial: setParcial,
      onFinal: (t) => { setParcial(''); if (t.split(' ').length >= 3) analizar(t); },
      onFin: () => setEscuchando(false),
      onError: (m) => setError(new Error(m)),
    });
    oyente.current.iniciar();
    setEscuchando(true);
  }

  return (
    <section className="panel" aria-labelledby="t-vivo">
      <div className="panel__cabeza">
        <h2 id="t-vivo">Escucha en vivo</h2>
        <p className="nota">Para la versión presencial: un voluntario declara como testigo y la app compara cada frase con sus registros previos. En una audiencia real, esta herramienta sirve para preparar, no para usarse en la sala sin autorización.</p>
      </div>
      <div className="fila">
        <label className="campo">
          <span>Testigo que declara</span>
          <select value={testigoId} onChange={(e) => setTestigoId(e.target.value)}>
            {testigos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        {escuchaDisponible() ? (
          <button type="button" className={`boton ${escuchando ? 'boton--grabando' : 'boton--primario'}`} onClick={alternar} aria-pressed={escuchando}>{escuchando ? 'Detener escucha' : 'Iniciar escucha'}</button>
        ) : <p className="nota">La escucha requiere Chrome o Edge.</p>}
      </div>
      <p className="nota">Aviso: en Chrome, el reconocimiento de voz procesa el audio en servidores del proveedor del navegador.</p>
      {parcial ? <p className="parcial">{parcial}</p> : null}
      <form className="pregunta" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { analizar(manual.trim()); setManual(''); } }}>
        <label className="campo campo--ancho"><span>O escribe lo que declaró el testigo</span><input value={manual} onChange={(e) => setManual(e.target.value)} /></label>
        <button type="submit" className="boton boton--secundario">Analizar</button>
      </form>
      <ErrorCaja error={error} onCerrar={() => setError(null)} />
      <ol className="transcripcion" aria-live="polite">
        {frases.map((f) => (
          <li key={f.id} className="turno">
            <p className="turno__respuesta"><span className="quien">{testigo?.nombre}</span>{f.texto}</p>
            {f.estado === 'analizando' ? <p className="nota">Comparando…</p> : null}
            <AlertaContradiccion alerta={f.alerta} />
            {f.descarte ? <AvisoDescarte razon={f.descarte} /> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
