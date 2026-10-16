import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regla de identidad: ningún tema entra sin contraste ≥ 4.5:1 medido.
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function tema(nombre) {
  const bloque = css.match(new RegExp(`data-tema='${nombre}'\\][^{]*\\{([^}]*)\\}`))[1];
  const vars = {};
  for (const m of bloque.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) vars[m[1]] = m[2];
  return vars;
}

const PARES = [
  ['texto', 'fondo'], ['texto', 'panel'], ['texto', 'panel2'], ['texto2', 'panel'], ['texto2', 'panel2'],
  ['tenue', 'fondo'], ['tenue', 'panel'], ['oro', 'fondo'], ['oro', 'panel'], ['oro-claro', 'panel'], ['oro-claro', 'panel2'],
  ['ok', 'panel2'], ['mal', 'panel2'], ['mal', 'alerta-fondo'], ['texto', 'alerta-fondo'], ['oro-claro', 'alerta-fondo'], ['sobre-oro', 'oro'],
];

for (const nombre of ['codelexia', 'borgona', 'pergamino']) {
  test(`contraste del tema ${nombre}`, () => {
    const v = tema(nombre);
    for (const [a, b] of PARES) {
      const r = ratio(v[a], v[b]);
      assert.ok(r >= 4.5, `${nombre}: ${a} sobre ${b} = ${r.toFixed(2)}`);
    }
    // botón primario: texto claro sobre borgoña
    assert.ok(ratio('#fffaf2', v.borgona) >= 4.5, `${nombre}: botón primario`);
  });
}
