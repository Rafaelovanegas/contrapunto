import { TOKENS } from '../config.js';
import { llamarClaude, llamarClaudeJSON } from './anthropic.js';
import {
  SISTEMA_SEMAFORO, contenidoSemaforo, sistemaTestigo, SISTEMA_CONTRADICCION,
  contenidoContradiccion, SISTEMA_PREPARACION, contenidoPreparacion,
} from './prompts.js';
import {
  validarSemaforo, validarContradiccion, verificarAlerta, validarPreparacion, normalizar,
} from './validate.js';
import { DEMO_CONTRA, DEMO_SEMAFORO, TEORIA_INICIAL } from '../data/caso.js';
import { SISTEMA_TEORIA, contenidoTeoria, SISTEMA_ESTRES, contenidoEstres } from './prompts.js';
import { validarTeoria, validarEstres } from './validate.js';
import { nuevoId } from './teoria.js';

const DEMO_ESTRES = {
  resumen: 'La teoría es sólida en credibilidad y licitud, pero depende mucho de las contradicciones del agente. Su punto más vulnerable es que el arma sí se aseguró y existe cadena de custodia.',
  ataques: [
    { punto: 'Contradicción cintura / mochila', ataque: 'Sostendré que es un detalle menor: lo relevante es que el arma se aseguró, se fijó fotográficamente y tiene cadena de custodia.', gravedad: 'alta', como_cubrirla: 'No presentar la contradicción como un detalle aislado: ligarla a la credibilidad total del agente y a la licitud del hallazgo.' },
    { punto: 'Licitud de la revisión', ataque: 'Argumentaré que intentar retirarse al ver a la policía es un indicio suficiente para una inspección de persona.', gravedad: 'alta', como_cubrirla: 'Fijar en el contrainterrogatorio que el parte no describe ninguna conducta objetiva más allá del nerviosismo. Buscar criterios de la SCJN sobre control preventivo [verificar en fuente oficial].' },
    { punto: 'Testigo Lucía Hernández', ataque: 'Diré que es una testigo tardía: nadie la entrevistó esa noche y aparece meses después.', gravedad: 'media', como_cubrirla: 'Acreditar su posición fija de ocho años y su iluminación propia, y usar que el parte afirma que no hubo testigos: la policía no la buscó.' },
    { punto: 'Confesión del detenido', ataque: 'No la ofreceré como prueba; la defensa estará atacando algo que no uso.', gravedad: 'baja', como_cubrirla: 'Usarla solo como indicio de que el procedimiento fue irregular desde el inicio.' },
  ],
  demo: true,
};

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

/** Borrador de teoría del caso a partir del expediente. Devuelve la estructura con ids asignados por código. */
export async function proponerTeoria({ ajustes, teoria, testigos, documentos }) {
  if (ajustes.modoDemo) return { ...TEORIA_INICIAL, demo: true };
  const o = await llamarClaudeJSON(
    { llave: ajustes.llaveAnthropic, modelo: ajustes.modelo, sistema: SISTEMA_TEORIA, contenido: contenidoTeoria({ parte: teoria.parte, cliente: teoria.cliente, delito: teoria.delito, testigos, documentos }), maxTokens: TOKENS.preparacion },
    validarTeoria
  );
  const elementos = o.elementos.map((e) => ({ id: nuevoId('e'), elemento: e.elemento, postura: e.postura, comentario: e.comentario || '' }));
  const idsTestigos = new Set(testigos.map((t) => t.id));
  return {
    parte: teoria.parte,
    cliente: teoria.cliente,
    lema: o.lema || '',
    relato: o.relato,
    delito: o.delito || teoria.delito || '',
    elementos,
    proposiciones: (o.proposiciones || []).map((p) => ({ id: nuevoId('p'), texto: p.texto, elementoId: elementos[(Number(p.elemento) || 1) - 1]?.id || '', prueba: p.prueba || '', estado: 'pendiente' })),
    lineas: o.lineas.map((l, i) => ({ id: nuevoId('l'), titulo: l.titulo, fundamento: l.fundamento || '', prioridad: Number(l.prioridad) || i + 1, mision: (l.mision || []).filter((m) => idsTestigos.has(m.testigoId)).map((m) => ({ testigoId: m.testigoId, tipo: m.tipo === 'directo' ? 'directo' : 'contra', objetivo: m.objetivo || '' })) })),
  };
}

/** Prueba de estrés: la IA actúa como Ministerio Público contra la teoría. */
export async function probarTeoria({ ajustes, teoriaTexto, documentos }) {
  if (ajustes.modoDemo) return DEMO_ESTRES;
  return llamarClaudeJSON(
    { llave: ajustes.llaveAnthropic, modelo: ajustes.modelo, sistema: SISTEMA_ESTRES, contenido: contenidoEstres({ teoriaTexto, documentos }), maxTokens: TOKENS.preparacion },
    validarEstres
  );
}
