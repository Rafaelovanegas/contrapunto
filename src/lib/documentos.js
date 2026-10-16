import { LIMITE_ARCHIVO_MB, TOKENS } from '../config.js';
import { llamarClaudeJSON, ErrorAPI } from './anthropic.js';
import { SISTEMA_EXTRACCION } from './prompts.js';
import { validarExtraccion } from './validate.js';

const IMAGENES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function aBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  const paso = 0x8000;
  for (let i = 0; i < bytes.length; i += paso) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + paso));
  }
  return btoa(bin);
}

export function tipoDeArchivo(archivo) {
  const n = archivo.name.toLowerCase();
  if (n.endsWith('.txt') || n.endsWith('.md')) return 'texto';
  if (n.endsWith('.docx')) return 'docx';
  if (n.endsWith('.pdf') || archivo.type === 'application/pdf') return 'pdf';
  if (IMAGENES.includes(archivo.type)) return 'imagen';
  return 'desconocido';
}

/**
 * Convierte un archivo en texto editable.
 * - .txt/.md: lectura directa, sin IA.
 * - .docx: extracción local con mammoth, sin IA.
 * - .pdf e imágenes: transcripción con Claude (el archivo se envía al proveedor).
 */
export async function importarArchivo(archivo, { llave, modelo }) {
  if (archivo.size > LIMITE_ARCHIVO_MB * 1024 * 1024) {
    throw new ErrorAPI(`El archivo pesa más de ${LIMITE_ARCHIVO_MB} MB.`);
  }
  const tipo = tipoDeArchivo(archivo);
  const base = archivo.name.replace(/\.[^.]+$/, '');

  if (tipo === 'texto') {
    return { titulo: base, tipo: 'Otro', texto: await archivo.text(), viaIA: false };
  }
  if (tipo === 'docx') {
    const mammoth = await import('mammoth');
    const r = await mammoth.extractRawText({ arrayBuffer: await archivo.arrayBuffer() });
    if (!r.value || r.value.trim().length < 5) throw new ErrorAPI('El documento Word no contiene texto legible.');
    return { titulo: base, tipo: 'Otro', texto: r.value.trim(), viaIA: false };
  }
  if (tipo === 'pdf' || tipo === 'imagen') {
    const datos = aBase64(await archivo.arrayBuffer());
    const bloque = tipo === 'pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: datos } }
      : { type: 'image', source: { type: 'base64', media_type: archivo.type, data: datos } };
    const obj = await llamarClaudeJSON(
      {
        llave,
        modelo,
        sistema: SISTEMA_EXTRACCION,
        contenido: [bloque, { type: 'text', text: 'Transcribe el documento completo.' }],
        maxTokens: TOKENS.extraccion,
      },
      validarExtraccion
    );
    return { titulo: obj.titulo_sugerido || base, tipo: obj.tipo_sugerido || 'Otro', texto: obj.texto.trim(), viaIA: true };
  }
  throw new ErrorAPI('Formato no admitido. Usa PDF, Word (.docx), texto (.txt) o imagen (JPG, PNG, WEBP).');
}
