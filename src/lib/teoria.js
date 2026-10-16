// Utilidades de la teoría del caso.

export const POSTURAS = {
  atacar: 'Atacar',
  reconocer: 'Reconocer',
  'no-controvertir': 'No controvertir',
};

export const ESTADOS = { pendiente: 'Pendiente', acreditada: 'Acreditada', debil: 'Débil' };

/** Acepta el formato anterior (texto libre) y lo convierte al formato estructurado. */
export function normalizarTeoria(t, inicial) {
  if (!t) return inicial;
  if (typeof t === 'string') return { ...inicial, relato: t };
  if (typeof t.versionImputado !== 'string') t = { ...t, versionImputado: '' };
  return {
    ...inicial,
    ...t,
    elementos: Array.isArray(t.elementos) ? t.elementos : [],
    proposiciones: Array.isArray(t.proposiciones) ? t.proposiciones : [],
    lineas: Array.isArray(t.lineas) ? t.lineas : [],
  };
}

/** Resumen en texto para los prompts. Si se indica una línea, la destaca. */
export function teoriaComoTexto(t, testigos = [], lineaId = null) {
  if (!t) return '';
  if (typeof t === 'string') return t;
  const nombre = (id) => testigos.find((x) => x.id === id)?.nombre || id;
  const partes = [
    `PARTE: ${t.parte === 'acusacion' ? 'Acusación (Ministerio Público o asesor jurídico)' : 'Defensa'}${t.cliente ? ` de ${t.cliente}` : ''}`,
    t.versionImputado ? `VERSIÓN DEL ${t.parte === 'acusacion' ? 'OFENDIDO' : 'IMPUTADO'} (lo que relató a su abogado): ${t.versionImputado}` : '',
    t.lema ? `LEMA DEL CASO: ${t.lema}` : '',
    t.relato ? `RELATO: ${t.relato}` : '',
    t.delito ? `DELITO IMPUTADO: ${t.delito}` : '',
    t.elementos?.length ? `ELEMENTOS Y POSTURA:\n${t.elementos.map((e) => `- ${e.elemento} → ${POSTURAS[e.postura] || e.postura}${e.comentario ? ` (${e.comentario})` : ''}`).join('\n')}` : '',
    t.proposiciones?.length ? `PROPOSICIONES FÁCTICAS:\n${t.proposiciones.map((p) => `- ${p.texto} [prueba: ${p.prueba || 'por definir'}; estado: ${ESTADOS[p.estado] || p.estado}]`).join('\n')}` : '',
    t.lineas?.length ? `LÍNEAS DE DEFENSA:\n${[...t.lineas].sort((a, b) => a.prioridad - b.prioridad).map((l) => `${l.id === lineaId ? '>>> LÍNEA ACTIVA: ' : '- '}${l.prioridad}. ${l.titulo} — ${l.fundamento}${(l.mision || []).map((m) => `\n   Misión: ${m.tipo === 'directo' ? 'interrogatorio directo' : 'contrainterrogatorio'} de ${nombre(m.testigoId)}: ${m.objetivo}`).join('')}`).join('\n')}` : '',
  ];
  return partes.filter(Boolean).join('\n\n');
}

export function nuevoId(prefijo) {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
