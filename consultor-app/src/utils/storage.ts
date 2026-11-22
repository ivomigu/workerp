import '@/utils/local-storage';

/** Datos de contacto que el cliente usó la última vez (solo en su teléfono). */
export type Cliente = { nombre: string; telefono: string; email: string };

const CLIENTE_KEY = 'cliente:v1';
const VACIO: Cliente = { nombre: '', telefono: '', email: '' };

export function leerCliente(): Cliente {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(CLIENTE_KEY);
    return raw ? { ...VACIO, ...(JSON.parse(raw) as Cliente) } : VACIO;
  } catch {
    return VACIO;
  }
}

export function guardarCliente(cliente: Cliente) {
  try {
    localStorage.setItem(CLIENTE_KEY, JSON.stringify(cliente));
  } catch {
    // Si no se puede guardar, solo se pierde el autocompletado.
  }
}
