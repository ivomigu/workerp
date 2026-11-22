import { CONSULTOR } from '@/constants/consultor';

export type Dia = {
  fecha: Date;
  /** Horarios libres de ese día, en orden. */
  libres: Date[];
};

function inicioDelDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calcula los próximos días de atención y los horarios libres de cada uno. */
export function calcularAgenda(horasOcupadas: number[], ahora = new Date()): Dia[] {
  const ocupados = new Set(horasOcupadas);
  const limite = ahora.getTime() + CONSULTOR.anticipacionMinHoras * 3600_000;
  const hoy = inicioDelDia(ahora);
  const dias: Dia[] = [];

  for (let i = 0; i < CONSULTOR.diasVisibles; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    const horas = CONSULTOR.horario[fecha.getDay()];
    if (!horas) continue;

    const libres = horas
      .map((h) => {
        const [hh, mm] = h.split(':').map(Number);
        return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), hh, mm);
      })
      .filter((d) => d.getTime() >= limite && !ocupados.has(d.getTime()));

    dias.push({ fecha, libres });
  }
  return dias;
}

export function esMismoDia(a: Date, b: Date) {
  return inicioDelDia(a).getTime() === inicioDelDia(b).getTime();
}

const LOCALE = 'es-ES';

export const formato = {
  hora: (d: Date) => d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }),
  rangoHora: (d: Date, minutos: number) =>
    `${formato.hora(d)} – ${formato.hora(new Date(d.getTime() + minutos * 60_000))}`,
  diaCorto: (d: Date) => d.toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', ''),
  mesCorto: (d: Date) => d.toLocaleDateString(LOCALE, { month: 'short' }).replace('.', ''),
  fechaLarga: (d: Date) => {
    const t = d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
};
