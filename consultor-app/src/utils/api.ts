import type { Modalidad } from '@/constants/consultor';
import { asegurarSesion, modoDemo, supabase, supabaseConfigurado } from '@/lib/supabase';
import * as demo from '@/utils/demo';
import { HorarioOcupadoError, ReglaError } from '@/utils/errores';

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

export { HorarioOcupadoError, ReglaError };

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
  if (modoDemo) return demo.obtenerOcupados(desde, hasta);
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
  if (modoDemo) return demo.obtenerMisCitas();
  comprobarConfig();
  await asegurarSesion();
  const { data: sesion } = await supabase.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return [];
  // Filtra por usuario: si el consultor usa la app, aquí solo ve las suyas.
  const { data, error } = await supabase
    .from('citas')
    .select(COLUMNAS)
    .eq('user_id', uid)
    .order('inicio');
  if (error) throw traducirError(error);
  return (data as Fila[]).map(aCita);
}

export async function crearCita(datos: NuevaCita): Promise<Cita> {
  if (modoDemo) return demo.crearCita(datos);
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
  if (modoDemo) return demo.cancelarCita(id);
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

// ---- Consultor ----------------------------------------------------------------

export type Consultor = { email: string };

/** El consultor con sesión iniciada en este teléfono, o null. */
export async function obtenerConsultor(): Promise<Consultor | null> {
  if (modoDemo) return demo.obtenerConsultor();
  if (!supabaseConfigurado) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user || user.is_anonymous) return null;
  const { data: es, error } = await supabase.rpc('es_consultor');
  if (error) throw traducirError(error);
  return es ? { email: user.email ?? '' } : null;
}

export async function entrarConsultor(email: string, clave: string): Promise<Consultor> {
  if (modoDemo) return demo.entrarConsultor(email, clave);
  comprobarConfig();
  const { error } = await supabase.auth.signInWithPassword({ email, password: clave });
  if (error) {
    if (/invalid login credentials/i.test(error.message)) {
      throw new ReglaError('Email o contraseña incorrectos.');
    }
    throw traducirError(error);
  }
  const consultor = await obtenerConsultor();
  if (!consultor) {
    await supabase.auth.signOut();
    throw new ReglaError('Esta cuenta no tiene permiso de consultor.');
  }
  return consultor;
}

export async function salirConsultor() {
  if (modoDemo) return demo.salirConsultor();
  await supabase.auth.signOut();
}

/** Todas las citas (la base de datos solo se las da al consultor). */
export async function obtenerTodasLasCitas(): Promise<Cita[]> {
  if (modoDemo) return demo.obtenerTodasLasCitas();
  comprobarConfig();
  const { data, error } = await supabase.from('citas').select(COLUMNAS).order('inicio');
  if (error) throw traducirError(error);
  return (data as Fila[]).map(aCita);
}
