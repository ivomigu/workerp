import { CONSULTOR } from '@/constants/consultor';

export type Dia = {
  /** Mediodía de ese día en la zona del consultor (sirve para mostrar el día). */
  fecha: Date;
  /** Horarios libres de ese día, en orden. */
  libres: Date[];
};

const ZONA = CONSULTOR.zonaHoraria;
const IDIOMA = CONSULTOR.idioma;

// Lee año, mes, día, hora y minuto de un instante tal como se ven en la zona del consultor.
const lector = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
});

function partesEnZona(instante: number) {
  const p: Record<string, number> = {};
  for (const { type, value } of lector.formatToParts(new Date(instante))) {
    if (type !== 'literal') p[type] = Number(value);
  }
  return { y: p.year, m: p.month, d: p.day, h: p.hour === 24 ? 0 : p.hour, min: p.minute };
}

/** Diferencia entre la zona del consultor y UTC en ese momento (en ms). */
function desfase(instante: number) {
  const p = partesEnZona(instante);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - Math.floor(instante / 60_000) * 60_000;
}

/** El instante en que en la zona del consultor es esa fecha y hora (mes de 1 a 12). */
export function enZona(y: number, m: number, d: number, h: number, min: number): Date {
  const comoUtc = Date.UTC(y, m - 1, d, h, min);
  let t = comoUtc - desfase(comoUtc);
  t = comoUtc - desfase(t); // segunda pasada por si cambia el horario de verano
  return new Date(t);
}

/** «2026-11-23»: el día de ese instante en la zona del consultor. */
export function claveDia(d: Date) {
  const p = partesEnZona(d.getTime());
  return `${p.y}-${p.m}-${p.d}`;
}

export function esMismoDia(a: Date, b: Date) {
  return claveDia(a) === claveDia(b);
}

/** Suma días de calendario en la zona del consultor (devuelve el mediodía). */
export function sumarDias(d: Date, dias: number): Date {
  const p = partesEnZona(d.getTime());
  const u = new Date(Date.UTC(p.y, p.m - 1, p.d + dias));
  return enZona(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(), 12, 0);
}

/** Año, mes (1–12), día y día de la semana (0 = domingo) de hoy + `offset` días, en la zona del consultor. */
export function diaEnZona(offset: number, ahora = new Date()) {
  const hoy = partesEnZona(ahora.getTime());
  const u = new Date(Date.UTC(hoy.y, hoy.m - 1, hoy.d + offset));
  return { y: u.getUTCFullYear(), m: u.getUTCMonth() + 1, d: u.getUTCDate(), dow: u.getUTCDay() };
}

/** Calcula los próximos días de atención y los horarios libres de cada uno. */
export function calcularAgenda(horasOcupadas: number[], ahora = new Date()): Dia[] {
  const ocupados = new Set(horasOcupadas);
  const limite = ahora.getTime() + CONSULTOR.anticipacionMinHoras * 3600_000;
  const hoy = partesEnZona(ahora.getTime());
  const dias: Dia[] = [];

  for (let i = 0; i < CONSULTOR.diasVisibles; i++) {
    const u = new Date(Date.UTC(hoy.y, hoy.m - 1, hoy.d + i));
    const [y, m, d] = [u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate()];
    const horas = CONSULTOR.horario[u.getUTCDay()];
    if (!horas) continue;

    const libres = horas
      .map((h) => {
        const [hh, mm] = h.split(':').map(Number);
        return enZona(y, m, d, hh, mm);
      })
      .filter((t) => t.getTime() >= limite && !ocupados.has(t.getTime()));

    dias.push({ fecha: enZona(y, m, d, 12, 0), libres });
  }
  return dias;
}

const opciones = (o: Intl.DateTimeFormatOptions) => ({ ...o, timeZone: ZONA });

/** Todas las fechas y horas se muestran en la zona del consultor. */
export const formato = {
  hora: (d: Date) =>
    d.toLocaleTimeString(IDIOMA, opciones({ hour: '2-digit', minute: '2-digit', hour12: false })),
  rangoHora: (d: Date, minutos: number) =>
    `${formato.hora(d)} – ${formato.hora(new Date(d.getTime() + minutos * 60_000))}`,
  diaCorto: (d: Date) =>
    d.toLocaleDateString(IDIOMA, opciones({ weekday: 'short' })).replace('.', ''),
  numeroDia: (d: Date) => d.toLocaleDateString(IDIOMA, opciones({ day: 'numeric' })),
  mesCorto: (d: Date) =>
    d.toLocaleDateString(IDIOMA, opciones({ month: 'short' })).replace('.', ''),
  fechaLarga: (d: Date) => {
    const t = d.toLocaleDateString(
      IDIOMA,
      opciones({ weekday: 'long', day: 'numeric', month: 'long' }),
    );
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
};
