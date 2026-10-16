// Validación determinista. Las reglas de honestidad viven aquí, no solo en los prompts.

export const MOTIVOS = [
  'ninguno', 'sugestiva', 'ambigua', 'conclusiva', 'impertinente', 'irrelevante',
  'argumentativa', 'ofensiva', 'coactiva', 'multiple',
];

export const ETIQUETA_MOTIVO = {
  ninguno: 'Sin objeción',
  sugestiva: 'Sugestiva',
  ambigua: 'Ambigua o poco clara',
  conclusiva: 'Conclusiva',
  impertinente: 'Impertinente',
  irrelevante: 'Irrelevante',
  argumentativa: 'Argumentativa',
  ofensiva: 'Ofende al testigo',
  coactiva: 'Coacciona al testigo',
  multiple: 'Más de un hecho por pregunta',
};

export function extraerJSON(texto) {
  if (!texto) return null;
  const sinCercas = texto.replace(/```json|```/g, '');
  const ini = sinCercas.indexOf('{');
  const fin = sinCercas.lastIndexOf('}');
  if (ini === -1 || fin <= ini) return null;
  try {
    return JSON.parse(sinCercas.slice(ini, fin + 1));
  } catch {
    return null;
  }
}

/** Normaliza para comparar citas: minúsculas, comillas y espacios unificados. Conserva acentos. */
export function normalizar(s) {
  return String(s || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[“”«»"]/g, '"')
    .replace(/[‘’']/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[.;,]+$/g, '')
    .trim();
}

/** ¿La cita aparece literalmente en el documento? */
export function citaEsLiteral(cita, documento) {
  const c = normalizar(cita);
  if (c.length < 8) return false;
  return normalizar(documento).includes(c);
}

export function validarSemaforo(o) {
  if (o.veredicto !== 'valida' && o.veredicto !== 'objetable') return 'veredicto fuera de catálogo';
  if (!MOTIVOS.includes(o.motivo)) return 'motivo fuera de catálogo';
  if (o.veredicto === 'objetable' && o.motivo === 'ninguno') return 'objetable sin motivo';
  if (typeof o.explicacion !== 'string' || !o.explicacion.trim()) return 'falta explicación';
  return null;
}

export function validarContradiccion(o) {
  if (typeof o.hay_contradiccion !== 'boolean') return 'falta hay_contradiccion';
  if (!o.hay_contradiccion) return null;
  if (!['contradiccion', 'omision', 'percepcion'].includes(o.tipo)) return 'tipo fuera de catálogo';
  if (!o.tema || !o.dicho_hoy || !o.explicacion) return 'faltan campos';
  if (!o.secuencia_376 || !o.secuencia_376.comprometer || !o.secuencia_376.acreditar || !o.secuencia_376.confrontar) {
    return 'falta la secuencia del artículo 376';
  }
  return null;
}

/**
 * Aplica la regla dura: una alerta solo se muestra si la cita del registro previo es literal.
 * Devuelve { alerta, descartada, razon }.
 */
export function verificarAlerta(alerta, documentos) {
  if (!alerta || !alerta.hay_contradiccion) return { alerta: null, descartada: false };
  const cita = alerta.cita_informe || '';
  if (!cita.trim()) {
    return { alerta: null, descartada: true, razon: 'La IA no aportó una cita textual del registro previo.' };
  }
  const doc = documentos.find((d) => citaEsLiteral(cita, d.texto));
  if (!doc) {
    return { alerta: null, descartada: true, razon: 'La cita propuesta no aparece literalmente en ningún documento del testigo. Se descarta para no inducir a error.' };
  }
  return { alerta: { ...alerta, documento: doc.titulo }, descartada: false };
}

export function validarPreparacion(o) {
  if (!Array.isArray(o.preguntas) || o.preguntas.length === 0) return 'sin preguntas';
  for (const p of o.preguntas) {
    if (!p.pregunta || !p.objetivo) return 'pregunta incompleta';
  }
  return null;
}

export function validarTeoria(o) {
  if (!o.relato || typeof o.relato !== 'string') return 'falta el relato';
  if (!Array.isArray(o.elementos) || !o.elementos.length) return 'faltan elementos';
  for (const e of o.elementos) {
    if (!e.elemento) return 'elemento vacío';
    if (!['atacar', 'reconocer', 'no-controvertir'].includes(e.postura)) return 'postura fuera de catálogo';
  }
  if (!Array.isArray(o.proposiciones)) return 'faltan proposiciones';
  if (!Array.isArray(o.lineas) || !o.lineas.length) return 'faltan líneas de defensa';
  for (const l of o.lineas) if (!l.titulo) return 'línea sin título';
  return null;
}

export function validarEstres(o) {
  if (!o.resumen) return 'falta el resumen';
  if (!Array.isArray(o.ataques) || !o.ataques.length) return 'sin ataques';
  for (const a of o.ataques) {
    if (!a.punto || !a.ataque || !a.como_cubrirla) return 'ataque incompleto';
    if (!['alta', 'media', 'baja'].includes(a.gravedad)) return 'gravedad fuera de catálogo';
  }
  return null;
}

export function validarExtraccion(o) {
  if (typeof o.texto !== 'string' || o.texto.trim().length < 20) return 'texto extraído vacío';
  return null;
}
