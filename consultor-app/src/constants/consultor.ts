/**
 * Datos del consultor y su horario de atención.
 * Edita este archivo para cambiar nombre, horas o duración de las sesiones.
 */
export const CONSULTOR = {
  nombre: 'Tu Consultor Financiero',
  especialidad: 'Inversiones, ahorro y planificación',
  duracionMin: 60,
  /** Cuántos días hacia adelante pueden ver los clientes. */
  diasVisibles: 14,
  /** Horas mínimas de anticipación para reservar. */
  anticipacionMinHoras: 2,
  /**
   * Prefijo que se añade a los teléfonos escritos sin código de país cuando el
   * teléfono del cliente no indica en qué país está. Cámbialo por el tuyo.
   */
  codigoPais: '+52',
  /**
   * Zona horaria en la que atiendes. Los horarios de abajo están en esta zona,
   * y la app muestra todas las horas en ella, esté donde esté el cliente.
   */
  zonaHoraria: 'America/Mexico_City',
  /** Cómo se le explica al cliente en qué hora están los horarios. */
  nombreZona: 'hora del centro de México',
  /** Idioma y país para escribir fechas y horas. */
  idioma: 'es-MX',
  /**
   * Horas de inicio de cada sesión por día de la semana
   * (0 = domingo, 1 = lunes … 6 = sábado). Un día sin entrada no se atiende.
   */
  horario: {
    1: ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
    2: ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
    3: ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
    4: ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
    5: ['09:00', '10:00', '11:00', '12:00'],
    6: ['10:00', '11:00'],
  } as Record<number, string[]>,
} as const;

export const MODALIDADES = [
  { value: 'videollamada', label: 'Videollamada' },
  { value: 'presencial', label: 'Presencial' },
] as const;

export const TEMAS = [
  'Primera consulta',
  'Inversiones',
  'Ahorro y presupuesto',
  'Jubilación',
  'Impuestos',
  'Deudas y créditos',
  'Seguros',
] as const;

export type Modalidad = (typeof MODALIDADES)[number]['value'];
