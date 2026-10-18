// Convierte los capítulos del guion en fragmentos legibles en voz alta.
// Cada fragmento es una unidad breve (una o dos oraciones) para evitar los cortes
// del sintetizador del navegador con textos largos.

const MAX = 220;

const NUM = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];

export function minutosEnLetra(n) {
  if (n === 1) return 'un minuto';
  return `${NUM[n] || n} minutos`;
}

const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/** Parte un texto en trozos de hasta MAX caracteres, respetando oraciones cuando es posible. */
export function trocear(texto) {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!limpio) return [];
  if (limpio.length <= MAX) return [limpio];
  const oraciones = limpio.match(/[^.!?¿¡]+[.!?]+["»”)]*\s*|[^.!?]+$/g) || [limpio];
  const trozos = [];
  let actual = '';
  for (const o of oraciones) {
    const s = o.trim();
    if (!s) continue;
    if ((actual + ' ' + s).trim().length <= MAX) {
      actual = (actual + ' ' + s).trim();
    } else {
      if (actual) trozos.push(actual);
      if (s.length <= MAX) {
        actual = s;
      } else {
        // Oración muy larga: cortar por comas o punto y coma.
        const partes = s.split(/(?<=[,;:])\s+/);
        actual = '';
        for (const p of partes) {
          if ((actual + ' ' + p).trim().length <= MAX) actual = (actual + ' ' + p).trim();
          else if (p.length <= MAX) { if (actual) trozos.push(actual); actual = p; }
          else {
            // Sin comas útiles: cortar por palabras.
            if (actual) trozos.push(actual);
            actual = '';
            for (const w of p.split(' ')) {
              if ((actual + ' ' + w).trim().length <= MAX) actual = (actual + ' ' + w).trim();
              else { if (actual) trozos.push(actual); actual = w; }
            }
          }
        }
      }
    }
  }
  if (actual) trozos.push(actual);
  return trozos;
}

function tablaComoTexto(filas) {
  if (!filas.length) return [];
  const [cab, ...resto] = filas;
  return resto.map((f) => f.map((celda, i) => (i === 0 ? `${celda}.` : `${cab[i] ? `${cab[i]}: ` : ''}${celda}.`)).join(' '));
}

/**
 * Fragmentos de un capítulo.
 * @returns {Array<{tipo: 'titulo'|'sub'|'dic'|'esc'|'lista'|'tabla', texto: string, parte: number}>}
 */
export function fragmentosDe(capitulo, { incluirEscena = false } = {}) {
  const out = [];
  const encabezado = capitulo.anexo
    ? `${capitulo.titulo}.`
    : `Capítulo ${capitulo.n}. ${capitulo.titulo}.${capitulo.min ? ` ${mayuscula(minutosEnLetra(capitulo.min))}.` : ''}`;
  out.push({ tipo: 'titulo', texto: encabezado, parte: -1 });
  capitulo.partes.forEach((p, i) => {
    if (p.t === 'esc') {
      if (incluirEscena) trocear(`Indicación: ${p.x}`).forEach((t) => out.push({ tipo: 'esc', texto: t, parte: i }));
      return;
    }
    if (p.t === 'sub') { out.push({ tipo: 'sub', texto: `${p.x}.`, parte: i }); return; }
    if (p.t === 'lista') { p.x.forEach((item) => trocear(item).forEach((t) => out.push({ tipo: 'lista', texto: t, parte: i }))); return; }
    if (p.t === 'tabla') { tablaComoTexto(p.x).forEach((fila) => trocear(fila).forEach((t) => out.push({ tipo: 'tabla', texto: t, parte: i }))); return; }
    trocear(p.x).forEach((t) => out.push({ tipo: 'dic', texto: t, parte: i }));
  });
  return out;
}

/** Duración estimada de lectura, en segundos, a una velocidad dada. */
export function duracionEstimada(fragmentos, velocidad = 1) {
  const caracteres = fragmentos.reduce((s, f) => s + f.texto.length, 0);
  return Math.round(caracteres / (14 * velocidad));
}
