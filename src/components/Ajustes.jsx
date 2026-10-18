import { useState } from 'react';
import { MODELOS, TEMAS } from '../config.js';
import { listarVocesEleven, hablar } from '../lib/voz.js';
import { ErrorCaja } from './comunes.jsx';

export default function Ajustes({ ajustes, setAjustes, restaurarCaso }) {
  const [verLlaves, setVerLlaves] = useState(false);
  const [voces, setVoces] = useState([]);
  const [error, setError] = useState(null);
  const [cargandoVoces, setCargandoVoces] = useState(false);
  const cambiar = (c) => setAjustes((a) => ({ ...a, ...c }));

  async function cargarVoces() {
    setError(null);
    setCargandoVoces(true);
    try {
      setVoces(await listarVocesEleven(ajustes.llaveEleven));
    } catch (e) {
      setError(e);
    } finally {
      setCargandoVoces(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="t-aj">
      <div className="panel__cabeza">
        <h2 id="t-aj">Ajustes</h2>
        <p className="nota">Las llaves se guardan solo en este dispositivo y viajan únicamente en las cabeceras de cada solicitud al proveedor. Nunca se escriben en el código ni en la dirección web.</p>
      </div>

      <div className="aviso">
        <label className="interruptor">
          <input type="checkbox" checked={ajustes.modoDemo} onChange={(e) => cambiar({ modoDemo: e.target.checked })} />
          <span><strong>Modo demostración sin conexión.</strong> Usa respuestas grabadas del caso ficticio: no requiere llaves ni internet. Plan B para la charla.</span>
        </label>
        <label className="interruptor">
          <input type="checkbox" checked={!!ajustes.modoPonente} onChange={(e) => cambiar({ modoPonente: e.target.checked })} />
          <span><strong>Modo ponente.</strong> Muestra la pestaña Guion: la charla completa, capítulo por capítulo, con lectura en voz alta para estudiar y repasar. Contiene notas internas; desactívalo antes de prestar el dispositivo o proyectar.</span>
        </label>
      </div>

      <h3>Inteligencia artificial (Anthropic)</h3>
      <div className="fila">
        <label className="campo campo--ancho">
          <span>Llave de API de Anthropic</span>
          <input type={verLlaves ? 'text' : 'password'} autoComplete="off" value={ajustes.llaveAnthropic} onChange={(e) => cambiar({ llaveAnthropic: e.target.value.trim() })} placeholder="sk-ant-…" />
        </label>
        <label className="campo">
          <span>Modelo</span>
          <select value={ajustes.modelo} onChange={(e) => cambiar({ modelo: e.target.value })}>
            {MODELOS.map((m) => <option key={m.id} value={m.id}>{m.etiqueta}</option>)}
          </select>
        </label>
      </div>

      <h3>Voz del testigo (ElevenLabs)</h3>
      <label className="interruptor">
        <input type="checkbox" checked={ajustes.usarEleven} onChange={(e) => cambiar({ usarEleven: e.target.checked })} />
        <span>Usar ElevenLabs (si falla, se usa la voz del navegador)</span>
      </label>
      <div className="fila">
        <label className="campo campo--ancho">
          <span>Llave de API de ElevenLabs</span>
          <input type={verLlaves ? 'text' : 'password'} autoComplete="off" value={ajustes.llaveEleven} onChange={(e) => cambiar({ llaveEleven: e.target.value.trim() })} />
        </label>
        <button type="button" className="boton boton--secundario" onClick={cargarVoces} disabled={!ajustes.llaveEleven || cargandoVoces}>{cargandoVoces ? 'Cargando…' : 'Cargar mis voces'}</button>
      </div>
      <div className="fila">
        <label className="campo campo--ancho">
          <span>Voz del testigo</span>
          {voces.length ? (
            <select value={ajustes.vozId} onChange={(e) => cambiar({ vozId: e.target.value })}>
              <option value="">Elige una voz</option>
              {voces.map((v) => <option key={v.id} value={v.id}>{v.nombre}{v.etiquetas?.accent ? ` · ${v.etiquetas.accent}` : ''}</option>)}
            </select>
          ) : (
            <input value={ajustes.vozId} onChange={(e) => cambiar({ vozId: e.target.value.trim() })} placeholder="Identificador de voz (o carga tus voces)" />
          )}
        </label>
        <button type="button" className="boton boton--secundario" onClick={() => hablar('Sí, señoría. Yo hice la revisión esa noche.', { llaveEleven: ajustes.llaveEleven, vozId: ajustes.vozId, usarEleven: ajustes.usarEleven }).then((r) => r.aviso && setError(new Error(r.aviso)))}>Probar voz</button>
      </div>
      <ErrorCaja error={error} onCerrar={() => setError(null)} />

      <label className="interruptor">
        <input type="checkbox" checked={verLlaves} onChange={(e) => setVerLlaves(e.target.checked)} />
        <span>Mostrar llaves</span>
      </label>
      <button type="button" className="boton boton--peligro" onClick={() => { if (window.confirm('¿Borrar las llaves de este dispositivo?')) cambiar({ llaveAnthropic: '', llaveEleven: '' }); }}>Borrar llaves de este dispositivo</button>

      <h3>Presentación</h3>
      <div className="fila">
        <label className="campo">
          <span>Tema</span>
          <select value={ajustes.tema} onChange={(e) => cambiar({ tema: e.target.value })}>
            {TEMAS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Tamaño de letra</span>
          <select value={ajustes.escala} onChange={(e) => cambiar({ escala: Number(e.target.value) })}>
            <option value={1}>Normal</option>
            <option value={1.2}>Grande</option>
            <option value={1.4}>Proyección</option>
          </select>
        </label>
      </div>

      <h3>Caso</h3>
      <button type="button" className="boton boton--secundario" onClick={() => { if (window.confirm('¿Restaurar el caso ficticio original? Se perderán los cambios del expediente.')) restaurarCaso(); }}>Restaurar caso ficticio</button>
    </section>
  );
}
