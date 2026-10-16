import { useRef, useState } from 'react';
import { importarArchivo, tipoDeArchivo } from '../lib/documentos.js';
import { ErrorCaja, Cargando } from './comunes.jsx';

const TIPOS_DOC = ['Informe policial', 'Entrevista', 'Dictamen pericial', 'Acta', 'Otro'];

export default function Expediente({ ajustes, testigos, setTestigos, documentos, setDocumentos, teoria, setTeoria }) {
  const [abierto, setAbierto] = useState(null);
  const [testigoDestino, setTestigoDestino] = useState(testigos[0]?.id || '');
  const [confirmo, setConfirmo] = useState(false);
  const [ocupado, setOcupado] = useState('');
  const [error, setError] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: '', rol: '', lado: 'contraparte', perfil: '' });
  const entrada = useRef(null);

  async function subir(archivos) {
    setError(null);
    for (const archivo of archivos) {
      const tipo = tipoDeArchivo(archivo);
      const requiereIA = tipo === 'pdf' || tipo === 'imagen';
      if (requiereIA && ajustes.modoDemo) {
        setError(new Error('Para leer PDF o imágenes desactiva el modo demostración y agrega tu llave de Anthropic en Ajustes. Los archivos .txt y .docx se leen sin IA.'));
        continue;
      }
      setOcupado(requiereIA ? `Transcribiendo “${archivo.name}” con IA…` : `Leyendo “${archivo.name}”…`);
      try {
        const r = await importarArchivo(archivo, { llave: ajustes.llaveAnthropic, modelo: ajustes.modelo });
        const doc = { id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, titulo: r.titulo, tipo: TIPOS_DOC.includes(r.tipo) ? r.tipo : 'Otro', testigoId: testigoDestino, texto: r.texto, origen: r.viaIA ? 'transcrito con IA · revisar' : 'importado' };
        setDocumentos((ds) => [...ds, doc]);
        setAbierto(doc.id);
      } catch (e) {
        setError(e);
      }
    }
    setOcupado('');
    if (entrada.current) entrada.current.value = '';
  }

  function actualizarDoc(id, cambios) {
    setDocumentos((ds) => ds.map((d) => (d.id === id ? { ...d, ...cambios } : d)));
  }

  function agregarTestigo(e) {
    e.preventDefault();
    if (!nuevo.nombre.trim()) return;
    const id = `t-${Date.now()}`;
    const perfil = nuevo.perfil.trim() || `Eres ${nuevo.nombre}, ${nuevo.rol || 'testigo'}. Declaras en juicio oral. Tu versión es la de tus registros previos.`;
    setTestigos((ts) => [...ts, { id, nombre: nuevo.nombre.trim(), rol: nuevo.rol.trim() || 'Testigo', lado: nuevo.lado, perfil }]);
    setNuevo({ nombre: '', rol: '', lado: 'contraparte', perfil: '' });
    setTestigoDestino(id);
  }

  return (
    <section className="panel" aria-labelledby="t-exp">
      <div className="panel__cabeza">
        <h2 id="t-exp">Expediente</h2>
        <p className="nota">Testigos, sus registros previos y la teoría del caso. Contra estos documentos se buscan las contradicciones.</p>
      </div>

      <label className="campo campo--ancho">
        <span>Teoría del caso de quien interroga</span>
        <textarea rows={3} value={teoria} onChange={(e) => setTeoria(e.target.value)} />
      </label>

      <h3>Testigos</h3>
      <ul className="tarjetas">
        {testigos.map((t) => (
          <li key={t.id} className="tarjeta">
            <p className="tarjeta__titulo">{t.nombre}</p>
            <p className="nota">{t.rol} · {t.lado === 'propio' ? 'testigo propio' : 'testigo de la contraparte'}</p>
            <details>
              <summary>Personaje y versión que sostiene (para el testigo de IA)</summary>
              <textarea rows={8} value={t.perfil} onChange={(e) => setTestigos((ts) => ts.map((x) => (x.id === t.id ? { ...x, perfil: e.target.value } : x)))} />
            </details>
          </li>
        ))}
      </ul>

      <form className="formulario" onSubmit={agregarTestigo}>
        <p className="etiqueta">Agregar testigo</p>
        <div className="fila">
          <label className="campo"><span>Nombre</span><input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></label>
          <label className="campo"><span>Rol</span><input value={nuevo.rol} placeholder="Perito, víctima, policía…" onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })} /></label>
          <label className="campo"><span>Lado</span>
            <select value={nuevo.lado} onChange={(e) => setNuevo({ ...nuevo, lado: e.target.value })}>
              <option value="contraparte">Testigo de la contraparte</option>
              <option value="propio">Testigo propio</option>
            </select>
          </label>
        </div>
        <label className="campo campo--ancho"><span>Versión que sostiene en juicio (opcional)</span><textarea rows={3} value={nuevo.perfil} onChange={(e) => setNuevo({ ...nuevo, perfil: e.target.value })} /></label>
        <button type="submit" className="boton boton--secundario">Agregar testigo</button>
      </form>

      <h3>Subir documentos</h3>
      <div className="aviso aviso--legal">
        <p><strong>Secreto profesional.</strong> Los PDF y las imágenes se envían a un proveedor de inteligencia artificial externo para transcribirlos. No subas información amparada por secreto profesional ni datos personales de un caso real sin la autorización correspondiente.</p>
        <label className="interruptor">
          <input type="checkbox" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)} />
          <span>Confirmo que el documento es ficticio o que cuento con autorización para procesarlo.</span>
        </label>
      </div>
      <div className="fila">
        <label className="campo">
          <span>Asociar al testigo</span>
          <select value={testigoDestino} onChange={(e) => setTestigoDestino(e.target.value)}>
            {testigos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        <label className={`boton boton--primario boton--archivo ${!confirmo || ocupado ? 'boton--inactivo' : ''}`}>
          Elegir archivos
          <input ref={entrada} type="file" multiple disabled={!confirmo || !!ocupado} accept=".pdf,.docx,.txt,.md,image/jpeg,image/png,image/webp" onChange={(e) => subir(Array.from(e.target.files || []))} />
        </label>
      </div>
      <p className="nota">Formatos: PDF (también escaneado), Word .docx, texto .txt, fotografía JPG/PNG/WEBP. Máximo 20 MB por archivo.</p>
      {ocupado ? <Cargando texto={ocupado} /> : null}
      <ErrorCaja error={error} onCerrar={() => setError(null)} />

      <h3>Documentos</h3>
      <ul className="tarjetas">
        {documentos.map((d) => (
          <li key={d.id} className="tarjeta">
            <div className="tarjeta__fila">
              <div>
                <p className="tarjeta__titulo">{d.titulo}</p>
                <p className="nota">{d.tipo} · {testigos.find((t) => t.id === d.testigoId)?.nombre || 'sin testigo'} · {d.origen}</p>
              </div>
              <div className="tarjeta__acciones">
                <button type="button" className="boton boton--secundario" onClick={() => setAbierto(abierto === d.id ? null : d.id)} aria-expanded={abierto === d.id}>{abierto === d.id ? 'Cerrar' : 'Revisar y editar'}</button>
                <button type="button" className="boton boton--peligro" onClick={() => { if (window.confirm(`¿Quitar “${d.titulo}” del expediente?`)) setDocumentos((ds) => ds.filter((x) => x.id !== d.id)); }}>Quitar</button>
              </div>
            </div>
            {abierto === d.id ? (
              <div className="editor">
                {d.origen.includes('IA') ? <p className="aviso">Transcripción hecha por IA: compárala con el original antes de usarla. Las citas de las alertas se verifican contra este texto.</p> : null}
                <div className="fila">
                  <label className="campo"><span>Título</span><input value={d.titulo} onChange={(e) => actualizarDoc(d.id, { titulo: e.target.value })} /></label>
                  <label className="campo"><span>Tipo</span>
                    <select value={d.tipo} onChange={(e) => actualizarDoc(d.id, { tipo: e.target.value })}>{TIPOS_DOC.map((t) => <option key={t}>{t}</option>)}</select>
                  </label>
                  <label className="campo"><span>Testigo</span>
                    <select value={d.testigoId} onChange={(e) => actualizarDoc(d.id, { testigoId: e.target.value })}>{testigos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select>
                  </label>
                </div>
                <label className="campo campo--ancho"><span>Texto del documento</span><textarea rows={16} value={d.texto} onChange={(e) => actualizarDoc(d.id, { texto: e.target.value })} /></label>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
