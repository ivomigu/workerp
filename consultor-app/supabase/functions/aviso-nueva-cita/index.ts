// Edge Function de Supabase. La llama la base de datos (triggers) justo después
// de cada cambio y envía:
//   • a ti, un aviso cuando alguien agenda o cancela;
//   • al cliente, la confirmación de su cita (con un archivo para su calendario)
//     y otro email si la cancela él o la cancelas tú.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY    clave de https://resend.com
//   AVISO_EMAIL       tu email (recibe los avisos y las respuestas de los clientes)
//   AVISO_SECRETO     la misma clave secreta que pusiste en el SQL del aviso
//   AVISO_REMITENTE   p. ej. "Tu Consultor <citas@tudominio.com>". Necesario para escribir
//                     a los clientes: el dominio tiene que estar verificado en Resend.
//                     Sin él solo se te envían avisos a ti (desde onboarding@resend.dev).
//   CONSULTOR_NOMBRE  opcional; tu nombre tal como lo verá el cliente
//   ZONA_HORARIA      opcional; por defecto America/Mexico_City (hora del centro de México)

type Cita = {
  id: string;
  inicio: string;
  duracion_min: number;
  modalidad: string;
  tema: string;
  nombre: string;
  telefono: string;
  email: string;
  comentario: string;
  estado: string;
};

type Entorno = (nombre: string) => string | undefined;

export type TipoAviso = 'nueva' | 'cancelada';
export type CanceladaPor = 'cliente' | 'consultor';

type Email = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  text: string;
  html: string;
  attachments?: { filename: string; content: string; content_type?: string }[];
};

const REMITENTE_PRUEBA = 'Agenda <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapar = (t: string) =>
  t.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

function fechas(cita: Cita, zona: string) {
  const inicio = new Date(cita.inicio);
  const fin = new Date(inicio.getTime() + cita.duracion_min * 60_000);
  const fecha = inicio.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: zona,
  });
  const hora = (d: Date) =>
    d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zona });
  const nombreZona = zona === 'America/Mexico_City' ? 'hora del centro de México' : zona;
  return { inicio, fin, fecha, hora, rango: `${hora(inicio)} – ${hora(fin)}`, nombreZona };
}

const modalidadDe = (c: Cita) => (c.modalidad === 'presencial' ? 'Presencial' : 'Videollamada');

function tabla(filas: [string, string][]) {
  return `<table style="border-collapse:collapse;width:100%">${filas
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#666;vertical-align:top">${escapar(k)}</td>` +
        `<td style="padding:8px 0;white-space:pre-wrap">${escapar(v)}</td></tr>`,
    )
    .join('')}</table>`;
}

const envoltorio = (contenido: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px">${contenido}</div>`;

/** Aviso para el consultor (reserva nueva o cancelación). */
export function armarEmail(cita: Cita, zona: string, tipo: TipoAviso = 'nueva') {
  const { fecha, hora, inicio, rango } = fechas(cita, zona);
  const filas: [string, string][] = [
    ['Fecha', fecha],
    ['Hora', rango],
    ['Modalidad', modalidadDe(cita)],
    ['Tema', cita.tema],
    ['Nombre', cita.nombre],
    ['Teléfono', cita.telefono],
    ...(cita.email ? ([['Email', cita.email]] as [string, string][]) : []),
    ...(cita.comentario ? ([['Comentario', cita.comentario]] as [string, string][]) : []),
  ];

  const cancelada = tipo === 'cancelada';
  const asunto = `${cancelada ? 'Cita cancelada' : 'Nueva cita'}: ${fecha}, ${hora(inicio)} – ${cita.nombre}`;
  const titulo = cancelada ? 'Se canceló una cita' : 'Tienes una cita nueva';
  const nota = cancelada ? 'El horario vuelve a estar libre para otros clientes.' : '';
  const texto = [titulo + '.', ...(nota ? [nota] : []), '', ...filas.map(([k, v]) => `${k}: ${v}`)].join(
    '\n',
  );
  const html = envoltorio(`
<h2 style="margin:0 0 8px;color:${cancelada ? '#c62828' : 'inherit'}">${titulo}</h2>
${nota ? `<p style="margin:0 0 16px;color:#666">${nota}</p>` : '<div style="height:8px"></div>'}
${tabla(filas)}
${
  cita.telefono
    ? `<p style="margin-top:20px"><a href="tel:${escapar(cita.telefono.replace(/[^\d+]/g, ''))}">Llamar a ${escapar(cita.nombre)}</a></p>`
    : ''
}`);

  return { asunto, texto, html };
}

