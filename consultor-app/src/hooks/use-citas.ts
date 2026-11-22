import { useSyncExternalStore } from 'react';

import { leerCitas, leerCliente, suscribir } from '@/utils/storage';

/** Todas las citas guardadas; la pantalla se actualiza sola cuando cambian. */
export function useCitas() {
  return useSyncExternalStore(suscribir, leerCitas, leerCitas);
}

/** Los últimos datos de contacto usados, para rellenar el formulario. */
export function useCliente() {
  return useSyncExternalStore(suscribir, leerCliente, leerCliente);
}
