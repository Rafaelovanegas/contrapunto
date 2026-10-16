import { useEffect, useRef, useState } from 'react';
import { POSTURAS, ESTADOS, teoriaComoTexto, nuevoId } from '../lib/teoria.js';
import { proponerTeoria, probarTeoria } from '../lib/servicios.js';
import { ErrorCaja, Cargando } from './comunes.jsx';

const GRAVEDAD = { alta: 'Alta', media: 'Media', baja: 'Baja' };

export default function TeoriaCaso({ ajustes, testigos, documentos, teoria, setTeoria, irA, generarAlEntrar, consumirGenerar }) {
  const [ocupado, setOcupado] = useState(null);
  const [error, setError] = useState(null);
  const [borrador, setBorrador] = useState(null);
  const [estres, setEstres] = useState(null);

  const t = teoria;
  const lanzado = useRef(false);
  useEffect(() => {
    if (generarAlEntrar && !lanzado.current) {
      lanzado.current = true;
      consumirGenerar();
      ejecutar('borrador');
    }
  });
  const set = (campo, valor) => setTeoria((x) => ({ ...x, [campo]: valor }));
  const editarEn = (lista, id, cambios) => setTeoria((x) => ({ ...x, [lista]: x[lista].map((it) => (it.id === id ? { ...it, ...cambios } : it)) }));
  const quitarDe = (lista, id) => setTeoria((x) => ({ ...x, [lista]: x[lista].filter((it) => it.id !== id) }));
  const agregarA = (lista, item) => setTeoria((x) => ({ ...x, [lista]: [...x[lista], item] }));
  const editarMision = (lineaId, i, cambios) => setTeoria((x) => ({ ...x, lineas: x.lineas.map((l) => (l.id === lineaId ? { ...l, mision: l.mision.map((m, j) => (j === i ? { ...m, ...cambios } : m)) } : l)) }));

  const lineas = [...t.lineas].sort((a, b) => a.prioridad - b.prioridad);
  const conteo = {
    acreditada: t.proposiciones.filter((p) => p.estado === 'acreditada').length,
    debil: t.proposiciones.filter((p) => p.estado === 'debil').length,
  };

  async function ejecutar(tipo) {
    setError(null);
    setOcupado(tipo);
    try {
      if (tipo === 'borrador') {
        setBorrador(await proponerTeoria({ ajustes, teoria: t, testigos, documentos }));
      } else {
        setEstres(await probarTeoria({ ajustes, teoriaTexto: teoriaComoTexto(t, testigos), documentos }));
      }
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className="panel" aria-labelledby="t-teoria">
      <div className="panel__cabeza">
        <h2 id="t-teoria">Teoría del caso</h2>
        <p className="nota">Todo interrogatorio parte de aquí. Cada pregunta debe servir a una proposición fáctica, y cada proposición a un elemento que la defensa ataca o reconoce. El abogado decide; la IA solo propone y pone a prueba.</p>
      </div>

      <div className="fila">
        <label className="campo">
          <span>Parte que representamos</span>
          <select value={t.parte} onChange={(e) => set('parte', e.target.value)}>
            <option value="defensa">Defensa</option>
            <option value="acusacion">Acusación (Ministerio Público o asesor jurídico)</option>
          </select>
        </label>
        <label className="campo">
          <span>{t.parte === 'acusacion' ? 'Víctima u ofendido' : 'Imputado'}</span>
          <input value={t.cliente} onChange={(e) => set('cliente', e.target.value)} />
        </label>
      </div>

      <label className="campo campo--ancho">
        <span>Versión {t.parte === 'acusacion' ? 'de la víctima u ofendido' : 'del imputado'}: lo que relató, en sus palabras</span>
        <textarea rows={4} value={t.versionImputado} placeholder="Lo que el cliente te contó. Es el punto de partida: la IA la contrasta con el informe para encontrar las líneas de defensa." onChange={(e) => set('versionImputado', e.target.value)} />
      </label>
      {!t.versionImputado.trim() ? <p className="aviso">Sin la versión del cliente, cualquier borrador se construirá solo con el registro de la acusación.</p> : null}

      <label className="campo campo--ancho">
        <span>Lema del caso (la frase que el tribunal debe recordar)</span>
        <input className="lema" value={t.lema} onChange={(e) => set('lema', e.target.value)} />
      </label>

      <label className="campo campo--ancho">
        <span>Relato: lo que pasó, según nuestra versión</span>
        <textarea rows={5} value={t.relato} onChange={(e) => set('relato', e.target.value)} />
      </label>

      <div className="acciones-ia">
        <button type="button" className="boton boton--secundario" disabled={!!ocupado} onClick={() => ejecutar('borrador')}>Proponer borrador con IA</button>
        <button type="button" className="boton boton--primario" disabled={!!ocupado} onClick={() => ejecutar('estres')}>Prueba de estrés: que ataque el Ministerio Público</button>
      </div>
      {ocupado ? <Cargando texto={ocupado === 'borrador' ? 'Leyendo el expediente…' : 'El Ministerio Público está buscando debilidades…'} /> : null}
      <ErrorCaja error={error} onCerrar={() => setError(null)} />

      {borrador ? (
        <div className="aviso aviso--legal">
          <p><strong>Borrador propuesto.</strong> {borrador.demo ? 'Modo demostración: es la teoría precargada del caso ficticio.' : `${borrador.elementos.length} elementos, ${borrador.proposiciones.length} proposiciones y ${borrador.lineas.length} líneas de defensa.`} Revísalo antes de aplicarlo: sustituye la teoría actual.</p>
          {borrador.sinVersion ? <p className="nota nota--riesgo">Teoría basada solo en el registro de la acusación: falta la versión de la defensa.</p> : null}
          <p className="nota">Lema: {borrador.lema}</p>
          <div className="fila">
            <button type="button" className="boton boton--primario" onClick={() => { const { demo, ...b } = borrador; setTeoria(b); setBorrador(null); }}>Aplicar borrador</button>
            <button type="button" className="boton boton--secundario" onClick={() => setBorrador(null)}>Descartar</button>
          </div>
        </div>
      ) : null}

      {estres ? (
        <div className="estres">
          <div className="tarjeta__fila">
            <h3>Lo que haría el Ministerio Público</h3>
            <button type="button" className="boton boton--secundario" onClick={() => setEstres(null)}>Cerrar</button>
          </div>
          {estres.demo ? <p className="aviso">Modo demostración: análisis precargado para el caso ficticio.</p> : null}
          <p>{estres.resumen}</p>
          <ol className="estres__lista">
            {estres.ataques.map((a, i) => (
              <li key={i} className={`estres__ataque estres__ataque--${a.gravedad}`}>
                <p className="estres__punto"><span className="insignia">Gravedad {GRAVEDAD[a.gravedad]}</span> {a.punto}</p>
                <p><strong>Ataque:</strong> {a.ataque}</p>
                <p><strong>Cómo cubrirla:</strong> {a.como_cubrirla}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <h3>Teoría jurídica</h3>
      <label className="campo campo--ancho">
        <span>Delito imputado y fundamento</span>
        <input value={t.delito} onChange={(e) => set('delito', e.target.value)} />
      </label>
      <ul className="tarjetas">
        {t.elementos.map((e, i) => (
          <li key={e.id} className="tarjeta">
            <div className="fila">
              <label className="campo campo--doble">
                <span>Elemento {i + 1}</span>
                <input value={e.elemento} onChange={(ev) => editarEn('elementos', e.id, { elemento: ev.target.value })} />
              </label>
              <label className="campo">
                <span>Postura</span>
                <select value={e.postura} onChange={(ev) => editarEn('elementos', e.id, { postura: ev.target.value })}>
                  {Object.entries(POSTURAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>
            <label className="campo campo--ancho">
              <span>Por qué</span>
              <textarea rows={2} value={e.comentario} onChange={(ev) => editarEn('elementos', e.id, { comentario: ev.target.value })} />
            </label>
            <button type="button" className="boton boton--peligro boton--chico" onClick={() => quitarDe('elementos', e.id)}>Quitar elemento</button>
          </li>
        ))}
      </ul>
      <button type="button" className="boton boton--secundario" onClick={() => agregarA('elementos', { id: nuevoId('e'), elemento: '', postura: 'atacar', comentario: '' })}>Agregar elemento</button>

      <h3>Proposiciones fácticas</h3>
      <p className="nota">Afirmaciones que un testigo puede decir en juicio. {t.proposiciones.length} en total · {conteo.acreditada} acreditadas · {conteo.debil} débiles.</p>
      <ul className="tarjetas">
        {t.proposiciones.map((p) => (
          <li key={p.id} className={`tarjeta tarjeta--${p.estado}`}>
            <label className="campo campo--ancho">
              <span>Proposición</span>
              <textarea rows={2} value={p.texto} onChange={(ev) => editarEn('proposiciones', p.id, { texto: ev.target.value })} />
            </label>
            <div className="fila">
              <label className="campo">
                <span>Elemento que sostiene o ataca</span>
                <select value={p.elementoId} onChange={(ev) => editarEn('proposiciones', p.id, { elementoId: ev.target.value })}>
                  <option value="">(sin vincular)</option>
                  {t.elementos.map((e, i) => <option key={e.id} value={e.id}>{i + 1}. {e.elemento.slice(0, 60)}</option>)}
                </select>
              </label>
              <label className="campo">
                <span>Prueba</span>
                <input value={p.prueba} onChange={(ev) => editarEn('proposiciones', p.id, { prueba: ev.target.value })} />
              </label>
              <label className="campo">
                <span>Estado</span>
                <select value={p.estado} onChange={(ev) => editarEn('proposiciones', p.id, { estado: ev.target.value })}>
                  {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>
            <button type="button" className="boton boton--peligro boton--chico" onClick={() => quitarDe('proposiciones', p.id)}>Quitar proposición</button>
          </li>
        ))}
      </ul>
      <button type="button" className="boton boton--secundario" onClick={() => agregarA('proposiciones', { id: nuevoId('p'), texto: '', elementoId: '', prueba: '', estado: 'pendiente' })}>Agregar proposición</button>

      <h3>Líneas de defensa</h3>
      <p className="nota">Ordenadas por prioridad. Cada línea dice qué debe lograr cada interrogatorio. En Preparación puedes generar las preguntas de una línea concreta.</p>
      <ol className="tarjetas">
        {lineas.map((l) => (
          <li key={l.id} className="tarjeta tarjeta--linea">
            <div className="fila">
              <label className="campo campo--chico">
                <span>Prioridad</span>
                <input type="number" min={1} value={l.prioridad} onChange={(ev) => editarEn('lineas', l.id, { prioridad: Number(ev.target.value) || 1 })} />
              </label>
              <label className="campo campo--doble">
                <span>Línea</span>
                <input value={l.titulo} onChange={(ev) => editarEn('lineas', l.id, { titulo: ev.target.value })} />
              </label>
            </div>
            <label className="campo campo--ancho">
              <span>Fundamento</span>
              <textarea rows={2} value={l.fundamento} onChange={(ev) => editarEn('lineas', l.id, { fundamento: ev.target.value })} />
            </label>
            <p className="etiqueta">Misión de interrogatorio</p>
            <ul className="misiones">
              {l.mision.map((m, i) => (
                <li key={i} className="fila">
                  <label className="campo">
                    <span>Testigo</span>
                    <select value={m.testigoId} onChange={(ev) => editarMision(l.id, i, { testigoId: ev.target.value })}>
                      {testigos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                    </select>
                  </label>
                  <label className="campo campo--chico">
                    <span>Tipo</span>
                    <select value={m.tipo} onChange={(ev) => editarMision(l.id, i, { tipo: ev.target.value })}>
                      <option value="contra">Contrainterrogatorio</option>
                      <option value="directo">Directo</option>
                    </select>
                  </label>
                  <label className="campo campo--doble">
                    <span>Objetivo</span>
                    <input value={m.objetivo} onChange={(ev) => editarMision(l.id, i, { objetivo: ev.target.value })} />
                  </label>
                  <button type="button" className="boton boton--peligro boton--chico" aria-label="Quitar misión" onClick={() => setTeoria((x) => ({ ...x, lineas: x.lineas.map((y) => (y.id === l.id ? { ...y, mision: y.mision.filter((_, j) => j !== i) } : y)) }))}>Quitar</button>
                </li>
              ))}
            </ul>
            <div className="fila">
              <button type="button" className="boton boton--secundario boton--chico" onClick={() => setTeoria((x) => ({ ...x, lineas: x.lineas.map((y) => (y.id === l.id ? { ...y, mision: [...y.mision, { testigoId: testigos[0]?.id || '', tipo: 'contra', objetivo: '' }] } : y)) }))}>Agregar misión</button>
              {l.mision.length ? <button type="button" className="boton boton--primario boton--chico" onClick={() => irA('preparacion', l.id)}>Preparar preguntas de esta línea</button> : null}
              <button type="button" className="boton boton--peligro boton--chico" onClick={() => quitarDe('lineas', l.id)}>Quitar línea</button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="boton boton--secundario" onClick={() => agregarA('lineas', { id: nuevoId('l'), titulo: '', fundamento: '', prioridad: t.lineas.length + 1, mision: [] })}>Agregar línea de defensa</button>
    </section>
  );
}
