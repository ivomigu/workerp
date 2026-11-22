import { openBrowserAsync } from 'expo-web-browser';

import { CONSULTOR } from '@/constants/consultor';

/** Abre el aviso de privacidad en el navegador integrado del sistema. */
export function abrirAvisoDePrivacidad() {
  if (CONSULTOR.urlPrivacidad) openBrowserAsync(CONSULTOR.urlPrivacidad);
}

export const hayAvisoDePrivacidad = Boolean(CONSULTOR.urlPrivacidad);
