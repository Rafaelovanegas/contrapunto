import { test } from 'node:test';
import assert from 'node:assert/strict';
import { citaEsLiteral, verificarAlerta, validarSemaforo, validarContradiccion, extraerJSON } from '../src/lib/validate.js';
import { DEMO_CONTRA, DEMO_SEMAFORO, DOCUMENTOS_INICIALES, PARTE_INFORMATIVO } from '../src/data/caso.js';

test('cada alerta del guion de demostración cita literalmente el parte informativo', () => {
  for (const d of DEMO_CONTRA) {
    if (!d.alerta.hay_contradiccion) continue;
    assert.ok(citaEsLiteral(d.alerta.cita_informe, PARTE_INFORMATIVO), `Cita no literal: ${d.alerta.cita_informe}`);
    assert.equal(validarContradiccion(d.alerta), null);
  }
});

test('el verificador descarta una cita inventada', () => {
  const alerta = { hay_contradiccion: true, tipo: 'contradiccion', tema: 'x', dicho_hoy: 'y', cita_informe: 'el detenido traía una mochila roja con dos armas', explicacion: 'z', secuencia_376: { comprometer: 'a', acreditar: 'b', confrontar: 'c' } };
  const r = verificarAlerta(alerta, DOCUMENTOS_INICIALES);
  assert.equal(r.alerta, null);
  assert.equal(r.descartada, true);
});

test('el verificador acepta una cita literal aunque cambien mayúsculas y espacios', () => {
  const alerta = { hay_contradiccion: true, tipo: 'contradiccion', tema: 'x', dicho_hoy: 'y', cita_informe: 'FAJADA a la cintura,   del lado derecho', explicacion: 'z', secuencia_376: { comprometer: 'a', acreditar: 'b', confrontar: 'c' } };
  const r = verificarAlerta(alerta, DOCUMENTOS_INICIALES);
  assert.ok(r.alerta);
  assert.equal(r.alerta.documento, 'Parte informativo policial (ficticio)');
});

test('el semáforo rechaza veredictos fuera de catálogo', () => {
  assert.notEqual(validarSemaforo({ veredicto: 'quizá', motivo: 'ninguno', explicacion: 'x' }), null);
  assert.notEqual(validarSemaforo({ veredicto: 'objetable', motivo: 'ninguno', explicacion: 'x' }), null);
  for (const d of DEMO_SEMAFORO) assert.equal(validarSemaforo(d.resultado), null);
});

test('extraerJSON tolera cercas de código y texto alrededor', () => {
  assert.deepEqual(extraerJSON('Aquí va:\n```json\n{"a":1}\n```'), { a: 1 });
  assert.equal(extraerJSON('sin json'), null);
});
