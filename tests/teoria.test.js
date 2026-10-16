import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarTeoria, teoriaComoTexto } from '../src/lib/teoria.js';
import { validarTeoria, validarEstres } from '../src/lib/validate.js';
import { TEORIA_INICIAL, TESTIGOS_INICIALES } from '../src/data/caso.js';

test('migra la teoría antigua en texto libre', () => {
  const t = normalizarTeoria('Versión antigua', TEORIA_INICIAL);
  assert.equal(t.relato, 'Versión antigua');
  assert.ok(Array.isArray(t.lineas));
});

test('el texto para los prompts marca la línea activa y nombra testigos', () => {
  const txt = teoriaComoTexto(TEORIA_INICIAL, TESTIGOS_INICIALES, 'l1');
  assert.match(txt, />>> LÍNEA ACTIVA/);
  assert.match(txt, /Héctor Ramírez/);
  assert.equal((txt.match(/>>> LÍNEA ACTIVA/g) || []).length, 1);
});

test('la teoría precargada es válida y coherente', () => {
  const ids = new Set(TEORIA_INICIAL.elementos.map((e) => e.id));
  for (const p of TEORIA_INICIAL.proposiciones) assert.ok(ids.has(p.elementoId), p.id);
  const tids = new Set(TESTIGOS_INICIALES.map((t) => t.id));
  for (const l of TEORIA_INICIAL.lineas) for (const m of l.mision) assert.ok(tids.has(m.testigoId));
});

test('validadores rechazan catálogos inventados', () => {
  assert.ok(validarTeoria({ relato: 'x', elementos: [{ elemento: 'a', postura: 'inventada' }], proposiciones: [], lineas: [{ titulo: 't' }] }));
  assert.equal(validarTeoria({ relato: 'x', elementos: [{ elemento: 'a', postura: 'atacar' }], proposiciones: [], lineas: [{ titulo: 't' }] }), null);
  assert.ok(validarEstres({ resumen: 'r', ataques: [{ punto: 'p', ataque: 'a', como_cubrirla: 'c', gravedad: 'grave' }] }));
});
