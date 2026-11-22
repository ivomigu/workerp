import '@/utils/local-storage';

import { CONSULTOR } from '@/constants/consultor';
import { diaEnZona, enZona } from '@/utils/agenda';
import type { Cita, Consultor, NuevaCita } from '@/utils/api';
import { HorarioOcupadoError, ReglaError } from '@/utils/errores';

/**
 * Modo demostración: imita a Supabase con datos de ejemplo guardados solo en
 * este teléfono. Aplica las mismas reglas que la base de datos real.
 */

export const DEMO_EMAIL = 'demo@consultor.mx';
export const DEMO_CLAVE = 'demo1234';

type CitaDemo = Cita & { propia: boolean };

const CLAVE_CITAS = 'demo:citas:v1';
const CLAVE_CONSULTOR = 'demo:consultor:v1';

/** Una pequeña pausa, para que se vea la app cargando como con internet. */
const espera = (ms = 350) => new Promise((r) => setTimeout(r, ms));

function semilla(ahora = new Date()): CitaDemo[] {
  type DiaConHoras = ReturnType<typeof diaEnZona> & { horas: string[] };
  const conHoras = (offset: number): DiaConHoras | null => {
    const dia = diaEnZona(offset, ahora);
    const horas = CONSULTOR.horario[dia.dow];
    return horas && horas.length >= 4 ? { ...dia, horas } : null;
  };

  const proximos: DiaConHoras[] = [];
  for (let off = 1; off <= 21 && proximos.length < 3; off++) {
    const d = conHoras(off);
    if (d) proximos.push(d);
  }
  let pasado: DiaConHoras | null = null;
  for (let off = -1; off >= -14 && !pasado; off--) pasado = conHoras(off);

  const en = (dia: DiaConHoras, i: number) => {
    const [hh, mm] = dia.horas[i].split(':').map(Number);
    return enZona(dia.y, dia.m, dia.d, hh, mm).toISOString();
  };
  const creada = new Date(ahora.getTime() - 3 * 86_400_000).toISOString();
  const cita = (n: number, datos: Partial<CitaDemo> & Pick<CitaDemo, 'inicio'>): CitaDemo => ({
    id: `demo-${n}`,
    duracionMin: CONSULTOR.duracionMin,
    modalidad: 'videollamada',
    tema: 'Primera consulta',
    nombre: '',
    telefono: '',
    email: '',
    comentario: '',
    estado: 'confirmada',
    creadaEn: creada,
    propia: false,
    ...datos,
  });

  const citas: CitaDemo[] = [];
  if (proximos[0]) {
    citas.push(
      cita(1, {
        inicio: en(proximos[0], 1),
        modalidad: 'presencial',
        tema: 'Jubilación',
        nombre: 'Jorge Ramírez',
        telefono: '+525598765432',
        email: 'jorge@ejemplo.com',
      }),
      cita(2, {
        inicio: en(proximos[0], 3),
        tema: 'Impuestos',
        nombre: 'Lucía Fernández',
        telefono: '+523312345678',
        comentario: 'Quiero preparar mi declaración anual.',
      }),
    );
  }
  if (proximos[1]) {
    citas.push(
      cita(3, {
        inicio: en(proximos[1], 0),
        tema: 'Deudas y créditos',
        nombre: 'Andrés Torres',
        telefono: '+528112345678',
        email: 'andres@ejemplo.com',
        estado: 'cancelada',
      }),
    );
  }
  if (proximos[2]) {
    citas.push(
      cita(4, {
        inicio: en(proximos[2], 2),
        tema: 'Inversiones',
        nombre: 'Sofía Méndez',
        telefono: '+525511223344',
        email: 'sofia@ejemplo.com',
      }),
    );
  }
  if (pasado) {
    citas.push(
      cita(5, {
        inicio: en(pasado, 1),
        modalidad: 'presencial',
        tema: 'Ahorro y presupuesto',
        nombre: 'Carlos Ruiz',
        telefono: '+525544332211',
      }),
    );
  }
  return citas;
}

