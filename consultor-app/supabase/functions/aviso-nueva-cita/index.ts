// Edge Function de Supabase: te envía un email cada vez que alguien agenda.
// La llama la base de datos (trigger) justo después de guardar una cita nueva.
//
// Secrets que necesita (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY   clave de https://resend.com
//   AVISO_EMAIL      tu email (el mismo con el que creaste la cuenta de Resend)
//   AVISO_SECRETO    la misma clave secreta que pusiste en el SQL del aviso
//   ZONA_HORARIA     opcional, por ejemplo Europe/Madrid (por defecto)
//   AVISO_REMITENTE  opcional; por defecto "Agenda <onboarding@resend.dev>"

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

const escapar = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function armarEmail(cita: Cita, zona: string) {
  const inicio = new Date(cita.inicio);
  const fin = new Date(inicio.getTime() + cita.duracion_min * 60_000);
  const fecha = inicio.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: zona,
  });
  const hora = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: zona });
  const rango = `${hora(inicio)} – ${hora(fin)}`;
  const modalidad = cita.modalidad === 'presencial' ? 'Presencial' : 'Videollamada';

  const filas: [string, string][] = [
    ['Fecha', fecha],
    ['Hora', rango],
    ['Modalidad', modalidad],
    ['Tema', cita.tema],
    ['Nombre', cita.nombre],
    ['Teléfono', cita.telefono],
    ...(cita.email ? ([['Email', cita.email]] as [string, string][]) : []),
    ...(cita.comentario ? ([['Comentario', cita.comentario]] as [string, string][]) : []),
  ];

  const asunto = `Nueva cita: ${fecha}, ${hora(inicio)} – ${cita.nombre}`;
  const texto = ['Tienes una cita nueva.', '', ...filas.map(([k, v]) => `${k}: ${v}`)].join('\n');
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px">
<h2 style="margin:0 0 16px">Tienes una cita nueva</h2>
<table style="border-collapse:collapse;width:100%">${filas
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#666;vertical-align:top">${escapar(k)}</td>` +
        `<td style="padding:8px 0;white-space:pre-wrap">${escapar(v)}</td></tr>`
    )
    .join('')}</table>
${
  cita.telefono
    ? `<p style="margin-top:20px"><a href="tel:${escapar(cita.telefono.replace(/[^\d+]/g, ''))}">Llamar a ${escapar(cita.nombre)}</a></p>`
    : ''
}
</div>`;

  return { asunto, texto, html };
}

export async function manejar(req: Request, env: Entorno, enviar = fetch): Promise<Response> {
  const secreto = env('AVISO_SECRETO');
  if (!secreto || req.headers.get('x-aviso-secreto') !== secreto) {
    return new Response('No autorizado', { status: 401 });
  }

  let cuerpo: { type?: string; record?: Cita };
  try {
    cuerpo = await req.json();
  } catch {
    return new Response('JSON no válido', { status: 400 });
  }
  const cita = cuerpo.record;
  if (cuerpo.type !== 'INSERT' || !cita || cita.estado !== 'confirmada') {
    return new Response('Ignorado', { status: 200 });
  }

  const apiKey = env('RESEND_API_KEY');
  const destino = env('AVISO_EMAIL');
  if (!apiKey || !destino) {
    console.error('Faltan los secrets RESEND_API_KEY o AVISO_EMAIL');
    return new Response('Falta configuración', { status: 500 });
  }

  const { asunto, texto, html } = armarEmail(cita, env('ZONA_HORARIA') || 'Europe/Madrid');
  const respuesta = await enviar('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env('AVISO_REMITENTE') || 'Agenda <onboarding@resend.dev>',
      to: [destino],
      ...(cita.email ? { reply_to: cita.email } : {}),
      subject: asunto,
      text: texto,
      html,
    }),
  });

  if (!respuesta.ok) {
    console.error('Resend respondió', respuesta.status, await respuesta.text());
    return new Response('No se pudo enviar el email', { status: 502 });
  }
  return new Response('Email enviado', { status: 200 });
}

// En Supabase (Deno) arranca el servidor; en las pruebas locales se importa `manejar`.
declare const Deno: { serve: (h: (r: Request) => Promise<Response>) => void; env: { get: Entorno } } | undefined;
if (typeof Deno !== 'undefined') {
  Deno.serve((req) => manejar(req, (n) => Deno!.env.get(n)));
}
