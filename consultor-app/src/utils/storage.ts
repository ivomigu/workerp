import '@/utils/local-storage';

import type { Modalidad } from '@/constants/consultor';

export type Cita = {
  id: string;
  /** Fecha y hora de inicio en formato ISO. */
  inicio: string;
  duracionMin: number;
  modalidad: Modalidad;
  tema: string;
  nombre: string;
  telefono: string;
  email: string;
  comentario: string;
  estado: 'confirmada' | 'cancelada';
  creadaEn: string;
};

export type Cliente = Pick<Cita, 'nombre' | 'telefono' | 'email'>;

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Lee un valor JSON y lo guarda en caché por su texto crudo, para que
 * `useSyncExternalStore` reciba el mismo objeto mientras no cambie.
 */
function crearLector<T>(key: string, inicial: T) {
  let raw: string | null | undefined;
  let valor = inicial;
  return () => {
    // En el render del servidor (solo web) no existe `localStorage`.
    const actual = typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    if (actual !== raw) {
      raw = actual;
      try {
        valor = actual ? (JSON.parse(actual) as T) : inicial;
      } catch {
        valor = inicial;
      }
    }
    return valor;
  };
}

const CITAS_KEY = 'citas:v1';
const CLIENTE_KEY = 'cliente:v1';

export const leerCitas = crearLector<Cita[]>(CITAS_KEY, []);
export const leerCliente = crearLector<Cliente>(CLIENTE_KEY, {
  nombre: '',
  telefono: '',
  email: '',
});

function escribir(key: string, valor: unknown) {
  localStorage.setItem(key, JSON.stringify(valor));
  listeners.forEach((fn) => fn());
}

export function suscribir(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export class HorarioOcupadoError extends Error {}

export function crearCita(datos: Omit<Cita, 'id' | 'estado' | 'creadaEn'>): Cita {
  const citas = leerCitas();
  const inicio = new Date(datos.inicio).getTime();
  const ocupado = citas.some(
    (c) => c.estado === 'confirmada' && new Date(c.inicio).getTime() === inicio
  );
  if (ocupado) throw new HorarioOcupadoError('Ese horario ya fue reservado.');

  const cita: Cita = {
    ...datos,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    estado: 'confirmada',
    creadaEn: new Date().toISOString(),
  };
  escribir(CITAS_KEY, [...citas, cita]);
  escribir(CLIENTE_KEY, { nombre: datos.nombre, telefono: datos.telefono, email: datos.email });
  return cita;
}

export function cancelarCita(id: string) {
  escribir(
    CITAS_KEY,
    leerCitas().map((c) => (c.id === id ? { ...c, estado: 'cancelada' as const } : c))
  );
}
