import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { trocear, fragmentosDe, minutosEnLetra } from '../src/lib/lector.js';

const GUION = JSON.parse(readFileSync(new URL('../src/data/guion.json', import.meta.url)));

test('el guion tiene los nueve capítulos y suma 90 minutos', () => {
  assert.equal(GUION.length, 9);
  assert.equal(GUION.reduce((s, c) => s + c.min, 0), 90);
});

test('ningún fragmento excede el límite y no se pierde texto', () => {
  const largo = 'Primera oración bastante larga para la prueba. '.repeat(20);
  const t = trocear(largo);
  assert.ok(t.every((x) => x.length <= 220));
  assert.equal(t.join(' ').replace(/\s+/g, ''), largo.replace(/\s+/g, ''));
});

test('las indicaciones de escena solo se leen si se piden', () => {
  const sin = GUION.flatMap((c) => fragmentosDe(c));
  const con = GUION.flatMap((c) => fragmentosDe(c, { incluirEscena: true }));
  assert.ok(!sin.some((f) => f.tipo === 'esc'));
  assert.ok(con.some((f) => f.tipo === 'esc'));
  assert.ok(sin.every((f) => f.texto.length <= 220));
});

test('no se leen las secciones de fuentes', () => {
  const todo = GUION.flatMap((c) => fragmentosDe(c, { incluirEscena: true })).map((f) => f.texto).join(' ');
  assert.ok(!/Fuentes y notas de verificaci/.test(todo));
  assert.ok(!/https?:\/\//.test(todo));
});

test('minutos en letra', () => {
  assert.equal(minutosEnLetra(1), 'un minuto');
  assert.equal(minutosEnLetra(10), 'diez minutos');
});

test('el anexo del marco jurídico se lee sin número de capítulo y sin corchetes', async () => {
  const { readFileSync } = await import('node:fs');
  const marco = JSON.parse(readFileSync(new URL('../src/data/marco.json', import.meta.url)));
  const frags = fragmentosDe(marco);
  assert.equal(frags[0].texto, 'Anexo: marco jurídico.');
  assert.ok(frags.every((f) => f.texto.length <= 220));
  assert.ok(!frags.some((f) => f.texto.includes('[...]')));
  assert.ok(frags.some((f) => f.texto.includes('Artículo 373')));
});
