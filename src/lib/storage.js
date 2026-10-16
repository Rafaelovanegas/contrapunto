// Almacenamiento local por dispositivo. Todo envuelto en try/catch: puede fallar en ventanas privadas.
const PREFIJO = 'contrapunto:';

export function leer(clave, porDefecto) {
  try {
    const v = window.localStorage.getItem(PREFIJO + clave);
    return v === null ? porDefecto : JSON.parse(v);
  } catch {
    return porDefecto;
  }
}

export function guardar(clave, valor) {
  try {
    window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function borrar(clave) {
  try {
    window.localStorage.removeItem(PREFIJO + clave);
  } catch {
    /* sin almacenamiento disponible */
  }
}