/** Confirmación para el cliente. */
export function armarEmailCliente(cita: Cita, zona: string, consultor: string) {
  const { fecha, hora, inicio, rango, nombreZona } = fechas(cita, zona);
  const nombre = cita.nombre.trim().split(/\s+/)[0] || cita.nombre;
  const filas: [string, string][] = [
    ['Fecha', fecha],
    ['Hora', `${rango} (${nombreZona})`],
    ['Modalidad', modalidadDe(cita)],
    ['Tema', cita.tema],
  ];
  const nota =
    cita.modalidad === 'presencial'
      ? 'Te enviaremos la dirección de la oficina antes de la cita.'
      : 'Te enviaremos el enlace de la videollamada antes de la cita.';
  const pie =
    'Si necesitas cancelarla, hazlo desde la app, en «Mis citas». ' +
    'Para cualquier duda, responde a este email.';

  const asunto = `Cita confirmada: ${fecha} a las ${hora(inicio)}`;
  const texto = [
    `Hola ${nombre}:`,
    '',
    `Tu cita con ${consultor} está confirmada.`,
    '',
    ...filas.map(([k, v]) => `${k}: ${v}`),
    '',
    nota,
    'Te adjuntamos la cita para que la añadas a tu calendario.',
    '',
    pie,
  ].join('\n');
  const html = envoltorio(`
<h2 style="margin:0 0 8px">Tu cita está confirmada</h2>
<p style="margin:0 0 16px">Hola ${escapar(nombre)}, tu cita con ${escapar(consultor)} está confirmada.</p>
${tabla(filas)}
<p style="margin:20px 0 4px">${escapar(nota)}</p>
<p style="margin:0 0 16px;color:#666">Te adjuntamos la cita para que la añadas a tu calendario.</p>
<p style="margin:0;color:#666">${escapar(pie)}</p>`);

  return { asunto, texto, html };
}

/** Email para el cliente cuando se cancela su cita (la cancele él o el consultor). */
export function armarEmailCancelacionCliente(
  cita: Cita,
  zona: string,
  consultor: string,
  por: CanceladaPor = 'cliente',
) {
  const { fecha, hora, inicio, rango, nombreZona } = fechas(cita, zona);
  const nombre = cita.nombre.trim().split(/\s+/)[0] || cita.nombre;
  const filas: [string, string][] = [
    ['Fecha', fecha],
    ['Hora', `${rango} (${nombreZona})`],
    ['Modalidad', modalidadDe(cita)],
    ['Tema', cita.tema],
  ];
  const calendario = 'Si la habías añadido a tu calendario, puedes borrarla.';
  const delConsultor = por === 'consultor';
  const pie = delConsultor
    ? 'Sentimos las molestias. Puedes agendar otro horario desde la app cuando quieras. ' +
      'Si tienes alguna duda, responde a este email.'
    : 'Cuando quieras, puedes agendar otra cita desde la app. ' +
      'Si cancelaste por error o tienes alguna duda, responde a este email.';
  const aviso = delConsultor
    ? `${consultor} tuvo que cancelar tu cita.`
    : `Tu cita con ${consultor} quedó cancelada.`;

  const asunto = `${delConsultor ? 'Tu cita fue cancelada' : 'Cita cancelada'}: ${fecha} a las ${hora(inicio)}`;
  const texto = [
    `Hola ${nombre}:`,
    '',
    aviso,
    '',
    ...filas.map(([k, v]) => `${k}: ${v}`),
    '',
    calendario,
    '',
    pie,
  ].join('\n');
  const html = envoltorio(`
<h2 style="margin:0 0 8px;color:#c62828">${delConsultor ? 'Tu cita fue cancelada' : 'Tu cita quedó cancelada'}</h2>
<p style="margin:0 0 16px">Hola ${escapar(nombre)}, ${escapar(
    delConsultor ? `${consultor} tuvo que cancelar tu cita.` : `cancelaste tu cita con ${consultor}.`,
  )}</p>
${tabla(filas)}
<p style="margin:20px 0 4px;color:#666">${escapar(calendario)}</p>
<p style="margin:0;color:#666">${escapar(pie)}</p>`);

  return { asunto, texto, html };
}

