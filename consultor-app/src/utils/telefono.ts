/**
 * Convierte lo que escribe el cliente en un número internacional (+34600123456),
 * que sirve para llamar y para WhatsApp desde cualquier país.
 */
export function normalizarTelefono(texto: string, codigoPais: string): string {
  const limpio = texto.trim();
  const digitos = limpio.replace(/\D/g, '');
  if (!digitos) return '';

  // Ya viene en formato internacional: +34… o 0034…
  if (limpio.startsWith('+')) return `+${digitos}`;
  if (digitos.startsWith('00')) return `+${digitos.slice(2)}`;

  const cc = codigoPais.replace(/\D/g, '');

  // Escribió el código sin «+» (34600123456). Solo lo asumimos si el número es
  // demasiado largo para ser nacional; Brasil tiene números nacionales de 11 cifras.
  const minimoConCodigo = cc === '55' ? 12 : 11;
  if (
    digitos.startsWith(cc) &&
    digitos.length >= minimoConCodigo &&
    digitos.length - cc.length >= 9
  ) {
    return `+${digitos}`;
  }

  // Quita el 0 inicial de los números nacionales (07700… en Reino Unido),
  // salvo en Italia, donde forma parte del número.
  const nacional = cc === '39' ? digitos : digitos.replace(/^0+/, '');
  return `+${cc}${nacional}`;
}

/** Un número internacional válido tiene entre 8 y 15 cifras (norma E.164). */
export function telefonoValido(internacional: string): boolean {
  const n = internacional.replace(/\D/g, '').length;
  return internacional.startsWith('+') && n >= 8 && n <= 15;
}

/** Para enlaces wa.me: solo cifras, sin «+». */
export function enlaceWhatsApp(internacional: string): string {
  return `https://wa.me/${internacional.replace(/\D/g, '')}`;
}
