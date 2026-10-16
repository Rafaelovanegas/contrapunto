import { useEffect, useRef, useState } from 'react';
import { ETIQUETA_MOTIVO } from '../lib/validate.js';
import { crearOyente, escuchaDisponible } from '../lib/escucha.js';

export function ChipSemaforo({ resultado }) {
  if (!resultado) return null;
  const ok = resultado.veredicto === 'valida';
  return (
    <div className={`semaforo ${ok ? 'semaforo--ok' : 'semaforo--mal'}`} role="status">
      <span className="semaforo__luz" aria-hidden="true" />
      <div>
        <strong>{ok ? 'Válida' : `Objetable · ${ETIQUETA_MOTIVO[resultado.motivo] || resultado.motivo}`}</strong>
        <p>{resultado.explicacion}</p>
        {!ok && resultado.reformulacion ? <p className="semaforo__ref">Reformulación sugerida: “{resultado.reformulacion}”</p> : null}
      </div>
    </div>
  );
}

const ETIQUETA_TIPO = { contradiccion: 'Contradicción', omision: 'Omisión', percepcion: 'Problema de percepción' };

export function AlertaContradiccion({ alerta }) {
  if (!alerta) return null;
  return (
    <div className="alerta" role="alert">
      <div className="alerta__cabeza">
        <span className="alerta__icono" aria-hidden="true">!</span>
        <div>
          <p className="alerta__tipo">{ETIQUETA_TIPO[alerta.tipo] || 'Contradicción'} detectada</p>
          <h3>{alerta.tema}</h3>
        </div>
      </div>
      <div className="alerta__comparacion">
        <div className="alerta__hoy">
          <p className="etiqueta">Hoy, en audiencia</p>
          <p className="cita">“{alerta.dicho_hoy}”</p>
        </div>
        <div className="alerta__previo">
          <p className="etiqueta">{alerta.documento || 'Registro previo'} · cita literal verificada</p>
          <p className="cita">“{alerta.cita_informe}”</p>
        </div>
      </div>
      <p className="alerta__explicacion">{alerta.explicacion}</p>
      <ol className="alerta__pasos">
        <li><strong>Comprometer:</strong> {alerta.secuencia_376.comprometer}</li>
        <li><strong>Acreditar:</strong> {alerta.secuencia_376.acreditar}</li>
        <li><strong>Confrontar (art. 376 CNPP):</strong> {alerta.secuencia_376.confrontar}</li>
      </ol>
    </div>
  );
}

export function AvisoDescarte({ razon }) {
  return <p className="aviso aviso--suave">Posible contradicción descartada por el verificador: {razon}</p>;
}

export function ErrorCaja({ error, onCerrar }) {
  if (!error) return null;
  return (
    <div className="error" role="alert">
      <strong>{error.message}</strong>
      {error.detalle ? <details><summary>Ver respuesta del servicio</summary><pre>{String(error.detalle).slice(0, 2000)}</pre></details> : null}
      {onCerrar ? <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cerrar</button> : null}
    </div>
  );
}

/** Botón de micrófono que dicta una frase en el campo. */
export function BotonMicrofono({ onTexto, etiqueta = 'Dictar' }) {
  const [escuchando, setEscuchando] = useState(false);
  const [parcial, setParcial] = useState('');
  const [error, setError] = useState('');
  const oyente = useRef(null);

  useEffect(() => () => oyente.current && oyente.current.detener(), []);

  if (!escuchaDisponible()) {
    return <span className="nota">El dictado por voz requiere Chrome o Edge.</span>;
  }

  function alternar() {
    if (escuchando) {
      oyente.current && oyente.current.detener();
      return;
    }
    setError('');
    oyente.current = crearOyente({
      continuo: false,
      onParcial: setParcial,
      onFinal: (t) => { setParcial(''); onTexto(t); },
      onFin: () => setEscuchando(false),
      onError: (m) => { setError(m); setEscuchando(false); },
    });
    oyente.current.iniciar();
    setEscuchando(true);
  }

  return (
    <span className="microfono">
      <button type="button" className={`boton ${escuchando ? 'boton--grabando' : 'boton--secundario'}`} onClick={alternar} aria-pressed={escuchando}>
        {escuchando ? 'Escuchando… (toca para detener)' : etiqueta}
      </button>
      {parcial ? <span className="nota">{parcial}</span> : null}
      {error ? <span className="nota nota--error">{error}</span> : null}
    </span>
  );
}

export function Cargando({ texto }) {
  return <p className="cargando" role="status"><span className="cargando__punto" aria-hidden="true" />{texto}</p>;
}