/** Archivo .ics para añadir la cita al calendario del cliente. */
export function crearIcs(cita: Cita, consultor: string, ahora = new Date()) {
  const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const txt = (t: string) =>
    t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const inicio = new Date(cita.inicio);
  const fin = new Date(inicio.getTime() + cita.duracion_min * 60_000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agenda Consultor//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${cita.id}@agenda-consultor`,
    `DTSTAMP:${utc(ahora)}`,
    `DTSTART:${utc(inicio)}`,
    `DTEND:${utc(fin)}`,
    `SUMMARY:${txt(`Cita con ${consultor}`)}`,
    `DESCRIPTION:${txt(`${cita.tema} · ${modalidadDe(cita)}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${txt(`Cita con ${consultor} en 1 hora`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

function base64(texto: string) {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function enviarEmail(enviar: typeof fetch, apiKey: string, email: Email) {
  const r = await enviar('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
  });
  if (!r.ok) console.error('Resend respondió', r.status, await r.text());
  return r.ok;
}

export async function manejar(req: Request, env: Entorno, enviar = fetch): Promise<Response> {
  const secreto = env('AVISO_SECRETO');
  if (!secreto || req.headers.get('x-aviso-secreto') !== secreto) {
    return new Response('No autorizado', { status: 401 });
  }

  let cuerpo: {
    type?: string;
    record?: Cita;
    old_record?: Pick<Cita, 'estado'>;
    cancelada_por?: CanceladaPor | null;
  };
  try {
    cuerpo = await req.json();
  } catch {
    return new Response('JSON no válido', { status: 400 });
  }
  const cita = cuerpo.record;
  let tipo: TipoAviso;
  if (cuerpo.type === 'INSERT' && cita?.estado === 'confirmada') {
    tipo = 'nueva';
  } else if (
    cuerpo.type === 'UPDATE' &&
    cita?.estado === 'cancelada' &&
    cuerpo.old_record?.estado === 'confirmada'
  ) {
    tipo = 'cancelada';
  } else {
    return new Response('Ignorado', { status: 200 });
  }

  const apiKey = env('RESEND_API_KEY');
  const destino = env('AVISO_EMAIL');
  if (!apiKey || !destino) {
    console.error('Faltan los secrets RESEND_API_KEY o AVISO_EMAIL');
    return new Response('Falta configuración', { status: 500 });
  }

  const zona = env('ZONA_HORARIA') || 'America/Mexico_City';
  const remitente = env('AVISO_REMITENTE') || REMITENTE_PRUEBA;
  const consultor = env('CONSULTOR_NOMBRE') || 'Tu Consultor Financiero';

  // Si la cancelaste tú, no hace falta avisarte; solo se escribe al cliente.
  const por: CanceladaPor = cuerpo.cancelada_por === 'consultor' ? 'consultor' : 'cliente';
  const avisarte = !(tipo === 'cancelada' && por === 'consultor');

  // 1. Aviso para ti.
  let avisoOk = true;
  if (avisarte) {
    const aviso = armarEmail(cita, zona, tipo);
    avisoOk = await enviarEmail(enviar, apiKey, {
      from: remitente,
      to: [destino],
      ...(cita.email ? { reply_to: cita.email } : {}),
      subject: aviso.asunto,
      text: aviso.texto,
      html: aviso.html,
    });
  }

  // 2. Email para el cliente: confirmación al reservar, aviso al cancelar.
  let cliente = 'sin email del cliente';
  if (cita.email && EMAIL_RE.test(cita.email)) {
    if (remitente.includes('resend.dev')) {
      cliente = 'omitido: falta AVISO_REMITENTE con un dominio verificado';
      console.warn(
        'No se envió el email al cliente: configura AVISO_REMITENTE con un dominio verificado en Resend.',
      );
    } else if (tipo === 'nueva') {
      const c = armarEmailCliente(cita, zona, consultor);
      const ok = await enviarEmail(enviar, apiKey, {
        from: remitente,
        to: [cita.email],
        reply_to: destino,
        subject: c.asunto,
        text: c.texto,
        html: c.html,
        attachments: [
          { filename: 'cita.ics', content: base64(crearIcs(cita, consultor)), content_type: 'text/calendar' },
        ],
      });
      cliente = ok ? 'confirmación enviada' : 'error al enviar la confirmación';
    } else {
      const c = armarEmailCancelacionCliente(cita, zona, consultor, por);
      const ok = await enviarEmail(enviar, apiKey, {
        from: remitente,
        to: [cita.email],
        reply_to: destino,
        subject: c.asunto,
        text: c.texto,
        html: c.html,
      });
      cliente = ok ? 'cancelación enviada' : 'error al enviar la cancelación';
    }
  }

  if (!avisoOk) return new Response(`No se pudo enviar tu aviso; cliente: ${cliente}`, { status: 502 });
  const tuyo = avisarte ? 'Aviso enviado' : 'Cancelada por el consultor (sin aviso para ti)';
  return new Response(`${tuyo}; cliente: ${cliente}`, { status: 200 });
}

// En Supabase (Deno) arranca el servidor; en las pruebas locales se importa `manejar`.
declare const Deno:
  | { serve: (h: (r: Request) => Promise<Response>) => void; env: { get: Entorno } }
  | undefined;
if (typeof Deno !== 'undefined') {
  Deno.serve((req) => manejar(req, (n) => Deno!.env.get(n)));
}
