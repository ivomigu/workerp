import type { Modalidad } from '@/constants/consultor';
import { asegurarSesion, supabase, supabaseConfigurado } from '@/lib/supabase';

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

export type NuevaCita = Omit<Cita, 'id' | 'estado' | 'creadaEn'>;

type Fila = {
  id: string;
  inicio: string;
  duracion_min: number;
  modalidad: Modalidad;
  tema: string;
  nombre: string;
  telefono: string;
  email: string;
  comentario: string;
  estado: 'confirmada' | 'cancelada';
  creada_en: string;
};

const COLUMNAS =
  'id, inicio, duracion_min, modalidad, tema, nombre, telefono, email, comentario, estado, creada_en';

function aCita(f: Fila): Cita {
  return {
    id: f.id,
    inicio: f.inicio,
    duracionMin: f.duracion_min,
    modalidad: f.modalidad,
    tema: f.tema,
    nombre: f.nombre,
    telefono: f.telefono,
    email: f.email,
    comentario: f.comentario,
    estado: f.estado,
    creadaEn: f.creada_en,
  };
}

export class HorarioOcupadoError extends Error {}
/** Errores que el servidor explica con un mensaje para el cliente. */
export class ReglaError extends Error {}

function comprobarConfig() {
  if (!supabaseConfigurado) {
    throw new Error('La app aún no está conectada a Supabase. Revisa el archivo .env.local.');
  }
}

function traducirError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new HorarioOcupadoError('Ese horario ya fue reservado.');
  if (error.code === 'P0001' || error.code === 'P0002') return new ReglaError(error.message);
  if (/fetch|network/i.test(error.message)) {
    return new Error('Sin conexión. Revisa tu internet e inténtalo de nuevo.');
  }
  return new Error(error.message);
}

/** Horas ya reservadas por cualquier cliente (sin datos personales). */
export async function obtenerOcupados(desde: Date, hasta: Date): Promise<number[]> {
  comprobarConfig();
  const { data, error } = await supabase.rpc('horarios_ocupados', {
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
  });
  if (error) throw traducirError(error);
  return ((data ?? []) as string[]).map((iso) => new Date(iso).getTime());
}

/** Las citas de este teléfono. */
export async function obtenerMisCitas(): Promise<Cita[]> {
  comprobarConfig();
  await asegurarSesion();
  const { data, error } = await supabase.from('citas').select(COLUMNAS).order('inicio');
  if (error) throw traducirError(error);
  return (data as Fila[]).map(aCita);
}

export async function crearCita(datos: NuevaCita): Promise<Cita> {
  comprobarConfig();
  await asegurarSesion();
  const { data, error } = await supabase
    .from('citas')
    .insert({
      inicio: datos.inicio,
      duracion_min: datos.duracionMin,
      modalidad: datos.modalidad,
      tema: datos.tema,
      nombre: datos.nombre,
      telefono: datos.telefono,
      email: datos.email,
      comentario: datos.comentario,
    })
    .select(COLUMNAS)
    .single();
  if (error) throw traducirError(error);
  return aCita(data as Fila);
}

export async function cancelarCita(id: string): Promise<void> {
  comprobarConfig();
  await asegurarSesion();
  const { data, error } = await supabase
    .from('citas')
    .update({ estado: 'cancelada' })
    .eq('id', id)
    .select('id');
  if (error) throw traducirError(error);
  if (!data?.length) throw new Error('No se pudo cancelar esta cita.');
}
