import { ANTHROPIC_URL, ANTHROPIC_VERSION } from '../config.js';
import { extraerJSON } from './validate.js';

export class ErrorAPI extends Error {
  constructor(mensaje, detalle) {
    super(mensaje);
    this.detalle = detalle;
  }
}

/**
 * Llama a la API de Mensajes de Anthropic desde el navegador (BYOK).
 * La llave viaja SOLO en cabeceras, nunca en la URL.
 * contenido: string o arreglo de bloques (texto, documento, imagen).
 */
export async function llamarClaude({ llave, modelo, sistema, contenido, maxTokens, signal }) {
  if (!llave) throw new ErrorAPI('Falta la llave de Anthropic. Agrégala en Ajustes.');
  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': llave,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: maxTokens,
        system: sistema,
        messages: [{ role: 'user', content: contenido }],
      }),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ErrorAPI('No hubo conexión con Anthropic. Revisa internet.', String(e));
  }
  const cuerpo = await res.text();
  if (!res.ok) {
    // Regla: todo error de API muestra el cuerpo de la respuesta.
    let msg = `Error ${res.status} de Anthropic`;
    try {
      const j = JSON.parse(cuerpo);
      if (j?.error?.message) msg += `: ${j.error.message}`;
    } catch {
      /* cuerpo no JSON */
    }
    throw new ErrorAPI(msg, cuerpo);
  }
  const data = JSON.parse(cuerpo);
  const texto = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return texto;
}

/**
 * Pide JSON y lo valida. Si no se puede leer, un único reintento (con registro en consola).
 */
export async function llamarClaudeJSON(opciones, validar) {
  const texto = await llamarClaude(opciones);
  let obj = extraerJSON(texto);
  let error = obj ? validar(obj) : 'respuesta sin JSON legible';
  if (!error) return obj;
  console.warn('[CONTRAPUNTO] Reintento único por respuesta inválida:', error, texto);
  const contenido2 = typeof opciones.contenido === 'string'
    ? `${opciones.contenido}\n\nIMPORTANTE: tu respuesta anterior no fue válida (${error}). Responde SOLO con el objeto JSON solicitado, sin texto adicional.`
    : [...opciones.contenido, { type: 'text', text: `IMPORTANTE: tu respuesta anterior no fue válida (${error}). Responde SOLO con el objeto JSON solicitado.` }];
  const texto2 = await llamarClaude({ ...opciones, contenido: contenido2 });
  obj = extraerJSON(texto2);
  error = obj ? validar(obj) : 'respuesta sin JSON legible';
  if (error) throw new ErrorAPI(`La IA devolvió una respuesta inválida: ${error}`, texto2);
  return obj;
}