function leer(): CitaDemo[] {
  try {
    const raw = localStorage.getItem(CLAVE_CITAS);
    if (raw) return JSON.parse(raw) as CitaDemo[];
  } catch {
    // Datos dañados: se vuelven a crear.
  }
  const inicial = semilla();
  guardar(inicial);
  return inicial;
}

function guardar(citas: CitaDemo[]) {
  try {
    localStorage.setItem(CLAVE_CITAS, JSON.stringify(citas));
  } catch {
    // Sin almacenamiento: la demo funciona igual mientras la app esté abierta.
  }
}

const esConsultor = () => {
  try {
    return localStorage.getItem(CLAVE_CONSULTOR) === '1';
  } catch {
    return false;
  }
};

const sinMarca = ({ propia: _, ...c }: CitaDemo): Cita => c;
const porFecha = (a: Cita, b: Cita) => a.inicio.localeCompare(b.inicio);

export async function obtenerOcupados(desde: Date, hasta: Date): Promise<number[]> {
  await espera();
  return leer()
    .filter((c) => c.estado === 'confirmada')
    .map((c) => new Date(c.inicio).getTime())
    .filter((t) => t >= desde.getTime() && t < hasta.getTime());
}

export async function obtenerMisCitas(): Promise<Cita[]> {
  await espera();
  return leer()
    .filter((c) => c.propia)
    .map(sinMarca)
    .sort(porFecha);
}

export async function crearCita(datos: NuevaCita): Promise<Cita> {
  await espera(500);
  const citas = leer();
  const inicio = new Date(datos.inicio).getTime();
  if (inicio <= Date.now()) throw new ReglaError('La cita debe ser en el futuro.');
  if (citas.some((c) => c.estado === 'confirmada' && new Date(c.inicio).getTime() === inicio)) {
    throw new HorarioOcupadoError('Ese horario ya fue reservado.');
  }
  const proximas = citas.filter(
    (c) => c.propia && c.estado === 'confirmada' && new Date(c.inicio).getTime() > Date.now(),
  );
  if (proximas.length >= 3) {
    throw new ReglaError('Ya tienes 3 citas próximas. Cancela una para reservar otra.');
  }
  const nueva: CitaDemo = {
    ...datos,
    id: `demo-${Date.now().toString(36)}`,
    estado: 'confirmada',
    creadaEn: new Date().toISOString(),
    propia: true,
  };
  guardar([...citas, nueva]);
  return sinMarca(nueva);
}

export async function cancelarCita(id: string): Promise<void> {
  await espera();
  const citas = leer();
  const cita = citas.find((c) => c.id === id);
  if (!cita || cita.estado !== 'confirmada' || (!cita.propia && !esConsultor())) {
    throw new Error('No se pudo cancelar esta cita.');
  }
  guardar(citas.map((c) => (c.id === id ? { ...c, estado: 'cancelada' } : c)));
}

export async function obtenerConsultor(): Promise<Consultor | null> {
  return esConsultor() ? { email: DEMO_EMAIL } : null;
}

export async function entrarConsultor(email: string, clave: string): Promise<Consultor> {
  await espera();
  if (email.trim().toLowerCase() !== DEMO_EMAIL || clave !== DEMO_CLAVE) {
    throw new ReglaError(
      `Email o contraseña incorrectos. En el modo demostración usa ${DEMO_EMAIL} y ${DEMO_CLAVE}.`,
    );
  }
  localStorage.setItem(CLAVE_CONSULTOR, '1');
  return { email: DEMO_EMAIL };
}

export async function salirConsultor() {
  localStorage.removeItem(CLAVE_CONSULTOR);
}

export async function obtenerTodasLasCitas(): Promise<Cita[]> {
  await espera();
  if (!esConsultor()) return [];
  return leer().map(sinMarca).sort(porFecha);
}

/** Borra lo que hiciste en la demo y vuelve a las citas de ejemplo. */
export function reiniciarDemo() {
  localStorage.removeItem(CLAVE_CITAS);
  localStorage.removeItem(CLAVE_CONSULTOR);
}
