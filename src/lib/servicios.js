import { TOKENS } from '../config.js';
import { llamarClaude, llamarClaudeJSON } from './anthropic.js';
import {
  SISTEMA_SEMAFORO, contenidoSemaforo, sistemaTestigo, SISTEMA_CONTRADICCION,
  contenidoContradiccion, SISTEMA_PREPARACION, contenidoPreparacion,
} from './prompts.js';
import {
  validarSemaforo, validarContradiccion, verificarAlerta, validarPreparacion, normalizar,
} from './validate.js';
import { DEMO_CONTRA, DEMO_SEMAFORO } from '../data/caso.js';

function buscarDemo(lista, pregunta) {
  const n = normalizar(pregunta);
  return lista.find((d) => normalizar(d.pregunta) === n) || null;
}

export async function evaluarPregunta({ ajustes, pregunta, modo, contexto }) {
  if (ajustes.modoDemo) {
    const d = buscarDemo(DEMO_SEMAFORO, pregunta) || buscarDemo(DEMO_CONTRA, pregunta);
    if (d) return d.resultado || d.semaforo;
    return { veredicto: 'valida', motivo: 'ninguno', explicacion: 'Modo demostración: solo califica las preguntas del guion precargado. Activa la IA en Ajustes para preguntas libres.', reformulacion: '', demo: true };
  }
  return llamarClaudeJSON(
    { llave: ajustes.llaveAnthropic, modelo: ajustes.modelo, sistema: SISTEMA_SEMAFORO, contenido: contenidoSemaforo({ pregunta, modo, contexto }), maxTokens: TOKENS.semaforo },
    validarSemaforo
  );
}

export async function responderTestigo({ ajustes, testigo, historial, pregunta }) {
  if (ajustes.modoDemo) {
    const d = buscarDemo(DEMO_CONTRA, pregunta);
    return d ? d.respuesta : 'No lo recuerdo bien. (Modo demostración: usa las preguntas del guion.)';
  }
  const previo = historial.slice(-8).map((t) => `Abogado: ${t.pregunta}\nTestigo: ${t.respuesta}`).join('\n');
  const contenido = `${previo ? `LO QUE YA SE PREGUNTÓ EN ESTA AUDIENCIA:\n${previo}\n\n` : ''}NUEVA PREGUNTA DEL ABOGADO: "${pregunta}"\nResponde como el testigo.`;
  return llamarClaude({ llave: ajustes.llaveAnthropic, modelo: ajustes.modelo, sistema: sistemaTestigo(testigo), contenido, maxTokens: TOKENS.testigo });
}

/** Detecta contradicciones y aplica la verificación literal de la cita. */
export async function detectarContradiccion({ ajustes, testigo, dichoHoy, pregunta, documentos }) {
  if (!documentos.length) return { alerta: null, descartada: false, sinDocumentos: true };
  let alerta;
  if (ajustes.modoDemo) {
    const d = buscarDemo(DEMO_CONTRA, pregunta);
    alerta = d ? d.alerta : { hay_contradiccion: false };
  } else {
    alerta = await llamarClaudeJSON(
      { llave: ajustes.llaveAnthropic, modelo: ajustes.modelo, sistema: SISTEMA_CONTRADICCION, contenido: contenidoContradiccion({ testigo, dichoHoy, pregunta, documentos }), maxTokens: TOKENS.contradiccion },
      validarContradiccion
    );
  }
  return verificarAlerta(alerta, documentos);
}

export async function prepararInterrogatorio({ ajustes, tipo, testigo, documentos, teoria }) {
  if (ajustes.modoDemo) {
    if (tipo === 'contra') {
      return { preguntas: DEMO_CONTRA.map((d, i) => ({ pregunta: d.pregunta, objetivo: d.alerta?.tema ? `Comprometer al testigo: ${d.alerta.tema.toLowerCase()}` : 'Acreditar el registro previo antes de confrontar', etapa: i === DEMO_CONTRA.length - 1 ? 'acreditar-registro' : 'comprometer', riesgo: '' })), demo: true };
    }
    return {
      demo: true,
      preguntas: [
        { pregunta: '¿A qué se dedica?', objetivo: 'Acreditar a la testigo', etapa: 'acreditar', riesgo: '' },
        { pregunta: '¿Cuánto tiempo lleva trabajando en esa esquina?', objetivo: 'Acreditar que conoce el lugar', etapa: 'acreditar', riesgo: '' },
        { pregunta: '¿Qué iluminación tiene su puesto?', objetivo: 'Situar: por qué pudo ver bien', etapa: 'situar', riesgo: '' },
        { pregunta: '¿Qué vio esa noche del 14 de marzo?', objetivo: 'Narrar: abrir el relato', etapa: 'narrar', riesgo: '' },
        { pregunta: '¿Qué llevaba el joven en las manos o en el cuerpo?', objetivo: 'Narrar: sin mochila', etapa: 'narrar', riesgo: '' },
        { pregunta: 'Descríbanos qué hicieron los policías al bajar de la patrulla.', objetivo: 'Narrar: la revisión', etapa: 'narrar', riesgo: '' },
        { pregunta: '¿Vio usted algún arma en ese momento?', objetivo: 'Cierre: hecho clave', etapa: 'cierre', riesgo: 'Pregunta directa al punto: confirmar antes con la entrevista.' },
      ],
    };
  }
  return llamarClaudeJSON(
    { llave: ajustes.llaveAnthropic, modelo: ajustes.modelo, sistema: SISTEMA_PREPARACION, contenido: contenidoPreparacion({ tipo, testigo, documentos, teoria }), maxTokens: TOKENS.preparacion },
    validarPreparacion
  );
}
